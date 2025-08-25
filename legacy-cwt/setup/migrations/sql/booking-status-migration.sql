-- ============================================================
-- BOOKING STATUS SYSTEM MIGRATION SCRIPT
-- ============================================================
-- 
-- This script updates the booking_status enum type to use only the 
-- six standardized status values and updates all existing records.
--
-- IMPORTANT: Run this script in the Supabase SQL Editor
--
-- Author: GitHub Copilot
-- Date: 2025-07-30
-- ============================================================

-- Step 1: Update any existing records with non-compliant values

-- First, create a report of current status distribution
SELECT 
  status::text, 
  COUNT(*) as count 
FROM bookings 
GROUP BY status 
ORDER BY count DESC;

-- We need to convert to text before updating because we can't directly
-- compare against invalid enum values
ALTER TABLE bookings 
ALTER COLUMN status TYPE text;

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
-- PostgreSQL doesn't allow direct removal of enum values
-- We need to:
-- 1. Create a new enum type
-- 2. Drop default constraint
-- 3. Convert column to text temporarily
-- 4. Update the column to the new type
-- 5. Add back the default constraint
-- 6. Drop old type

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

-- Update the column to the new enum type
-- (No need to alter to text first, we already did that in step 1)
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
SELECT 
  typname AS name, 
  array_agg(enumlabel ORDER BY enumsortorder) AS values
FROM pg_type
JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
WHERE typname = 'booking_status'
GROUP BY typname;

-- Verify data distribution after update
SELECT 
  status, 
  COUNT(*) as count 
FROM bookings 
GROUP BY status 
ORDER BY count DESC;

-- Verify no records have invalid status values
SELECT COUNT(*) as invalid_status_count
FROM bookings
WHERE status NOT IN ('pending', 'paid', 'confirmed', 'completed', 'cancelled', 'failed');
