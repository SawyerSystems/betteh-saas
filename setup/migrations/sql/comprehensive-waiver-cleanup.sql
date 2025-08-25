-- SIMPLIFIED CLEANUP SCRIPT FOR WAIVER STATUS TRIGGERS
-- This script will drop all triggers and functions causing the error

-- Drop all triggers related to waiver status
DROP TRIGGER IF EXISTS trigger_update_booking_waiver_status_on_booking_athletes ON booking_athletes;
DROP TRIGGER IF EXISTS trigger_update_booking_waiver_status_on_waiver ON waivers;
DROP TRIGGER IF EXISTS update_waiver_status_on_booking_athlete_insert ON booking_athletes;
DROP TRIGGER IF EXISTS update_booking_waiver_status_trigger ON booking_athletes;
DROP TRIGGER IF EXISTS booking_waiver_status_trigger ON booking_athletes;
DROP TRIGGER IF EXISTS waiver_status_trigger ON booking_athletes;

-- Drop the view first since it depends on get_booking_waiver_status
DROP VIEW IF EXISTS booking_waiver_status;

-- Drop functions with CASCADE to ensure all dependencies are removed
DROP FUNCTION IF EXISTS update_booking_waiver_status() CASCADE;
DROP FUNCTION IF EXISTS update_waiver_status_on_booking_athlete_insert() CASCADE;
DROP FUNCTION IF EXISTS get_booking_waiver_status(integer) CASCADE;

-- Create a new function to determine booking waiver status
CREATE OR REPLACE FUNCTION get_booking_waiver_status(booking_id INT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  all_signed BOOLEAN;
  has_athletes BOOLEAN;
BEGIN
  -- Check if the booking has any athletes
  SELECT EXISTS (
    SELECT 1 FROM booking_athletes 
    WHERE booking_id = $1
  ) INTO has_athletes;
  
  -- If no athletes, return 'pending'
  IF NOT has_athletes THEN
    RETURN 'pending';
  END IF;
  
  -- Check if all athletes linked to the booking have signed waivers
  SELECT COALESCE(
    (SELECT BOOL_AND(waiver_signed) 
    FROM athletes a
    JOIN booking_athletes ba ON a.id = ba.athlete_id
    WHERE ba.booking_id = $1), 
    FALSE
  ) INTO all_signed;
  
  -- Return the appropriate status
  IF all_signed THEN
    RETURN 'signed';
  ELSE
    RETURN 'pending';
  END IF;
END;
$$;

-- Create a view to easily see booking waiver status
CREATE VIEW booking_waiver_status AS
SELECT 
  b.id AS booking_id,
  get_booking_waiver_status(b.id) AS waiver_status,
  b.status AS booking_status
FROM bookings b;
