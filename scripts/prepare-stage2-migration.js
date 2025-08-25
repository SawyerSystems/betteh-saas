#!/usr/bin/env node

/**
 * Prepare Stage 2 Migration SQL for Manual Application
 * Since Supabase doesn't have exec_sql, we'll output the SQL for manual copy/paste
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function prepareMigration() {
  console.log('🚀 Preparing Stage 2 Migration SQL...\n');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'stage2-core-tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Migration SQL loaded successfully');
    console.log(`📏 Size: ${migrationSql.length} characters\n`);
    
    // Output instructions
    console.log('📋 MANUAL APPLICATION REQUIRED:\n');
    console.log('1. Copy the SQL below');
    console.log('2. Open Supabase Dashboard → SQL Editor');
    console.log('3. Paste and execute the SQL');
    console.log('4. Verify tenant_id columns are added to core tables\n');
    
    console.log('=' * 80);
    console.log('STAGE 2 MIGRATION SQL:');
    console.log('=' * 80);
    console.log(migrationSql);
    console.log('=' * 80);
    console.log('\n✅ Ready for manual application in Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ Error preparing migration:', error.message);
    process.exit(1);
  }
}

// Run the preparation
prepareMigration();
