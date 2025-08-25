#!/usr/bin/env node
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const pg = require('pg');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function testDatabaseSchema() {
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
    console.log('✅ Database connection established');
    
    // Test 1: Check new enums exist
    console.log('\n📋 Testing Enhanced Enums...');
    
    const enumsQuery = `
      SELECT 
        typname as enum_name,
        string_agg(enumlabel, ', ' ORDER BY enumsortorder) as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE typname IN ('tenant_type', 'tenant_user_role')
      GROUP BY typname
      ORDER BY typname;
    `;
    
    const enumsResult = await client.query(enumsQuery);
    
    if (enumsResult.rows.length === 0) {
      console.log('❌ No enhanced enums found');
    } else {
      enumsResult.rows.forEach(row => {
        console.log(`✅ ${row.enum_name}: [${row.enum_values}]`);
      });
    }
    
    // Test 2: Check new tables exist
    console.log('\n📋 Testing New Tables...');
    
    const tablesQuery = `
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('locations', 'staff_locations', 'organization_hierarchy')
      AND table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ New tables not found');
    } else {
      const tableGroups = {};
      tablesResult.rows.forEach(row => {
        if (!tableGroups[row.table_name]) {
          tableGroups[row.table_name] = [];
        }
        tableGroups[row.table_name].push(`${row.column_name} (${row.data_type})`);
      });
      
      Object.entries(tableGroups).forEach(([tableName, columns]) => {
        console.log(`✅ ${tableName}: ${columns.length} columns`);
        columns.forEach(col => console.log(`   - ${col}`));
      });
    }
    
    // Test 3: Check tenants table enhancements
    console.log('\n📋 Testing Tenants Table Enhancements...');
    
    const tenantsQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tenants'
      AND column_name IN ('tenant_type', 'parent_tenant_id', 'coach_count')
      AND table_schema = 'public'
      ORDER BY column_name;
    `;
    
    const tenantsResult = await client.query(tenantsQuery);
    
    if (tenantsResult.rows.length === 0) {
      console.log('❌ Tenants table enhancements not found');
    } else {
      tenantsResult.rows.forEach(row => {
        console.log(`✅ ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'})`);
      });
    }
    
    // Test 4: Check feature_plans table
    console.log('\n📋 Testing Feature Plans Table...');
    
    const plansCountQuery = `SELECT COUNT(*) as count FROM feature_plans;`;
    const plansResult = await client.query(plansCountQuery);
    console.log(`✅ Feature plans table exists with ${plansResult.rows[0].count} plans`);
    
    // Test 5: Check tenant_users table
    console.log('\n📋 Testing Tenant Users Table...');
    
    const tenantUsersQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'tenant_users'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const tenantUsersResult = await client.query(tenantUsersQuery);
    
    if (tenantUsersResult.rows.length === 0) {
      console.log('❌ Tenant users table not found');
    } else {
      console.log(`✅ tenant_users table: ${tenantUsersResult.rows.length} columns`);
      tenantUsersResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    }
    
    console.log('\n🎉 Database schema validation completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testDatabaseSchema();
