#!/usr/bin/env node

/**
 * Supabase SQL Runner via HTTP API
 * Usage: node supabase-sql.cjs "SELECT * FROM bookings LIMIT 5;"
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53ZGd0ZHpyY3lmbWlzbGlsdWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYxMzgyOSwiZXhwIjoyMDY3MTg5ODI5fQ.pCOdtCB4DTd7fIV5WqWFQ4TPAX3yj5Wi-ml5WGQH9sI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(query) {
  try {
    console.log('🔍 Executing SQL via Supabase:');
    console.log('─'.repeat(50));
    console.log(query);
    console.log('─'.repeat(50));
    
    const startTime = Date.now();
    
    // Use rpc to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      query: query 
    });
    
    const endTime = Date.now();
    
    if (error) {
      console.error('❌ SQL Error:', error);
      return;
    }
    
    console.log(`⚡ Executed in ${endTime - startTime}ms`);
    console.log('✅ SQL executed successfully!');
    
    if (data && Array.isArray(data) && data.length > 0) {
      console.log(`📊 Results (${data.length} rows):`);
      console.table(data);
    } else if (data) {
      console.log('📄 Result:', data);
    } else {
      console.log('✨ Command executed successfully (no data returned)');
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🗄️  Supabase SQL Runner (HTTP API)

Usage:
  node Tests/cjs/supabase-sql.cjs "SELECT * FROM bookings LIMIT 5;"
  node Tests/cjs/supabase-sql.cjs --file Tests/sql/path/to/script.sql
  
Examples:
  node supabase-sql.cjs "SELECT COUNT(*) FROM bookings;"
  node supabase-sql.cjs "SELECT column_name FROM information_schema.columns WHERE table_name='bookings';"
    `);
    return;
  }
  
  let sqlCommand;
  
  if (args[0] === '--file') {
    const filePath = args[1];
    if (!filePath) {
      console.error('❌ Please provide a file path after --file');
      return;
    }
    
    try {
      sqlCommand = fs.readFileSync(filePath, 'utf8');
      console.log(`📂 Reading SQL from: ${filePath}`);
    } catch (err) {
      console.error('❌ Error reading file:', err.message);
      return;
    }
  } else {
    sqlCommand = args.join(' ');
  }
  
  await executeSQL(sqlCommand);
}

main().catch(console.error);
