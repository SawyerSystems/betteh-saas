# New SaaS Database Bootstrap

Concise starting point to stand up the multi-tenant Betteh schema on an empty Postgres (Supabase compatible) database.

---
## 0. Assumptions
- Fresh empty database (no legacy data). 
- We want the *target* multi-tenant shape immediately (no interim single-tenant tables).
- Drizzle ORM will manage migrations (`drizzle-kit` already configured via `drizzle.config.ts`).
- Auth provider: Supabase Auth (JWT includes `sub` (user id), and we will later add custom claims like current tenant). For now we store users in our own `users` table keyed by UUID generated in-app (can later sync with Supabase auth user id if different).

---
## 1. Migration File Ordering (Proposed)
| Order | Purpose |
|-------|---------|
| 001 | Core enums + extensions |
| 002 | Global tables: feature_plans, users, tenants |
| 003 | Join + config tables: tenant_users, tenant_settings, invitations |
| 004 | Domain lookups (apparatus, focus_areas, side_quests, genders, skill_components) |
| 005 | Core domain: lesson_types, athletes, programs/classes (optional), skills, skills_prerequisites |
| 006 | Scheduling: events (unified availability), availability_exceptions (if still needed), bookings, booking_* join tables |
| 007 | Waivers & compliance |
| 008 | Media & videos (athlete_skill_videos) |
| 009 | Billing: invoices, payouts, usage_metrics, gym_payout_* (if applicable) |
| 010 | Logs & audit: activity_logs, booking_logs, payment_logs, audit_logs |
| 011 | Email / content (site_content, templates) as needed |
| 099 | Row Level Security policies activation |

You can collapse some steps if you prefer fewer migrations; keeping granular improves rollback clarity.

---
## 2. Core Design Choices (Minimal Viable Multi-Tenant)
- Every tenant-owned row has `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`.
- Global tables: `users`, `feature_plans` (and optional global lookup tables if universal across tenants).
- Compound uniques always include `tenant_id` when scoping by slug/name (`UNIQUE (tenant_id, slug)`).
- RLS enabled only after data model stable (final migration step) to ease early iteration.
- Roles: platform_admin (global), coach_admin, coach_staff, parent, athlete.

---
## 3. SQL Drafts
Below are copy-paste ready drafts (adjust naming precision as needed). Create each as its own migration file (e.g., `001_core.sql`, etc.).

### 001_core.sql
```sql
-- Extensions (if not already present)
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- optional

-- Enums
CREATE TYPE tenant_user_role AS ENUM ('platform_admin','coach_admin','coach_staff','parent','athlete');
CREATE TYPE tenant_status AS ENUM ('active','inactive','suspended');
CREATE TYPE usage_metric_key AS ENUM ('bookings_created','athletes_active','storage_gb','videos_uploaded');
```

### 002_core_global.sql
```sql
CREATE TABLE feature_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_lookup_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider_id TEXT UNIQUE, -- Supabase auth user id (or same as id if we generate)
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,30}$'),
  name TEXT NOT NULL,
  status tenant_status NOT NULL DEFAULT 'active',
  plan_id UUID REFERENCES feature_plans(id),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tenants_plan_id_idx ON tenants(plan_id);
```

### 003_membership.sql
```sql
CREATE TABLE tenant_users (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role tenant_user_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);
CREATE INDEX tenant_users_role_idx ON tenant_users(tenant_id, role);

CREATE TABLE tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role tenant_user_role NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email) -- Prevent duplicate outstanding invites
);
```

### 004_lookups.sql
```sql
-- Lookups normally per-tenant (to allow customization) so include tenant_id
CREATE TABLE apparatus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE focus_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE side_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

-- Global genders (unlikely per-tenant variation) else treat like others
CREATE TABLE genders (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL
);
```

### 005_core_domain.sql
```sql
CREATE TABLE lesson_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT true,
  total_price NUMERIC NOT NULL,
  reservation_fee NUMERIC NOT NULL,
  max_athletes INT NOT NULL DEFAULT 1,
  min_athletes INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  allergies TEXT,
  experience TEXT,
  photo TEXT,
  is_gym_member BOOLEAN NOT NULL DEFAULT false,
  latest_waiver_id UUID,
  waiver_status TEXT NOT NULL DEFAULT 'pending',
  waiver_signed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, first_name, last_name, date_of_birth)
);
```

(Add programs/classes, skills, skill_components, skills_prerequisites similarly when required.)

### 006_scheduling_booking.sql (Simplified)
```sql
CREATE TYPE booking_status AS ENUM ('pending','paid','confirmed','completed','failed','cancelled');
CREATE TYPE payment_status AS ENUM ('unpaid','reservation-pending','reservation-paid','reservation-failed','session-paid','reservation-refunded','session-refunded');
CREATE TYPE attendance_status AS ENUM ('pending','confirmed','completed','cancelled','no-show','manual');

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lesson_type_id UUID REFERENCES lesson_types(id) ON DELETE SET NULL,
  title TEXT,
  notes TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  capacity INT,
  is_bookable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX events_tenant_start_idx ON events(tenant_id, start_at DESC);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  parent_user_id UUID REFERENCES users(id),
  status booking_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  attendance_status attendance_status NOT NULL DEFAULT 'pending',
  booking_method TEXT NOT NULL DEFAULT 'Website',
  reservation_fee_paid BOOLEAN NOT NULL DEFAULT false,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  special_requests TEXT,
  admin_notes TEXT,
  cancellation_reason TEXT,
  cancellation_requested_at TIMESTAMPTZ,
  wants_reschedule BOOLEAN NOT NULL DEFAULT false,
  reschedule_preferences TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bookings_tenant_status_idx ON bookings(tenant_id, status);

CREATE TABLE booking_athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  slot_order INT NOT NULL,
  UNIQUE (booking_id, athlete_id)
);
```

### 007_waivers.sql
```sql
CREATE TABLE waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship_to_athlete TEXT,
  signature TEXT NOT NULL,
  emergency_contact_number TEXT NOT NULL,
  understands_risks BOOLEAN,
  agrees_to_policies BOOLEAN,
  authorizes_emergency_care BOOLEAN,
  allows_photo_video BOOLEAN,
  confirms_authority BOOLEAN,
  pdf_path TEXT,
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 008_media.sql
```sql
CREATE TABLE athlete_skill_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  recorded_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  optimized_url TEXT,
  processing_status TEXT,
  processing_error TEXT,
  is_visible BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_date DATE,
  sort_index INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX athlete_skill_videos_tenant_idx ON athlete_skill_videos(tenant_id, athlete_id);
```

### 009_billing.sql
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_connect_account TEXT,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usage_metrics (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  key usage_metric_key NOT NULL,
  value BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, period_start, key)
);
```

### 010_logs.sql
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- nullable for platform events
  actor_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  before JSONB,
  after JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
(Add booking_logs, payment_logs, activity history as needed mirroring previous design.)

### 099_rls.sql (Enable after app ready)
```sql
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
-- Enable for each tenant-scoped table ...

-- Example policy (Supabase style) - Adjust claim path
CREATE POLICY tenant_isolation_select ON lesson_types FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenant_users tu
    WHERE tu.tenant_id = lesson_types.tenant_id
      AND tu.user_id = auth.uid()
  )
);
```
(You'll replicate similar policies for each table and add role-based USING / WITH CHECK clauses.)

---
## 4. Initial Seed (Optional)
```sql
INSERT INTO feature_plans (code, name, limits) VALUES ('free','Free', '{"max_athletes":100,"storage_gb":5}');
INSERT INTO tenants (slug, name, plan_id) SELECT 'demo-coach','Demo Coach', id FROM feature_plans WHERE code='free';
INSERT INTO users (email, name) VALUES ('founder@example.com','Founder') RETURNING id;
-- Assume returned id = X; then:
INSERT INTO tenant_users (tenant_id, user_id, role) SELECT t.id, u.id, 'platform_admin' FROM tenants t CROSS JOIN users u WHERE t.slug='demo-coach' AND u.email='founder@example.com';
```

---
## 5. Drizzle Integration Steps
1. Create the migration SQL files under `drizzle/` (or configured folder).
2. Run `npx drizzle-kit generate` only if you prefer schema-first TS definitions. Here we are writing SQL directly; alternatively define these tables in TS first, then generate migrations.
3. Add new table definitions to `shared/schema.ts` gradually (start with feature_plans, users, tenants) to minimize initial diff noise.
4. Apply migrations: `npx drizzle-kit push` (or your chosen command) to the new database.
5. Write a tiny smoke script querying tenants to verify connectivity.

---
## 6. RLS Rollout Strategy
- Phase 1: No RLS; rely on application layer while building basic CRUD & tests.
- Phase 2: Add RLS in staging. Write isolation tests (attempt cross-tenant SELECT should return zero rows).
- Phase 3: Enable RLS in production after passing tests.

---
## 7. Next Immediate Coding Tasks
- Implement TS Drizzle models for: feature_plans, users, tenants, tenant_users.
- Add tenant resolution middleware (subdomain or header) returning `tenant_id`.
- Inject `tenant_id` automatically in all insert mutations (middleware / helper).
- Add auth guard mapping Supabase JWT user id to internal `users.id`.
- Write basic test: create tenant, add user, assign role, create lesson_type, ensure scoping.

---
## 8. Quick Smoke Test (Pseudo Code)
```ts
const tenant = await db.insert(tenants).values({ slug: 'alpha-gym', name: 'Alpha Gym' }).returning();
const user = await db.insert(users).values({ email: 'coach@alpha.com', name: 'Coach A' }).returning();
await db.insert(tenantUsers).values({ tenantId: tenant[0].id, userId: user[0].id, role: 'coach_admin' });
```

---
## 9. Deferred / Optional
- Programs/classes table (link events to a higher-level structure).
- Soft delete conventions (`deleted_at`) on major tables.
- Partitioning large log tables.
- Per-tenant custom domains mapping table.
- API keys table for server-to-server integrations.

---
## 10. Validation Checklist
- [ ] Migrations apply cleanly on empty DB.
- [ ] Drizzle types compile.
- [ ] Seed script runs and returns demo tenant.
- [ ] CRUD for lesson_types & bookings limited by tenant_id.
- [ ] Isolation test passes (user of Tenant A can't read Tenant B rows once RLS enabled).

---
## 11. Rollback Guidance
- Each migration is additive; to rollback catastrophic early issue on empty DB just drop schema and re-run. After production data exists, future destructive changes require new migrations (never edit old files).

---
Start here by creating `001_core.sql` and `002_core_global.sql`, update Drizzle schema, run, then proceed sequentially. Adjust order to your immediate feature priorities.
