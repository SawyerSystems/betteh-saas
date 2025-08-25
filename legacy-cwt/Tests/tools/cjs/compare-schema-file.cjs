#!/usr/bin/env node

/**
 * Compare complete_current_schema.txt with actual Supabase database
 * This script verifies if the schema file is complete and up-to-date
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZGd0ZHpyY3lmbWlzbGlsdWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYxMzgyOSwiZXhwIjoyMDY3MTg5ODI5fQ.pCOdtCB4DTd7fIV5WqWFQ4TPAX3yj5Wi-ml5WGQH9sI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getCurrentDatabaseTables() {
  console.log('🔍 Fetching current database tables...\n');
  
  try {
    // Try to get tables through direct query first
    const { data: tables, error } = await supabase
      .rpc('exec_sql', { 
        query: `
          SELECT table_name, table_type 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
        `
      });

    if (error) {
      console.log('❌ RPC method failed, trying alternative approach...');
      
      // Fallback: Try to access known tables individually
      const knownTables = [
        'admins', 'apparatus', 'archived_waivers', 'athletes', 'availability', 
        'availability_exceptions', 'blog_posts', 'booking_athletes', 'booking_focus_areas',
        'booking_logs', 'bookings', 'focus_areas', 'genders', 'lesson_types',
        'parents', 'payment_logs', 'side_quests', 'slot_reservations', 'tips', 'waivers'
      ];

      const actualTables = [];
      
      for (const table of knownTables) {
        try {
          const { data, error: tableError } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (!tableError) {
            actualTables.push({ table_name: table, table_type: 'BASE TABLE' });
            console.log(`✅ ${table}: Exists`);
          }
        } catch (err) {
          console.log(`❌ ${table}: Does not exist`);
        }
      }
      
      return actualTables;
    }

    return tables;
  } catch (err) {
    console.error('❌ Error fetching database tables:', err.message);
    return [];
  }
}

async function getSchemaFileTables() {
  console.log('📄 Reading schema file...\n');
  
  const schemaPath = path.join(__dirname, 'attached_assets', 'complete_current_schema.txt');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found at:', schemaPath);
    return [];
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  
  // Extract table names from JSON "table_name" fields
  const tableMatches = schemaContent.match(/"table_name":\s*"([^"]*)"/g) || [];
  const tableNames = tableMatches.map(match => {
    const parts = match.match(/"table_name":\s*"([^"]*)"/);
    return parts ? parts[1].toLowerCase() : null;
  }).filter(Boolean);

  // Remove duplicates and filter out views (tables with underscores like "bookings_with_details")
  const uniqueTableNames = [...new Set(tableNames)].filter(name => {
    // Keep base tables, exclude views that typically have descriptive names
    return !name.includes('_with_') && !name.includes('_status');
  });

  console.log('📋 Tables found in schema file:');
  uniqueTableNames.forEach(table => console.log(`  - ${table}`));
  
  return uniqueTableNames.map(name => ({ table_name: name, source: 'schema_file' }));
}

async function compareSchemaToDatabase() {
  console.log('🔍 SCHEMA FILE vs DATABASE COMPARISON\n');
  console.log('=' .repeat(60));

  const [dbTables, schemaTables] = await Promise.all([
    getCurrentDatabaseTables(),
    getSchemaFileTables()
  ]);

  const dbTableNames = dbTables.map(t => t.table_name.toLowerCase());
  const schemaTableNames = schemaTables.map(t => t.table_name.toLowerCase());

  console.log(`\n📊 COMPARISON RESULTS:`);
  console.log(`  Database tables: ${dbTableNames.length}`);
  console.log(`  Schema file tables: ${schemaTableNames.length}`);

  // Tables in database but not in schema file
  const missingFromSchema = dbTableNames.filter(table => !schemaTableNames.includes(table));
  
  // Tables in schema file but not in database
  const missingFromDatabase = schemaTableNames.filter(table => !dbTableNames.includes(table));

  // Tables that match
  const matchingTables = dbTableNames.filter(table => schemaTableNames.includes(table));

  console.log(`\n✅ MATCHING TABLES (${matchingTables.length}):`);
  matchingTables.forEach(table => console.log(`  ✓ ${table}`));

  if (missingFromSchema.length > 0) {
    console.log(`\n⚠️  MISSING FROM SCHEMA FILE (${missingFromSchema.length}):`);
    missingFromSchema.forEach(table => console.log(`  - ${table} (exists in DB but not in schema file)`));
  }

  if (missingFromDatabase.length > 0) {
    console.log(`\n❌ MISSING FROM DATABASE (${missingFromDatabase.length}):`);
    missingFromDatabase.forEach(table => console.log(`  - ${table} (in schema file but not in actual DB)`));
  }

  // Check specific problematic tables we know about
  console.log(`\n🔍 SPECIFIC TABLE CHECKS:`);
  
  const problematicTables = ['parent_auth_codes', 'user_sessions'];
  for (const table of problematicTables) {
    const inSchema = schemaTableNames.includes(table);
    const inDB = dbTableNames.includes(table);
    
    if (inSchema && !inDB) {
      console.log(`  ⚠️  ${table}: In schema file but NOT in database (outdated schema)`);
    } else if (!inSchema && !inDB) {
      console.log(`  ✅ ${table}: Correctly absent from both schema and database`);
    } else if (inSchema && inDB) {
      console.log(`  ✅ ${table}: Present in both schema and database`);
    } else {
      console.log(`  ❓ ${table}: In database but not in schema file`);
    }
  }

  // Calculate accuracy percentage
  const totalExpected = Math.max(dbTableNames.length, schemaTableNames.length);
  const accuracy = totalExpected > 0 ? (matchingTables.length / totalExpected * 100).toFixed(1) : 0;

  console.log(`\n📈 SCHEMA FILE ACCURACY: ${accuracy}%`);
  
  if (missingFromSchema.length === 0 && missingFromDatabase.length === 0) {
    console.log('🎉 Schema file is PERFECTLY synchronized with database!');
  } else if (missingFromDatabase.length > 0) {
    console.log('⚠️  Schema file contains tables that don\'t exist in database (outdated)');
  } else if (missingFromSchema.length > 0) {
    console.log('⚠️  Database has tables not documented in schema file (incomplete)');
  }

  return {
    dbTables: dbTableNames,
    schemaTables: schemaTableNames,
    matching: matchingTables,
    missingFromSchema,
    missingFromDatabase,
    accuracy: parseFloat(accuracy)
  };
}

compareSchemaToDatabase().catch(console.error);
