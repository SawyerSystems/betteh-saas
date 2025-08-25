-- =====================================================================
-- Stage 2: Add tenant_id to Remaining Tables
-- Propagates tenant_id UUID NOT NULL to all remaining tables that need it
-- and adjusts unique constraints to be per-tenant
-- =====================================================================

-- 1. Add tenant_id to tables that don't have it yet ------------------

-- skills table
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- focus_areas table  
ALTER TABLE focus_areas
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- apparatus table
ALTER TABLE apparatus
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- waivers table
ALTER TABLE waivers
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- archived_waivers table
ALTER TABLE archived_waivers
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- availability table
ALTER TABLE availability
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- booking_athletes table
ALTER TABLE booking_athletes
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- booking_focus_areas table
ALTER TABLE booking_focus_areas
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- athlete_skills table
ALTER TABLE athlete_skills
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- athlete_skill_videos table
ALTER TABLE athlete_skill_videos
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- skills_prerequisites table
ALTER TABLE skills_prerequisites
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- skill_components table
ALTER TABLE skill_components
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- testimonials table
ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- site_faqs table
ALTER TABLE site_faqs
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- site_content table
ALTER TABLE site_content
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- activity_logs table (already has tenant_id as nullable for platform events)
-- No change needed

-- admins table
ALTER TABLE admins
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- parent_auth_codes table
ALTER TABLE parent_auth_codes
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- slot_reservations table
ALTER TABLE slot_reservations
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- blog_email_signups table (this might be global, but adding tenant_id for consistency)
ALTER TABLE blog_email_signups
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 2. Backfill tenant_id with default value for existing data -----------
-- Use a default tenant ID - in production this would be the legacy coach's tenant
-- For now, we'll use a placeholder UUID that should be replaced with actual tenant

DO $$
DECLARE
    default_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Create a default tenant if it doesn't exist
    INSERT INTO tenants (id, slug, name, status, timezone)
    VALUES (default_tenant_id, 'legacy-coach', 'Legacy Coach', 'active', 'America/Los_Angeles')
    ON CONFLICT (id) DO NOTHING;

    -- Backfill tenant_id for all tables
    UPDATE skills SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE focus_areas SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE apparatus SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE waivers SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE archived_waivers SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE availability SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE booking_athletes SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE booking_focus_areas SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE athlete_skills SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE athlete_skill_videos SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE skills_prerequisites SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE skill_components SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE testimonials SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE site_faqs SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE site_content SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE admins SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE parent_auth_codes SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE slot_reservations SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE blog_email_signups SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
END $$;

-- 3. Set NOT NULL constraints after backfill -------------------------

ALTER TABLE skills ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE focus_areas ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE apparatus ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE waivers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE archived_waivers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE availability ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE booking_athletes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE booking_focus_areas ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE athlete_skills ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE athlete_skill_videos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE skills_prerequisites ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE skill_components ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE testimonials ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE site_faqs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE site_content ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE admins ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE parent_auth_codes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE slot_reservations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE blog_email_signups ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Add foreign key constraints ---------------------------------------

ALTER TABLE skills 
ADD CONSTRAINT skills_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE focus_areas 
ADD CONSTRAINT focus_areas_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE apparatus 
ADD CONSTRAINT apparatus_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE waivers 
ADD CONSTRAINT waivers_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE archived_waivers 
ADD CONSTRAINT archived_waivers_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE availability 
ADD CONSTRAINT availability_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE booking_athletes 
ADD CONSTRAINT booking_athletes_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE booking_focus_areas 
ADD CONSTRAINT booking_focus_areas_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE athlete_skills 
ADD CONSTRAINT athlete_skills_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE athlete_skill_videos 
ADD CONSTRAINT athlete_skill_videos_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE skills_prerequisites 
ADD CONSTRAINT skills_prerequisites_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE skill_components 
ADD CONSTRAINT skill_components_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE testimonials 
ADD CONSTRAINT testimonials_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE site_faqs 
ADD CONSTRAINT site_faqs_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE site_content 
ADD CONSTRAINT site_content_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE admins 
ADD CONSTRAINT admins_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE parent_auth_codes 
ADD CONSTRAINT parent_auth_codes_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE slot_reservations 
ADD CONSTRAINT slot_reservations_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE blog_email_signups 
ADD CONSTRAINT blog_email_signups_tenant_id_fk 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 5. Update unique constraints to be per-tenant ----------------------

-- Drop existing unique constraints that should be per-tenant
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_name_key;
ALTER TABLE focus_areas DROP CONSTRAINT IF EXISTS focus_areas_name_key;
ALTER TABLE apparatus DROP CONSTRAINT IF EXISTS apparatus_name_key;
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_email_key;

-- Add new per-tenant unique constraints
ALTER TABLE skills 
ADD CONSTRAINT skills_name_per_tenant UNIQUE (tenant_id, name);

ALTER TABLE focus_areas 
ADD CONSTRAINT focus_areas_name_per_tenant UNIQUE (tenant_id, name);

ALTER TABLE apparatus 
ADD CONSTRAINT apparatus_name_per_tenant UNIQUE (tenant_id, name);

ALTER TABLE admins 
ADD CONSTRAINT admins_email_per_tenant UNIQUE (tenant_id, email);

-- site_content should be one row per tenant
ALTER TABLE site_content 
ADD CONSTRAINT site_content_one_per_tenant UNIQUE (tenant_id);

-- 6. Add tenant-aware indexes for performance -------------------------

CREATE INDEX IF NOT EXISTS skills_tenant_idx ON skills(tenant_id);
CREATE INDEX IF NOT EXISTS focus_areas_tenant_idx ON focus_areas(tenant_id);
CREATE INDEX IF NOT EXISTS apparatus_tenant_idx ON apparatus(tenant_id);
CREATE INDEX IF NOT EXISTS waivers_tenant_idx ON waivers(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS archived_waivers_tenant_idx ON archived_waivers(tenant_id);
CREATE INDEX IF NOT EXISTS availability_tenant_idx ON availability(tenant_id, day_of_week);
CREATE INDEX IF NOT EXISTS booking_athletes_tenant_idx ON booking_athletes(tenant_id, booking_id);
CREATE INDEX IF NOT EXISTS booking_focus_areas_tenant_idx ON booking_focus_areas(tenant_id, booking_id);
CREATE INDEX IF NOT EXISTS athlete_skills_tenant_idx ON athlete_skills(tenant_id, athlete_id);
CREATE INDEX IF NOT EXISTS athlete_skill_videos_tenant_idx ON athlete_skill_videos(tenant_id, athlete_skill_id);
CREATE INDEX IF NOT EXISTS skills_prerequisites_tenant_idx ON skills_prerequisites(tenant_id);
CREATE INDEX IF NOT EXISTS skill_components_tenant_idx ON skill_components(tenant_id);
CREATE INDEX IF NOT EXISTS testimonials_tenant_idx ON testimonials(tenant_id);
CREATE INDEX IF NOT EXISTS site_faqs_tenant_idx ON site_faqs(tenant_id);
CREATE INDEX IF NOT EXISTS site_content_tenant_idx ON site_content(tenant_id);
CREATE INDEX IF NOT EXISTS admins_tenant_idx ON admins(tenant_id);
CREATE INDEX IF NOT EXISTS parent_auth_codes_tenant_idx ON parent_auth_codes(tenant_id);
CREATE INDEX IF NOT EXISTS slot_reservations_tenant_idx ON slot_reservations(tenant_id);
CREATE INDEX IF NOT EXISTS blog_email_signups_tenant_idx ON blog_email_signups(tenant_id);

-- 7. Verification queries (optional) -----------------------------------
-- Uncomment to run verification after migration

-- SELECT 
--   table_name,
--   COUNT(*) as row_count,
--   COUNT(DISTINCT tenant_id) as tenant_count
-- FROM (
--   SELECT 'skills' as table_name, tenant_id FROM skills
--   UNION ALL SELECT 'focus_areas', tenant_id FROM focus_areas
--   UNION ALL SELECT 'apparatus', tenant_id FROM apparatus
--   UNION ALL SELECT 'waivers', tenant_id FROM waivers
--   UNION ALL SELECT 'booking_athletes', tenant_id FROM booking_athletes
--   UNION ALL SELECT 'booking_focus_areas', tenant_id FROM booking_focus_areas
--   UNION ALL SELECT 'athlete_skills', tenant_id FROM athlete_skills
-- ) verification
-- GROUP BY table_name
-- ORDER BY table_name;

-- Stage 2 migration complete
