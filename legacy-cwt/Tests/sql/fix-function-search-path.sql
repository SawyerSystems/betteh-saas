-- Fix function search path security issue
-- This sets an explicit search_path for the trigger function to prevent security vulnerabilities

-- Drop and recreate the function with proper search_path setting
DROP FUNCTION IF EXISTS update_athlete_waiver_status() CASCADE;

CREATE OR REPLACE FUNCTION update_athlete_waiver_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Explicitly set search_path for security
AS $$
BEGIN
    -- Update the athlete's latest waiver when a waiver is inserted or updated
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE athletes 
        SET 
            latest_waiver_id = NEW.id,
            waiver_status = CASE 
                WHEN NEW.signed_at IS NOT NULL THEN 'signed'
                ELSE 'pending'
            END
        WHERE id = NEW.athlete_id;
        RETURN NEW;
    END IF;
    
    -- Handle deletions
    IF TG_OP = 'DELETE' THEN
        -- Find the next most recent waiver for this athlete
        WITH next_latest AS (
            SELECT id, 
                   CASE WHEN signed_at IS NOT NULL THEN 'signed' ELSE 'pending' END as status
            FROM waivers 
            WHERE athlete_id = OLD.athlete_id 
              AND id != OLD.id
            ORDER BY created_at DESC 
            LIMIT 1
        )
        UPDATE athletes 
        SET 
            latest_waiver_id = COALESCE((SELECT id FROM next_latest), NULL),
            waiver_status = COALESCE((SELECT status FROM next_latest), 'pending')
        WHERE id = OLD.athlete_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_athlete_waiver_status ON waivers;
CREATE TRIGGER trigger_update_athlete_waiver_status
    AFTER INSERT OR UPDATE OR DELETE ON waivers
    FOR EACH ROW
    EXECUTE FUNCTION update_athlete_waiver_status();
