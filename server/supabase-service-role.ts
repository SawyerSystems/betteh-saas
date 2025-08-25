import { createClient } from '@supabase/supabase-js';

// Create a specialized admin client that definitely uses service role key
const supabaseUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
}

// This client should bypass RLS entirely
export const supabaseServiceRole = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`
    }
  }
});

console.log('✅ Service role client created with key length:', serviceRoleKey.length);
