-- Fix Function Search Path Mutable Issues - VERIFIED VERSION
-- This script uses exact function signatures queried from the database

-- =============================================================================
-- DATABASE-VERIFIED FUNCTION SEARCH PATH FIXES
-- =============================================================================

-- All functions below were verified to exist in the database with these exact signatures
-- Generated on: August 19, 2025
-- Source: Direct database query of pg_proc and pg_namespace

-- 1. add_athlete_to_booking function
ALTER FUNCTION public.add_athlete_to_booking(p_booking_id integer, p_athlete_id integer) SET search_path = public;

-- 2. ensure_single_featured_testimonial function
ALTER FUNCTION public.ensure_single_featured_testimonial() SET search_path = public;

-- 3. find_duplicate_bookings function  
ALTER FUNCTION public.find_duplicate_bookings() SET search_path = public;

-- 4. get_booking_athletes function
ALTER FUNCTION public.get_booking_athletes(p_booking_id integer) SET search_path = public;

-- 5. handle_focus_area_other function
ALTER FUNCTION public.handle_focus_area_other() SET search_path = public;

-- 6. insert_booking_athlete function
ALTER FUNCTION public.insert_booking_athlete(p_booking_id integer, p_athlete_id integer, p_slot_order integer) SET search_path = public;

-- 7. remove_athlete_from_booking function
ALTER FUNCTION public.remove_athlete_from_booking(p_booking_id integer, p_athlete_id integer) SET search_path = public;

-- 8. unset_waiver_signed_on_waiver_delete function
ALTER FUNCTION public.unset_waiver_signed_on_waiver_delete() SET search_path = public;

-- 9. update_is_connected_combo function
ALTER FUNCTION public.update_is_connected_combo() SET search_path = public;

-- 10. update_site_content_updated_at function
ALTER FUNCTION public.update_site_content_updated_at() SET search_path = public;

-- 11. update_updated_at_column function
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Uncomment to verify all functions now have search_path set:
/*
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN 'search_path=public' = ANY(p.proconfig) THEN '✅ FIXED'
        WHEN p.proconfig IS NULL THEN '❌ STILL MUTABLE'
        ELSE 'OTHER: ' || array_to_string(p.proconfig, ', ')
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN (
    'add_athlete_to_booking',
    'ensure_single_featured_testimonial', 
    'find_duplicate_bookings',
    'get_booking_athletes',
    'handle_focus_area_other',
    'insert_booking_athlete',
    'remove_athlete_from_booking',
    'unset_waiver_signed_on_waiver_delete',
    'update_is_connected_combo',
    'update_site_content_updated_at',
    'update_updated_at_column'
)
ORDER BY p.proname;
*/

-- =============================================================================
-- SUMMARY
-- =============================================================================

-- ✅ All 11 functions identified by the security linter have been fixed
-- ✅ Each function now has search_path = public set explicitly
-- ✅ This prevents search path manipulation security attacks
-- ✅ Function signatures verified against actual database schema
-- ✅ No SECURITY DEFINER functions found in this batch (those are separate)

-- Expected result: All "Function Search Path Mutable" warnings should be resolved
-- in the Supabase database linter after running this script.
