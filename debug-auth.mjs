#!/usr/bin/env node

/**
 * Debug API Authentication Test
 * Simple test to debug authentication issue
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:6001/api';

async function testAuth() {
  console.log('🔐 Testing admin authentication flow...\n');

  // Step 1: Login
  console.log('1. Attempting login...');
  const loginResponse = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@coachwilltumbles.com',
      password: 'TumbleCoach2025!'
    })
  });

  console.log(`   Response status: ${loginResponse.status}`);
  
  if (!loginResponse.ok) {
    const error = await loginResponse.json();
    console.log(`   Error: ${error.error}`);
    return;
  }

  // Get session cookie
  const cookies = loginResponse.headers.get('set-cookie');
  console.log(`   Session cookie received: ${cookies ? 'Yes' : 'No'}`);
  
  if (!cookies) {
    console.log('   No session cookie - authentication failed');
    return;
  }

  // Step 2: Test a protected endpoint
  console.log('\n2. Testing protected endpoint with session...');
  const testResponse = await fetch(`${API_BASE}/tenants`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    }
  });

  console.log(`   Response status: ${testResponse.status}`);
  console.log(`   Content-Type: ${testResponse.headers.get('content-type')}`);
  
  const responseText = await testResponse.text();
  console.log(`   Response preview: ${responseText.substring(0, 100)}...`);

  if (responseText.includes('<!DOCTYPE')) {
    console.log('   ❌ Received HTML instead of JSON - routing issue');
  } else {
    console.log('   ✅ Received JSON response');
    try {
      const data = JSON.parse(responseText);
      console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      console.log('   Could not parse as JSON');
    }
  }

  // Step 3: Test auth status
  console.log('\n3. Checking auth status...');
  const statusResponse = await fetch(`${API_BASE}/auth/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    }
  });

  const statusData = await statusResponse.json();
  console.log(`   Auth status: ${JSON.stringify(statusData, null, 2)}`);
}

testAuth().catch(console.error);
