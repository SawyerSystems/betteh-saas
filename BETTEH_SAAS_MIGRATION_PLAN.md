# Betteh SaaS Migration Plan

Comprehensive step‑by‑step roadmap to evolve the single‑tenant "Coach Will Tumbles" application into the multi‑tenant SaaS platform "Betteh" that serves many coaches (organizations) and their parents & athletes.

---
## 0. Guiding Principles
- Minimize downtime; ship in incremental, reversible slices.
- Preserve existing single‑coach data; create automated migration scripts.
- Strong tenant isolation at the database (Row Level Security) and application layers.
- Centralize branding & config so white‑label / per‑coach customization becomes possible.
- Instrument from day 1 (logging, metrics, audit trails) for observability & billing.
- Security & privacy: least privilege, encrypted PII, explicit consent tracking.

---
## 1. High‑Level Target Architecture
| Concern | Current | Target SaaS |
|---------|---------|-------------|
| Tenant model | Implicit single coach | Explicit tenants (coach accounts / orgs) + users w/ roles |
| Auth | Parents, Admin (coach) local auth | Multi‑role: Platform Admin, Coach Admin, Coach Staff, Parent, Athlete (optional login) |
| DB schema | Tables keyed implicitly (global) | All tenant data keyed by `tenant_id` (UUID) or partitioned schema; global config tables |
| Access control | App logic only | Supabase RLS + service role for internal jobs; application-level role enforcement |
| Billing | Stripe (single account) | Stripe Connect (per coach payouts) + Platform subscription & usage metering |
| File storage / videos | Single bucket namespace | Bucket objects prefixed by tenant or distinct buckets per tenant |
| Emails | Brand hardcoded | Theming via templates + per‑tenant sender identities (verified) |
| Domain | Single domain | Primary SaaS domain + optional custom subdomains (coachSlug.betteh.app) |
| Infrastructure | Single node build | IaC + environment separation (dev/stage/prod) |

---
## 2. User Types & Tenant Architecture

### 2.1 User Type Hierarchy

Our multi-tenant SaaS will support the following user types and tenant structures:

#### **Platform Level**
- **Platform Admin**: System-wide administration, tenant management, billing oversight

#### **Organizational Tenants (Gyms/Large Coaching Organizations)**
- **Gym Owner/Admin**: Tenant administration, staff management, billing management
- **Head Coach**: Program management, scheduling oversight, staff coordination
- **Assistant Coach**: Limited coaching duties, athlete interaction
- **Front Desk Staff**: Registration, basic scheduling, customer service
- **Parents**: Book sessions, view athlete progress, manage family accounts
- **Athletes**: View personal progress, upcoming sessions (optional login)

#### **Individual Tenants (Solo Coaches)**
- **Solo Coach** (Solo Plan): Basic features, limited athletes/bookings
- **Pro Coach** (Pro Plan): Advanced features, unlimited athletes, video analysis
- **Parents**: Book with individual coaches
- **Athletes**: View progress with individual coaches

### 2.2 Tenant Types & Plans

#### **Tenant Type Enum**
```sql
CREATE TYPE tenant_type AS ENUM (
  'individual',      -- Solo coach operations
  'organization'     -- Gym/multi-coach operations
);
```

#### **Plan Structure**
```typescript
// Feature Plans by Tenant Type
const FEATURE_PLANS = {
  // Individual Coach Plans
  individual: {
    solo: {
      maxAthletes: 25,
      maxMonthlyBookings: 100,
      maxStaff: 1,
      videoAnalysis: false,
      advancedReporting: false,
      customBranding: false,
      apiAccess: false,
      price: 29  // per month
    },
    pro: {
      maxAthletes: -1,  // unlimited
      maxMonthlyBookings: -1,
      maxStaff: 1,
      videoAnalysis: true,
      advancedReporting: true,
      customBranding: true,
      apiAccess: true,
      price: 89  // per month
    }
  },
  
  // Organizational Plans (per coach seat)
  organization: {
    starter: {
      maxAthletes: -1,
      maxMonthlyBookings: -1,
      maxStaff: 5,
      videoAnalysis: true,
      advancedReporting: true,
      customBranding: true,
      apiAccess: true,
      multiLocation: false,
      price: 49  // per coach per month
    },
    professional: {
      maxAthletes: -1,
      maxMonthlyBookings: -1,
      maxStaff: 25,
      videoAnalysis: true,
      advancedReporting: true,
      customBranding: true,
      apiAccess: true,
      multiLocation: true,
      whiteLabel: false,
      price: 79  // per coach per month
    },
    enterprise: {
      maxAthletes: -1,
      maxMonthlyBookings: -1,
      maxStaff: -1,
      videoAnalysis: true,
      advancedReporting: true,
      customBranding: true,
      apiAccess: true,
      multiLocation: true,
      whiteLabel: true,
      customIntegrations: true,
      price: 149  // per coach per month
    }
  }
};
```
### 3.1 Inventory References
- Code search terms: `Coach Will`, `CoachWill`, `coachwilltumbles`, `coach-will`, domain references `coachwilltumbles.com`.
## 3. Naming & Branding Refactor
- Create `branding/brand.ts` exporting brand metadata (platform + fallbacks).
### 3.2 Introduce Betteh Constants
- Replace hardcoded strings with brand provider / context.
### 3.3 Domain Strategy
- Primary: `betteh.app` ('`betteh.com` forwards to `betteh.app`).
- Tenant subdomains: `<coachSlug>.betteh.app` via wildcard DNS + edge middleware to resolve tenant.
### 3.4 Transitional Redirects
- Configure 301 redirects from legacy domain paths to new host once migrated.

---
## 4. Enhanced Multi‑Tenant Data Model

### 4.1 Updated Core Entities

Based on our user type analysis, we need to enhance our existing schema:

#### **Enhanced Tenants Table**
```sql
-- Add tenant type and organizational structure
ALTER TABLE tenants ADD COLUMN tenant_type TEXT NOT NULL DEFAULT 'individual';
ALTER TABLE tenants ADD COLUMN parent_tenant_id UUID REFERENCES tenants(id); -- For multi-location orgs
ALTER TABLE tenants ADD COLUMN coach_count INTEGER DEFAULT 1; -- For seat-based billing

-- Add constraint for tenant type
ALTER TABLE tenants ADD CONSTRAINT tenants_tenant_type_check 
  CHECK (tenant_type IN ('individual', 'organization'));
```

#### **Enhanced Tenant User Roles**
```sql
-- Update tenant_user_role enum to include organizational roles
ALTER TYPE tenant_user_role ADD VALUE 'gym_owner';
ALTER TYPE tenant_user_role ADD VALUE 'head_coach';
ALTER TYPE tenant_user_role ADD VALUE 'assistant_coach';
ALTER TYPE tenant_user_role ADD VALUE 'front_desk';

-- Updated role hierarchy:
-- platform_admin (system-wide)
-- gym_owner (organization tenant admin)
-- head_coach (senior coaching staff)
-- coach_admin (individual tenant admin - legacy)
-- assistant_coach (junior coaching staff)
-- coach_staff (general coaching staff - legacy)
-- front_desk (administrative staff)
-- parent (booking/viewing)
-- athlete (optional login)
```

#### **Enhanced Feature Plans**
```sql
-- Add tenant type specific plans
ALTER TABLE feature_plans ADD COLUMN tenant_type TEXT NOT NULL DEFAULT 'individual';
ALTER TABLE feature_plans ADD COLUMN is_per_seat BOOLEAN DEFAULT false;
ALTER TABLE feature_plans ADD COLUMN max_coaches INTEGER DEFAULT 1;

-- Update feature limits structure
-- limits JSON will now include:
{
  "maxAthletes": -1,           -- -1 = unlimited
  "maxMonthlyBookings": -1,
  "maxStaff": 5,
  "maxLocations": 1,
  "features": {
    "videoAnalysis": true,
    "advancedReporting": true,
    "customBranding": true,
    "apiAccess": true,
    "multiLocation": false,
    "whiteLabel": false,
    "customIntegrations": false
  }
}
```

#### **New Tables for Enhanced Structure**

```sql
-- Locations for multi-location organizations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address JSONB,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Staff assignments to locations
CREATE TABLE staff_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id, location_id)
);

-- Organization structure for multi-level orgs
CREATE TABLE organization_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  child_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'location', -- 'location', 'franchise', 'division'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_tenant_id, child_tenant_id)
);
```

### 4.2 Permission Matrix by User Type

```typescript
// Enhanced permission matrix
export const PERMISSIONS = {
  // Platform Level
  platform_admin: [
    'tenants:*', 'users:*', 'billing:*', 'analytics:*', 'system:*'
  ],
  
  // Organizational Tenant Roles
  gym_owner: [
    'tenant:manage', 'staff:*', 'locations:*', 'billing:read',
    'athletes:*', 'bookings:*', 'programs:*', 'reports:*'
  ],
  
  head_coach: [
    'staff:invite', 'staff:manage:coaches', 'programs:*', 'schedules:*',
    'athletes:*', 'bookings:*', 'reports:read', 'locations:read'
  ],
  
  assistant_coach: [
    'athletes:read', 'athletes:update:assigned', 'bookings:read', 
    'bookings:update:assigned', 'schedules:read', 'programs:read'
  ],
  
  front_desk: [
    'athletes:read', 'athletes:create', 'bookings:*', 'schedules:read',
    'payments:process', 'waivers:manage'
  ],
  
  // Individual Tenant Roles  
  coach_admin: [
    'athletes:*', 'bookings:*', 'schedules:*', 'programs:*',
    'billing:read', 'settings:update', 'reports:*'
  ],
  
  coach_staff: [
    'athletes:read', 'athletes:update', 'bookings:read', 'bookings:update',
    'schedules:read', 'programs:read'
  ],
  
  // Client Roles (shared across tenant types)
  parent: [
    'athletes:read:own', 'bookings:read:own', 'bookings:create:own',
    'waivers:sign:own', 'payments:view:own'
  ],
  
  athlete: [
    'profile:read:own', 'progress:read:own', 'bookings:view:own'
  ]
} as const;
```

### 4.3 Database Migration Requirements

To implement this enhanced structure, we need:

1. **Schema Updates** (can be done with zero downtime):
   - Add new columns to existing tables
   - Create new tables for locations and hierarchy
   - Add new enum values for roles

2. **Data Migration** (low impact):
   - Set all existing tenants to `tenant_type = 'individual'`
   - Create default location for each existing tenant
   - Update existing feature plans with new structure

3. **New Seed Data**:
   - Create feature plans for each tenant type and tier
      - Set up default organizational structures

### 4.4 Current Database Assessment

#### **✅ What We Already Have**
- ✅ `tenants` table with basic structure
- ✅ `tenant_users` table with role-based access
- ✅ `feature_plans` table for plan management
- ✅ `tenant_id` columns on all relevant tables (32 tables)
- ✅ Row Level Security policies (38 tables, 33 tenant isolation policies)
- ✅ Basic tenant user roles: `platform_admin`, `coach_admin`, `coach_staff`, `parent`, `athlete`

#### **🔧 What Needs Enhancement**
- 🔧 **Tenant Type Support**: Add `tenant_type` column to distinguish individual vs organizational
- 🔧 **Enhanced Role System**: Add organizational roles (`gym_owner`, `head_coach`, `assistant_coach`, `front_desk`)
- 🔧 **Location Support**: New `locations` table for multi-location organizations
- 🔧 **Hierarchical Organizations**: Support for parent/child tenant relationships
- 🔧 **Enhanced Feature Plans**: Plan structure for different tenant types and seat-based billing
- 🔧 **Usage Tracking**: Track seat usage for organizational billing

#### **📋 Migration Tasks Required**

**Phase 4A: Enhanced Schema (1-2 days)**
```sql
-- 1. Add tenant type support
ALTER TABLE tenants ADD COLUMN tenant_type TEXT NOT NULL DEFAULT 'individual';
ALTER TABLE tenants ADD COLUMN parent_tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tenants ADD COLUMN coach_count INTEGER DEFAULT 1;

-- 2. Add new user roles
ALTER TYPE tenant_user_role ADD VALUE 'gym_owner';
ALTER TYPE tenant_user_role ADD VALUE 'head_coach'; 
ALTER TYPE tenant_user_role ADD VALUE 'assistant_coach';
ALTER TYPE tenant_user_role ADD VALUE 'front_desk';

-- 3. Enhance feature plans
ALTER TABLE feature_plans ADD COLUMN tenant_type TEXT NOT NULL DEFAULT 'individual';
ALTER TABLE feature_plans ADD COLUMN is_per_seat BOOLEAN DEFAULT false;
ALTER TABLE feature_plans ADD COLUMN max_coaches INTEGER DEFAULT 1;

-- 4. Create new tables
CREATE TABLE locations (...);
CREATE TABLE staff_locations (...);
CREATE TABLE organization_hierarchy (...);
```

**Phase 4B: Seed Data (1 day)**
```sql
-- Create tiered feature plans
INSERT INTO feature_plans (code, name, tenant_type, limits, price_lookup_key) VALUES
-- Individual Plans
('individual-solo', 'Solo Coach', 'individual', '{"maxAthletes": 25, "maxMonthlyBookings": 100, "features": {"videoAnalysis": false}}', 'solo_monthly'),
('individual-pro', 'Pro Coach', 'individual', '{"maxAthletes": -1, "maxMonthlyBookings": -1, "features": {"videoAnalysis": true}}', 'pro_monthly'),

-- Organizational Plans  
('org-starter', 'Starter', 'organization', '{"maxAthletes": -1, "maxStaff": 5, "features": {"multiLocation": false}}', 'org_starter_monthly'),
('org-professional', 'Professional', 'organization', '{"maxAthletes": -1, "maxStaff": 25, "features": {"multiLocation": true}}', 'org_pro_monthly'),
('org-enterprise', 'Enterprise', 'organization', '{"maxAthletes": -1, "maxStaff": -1, "features": {"whiteLabel": true}}', 'org_enterprise_monthly');
```

**Phase 4C: Update Permissions (1 day)**
- Update RLS policies to handle new roles
- Implement role hierarchy checking
- Add location-based access controls for multi-location orgs

#### **🚀 Implementation Priority**

**HIGH PRIORITY** (Blocking other features):
1. Tenant type distinction (individual vs organization)
2. Enhanced role system for organizational tenants
3. Tiered feature plans (Solo/Pro for individuals)

**MEDIUM PRIORITY** (Can implement later):
1. Multi-location support
2. Organization hierarchy
3. Advanced permission granularity

**LOW PRIORITY** (Future enhancements):
1. White-label customization
2. Custom integrations API
3. Advanced organizational reporting

---
### 3.1 Core Entities (New / Adjusted)
- tenants (id, slug, name, status, plan_id, timezone, created_at)
- tenant_settings (tenant_id FK, branding JSON, feature_flags JSON)
- users (id, email, name, global unique)
- tenant_users (tenant_id, user_id, role ENUM[coach_admin, coach_staff, parent, athlete, platform_admin], status)
- athletes (id, tenant_id, parent_user_id, profile fields...)
- programs / classes (id, tenant_id, type, level, capacity, pricing)
- events / lessons (add tenant_id, program_id nullable, availability windows)
- bookings (add tenant_id, athlete_id, status, pricing snapshot JSON)
- invoices (id, tenant_id, stripe_invoice_id, total, currency, status)
- payouts (id, tenant_id, stripe_connect_account, amount, status)
- audit_logs (id, tenant_id nullable for platform events, actor_user_id, action, entity, before, after, ip, created_at)
- invitations (id, tenant_id, email, role, token, expires_at, accepted_at)
- feature_plans (id, code, name, limits JSON, price lookup key)
- usage_metrics (tenant_id, period_start, key, value)
### 3.2 Column Additions / Changes
- Add `tenant_id UUID NOT NULL` to all tenant-scoped existing tables (events, bookings, waivers, videos, focus areas, skills, messages, attendance, etc.).
- Add composite unique constraints including tenant_id (e.g., `(tenant_id, slug)`).
### 3.3 Indexing Strategy
- BTREE indexes: `(tenant_id)`, `(tenant_id, created_at DESC)`, `(tenant_id, status)`.
- Partial indexes for active items `(tenant_id, status) WHERE status='active'`.
### 3.4 Referential Integrity
- On delete cascade for tenant-owned child rows (or archive strategy) using `ON DELETE CASCADE` or soft deletes.

---
## 5. Supabase / Postgres Migration Steps
1. Snapshot current schema (`pg_dump --schema-only`).
2. Create migrations adding `tenants`, `tenant_users`, `feature_plans` first.
3. Add `tenant_id` with default placeholder to existing tables (nullable initially).
4. Backfill `tenant_id` for all existing rows with the legacy coach's tenant id.
5. Set NOT NULL on `tenant_id` after backfill.
6. Add new foreign keys & indexes.
7. Implement RLS policies per table:
   - Enable RLS.
   - Policy: platform_admin unrestricted.
   - Policy: tenant-scoped roles can `SELECT/UPDATE/DELETE` only where `tenant_id = auth.jwt() ->> 'tenant_id'` (or membership via join on tenant_users view).
8. Create security definer helper functions if needed for complex policies.
9. Add views `current_tenant_events` etc. for simplified queries.
10. Write migration verification script (counts per table, constraint checks).

---
## 6. Authentication & Authorization

### 5.1 Auth Strategy: **Supabase Auth with Multi-Tenant JWT Claims**

**Decision:** Use Supabase Auth with custom claims for tenant membership. This provides:
- Built-in user management, password reset, email verification
- JWT tokens with custom claims (`tenant_id`, `role`, `tenant_memberships`)
- Row Level Security integration via `auth.jwt()` functions
- OAuth providers (Google, GitHub) for easy coach onboarding

### 5.2 Multi-Tenant JWT Structure

```typescript
// JWT payload structure
interface SupabaseJWT {
  sub: string;           // user_id
  email: string;         
  aud: string;           // authenticated
  app_metadata: {
    tenant_id: string;           // Primary tenant
    role: 'platform_admin' | 'coach_admin' | 'coach_staff' | 'parent' | 'athlete';
    tenant_memberships: {       // Multi-tenant support
      [tenantId: string]: {
        role: string;
        status: 'active' | 'inactive';
      };
    };
  };
  user_metadata: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
}
```

### 5.3 Implementation Steps

#### Step 1: Database Hooks for Custom Claims
```sql
-- Create function to update JWT claims when tenant_users changes
CREATE OR REPLACE FUNCTION update_user_jwt_claims()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users.app_metadata with tenant membership
  UPDATE auth.users 
  SET app_metadata = COALESCE(app_metadata, '{}'::jsonb) || 
    jsonb_build_object(
      'tenant_id', NEW.tenant_id::text,
      'role', NEW.role,
      'tenant_memberships', (
        SELECT jsonb_object_agg(
          tu.tenant_id::text, 
          jsonb_build_object('role', tu.role, 'status', tu.status)
        )
        FROM tenant_users tu 
        WHERE tu.user_id = NEW.user_id
      )
    )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on tenant_users insert/update
CREATE TRIGGER update_jwt_claims_trigger
  AFTER INSERT OR UPDATE ON tenant_users
  FOR EACH ROW EXECUTE FUNCTION update_user_jwt_claims();
```

#### Step 2: RLS Policies Using JWT Claims
```sql
-- Example policy using JWT tenant claims
CREATE POLICY "tenant_isolation" ON bookings
  FOR ALL TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- Multi-tenant membership policy
CREATE POLICY "multi_tenant_access" ON bookings  
  FOR ALL TO authenticated
  USING (
    tenant_id::text = ANY(
      SELECT jsonb_object_keys(
        COALESCE(auth.jwt() -> 'app_metadata' -> 'tenant_memberships', '{}'::jsonb)
      )
    )
  );
```

#### Step 3: Server-Side Auth Middleware
```typescript
// server/middleware/auth.ts
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    tenant_id: string;
    role: string;
    tenant_memberships: Record<string, { role: string; status: string }>;
  };
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Extract tenant info from JWT claims
    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: user.id,
      email: user.email!,
      tenant_id: user.app_metadata?.tenant_id,
      role: user.app_metadata?.role,
      tenant_memberships: user.app_metadata?.tenant_memberships || {}
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}
```

#### Step 4: Frontend Auth Integration
```typescript
// client/src/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentTenant, setCurrentTenant] = useState<string | null>(null);

  useEffect(() => {
    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            tenant_id: session.user.app_metadata?.tenant_id,
            role: session.user.app_metadata?.role,
            tenant_memberships: session.user.app_metadata?.tenant_memberships || {}
          };
          setUser(authUser);
          setCurrentTenant(authUser.tenant_id);
        } else {
          setUser(null);
          setCurrentTenant(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const switchTenant = (tenantId: string) => {
    if (user?.tenant_memberships[tenantId]) {
      setCurrentTenant(tenantId);
      // Update session to use different tenant context
    }
  };

  return { user, currentTenant, switchTenant };
}
```

### 5.4 Role-Based Permission Matrix

```typescript
// shared/permissions.ts
export const PERMISSIONS = {
  // Platform Admin - God mode
  platform_admin: [
    'tenants:create', 'tenants:read', 'tenants:update', 'tenants:delete',
    'users:read', 'billing:manage', 'analytics:read'
  ],
  
  // Coach Admin - Full tenant control
  coach_admin: [
    'athletes:*', 'bookings:*', 'waivers:*', 'events:*',
    'staff:invite', 'settings:update', 'billing:read'
  ],
  
  // Coach Staff - Limited operations
  coach_staff: [
    'athletes:read', 'athletes:update', 'bookings:read', 'bookings:update',
    'events:read', 'waivers:read'
  ],
  
  // Parent - Own data only
  parent: [
    'athletes:read:own', 'bookings:read:own', 'bookings:create:own',
    'waivers:sign:own'
  ],
  
  // Athlete - Very limited
  athlete: [
    'profile:read:own', 'progress:read:own'
  ]
} as const;

export function hasPermission(
  userRole: string, 
  resource: string, 
  action: string,
  ownership?: 'own' | 'any'
): boolean {
  const rolePermissions = PERMISSIONS[userRole as keyof typeof PERMISSIONS] || [];
  
  // Check wildcard permissions
  if (rolePermissions.includes(`${resource}:*`)) return true;
  
  // Check specific permission
  const permission = ownership ? `${resource}:${action}:${ownership}` : `${resource}:${action}`;
  return rolePermissions.includes(permission);
}
```

### 5.5 Migration from Current Auth System

#### Phase 1: Parallel Implementation
1. **Keep existing Express sessions** for backward compatibility
2. **Add Supabase Auth alongside** existing system
3. **Gradually migrate users** to Supabase Auth

```typescript
// Dual auth middleware during migration
export async function dualAuth(req: Request, res: Response, next: NextFunction) {
  // Try Supabase Auth first
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        // Use Supabase user
        (req as any).user = mapSupabaseUser(user);
        return next();
      }
    } catch (error) {
      // Fall through to session auth
    }
  }

  // Fall back to existing session auth
  if (req.session?.adminId || req.session?.parentId) {
    // Use session user
    (req as any).user = mapSessionUser(req.session);
    return next();
  }

  return res.status(401).json({ error: 'Authentication required' });
}
```

#### Phase 2: User Migration Script
```typescript
// scripts/migrate-to-supabase-auth.ts
async function migrateUsersToSupabase() {
  // For existing parents
  const parents = await storage.getAllParents();
  
  for (const parent of parents) {
    // Create Supabase user
    const { data, error } = await supabase.auth.admin.createUser({
      email: parent.email,
      email_confirm: true,
      app_metadata: {
        tenant_id: parent.tenant_id,
        role: 'parent'
      },
      user_metadata: {
        first_name: parent.first_name,
        last_name: parent.last_name,
        phone: parent.phone
      }
    });

    if (data.user) {
      // Add to tenant_users table
      await storage.addTenantUser({
        tenant_id: parent.tenant_id,
        user_id: data.user.id,
        role: 'parent',
        status: 'active'
      });
    }
  }
}
```

### 5.6 Invitation & Onboarding Flow

#### Coach Invitation Flow
```typescript
// 1. Platform admin creates invitation
async function inviteCoach(email: string, tenantData: CreateTenantRequest) {
  // Create tenant first
  const tenant = await createTenant(tenantData);
  
  // Create invitation with secure token
  const invitation = await createInvitation({
    tenant_id: tenant.id,
    email,
    role: 'coach_admin',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
  // Send invitation email
  await sendInvitationEmail(email, invitation.token, tenant.slug);
}

// 2. Coach accepts invitation
async function acceptInvitation(token: string, password: string) {
  const invitation = await validateInvitationToken(token);
  
  // Create Supabase user
  const { data, error } = await supabase.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    app_metadata: {
      tenant_id: invitation.tenant_id,
      role: invitation.role
    }
  });
  
  if (data.user) {
    // Add to tenant_users
    await addTenantUser({
      tenant_id: invitation.tenant_id,
      user_id: data.user.id,
      role: invitation.role,
      status: 'active'
    });
    
    // Mark invitation as accepted
    await markInvitationAccepted(invitation.id);
  }
}
```

#### Parent Signup Flow
```typescript
// 1. Parent signs up via booking flow
async function parentSignupViBooking(email: string, tenantSlug: string) {
  const tenant = await getTenantBySlug(tenantSlug);
  
  // Create Supabase user (passwordless for now)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: {
      tenant_id: tenant.id,
      role: 'parent'
    }
  });
  
  if (data.user) {
    // Send magic link for first login
    await supabase.auth.signInWithOtp({
      email,
      options: {
        data: {
          tenant_id: tenant.id
        }
      }
    });
  }
}
```

### 5.7 Benefits of Supabase Auth Migration

✅ **Simplified Implementation**
- No custom JWT signing/verification logic
- Built-in user management UI
- Automatic token refresh

✅ **Enhanced Security**
- Industry-standard OAuth flows
- Built-in rate limiting
- Secure password handling

✅ **Better UX**
- Magic link authentication for parents
- Social login options for coaches
- Password reset flows

✅ **Multi-Tenant Ready**
- Custom claims for tenant membership
- Role-based access control
- Seamless tenant switching

---
## 6. Routing & Tenant Resolution
1. Middleware extracts tenant slug from subdomain or first path segment (`/t/:slug/...`).
2. Lookup tenant (cache layer: in-memory LRU or edge KV) -> inject into request context.
3. Fallback / 404 if inactive.
4. SEO canonical tags adapt to tenant domain.

---
## 7. Configuration & Secrets
- Central `.env` review: segregate platform vs per-tenant (Stripe, email sending names).
- Introduce secret storage rotation plan.
- Support per-tenant Stripe Connect account id stored in `tenants.stripe_account_id`.

---
## 8. Billing & Plans
1. Define plans in Stripe: Free, Pro, Enterprise.
2. Map plan -> feature limits (max athletes, storage GB, staff seats, events per month).
3. Meter usage (cron daily aggregation into `usage_metrics`).
4. Enforce soft limits in UI, hard limits in API.
5. Implement subscription lifecycle webhooks (checkout.session.completed, invoice.payment_failed, customer.subscription.updated).
6. Connect payouts: Coach earnings tracked vs platform fees.

---
## 9. File & Media Storage
- Namespace all objects: `tenants/{tenant_id}/videos/...`.
- Migration script moves existing assets under new path.
- Access tokens validated against tenant membership.

---
## 10. Email & Notifications
- Template system with variable injection (tenant name, brand colors).
- Store templates or use provider (Resend) w/ dynamic data.
- Add notification preferences per user.

---
## 11. Logging, Monitoring, Auditing
- Structured logs (json) with `tenant_id` always present.
- Audit logs writer middleware after mutating actions.
- Basic metrics: signups, active tenants, bookings/day, revenue MRR.

---
## 12. Frontend Refactor
### 12.1 State Management
- Global `TenantContext` providing current tenant + role.
### 12.2 Component Changes
- Replace brand strings with brand component.
- Multi-tenant aware navigation (tenant switcher for users on multiple tenants).
### 12.3 Forms & Data Fetching
- Ensure all API calls send `tenant_id` or rely on subdomain scope.
### 12.4 Admin Dashboard
- Split: Platform Admin vs Coach Admin dashboards.

---
## 13. API Layer Changes
- Introduce `/api/tenant/:tenantId/...` or subdomain-based auth derivation.
- Validation that every mutation sets / derives tenant id.
- Rate limiting keyed by tenant + user.

---
## 14. Testing Strategy
1. Unit: permission matrix, RLS policy functions.
2. Integration: tenant isolation (cannot access other tenant data), billing flows.
3. Migration tests: run migration on snapshot, assert counts & constraints.
4. Load test: concurrency across tenants.

---
## 15. Data Migration Plan (Legacy -> Multi‑Tenant)
1. Create tenant row `legacy_coach` capturing existing brand fields.
2. Backfill `tenant_id`.
3. Validate referential integrity counts.
4. Run dry run in staging environment.
5. Schedule production maintenance window (should be near-zero downtime if additive steps done ahead).

---
## 16. Feature Flag Framework
- Add `feature_flags` JSON column; simple evaluation hook.
- Flags: `multi_tenant_nav`, `subdomain_routing`, `new_billing`, `athlete_portal`.

---
## 17. Performance Considerations
- Ensure critical indexes exist before enabling RLS to avoid sequential scans.
- Consider table partitioning if very large event/booking volume (future).

---
## 18. Security Enhancements
- Enforce Samesite/Lax on cookies; consider JWT only.
- Add per-tenant API keys for server-to-server (future).
- Periodic permission drift audit script.

---
## 19. Documentation & Developer Experience
- Update README to describe multi-tenant concepts.
- Create ERD diagram (dbdocs or draw.io) and commit.
- Onboarding guide: create tenant locally.

---
## 20. Rollout Phases & Milestones

| Phase | Goals | Exit Criteria | Current Status |
|-------|-------|---------------|----------------|
| 1 | **Database Foundation** | All tables have tenant_id, RLS active, isolation tests pass | ✅ **COMPLETE** |
| 2 | **JWT & Authentication** | API calls work without errors, tenant context flows | ✅ **COMPLETE** |
| 3 | **Branding System** | Zero hardcoded references, dynamic tenant branding | 🔄 **NEXT UP** |
| 4 | **Tenant Routing** | Subdomain tenant resolution working locally | ⏳ **PENDING** |
| 5 | **Platform Features** | Invitation flow, admin dashboard, usage metrics | ⏳ **PENDING** |
| 6 | **Billing Integration** | Stripe Connect working, subscription management | ⏳ **PENDING** |
| 7 | **Beta Launch** | 3+ external coaches using system | ⏳ **PENDING** |
| 8 | **GA Launch** | Documentation, monitoring SLIs defined | ⏳ **PENDING** |

**Current Overall Progress: ~35% (Database foundation + Authentication complete)**

---
## 21. Task Backlog (Actionable Checklist)

### **PHASE 1: DATABASE FOUNDATION** ✅ **COMPLETE**
- [x] Create `tenants` & related tables migrations.
- [x] Add `tenant_id` to existing tables (list to compile).
- [x] Write backfill script (Node + SQL) for legacy data.
- [x] Implement RLS policies (template + generator script).

### **PHASE 1.5: ENHANCED USER TYPES & PLANS** 🔄 **IN PROGRESS**
- [ ] **Enhanced Schema Updates**:
  - [ ] Add `tenant_type` column to `tenants` table ('individual' vs 'organization')
  - [ ] Add `parent_tenant_id` and `coach_count` to `tenants` table
  - [ ] Add new roles to `tenant_user_role` enum (gym_owner, head_coach, assistant_coach, front_desk)
  - [ ] Enhance `feature_plans` table with tenant_type, is_per_seat, max_coaches columns
  - [ ] Create `locations` table for multi-location organizations
  - [ ] Create `staff_locations` and `organization_hierarchy` tables

- [ ] **Tiered Feature Plans**:
  - [ ] Create Individual Coach Plans (Solo: $29/mo, Pro: $89/mo)
  - [ ] Create Organizational Plans (Starter: $49/coach, Professional: $79/coach, Enterprise: $149/coach)
  - [ ] Update plan limits structure with enhanced features
  - [ ] Implement usage tracking for seat-based billing

- [ ] **Enhanced Permissions**:
  - [ ] Update permission matrix for new organizational roles
  - [ ] Implement role hierarchy (gym_owner > head_coach > assistant_coach)
  - [ ] Add location-based access controls
  - [ ] Update RLS policies for new roles and structures

- [ ] **Migration & Seed Data**:
  - [ ] Migrate existing tenants to 'individual' type
  - [ ] Create default locations for existing tenants
  - [ ] Seed feature plans for all tenant types and tiers
  - [ ] Update existing tenant assignments to new plan structure

### **PHASE 2: AUTHENTICATION & ROLE MANAGEMENT** 🔄 **UPDATED SCOPE**
- [x] Database hooks for custom JWT claims (`update_user_jwt_claims` function)
- [x] RLS policies using JWT claims (38 tables, 33 tenant isolation policies)
- [x] Server-side auth middleware (`server/supabase-auth.ts`)
- [x] Service role configuration (working database access, RLS bypass)
- [x] Helper functions & user management (foreign keys, triggers active)
- [x] Dual authentication system (Supabase JWT + legacy sessions)
- [x] Role-based authorization middleware (`requireRole`, `requireCoachAdmin`, etc.)
- [x] API documentation system created (`/api/docs`, `/api/docs/html`)

**NEW REQUIREMENTS FOR ENHANCED USER TYPES:**
- [ ] **Enhanced Authentication Flow**:
  - [ ] Update admin authentication to support Platform Admins
  - [ ] Create organization signup flow for gym owners
  - [ ] Create individual coach signup flow with plan selection
  - [ ] Implement role-based dashboard routing

- [ ] **Role-based Authorization Updates**:
  - [ ] Update middleware for new role hierarchy (gym_owner > head_coach > assistant_coach)
  - [ ] Implement location-based access controls
  - [ ] Add tenant-type specific permissions
  - [ ] Create role transition workflows (e.g., staff promotions)

- [ ] **Session Management Enhancements**:
  - [ ] Update session structure for tenant context
  - [ ] Add role and location switching capabilities
  - [ ] Implement cross-tenant access for Platform Admins
  - [ ] Add audit logging for role changes

### **PHASE 3: BILLING & SUBSCRIPTION MANAGEMENT** 🔄 **ENHANCED SCOPE**
- [ ] **Stripe Integration Updates**:
  - [ ] Create pricing tables for Individual and Organizational plans
  - [ ] Implement seat-based billing for organizational plans
  - [ ] Add usage tracking and overage billing
  - [ ] Create plan upgrade/downgrade workflows

- [ ] **Subscription Management**:
  - [ ] Build subscription management dashboard
  - [ ] Implement billing contact management
  - [ ] Add payment method management
  - [ ] Create invoice and usage reporting

- [ ] **Plan Feature Enforcement**:
  - [ ] Implement feature gates based on plan limits
  - [ ] Add usage monitoring and alerts
  - [ ] Create plan comparison and upgrade prompts
  - [ ] Implement trial and onboarding flows

### **PHASE 4: BRANDING SYSTEM** 🔄 **NEXT UP**
- [ ] Extract branding constants into `branding/` module.
- [ ] Replace hardcoded brand strings (search & incremental PRs).
- [ ] Update server/routes.ts (20+ "Coach Will" references)
- [ ] Update server/storage.ts (12+ hardcoded references)
- [ ] Update client components (15+ files with hardcoded text)
- [ ] Dynamic email sender names per tenant

### **PHASE 5: TENANT ROUTING** ⏳ **PENDING**
- [ ] Add `TenantContext` to frontend.
- [ ] Implement tenant slug middleware.
- [ ] Subdomain resolution (coach1.betteh.app)
- [ ] Path-based tenant routing (/t/coach1)

### **PHASE 6: PLATFORM FEATURES** ⏳ **PENDING**
- [ ] Add platform admin dashboard skeleton.
- [ ] Build invitation flow (API + UI).
- [ ] Usage metering worker implementation.
- [ ] Namespace storage objects; migration script for videos.

### **PHASE 7: FINALIZATION** ⏳ **PENDING**
- [ ] Email template system & per-tenant sender config.
- [ ] Audit logging middleware.
- [ ] Permission matrix & enforcement utility.
- [ ] Write isolation integration tests.
- [ ] Update README + ERD diagram.
- [ ] Stage environment dress rehearsal migration.

---
## 22. Risk Register & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Forgotten tenant filters leaks data | High | RLS as defense in depth + automated query linter (grep for tables w/out tenant filter in repo) |
| Migration downtime | Medium | Two-step additive -> backfill -> enforce NOT NULL |
| Stripe billing errors | Medium | Sandbox end-to-end tests + idempotency keys |
| Performance regression under RLS | Medium | Pre-create indexes; EXPLAIN ANALYZE critical queries |
| Inconsistent branding | Low | Central brand provider + ESLint rule (custom) guiding usage |

---
## 23. CURRENT MIGRATION STATUS (Updated 2025-08-24)

### ✅ **PHASE 1: DATABASE FOUNDATION - 100% COMPLETE**
- [x] Core multi-tenant tables (`tenants`, `tenant_users`, `tenant_settings`, `feature_plans`, `invitations`)
- [x] `tenant_id` columns added to all 32 needed tables 
- [x] Row Level Security enabled on 38/38 tables
- [x] 35 RLS tenant isolation policies created
- [x] Foreign key constraints and indexes
- [x] Data backfill with default tenant (00000000-0000-0000-0000-000000000001)

### ✅ **PHASE 2: JWT & AUTHENTICATION - 100% COMPLETE**
- [x] Complete Supabase Auth middleware system in `server/supabase-auth.ts`
- [x] Database hooks for JWT claims (`update_user_jwt_claims`, `handle_new_user` triggers)
- [x] RLS policies using JWT claims (38 tables with RLS, 33 tenant isolation policies)
- [x] Service role configuration (working database access with RLS bypass)
- [x] Dual authentication system (Supabase JWT + legacy sessions during migration)
- [x] Role-based authorization (`requireRole`, `requireCoachAdmin`, `requireParent`, etc.)
- [x] Foreign key constraints linking `users` table to `auth.users`
- [x] Complete API documentation system (`GET /api/docs`, `GET /api/docs/html`)
- [x] Test endpoints for verification (`GET /api/test/service-role`)
- [x] All 12 backend authentication components verified and operational

**Key Files Implemented:**
- `server/supabase-auth.ts` - Complete authentication middleware system
- `server/api-docs.ts` - Comprehensive API documentation endpoints
- `migrations/fix-auth-migration.sql` - Database constraint fixes
- Updated `server/routes.ts` with authentication integration

**Verification Results:**
- ✅ Service role database access: `{"success":true,"tenantCount":1}`
- ✅ Authentication protection: Properly rejecting unauthenticated requests
- ✅ RLS policies: 38 tables enabled, 33 tenant isolation policies active
- ✅ Database functions: JWT claims and user management triggers operational

### 🚧 **PHASE 3: BRANDING SYSTEM - 0% COMPLETE**
Found 50+ hardcoded "Coach Will" references across codebase.

**Priority Tasks:**
1. **Create `branding/brand.ts`** - Centralized brand configuration
2. **Replace hardcoded strings** - Dynamic tenant-aware branding
3. **Update email templates** - Tenant-specific sender names
4. **Logo/asset management** - Per-tenant media assets

**Key files with hardcoded references:**
- `shared/schema.ts` (3 references)
- `server/storage.ts` (12 references) 
- `server/routes.ts` (20+ references)
- `client/src/pages/admin.tsx` (4 references)
- `client/src/pages/parent-dashboard.tsx` (5 references)
- `client/src/components/` (15+ files with references)

### 🚧 **PHASE 4: TENANT ROUTING - 0% COMPLETE**

**Priority Tasks:**
1. **Subdomain middleware** - `coach1.betteh.app` → tenant resolution
2. **Tenant context provider** - React context for frontend
3. **URL structure** - `/t/:slug` paths as fallback
4. **Route guards** - Tenant-aware navigation

### 🚧 **PHASE 5: PLATFORM FEATURES - 0% COMPLETE**

**Priority Tasks:**
1. **Platform admin dashboard** - Tenant management interface
2. **Invitation system** - Coach onboarding flow
3. **Usage metrics** - Track billing-relevant events
4. **Storage namespacing** - Tenant-isolated file uploads

### 🚧 **PHASE 6: BILLING & PAYMENTS - 0% COMPLETE**

**Priority Tasks:**
1. **Stripe Connect** - Per-coach payout accounts
2. **Subscription plans** - Feature-based pricing tiers
3. **Usage metering** - Track sessions/athletes per tenant
4. **Payment webhooks** - Multi-tenant payment processing

---
## 24. DETAILED ACTION PLAN TO 100%

### **WEEK 1: Fix JWT & Authentication (25% → 50%)**

#### Day 1-2: JWT Tenant Claims
```typescript
// 1. Update server/auth.ts
export function generateJWT(user: User, tenantId: string) {
  return jwt.sign({
    userId: user.id,
    email: user.email,
    tenant_id: tenantId,  // ← ADD THIS
    role: user.role
  }, JWT_SECRET);
}

// 2. Update Supabase client initialization
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      Authorization: `Bearer ${jwtWithTenantClaims}`
    }
  }
});
```

#### Day 3-4: Service Role Operations
```typescript
// 3. Fix server startup routines
// Use service role for system operations that don't need tenant isolation
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 4. Update storage.ts methods
export class Storage {
  private adminClient: SupabaseClient; // Service role
  private userClient: SupabaseClient;  // User-scoped
  
  async getSystemData() {
    return this.adminClient.from('site_content').select('*');
  }
  
  async getTenantData(tenantId: string) {
    return this.userClient.from('bookings')
      .select('*')
      .eq('tenant_id', tenantId);
  }
}
```

#### Day 5: Test & Validate
- Verify API calls work without "Invalid API key" errors
- Test tenant isolation (User A can't see User B's data)
- Validate service role operations succeed

### **WEEK 2: Branding System (50% → 70%)**

#### Day 1-2: Central Brand Configuration
```typescript
// Create branding/brand.ts
export interface TenantBrand {
  name: string;
  email: string; 
  phone: string;
  logo?: string;
  colors?: {
    primary: string;
    accent: string;
  };
}

export const DEFAULT_BRAND: TenantBrand = {
  name: "Coach Will Tumbles",
  email: "admin@coachwilltumbles.com", 
  phone: "(585) 755-8122"
};

export function getBrandForTenant(tenantId: string): TenantBrand {
  // TODO: Fetch from tenant_settings table
  return DEFAULT_BRAND;
}
```

#### Day 3-5: Replace Hardcoded References
Priority order:
1. `server/routes.ts` (20+ references) - Email templates, PDF generation
2. `server/storage.ts` (12 references) - Default coach names, contact info  
3. `client/src/components/` (15+ files) - UI text, meta titles
4. `shared/schema.ts` (3 references) - Default values

```typescript
// Before:
coachName: text("coach_name").default("Coach Will"),

// After:  
coachName: text("coach_name"), // No default, set by application
```

### **WEEK 3: Tenant Routing (70% → 85%)**

#### Day 1-3: Subdomain Resolution
```typescript
// middleware/tenant.ts
export function getTenantFromRequest(req: Request): string | null {
  // Extract from subdomain: coach1.betteh.app
  const host = req.headers.host;
  if (host?.includes('.betteh.app')) {
    return host.split('.')[0];
  }
  
  // Extract from path: /t/coach1/...
  const pathMatch = req.path.match(/^\/t\/([^\/]+)/);
  if (pathMatch) {
    return pathMatch[1];
  }
  
  return null;
}
```

#### Day 4-5: Frontend Tenant Context
```typescript
// client/src/contexts/TenantContext.tsx
interface TenantContextType {
  currentTenant: Tenant | null;
  setBranding: (brand: TenantBrand) => void;
}

export const TenantProvider: React.FC = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  
  // Fetch tenant from URL, set branding
  useEffect(() => {
    const slug = getTenantSlugFromURL();
    if (slug) {
      fetchTenant(slug).then(setCurrentTenant);
    }
  }, []);
  
  return (
    <TenantContext.Provider value={{ currentTenant, setBranding }}>
      {children}
    </TenantContext.Provider>
  );
};
```

### **WEEK 4: Platform Features (85% → 95%)**

#### Day 1-2: Platform Admin Dashboard
```typescript
// New route: /platform-admin
// Features:
// - List all tenants
// - View usage metrics  
// - Manage subscriptions
// - Send announcements
```

#### Day 3-4: Invitation System
```typescript
// Coach onboarding flow:
// 1. Platform admin creates invitation
// 2. Coach receives email with signup link
// 3. Coach completes profile + Stripe Connect
// 4. Tenant activated with subdomain
```

#### Day 5: Storage Namespacing
```typescript
// Update file uploads to include tenant prefix
const uploadPath = `tenants/${tenantId}/athlete-skills/${filename}`;
```

### **WEEK 5: Billing Integration (95% → 100%)**

#### Day 1-3: Stripe Connect Setup
```typescript
// Set up per-coach Stripe accounts
// Handle platform fees vs coach payouts
// Create subscription products for different plans
```

#### Day 4-5: Usage Metering & Final Testing
```typescript
// Track billable events:
// - Sessions conducted
// - Athletes managed  
// - Storage used
// - API calls made

// End-to-end multi-tenant testing
// Performance optimization
// Documentation updates
```

---
## 25. SUCCESS METRICS & VALIDATION

### **Phase Completion Criteria:**

**Phase 1 (Database):** ✅ Complete
- All tables have tenant_id
- RLS policies active
- Data properly isolated

**Phase 2 (JWT):** 🎯 Target: No API errors
- Server starts without "Invalid API key" errors
- API calls include proper tenant context
- Service role operations work for system tasks

**Phase 3 (Branding):** 🎯 Target: Zero hardcoded references
- `grep -r "Coach Will"` returns 0 results in application code
- All text comes from tenant configuration
- Emails use dynamic sender names

**Phase 4 (Routing):** 🎯 Target: Multi-tenant URLs work
- `coach1.betteh.app` resolves to correct tenant
- `/t/coach1/` paths work as fallback
- Frontend shows correct branding per tenant

**Phase 5 (Platform):** 🎯 Target: Complete coach lifecycle
- Platform admin can create/manage tenants
- Invitation → signup → active tenant flow works
- Usage metrics collected for billing

**Phase 6 (Billing):** 🎯 Target: Revenue-ready
- Coaches receive payouts via Stripe Connect
- Platform collects subscription fees
- Usage-based billing functional

### **Final Validation Checklist:**
- [ ] 3+ external coaches using live system
- [ ] Zero data leakage between tenants
- [ ] All brand references dynamic  
- [ ] Payment processing working end-to-end
- [ ] Platform admin dashboard functional
- [ ] Performance acceptable under load
- [ ] Documentation complete

---
## 26. Open Decisions (Document as Resolved Later)
- Supabase Auth vs existing auth stack migration timeline.
- Stripe Connect immediate vs later (initial revenue through platform account?).
- Custom domains support in MVP.
- Athlete direct login required at MVP?

---
## 27. Appendix: Example SQL Snippets
```sql
-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,30}$'),
  name TEXT NOT NULL,
  plan_id UUID NULL REFERENCES feature_plans(id),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenant_users (
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);
```

---
## 26. Maintenance & Evolution
- Quarterly index health review (pg_stat_user_indexes).
- Data retention policy per tenant (soft delete + purge job).
- Regular security review of RLS policies.

---
Prepared on: 2025-08-24
