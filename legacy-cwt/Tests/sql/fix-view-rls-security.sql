-- Fix RLS security issues with the views
-- This removes SECURITY DEFINER and ensures proper RLS enforcement
-- Must be run as a regular authenticated user, not as supabase_admin

-- First, drop the existing views completely
DROP VIEW IF EXISTS athletes_with_waiver_status CASCADE;
DROP VIEW IF EXISTS parents_with_waiver_status CASCADE;

-- Enable RLS on the underlying tables if not already enabled
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE waivers ENABLE ROW LEVEL SECURITY;

-- Recreate athletes_with_waiver_status view as a regular user (not admin)
-- This ensures it respects RLS policies
CREATE VIEW athletes_with_waiver_status AS
SELECT 
    a.id,
    a.parent_id,
    a.name,
    a.first_name,
    a.last_name,
    a.allergies,
    a.experience,
    a.photo,
    a.created_at,
    a.updated_at,
    a.date_of_birth,
    a.gender,
    a.latest_waiver_id,
    a.waiver_status,
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

-- Recreate parents_with_waiver_status view as a regular user (not admin)
CREATE VIEW parents_with_waiver_status AS
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

-- Grant appropriate permissions to authenticated users
GRANT SELECT ON athletes_with_waiver_status TO authenticated;
GRANT SELECT ON parents_with_waiver_status TO authenticated;
