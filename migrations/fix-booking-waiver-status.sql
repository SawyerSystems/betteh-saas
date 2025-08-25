-- Fix for "column reference booking_id is ambiguous" error in booking_waiver_status view
-- Date: 2025-08-15
-- Issue: The get_booking_waiver_status function had ambiguous column references

-- Step 1: Drop the view first (it depends on the function)
DROP VIEW IF EXISTS booking_waiver_status;

-- Step 2: Drop and recreate the function with proper parameter naming
DROP FUNCTION IF EXISTS get_booking_waiver_status(integer);

CREATE OR REPLACE FUNCTION get_booking_waiver_status(booking_id_param integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    has_athletes boolean;
    all_signed boolean;
BEGIN
    -- Check if booking has any athletes
    SELECT EXISTS (
        SELECT 1 FROM booking_athletes ba
        WHERE ba.booking_id = booking_id_param
    ) INTO has_athletes;
    
    IF NOT has_athletes THEN
        RETURN 'pending';
    END IF;
    
    -- Check if all athletes have signed waivers using the waiver_signed column
    SELECT COALESCE(
        (SELECT BOOL_AND(a.waiver_signed) 
        FROM athletes a
        JOIN booking_athletes ba ON a.id = ba.athlete_id
        WHERE ba.booking_id = booking_id_param), 
        FALSE
    ) INTO all_signed;
    
    IF all_signed THEN
        RETURN 'signed';
    ELSE
        RETURN 'pending';
    END IF;
END;
$$;

-- Step 3: Recreate the view with proper column qualification
CREATE VIEW booking_waiver_status AS
SELECT b.id AS booking_id,
       get_booking_waiver_status(b.id) AS waiver_status,
       b.status AS booking_status
FROM bookings b;

-- The fix:
-- 1. Changed function parameter from 'booking_id' to 'booking_id_param' to avoid naming conflicts
-- 2. Properly qualified all table references with aliases (ba.booking_id, a.waiver_signed)
-- 3. Used the parameter name consistently throughout the function
--
-- This resolves the ambiguous column reference error that was occurring when
-- PostgreSQL couldn't determine if 'booking_id' referred to the function parameter
-- or the column name in the booking_athletes table.
