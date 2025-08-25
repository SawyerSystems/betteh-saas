import { supabaseAdmin } from '../server/supabase-client.js';

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies in the database...\n');

  try {
    // Check if RLS is enabled on our key tables
    console.log('1. Checking RLS status on key tables:');
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT 
          tablename,
          rowsecurity as rls_enabled
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('parents', 'bookings', 'athletes', 'booking_athletes')
        ORDER BY tablename;
      `
    });
    
    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
    } else {
      console.table(rlsStatus);
    }

    // Check all policies on these tables
    console.log('\n2. Checking all RLS policies:');
    const { data: policies, error: policiesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT 
          c.relname as table_name,
          pol.polname as policy_name,
          CASE pol.polcmd 
            WHEN 'r' THEN 'SELECT'
            WHEN 'a' THEN 'INSERT' 
            WHEN 'w' THEN 'UPDATE'
            WHEN 'd' THEN 'DELETE'
            WHEN '*' THEN 'ALL'
          END as command,
          pol.polpermissive as permissive,
          pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
          pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
        FROM pg_policy pol
        JOIN pg_class c ON pol.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND c.relname IN ('parents', 'bookings', 'athletes', 'booking_athletes')
        ORDER BY c.relname, pol.polname;
      `
    });

    if (policiesError) {
      console.error('Error checking policies:', policiesError);
    } else {
      console.table(policies);
    }

    // Check current user context
    console.log('\n3. Checking current user context:');
    const { data: userInfo, error: userError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `SELECT current_user, session_user, current_role;`
    });
    
    if (userError) {
      console.error('Error checking user context:', userError);
    } else {
      console.table(userInfo);
    }

  } catch (error) {
    console.error('Failed to check RLS policies:', error);
  }
}

checkRLSPolicies();
