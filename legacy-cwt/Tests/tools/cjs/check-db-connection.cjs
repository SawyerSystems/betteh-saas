#!/usr/bin/env node

/**
 * Get Supabase Database Connection Details
 * This script helps you get the correct connection string
 */

require('dotenv').config();

console.log('🔍 Current Database Connection Settings:\n');

console.log('From .env file:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('DATABASE_DIRECT_URL:', process.env.DATABASE_DIRECT_URL);

console.log('\n🔑 To get the correct password:');
console.log('1. Go to Supabase Dashboard → Your Project');
console.log('2. Settings → Database');
console.log('3. Look for "Connection string" section');
console.log('4. Copy the "Direct connection" string');
console.log('5. It should look like:');
console.log('   postgresql://postgres:[YOUR-PASSWORD]@db.nwdgtdzrcyfmislilucy.supabase.co:5432/postgres');

console.log('\n🛠️  Alternative: Use Service Role for database operations');
console.log('The service role key might have sufficient permissions for many operations.');

// Try to parse the existing URL
if (process.env.DATABASE_DIRECT_URL) {
  try {
    const url = new URL(process.env.DATABASE_DIRECT_URL);
    console.log('\n📋 Parsed connection details:');
    console.log('Host:', url.hostname);
    console.log('Port:', url.port);
    console.log('Database:', url.pathname.slice(1));
    console.log('Username:', url.username);
    console.log('Password:', url.password ? '[HIDDEN]' : 'NOT SET');
  } catch (err) {
    console.log('\n❌ Error parsing DATABASE_DIRECT_URL:', err.message);
  }
}

console.log('\n💡 If you need to reset the database password:');
console.log('1. Go to Supabase Dashboard → Settings → Database');
console.log('2. Click "Reset database password"');
console.log('3. Update the DATABASE_DIRECT_URL in .env');

console.log('\n🚀 Or we can work with what we have using enhanced service role functions!');
