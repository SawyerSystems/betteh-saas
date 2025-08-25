#!/usr/bin/env node

/**
 * Supabase Data Query Tool
 * Usage: node query-db.cjs [table] [options]
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZGd0ZHpyY3lmbWlzbGlsdWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYxMzgyOSwiZXhwIjoyMDY3MTg5ODI5fQ.pCOdtCB4DTd7fIV5WqWFQ4TPAX3yj5Wi-ml5WGQH9sI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function queryTable(table, options = {}) {
  try {
    console.log(`🔍 Querying table: ${table}`);
    
    let query = supabase.from(table).select('*');
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.filter) {
      const [column, operator, value] = options.filter.split(',');
      query = query.filter(column, operator, value);
    }
    
    if (options.order) {
      query = query.order(options.order);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`✅ Found ${data.length} records:`);
    console.table(data);
    
  } catch (err) {
    console.error('💥 Error:', err);
  }
}

async function checkAdventureLog() {
  try {
    console.log('🎯 Checking Adventure Log implementation...\n');
    
    // Check bookings with Adventure Log fields
    const { data: completedBookings, error } = await supabase
      .from('bookings')
      .select('id, created_at, attendance_status, progress_note, coach_name, focus_areas')
      .eq('attendance_status', 'completed')
      .limit(5);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`📊 Completed bookings for Adventure Log (${completedBookings.length} found):`);
    console.table(completedBookings);
    
    // Check if any have progress notes
    const withNotes = completedBookings.filter(b => b.progress_note);
    console.log(`\n📝 Bookings with progress notes: ${withNotes.length}/${completedBookings.length}`);
    
    if (withNotes.length > 0) {
      console.log('✅ Adventure Log is working! Progress notes found.');
    } else {
      console.log('⚠️  Adventure Log fields exist but no progress notes yet.');
    }
    
  } catch (err) {
    console.error('💥 Error:', err);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
🗄️  Supabase Data Query Tool

Usage:
  node query-db.cjs [table] [options]
  node query-db.cjs --adventure-log

Examples:
  node query-db.cjs bookings --limit=5 --order=created_at
  node query-db.cjs parents --limit=3
  node query-db.cjs --adventure-log
  node query-db.cjs bookings --filter=attendance_status,eq,completed
    `);
    return;
  }
  
  if (args[0] === '--adventure-log') {
    await checkAdventureLog();
    return;
  }
  
  const table = args[0];
  const options = {};
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--order=')) {
      options.order = arg.split('=')[1];
    } else if (arg.startsWith('--filter=')) {
      options.filter = arg.split('=')[1];
    }
  }
  
  await queryTable(table, options);
}

main().catch(console.error);
