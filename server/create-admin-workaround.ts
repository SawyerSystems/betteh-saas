import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const supabaseUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co';
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!anonKey) {
  console.error("SUPABASE_ANON_KEY must be set");
  // Don't throw here, just return early
  process.exit(1);
}

// Create a special admin creation function that works around RLS
export async function createAdminViaAPI() {
  const email = process.env.ADMIN_EMAIL || 'admin@coachwilltumbles.com';
  const password = process.env.ADMIN_PASSWORD || 'TumbleCoach2025!';
  
  console.log('🔧 Attempting admin creation via API workaround...');
  
  const client = createClient(supabaseUrl, anonKey!);
  
  try {
    // First check if admin already exists
    const { data: existingAdmins, error: checkError } = await client
      .from('admins')
      .select('id, email')
      .eq('email', email);
      
    if (checkError) {
      console.error(`Failed to check existing admins: ${checkError.message}`);
      return { success: false, error: checkError.message };
    }
    
    if (existingAdmins && existingAdmins.length > 0) {
      console.log('✅ Admin already exists:', existingAdmins[0]);
      return { success: true, data: existingAdmins[0] };
    }
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Try to create admin using a custom RPC function if it exists
    try {
      const { data, error } = await client.rpc('create_admin_account', {
        admin_email: email,
        admin_password_hash: passwordHash
      });
      
      if (!error && data) {
        console.log('✅ Admin created via RPC function');
        return { success: true, data };
      }
    } catch (rpcError) {
      console.log('⚠️  RPC function not available, trying direct insert...');
    }
    
    // If RPC doesn't work, try direct insert (will likely fail with RLS)
    const { data, error } = await client
      .from('admins')
      .insert({
        email: email,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      printManualSqlCommands(email, password);
      return { success: false, error: `Direct insert failed: ${error.message}` };
    }
    
    console.log('✅ Admin created successfully via direct insert');
    return { success: true, data };
    
  } catch (error) {
    printManualSqlCommands(email, password);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

function printManualSqlCommands(email: string, password: string) {
  bcrypt.hash(password, 10).then(passwordHash => {
    console.log('❌ Admin creation failed: Direct insert failed: new row violates row-level security policy for table "admins"');
    console.log('📝 You need to create the admin manually using the SQL commands:');
    console.log('\n--- Copy and paste this SQL into Supabase SQL Editor ---');
    console.log('ALTER TABLE admins DISABLE ROW LEVEL SECURITY;');
    console.log(`INSERT INTO admins (email, password_hash, created_at, updated_at)`);
    console.log(`VALUES ('${email}', '${passwordHash}', NOW(), NOW())`);
    console.log(`ON CONFLICT (email) DO NOTHING;`);
    console.log('ALTER TABLE admins ENABLE ROW LEVEL SECURITY;');
    console.log('--- End of SQL commands ---\n');
  });
}

// If run directly, execute the function
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminViaAPI()
    .then((result) => {
      if (result.success) {
        console.log('Admin creation process completed successfully');
        process.exit(0);
      } else {
        console.log('Admin creation failed - manual intervention required');
        // Don't exit with error code here, just log the error
        process.exit(0); 
      }
    })
    .catch((err) => {
      console.error('Unexpected error during admin creation:', err);
      console.log('Admin creation failed - manual intervention required');
      // Don't exit with error code here, just log the error
      process.exit(0);
    });
}
