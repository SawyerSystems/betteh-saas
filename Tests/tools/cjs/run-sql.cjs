#!/usr/bin/env node

/**
 * SQL Execution Script for Supabase Database
 * Usage: node run-sql.js "SELECT * FROM bookings LIMIT 5;"
 * Usage: node run-sql.js --file migration.sql
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Direct PostgreSQL connection string
const connectionString = 'postgresql://postgres:govgo2-cysdyr-kagmeV@db.nwdgtdzrcyfmislilucy.supabase.co:5432/postgres';

async function runSQL(sqlQuery) {
  const client = new Client({
    // Force IPv4 only - no connection string
    host: 'db.nwdgtdzrcyfmislilucy.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'govgo2-cysdyr-kagmeV',
    ssl: { rejectUnauthorized: false },
    // Force IPv4
    family: 4
  });

  try {
    console.log('🔌 Connecting to Supabase database (IPv4)...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('📝 Executing SQL:');
    console.log('─'.repeat(50));
    console.log(sqlQuery);
    console.log('─'.repeat(50));

    const startTime = Date.now();
    const result = await client.query(sqlQuery);
    const endTime = Date.now();

    console.log(`\n⚡ Executed in ${endTime - startTime}ms`);
    
    if (result.command === 'SELECT' && result.rows.length > 0) {
      console.log(`📊 Results (${result.rows.length} rows):`);
      console.table(result.rows);
    } else if (result.command === 'INSERT' || result.command === 'UPDATE' || result.command === 'DELETE') {
      console.log(`✅ ${result.command} completed successfully. Rows affected: ${result.rowCount}`);
    } else if (result.command === 'CREATE' || result.command === 'ALTER' || result.command === 'DROP') {
      console.log(`✅ ${result.command} completed successfully.`);
    } else {
      console.log('✅ Query executed successfully.');
      if (result.rows && result.rows.length > 0) {
        console.table(result.rows);
      }
    }

  } catch (error) {
    console.error('❌ Error executing SQL:');
    console.error(error.message);
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    if (error.hint) {
      console.error('Hint:', error.hint);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🗄️  Supabase SQL Runner

Usage:
  node Tests/cjs/run-sql.cjs "SELECT * FROM bookings LIMIT 5;"
  node Tests/cjs/run-sql.cjs --file Tests/sql/path/to/script.sql
  
Examples:
  node Tests/cjs/run-sql.cjs "SHOW TABLES;"
  node Tests/cjs/run-sql.cjs "SELECT COUNT(*) FROM bookings;"
  node Tests/cjs/run-sql.cjs --file Tests/sql/adventure-log-schema-updates.sql
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
  
  await runSQL(sqlCommand);
}

main().catch(console.error);
