import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAlfredToBooking() {
  console.log('🔍 Adding Alfred (ID:66) to booking 127...');
  
  try {
    // First check if Alfred is already associated
    const { data: existing } = await supabase
      .from('booking_athletes')
      .select('*')
      .eq('booking_id', 127)
      .eq('athlete_id', 66);
    
    if (existing && existing.length > 0) {
      console.log('✅ Alfred is already associated with booking 127');
      return;
    }
    
    // Add Alfred to the booking
    const { data, error } = await supabase
      .from('booking_athletes')
      .insert({
        booking_id: 127,
        athlete_id: 66,
        slot_order: 2  // Second athlete in the booking
      })
      .select();
    
    if (error) {
      console.error('❌ Error adding Alfred to booking:', error);
    } else {
      console.log('✅ Successfully added Alfred to booking 127:', data);
    }
    
    // Verify both athletes are now associated
    const { data: allAthletes } = await supabase
      .from('booking_athletes')
      .select('athlete_id')
      .eq('booking_id', 127);
    
    console.log('🔍 Athletes now associated with booking 127:', allAthletes?.map(a => a.athlete_id));
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addAlfredToBooking();
