#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBasicQueries() {
  console.log('🧪 Testing basic database queries...\n');

  try {
    // Test 1: Simple booking select
    console.log('1. Testing basic bookings query...');
    const { data: basicBookings, error: basicError } = await supabase
      .from('bookings')
      .select('id, parent_id, lesson_type_id, waiver_id')
      .limit(5);
    
    if (basicError) {
      console.error('❌ Basic query failed:', basicError);
    } else {
      console.log('✅ Basic query successful:', basicBookings?.length || 0, 'bookings');
    }

    // Test 2: Full select
    console.log('\n2. Testing full bookings select...');
    const { data: fullBookings, error: fullError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (fullError) {
      console.error('❌ Full query failed:', fullError);
    } else {
      console.log('✅ Full query successful');
      if (fullBookings && fullBookings.length > 0) {
        console.log('Sample booking columns:', Object.keys(fullBookings[0]));
      }
    }

    // Test 3: Parent join test
    console.log('\n3. Testing booking with parent join...');
    const { data: joinBookings, error: joinError } = await supabase
      .from('bookings')
      .select(`
        id, parent_id, lesson_type_id,
        parents!inner(id, first_name, last_name)
      `)
      .limit(1);
    
    if (joinError) {
      console.error('❌ Join query failed:', joinError);
    } else {
      console.log('✅ Join query successful');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testBasicQueries();
