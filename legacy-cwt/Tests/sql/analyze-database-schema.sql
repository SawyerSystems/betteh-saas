-- Comprehensive Database Schema Analysis
-- This script will help understand the current state of all tables, columns, and relationships

-- 1. Get all table information
SELECT 
    'TABLE_INFO' as query_type,
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Get detailed column information for all tables
SELECT 
    'COLUMN_INFO' as query_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. Get foreign key constraints
SELECT 
    'FOREIGN_KEY_INFO' as query_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4. Get primary key constraints
SELECT 
    'PRIMARY_KEY_INFO' as query_type,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 5. Get unique constraints
SELECT 
    'UNIQUE_CONSTRAINT_INFO' as query_type,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 6. Get check constraints (for enums)
SELECT 
    'CHECK_CONSTRAINT_INFO' as query_type,
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 7. Get all views
SELECT 
    'VIEW_INFO' as query_type,
    table_name as view_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 8. Get all functions and stored procedures
SELECT 
    'FUNCTION_INFO' as query_type,
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 9. Get all triggers
SELECT 
    'TRIGGER_INFO' as query_type,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 10. Get all indexes
SELECT 
    'INDEX_INFO' as query_type,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 11. Specific table data samples to understand structure
-- Athletes table
SELECT 
    'ATHLETES_SAMPLE' as query_type,
    id,
    parent_id,
    name,
    first_name,
    last_name,
    date_of_birth,
    waiver_status,
    latest_waiver_id,
    experience,
    created_at
FROM athletes 
LIMIT 5;

-- Parents table
SELECT 
    'PARENTS_SAMPLE' as query_type,
    id,
    first_name,
    last_name,
    email,
    phone,
    emergency_contact_name,
    emergency_contact_phone,
    created_at
FROM parents 
LIMIT 5;

-- Waivers table
SELECT 
    'WAIVERS_SAMPLE' as query_type,
    id,
    parent_id,
    athlete_id,
    booking_id,
    relationship_to_athlete,
    signature,
    emergency_contact_number,
    understands_risks,
    allows_photos,
    allows_video,
    signed_at,
    created_at
FROM waivers 
LIMIT 5;

-- Bookings table sample
SELECT 
    'BOOKINGS_SAMPLE' as query_type,
    id,
    parent_first_name,
    parent_last_name,
    parent_email,
    athlete1_name,
    athlete2_name,
    status,
    payment_status,
    attendance_status,
    created_at
FROM bookings 
LIMIT 5;

-- 12. Check if athlete_waiver_status view exists and its structure
SELECT 
    'ATHLETE_WAIVER_VIEW_CHECK' as query_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'athlete_waiver_status' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 13. Get enum types if they exist
SELECT 
    'ENUM_TYPES' as query_type,
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;
