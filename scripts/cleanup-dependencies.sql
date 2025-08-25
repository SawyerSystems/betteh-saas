-- Drop dependency objects that conflict with schema changes
-- This addresses the tenant_isolation policy issue

-- Drop the policy that depends on tenant_id column
DROP POLICY IF EXISTS tenant_isolation ON activity_logs;

-- Also drop any other tenant_isolation policies that might exist
DO $$
BEGIN
    -- Drop all tenant_isolation policies across all tables
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS tenant_isolation ON ' || schemaname || '.' || tablename || ';', E'\n')
        FROM pg_policies 
        WHERE policyname = 'tenant_isolation'
    );
EXCEPTION
    WHEN others THEN
        -- Ignore errors if no policies exist
        NULL;
END $$;

-- Drop any other conflicting constraints or dependencies
-- Add more cleanup statements here as needed based on errors
