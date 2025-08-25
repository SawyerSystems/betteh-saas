-- Fix Security Definer Views - Supabase Database Linter
-- This script addresses the SECURITY DEFINER property on 3 views

-- =============================================================================
-- REMOVE SECURITY DEFINER FROM VIEWS
-- =============================================================================

-- The issue: These views are created with SECURITY DEFINER which bypasses
-- normal RLS and permission checking. We need to recreate them without
-- this property to allow proper security enforcement.

-- =============================================================================
-- 1. Fix booking_waiver_status view
-- =============================================================================

-- First, drop the existing view
DROP VIEW IF EXISTS public.booking_waiver_status CASCADE;

-- Recreate the supporting function without SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_booking_waiver_status(booking_id_param INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
-- REMOVED: SECURITY DEFINER - this allows normal RLS to apply
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

-- Recreate the view without SECURITY DEFINER
CREATE VIEW public.booking_waiver_status AS
SELECT b.id AS booking_id,
       get_booking_waiver_status(b.id) AS waiver_status,
       b.status AS booking_status
FROM bookings b;

-- =============================================================================
-- 2. Fix athletes_with_waiver_status view
-- =============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.athletes_with_waiver_status CASCADE;

-- Recreate the view without SECURITY DEFINER
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

-- =============================================================================
-- 3. Fix parents_with_waiver_status view
-- =============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.parents_with_waiver_status CASCADE;

-- Recreate the view without SECURITY DEFINER
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
-- GRANT PERMISSIONS TO MAINTAIN FUNCTIONALITY
-- =============================================================================

-- Grant execute permission on the function to service role
GRANT EXECUTE ON FUNCTION get_booking_waiver_status(INTEGER) TO service_role;

-- Grant select permissions on views to service role
GRANT SELECT ON public.booking_waiver_status TO service_role;
GRANT SELECT ON public.athletes_with_waiver_status TO service_role;
GRANT SELECT ON public.parents_with_waiver_status TO service_role;

-- =============================================================================
-- VERIFICATION (Uncomment to test after running)
-- =============================================================================

-- Test that views work correctly:
-- SELECT COUNT(*) FROM public.booking_waiver_status;
-- SELECT COUNT(*) FROM public.athletes_with_waiver_status;
-- SELECT COUNT(*) FROM public.parents_with_waiver_status;

-- Check for SECURITY DEFINER properties (should return empty):
-- SELECT 
--   n.nspname as schema_name,
--   p.proname as function_name,
--   CASE p.prosecdef 
--     WHEN true THEN 'SECURITY DEFINER'
--     ELSE 'SECURITY INVOKER'
--   END as security_type
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' 
-- AND p.proname = 'get_booking_waiver_status'
-- AND p.prosecdef = true;

-- =============================================================================
-- NOTES
-- =============================================================================

-- 1. This fix removes SECURITY DEFINER from all three problematic views
-- 2. The views now use normal PostgreSQL permission checking
-- 3. Your application should continue to work since it uses service_role
-- 4. This addresses the specific security linter errors for these views
-- 5. The functionality remains the same, just with proper security enforcement
