-- site-content-logo-schema.sql

-- Add logo JSONB column to site_content table
ALTER TABLE site_content 
ADD COLUMN IF NOT EXISTS logo JSONB DEFAULT '{"circle": "", "text": ""}';

-- Update any existing rows to have the default value if they don't already have it
UPDATE site_content 
SET logo = '{"circle": "", "text": ""}' 
WHERE logo IS NULL;

-- Ensure the updated_at column gets updated
CREATE OR REPLACE FUNCTION update_site_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_site_content_updated_at' 
        AND tgrelid = 'site_content'::regclass
    ) THEN
        CREATE TRIGGER set_site_content_updated_at
        BEFORE UPDATE ON site_content
        FOR EACH ROW
        EXECUTE FUNCTION update_site_content_updated_at();
    END IF;
END
$$;
