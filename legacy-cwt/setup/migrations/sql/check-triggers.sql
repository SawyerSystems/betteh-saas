-- Check for triggers on booking_athletes table
SELECT 
    tg.tgname AS trigger_name,
    pg_get_triggerdef(tg.oid) AS trigger_definition
FROM pg_trigger tg
JOIN pg_class t ON tg.tgrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND t.relname = 'booking_athletes';

-- Check for triggers on waivers table  
SELECT 
    tg.tgname AS trigger_name,
    pg_get_triggerdef(tg.oid) AS trigger_definition
FROM pg_trigger tg
JOIN pg_class t ON tg.tgrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND t.relname = 'waivers';

-- Check for functions related to booking_waiver_status
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname LIKE '%waiver_status%';
