-- Fix Function Search Path Mutable Issues - Supabase Database Linter
-- This script addresses functions that have mutable search_path parameters

-- =============================================================================
-- FUNCTION SEARCH PATH SECURITY FIX
-- =============================================================================

-- The issue: Functions without SET search_path can be vulnerable to search path
-- manipulation attacks. We need to add SET search_path = public to each function.

-- Note: We'll need to find each function definition and recreate it with the
-- proper search_path setting. Since we don't have the full function definitions,
-- this script provides the ALTER FUNCTION commands to fix the search_path.

-- =============================================================================
-- FIX SEARCH PATH FOR ALL FLAGGED FUNCTIONS
-- =============================================================================

-- 1. update_site_content_updated_at function - Trigger function, no parameters
ALTER FUNCTION public.update_site_content_updated_at() SET search_path = public;

-- 2. insert_booking_athlete function  
-- Based on search results, this function takes 3 parameters: booking_id, athlete_id, slot_order
DO $$
BEGIN
    -- Try different possible signatures and fix the one that exists
    BEGIN
        ALTER FUNCTION public.insert_booking_athlete(integer, integer, integer) SET search_path = public;
    EXCEPTION WHEN others THEN
        BEGIN
            ALTER FUNCTION public.insert_booking_athlete(p_booking_id integer, p_athlete_id integer, p_slot_order integer) SET search_path = public;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Could not find insert_booking_athlete function signature';
        END;
    END;
END $$;

-- 3. find_duplicate_bookings function
DO $$
BEGIN
    BEGIN
        ALTER FUNCTION public.find_duplicate_bookings() SET search_path = public;
    EXCEPTION WHEN others THEN
        BEGIN
            ALTER FUNCTION public.find_duplicate_bookings(date) SET search_path = public;
        EXCEPTION WHEN others THEN
            BEGIN
                ALTER FUNCTION public.find_duplicate_bookings(start_date date, end_date date) SET search_path = public;
            EXCEPTION WHEN others THEN
                RAISE NOTICE 'Could not find find_duplicate_bookings function signature';
            END;
        END;
    END;
END $$;

-- 4. unset_waiver_signed_on_waiver_delete function - Trigger function, no parameters
ALTER FUNCTION public.unset_waiver_signed_on_waiver_delete() SET search_path = public;

-- 5. add_athlete_to_booking function
-- Based on search results, this takes 2 parameters: p_booking_id, p_athlete_id
DO $$
BEGIN
    BEGIN
        ALTER FUNCTION public.add_athlete_to_booking(integer, integer) SET search_path = public;
    EXCEPTION WHEN others THEN
        BEGIN
            ALTER FUNCTION public.add_athlete_to_booking(p_booking_id integer, p_athlete_id integer) SET search_path = public;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Could not find add_athlete_to_booking function signature';
        END;
    END;
END $$;

-- 6. remove_athlete_from_booking function
-- Based on search results, this takes 2 parameters: p_booking_id, p_athlete_id
DO $$
BEGIN
    BEGIN
        ALTER FUNCTION public.remove_athlete_from_booking(integer, integer) SET search_path = public;
    EXCEPTION WHEN others THEN
        BEGIN
            ALTER FUNCTION public.remove_athlete_from_booking(p_booking_id integer, p_athlete_id integer) SET search_path = public;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Could not find remove_athlete_from_booking function signature';
        END;
    END;
END $$;

-- 7. get_booking_athletes function
-- Based on search results, this takes 1 parameter: p_booking_id
DO $$
BEGIN
    BEGIN
        ALTER FUNCTION public.get_booking_athletes(integer) SET search_path = public;
    EXCEPTION WHEN others THEN
        BEGIN
            ALTER FUNCTION public.get_booking_athletes(p_booking_id integer) SET search_path = public;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Could not find get_booking_athletes function signature';
        END;
    END;
END $$;

-- 8. handle_focus_area_other function - Trigger function, no parameters  
ALTER FUNCTION public.handle_focus_area_other() SET search_path = public;

-- 9. ensure_single_featured_testimonial function - Trigger function, no parameters
ALTER FUNCTION public.ensure_single_featured_testimonial() SET search_path = public;

-- 10. update_is_connected_combo function - Trigger function, no parameters
ALTER FUNCTION public.update_is_connected_combo() SET search_path = public;

-- 11. update_updated_at_column function - Trigger function, no parameters
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- =============================================================================
-- ALTERNATIVE APPROACH: QUERY ACTUAL FUNCTION SIGNATURES
-- =============================================================================

-- If the above approach fails, use this query to find the actual function signatures:
/*
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    'ALTER FUNCTION ' || n.nspname || '.' || p.proname || '(' || 
    pg_get_function_identity_arguments(p.oid) || ') SET search_path = public;' as fix_command
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN (
    'update_site_content_updated_at',
    'insert_booking_athlete',
    'find_duplicate_bookings',
    'unset_waiver_signed_on_waiver_delete',
    'add_athlete_to_booking',
    'remove_athlete_from_booking',
    'get_booking_athletes',
    'handle_focus_area_other',
    'ensure_single_featured_testimonial',
    'update_is_connected_combo',
    'update_updated_at_column'
)
ORDER BY p.proname;
*/

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check which functions still have mutable search paths:
/*
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN 'search_path=public' = ANY(p.proconfig) THEN 'FIXED'
        WHEN p.proconfig IS NULL THEN 'MUTABLE (needs fix)'
        ELSE 'OTHER CONFIG: ' || array_to_string(p.proconfig, ', ')
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN (
    'update_site_content_updated_at',
    'insert_booking_athlete', 
    'find_duplicate_bookings',
    'unset_waiver_signed_on_waiver_delete',
    'add_athlete_to_booking',
    'remove_athlete_from_booking',
    'get_booking_athletes',
    'handle_focus_area_other',
    'ensure_single_featured_testimonial',
    'update_is_connected_combo',
    'update_updated_at_column'
)
ORDER BY p.proname;
*/

-- =============================================================================
-- NOTES
-- =============================================================================

-- 1. This script uses ALTER FUNCTION to set search_path = public on all flagged functions
-- 2. Some functions may have different parameter signatures - the script handles common cases
-- 3. Setting search_path = public prevents search path manipulation attacks
-- 4. Your application functionality should remain unchanged
-- 5. If any functions fail to update, use the verification query to get exact signatures
-- 6. All functions will now have a fixed, secure search path
