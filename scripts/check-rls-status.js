#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLSStatus() {
  try {
    console.log('🔍 Checking RLS Status...\n');

    // Test tenant isolation by trying to query different tables
    console.log('📋 Testing table access with current auth...\n');

    // Test tenants table
    console.log('🏢 Testing tenants table...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, slug, name')
      .limit(5);

    if (tenantsError) {
      console.log(`   ❌ Tenants access failed: ${tenantsError.message}`);
      if (tenantsError.code === 'PGRST116') {
        console.log('   ✅ RLS is working (no policies allow access)');
      }
    } else {
      console.log(`   ✅ Tenants access allowed: ${tenants.length} records`);
      tenants.forEach(tenant => {
        console.log(`      - ${tenant.slug} (${tenant.name})`);
      });
    }

    // Test skills table
    console.log('\n🥋 Testing skills table...');
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, tenant_id')
      .limit(3);

    if (skillsError) {
      console.log(`   ❌ Skills access failed: ${skillsError.message}`);
      if (skillsError.code === 'PGRST116') {
        console.log('   ✅ RLS is working (no policies allow access)');
      }
    } else {
      console.log(`   ✅ Skills access allowed: ${skills.length} records`);
      if (skills.length > 0) {
        console.log(`      First skill tenant_id: ${skills[0].tenant_id}`);
      }
    }

    // Test athletes table
    console.log('\n👨‍👩‍👧‍👦 Testing athletes table...');
    const { data: athletes, error: athletesError } = await supabase
      .from('athletes')
      .select('id, first_name, tenant_id')
      .limit(3);

    if (athletesError) {
      console.log(`   ❌ Athletes access failed: ${athletesError.message}`);
      if (athletesError.code === 'PGRST116') {
        console.log('   ✅ RLS is working (no policies allow access)');
      }
    } else {
      console.log(`   ✅ Athletes access allowed: ${athletes.length} records`);
      if (athletes.length > 0) {
        console.log(`      First athlete tenant_id: ${athletes[0].tenant_id}`);
      }
    }

    // Test bookings table
    console.log('\n📅 Testing bookings table...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, status, tenant_id')
      .limit(3);

    if (bookingsError) {
      console.log(`   ❌ Bookings access failed: ${bookingsError.message}`);
      if (bookingsError.code === 'PGRST116') {
        console.log('   ✅ RLS is working (no policies allow access)');
      }
    } else {
      console.log(`   ✅ Bookings access allowed: ${bookings.length} records`);
      if (bookings.length > 0) {
        console.log(`      First booking tenant_id: ${bookings[0].tenant_id}`);
      }
    }

    console.log('\n🎯 RLS Status Check Complete!');
    console.log('\n📋 What This Means:');
    console.log('   - ❌ + PGRST116 error = RLS is enabled and blocking access (GOOD!)');
    console.log('   - ✅ + data returned = Either no RLS or policies allow access');
    console.log('   - Other errors = Table might not exist or other issues');

    console.log('\n🔧 Next Steps:');
    console.log('   1. If you see PGRST116 errors, RLS is working!');
    console.log('   2. If you see data, you may need to run the RLS migration');
    console.log('   3. Run the SQL migration in Supabase dashboard manually');

  } catch (error) {
    console.error('❌ RLS Status check failed:');
    console.error(error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkRLSStatus();
}

export { checkRLSStatus };
