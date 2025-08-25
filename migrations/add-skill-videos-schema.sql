-- Add video reference capabilities to skills table
-- Run this SQL in Supabase SQL editor

ALTER TABLE skills 
ADD COLUMN reference_videos JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the column structure
COMMENT ON COLUMN skills.reference_videos IS 'JSON array of video references: [{"type": "url|upload", "url": "string", "title": "string", "description": "string", "uploadedAt": "timestamp"}]';

-- Create index for querying skills with videos
CREATE INDEX idx_skills_reference_videos ON skills USING GIN (reference_videos);
