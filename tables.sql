-- =====================================================================
-- Multi-Tenant SaaS Schema (Betteh)
-- This file refactors the former single-tenant schema into a multi-tenant
-- model. ALL tenant-owned tables now include tenant_id UUID NOT NULL
-- referencing tenants(id) ON DELETE CASCADE. Name-based unique constraints
-- are updated to be per-tenant (include tenant_id). Global tables: feature_plans,
-- tenants. RLS policies intentionally NOT enabled here; add in a later migration.
-- =====================================================================

-- 0. Extensions & Core Enums -------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Re-create / ensure enums (idempotent pattern: create only if missing)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type booking_status as enum ('pending','paid','confirmed','completed','failed','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('unpaid','reservation-pending','reservation-paid','reservation-failed','session-paid','reservation-refunded','session-refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type attendance_status as enum ('pending','confirmed','completed','cancelled','no-show','manual');
  end if;
  if not exists (select 1 from pg_type where typname = 'tenant_user_role') then
    create type tenant_user_role as enum ('platform_admin','coach_admin','coach_staff','parent','athlete');
  end if;
  if not exists (select 1 from pg_type where typname = 'tenant_status') then
    create type tenant_status as enum ('active','inactive','suspended');
  end if;
  if not exists (select 1 from pg_type where typname = 'usage_metric_key') then
    create type usage_metric_key as enum ('bookings_created','athletes_active','storage_gb','videos_uploaded');
  end if;
end $$;

-- 0a. Stub / minimal trigger function definitions (replace with real logic later)
-- These ensure trigger creation does not fail due to missing functions during initial bootstrap.
create or replace function public.update_updated_at_column() returns trigger language plpgsql as $$
begin
  if TG_OP = 'UPDATE' then
    NEW.updated_at := now();
  end if;
  return NEW;
end;$$;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  NEW.updated_at := now();
  return NEW;
end;$$;

create or replace function public.update_site_content_updated_at() returns trigger language plpgsql as $$
begin
  NEW.updated_at := now();
  return NEW;
end;$$;

create or replace function public.ensure_single_featured_testimonial() returns trigger language plpgsql as $$
begin
  -- Placeholder: real implementation should unset other featured rows per tenant.
  return NEW;
end;$$;

create or replace function public.unset_waiver_signed_on_waiver_delete() returns trigger language plpgsql as $$
begin
  -- Placeholder: real implementation would update athlete to reflect waiver removal.
  return OLD;
end;$$;

create or replace function public.update_is_connected_combo() returns trigger language plpgsql as $$
begin
  -- Placeholder: recompute skills.is_connected_combo if needed.
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;$$;

create or replace function public.handle_focus_area_other() returns trigger language plpgsql as $$
begin
  -- Placeholder: implement custom handling of focus_area_other field.
  return NEW;
end;$$;

-- 1. Global Tables -----------------------------------------------------------
create table if not exists public.feature_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  limits jsonb not null default '{}'::jsonb,
  price_lookup_key text null,
  created_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,30}$'),
  name text not null,
  status tenant_status not null default 'active',
  plan_id uuid null references feature_plans(id),
  timezone text not null default 'UTC',
  stripe_customer_id text null,
  stripe_account_id text null,
  created_at timestamptz not null default now()
);
create index if not exists tenants_plan_id_idx on public.tenants(plan_id);

-- 2. Users & Membership ------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_provider_id text unique,
  email text not null unique,
  name text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_users (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role tenant_user_role not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index if not exists tenant_users_role_idx on public.tenant_users(tenant_id, role);

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  branding jsonb not null default '{}'::jsonb,
  feature_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role tenant_user_role not null,
  token text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz null,
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);

-- 3. Activity Logs (tenant-scoped, nullable for platform-wide events) --------
create table public.activity_logs (
  id serial not null,
  tenant_id uuid null references public.tenants(id) on delete cascade,
  actor_type text not null,
  actor_id integer null,
  actor_name text not null,
  action_type text not null,
  action_category text not null,
  action_description text not null,
  target_type text not null,
  target_id integer null,
  target_identifier text null,
  field_changed text null,
  previous_value text null,
  new_value text null,
  notes text null,
  metadata jsonb null,
  ip_address text null,
  user_agent text null,
  created_at timestamp with time zone not null default now(),
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  deleted_by integer null,
  is_reversed boolean not null default false,
  reversed_at timestamp with time zone null,
  reversed_by integer null,
  reverse_action_id integer null,
  original_action_id integer null,
  batch_id text null,
  batch_description text null,
  constraint activity_logs_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists activity_logs_tenant_idx on public.activity_logs(tenant_id, created_at desc);

-- # 2. Admins
create table public.admins (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  password_hash text not null,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint admins_pkey primary key (id),
  constraint admins_email_per_tenant unique (tenant_id, email)
) TABLESPACE pg_default;
create index if not exists admins_tenant_idx on public.admins(tenant_id);

-- # 3. Apparatus
create table public.apparatus (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint apparatus_pkey primary key (id),
  constraint apparatus_name_per_tenant unique (tenant_id, name)
) TABLESPACE pg_default;
create index if not exists apparatus_tenant_idx on public.apparatus(tenant_id);

-- # 3a. Parents (moved earlier to satisfy FK dependencies for athletes/bookings)
create table public.parents (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  password_hash text not null,
  is_verified boolean not null default false,
  blog_emails boolean not null default false,
  last_login_at timestamp with time zone null,
  constraint parents_pkey primary key (id),
  constraint parents_email_per_tenant unique (tenant_id, email)
) TABLESPACE pg_default;
create index if not exists parents_tenant_idx on public.parents(tenant_id);

-- # 3b. skills (after parents, before athletes_skills dependencies)
create table if not exists public.skills (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  category text not null,
  level character varying(20) not null,
  description text not null,
  display_order integer null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  apparatus_id integer null,
  is_connected_combo boolean null default false,
  reference_videos jsonb null default '[]'::jsonb,
  constraint skills_pkey primary key (id),
  constraint skills_apparatus_id_apparatus_id_fk foreign KEY (apparatus_id) references apparatus (id)
) TABLESPACE pg_default;
create index if not exists skills_tenant_idx on public.skills(tenant_id);

-- # 4. archived_waivers 
create table public.archived_waivers (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  original_waiver_id integer null,
  athlete_name text not null,
  signer_name text not null,
  relationship_to_athlete text not null,
  signature text not null,
  emergency_contact_number text not null,
  understands_risks boolean not null,
  agrees_to_policies boolean not null,
  authorizes_emergency_care boolean not null,
  allows_photo_video boolean not null,
  confirms_authority boolean not null,
  pdf_path text null,
  ip_address text null,
  user_agent text null,
  signed_at timestamp without time zone not null,
  email_sent_at timestamp without time zone null,
  archived_at timestamp without time zone not null default now(),
  archive_reason text not null,
  legal_retention_period text null,
  original_parent_id integer null,
  original_athlete_id integer null,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint archived_waivers_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists archived_waivers_tenant_idx on public.archived_waivers(tenant_id);


-- # 7. athletes 
create table public.athletes (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  parent_id integer null references parents (id),
  name text null,
  first_name text null,
  last_name text null,
  allergies text null,
  experience text not null,
  photo text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  date_of_birth date null,
  gender text null,
  latest_waiver_id integer null, -- FK added later after waivers table exists
  waiver_signed boolean not null default false,
  waiver_status character varying(20) null default 'pending'::character varying,
  is_gym_member boolean not null default false,
  constraint athletes_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists athletes_tenant_idx on public.athletes(tenant_id, created_at);

-- # 7a. athlete_skills (moved after athletes for FK resolution)
create table if not exists public.athlete_skills (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  athlete_id integer null references athletes (id),
  skill_id integer null references skills (id),
  status character varying(20) not null default 'learning'::character varying,
  notes text null,
  unlock_date date null,
  first_tested_at timestamp with time zone null,
  last_tested_at timestamp with time zone null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  constraint athlete_skills_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists athlete_skills_tenant_idx on public.athlete_skills(tenant_id, athlete_id);

-- # 7b. athlete_skill_videos (moved after athlete_skills to satisfy FK dependency)
create table if not exists public.athlete_skill_videos (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  athlete_skill_id integer not null references public.athlete_skills(id) on delete cascade,
  url text not null,
  title text null,
  recorded_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  caption text null,
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  display_date date null,
  sort_index integer not null default 0,
  thumbnail_url text null,
  optimized_url text null,
  processing_status text not null default 'pending'::text,
  processing_error text null,
  constraint athlete_skill_videos_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists athlete_skill_videos_tenant_idx on public.athlete_skill_videos(tenant_id, athlete_skill_id);

-- # 8. availability 
create table public.availability (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  day_of_week integer not null,
  is_recurring boolean not null default true,
  is_available boolean not null default true,
  created_at timestamp without time zone not null default now(),
  start_time time without time zone not null,
  end_time time without time zone not null,
  constraint availability_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists availability_tenant_idx on public.availability(tenant_id, day_of_week);

-- # 9. lesson_types (moved earlier to precede bookings)
create table if not exists public.lesson_types (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  duration_minutes integer not null,
  is_private boolean null default true,
  total_price numeric not null,
  reservation_fee numeric not null,
  description text null,
  max_athletes integer not null default 1,
  min_athletes integer not null default 1,
  is_active boolean not null default true,
  key_points jsonb null default '[]'::jsonb,
  constraint lesson_types_pkey primary key (id),
  constraint lesson_types_name_per_tenant unique (tenant_id, name)
) TABLESPACE pg_default;
create index if not exists lesson_types_tenant_idx on public.lesson_types(tenant_id, is_active);

-- # 10. focus_areas (moved earlier to precede booking_focus_areas)
create table if not exists public.focus_areas (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  level character varying(20) null,
  apparatus_id integer null,
  constraint focus_areas_pkey primary key (id),
  constraint focus_areas_name_per_tenant unique (tenant_id, name),
  constraint focus_areas_apparatus_id_apparatus_id_fk foreign KEY (apparatus_id) references apparatus (id)
) TABLESPACE pg_default;
create index if not exists focus_areas_tenant_idx on public.focus_areas(tenant_id);

-- # 11. bookings (moved earlier to precede booking_athletes/booking_focus_areas & waivers FK)
create table if not exists public.bookings (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  booking_method text not null default 'Website'::text,
  reservation_fee_paid boolean not null default false,
  paid_amount numeric(10, 2) not null default 0.00,
  special_requests text null,
  admin_notes text null,
  dropoff_person_name text not null,
  dropoff_person_relationship text not null,
  dropoff_person_phone text not null,
  pickup_person_name text not null,
  pickup_person_relationship text not null,
  pickup_person_phone text not null,
  alt_pickup_person_name text null,
  alt_pickup_person_relationship text null,
  alt_pickup_person_phone text null,
  safety_verification_signed boolean not null default false,
  safety_verification_signed_at timestamp without time zone null,
  stripe_session_id text null,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  status public.booking_status not null default 'pending'::booking_status,
  payment_status public.payment_status not null default 'unpaid'::payment_status,
  attendance_status public.attendance_status not null default 'pending'::attendance_status,
  preferred_date date null,
  preferred_time time without time zone null,
  parent_id integer null references parents(id),
  lesson_type_id integer null references lesson_types(id),
  focus_areas text[] null,
  progress_note text null,
  coach_name text null default 'Coach Will'::text,
  focus_area_other text null,
  session_confirmation_email_sent boolean not null default false,
  session_confirmation_email_sent_at timestamp with time zone null,
  cancellation_reason text null,
  cancellation_requested_at timestamp with time zone null,
  wants_reschedule boolean null default false,
  reschedule_preferences text null,
  constraint bookings_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists bookings_tenant_status_idx on public.bookings(tenant_id, status);

create trigger focus_area_other_trigger BEFORE INSERT OR UPDATE on bookings
for EACH row execute FUNCTION handle_focus_area_other ();

-- Booking junction tables (added after bookings to satisfy FK dependencies)
create table if not exists public.booking_athletes (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  booking_id integer not null references public.bookings(id) on delete cascade,
  athlete_id integer not null references public.athletes(id) on delete cascade,
  slot_order integer not null,
  gym_member_at_booking boolean not null default false,
  duration_minutes integer null,
  gym_rate_applied_cents integer null,
  gym_payout_owed_cents integer null,
  gym_payout_computed_at timestamp with time zone null,
  gym_payout_override_cents integer null,
  gym_payout_override_reason text null,
  constraint booking_athletes_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists booking_athletes_tenant_idx on public.booking_athletes(tenant_id, booking_id);

create table if not exists public.booking_focus_areas (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  booking_id integer not null references public.bookings(id) on delete cascade,
  focus_area_id integer not null references public.focus_areas(id) on delete cascade,
  constraint booking_focus_areas_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists booking_focus_areas_tenant_idx on public.booking_focus_areas(tenant_id, booking_id);

-- # 9. blog_posts 
create table public.blog_posts (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  content text not null,
  excerpt text not null,
  category text not null,
  image_url text null,
  published_at timestamp without time zone not null default now(),
  sections jsonb null,
  constraint blog_posts_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists blog_posts_tenant_idx on public.blog_posts(tenant_id, published_at desc);

-- # 13. events 
create table public.events (
  id uuid not null default gen_random_uuid (),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  series_id uuid not null default gen_random_uuid (),
  parent_event_id uuid null,
  title text not null default ''::text,
  notes text null,
  location text null,
  is_all_day boolean not null default false,
  timezone text not null default 'America/Los_Angeles'::text,
  start_at timestamp with time zone not null,
  end_at timestamp with time zone not null,
  recurrence_rule text null,
  recurrence_end_at timestamp with time zone null,
  recurrence_exceptions jsonb not null default '[]'::jsonb,
  created_by integer null,
  updated_by integer null,
  is_deleted boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  is_availability_block boolean not null default false,
  blocking_reason text null,
  address_line_1 text null,
  address_line_2 text null,
  city text null,
  state text null,
  zip_code text null,
  country text null default 'United States'::text,
  category text null,
  constraint events_pkey primary key (id),
  constraint events_created_by_admins_id_fk foreign KEY (created_by) references admins (id),
  constraint events_updated_by_admins_id_fk foreign KEY (updated_by) references admins (id)
) TABLESPACE pg_default;
create index if not exists events_tenant_start_idx on public.events(tenant_id, start_at desc);

create index IF not exists events_series_id_idx on public.events using btree (series_id) TABLESPACE pg_default;

create index IF not exists events_start_at_idx on public.events using btree (start_at) TABLESPACE pg_default;

create index IF not exists events_end_at_idx on public.events using btree (end_at) TABLESPACE pg_default;

create index IF not exists events_parent_event_id_idx on public.events using btree (parent_event_id) TABLESPACE pg_default;

create index IF not exists events_recurrence_exceptions_gin on public.events using gin (recurrence_exceptions) TABLESPACE pg_default;

create index IF not exists events_is_availability_block_idx on public.events using btree (is_availability_block) TABLESPACE pg_default;

create index IF not exists idx_events_availability_blocking on public.events using btree (is_availability_block, start_at, end_at) TABLESPACE pg_default
where
  (
    (is_availability_block = true)
    and (is_deleted = false)
  );

create index IF not exists idx_events_start_end_dates on public.events using btree (start_at, end_at) TABLESPACE pg_default
where
  (is_deleted = false);

create trigger trg_events_updated_at BEFORE
update on events for EACH row
execute FUNCTION set_updated_at ();

-- # 14. events_recurrence_exceptions_backup 
create table public.events_recurrence_exceptions_backup (
  id uuid null,
  series_id uuid null,
  parent_event_id uuid null,
  title text null,
  notes text null,
  location text null,
  is_all_day boolean null,
  timezone text null,
  start_at timestamp with time zone null,
  end_at timestamp with time zone null,
  recurrence_rule text null,
  recurrence_end_at timestamp with time zone null,
  recurrence_exceptions jsonb null,
  created_by integer null,
  updated_by integer null,
  is_deleted boolean null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  is_availability_block boolean null,
  blocking_reason text null,
  address_line_1 text null,
  address_line_2 text null,
  city text null,
  state text null,
  zip_code text null,
  country text null,
  category text null
) TABLESPACE pg_default;

-- # 16. genders 
-- genders left global (no tenant_id) intentionally; if customization needed, add tenant_id later
create table public.genders (
  id serial not null,
  name character varying(50) not null,
  display_name character varying(50) not null,
  is_active boolean null default true,
  sort_order integer null default 0,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint genders_pkey primary key (id),
  constraint genders_name_key unique (name)
) TABLESPACE pg_default;

create trigger update_genders_updated_at BEFORE
update on genders for EACH row
execute FUNCTION update_updated_at_column ();

-- # 17. gym_payout_rates 
create table public.gym_payout_rates (
  id bigserial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  duration_minutes integer not null,
  is_member boolean not null,
  rate_cents integer not null,
  effective_from timestamp with time zone not null default now(),
  effective_to timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint gym_payout_rates_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists gym_payout_rates_tenant_idx on public.gym_payout_rates(tenant_id, effective_from desc);

-- # 18. gym_payout_runs 
create table public.gym_payout_runs (
  id bigserial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null,
  total_sessions integer not null default 0,
  total_owed_cents integer not null default 0,
  generated_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint gym_payout_runs_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists gym_payout_runs_tenant_idx on public.gym_payout_runs(tenant_id, period_start desc);

-- # 20. parent_password_reset_tokens 
create table public.parent_password_reset_tokens (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  parent_id integer not null,
  token text not null,
  expires_at timestamp with time zone not null,
  used boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint parent_password_reset_tokens_pkey primary key (id),
  constraint parent_password_reset_tokens_token_key unique (token),
  constraint parent_password_reset_tokens_parent_id_parents_id_fk foreign KEY (parent_id) references parents (id) on delete CASCADE
) TABLESPACE pg_default;
create index if not exists parent_password_reset_tokens_tenant_idx on public.parent_password_reset_tokens(tenant_id);

-- # 21. session 
create table public.session (
  sid character varying not null,
  sess json not null,
  expire timestamp without time zone not null,
  constraint session_pkey primary key (sid)
) TABLESPACE pg_default;

-- # 22. side_quests 
create table public.side_quests (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint side_quests_pkey primary key (id),
  constraint side_quests_name_per_tenant unique (tenant_id, name)
) TABLESPACE pg_default;
create index if not exists side_quests_tenant_idx on public.side_quests(tenant_id);

-- # 23. site_content 
create table public.site_content (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  banner_video text null default ''::text,
  hero_images jsonb null default '[]'::jsonb,
  about jsonb null default '{"bio": "Coach Will brings nearly 10 years of passionate gymnastics instruction to every lesson.", "photo": "", "experience": "Nearly 10 years of coaching experience with athletes of all levels", "certifications": [{"body": "Official certification from USA Gymnastics", "title": "USA Gymnastics Certified"}, {"body": "Current safety and emergency response training", "title": "CPR/First Aid Certified"}, {"body": "Comprehensive background verification completed", "title": "Background Checked"}]}'::jsonb,
  contact jsonb null default '{"email": "Admin@coachwilltumbles.com", "phone": "(585) 755-8122", "address": {"zip": "92056", "city": "Oceanside", "name": "Oceanside Gymnastics", "state": "CA", "street": "1935 Ave. del Oro #A"}}'::jsonb,
  hours jsonb null default '{"friday": {"end": "4:00 PM", "start": "9:00 AM", "available": true}, "monday": {"end": "4:00 PM", "start": "9:00 AM", "available": true}, "sunday": {"end": "", "start": "", "available": false}, "tuesday": {"end": "3:30 PM", "start": "9:00 AM", "available": true}, "saturday": {"end": "2:00 PM", "start": "10:00 AM", "available": true}, "thursday": {"end": "3:30 PM", "start": "9:00 AM", "available": true}, "wednesday": {"end": "4:00 PM", "start": "9:00 AM", "available": true}}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  equipment_images jsonb null default '[]'::jsonb,
  logo jsonb null default '{"text": "", "circle": ""}'::jsonb,
  constraint site_content_pkey primary key (id),
  constraint site_content_one_row_per_tenant unique (tenant_id)
) TABLESPACE pg_default;
create index if not exists site_content_tenant_idx on public.site_content(tenant_id);

create trigger set_site_content_updated_at BEFORE
update on site_content for EACH row
execute FUNCTION update_site_content_updated_at ();

create trigger update_site_content_updated_at BEFORE
update on site_content for EACH row
execute FUNCTION update_updated_at_column ();

-- # 24. site_faqs 
create table public.site_faqs (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  question text not null,
  answer text not null,
  category character varying(100) null default 'General'::character varying,
  display_order integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint site_faqs_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists site_faqs_tenant_idx on public.site_faqs(tenant_id);

create trigger update_site_faqs_updated_at BEFORE
update on site_faqs for EACH row
execute FUNCTION update_updated_at_column ();

-- # 25. site_inquiries 
create table public.site_inquiries (
  id bigserial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  email text not null,
  phone text null,
  athlete_info text null,
  message text not null,
  status text not null default 'new'::text,
  source text null default 'contact_form'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint site_inquiries_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists site_inquiries_tenant_idx on public.site_inquiries(tenant_id, created_at desc);

-- # 26. skill_components 
create table public.skill_components (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  parent_skill_id integer not null,
  component_skill_id integer not null,
  position integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint skill_components_pkey primary key (id),
  constraint skill_components_component_skill_id_skills_id_fk foreign KEY (component_skill_id) references skills (id),
  constraint skill_components_parent_skill_id_skills_id_fk foreign KEY (parent_skill_id) references skills (id)
) TABLESPACE pg_default;
create index if not exists skill_components_tenant_idx on public.skill_components(tenant_id);

create trigger trg_update_is_connected_combo_del
after DELETE on skill_components for EACH row
execute FUNCTION update_is_connected_combo ();

create trigger trg_update_is_connected_combo_ins
after INSERT on skill_components for EACH row
execute FUNCTION update_is_connected_combo ();

-- # 27. skills 
-- (skills table defined earlier as #3a to satisfy FK dependencies)

-- # 28. skills_prerequisites 
create table public.skills_prerequisites (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  skill_id integer not null,
  prerequisite_skill_id integer not null,
  created_at timestamp with time zone not null default now(),
  constraint skills_prerequisites_pkey primary key (id),
  constraint skills_prerequisites_prerequisite_skill_id_skills_id_fk foreign KEY (prerequisite_skill_id) references skills (id),
  constraint skills_prerequisites_skill_id_skills_id_fk foreign KEY (skill_id) references skills (id)
) TABLESPACE pg_default;
create index if not exists skills_prerequisites_tenant_idx on public.skills_prerequisites(tenant_id);

-- # 29. tips 
create table public.tips (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  content text not null,
  sections jsonb null,
  category text not null,
  difficulty text not null,
  video_url text null,
  published_at timestamp without time zone not null default now(),
  constraint tips_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists tips_tenant_idx on public.tips(tenant_id, published_at desc);

-- 30. waivers 
create table public.waivers (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  booking_id integer null,
  athlete_id integer not null,
  parent_id integer not null,
  relationship_to_athlete text null default 'Parent/Guardian'::text,
  signature text not null,
  emergency_contact_number text not null,
  understands_risks boolean null default false,
  agrees_to_policies boolean null default false,
  authorizes_emergency_care boolean null default false,
  allows_photo_video boolean null default true,
  confirms_authority boolean null default false,
  pdf_path text null,
  ip_address text null,
  user_agent text null,
  signed_at timestamp without time zone null default now(),
  email_sent_at timestamp without time zone null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint waivers_pkey primary key (id),
  constraint waivers_athlete_id_athletes_id_fk foreign KEY (athlete_id) references athletes (id),
  constraint waivers_booking_id_bookings_id_fk foreign KEY (booking_id) references bookings (id) on delete set null,
  constraint waivers_parent_id_parents_id_fk foreign KEY (parent_id) references parents (id)
) TABLESPACE pg_default;
create index if not exists waivers_tenant_idx on public.waivers(tenant_id, created_at);

create trigger trg_unset_waiver_signed_on_waiver_delete
after DELETE on waivers for EACH row
execute FUNCTION unset_waiver_signed_on_waiver_delete ();

-- (parents table defined earlier as #3a)

-- # 32. testimonial 
create table public.testimonials (
  id serial not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name character varying(255) not null,
  text text not null,
  rating integer null default 5,
  featured boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint testimonials_pkey primary key (id)
) TABLESPACE pg_default;
create index if not exists testimonials_tenant_idx on public.testimonials(tenant_id);

-- 4. (Optional) RLS Activation Placeholder ----------------------------------
-- NOTE: Enable RLS in a subsequent migration after application layer updated.
-- alter table public.tenants enable row level security;
-- alter table public.lesson_types enable row level security;
-- Example policy template:
-- create policy tenant_isolation_select on public.lesson_types for select using (
--   exists (select 1 from public.tenant_users tu where tu.tenant_id = lesson_types.tenant_id and tu.user_id = auth.uid())
-- );

-- End of multi-tenant schema refactor.

-- Post-creation FK additions (deferred to resolve ordering)
alter table public.athletes
  add constraint athletes_latest_waiver_id_waivers_id_fk foreign key (latest_waiver_id) references public.waivers(id) on delete set null;

create trigger ensure_single_featured_testimonial_trigger BEFORE INSERT
or
update on testimonials for EACH row
execute FUNCTION ensure_single_featured_testimonial ();

create trigger update_testimonials_updated_at BEFORE
update on testimonials for EACH row
execute FUNCTION update_updated_at_column ();