#!/usr/bin/env node

// Simple script to call the migration API endpoint

async function runMigration() {
  try {
    console.log('🔐 Getting admin session...');
    
    // First login as admin
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@coachwilltumbles.com',
        password: 'TumbleCoach2025!'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Admin login successful');

    // Now call the migration endpoint
    console.log('🚀 Starting migration...');
    const migrationResponse = await fetch('http://localhost:5001/api/admin/migrate-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      }
    });

    if (!migrationResponse.ok) {
      const errorText = await migrationResponse.text();
      throw new Error(`Migration failed: ${migrationResponse.status} - ${errorText}`);
    }

    const result = await migrationResponse.json();
    console.log('✅ Migration completed:', result);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
