-- Stage 2 Migration: Core Tables tenant_id Addition
-- Execute this SQL in Supabase SQL Editor

-- Step 1: Ensure default tenant exists
INSERT INTO tenants (id, slug, name, status, timezone)
VALUES ('00000000-0000-0000-0000-000000000001', 'legacy-coach', 'Legacy Coach', 'active', 'America/Los_Angeles')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add tenant_id columns to core tables
ALTER TABLE skills ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE focus_areas ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE waivers ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE availability ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE site_faqs ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE site_content ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Step 3: Backfill with default tenant
UPDATE skills SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE focus_areas SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE waivers SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE availability SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE testimonials SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE site_faqs SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE site_content SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- Step 4: Set NOT NULL constraints
ALTER TABLE skills ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE focus_areas ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE waivers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE availability ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE testimonials ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE site_faqs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE site_content ALTER COLUMN tenant_id SET NOT NULL;

-- Step 5: Add foreign key constraints
ALTER TABLE skills ADD CONSTRAINT skills_tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE focus_areas ADD CONSTRAINT focus_areas_tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE waivers ADD CONSTRAINT waivers_tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE availability ADD CONSTRAINT availability_tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE testimonials ADD CONSTRAINT testimonials_tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE site_faqs ADD CONSTRAINT site_faqs_tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE site_content ADD CONSTRAINT site_content_tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS skills_tenant_idx ON skills(tenant_id);
CREATE INDEX IF NOT EXISTS focus_areas_tenant_idx ON focus_areas(tenant_id);
CREATE INDEX IF NOT EXISTS waivers_tenant_idx ON waivers(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS availability_tenant_idx ON availability(tenant_id, day_of_week);
CREATE INDEX IF NOT EXISTS testimonials_tenant_idx ON testimonials(tenant_id);
CREATE INDEX IF NOT EXISTS site_faqs_tenant_idx ON site_faqs(tenant_id);
CREATE INDEX IF NOT EXISTS site_content_tenant_idx ON site_content(tenant_id);

-- Verification: Check that tenant_id columns were added
SELECT 
  schemaname,
  tablename,
  attname as column_name
FROM pg_attribute 
JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
WHERE attname = 'tenant_id' 
  AND schemaname = 'public'
  AND tablename IN ('skills', 'focus_areas', 'waivers', 'availability', 'testimonials', 'site_faqs', 'site_content')
ORDER BY tablename;
