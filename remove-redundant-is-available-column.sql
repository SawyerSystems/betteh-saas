-- Fix: Remove redundant is_available column from events table
-- This column is confusing and redundant with is_availability_block

-- Step 1: Check what columns currently exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND column_name IN ('is_available', 'is_availability_block')
ORDER BY column_name;

-- Step 2: Check current events (only if is_availability_block exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'is_availability_block'
    ) THEN
        RAISE NOTICE 'Checking events with is_availability_block column...';
        PERFORM 1; -- Placeholder - actual query will be run separately if needed
    ELSE
        RAISE NOTICE 'is_availability_block column does not exist yet';
    END IF;
END $$;

-- Show current event stats if is_availability_block column exists
SELECT 
    COUNT(*) as total_events,
    COALESCE(SUM(CASE WHEN is_availability_block = true THEN 1 END), 0) as blocking_events,
    COALESCE(SUM(CASE WHEN is_availability_block = false THEN 1 END), 0) as non_blocking_events
FROM events
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'is_availability_block'
);

-- Step 3: Drop the redundant is_available column (safe if it doesn't exist)
ALTER TABLE events DROP COLUMN IF EXISTS is_available;

-- Step 4: Verify the cleanup
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND column_name IN ('is_available', 'is_availability_block')
ORDER BY column_name;

-- Add comment to clarify the remaining column
COMMENT ON COLUMN events.is_availability_block IS 'True if this event blocks availability for bookings. False for informational events.';

SELECT 'Successfully removed redundant is_available column from events table' as result;
