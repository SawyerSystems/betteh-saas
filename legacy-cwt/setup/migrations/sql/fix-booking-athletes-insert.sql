-- Fix for "column reference 'id' is ambiguous" error in booking_athletes table
-- This script checks and fixes potential trigger issues that could cause ambiguity

-- First, let's check if there are any triggers on booking_athletes that might cause issues
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers
WHERE event_object_table = 'booking_athletes';

-- Check for any views or functions that might reference the booking_athletes table with ambiguous id columns
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosrc LIKE '%booking_athletes%' AND p.prosrc LIKE '%id%';

-- Create a function that uses explicit table aliases to avoid ambiguity
CREATE OR REPLACE FUNCTION insert_booking_athlete(
  p_booking_id INT,
  p_athlete_id INT,
  p_slot_order INT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO booking_athletes AS ba (booking_id, athlete_id, slot_order)
  VALUES (p_booking_id, p_athlete_id, p_slot_order);
END;
$$ LANGUAGE plpgsql;

-- Update any existing triggers to use qualified column names
-- Example (modify based on what you find):
-- CREATE OR REPLACE FUNCTION booking_athletes_trigger_function()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   -- Use qualified column names like booking_athletes.id
--   -- instead of just id
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
