#!/usr/bin/env node

/**
 * Apply Stage 2 Migration via Supabase Client
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying Stage 2 Migration: Adding tenant_id to core tables...\n');
  
  try {
    // Read the core migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'stage2-core-tables.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Migration file loaded successfully');
    console.log(`📏 Migration size: ${migrationSql.length} characters\n`);
    
    // Apply the migration via raw SQL
    console.log('⚡ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSql
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration executed successfully!\n');
    
    // Run verification
    console.log('🔍 Running verification...');
    await verifyMigration();
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

async function verifyMigration() {
  try {
    // Check tenant_id columns exist
    const { data: skillsData, error: skillsError } = await supabase
      .from('skills')
      .select('id, tenant_id')
      .limit(1);
    
    if (skillsError) {
      console.log('⚠️  Could not verify skills table:', skillsError.message);
    } else {
      console.log('✓ Skills table has tenant_id column');
    }
    
    // Check focus_areas
    const { data: focusData, error: focusError } = await supabase
      .from('focus_areas')
      .select('id, tenant_id')
      .limit(1);
    
    if (focusError) {
      console.log('⚠️  Could not verify focus_areas table:', focusError.message);
    } else {
      console.log('✓ Focus areas table has tenant_id column');
    }
    
    // Check default tenant exists
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, slug, name')
      .eq('id', '00000000-0000-0000-0000-000000000001');
    
    if (tenantError) {
      console.log('⚠️  Could not verify tenants:', tenantError.message);
    } else if (tenants && tenants.length > 0) {
      console.log(`✓ Default tenant exists: ${tenants[0].slug} (${tenants[0].name})`);
    } else {
      console.log('⚠️  Default tenant not found');
    }
    
    console.log('\n🎉 Stage 2 migration verification completed!');
    
  } catch (error) {
    console.log('⚠️  Verification failed:', error.message);
  }
}

// Run the migration
applyMigration();
