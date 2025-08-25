-- Update existing athletes table to include waiver relations
-- This removes the redundant waiver data from parents and properly associates waivers with athletes

-- Step 1: Add waiver-related columns to existing athletes table
ALTER TABLE athletes 
ADD COLUMN IF NOT EXISTS latest_waiver_id INTEGER REFERENCES waivers(id),
ADD COLUMN IF NOT EXISTS waiver_status VARCHAR(20) DEFAULT 'pending' CHECK (waiver_status IN ('pending', 'signed', 'expired'));

-- Step 2: Update existing athletes with their latest waiver information
-- For each athlete, find their most recent waiver and update the athlete record
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

-- Step 3: Create view for athletes with waiver details
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

-- Step 4: Create trigger to automatically update athlete waiver status when waivers change
CREATE OR REPLACE FUNCTION update_athlete_waiver_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_athlete_waiver_status ON waivers;
CREATE TRIGGER trigger_update_athlete_waiver_status
    AFTER INSERT OR UPDATE OR DELETE ON waivers
    FOR EACH ROW
    EXECUTE FUNCTION update_athlete_waiver_status();
