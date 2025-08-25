-- Database Cleanup Based on Usage Analysis
-- Run these commands one by one in Supabase SQL Editor

-- 1. Drop unused junction tables (all have 0 records, never used)
DROP TABLE IF EXISTS booking_apparatus CASCADE;
DROP TABLE IF EXISTS booking_focus_areas CASCADE;
DROP TABLE IF EXISTS booking_side_quests CASCADE;

-- 2. Drop unused logging tables (all have 0 records)
DROP TABLE IF EXISTS booking_logs CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS payment_logs CASCADE;

-- This table stays - it's needed for the parent login system

-- 5. OPTIONAL: Remove unused lookup tables if junction tables aren't planned
-- DROP TABLE IF EXISTS apparatus CASCADE;
-- DROP TABLE IF EXISTS focus_areas CASCADE;
-- DROP TABLE IF EXISTS side_quests CASCADE;

-- 6. Summary of tables being removed:
/*
DROPPING ALL THESE TABLES (all have 0 records, never used):
- booking_apparatus (empty junction table)
- booking_focus_areas (empty junction table)
- booking_side_quests (empty junction table)
- booking_logs (empty logging table)
- email_logs (empty logging table)
- payment_logs (empty logging table)
- slot_reservations (empty reservation table)

KEEPING ONLY:
- parent_auth_codes (essential for authentication)
- apparatus, focus_areas, side_quests (lookup tables - keep for potential future use)
*/
