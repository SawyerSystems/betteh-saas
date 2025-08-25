-- Remove waiver_id column from bookings table since waivers are now tied to athletes
-- This migration moves the waiver system from booking-based to athlete-based

-- First, check if there are any non-null waiver_id values that might need to be preserved
-- (This is just for logging - the migration will proceed either way)
SELECT 
    COUNT(*) as total_bookings,
    COUNT(waiver_id) as bookings_with_waiver_id,
    COUNT(DISTINCT waiver_id) as unique_waiver_ids
FROM bookings 
WHERE waiver_id IS NOT NULL;

-- Remove the waiver_id column from bookings table
ALTER TABLE bookings DROP COLUMN IF EXISTS waiver_id;

-- Verify the column has been removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'waiver_id';

-- This query should return no rows if successful
