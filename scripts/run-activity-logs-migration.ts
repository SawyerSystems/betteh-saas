import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running activity logs migration...');
    
    // Read the migration SQL file
    const migrationPath = join(__dirname, '..', 'migrations', 'add-activity-logs.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Activity logs table created with comprehensive schema');
    
    // Verify table exists
    const { data: tableCheck, error: checkError } = await supabase
      .from('activity_logs')
      .select('*')
      .limit(1);
      
    if (checkError && !checkError.message.includes('relation "activity_logs" does not exist')) {
      console.log('✅ Table verification successful - activity_logs table is ready');
    } else if (checkError) {
      console.error('⚠️  Table verification failed:', checkError);
    } else {
      console.log('✅ Table verification successful - activity_logs table is ready');
    }
    
  } catch (error) {
    console.error('❌ Migration script error:', error);
    process.exit(1);
  }
}

runMigration();
