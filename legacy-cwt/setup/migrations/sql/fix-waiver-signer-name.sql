-- Fix waiver status endpoints to return signer name instead of ID
-- Update the athletes_with_waiver_status view to include waiver signer name

DROP VIEW IF EXISTS athletes_with_waiver_status;
CREATE OR REPLACE VIEW athletes_with_waiver_status AS
SELECT 
  a.id,
  a.parent_id,
  a.name,
  a.first_name,
  a.last_name,
  a.date_of_birth,
  a.gender,
  a.experience,
  a.allergies,
  a.photo,
  a.latest_waiver_id,
  a.waiver_status as athlete_waiver_status,
  a.created_at,
  a.updated_at,
  -- Additional waiver details from the waivers table
  w.signed_at as waiver_signed_at,
  w.parent_id as waiver_signature_id,
  w.signature as waiver_signature_data,
  w.created_at as waiver_created_at,
  -- Join with parents table to get the signer's name
  CONCAT(p.first_name, ' ', p.last_name) as waiver_signer_name,
  -- Computed status based on waiver existence
  CASE 
    WHEN w.id IS NOT NULL THEN 'signed'
    ELSE COALESCE(a.waiver_status, 'pending')
  END as computed_waiver_status
FROM athletes a
LEFT JOIN waivers w ON a.latest_waiver_id = w.id
LEFT JOIN parents p ON w.parent_id = p.id;
