-- Fix for automatic athlete waiver_signed column update
-- This trigger automatically sets waiver_signed = true when a waiver is created for an athlete

-- Create or replace the function that updates athlete waiver_signed status
CREATE OR REPLACE FUNCTION update_athlete_waiver_signed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the athlete's waiver_signed status to true when a waiver is created
  IF NEW.athlete_id IS NOT NULL THEN
    UPDATE athletes 
    SET 
      waiver_signed = true,
      waiver_status = 'signed',
      latest_waiver_id = NEW.id,
      updated_at = NOW()
    WHERE id = NEW.athlete_id;
    
    -- Log the update for debugging
    RAISE NOTICE 'Updated athlete % waiver_signed status to true after waiver % creation', NEW.athlete_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists and create it again
DROP TRIGGER IF EXISTS trigger_update_athlete_waiver_signed ON waivers;

-- Create the trigger that fires after a waiver is inserted
CREATE TRIGGER trigger_update_athlete_waiver_signed
  AFTER INSERT ON waivers
  FOR EACH ROW
  EXECUTE FUNCTION update_athlete_waiver_signed();

-- Also create a trigger for when waivers are deleted to reset the status
CREATE OR REPLACE FUNCTION reset_athlete_waiver_signed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a waiver is deleted, check if the athlete has any other waivers
  IF OLD.athlete_id IS NOT NULL THEN
    -- Check if there are any other waivers for this athlete
    IF NOT EXISTS (SELECT 1 FROM waivers WHERE athlete_id = OLD.athlete_id AND id != OLD.id) THEN
      -- No other waivers exist, reset the status
      UPDATE athletes 
      SET 
        waiver_signed = false,
        waiver_status = 'pending',
        latest_waiver_id = NULL,
        updated_at = NOW()
      WHERE id = OLD.athlete_id;
      
      RAISE NOTICE 'Reset athlete % waiver_signed status to false after waiver % deletion', OLD.athlete_id, OLD.id;
    ELSE
      -- Other waivers exist, find the latest one
      UPDATE athletes 
      SET 
        latest_waiver_id = (
          SELECT id FROM waivers 
          WHERE athlete_id = OLD.athlete_id 
          ORDER BY created_at DESC 
          LIMIT 1
        ),
        updated_at = NOW()
      WHERE id = OLD.athlete_id;
      
      RAISE NOTICE 'Updated athlete % latest_waiver_id after waiver % deletion', OLD.athlete_id, OLD.id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Drop the delete trigger if it exists and create it again
DROP TRIGGER IF EXISTS trigger_reset_athlete_waiver_signed ON waivers;

-- Create the trigger that fires after a waiver is deleted
CREATE TRIGGER trigger_reset_athlete_waiver_signed
  AFTER DELETE ON waivers
  FOR EACH ROW
  EXECUTE FUNCTION reset_athlete_waiver_signed();

-- Fix existing data: Update athletes who have waivers but waiver_signed = false
UPDATE athletes 
SET 
  waiver_signed = true,
  waiver_status = 'signed',
  latest_waiver_id = (
    SELECT w.id 
    FROM waivers w 
    WHERE w.athlete_id = athletes.id 
    ORDER BY w.created_at DESC 
    LIMIT 1
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM waivers w WHERE w.athlete_id = athletes.id
) AND waiver_signed = false;

-- Test the results
SELECT 
  a.id as athlete_id,
  a.first_name,
  a.last_name,
  a.waiver_signed,
  a.waiver_status,
  a.latest_waiver_id,
  w.id as waiver_id,
  w.created_at as waiver_created_at
FROM athletes a
LEFT JOIN waivers w ON a.latest_waiver_id = w.id
WHERE a.parent_id = 49
ORDER BY a.id;
