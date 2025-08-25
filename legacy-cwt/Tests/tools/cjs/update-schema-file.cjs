#!/usr/bin/env node

/**
 * Generate Updated Complete Schema File
 * This script creates an accurate schema file from the current Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZGd0ZHpyY3lmbWlzbGlsdWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYxMzgyOSwiZXhwIjoyMDY3MTg5ODI5fQ.pCOdtCB4DTd7fIV5WqWFQ4TPAX3yj5Wi-ml5WGQH9sI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getCurrentTables() {
  console.log('🔍 Fetching all current database tables...\n');
  
  // Get tables by testing access to known tables
  const knownTables = [
    'admins', 'apparatus', 'archived_waivers', 'athletes', 'availability', 
    'availability_exceptions', 'blog_posts', 'booking_athletes', 'booking_focus_areas',
    'booking_apparatus', 'booking_side_quests', 'bookings', 'focus_areas', 
    'genders', 'lesson_types', 'parents', 'side_quests', 'slot_reservations', 
    'tips', 'waivers'
  ];

  const existingTables = [];
  
  for (const table of knownTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error) {
        existingTables.push(table);
        console.log(`✅ ${table}: Exists`);
      }
    } catch (err) {
      console.log(`❌ ${table}: Does not exist`);
    }
  }
  
  console.log(`\n📊 Found ${existingTables.length} tables\n`);
  return existingTables.sort();
}

async function getTableStructure(tableName) {
  console.log(`🔍 Getting structure for ${tableName}...`);
  
  try {
    // Get a sample record to understand the structure
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    
    if (error) {
      console.log(`❌ Error getting ${tableName} structure:`, error.message);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`⚠️  ${tableName}: No data available for structure analysis`);
      return { columns: [] };
    }
    
    const record = data[0];
    const columns = Object.keys(record).map(key => ({
      column_name: key,
      data_type: typeof record[key],
      sample_value: record[key]
    }));
    
    return { columns, sampleRecord: record };
    
  } catch (err) {
    console.log(`❌ Error analyzing ${tableName}:`, err.message);
    return null;
  }
}

async function generateUpdatedSchema() {
  console.log('🚀 Generating Updated Complete Schema File...\n');
  console.log('=' .repeat(60));
  
  const tables = await getCurrentTables();
  const schemaData = {
    timestamp: new Date().toISOString(),
    description: "Complete current schema - Auto-generated from live Supabase database",
    note: "This file excludes intentionally missing tables (parent_auth_codes, user_sessions) that use alternative implementations",
    tables: {},
    summary: {
      total_tables: tables.length,
      table_list: tables
    }
  };
  
  console.log('📋 Analyzing table structures...\n');
  
  for (const tableName of tables) {
    const structure = await getTableStructure(tableName);
    if (structure) {
      schemaData.tables[tableName] = {
        exists: true,
        columns: structure.columns || [],
        sample_record: structure.sampleRecord || null,
        analyzed_at: new Date().toISOString()
      };
    } else {
      schemaData.tables[tableName] = {
        exists: true,
        error: "Could not analyze structure",
        analyzed_at: new Date().toISOString()
      };
    }
  }
  
  // Add notes about intentionally missing tables
  schemaData.intentionally_missing = {
    parent_auth_codes: {
      reason: "Authentication uses magic codes via Resend API instead of database storage",
      alternative: "Parents table + API-based magic code authentication"
    },
    user_sessions: {
      reason: "Session storage uses Express middleware with in-memory storage",
      alternative: "Express session middleware with connect-pg-simple (configured for in-memory)"
    },
    parent_verification_tokens: {
      reason: "Email verification handled via alternative implementation",
      alternative: "Integrated with parent authentication flow"
    }
  };
  
  // Write the updated schema file
  const outputPath = path.join(__dirname, 'attached_assets', 'complete_current_schema_updated.txt');
  const schemaContent = `Complete Schema - Updated ${new Date().toISOString()}
Generated from live Supabase database

SUMMARY:
- Total Tables: ${tables.length}
- Intentionally Missing: ${Object.keys(schemaData.intentionally_missing).length}
- Last Updated: ${schemaData.timestamp}

TABLE LIST:
${tables.map(t => `- ${t}`).join('\n')}

INTENTIONALLY MISSING TABLES:
${Object.entries(schemaData.intentionally_missing).map(([table, info]) => 
  `- ${table}: ${info.reason}`
).join('\n')}

DETAILED SCHEMA DATA:
${JSON.stringify(schemaData, null, 2)}
`;

  fs.writeFileSync(outputPath, schemaContent);
  
  console.log('\n✅ Updated schema file generated!');
  console.log(`📄 Saved to: ${outputPath}`);
  console.log(`📊 Contains ${tables.length} tables with full structure analysis`);
  
  // Also backup the original
  const originalPath = path.join(__dirname, 'attached_assets', 'complete_current_schema.txt');
  const backupPath = path.join(__dirname, 'attached_assets', 'complete_current_schema_backup.txt');
  
  if (fs.existsSync(originalPath)) {
    fs.copyFileSync(originalPath, backupPath);
    console.log(`💾 Original schema backed up to: ${backupPath}`);
  }
  
  return schemaData;
}

generateUpdatedSchema().catch(console.error);
