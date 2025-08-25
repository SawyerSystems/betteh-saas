#!/bin/bash

# Apply the database migration to remove waiver_id from bookings table

echo "🗂️  Applying migration: Remove waiver_id column from bookings table"

# Load environment variables if they exist
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$DATABASE_URL" ] && [ -z "$DIRECT_DATABASE_URL" ]; then
    echo "❌ Neither DATABASE_URL nor DIRECT_DATABASE_URL found. Please set an environment variable."
    exit 1
fi

# Use DIRECT_DATABASE_URL if DATABASE_URL is not set
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="$DIRECT_DATABASE_URL"
fi

echo "📡 Executing SQL migration..."

# Use node to execute the migration via Supabase admin client
node -e "
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function runMigration() {
  try {
    console.log('🔍 Checking current waiver_id references...');
    
    // Check existing waiver_id values
    const { data: checkData, error: checkError } = await supabase
      .from('bookings')
      .select('id, waiver_id')
      .not('waiver_id', 'is', null);
    
    if (checkError) {
      console.log('⚠️  Could not check waiver_id references (column might already be removed)');
    } else {
      console.log(\`📊 Found \${checkData.length} bookings with waiver_id references\`);
    }
    
    // Remove the column
    console.log('🔧 Removing waiver_id column from bookings table...');
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE bookings DROP COLUMN IF EXISTS waiver_id;'
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify column is removed
    const { data: verifyData, error: verifyError } = await supabase
      .from('bookings')
      .select('waiver_id')
      .limit(1);
      
    if (verifyError && verifyError.message.includes('column \"waiver_id\" does not exist')) {
      console.log('✅ Verified: waiver_id column has been successfully removed');
    } else if (verifyError) {
      console.log('⚠️  Could not verify removal, but migration likely succeeded');
    } else {
      console.log('⚠️  Column might still exist');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();
"
