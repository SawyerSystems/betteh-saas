-- SQL to properly handle waiver relationships - attach to athletes, not parents
-- Waivers should be linked to specific athletes since parents may sign multiple waivers

-- Step 1: Create a view to get athletes with their latest waiver status
-- This replaces the need for redundant waiver fields in the athletes table
CREATE OR REPLACE VIEW athletes_with_waiver_status AS
SELECT 
    a.id,
    a.parent_id,
    a.name,
    a.first_name,
    a.last_name,
    a.date_of_birth,
    a.gender,
    a.allergies,
    a.experience,
    a.photo,
    a.created_at,
    a.updated_at,
    -- Latest waiver information for this athlete
    w.id as latest_waiver_id,
    w.signed_at as waiver_signed_at,
    w.signature as waiver_signature,
    w.relationship_to_athlete,
    w.understands_risks,
    w.agrees_to_policies,
    w.authorizes_emergency_care,
    w.allows_photo_video,
    w.confirms_authority,
    w.pdf_path as waiver_pdf_path,
    -- Computed fields
    CASE 
        WHEN w.id IS NOT NULL THEN true 
        ELSE false 
    END as waiver_signed,
    -- Get signer name from the parent
    CONCAT(p.first_name, ' ', p.last_name) as waiver_signer_name,
    p.first_name as parent_first_name,
    p.last_name as parent_last_name,
    p.email as parent_email,
    p.phone as parent_phone
FROM athletes a
LEFT JOIN parents p ON a.parent_id = p.id
LEFT JOIN LATERAL (
    SELECT * 
    FROM waivers w2 
    WHERE w2.athlete_id = a.id 
    ORDER BY w2.signed_at DESC 
    LIMIT 1
) w ON true;

-- Step 2: Create indexes for better performance on waiver lookups by athlete
CREATE INDEX IF NOT EXISTS idx_waivers_athlete_id_signed_at ON waivers(athlete_id, signed_at DESC);
CREATE INDEX IF NOT EXISTS idx_athletes_parent_id ON athletes(parent_id);

-- Step 3: Create a function to check if an athlete has a valid waiver
CREATE OR REPLACE FUNCTION athlete_has_valid_waiver(athlete_id_param integer)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM waivers 
        WHERE athlete_id = athlete_id_param
        AND signed_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a function to get the latest waiver for an athlete
CREATE OR REPLACE FUNCTION get_athlete_latest_waiver(athlete_id_param integer)
RETURNS TABLE (
    waiver_id integer,
    signed_at timestamp,
    signature text,
    relationship_to_athlete text,
    signer_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.signed_at,
        w.signature,
        w.relationship_to_athlete,
        CONCAT(p.first_name, ' ', p.last_name)
    FROM waivers w
    JOIN parents p ON w.parent_id = p.id
    WHERE w.athlete_id = athlete_id_param
    ORDER BY w.signed_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a view for parents showing all their athletes' waiver statuses
CREATE OR REPLACE VIEW parents_with_athletes_waiver_status AS
SELECT 
    p.id as parent_id,
    p.first_name as parent_first_name,
    p.last_name as parent_last_name,
    p.email as parent_email,
    p.phone as parent_phone,
    p.emergency_contact_name,
    p.emergency_contact_phone,
    p.created_at as parent_created_at,
    -- Count of athletes and their waiver statuses
    COUNT(a.id) as total_athletes,
    COUNT(w.id) as athletes_with_waivers,
    COUNT(a.id) - COUNT(w.id) as athletes_without_waivers,
    -- Array of athlete info with waiver status
    array_agg(
        json_build_object(
            'athlete_id', a.id,
            'athlete_name', COALESCE(CONCAT(a.first_name, ' ', a.last_name), a.name),
            'waiver_signed', CASE WHEN w.id IS NOT NULL THEN true ELSE false END,
            'waiver_signed_at', w.signed_at,
            'latest_waiver_id', w.id
        ) ORDER BY a.created_at
    ) FILTER (WHERE a.id IS NOT NULL) as athletes_waiver_info
FROM parents p
LEFT JOIN athletes a ON p.id = a.parent_id
LEFT JOIN LATERAL (
    SELECT w2.id, w2.signed_at
    FROM waivers w2 
    WHERE w2.athlete_id = a.id 
    ORDER BY w2.signed_at DESC 
    LIMIT 1
) w ON a.id IS NOT NULL
GROUP BY p.id, p.first_name, p.last_name, p.email, p.phone, 
         p.emergency_contact_name, p.emergency_contact_phone, p.created_at;

-- Step 6: Add helpful comments
COMMENT ON VIEW athletes_with_waiver_status IS 'View that shows each athlete with their latest waiver information and parent details';
COMMENT ON VIEW parents_with_athletes_waiver_status IS 'View that shows parents with summary of all their athletes waiver statuses';
COMMENT ON FUNCTION athlete_has_valid_waiver(integer) IS 'Returns true if the athlete has at least one signed waiver';
COMMENT ON FUNCTION get_athlete_latest_waiver(integer) IS 'Returns the most recent waiver information for a specific athlete';

-- Verification queries to test the setup:

-- 1. Check athletes with their waiver status:
-- SELECT athlete_name, waiver_signed, waiver_signed_at, parent_first_name 
-- FROM athletes_with_waiver_status 
-- ORDER BY created_at DESC LIMIT 10;

-- 2. Check parents and their athletes' waiver completion status:
-- SELECT parent_first_name, parent_last_name, total_athletes, 
--        athletes_with_waivers, athletes_without_waivers
-- FROM parents_with_athletes_waiver_status 
-- WHERE total_athletes > 0;

-- 3. Find athletes who need waivers:
-- SELECT a.id, COALESCE(CONCAT(a.first_name, ' ', a.last_name), a.name) as athlete_name,
--        p.first_name as parent_first_name, p.email as parent_email
-- FROM athletes a
-- JOIN parents p ON a.parent_id = p.id
-- WHERE NOT athlete_has_valid_waiver(a.id);

-- 4. Test the latest waiver function:
-- SELECT * FROM get_athlete_latest_waiver(1); -- Replace 1 with actual athlete ID
