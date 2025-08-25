#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStorageOperations() {
  console.log('🧪 Testing storage operations...\n');

  try {
    // Test 1: Basic bookings query (exactly like the migration route)
    console.log('1. Testing migration query...');
    const { data: allBookings, error: allBookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, parent_id, lesson_type_id, waiver_id')
      .limit(10);

    if (allBookingsError) {
      console.error('❌ Migration query failed:', allBookingsError);
      return;
    } else {
      console.log('✅ Migration query successful:', allBookings?.length || 0, 'bookings');
    }

    // Test 2: Check if there's something using parent_first_name
    console.log('\n2. Testing problematic query...');
    try {
      const { data: problemQuery, error: problemError } = await supabaseAdmin
        .from('bookings')
        .select('id, parent_first_name')
        .limit(1);
      
      if (problemError) {
        console.error('❌ Problem query failed (expected):', problemError.message);
      } else {
        console.log('✅ Problem query unexpectedly succeeded');
      }
    } catch (err) {
      console.error('❌ Problem query crashed:', err);
    }

    // Test 3: Test getAllBookings method simulation
    console.log('\n3. Testing getAllBookings simulation...');
    const { data: allBookingsData, error: allBookingsDataError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (allBookingsDataError) {
      console.error('❌ getAllBookings simulation failed:', allBookingsDataError);
    } else {
      console.log('✅ getAllBookings simulation successful:', allBookingsData?.length || 0, 'bookings');
      if (allBookingsData && allBookingsData.length > 0) {
        console.log('Sample booking keys:', Object.keys(allBookingsData[0]));
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testStorageOperations();
