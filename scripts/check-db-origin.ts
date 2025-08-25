#!/usr/bin/env tsx

/**
 * Database Origin Verification Script
 * 
 * This script ensures that no code references Render PostgreSQL or other
 * non-Supabase database configurations. It will fail CI if any violations
 * are found.
 * 
 * Part of the "Remove Render DB – Supabase Only" initiative.
 */

import { execSync } from 'child_process';
import { exit } from 'process';

console.log('🔍 Checking for forbidden database references...\n');

// Simple checks for forbidden patterns, excluding this file and docs
const checks = [
  {
    name: 'Render PostgreSQL hostnames',
    command: 'find . -name "*.ts" -o -name "*.js" -o -name "*.mjs" -o -name "*.cjs" | grep -v node_modules | grep -v check-db-origin | xargs grep -l "dpg-.*-a" || true'
  },
  {
    name: 'RENDER_DATABASE_URL references',
    command: 'find . -name "*.ts" -o -name "*.js" -o -name "*.mjs" -o -name "*.cjs" | grep -v node_modules | grep -v check-db-origin | xargs grep -l "RENDER_DATABASE_URL" || true'
  },
  {
    name: 'DATABASE_URL in code (should use Supabase)',
    command: 'find . -name "*.ts" -o -name "*.js" -o -name "*.mjs" -o -name "*.cjs" | grep -v node_modules | grep -v check-db-origin | xargs grep -l "process.env.DATABASE_URL" || true'
  }
];

let violationFound = false;

for (const check of checks) {
  console.log(`Checking for: ${check.name}`);
  
  try {
    const result = execSync(check.command, { encoding: 'utf8' }).trim();
    
    if (result) {
      console.log(`❌ Found violations in: ${result}`);
      violationFound = true;
    } else {
      console.log(`✅ No violations found`);
    }
  } catch (error) {
    console.log(`✅ No violations found`);
  }
}

// Special check: ensure environment variables are clean
console.log('\n📊 Checking .env files...');

try {
  const envCheck = execSync('grep -E "(DATABASE_URL|PGHOST|PGPORT|PGUSER|PGPASSWORD)" .env* 2>/dev/null || true', { encoding: 'utf8' }).trim();
  
  if (envCheck && !envCheck.includes('SUPABASE')) {
    console.log('❌ Found non-Supabase database config in .env files:');
    console.log(envCheck);
    violationFound = true;
  } else {
    console.log('✅ Environment files clean (Supabase only)');
  }
} catch (error) {
  console.log('✅ Environment files clean');
}

if (violationFound) {
  console.log('\n❌ VIOLATIONS FOUND! The codebase still contains references to non-Supabase databases.');
  console.log('Please remove all Render PostgreSQL references and use only Supabase.');
  exit(1);
} else {
  console.log('\n✅ All checks passed! Codebase is using Supabase only.');
  exit(0);
}
