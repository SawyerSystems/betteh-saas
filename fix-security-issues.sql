-- Fix Security Issues - Supabase Database Linter
-- This script addresses both RLS disabled tables and Security Definer views

-- =============================================================================
-- PART 1: ENABLE ROW LEVEL SECURITY (RLS) ON TABLES
-- =============================================================================

-- Enable RLS on tables that currently don't have it enabled
-- Note: This will initially block all access until policies are created

-- 1. Session table - Used for Express session storage
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;

-- 2. Cookie consent - User privacy preferences
ALTER TABLE public.cookie_consent ENABLE ROW LEVEL SECURITY;

-- 3. Gym payout rates - Administrative financial data
ALTER TABLE public.gym_payout_rates ENABLE ROW LEVEL SECURITY;

-- 4. Privacy requests - GDPR/CCPA compliance data
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;

-- 5. Athlete skills - Progress tracking data
ALTER TABLE public.athlete_skills ENABLE ROW LEVEL SECURITY;

-- 6. Gym payout runs - Financial processing data
ALTER TABLE public.gym_payout_runs ENABLE ROW LEVEL SECURITY;

-- 7. Skills - Reference data for gymnastics skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- 8. Activity logs - System audit trail
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 9. Progress share links - Shareable athlete progress links
ALTER TABLE public.progress_share_links ENABLE ROW LEVEL SECURITY;

-- 10. Athlete skill videos - Video upload tracking
ALTER TABLE public.athlete_skill_videos ENABLE ROW LEVEL SECURITY;

-- 11. Parent password reset tokens - Authentication security
ALTER TABLE public.parent_password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- 12. Site inquiries - Contact form submissions
ALTER TABLE public.site_inquiries ENABLE ROW LEVEL SECURITY;

-- 13. Skill components - Skills breakdown data
ALTER TABLE public.skill_components ENABLE ROW LEVEL SECURITY;

-- 14. Skills prerequisites - Skills dependency mapping
ALTER TABLE public.skills_prerequisites ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 2: CREATE RLS POLICIES FOR SERVICE ROLE ACCESS
-- =============================================================================

-- Session table policies - Allow service role full access, no public access
CREATE POLICY "session_service_role_access" ON public.session
    FOR ALL USING (auth.role() = 'service_role');

-- Cookie consent policies - Allow service role full access
CREATE POLICY "cookie_consent_service_role_access" ON public.cookie_consent
    FOR ALL USING (auth.role() = 'service_role');

-- Gym payout rates policies - Admin only access via service role
CREATE POLICY "gym_payout_rates_service_role_access" ON public.gym_payout_rates
    FOR ALL USING (auth.role() = 'service_role');

-- Privacy requests policies - Service role access only
CREATE POLICY "privacy_requests_service_role_access" ON public.privacy_requests
    FOR ALL USING (auth.role() = 'service_role');

-- Athlete skills policies - Service role access
CREATE POLICY "athlete_skills_service_role_access" ON public.athlete_skills
    FOR ALL USING (auth.role() = 'service_role');

-- Gym payout runs policies - Service role access only
CREATE POLICY "gym_payout_runs_service_role_access" ON public.gym_payout_runs
    FOR ALL USING (auth.role() = 'service_role');

-- Skills policies - Service role access (reference data)
CREATE POLICY "skills_service_role_access" ON public.skills
    FOR ALL USING (auth.role() = 'service_role');

-- Activity logs policies - Service role access only
CREATE POLICY "activity_logs_service_role_access" ON public.activity_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Progress share links policies - Service role access
CREATE POLICY "progress_share_links_service_role_access" ON public.progress_share_links
    FOR ALL USING (auth.role() = 'service_role');

-- Athlete skill videos policies - Service role access
CREATE POLICY "athlete_skill_videos_service_role_access" ON public.athlete_skill_videos
    FOR ALL USING (auth.role() = 'service_role');

-- Parent password reset tokens policies - Service role only
CREATE POLICY "parent_password_reset_tokens_service_role_access" ON public.parent_password_reset_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Site inquiries policies - Service role access
CREATE POLICY "site_inquiries_service_role_access" ON public.site_inquiries
    FOR ALL USING (auth.role() = 'service_role');

-- Skill components policies - Service role access
CREATE POLICY "skill_components_service_role_access" ON public.skill_components
    FOR ALL USING (auth.role() = 'service_role');

-- Skills prerequisites policies - Service role access
CREATE POLICY "skills_prerequisites_service_role_access" ON public.skills_prerequisites
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- PART 3: FIX SECURITY DEFINER VIEWS
-- =============================================================================

-- Remove SECURITY DEFINER from views by recreating them without it
-- This allows normal RLS and permission checking to work properly

-- 1. Fix booking_waiver_status view
DROP VIEW IF EXISTS public.booking_waiver_status CASCADE;

-- Recreate the get_booking_waiver_status function without SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_booking_waiver_status(booking_id_param INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
-- Removed SECURITY DEFINER - this allows normal RLS to apply
SET search_path = public
AS $$
DECLARE
  all_signed BOOLEAN;
  has_athletes BOOLEAN;
BEGIN
  -- Check if the booking has any athletes
  SELECT EXISTS (
    SELECT 1 FROM booking_athletes 
    WHERE booking_id = booking_id_param
  ) INTO has_athletes;
  
  -- If no athletes, return 'pending'
  IF NOT has_athletes THEN
    RETURN 'pending';
  END IF;
  
  -- Check if all athletes linked to the booking have signed waivers
  SELECT COALESCE(
    (SELECT BOOL_AND(waiver_signed) 
    FROM athletes a
    JOIN booking_athletes ba ON a.id = ba.athlete_id
    WHERE ba.booking_id = booking_id_param), 
    FALSE
  ) INTO all_signed;
  
  -- Return the appropriate status
  IF all_signed THEN
    RETURN 'signed';
  ELSE
    RETURN 'pending';
  END IF;
END;
$$;

-- Recreate booking_waiver_status view without SECURITY DEFINER
CREATE VIEW public.booking_waiver_status AS
SELECT b.id AS booking_id,
       get_booking_waiver_status(b.id) AS waiver_status,
       b.status AS booking_status
FROM bookings b;

-- 2. Fix athletes_with_waiver_status view
DROP VIEW IF EXISTS public.athletes_with_waiver_status CASCADE;

-- Recreate athletes_with_waiver_status view without SECURITY DEFINER
CREATE VIEW public.athletes_with_waiver_status AS
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
    a.waiver_status,
    a.created_at,
    a.updated_at,
    -- Additional waiver details from the waivers table
    w.signed_at as waiver_signed_at,
    w.parent_id as waiver_signature_id,
    w.signature as waiver_signature_data,
    w.relationship_to_athlete,
    w.created_at as waiver_created_at,
    -- Join with parents table to get the signer's name
    CONCAT(p.first_name, ' ', p.last_name) as waiver_signer_name,
    -- Computed fields
    CASE 
        WHEN w.id IS NOT NULL THEN true 
        ELSE false 
    END as waiver_signed,
    -- Computed status based on waiver existence
    CASE 
        WHEN w.id IS NOT NULL THEN 'signed'
        ELSE COALESCE(a.waiver_status, 'pending')
    END as computed_waiver_status
FROM athletes a
LEFT JOIN waivers w ON a.latest_waiver_id = w.id
LEFT JOIN parents p ON w.parent_id = p.id;

-- 3. Fix parents_with_waiver_status view
DROP VIEW IF EXISTS public.parents_with_waiver_status CASCADE;

-- Recreate parents_with_waiver_status view without SECURITY DEFINER
CREATE VIEW public.parents_with_waiver_status AS
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

-- =============================================================================
-- PART 4: GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Grant execute permissions on the function to service role
GRANT EXECUTE ON FUNCTION get_booking_waiver_status(INTEGER) TO service_role;

-- Grant select permissions on views to service role
GRANT SELECT ON public.booking_waiver_status TO service_role;
GRANT SELECT ON public.athletes_with_waiver_status TO service_role;
GRANT SELECT ON public.parents_with_waiver_status TO service_role;

-- =============================================================================
-- VERIFICATION QUERIES (commented out - uncomment to test)
-- =============================================================================

-- Verify RLS is enabled on all tables:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN (
--   'session', 'cookie_consent', 'gym_payout_rates', 'privacy_requests',
--   'athlete_skills', 'gym_payout_runs', 'skills', 'activity_logs',
--   'progress_share_links', 'athlete_skill_videos', 'parent_password_reset_tokens',
--   'site_inquiries', 'skill_components', 'skills_prerequisites'
-- )
-- ORDER BY tablename;

-- Verify policies exist:
-- SELECT schemaname, tablename, policyname, cmd, roles
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Test views work:
-- SELECT COUNT(*) FROM public.booking_waiver_status;
-- SELECT COUNT(*) FROM public.athletes_with_waiver_status;
-- SELECT COUNT(*) FROM public.parents_with_waiver_status;

-- =============================================================================
-- IMPORTANT NOTES
-- =============================================================================

-- 1. After running this script, your application should continue to work 
--    normally since it uses the service role for database operations.

-- 2. The RLS policies created here only allow service_role access. 
--    If you need to add direct database access for users in the future,
--    you'll need to create additional policies.

-- 3. The views are now created without SECURITY DEFINER, which means
--    they will respect RLS policies and normal PostgreSQL permissions.

-- 4. Test thoroughly after applying these changes to ensure your 
--    application continues to function correctly.

-- 5. Monitor the Supabase database linter after applying these changes
--    to confirm all security issues are resolved.
