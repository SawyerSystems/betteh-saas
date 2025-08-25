-- Step 1: Update any existing records with non-compliant values
-- Map 'manual' and 'reservation-pending' to 'pending'
UPDATE bookings
SET status = 'pending'
WHERE status IN ('manual', 'reservation-pending');

-- Map 'manual-paid', 'reservation-paid' to 'confirmed'
UPDATE bookings
SET status = 'confirmed'
WHERE status IN ('manual-paid', 'reservation-paid');

-- Map 'no-show' to 'completed' (as per our updated logic)
UPDATE bookings
SET status = 'completed'
WHERE status = 'no-show';

-- Map 'reservation-failed' to 'failed'
UPDATE bookings
SET status = 'failed'
WHERE status = 'reservation-failed';

-- Step 2: Alter the enum type
-- Unfortunately, PostgreSQL doesn't allow direct removal of enum values
-- We need to create a new type, update the column, then drop the old type

-- Create a new enum type with the allowed values
CREATE TYPE booking_status_new AS ENUM (
  'pending',
  'paid',
  'confirmed',
  'completed',
  'cancelled',
  'failed'
);

-- Drop the default constraint first
ALTER TABLE bookings 
ALTER COLUMN status DROP DEFAULT;

-- Alter the bookings table to use text temporarily
ALTER TABLE bookings
ALTER COLUMN status TYPE text;

-- Update the column to the new enum type
ALTER TABLE bookings
ALTER COLUMN status TYPE booking_status_new 
USING status::booking_status_new;

-- Add back the default constraint with the new type
ALTER TABLE bookings
ALTER COLUMN status SET DEFAULT 'pending'::booking_status_new;

-- Drop the old enum type
DROP TYPE booking_status;

-- Rename the new enum type to the original name
ALTER TYPE booking_status_new RENAME TO booking_status;

-- Verify the changes
SELECT typname AS name, array_agg(enumlabel ORDER BY enumsortorder) AS values
FROM pg_type
JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
WHERE typname = 'booking_status'
GROUP BY typname;
