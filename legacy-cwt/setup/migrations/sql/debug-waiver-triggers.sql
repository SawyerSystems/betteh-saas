-- WAIVER STATUS TRIGGER DEBUG SCRIPT

-- Check for all triggers in the database
SELECT 
    t.relname AS table_name,
    tg.tgname AS trigger_name,
    pg_get_triggerdef(tg.oid) AS trigger_definition
FROM pg_trigger tg
JOIN pg_class t ON tg.tgrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.relname, tg.tgname;

-- Check for all functions that might reference waiver_status
SELECT 
    p.proname AS function_name,
    p.proargtypes::regtype[] AS argument_types,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%waiver_status%';

-- Check for all functions that might be used by triggers
SELECT 
    p.proname AS function_name,
    p.proargtypes::regtype[] AS argument_types,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_trigger tg ON tg.tgfoid = p.oid
WHERE n.nspname = 'public';

-- Check the structure of the booking_athletes table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'booking_athletes'
ORDER BY 
    ordinal_position;

-- Check the structure of the bookings table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'bookings'
ORDER BY 
    ordinal_position;

-- Check for foreign keys in booking_athletes
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'booking_athletes';
