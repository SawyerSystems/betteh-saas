#!/usr/bin/env node

/**
 * Comprehensive Supabase-Codebase Synchronization Audit
 * This script analyzes the current state and identifies discrepancies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZGd0ZHpyY3lmbWlzbGlsdWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYxMzgyOSwiZXhwIjoyMDY3MTg5ODI5fQ.pCOdtCB4DTd7fIV5WqWFQ4TPAX3yj5Wi-ml5WGQH9sI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function auditDatabaseSchema() {
  console.log('🔍 PHASE 1: Database Schema Audit\n');
  
  const auditResults = {
    tables: {},
    discrepancies: [],
    recommendations: []
  };

  // Try to get tables via information_schema, fallback to direct testing
  let tables = [];
  
  try {
    const { data: schemaData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.log('⚠️  Information schema not accessible, using direct table testing...\n');
      
      // Fallback: Test known tables directly
      const expectedTables = [
        'admins', 'apparatus', 'archived_waivers', 'athletes', 'availability', 
        'availability_exceptions', 'blog_posts', 'booking_athletes', 'booking_focus_areas',
        'booking_apparatus', 'booking_side_quests', 'bookings', 'focus_areas', 'genders', 
        'lesson_types', 'parents', 'side_quests', 'slot_reservations', 'tips', 'waivers'
      ];
      
      for (const tableName of expectedTables) {
        try {
          const { data, error } = await supabase.from(tableName).select('*').limit(1);
          if (!error) {
            tables.push({ table_name: tableName, table_type: 'BASE TABLE' });
            auditResults.tables[tableName] = { type: 'BASE TABLE', accessible: true };
          }
        } catch (err) {
          // Table doesn't exist
        }
      }
    } else {
      tables = schemaData;
    }
  } catch (err) {
    console.error('❌ Error during schema audit:', err.message);
    return auditResults;
  }

  console.log('📋 Database Tables Found:');
  tables.forEach(table => {
    console.log(`  - ${table.table_name} (${table.table_type})`);
    auditResults.tables[table.table_name] = { type: table.table_type, columns: [] };
  });

  // Check key tables against schema expectations
  // Note: parent_auth_codes and user_sessions are intentionally excluded as they use alternative implementations
  const expectedTables = [
    'admins', 'apparatus', 'archived_waivers', 'athletes', 'availability', 
    'availability_exceptions', 'blog_posts', 'booking_athletes', 'booking_focus_areas',
    'booking_apparatus', 'booking_side_quests', 'bookings', 'focus_areas', 'genders', 
    'lesson_types', 'parents', 'side_quests', 'slot_reservations', 'tips', 'waivers'
  ];

  const actualTables = tables.map(t => t.table_name);
  
  // Check for missing tables
  const missingTables = expectedTables.filter(table => !actualTables.includes(table));
  const extraTables = actualTables.filter(table => !expectedTables.includes(table));

  if (missingTables.length > 0) {
    console.log('\n⚠️  Missing Tables (from schema):');
    missingTables.forEach(table => {
      console.log(`  - ${table}`);
      auditResults.discrepancies.push(`Missing table: ${table}`);
    });
  } else {
    console.log('\n✅ All expected tables present');
  }

  if (extraTables.length > 0) {
    console.log('\n🆕 Extra Tables (not in schema):');
    extraTables.forEach(table => {
      console.log(`  - ${table}`);
      auditResults.discrepancies.push(`Extra table: ${table}`);
    });
  }

  return auditResults;
}

async function auditBookingsTable() {
  console.log('\n🔍 PHASE 2: Bookings Table Deep Audit\n');
  
  try {
    // Try to get bookings table structure via information_schema
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'bookings')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    let bookingColumns = [];
    
    if (error) {
      console.log('⚠️  Information schema not accessible, using sample record analysis...\n');
      
      // Fallback: Get structure from sample record
      const { data: sampleData, error: sampleError } = await supabase
        .from('bookings')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('❌ Error fetching bookings sample:', sampleError.message);
        return { columns: [], hasAdventureLog: false, hasFocusAreasArray: false };
      }
      
      if (sampleData && sampleData.length > 0) {
        bookingColumns = Object.keys(sampleData[0]);
        console.log('📋 Bookings Table Structure (from sample):');
        bookingColumns.forEach(col => {
          console.log(`  - ${col}: ${typeof sampleData[0][col]}`);
        });
      }
    } else {
      bookingColumns = columns.map(c => c.column_name);
      console.log('📋 Bookings Table Structure:');
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });
    }

    // Check for Adventure Log fields
    const adventureLogFields = ['progress_note', 'coach_name'];
    const hasAdventureLog = adventureLogFields.every(field => 
      bookingColumns.includes(field)
    );

    console.log(`\n🎯 Adventure Log Status: ${hasAdventureLog ? '✅ Complete' : '❌ Missing fields'}`);

    // Check focus_areas field (should be migrated to junction table)
    const hasFocusAreasArray = bookingColumns.includes('focus_areas');
    console.log(`📊 Focus Areas Array: ${hasFocusAreasArray ? '⚠️  Still exists (should migrate)' : '✅ Removed (using junction table)'}`);

    return {
      columns: bookingColumns,
      hasAdventureLog,
      hasFocusAreasArray
    };
    
  } catch (error) {
    console.error('❌ Error during bookings audit:', error.message);
    return { columns: [], hasAdventureLog: false, hasFocusAreasArray: false };
  }
}

async function auditJunctionTables() {
  console.log('\n🔍 PHASE 3: Junction Tables Audit\n');
  
  const junctionTables = ['booking_athletes', 'booking_focus_areas', 'booking_apparatus', 'booking_side_quests'];
  const junctionStatus = {};

  for (const tableName of junctionTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: Does not exist or not accessible`);
        junctionStatus[tableName] = { exists: false, error: error.message };
      } else {
        console.log(`✅ ${tableName}: Exists and accessible`);
        junctionStatus[tableName] = { exists: true, rowCount: data?.length || 0 };
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Error - ${err.message}`);
      junctionStatus[tableName] = { exists: false, error: err.message };
    }
  }

  return junctionStatus;
}

async function auditAPIEndpoints() {
  console.log('\n🔍 PHASE 4: API Endpoints Audit\n');
  
  // Test critical endpoints
  const endpoints = [
    { path: 'bookings', description: 'Bookings table access' },
    { path: 'parents', description: 'Parents table access' },
    { path: 'athletes', description: 'Athletes table access' },
    { path: 'waivers', description: 'Waivers table access' },
    { path: 'lesson_types', description: 'Lesson types table access' }
  ];

  const endpointStatus = {};

  for (const endpoint of endpoints) {
    try {
      const { data, error } = await supabase
        .from(endpoint.path)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${endpoint.path}: ${error.message}`);
        endpointStatus[endpoint.path] = { accessible: false, error: error.message };
      } else {
        console.log(`✅ ${endpoint.path}: Accessible (${data?.length || 0} sample records)`);
        endpointStatus[endpoint.path] = { accessible: true, recordCount: data?.length || 0 };
      }
    } catch (err) {
      console.log(`❌ ${endpoint.path}: ${err.message}`);
      endpointStatus[endpoint.path] = { accessible: false, error: err.message };
    }
  }

  return endpointStatus;
}

async function auditDataConsistency() {
  console.log('\n🔍 PHASE 5: Data Consistency Audit\n');
  
  const consistencyIssues = [];

  try {
    // Check for orphaned records
    const { data: orphanedAthletes } = await supabase
      .from('athletes')
      .select('id, name, parent_id')
      .is('parent_id', null);

    if (orphanedAthletes && orphanedAthletes.length > 0) {
      console.log(`⚠️  Found ${orphanedAthletes.length} athletes without parent_id`);
      consistencyIssues.push(`${orphanedAthletes.length} orphaned athletes`);
    }

    // Check Adventure Log data
    const { data: bookingsWithNotes } = await supabase
      .from('bookings')
      .select('id, progress_note, coach_name, attendance_status')
      .eq('attendance_status', 'completed');

    if (bookingsWithNotes) {
      const notesCount = bookingsWithNotes.filter(b => b.progress_note).length;
      console.log(`📝 Adventure Log: ${notesCount}/${bookingsWithNotes.length} completed bookings have progress notes`);
    }

  } catch (error) {
    console.error('❌ Error during data consistency check:', error);
    consistencyIssues.push(`Data consistency check failed: ${error.message}`);
  }

  return consistencyIssues;
}

async function generateSyncReport() {
  console.log('🚀 Starting Comprehensive Supabase-Codebase Synchronization Audit...\n');
  console.log('=' .repeat(80));

  const report = {
    timestamp: new Date().toISOString(),
    schemaAudit: await auditDatabaseSchema(),
    bookingsAudit: await auditBookingsTable(),
    junctionTablesAudit: await auditJunctionTables(),
    apiEndpointsAudit: await auditAPIEndpoints(),
    dataConsistencyIssues: await auditDataConsistency()
  };

  console.log('\n📊 AUDIT SUMMARY');
  console.log('=' .repeat(50));

  // Schema issues
  if (report.schemaAudit.discrepancies.length > 0) {
    console.log('\n⚠️  Schema Discrepancies:');
    report.schemaAudit.discrepancies.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('\n✅ Schema: All expected tables present');
  }

  // Adventure Log status
  const adventureLogStatus = report.bookingsAudit?.hasAdventureLog;
  console.log(`\n🎯 Adventure Log: ${adventureLogStatus ? '✅ Implemented' : '❌ Missing'}`);
  
  // Focus areas migration status
  const focusAreasArray = report.bookingsAudit?.hasFocusAreasArray;
  console.log(`📊 Focus Areas: ${focusAreasArray ? '⚠️  Migration needed' : '✅ Using junction tables'}`);

  // Junction tables status
  const junctionCount = Object.values(report.junctionTablesAudit).filter(j => j.exists).length;
  console.log(`🔗 Junction Tables: ${junctionCount}/4 available`);

  // API access status
  const apiCount = Object.values(report.apiEndpointsAudit).filter(e => e.accessible).length;
  console.log(`🌐 API Endpoints: ${apiCount}/${Object.keys(report.apiEndpointsAudit).length} accessible`);

  // Data consistency
  if (report.dataConsistencyIssues.length > 0) {
    console.log('\n⚠️  Data Consistency Issues:');
    report.dataConsistencyIssues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('\n✅ Data Consistency: No major issues detected');
  }

  // Save detailed report
  const reportPath = path.join(__dirname, 'sync-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  return report;
}

generateSyncReport().catch(console.error);
