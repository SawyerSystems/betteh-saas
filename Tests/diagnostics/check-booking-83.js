import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkBooking() {
  console.log('🔍 Checking for booking ID 83...');
  
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', 83)
    .single();

  if (error) {
    console.error('❌ Error fetching booking:', error);
  } else if (data) {
    console.log('✅ Found booking 83:', {
      id: data.id,
      lessonType: data.lesson_type,
      paymentStatus: data.payment_status,
      attendanceStatus: data.attendance_status,
      athleteId: data.athlete_id,
      parentId: data.parent_id
    });
  } else {
    console.log('❌ No booking found with ID 83');
  }

  // Also check all bookings to see what IDs exist
  const { data: allBookings, error: allError } = await supabaseAdmin
    .from('bookings')
    .select('id, lesson_type, payment_status, attendance_status')
    .order('id', { ascending: true });

  if (allError) {
    console.error('❌ Error fetching all bookings:', allError);
  } else {
    console.log('📊 All booking IDs in database:', allBookings.map(b => b.id));
  }
}

checkBooking().catch(console.error);
