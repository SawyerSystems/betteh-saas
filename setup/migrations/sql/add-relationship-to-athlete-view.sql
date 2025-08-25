-- Drop the existing view
DROP VIEW IF EXISTS athletes_with_waiver_status;

-- Create the updated view with the relationship_to_athlete column
CREATE OR REPLACE VIEW athletes_with_waiver_status AS
SELECT 
    athletes.*,
    latest_waiver.id as latest_waiver_id,
    COALESCE(athlete_waiver_status.status, 'unsigned') as athlete_waiver_status,
    CASE 
        WHEN latest_waiver.id IS NOT NULL THEN 'signed'
        ELSE 'unsigned'
    END as computed_waiver_status,
    latest_waiver.created_at as waiver_created_at,
    latest_waiver.signed_at as waiver_signed_at,
    waiver_signatures.id as waiver_signature_id,
    waiver_signatures.signature_data as waiver_signature_data,
    waiver_signatures.signer_name as waiver_signer_name,
    latest_waiver.relationship_to_athlete as waiver_relationship_to_athlete
FROM 
    athletes
LEFT JOIN LATERAL (
    SELECT w.*
    FROM waivers w
    WHERE w.athlete_id = athletes.id
    ORDER BY w.created_at DESC
    LIMIT 1
) latest_waiver ON true
LEFT JOIN (
    SELECT DISTINCT ON (athlete_id) 
        athlete_id, 
        'signed' as status
    FROM waivers
    WHERE signed_at IS NOT NULL
    ORDER BY athlete_id, created_at DESC
) athlete_waiver_status ON athletes.id = athlete_waiver_status.athlete_id
LEFT JOIN waiver_signatures ON latest_waiver.id = waiver_signatures.waiver_id
ORDER BY athletes.id DESC;
