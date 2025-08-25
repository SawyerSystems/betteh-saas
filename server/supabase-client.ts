import * as schema from "../shared/schema";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://nwdgtdzrcyfmislilucy.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  throw new Error("SUPABASE_ANON_KEY must be set");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set for server operations");
}

console.log('Initializing Supabase clients...');

// DIAGNOSTIC: Log environment variables
console.log('[ENV] SUPABASE_URL:', supabaseUrl.slice(0, 30) + '...');
console.log('[ENV] SUPABASE_ANON_KEY length:', supabaseKey?.length);
console.log('[ENV] SUPABASE_SERVICE_ROLE_KEY length:', supabaseServiceKey?.length);

// Create Supabase client with anon key for frontend operations  
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase admin client with service role for server operations
// This bypasses RLS and has full database access
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  }
});

console.log('✅ Supabase clients initialized with service role for admin operations');

console.log('✅ Supabase clients initialized:');
console.log(`   - Regular client: Using anon key`);
console.log(`   - Admin client: Using service role key`);

// Use direct Supabase client for all operations
console.log('✅ Supabase client initialized for direct API calls');

// Export Supabase client as db for compatibility
export const db = supabase;
export const sql = null;
export { schema };
