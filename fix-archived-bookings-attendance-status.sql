-- Fix archived_bookings.attendance_status to use enum instead of text
-- This aligns the archived_bookings table with the main bookings table

-- Step 1: Add the enum column (temporarily named)
ALTER TABLE archived_bookings 
ADD COLUMN attendance_status_enum attendance_status;

-- Step 2: Migrate data from text column to enum column
UPDATE archived_bookings 
SET attendance_status_enum = attendance_status::attendance_status
WHERE attendance_status IS NOT NULL 
  AND attendance_status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show', 'manual');

-- Step 3: Set default value for any NULL or invalid values
UPDATE archived_bookings 
SET attendance_status_enum = 'pending'
WHERE attendance_status_enum IS NULL;

-- Step 4: Drop the old text column
ALTER TABLE archived_bookings 
DROP COLUMN attendance_status;

-- Step 5: Rename the enum column to the original name
ALTER TABLE archived_bookings 
RENAME COLUMN attendance_status_enum TO attendance_status;

-- Step 6: Set NOT NULL constraint and default
ALTER TABLE archived_bookings 
ALTER COLUMN attendance_status SET NOT NULL,
ALTER COLUMN attendance_status SET DEFAULT 'pending';
