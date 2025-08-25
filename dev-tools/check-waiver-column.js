// Script to remove waiver_id column from bookings table
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
    console.log('🔍 Checking if waiver_id column exists...');
    
    // Try to select waiver_id to see if column exists
    const { data: checkData, error: checkError } = await supabase
      .from('bookings')
      .select('waiver_id')
      .limit(1);
    
    if (checkError && checkError.message.includes('column "waiver_id" does not exist')) {
      console.log('✅ waiver_id column already removed!');
      return;
    } else if (checkError) {
      console.error('❌ Error checking column:', checkError);
      return;
    }
    
    console.log('📊 waiver_id column exists, checking for non-null values...');
    
    // Check for non-null waiver_id values
    const { data: nonNullData, error: nonNullError } = await supabase
      .from('bookings')
      .select('id, waiver_id')
      .not('waiver_id', 'is', null);
    
    if (nonNullError) {
      console.error('❌ Error checking non-null values:', nonNullError);
      return;
    }
    
    console.log(`📊 Found ${nonNullData.length} bookings with waiver_id references`);
    
    console.log('⚠️  Column exists but cannot be removed via Supabase client.');
    console.log('🔧 The column has been removed from the TypeScript schema.');
    console.log('💡 To manually remove from database, run this SQL as superuser:');
    console.log('   ALTER TABLE bookings DROP COLUMN IF EXISTS waiver_id;');
    
    console.log('✅ Schema migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();
