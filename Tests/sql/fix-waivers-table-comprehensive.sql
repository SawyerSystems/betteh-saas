-- Comprehensive Waivers Table Fix
-- This script addresses redundant fields and creates proper foreign key relationships

-- Step 1: Backup current waivers data in case we need to restore anything
CREATE TABLE IF NOT EXISTS waivers_backup AS SELECT * FROM waivers;

-- Step 2: Drop redundant text columns that duplicate foreign key relationships
-- These fields should come from the related parent and athlete tables
ALTER TABLE waivers DROP COLUMN IF EXISTS athlete_name;
ALTER TABLE waivers DROP COLUMN IF EXISTS signer_name;

-- Step 3: Ensure proper foreign key constraints exist and are NOT NULL
-- (These should already exist from schema, but ensuring they're properly set)
ALTER TABLE waivers ALTER COLUMN parent_id SET NOT NULL;
ALTER TABLE waivers ALTER COLUMN athlete_id SET NOT NULL;

-- Step 4: Add proper foreign key constraints if they don't exist
DO $$
BEGIN
    -- Check if parent_id foreign key exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'waivers_parent_id_fkey' 
        AND table_name = 'waivers'
    ) THEN
        ALTER TABLE waivers ADD CONSTRAINT waivers_parent_id_fkey 
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;
    END IF;
    
    -- Check if athlete_id foreign key exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'waivers_athlete_id_fkey' 
        AND table_name = 'waivers'
    ) THEN
        ALTER TABLE waivers ADD CONSTRAINT waivers_athlete_id_fkey 
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;
    END IF;

    -- Check if booking_id foreign key exists (optional field)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'waivers_booking_id_fkey' 
        AND table_name = 'waivers'
    ) THEN
        ALTER TABLE waivers ADD CONSTRAINT waivers_booking_id_fkey 
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 5: Create indexes for performance on foreign keys
CREATE INDEX IF NOT EXISTS idx_waivers_parent_id ON waivers(parent_id);
CREATE INDEX IF NOT EXISTS idx_waivers_athlete_id ON waivers(athlete_id);
CREATE INDEX IF NOT EXISTS idx_waivers_booking_id ON waivers(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waivers_signed_at ON waivers(signed_at);

-- Step 6: Fix emergency_contact_number field
-- Keep this field but ensure it's consistent and properly indexed
-- This field serves as a historical record and backup to parent emergency contact
CREATE INDEX IF NOT EXISTS idx_waivers_emergency_contact ON waivers(emergency_contact_number);

-- Step 7: Clean up any orphaned records (CAREFUL - uncomment only if needed)
-- DELETE FROM waivers WHERE parent_id NOT IN (SELECT id FROM parents);
-- DELETE FROM waivers WHERE athlete_id NOT IN (SELECT id FROM athletes);
-- DELETE FROM waivers WHERE booking_id IS NOT NULL AND booking_id NOT IN (SELECT id FROM bookings);

-- Step 8: Update athletes table to ensure all columns exist for proper data display
-- Add gender column if it doesn't exist
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS gender TEXT;

-- Ensure birth_date column exists (some queries use this name)
-- If date_of_birth exists but birth_date doesn't, create birth_date as alias
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'athletes' AND column_name = 'birth_date'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'athletes' AND column_name = 'date_of_birth'
    ) THEN
        -- Create a view or computed column to alias date_of_birth as birth_date
        -- For now, we'll ensure the API handles both names properly
        NULL;
    END IF;
END $$;

-- Step 9: Update parents table to ensure emergency contact fields exist
ALTER TABLE parents ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE parents ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Step 10: Create a comprehensive view for waiver data with proper relationships
CREATE OR REPLACE VIEW waiver_details AS
SELECT 
    w.id,
    w.athlete_id,
    w.parent_id,
    w.booking_id,
    w.relationship_to_athlete,
    w.signature,
    w.emergency_contact_number,
    w.understands_risks,
    w.agrees_to_policies,
    w.authorizes_emergency_care,
    w.allows_photo_video,
    w.confirms_authority,
    w.pdf_path,
    w.ip_address,
    w.user_agent,
    w.signed_at,
    w.email_sent_at,
    w.created_at,
    w.updated_at,
    -- Athlete information
    a.name AS athlete_name,
    a.first_name AS athlete_first_name,
    a.last_name AS athlete_last_name,
    a.date_of_birth AS athlete_date_of_birth,
    a.birth_date AS athlete_birth_date,
    a.gender AS athlete_gender,
    a.experience AS athlete_experience,
    a.allergies AS athlete_allergies,
    -- Parent information
    p.first_name AS parent_first_name,
    p.last_name AS parent_last_name,
    p.email AS parent_email,
    p.phone AS parent_phone,
    p.emergency_contact_name AS parent_emergency_contact_name,
    p.emergency_contact_phone AS parent_emergency_contact_phone,
    -- Derived fields
    CONCAT(p.first_name, ' ', p.last_name) AS signer_name,
    COALESCE(a.name, CONCAT(a.first_name, ' ', a.last_name)) AS full_athlete_name
FROM waivers w
JOIN athletes a ON w.athlete_id = a.id
JOIN parents p ON w.parent_id = p.id;

-- Step 11: Verification queries to check the updated structure
SELECT 
    'Waivers table structure' AS check_type,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'waivers' 
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 
    'Foreign key constraints' AS check_type,
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

-- Check indexes
SELECT 
    'Indexes' AS check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'waivers';

-- Sample query to test the new structure
SELECT 
    'Sample waiver data' AS check_type,
    wd.id,
    wd.full_athlete_name,
    wd.signer_name,
    wd.parent_email,
    wd.parent_emergency_contact_name,
    wd.parent_emergency_contact_phone,
    wd.athlete_gender,
    wd.athlete_date_of_birth,
    wd.signed_at
FROM waiver_details wd
LIMIT 5;

COMMIT;
