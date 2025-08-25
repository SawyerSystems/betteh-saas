-- Undo script for update-parents-waiver-relations.sql
-- This will restore the original parents table structure

-- Step 1: Drop the trigger and function first
DROP TRIGGER IF EXISTS trigger_update_parent_latest_waiver ON waivers;
DROP FUNCTION IF EXISTS update_parent_latest_waiver();

-- Step 2: Drop the view
DROP VIEW IF EXISTS parents_with_waiver_status;

-- Step 3: Drop the indexes
DROP INDEX IF EXISTS idx_parents_latest_waiver_id;
DROP INDEX IF EXISTS idx_waivers_parent_id_signed_at;

-- Step 4: Remove the foreign key column we added
ALTER TABLE parents DROP COLUMN IF EXISTS latest_waiver_id;

-- Step 5: Add back the original waiver fields to parents table if they were removed
-- (Uncomment these if the original script was executed and removed these columns)
-- ALTER TABLE parents ADD COLUMN waiver_signed boolean DEFAULT false;
-- ALTER TABLE parents ADD COLUMN waiver_signed_at timestamp;
-- ALTER TABLE parents ADD COLUMN waiver_signature_name text;

-- Verification: Check that parents table is back to original structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'parents' 
-- ORDER BY ordinal_position;
