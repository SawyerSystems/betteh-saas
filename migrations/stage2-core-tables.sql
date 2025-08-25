-- Stage 2 Migration: Core Tables Only
-- Adding tenant_id to the most critical tables that we know exist in the codebase

-- 1. Ensure we have a default tenant for backfill
INSERT INTO tenants (id, slug, name, status, timezone)
VALUES ('00000000-0000-0000-0000-000000000001', 'legacy-coach', 'Legacy Coach', 'active', 'America/Los_Angeles')
ON CONFLICT (id) DO NOTHING;

-- 2. Add tenant_id columns (with IF NOT EXISTS to avoid errors)

-- Skills table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'skills' AND column_name = 'tenant_id') THEN
        ALTER TABLE skills ADD COLUMN tenant_id UUID;
    END IF;
END $$;

-- Focus areas table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'focus_areas' AND column_name = 'tenant_id') THEN
        ALTER TABLE focus_areas ADD COLUMN tenant_id UUID;
    END IF;
END $$;

-- Waivers table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'waivers' AND column_name = 'tenant_id') THEN
        ALTER TABLE waivers ADD COLUMN tenant_id UUID;
    END IF;
END $$;

-- Availability table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'availability' AND column_name = 'tenant_id') THEN
        ALTER TABLE availability ADD COLUMN tenant_id UUID;
    END IF;
END $$;

-- Testimonials table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'testimonials' AND column_name = 'tenant_id') THEN
        ALTER TABLE testimonials ADD COLUMN tenant_id UUID;
    END IF;
END $$;

-- Site FAQs table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'site_faqs' AND column_name = 'tenant_id') THEN
        ALTER TABLE site_faqs ADD COLUMN tenant_id UUID;
    END IF;
END $$;

-- Site content table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'site_content' AND column_name = 'tenant_id') THEN
        ALTER TABLE site_content ADD COLUMN tenant_id UUID;
    END IF;
END $$;

-- 3. Backfill tenant_id with default value
UPDATE skills SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE focus_areas SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE waivers SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE availability SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE testimonials SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE site_faqs SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE site_content SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- 4. Set NOT NULL constraints (only if column exists and has been backfilled)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'skills' AND column_name = 'tenant_id') THEN
        ALTER TABLE skills ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'focus_areas' AND column_name = 'tenant_id') THEN
        ALTER TABLE focus_areas ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'waivers' AND column_name = 'tenant_id') THEN
        ALTER TABLE waivers ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'availability' AND column_name = 'tenant_id') THEN
        ALTER TABLE availability ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'testimonials' AND column_name = 'tenant_id') THEN
        ALTER TABLE testimonials ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'site_faqs' AND column_name = 'tenant_id') THEN
        ALTER TABLE site_faqs ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'site_content' AND column_name = 'tenant_id') THEN
        ALTER TABLE site_content ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
END $$;

-- 5. Add foreign key constraints (with error handling)
DO $$ 
BEGIN
    -- Skills FK
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'skills_tenant_id_fk') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'skills' AND column_name = 'tenant_id') THEN
            ALTER TABLE skills 
            ADD CONSTRAINT skills_tenant_id_fk 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    -- Focus areas FK
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'focus_areas_tenant_id_fk') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'focus_areas' AND column_name = 'tenant_id') THEN
            ALTER TABLE focus_areas 
            ADD CONSTRAINT focus_areas_tenant_id_fk 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    -- Waivers FK
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'waivers_tenant_id_fk') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'waivers' AND column_name = 'tenant_id') THEN
            ALTER TABLE waivers 
            ADD CONSTRAINT waivers_tenant_id_fk 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    -- Continue for other tables...
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding foreign key constraints: %', SQLERRM;
END $$;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS skills_tenant_idx ON skills(tenant_id);
CREATE INDEX IF NOT EXISTS focus_areas_tenant_idx ON focus_areas(tenant_id);
CREATE INDEX IF NOT EXISTS waivers_tenant_idx ON waivers(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS availability_tenant_idx ON availability(tenant_id, day_of_week);
CREATE INDEX IF NOT EXISTS testimonials_tenant_idx ON testimonials(tenant_id);
CREATE INDEX IF NOT EXISTS site_faqs_tenant_idx ON site_faqs(tenant_id);
CREATE INDEX IF NOT EXISTS site_content_tenant_idx ON site_content(tenant_id);

-- 7. Verification query
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
