-- Update existing athletes table to use serial IDs and add waiver columns
-- This script updates the current structure to match the new schema

-- Step 1: First, let's update any text IDs to serial if needed
-- Note: Skip this if athletes.id is already serial/integer

-- Step 2: Add the new waiver columns to athletes table
ALTER TABLE athletes 
ADD COLUMN IF NOT EXISTS latest_waiver_id INTEGER,
ADD COLUMN IF NOT EXISTS waiver_status VARCHAR(20) DEFAULT 'pending' CHECK (waiver_status IN ('pending', 'signed', 'expired'));

-- Step 3: Create foreign key constraint after both columns exist
-- Note: We don't add the foreign key reference immediately to avoid circular dependency issues
-- This will be handled by the trigger instead

-- Step 4: Update existing athletes with their latest waiver information  
WITH latest_athlete_waivers AS (
    SELECT DISTINCT ON (athlete_id) 
        athlete_id,
        id as waiver_id,
        CASE 
            WHEN signed_at IS NOT NULL THEN 'signed'
            ELSE 'pending'
        END as status
    FROM waivers 
    WHERE athlete_id IS NOT NULL
    ORDER BY athlete_id, created_at DESC
)
UPDATE athletes 
SET 
    latest_waiver_id = law.waiver_id,
    waiver_status = law.status
FROM latest_athlete_waivers law
WHERE athletes.id = law.athlete_id;

-- Step 5: Create the view and trigger (same as before)
CREATE OR REPLACE VIEW athletes_with_waiver_status AS
SELECT 
    a.*,
    w.signed_at as waiver_signed_at,
    w.parent_id as waiver_signature_id,
    w.signature as waiver_signature_data,
    w.created_at as waiver_created_at,
    CASE 
        WHEN w.signed_at IS NOT NULL THEN 'signed'
        WHEN w.id IS NOT NULL THEN 'pending'
        ELSE 'none'
    END as computed_waiver_status
FROM athletes a
LEFT JOIN waivers w ON a.latest_waiver_id = w.id;

-- Step 6: Create parents view
CREATE OR REPLACE VIEW parents_with_waiver_status AS
SELECT 
    p.*,
    COUNT(a.id) as total_athletes,
    COUNT(CASE WHEN a.waiver_status = 'signed' THEN 1 END) as athletes_with_signed_waivers,
    COUNT(CASE WHEN a.waiver_status = 'pending' THEN 1 END) as athletes_with_pending_waivers,
    COUNT(CASE WHEN a.waiver_status = 'expired' THEN 1 END) as athletes_with_expired_waivers,
    CASE 
        WHEN COUNT(a.id) = 0 THEN 'no_athletes'
        WHEN COUNT(CASE WHEN a.waiver_status = 'signed' THEN 1 END) = COUNT(a.id) THEN 'all_signed'
        WHEN COUNT(CASE WHEN a.waiver_status = 'pending' THEN 1 END) > 0 THEN 'some_pending'
        WHEN COUNT(CASE WHEN a.waiver_status = 'expired' THEN 1 END) > 0 THEN 'some_expired'
        ELSE 'mixed'
    END as overall_waiver_status,
    MAX(w.signed_at) as most_recent_waiver_signed_at,
    MAX(w.created_at) as most_recent_waiver_created_at
FROM parents p
LEFT JOIN athletes a ON p.id = a.parent_id
LEFT JOIN waivers w ON a.latest_waiver_id = w.id
GROUP BY p.id, p.first_name, p.last_name, p.email, p.phone, p.emergency_contact_name, 
         p.emergency_contact_phone, p.created_at, p.updated_at;

-- Step 7: Create the trigger function and trigger
CREATE OR REPLACE FUNCTION update_athlete_waiver_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    
    IF TG_OP = 'DELETE' THEN
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

DROP TRIGGER IF EXISTS trigger_update_athlete_waiver_status ON waivers;
CREATE TRIGGER trigger_update_athlete_waiver_status
    AFTER INSERT OR UPDATE OR DELETE ON waivers
    FOR EACH ROW
    EXECUTE FUNCTION update_athlete_waiver_status();
