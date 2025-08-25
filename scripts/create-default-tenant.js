#!/usr/bin/env node

/**
 * Create Default Tenant for SaaS Migration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDefaultTenant() {
  console.log('🚀 Creating default tenant for legacy data...\n');
  
  try {
    // Create the default tenant
    const { data, error } = await supabase
      .from('tenants')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        slug: 'legacy-coach',
        name: 'Legacy Coach',
        status: 'active',
        timezone: 'America/Los_Angeles'
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating tenant:', error);
      process.exit(1);
    }

    console.log('✅ Default tenant created successfully!');
    console.log('📋 Tenant details:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Slug: ${data.slug}`);
    console.log(`   Name: ${data.name}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Timezone: ${data.timezone}\n`);

    // Verify tenant exists
    const { data: verification, error: verifyError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (verifyError) {
      console.error('⚠️  Could not verify tenant creation:', verifyError);
    } else {
      console.log('🔍 Verification: Tenant exists and is accessible');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the function
createDefaultTenant();
