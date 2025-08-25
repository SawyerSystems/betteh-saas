-- SQL to update the schema for safety columns to never be null

-- First, check for any existing null values and replace them with defaults
UPDATE bookings
SET dropoff_person_name = 'Parent' 
WHERE dropoff_person_name IS NULL;

UPDATE bookings
SET dropoff_person_relationship = 'Parent' 
WHERE dropoff_person_relationship IS NULL;

UPDATE bookings
SET dropoff_person_phone = COALESCE(
  (SELECT phone FROM parents WHERE id = bookings.parent_id),
  '000-000-0000'
)
WHERE dropoff_person_phone IS NULL;

UPDATE bookings
SET pickup_person_name = 'Parent' 
WHERE pickup_person_name IS NULL;

UPDATE bookings
SET pickup_person_relationship = 'Parent' 
WHERE pickup_person_relationship IS NULL;

UPDATE bookings
SET pickup_person_phone = COALESCE(
  (SELECT phone FROM parents WHERE id = bookings.parent_id),
  '000-000-0000'
)
WHERE pickup_person_phone IS NULL;

-- Now add NOT NULL constraints to the columns
ALTER TABLE bookings 
  ALTER COLUMN dropoff_person_name SET NOT NULL,
  ALTER COLUMN dropoff_person_relationship SET NOT NULL,
  ALTER COLUMN dropoff_person_phone SET NOT NULL,
  ALTER COLUMN pickup_person_name SET NOT NULL,
  ALTER COLUMN pickup_person_relationship SET NOT NULL,
  ALTER COLUMN pickup_person_phone SET NOT NULL;

-- Set safety_verification_signed to true for all existing bookings
UPDATE bookings
SET safety_verification_signed = true
WHERE safety_verification_signed = false OR safety_verification_signed IS NULL;

-- Ensure safety_verification_signed is always not null and defaults to false for new bookings
ALTER TABLE bookings 
  ALTER COLUMN safety_verification_signed SET NOT NULL,
  ALTER COLUMN safety_verification_signed SET DEFAULT false;
