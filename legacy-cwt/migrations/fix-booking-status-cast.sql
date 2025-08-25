-- Manual fix for booking status column casting issue
-- This addresses the Drizzle error: "column 'status' cannot be cast automatically to type booking_status"

BEGIN;

-- Check current column type
SELECT 
    column_name,
    data_type,
    udt_name,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'status';

-- Apply the PostgreSQL suggested fix if needed
-- This will ensure the column is properly typed as booking_status enum
ALTER TABLE bookings 
ALTER COLUMN status TYPE booking_status 
USING status::booking_status;

-- Verify the change
SELECT 
    column_name,
    data_type,
    udt_name,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'status';

-- Check that all existing data is still valid
SELECT status, COUNT(*) as count
FROM bookings 
GROUP BY status
ORDER BY status;

COMMIT;
