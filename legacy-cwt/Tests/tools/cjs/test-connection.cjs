const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZGd0ZHpyY3lmbWlzbGlsdWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYxMzgyOSwiZXhwIjoyMDY3MTg5ODI5fQ.pCOdtCB4DTd7fIV5WqWFQ4TPAX3yj5Wi-ml5WGQH9sI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test with a simple query
    const { data, error } = await supabase
      .from('bookings')
      .select('id, created_at, progress_note, coach_name')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('📊 Sample booking:', data);
    
    // Check if Adventure Log fields exist
    if (data && data.length > 0) {
      const booking = data[0];
      if ('progress_note' in booking && 'coach_name' in booking) {
        console.log('✅ Adventure Log fields are already present!');
      } else {
        console.log('⚠️  Adventure Log fields need to be added.');
      }
    }
    
  } catch (err) {
    console.error('💥 Connection error:', err);
  }
}

testConnection();
