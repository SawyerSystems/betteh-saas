-- Fix Waivers Table Structure
-- This SQL script removes redundant fields and creates proper foreign key relationships

-- Step 1: Drop redundant columns from waivers table
-- Remove text fields that duplicate foreign key relationships
ALTER TABLE waivers DROP COLUMN IF EXISTS athlete_name;
ALTER TABLE waivers DROP COLUMN IF EXISTS signer_name;

-- Step 2: Ensure proper foreign key constraints exist
-- Make sure parent_id and athlete_id are required foreign keys
ALTER TABLE waivers ALTER COLUMN parent_id SET NOT NULL;
ALTER TABLE waivers ALTER COLUMN athlete_id SET NOT NULL;

-- Step 3: Add proper foreign key constraints if they don't exist
-- (These should already exist from schema, but ensuring they're properly set)
DO $$
BEGIN
    -- Check if parent_id foreign key exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'waivers_parent_id_fkey' 
        AND table_name = 'waivers'
    ) THEN
        ALTER TABLE waivers ADD CONSTRAINT waivers_parent_id_fkey 
        FOREIGN KEY (parent_id) REFERENCES parents(id);
    END IF;
    
    -- Check if athlete_id foreign key exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'waivers_athlete_id_fkey' 
        AND table_name = 'waivers'
    ) THEN
        ALTER TABLE waivers ADD CONSTRAINT waivers_athlete_id_fkey 
        FOREIGN KEY (athlete_id) REFERENCES athletes(id);
    END IF;
END $$;

-- Step 4: Update emergency_contact_number to be consistent
-- Since emergency contact info should come from parent relationship,
-- we could either remove this column or keep it for record-keeping
-- For now, keeping it but ensuring it's consistent with parent data

-- Step 5: Create an index for performance on foreign keys
CREATE INDEX IF NOT EXISTS idx_waivers_parent_id ON waivers(parent_id);
CREATE INDEX IF NOT EXISTS idx_waivers_athlete_id ON waivers(athlete_id);
CREATE INDEX IF NOT EXISTS idx_waivers_booking_id ON waivers(booking_id);

-- Step 6: Clean up any orphaned records (optional - be careful with this in production)
-- Uncomment the following lines if you want to remove orphaned waivers
-- DELETE FROM waivers WHERE parent_id NOT IN (SELECT id FROM parents);
-- DELETE FROM waivers WHERE athlete_id NOT IN (SELECT id FROM athletes);
-- DELETE FROM waivers WHERE booking_id IS NOT NULL AND booking_id NOT IN (SELECT id FROM bookings);

-- Verification queries to check the updated structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'waivers' 
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'waivers';
