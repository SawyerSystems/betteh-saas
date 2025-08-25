-- Check all RLS policies in the database
-- This query will show us what policies exist and which ones might be blocking our operations

-- 1. Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    rowsecurity_forced as rls_forced
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Get all RLS policies with details
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    pol.polname as policy_name,
    pol.polcmd as command,
    pol.polpermissive as permissive,
    pol.polroles as roles,
    pol.polqual as qual_expression,
    pol.polwithcheck as with_check_expression
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY c.relname, pol.polname;

-- 3. Check specific policies for parents and bookings tables
SELECT 
    table_name,
    policy_name,
    command,
    definition
FROM information_schema.table_privileges tp
RIGHT JOIN (
    SELECT 
        schemaname || '.' || tablename as full_table_name,
        tablename as table_name
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('parents', 'bookings', 'athletes', 'booking_athletes')
) t ON tp.table_name = t.table_name
WHERE tp.table_schema = 'public' OR tp.table_schema IS NULL;

-- 4. Get detailed policy definitions for problematic tables
\d+ public.parents
\d+ public.bookings

-- 5. Check what roles have access to these tables
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('parents', 'bookings', 'athletes')
ORDER BY table_name, grantee;
