#!/usr/bin/env node
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const pg = require('pg');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=no-verify') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // First run cleanup to remove conflicting dependencies
    console.log('Cleaning up conflicting dependencies...');
    const cleanupPath = join(__dirname, 'cleanup-dependencies.sql');
    const cleanupSQL = readFileSync(cleanupPath, 'utf8');
    await client.query(cleanupSQL);
    console.log('✅ Dependencies cleaned up');
    console.log('Now run: npm run db:push');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
