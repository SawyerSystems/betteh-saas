-- Undo script to remove any changes made to parents table from previous attempts
-- Run this if you need to clean up any columns that were added to parents table

-- Drop any columns that might have been added to parents table
ALTER TABLE parents 
DROP COLUMN IF EXISTS latest_waiver_id CASCADE,
DROP COLUMN IF EXISTS waiver_status CASCADE;

-- Drop any views or functions that were created for parent waiver status
DROP VIEW IF EXISTS parents_with_waiver_status CASCADE;
DROP FUNCTION IF EXISTS update_parent_waiver_status() CASCADE;
DROP TRIGGER IF EXISTS trigger_update_parent_waiver_status ON waivers;

-- Note: This script only removes additions - it doesn't restore any removed columns
-- If you removed columns from parents table, you'll need to restore them manually
