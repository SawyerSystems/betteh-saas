-- Add level column to focus_areas table
ALTER TABLE focus_areas ADD COLUMN level VARCHAR(20) DEFAULT 'intermediate';

-- Update existing records to have a default level
UPDATE focus_areas SET level = 'intermediate' WHERE level IS NULL;

-- Add check constraint to ensure level is one of the valid values
ALTER TABLE focus_areas ADD CONSTRAINT check_level CHECK (level IN ('beginner', 'intermediate', 'advanced'));
