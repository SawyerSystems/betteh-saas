#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectTables() {
  console.log('🔍 Inspecting database tables...\n');

  try {
    // Try to fetch one record from each table to see what columns exist
    console.log('--- lesson_types table ---');
    const { data: lessonTypes, error: ltError } = await supabase
      .from('lesson_types')
      .select('*')
      .limit(1);
    
    if (ltError) {
      console.log('lesson_types error:', ltError.message);
    } else {
      console.log('lesson_types columns:', lessonTypes?.[0] ? Object.keys(lessonTypes[0]) : 'No data');
      console.log('lesson_types sample:', lessonTypes?.[0] || 'No data');
    }

    console.log('\n--- parents table ---');
    const { data: parents, error: pError } = await supabase
      .from('parents')
      .select('*')
      .limit(1);
    
    if (pError) {
      console.log('parents error:', pError.message);
    } else {
      console.log('parents columns:', parents?.[0] ? Object.keys(parents[0]) : 'No data');
    }

    console.log('\n--- bookings table ---');
    const { data: bookings, error: bError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (bError) {
      console.log('bookings error:', bError.message);
    } else {
      console.log('bookings columns:', bookings?.[0] ? Object.keys(bookings[0]) : 'No data');
    }

    console.log('\n--- Summary ---');
    console.log('✅ Database connection working');
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
  }
}

inspectTables();
