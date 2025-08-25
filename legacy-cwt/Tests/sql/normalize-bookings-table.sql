-- Comprehensive Bookings Table Normalization
-- This script normalizes the bookings table to use proper foreign key relationships
-- and removes redundant data that should be pulled from related tables

-- 1. Add parent_id foreign key to bookings table
ALTER TABLE bookings ADD COLUMN parent_id INTEGER;

-- 2. Add lesson_type_id foreign key to bookings table
ALTER TABLE bookings ADD COLUMN lesson_type_id INTEGER;

-- 3. Add waiver_id foreign key to track waiver status (nullable)
ALTER TABLE bookings ADD COLUMN waiver_id INTEGER;

-- 4. Update booking_method to use proper enum values
-- First, update existing values to match new enum (only 'online' exists currently)
UPDATE bookings 
SET booking_method = 'Website'
WHERE booking_method = 'online';

-- Now set the column type and default
ALTER TABLE bookings 
ALTER COLUMN booking_method TYPE TEXT,
ALTER COLUMN booking_method SET DEFAULT 'Website';

-- Add constraint for booking_method values
ALTER TABLE bookings ADD CONSTRAINT booking_method_check 
CHECK (booking_method IN ('Website', 'Admin', 'Text', 'Call', 'In-Person', 'Email'));

-- 5. Remove redundant columns that will be pulled via foreign keys
-- First, let's populate the new foreign key columns before dropping redundant ones

-- Populate parent_id by matching existing parent data
UPDATE bookings 
SET parent_id = p.id
FROM parents p
WHERE bookings.parent_email = p.email 
  AND bookings.parent_phone = p.phone;

-- For bookings without matching parents, create parent records
INSERT INTO parents (first_name, last_name, email, phone, emergency_contact_name, emergency_contact_phone, created_at, updated_at)
SELECT DISTINCT 
  b.parent_first_name,
  b.parent_last_name,
  b.parent_email,
  b.parent_phone,
  b.emergency_contact_name,
  b.emergency_contact_phone,
  NOW(),
  NOW()
FROM bookings b
WHERE b.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM parents p 
    WHERE p.email = b.parent_email 
      AND p.phone = b.parent_phone
  );

-- Update bookings with newly created parent_ids
UPDATE bookings 
SET parent_id = p.id
FROM parents p
WHERE bookings.parent_email = p.email 
  AND bookings.parent_phone = p.phone
  AND bookings.parent_id IS NULL;

-- Populate lesson_type_id by matching lesson type names
UPDATE bookings 
SET lesson_type_id = lt.id
FROM lesson_types lt
WHERE bookings.lesson_type = lt.name;

-- For any lesson types that don't exist, create them with default values
INSERT INTO lesson_types (name, duration_minutes, is_private, total_price, reservation_fee, description)
SELECT DISTINCT 
  b.lesson_type,
  60, -- default duration
  true, -- default to private
  0.00, -- will be set via Stripe pricing
  0.00, -- as requested, reservation fee set to 0
  'Auto-created lesson type from booking data'
FROM bookings b
WHERE b.lesson_type_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM lesson_types lt 
    WHERE lt.name = b.lesson_type
  );

-- Update bookings with newly created lesson_type_ids
UPDATE bookings 
SET lesson_type_id = lt.id
FROM lesson_types lt
WHERE bookings.lesson_type = lt.name
  AND bookings.lesson_type_id IS NULL;

-- Set up foreign key constraints
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_parent 
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_lesson_type 
  FOREIGN KEY (lesson_type_id) REFERENCES lesson_types(id) ON DELETE RESTRICT;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_waiver 
  FOREIGN KEY (waiver_id) REFERENCES waivers(id) ON DELETE SET NULL;

-- Make parent_id and lesson_type_id NOT NULL
ALTER TABLE bookings ALTER COLUMN parent_id SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN lesson_type_id SET NOT NULL;

-- 6. Drop redundant columns that are now available via foreign key relations
ALTER TABLE bookings DROP COLUMN IF EXISTS parent_first_name;
ALTER TABLE bookings DROP COLUMN IF EXISTS parent_last_name;
ALTER TABLE bookings DROP COLUMN IF EXISTS parent_email;
ALTER TABLE bookings DROP COLUMN IF EXISTS parent_phone;
ALTER TABLE bookings DROP COLUMN IF EXISTS emergency_contact_name;
ALTER TABLE bookings DROP COLUMN IF EXISTS emergency_contact_phone;

-- Drop lesson_type text column since we now use lesson_type_id
ALTER TABLE bookings DROP COLUMN IF EXISTS lesson_type;

-- Drop amount column since pricing comes from lesson_types table
ALTER TABLE bookings DROP COLUMN IF EXISTS amount;

-- Drop waiver-related columns since they're now tracked via waiver_id
ALTER TABLE bookings DROP COLUMN IF EXISTS waiver_signed;
ALTER TABLE bookings DROP COLUMN IF EXISTS waiver_signed_at;
ALTER TABLE bookings DROP COLUMN IF EXISTS waiver_signature_name;

-- 7. Create a comprehensive view for bookings with all related data
CREATE OR REPLACE VIEW bookings_with_details AS
SELECT 
  b.id,
  b.created_at,
  b.updated_at,
  b.preferred_date,
  b.preferred_time,
  b.status,
  b.payment_status,
  b.attendance_status,
  b.booking_method,
  b.special_requests,
  b.admin_notes,
  b.stripe_session_id,
  b.paid_amount,
  b.reservation_fee_paid,
  b.dropoff_person_name,
  b.dropoff_person_relationship,
  b.dropoff_person_phone,
  b.pickup_person_name,
  b.pickup_person_relationship,
  b.pickup_person_phone,
  
  -- Parent information via foreign key
  p.id as parent_id,
  p.first_name as parent_first_name,
  p.last_name as parent_last_name,
  p.email as parent_email,
  p.phone as parent_phone,
  p.emergency_contact_name,
  p.emergency_contact_phone,
  
  -- Lesson type information via foreign key
  lt.id as lesson_type_id,
  lt.name as lesson_type,
  lt.duration_minutes,
  lt.is_private,
  lt.total_price,
  lt.reservation_fee,
  lt.description as lesson_description,
  
  -- Waiver information via foreign key (nullable)
  w.id as waiver_id,
  CASE WHEN w.id IS NOT NULL THEN true ELSE false END as waiver_signed,
  w.signed_at as waiver_signed_at,
  w.signature as waiver_signature_name,
  
  -- Athletes associated with this booking
  (
    SELECT json_agg(
      json_build_object(
        'id', a.id,
        'name', a.name,
        'firstName', a.first_name,
        'lastName', a.last_name,
        'dateOfBirth', a.date_of_birth,
        'experience', a.experience,
        'allergies', a.allergies
      )
    )
    FROM booking_athletes ba
    JOIN athletes a ON ba.athlete_id = a.id
    WHERE ba.booking_id = b.id
  ) as athletes

FROM bookings b
JOIN parents p ON b.parent_id = p.id
JOIN lesson_types lt ON b.lesson_type_id = lt.id
LEFT JOIN waivers w ON b.waiver_id = w.id;

-- 8. Update the athletes_with_waiver_status view to work with new structure
DROP VIEW IF EXISTS athletes_with_waiver_status;
CREATE OR REPLACE VIEW athletes_with_waiver_status AS
SELECT 
  a.id,
  a.parent_id,
  a.name,
  a.first_name,
  a.last_name,
  a.date_of_birth,
  a.experience,
  a.allergies,
  a.latest_waiver_id,
  a.waiver_status as athlete_waiver_status, -- Use existing column from athletes table
  a.created_at,
  a.updated_at,
  -- Additional waiver details from the waivers table
  w.signed_at as waiver_signed_at,
  w.parent_id as waiver_signature_id,
  w.signature as waiver_signature_data,
  w.created_at as waiver_created_at,
  -- Computed status based on waiver existence
  CASE 
    WHEN w.id IS NOT NULL THEN 'signed'
    ELSE COALESCE(a.waiver_status, 'pending')
  END as computed_waiver_status
FROM athletes a
LEFT JOIN waivers w ON a.latest_waiver_id = w.id;

-- 9. Create function to get booking waiver status
CREATE OR REPLACE FUNCTION get_booking_waiver_status(booking_id_param INTEGER)
RETURNS TABLE(
  booking_id INTEGER,
  athletes_count INTEGER,
  signed_waivers_count INTEGER,
  all_waivers_signed BOOLEAN,
  waiver_ids INTEGER[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    booking_id_param,
    COUNT(DISTINCT ba.athlete_id)::INTEGER as athletes_count,
    COUNT(DISTINCT w.id)::INTEGER as signed_waivers_count,
    COUNT(DISTINCT ba.athlete_id) = COUNT(DISTINCT w.id) as all_waivers_signed,
    ARRAY_AGG(DISTINCT w.id) FILTER (WHERE w.id IS NOT NULL) as waiver_ids
  FROM booking_athletes ba
  LEFT JOIN waivers w ON ba.athlete_id = w.athlete_id
  WHERE ba.booking_id = booking_id_param;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to automatically set waiver_id on bookings when all athletes have signed waivers
CREATE OR REPLACE FUNCTION update_booking_waiver_status()
RETURNS TRIGGER AS $$
DECLARE
  booking_waiver_status RECORD;
BEGIN
  -- Get waiver status for this booking
  SELECT * INTO booking_waiver_status 
  FROM get_booking_waiver_status(
    CASE 
      WHEN TG_OP = 'INSERT' THEN NEW.booking_id
      WHEN TG_OP = 'UPDATE' THEN NEW.booking_id  
      WHEN TG_OP = 'DELETE' THEN OLD.booking_id
    END
  );
  
  -- Update booking waiver_id based on waiver status
  IF booking_waiver_status.all_waivers_signed AND array_length(booking_waiver_status.waiver_ids, 1) > 0 THEN
    -- Use the most recent waiver ID as the booking's waiver reference
    UPDATE bookings 
    SET waiver_id = (
      SELECT MAX(id) 
      FROM waivers w
      JOIN booking_athletes ba ON w.athlete_id = ba.athlete_id
      WHERE ba.booking_id = booking_waiver_status.booking_id
    )
    WHERE id = booking_waiver_status.booking_id;
  ELSE
    -- Clear waiver_id if not all athletes have signed
    UPDATE bookings 
    SET waiver_id = NULL
    WHERE id = booking_waiver_status.booking_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_booking_waiver_status_on_waiver ON waivers;
CREATE TRIGGER trigger_update_booking_waiver_status_on_waiver
  AFTER INSERT OR UPDATE OR DELETE ON waivers
  FOR EACH ROW EXECUTE FUNCTION update_booking_waiver_status();

DROP TRIGGER IF EXISTS trigger_update_booking_waiver_status_on_booking_athletes ON booking_athletes;
CREATE TRIGGER trigger_update_booking_waiver_status_on_booking_athletes
  AFTER INSERT OR UPDATE OR DELETE ON booking_athletes
  FOR EACH ROW EXECUTE FUNCTION update_booking_waiver_status();

-- 11. Grant necessary permissions
GRANT SELECT ON bookings_with_details TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_booking_waiver_status(INTEGER) TO anon, authenticated;

-- 12. Update existing booking_athletes relationships
-- Note: Since athlete name columns were already dropped, we need to work with existing booking_athletes data
-- This step ensures all existing bookings have proper athlete relationships via the junction table

-- First, let's see if there are any bookings without athletes in the junction table
INSERT INTO booking_athletes (booking_id, athlete_id)
SELECT DISTINCT 
  b.id as booking_id,
  a.id as athlete_id
FROM bookings b
CROSS JOIN athletes a
JOIN parents p ON b.parent_id = p.id AND a.parent_id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM booking_athletes ba 
  WHERE ba.booking_id = b.id AND ba.athlete_id = a.id
)
-- Only add athletes that belong to the same parent as the booking
AND a.parent_id = b.parent_id
-- Limit to reasonable number of athletes per booking (max 2 for gymnastics lessons)
AND (
  SELECT COUNT(*) FROM booking_athletes ba2 WHERE ba2.booking_id = b.id
) < 2;

-- 13. Update waiver_id for existing bookings based on athlete waivers
UPDATE bookings 
SET waiver_id = subq.waiver_id
FROM (
  SELECT 
    ba.booking_id,
    MAX(w.id) as waiver_id
  FROM booking_athletes ba
  JOIN waivers w ON ba.athlete_id = w.athlete_id
  GROUP BY ba.booking_id
  HAVING COUNT(DISTINCT ba.athlete_id) = COUNT(DISTINCT w.id) -- All athletes have waivers
) subq
WHERE bookings.id = subq.booking_id;

COMMENT ON TABLE bookings IS 'Normalized bookings table with foreign key relationships to parents, lesson_types, and waivers';
COMMENT ON COLUMN bookings.parent_id IS 'Foreign key to parents table - replaces individual parent fields';
COMMENT ON COLUMN bookings.lesson_type_id IS 'Foreign key to lesson_types table - replaces lesson_type text and amount fields';
COMMENT ON COLUMN bookings.waiver_id IS 'Foreign key to waivers table - null until all associated athletes have signed waivers';
COMMENT ON VIEW bookings_with_details IS 'Comprehensive view of bookings with all related parent, lesson type, waiver, and athlete information';
