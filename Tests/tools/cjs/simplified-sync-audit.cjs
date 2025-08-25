#!/usr/bin/env node

/**
 * Simplified Supabase Synchronization Audit
 * Direct table access instead of information_schema
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZGd0ZHpyY3lmbWlzbGlsdWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYxMzgyOSwiZXhwIjoyMDY3MTg5ODI5fQ.pCOdtCB4DTd7fIV5WqWFQ4TPAX3yj5Wi-ml5WGQH9sI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function auditCoreTables() {
  console.log('🔍 PHASE 1: Core Tables Audit\n');
  
  const coreTables = [
    'admins', 'athletes', 'bookings', 'parents', 'waivers', 
    'lesson_types', 'parent_auth_codes', 'booking_athletes'
  ];
  
  const tableStatus = {};

  for (const tableName of coreTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
        tableStatus[tableName] = { accessible: false, error: error.message };
      } else {
        console.log(`✅ ${tableName}: Accessible`);
        tableStatus[tableName] = { accessible: true, hasData: data && data.length > 0 };
        
        // Check specific fields for key tables
        if (tableName === 'bookings' && data && data.length > 0) {
          const booking = data[0];
          const hasAdventureLog = 'progress_note' in booking && 'coach_name' in booking;
          const hasFocusAreasArray = 'focus_areas' in booking;
          
          tableStatus[tableName].hasAdventureLog = hasAdventureLog;
          tableStatus[tableName].hasFocusAreasArray = hasFocusAreasArray;
          
          console.log(`  📝 Adventure Log fields: ${hasAdventureLog ? '✅ Present' : '❌ Missing'}`);
          console.log(`  📊 Focus areas array: ${hasFocusAreasArray ? '⚠️  Still exists' : '✅ Removed'}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
      tableStatus[tableName] = { accessible: false, error: err.message };
    }
  }

  return tableStatus;
}

async function auditJunctionTables() {
  console.log('\n🔍 PHASE 2: Junction Tables Audit\n');
  
  const junctionTables = ['booking_athletes', 'booking_focus_areas', 'booking_apparatus', 'booking_side_quests'];
  const junctionStatus = {};

  for (const tableName of junctionTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
        junctionStatus[tableName] = { exists: false, error: error.message };
      } else {
        console.log(`✅ ${tableName}: Exists (${count || 0} records)`);
        junctionStatus[tableName] = { exists: true, recordCount: count || 0 };
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
      junctionStatus[tableName] = { exists: false, error: err.message };
    }
  }

  return junctionStatus;
}

async function auditAdventureLogData() {
  console.log('\n🔍 PHASE 3: Adventure Log Data Audit\n');
  
  try {
    // Check completed bookings with Adventure Log data
    const { data: completedBookings, error } = await supabase
      .from('bookings')
      .select('id, attendance_status, progress_note, coach_name, focus_areas')
      .eq('attendance_status', 'completed');

    if (error) {
      console.log(`❌ Adventure Log audit failed: ${error.message}`);
      return { error: error.message };
    }

    const totalCompleted = completedBookings.length;
    const withProgressNotes = completedBookings.filter(b => b.progress_note && b.progress_note.trim()).length;
    const withCoachNames = completedBookings.filter(b => b.coach_name && b.coach_name.trim()).length;

    console.log(`📊 Completed bookings: ${totalCompleted}`);
    console.log(`📝 With progress notes: ${withProgressNotes}/${totalCompleted}`);
    console.log(`👨‍🏫 With coach names: ${withCoachNames}/${totalCompleted}`);

    if (totalCompleted > 0) {
      console.log('\n📋 Sample completed booking:');
      const sample = completedBookings[0];
      console.log(`  ID: ${sample.id}`);
      console.log(`  Progress Note: ${sample.progress_note || 'None'}`);
      console.log(`  Coach Name: ${sample.coach_name || 'None'}`);
      console.log(`  Focus Areas: ${sample.focus_areas ? JSON.stringify(sample.focus_areas) : 'None'}`);
    }

    return {
      totalCompleted,
      withProgressNotes,
      withCoachNames,
      adventureLogWorking: totalCompleted > 0 && withProgressNotes > 0
    };

  } catch (error) {
    console.log(`❌ Adventure Log audit error: ${error.message}`);
    return { error: error.message };
  }
}

async function auditParentDashboardData() {
  console.log('\n🔍 PHASE 4: Parent Dashboard Data Audit\n');
  
  try {
    // Check parent data structure
    const { data: parents, error: parentsError } = await supabase
      .from('parents')
      .select('id, first_name, last_name, email, phone, emergency_contact_name, emergency_contact_phone')
      .limit(1);

    if (parentsError) {
      console.log(`❌ Parents audit failed: ${parentsError.message}`);
      return { parentsError: parentsError.message };
    }

    // Check athletes data
    const { data: athletes, error: athletesError } = await supabase
      .from('athletes')
      .select('id, parent_id, name, first_name, last_name, date_of_birth, experience')
      .limit(1);

    if (athletesError) {
      console.log(`❌ Athletes audit failed: ${athletesError.message}`);
      return { athletesError: athletesError.message };
    }

    // Check booking relationships
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, parent_id, athlete_id, lesson_type_id')
      .limit(1);

    if (bookingsError) {
      console.log(`❌ Bookings relationships audit failed: ${bookingsError.message}`);
      return { bookingsError: bookingsError.message };
    }

    console.log(`✅ Parents: ${parents.length > 0 ? 'Has data' : 'No data'}`);
    console.log(`✅ Athletes: ${athletes.length > 0 ? 'Has data' : 'No data'}`);
    console.log(`✅ Bookings: ${bookings.length > 0 ? 'Has data' : 'No data'}`);

    if (parents.length > 0) {
      const parent = parents[0];
      const hasRequiredFields = parent.first_name && parent.last_name && parent.email;
      console.log(`📋 Parent data structure: ${hasRequiredFields ? '✅ Complete' : '⚠️  Missing fields'}`);
    }

    return {
      hasParents: parents.length > 0,
      hasAthletes: athletes.length > 0,
      hasBookings: bookings.length > 0
    };

  } catch (error) {
    console.log(`❌ Parent dashboard audit error: ${error.message}`);
    return { error: error.message };
  }
}

async function identifySchemaDiscrepancies() {
  console.log('\n🔍 PHASE 5: Schema Discrepancies Analysis\n');
  
  const discrepancies = [];
  const recommendations = [];

  try {
    // Check if focus_areas array still exists in bookings
    const { data: bookingSample } = await supabase
      .from('bookings')
      .select('focus_areas')
      .limit(1);

    if (bookingSample && bookingSample.length > 0 && 'focus_areas' in bookingSample[0]) {
      discrepancies.push('bookings.focus_areas array field still exists');
      recommendations.push('Migrate focus_areas data to booking_focus_areas junction table');
      console.log('⚠️  bookings.focus_areas array field still exists - should be migrated');
    } else {
      console.log('✅ bookings.focus_areas array field properly removed');
    }

    // Check junction table usage
    const { data: junctionData } = await supabase
      .from('booking_focus_areas')
      .select('*')
      .limit(1);

    if (!junctionData || junctionData.length === 0) {
      discrepancies.push('booking_focus_areas junction table exists but has no data');
      recommendations.push('Populate booking_focus_areas with existing focus areas data');
      console.log('⚠️  booking_focus_areas junction table exists but has no data');
    } else {
      console.log('✅ booking_focus_areas junction table has data');
    }

  } catch (error) {
    console.log(`❌ Schema discrepancy analysis error: ${error.message}`);
    discrepancies.push(`Schema analysis failed: ${error.message}`);
  }

  return { discrepancies, recommendations };
}

async function generateSyncReport() {
  console.log('🚀 Starting Simplified Supabase-Codebase Synchronization Audit...\n');
  console.log('=' .repeat(80));

  const report = {
    timestamp: new Date().toISOString(),
    coreTablesAudit: await auditCoreTables(),
    junctionTablesAudit: await auditJunctionTables(),
    adventureLogAudit: await auditAdventureLogData(),
    parentDashboardAudit: await auditParentDashboardData(),
    schemaAnalysis: await identifySchemaDiscrepancies()
  };

  console.log('\n📊 SYNCHRONIZATION AUDIT SUMMARY');
  console.log('=' .repeat(60));

  // Core tables status
  const coreAccessible = Object.values(report.coreTablesAudit).filter(t => t.accessible).length;
  const totalCore = Object.keys(report.coreTablesAudit).length;
  console.log(`\n🗄️  Core Tables: ${coreAccessible}/${totalCore} accessible`);

  // Junction tables status
  const junctionExists = Object.values(report.junctionTablesAudit).filter(j => j.exists).length;
  console.log(`🔗 Junction Tables: ${junctionExists}/4 exist`);

  // Adventure Log status
  if (report.adventureLogAudit.adventureLogWorking) {
    console.log('🎯 Adventure Log: ✅ Working with data');
  } else if (report.adventureLogAudit.error) {
    console.log(`🎯 Adventure Log: ❌ Error - ${report.adventureLogAudit.error}`);
  } else {
    console.log('🎯 Adventure Log: ⚠️  Fields exist but no data');
  }

  // Parent Dashboard status
  if (report.parentDashboardAudit.hasParents && report.parentDashboardAudit.hasAthletes) {
    console.log('👨‍👩‍👧‍👦 Parent Dashboard: ✅ Core data available');
  } else {
    console.log('👨‍👩‍👧‍👦 Parent Dashboard: ⚠️  Missing core data');
  }

  // Schema discrepancies
  if (report.schemaAnalysis.discrepancies.length > 0) {
    console.log('\n⚠️  Schema Discrepancies Found:');
    report.schemaAnalysis.discrepancies.forEach(disc => {
      console.log(`  - ${disc}`);
    });

    console.log('\n💡 Recommendations:');
    report.schemaAnalysis.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
  } else {
    console.log('\n✅ No major schema discrepancies detected');
  }

  // Save detailed report
  const reportPath = path.join(__dirname, 'sync-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  return report;
}

generateSyncReport().catch(console.error);
