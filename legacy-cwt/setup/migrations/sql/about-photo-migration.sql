-- Add about.photo field to site_content table
-- This will modify the existing about JSONB to include a photo field with default empty string

UPDATE site_content
SET about = about || '{"photo": ""}'::jsonb
WHERE id = 1;
