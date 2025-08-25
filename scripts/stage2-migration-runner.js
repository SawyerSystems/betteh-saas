#!/usr/bin/env node

/**
 * Stage 2 Migration Runner and Verification
 * This script will guide through the migration and verify results
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      return { exists: false, hasTenantId: false, error: error.message };
    }
    
    // Check if tenant_id column exists by trying to select it
    const { error: tenantIdError } = await supabase
      .from(tableName)
      .select('tenant_id')
      .limit(1);
    
    return {
      exists: true,
      hasTenantId: !tenantIdError,
      error: tenantIdError?.message
    };
  } catch (err) {
    return { exists: false, hasTenantId: false, error: err.message };
  }
}

async function verifyMigration() {
  console.log('🔍 Checking current database state...\n');
  
  const tables = [
    'skills',
    'focus_areas', 
    'waivers',
    'availability',
    'testimonials',
    'site_faqs',
    'site_content'
  ];
  
  const results = {};
  
  for (const table of tables) {
    const result = await checkTableStructure(table);
    results[table] = result;
    
    if (result.exists) {
      if (result.hasTenantId) {
        console.log(`✅ ${table}: EXISTS with tenant_id`);
      } else {
        console.log(`⚠️  ${table}: EXISTS but missing tenant_id`);
      }
    } else {
      console.log(`❌ ${table}: Does not exist (${result.error})`);
    }
  }
  
  return results;
}

async function checkDefaultTenant() {
  console.log('\n🏢 Checking default tenant...');
  
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, slug, name, status')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();
    
    if (error) {
      console.log('❌ Default tenant not found');
      return false;
    }
    
    console.log(`✅ Default tenant exists: ${data.slug} (${data.name})`);
    return true;
  } catch (err) {
    console.log('❌ Error checking tenant:', err.message);
    return false;
  }
}

async function suggestNextSteps(results) {
  console.log('\n📋 NEXT STEPS:\n');
  
  const needsMigration = Object.entries(results).some(([table, result]) => 
    result.exists && !result.hasTenantId
  );
  
  if (needsMigration) {
    console.log('🚀 APPLY MIGRATION:');
    console.log('1. Copy the SQL from stage2-migration-simple.sql');
    console.log('2. Open Supabase Dashboard → SQL Editor');
    console.log('3. Paste and execute the SQL');
    console.log('4. Re-run this script to verify\n');
    
    // Output the simplified SQL directly
    console.log('📋 MIGRATION SQL TO COPY:');
    console.log('=' * 60);
    
    const sqlPath = path.join(__dirname, '..', 'stage2-migration-simple.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log(sql);
    } else {
      console.log('❌ Migration SQL file not found');
    }
    
    console.log('=' * 60);
  } else {
    console.log('✅ All tables have tenant_id! Ready for schema updates.');
    console.log('\n🔄 FOLLOW-UP TASKS:');
    console.log('1. Update shared/schema.ts with tenant_id fields');
    console.log('2. Update storage methods to include tenant_id in queries');
    console.log('3. Run type check to ensure compatibility');
  }
}

async function main() {
  console.log('🚀 Stage 2 Migration Status Check\n');
  
  // Check current state
  const results = await verifyMigration();
  
  // Check default tenant
  await checkDefaultTenant();
  
  // Suggest next steps
  await suggestNextSteps(results);
}

main().catch(console.error);
