-- SQL to update parents table to use foreign key relations to waivers table
-- This removes redundant waiver fields from parents table and creates proper relations

-- Step 1: Add a foreign key column to reference the latest waiver for each parent
ALTER TABLE parents 
ADD COLUMN latest_waiver_id integer REFERENCES waivers(id);

-- Step 2: Create an index for better performance on waiver lookups
CREATE INDEX idx_parents_latest_waiver_id ON parents(latest_waiver_id);
CREATE INDEX idx_waivers_parent_id_signed_at ON waivers(parent_id, signed_at DESC);

-- Step 3: Populate the latest_waiver_id with the most recent waiver for each parent
UPDATE parents 
SET latest_waiver_id = (
    SELECT w.id 
    FROM waivers w 
    WHERE w.parent_id = parents.id 
    ORDER BY w.signed_at DESC 
    LIMIT 1
);

-- Step 4: Remove the redundant waiver fields from parents table
-- Note: You may want to backup this data first if needed
ALTER TABLE parents DROP COLUMN IF EXISTS waiver_signed;
ALTER TABLE parents DROP COLUMN IF EXISTS waiver_signed_at;
ALTER TABLE parents DROP COLUMN IF EXISTS waiver_signature_name;

-- Step 5: Create a view or function to easily get parent waiver status
-- This view will show parents with their latest waiver information
CREATE OR REPLACE VIEW parents_with_waiver_status AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.emergency_contact_name,
    p.emergency_contact_phone,
    p.created_at,
    p.updated_at,
    p.latest_waiver_id,
    -- Waiver information from latest waiver
    w.signed_at as waiver_signed_at,
    w.signature as waiver_signature,
    w.relationship_to_athlete,
    w.understands_risks,
    w.agrees_to_policies,
    w.authorizes_emergency_care,
    w.allows_photo_video,
    w.confirms_authority,
    -- Computed fields
    CASE 
        WHEN w.id IS NOT NULL THEN true 
        ELSE false 
    END as waiver_signed,
    -- Get signer name from the waiver's parent relationship
    CONCAT(p.first_name, ' ', p.last_name) as waiver_signer_name
FROM parents p
LEFT JOIN waivers w ON p.latest_waiver_id = w.id;

-- Step 6: Create a function to update latest_waiver_id when new waivers are signed
CREATE OR REPLACE FUNCTION update_parent_latest_waiver()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the parent's latest_waiver_id when a new waiver is inserted
    UPDATE parents 
    SET latest_waiver_id = NEW.id
    WHERE id = NEW.parent_id
    AND (
        latest_waiver_id IS NULL 
        OR NEW.signed_at > (
            SELECT signed_at 
            FROM waivers 
            WHERE id = latest_waiver_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to automatically update latest_waiver_id
DROP TRIGGER IF EXISTS trigger_update_parent_latest_waiver ON waivers;
CREATE TRIGGER trigger_update_parent_latest_waiver
    AFTER INSERT ON waivers
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_latest_waiver();

-- Step 8: Add comment for documentation
COMMENT ON COLUMN parents.latest_waiver_id IS 'Foreign key to the most recent waiver signed by this parent';
COMMENT ON VIEW parents_with_waiver_status IS 'View that combines parent information with their latest waiver status for easy querying';

-- Verification queries to test the setup:
-- 1. Check parents with their latest waiver info:
-- SELECT * FROM parents_with_waiver_status LIMIT 5;

-- 2. Check waiver count per parent:
-- SELECT p.id, p.first_name, p.last_name, COUNT(w.id) as waiver_count
-- FROM parents p
-- LEFT JOIN waivers w ON p.id = w.parent_id
-- GROUP BY p.id, p.first_name, p.last_name;

-- 3. Test the trigger by inserting a new waiver (replace with real IDs):
-- INSERT INTO waivers (athlete_id, parent_id, signature, emergency_contact_number)
-- VALUES (1, 1, 'test_signature', '555-0123');
