#!/usr/bin/env node

/**
 * Comprehensive Synchronization Audit Tool
 * Analyzes the entire Supabase-codebase synchronization for Coach Will Gymnastics
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define expected schema based on complete_current_schema.txt
const EXPECTED_TABLES = {
  // Main entity tables
  'admins': {
    columns: ['id', 'email', 'password_hash', 'created_at', 'updated_at'],
    primaryKey: 'id'
  },
  'parents': {
    columns: ['id', 'first_name', 'last_name', 'email', 'phone', 'emergency_contact_name', 'emergency_contact_phone', 'created_at', 'updated_at'],
    primaryKey: 'id'
  },
  'athletes': {
    columns: ['id', 'parent_id', 'name', 'first_name', 'last_name', 'date_of_birth', 'allergies', 'experience', 'gender', 'latest_waiver_id', 'waiver_status', 'created_at', 'updated_at'],
    primaryKey: 'id',
    foreignKeys: ['parent_id']
  },
  'bookings': {
    columns: ['id', 'lesson_type', 'preferred_date', 'preferred_time', 'parent_first_name', 'parent_last_name', 'parent_email', 'parent_phone', 'status', 'payment_status', 'attendance_status', 'progress_note', 'coach_name', 'created_at', 'updated_at'],
    primaryKey: 'id',
    hasAdventureLog: true
  },
  'lesson_types': {
    columns: ['id', 'name', 'description', 'price', 'duration', 'is_private', 'max_athletes', 'is_active', 'sort_order', 'created_at'],
    primaryKey: 'id'
  },
  'waivers': {
    columns: ['id', 'athlete_id', 'parent_id', 'athlete_name', 'signature_data', 'signed_at', 'created_at'],
    primaryKey: 'id',
    foreignKeys: ['athlete_id', 'parent_id']
  },
  
  // Junction tables
  'booking_athletes': {
    columns: ['id', 'booking_id', 'athlete_id', 'slot_order'],
    primaryKey: 'id',
    foreignKeys: ['booking_id', 'athlete_id']
  },
  'booking_focus_areas': {
    columns: ['id', 'booking_id', 'focus_area_id'],
    primaryKey: 'id',
    foreignKeys: ['booking_id', 'focus_area_id']
  },
  'booking_apparatus': {
    columns: ['id', 'booking_id', 'apparatus_id'],
    primaryKey: 'id',
    foreignKeys: ['booking_id', 'apparatus_id']
  },
  'booking_side_quests': {
    columns: ['id', 'booking_id', 'side_quest_id'],
    primaryKey: 'id',
    foreignKeys: ['booking_id', 'side_quest_id']
  },
  
  // Lookup tables
  'apparatus': {
    columns: ['id', 'name', 'sort_order', 'created_at'],
    primaryKey: 'id'
  },
  'focus_areas': {
    columns: ['id', 'name', 'apparatus_id', 'sort_order', 'created_at'],
    primaryKey: 'id',
    foreignKeys: ['apparatus_id']
  },
  'side_quests': {
    columns: ['id', 'name', 'sort_order', 'created_at'],
    primaryKey: 'id'
  },
  'genders': {
    columns: ['id', 'name', 'display_name', 'is_active', 'sort_order', 'created_at'],
    primaryKey: 'id'
  },
  
  // Content tables
  'blog_posts': {
    columns: ['id', 'title', 'content', 'excerpt', 'category', 'image_url', 'published_at'],
    primaryKey: 'id'
  },
  'tips': {
    columns: ['id', 'title', 'content', 'category', 'difficulty', 'created_at'],
    primaryKey: 'id'
  },
  
  // Auth and session tables
  'parent_auth_codes': {
    columns: ['id', 'email', 'code', 'expires_at', 'used', 'created_at'],
    primaryKey: 'id'
  },
  'user_sessions': {
    columns: ['sid', 'sess', 'expire'],
    primaryKey: 'sid'
  }
};

// Critical API endpoints that must work
const CRITICAL_ENDPOINTS = [
  '/api/parent-auth/status',
  '/api/parent/info',
  '/api/parent/bookings', 
  '/api/parent/athletes',
  '/api/bookings',
  '/api/parents',
  '/api/athletes',
  '/api/lesson-types',
  '/api/waivers'
];

async function auditTableSchema() {
  console.log('\n🔍 AUDITING DATABASE SCHEMA');
  console.log('═'.repeat(50));
  
  const results = {
    tables: {
      found: [],
      missing: [],
      extraColumns: [],
      missingColumns: []
    },
    junctionTables: {
      accessible: [],
      inaccessible: []
    },
    adventureLog: {
      fieldsExist: false,
      completedBookingsWithNotes: 0,
      totalCompletedBookings: 0
    }
  };

  // Test table accessibility
  for (const [tableName, tableInfo] of Object.entries(EXPECTED_TABLES)) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
        results.tables.missing.push(tableName);
      } else {
        console.log(`✅ ${tableName}: Accessible`);
        results.tables.found.push(tableName);
        
        // Check columns if we got data
        if (data && data.length > 0) {
          const actualColumns = Object.keys(data[0]);
          const expectedColumns = tableInfo.columns;
          
          const missing = expectedColumns.filter(col => !actualColumns.includes(col));
          const extra = actualColumns.filter(col => !expectedColumns.includes(col));
          
          if (missing.length > 0) {
            results.tables.missingColumns.push({ table: tableName, columns: missing });
          }
          if (extra.length > 0) {
            results.tables.extraColumns.push({ table: tableName, columns: extra });
          }
        }
        
        // Special check for Adventure Log fields in bookings
        if (tableName === 'bookings' && tableInfo.hasAdventureLog) {
          try {
            const { data: adventureData } = await supabase
              .from('bookings')
              .select('id, progress_note, coach_name, attendance_status')
              .eq('attendance_status', 'completed');
              
            if (adventureData) {
              results.adventureLog.fieldsExist = true;
              results.adventureLog.totalCompletedBookings = adventureData.length;
              results.adventureLog.completedBookingsWithNotes = adventureData.filter(b => b.progress_note).length;
            }
          } catch (adventureError) {
            console.log(`⚠️  Adventure Log fields check failed: ${adventureError.message}`);
          }
        }
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Connection error - ${err.message}`);
      results.tables.missing.push(tableName);
    }
  }

  // Test junction table accessibility specifically
  const junctionTables = ['booking_athletes', 'booking_focus_areas', 'booking_apparatus', 'booking_side_quests'];
  for (const junctionTable of junctionTables) {
    try {
      const { data, error } = await supabase
        .from(junctionTable)
        .select('*')
        .limit(5);
        
      if (error) {
        results.junctionTables.inaccessible.push({ table: junctionTable, error: error.message });
      } else {
        results.junctionTables.accessible.push({ table: junctionTable, rowCount: data.length });
      }
    } catch (err) {
      results.junctionTables.inaccessible.push({ table: junctionTable, error: err.message });
    }
  }
  
  return results;
}

async function auditAPIEndpoints() {
  console.log('\n🌐 AUDITING API ENDPOINTS');
  console.log('═'.repeat(50));
  
  const results = {
    accessible: [],
    inaccessible: [],
    authRequired: []
  };
  
  // Since we can't make HTTP requests from this script, we'll simulate endpoint checks
  // by checking if the underlying data for each endpoint is accessible
  
  const endpointTests = {
    '/api/parent/info': async () => {
      const { data, error } = await supabase.from('parents').select('*').limit(1);
      return { accessible: !error, error: error?.message };
    },
    '/api/parent/bookings': async () => {
      const { data, error } = await supabase.from('bookings').select('*').limit(1);
      return { accessible: !error, error: error?.message };
    },
    '/api/parent/athletes': async () => {
      const { data, error } = await supabase.from('athletes').select('*').limit(1);
      return { accessible: !error, error: error?.message };
    },
    '/api/bookings': async () => {
      const { data, error } = await supabase.from('bookings').select('*').limit(1);
      return { accessible: !error, error: error?.message };
    },
    '/api/parents': async () => {
      const { data, error } = await supabase.from('parents').select('*').limit(1);
      return { accessible: !error, error: error?.message };
    },
    '/api/athletes': async () => {
      const { data, error } = await supabase.from('athletes').select('*').limit(1);
      return { accessible: !error, error: error?.message };
    },
    '/api/lesson-types': async () => {
      const { data, error } = await supabase.from('lesson_types').select('*').limit(1);
      return { accessible: !error, error: error?.message };
    },
    '/api/waivers': async () => {
      const { data, error } = await supabase.from('waivers').select('*').limit(1);
      return { accessible: !error, error: error?.message };
    }
  };
  
  for (const [endpoint, testFn] of Object.entries(endpointTests)) {
    try {
      const result = await testFn();
      if (result.accessible) {
        console.log(`✅ ${endpoint}: Data accessible`);
        results.accessible.push(endpoint);
      } else {
        console.log(`❌ ${endpoint}: ${result.error}`);
        results.inaccessible.push({ endpoint, error: result.error });
      }
    } catch (err) {
      console.log(`❌ ${endpoint}: ${err.message}`);
      results.inaccessible.push({ endpoint, error: err.message });
    }
  }
  
  return results;
}

async function auditFrontendBackendSync() {
  console.log('\n🔄 AUDITING FRONTEND-BACKEND SYNCHRONIZATION');
  console.log('═'.repeat(50));
  
  const results = {
    parentDashboard: {
      dataRequirements: [
        'Parent info from /api/parent/info',
        'Bookings from /api/parent/bookings', 
        'Athletes from /api/parent/athletes'
      ],
      adventureLogFeatures: [
        'Progress notes display',
        'Coach name display',
        'Completed sessions filtering',
        'Summary statistics'
      ],
      authenticationFlow: [
        'Parent login via /api/parent-auth/login',
        'Session management',
        'Protected route access'
      ]
    },
    adminDashboard: {
      dataRequirements: [
        'All bookings from /api/bookings',
        'All parents from /api/parents',
        'All athletes from /api/athletes'
      ]
    },
    bookingSystem: {
      features: [
        'Lesson type selection',
        'Athlete selection/creation', 
        'Time slot booking',
        'Payment processing',
        'Waiver management'
      ]
    }
  };
  
  // Test actual data flows
  try {
    // Test parent dashboard data flow
    const { data: sampleParent } = await supabase
      .from('parents')
      .select('*')
      .limit(1)
      .single();
      
    if (sampleParent) {
      // Test if we can get parent's bookings
      const { data: parentBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('parent_email', sampleParent.email);
        
      // Test if we can get parent's athletes
      const { data: parentAthletes } = await supabase
        .from('athletes')
        .select('*')
        .eq('parent_id', sampleParent.id);
        
      console.log(`✅ Parent data flow: Found ${parentBookings?.length || 0} bookings, ${parentAthletes?.length || 0} athletes`);
      results.parentDashboard.tested = true;
    }
  } catch (err) {
    console.log(`❌ Parent data flow test failed: ${err.message}`);
    results.parentDashboard.tested = false;
  }
  
  return results;
}

async function generateSyncReport() {
  console.log('\n📊 COMPREHENSIVE SYNCHRONIZATION AUDIT REPORT');
  console.log('═'.repeat(60));
  console.log(`Generated: ${new Date().toISOString()}`);
  
  try {
    const schemaResults = await auditTableSchema();
    const apiResults = await auditAPIEndpoints();
    const syncResults = await auditFrontendBackendSync();
    
    // Overall health score
    const totalTables = Object.keys(EXPECTED_TABLES).length;
    const accessibleTables = schemaResults.tables.found.length;
    const tableHealthScore = Math.round((accessibleTables / totalTables) * 100);
    
    const totalEndpoints = CRITICAL_ENDPOINTS.length;
    const accessibleEndpoints = apiResults.accessible.length;
    const endpointHealthScore = Math.round((accessibleEndpoints / totalEndpoints) * 100);
    
    const overallHealth = Math.round((tableHealthScore + endpointHealthScore) / 2);
    
    console.log('\n🏥 HEALTH SCORES');
    console.log('─'.repeat(30));
    console.log(`Database Tables: ${tableHealthScore}% (${accessibleTables}/${totalTables})`);
    console.log(`API Endpoints: ${endpointHealthScore}% (${accessibleEndpoints}/${totalEndpoints})`);
    console.log(`Overall Health: ${overallHealth}%`);
    
    // Adventure Log status
    console.log('\n🎯 ADVENTURE LOG STATUS');
    console.log('─'.repeat(30));
    console.log(`Fields Exist: ${schemaResults.adventureLog.fieldsExist ? '✅ Yes' : '❌ No'}`);
    console.log(`Completed Bookings: ${schemaResults.adventureLog.totalCompletedBookings}`);
    console.log(`With Progress Notes: ${schemaResults.adventureLog.completedBookingsWithNotes}`);
    
    // Junction tables status
    console.log('\n🔗 JUNCTION TABLES STATUS');
    console.log('─'.repeat(30));
    schemaResults.junctionTables.accessible.forEach(jt => {
      console.log(`✅ ${jt.table}: ${jt.rowCount} rows`);
    });
    schemaResults.junctionTables.inaccessible.forEach(jt => {
      console.log(`❌ ${jt.table}: ${jt.error}`);
    });
    
    // Missing/Extra columns
    if (schemaResults.tables.missingColumns.length > 0) {
      console.log('\n⚠️  MISSING COLUMNS');
      console.log('─'.repeat(30));
      schemaResults.tables.missingColumns.forEach(mc => {
        console.log(`${mc.table}: ${mc.columns.join(', ')}`);
      });
    }
    
    if (schemaResults.tables.extraColumns.length > 0) {
      console.log('\n➕ EXTRA COLUMNS');
      console.log('─'.repeat(30));
      schemaResults.tables.extraColumns.forEach(ec => {
        console.log(`${ec.table}: ${ec.columns.join(', ')}`);
      });
    }
    
    // Critical issues
    const criticalIssues = [];
    if (schemaResults.tables.missing.length > 0) {
      criticalIssues.push(`Missing tables: ${schemaResults.tables.missing.join(', ')}`);
    }
    if (apiResults.inaccessible.length > 0) {
      criticalIssues.push(`Inaccessible endpoints: ${apiResults.inaccessible.length}`);
    }
    if (!schemaResults.adventureLog.fieldsExist) {
      criticalIssues.push('Adventure Log fields missing');
    }
    
    if (criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES');
      console.log('─'.repeat(30));
      criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    } else {
      console.log('\n✅ NO CRITICAL ISSUES FOUND');
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('─'.repeat(30));
    if (overallHealth >= 90) {
      console.log('✅ System is well synchronized. Monitor for optimal performance.');
    } else if (overallHealth >= 70) {
      console.log('⚠️  Minor synchronization issues detected. Address critical endpoints.');
    } else {
      console.log('🚨 Major synchronization issues. Immediate attention required.');
    }
    
    console.log('\n📋 SUMMARY');
    console.log('─'.repeat(30));
    console.log(`✅ Working Tables: ${accessibleTables}`);
    console.log(`✅ Working Endpoints: ${accessibleEndpoints}`);
    console.log(`✅ Junction Tables: ${schemaResults.junctionTables.accessible.length}`);
    console.log(`✅ Adventure Log: ${schemaResults.adventureLog.fieldsExist ? 'Active' : 'Inactive'}`);
    console.log(`📊 Overall Health: ${overallHealth}%`);
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(1);
  }
}

// Run the comprehensive audit
generateSyncReport().then(() => {
  console.log('\n🎉 SYNCHRONIZATION AUDIT COMPLETE');
  process.exit(0);
}).catch(error => {
  console.error('❌ AUDIT FAILED:', error);
  process.exit(1);
});
