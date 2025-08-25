#!/usr/bin/env node

/**
 * Stage 2 Migration Script: Add tenant_id to remaining tables
 * This script applies Stage 2 of the multi-tenant migration
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting Stage 2 Migration: Adding tenant_id to remaining tables...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'migrations', 'stage2-add-tenant-id-remaining-tables.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements (simple approach)
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_statement: statement + ';' 
      });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        // Check if it's a non-critical error (like column already exists)
        if (error.message.includes('already exists')) {
          console.log('⚠️  Continuing (column already exists)...');
          continue;
        }
        throw error;
      }
    }
    
    console.log('✅ Stage 2 migration completed successfully!');
    
    // Run verification
    console.log('\n🔍 Running verification queries...');
    await runVerification();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function runVerification() {
  try {
    // Check if tenant_id columns were added
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name')
      .eq('column_name', 'tenant_id')
      .in('table_name', ['skills', 'focus_areas', 'waivers', 'testimonials', 'site_faqs']);
    
    if (error) {
      console.log('⚠️  Could not run verification query:', error.message);
      return;
    }
    
    console.log('📊 Tables with tenant_id column:');
    columns?.forEach(col => {
      console.log(`  ✓ ${col.table_name}.${col.column_name}`);
    });
    
    // Check for default tenant
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, slug, name')
      .limit(5);
    
    if (!tenantError && tenants) {
      console.log('\n🏢 Current tenants:');
      tenants.forEach(tenant => {
        console.log(`  ✓ ${tenant.slug}: ${tenant.name} (${tenant.id})`);
      });
    }
    
  } catch (error) {
    console.log('⚠️  Verification failed:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration };
