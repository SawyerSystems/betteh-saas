-- Create parent waiver status view
-- This provides parents with a summary of waiver status for all their athletes

-- Create view for parents with their athletes' waiver summary
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
    -- Get the most recent waiver activity date across all athletes
    MAX(w.signed_at) as most_recent_waiver_signed_at,
    MAX(w.created_at) as most_recent_waiver_created_at
FROM parents p
LEFT JOIN athletes a ON p.id = a.parent_id
LEFT JOIN waivers w ON a.latest_waiver_id = w.id
GROUP BY p.id, p.first_name, p.last_name, p.email, p.phone, p.emergency_contact_name, 
         p.emergency_contact_phone, p.created_at, p.updated_at;
