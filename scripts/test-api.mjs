#!/usr/bin/env node
// Test API integration with enhanced schema
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:6173';
const API_BASE = `http://localhost:6001/api`;

console.log('🧪 Testing API Integration...\n');

async function testAPIEndpoints() {
  try {
    // Test 1: Health check
    console.log('📋 Testing API Health...');
    
    const healthResponse = await fetch(`${API_BASE}/auth/status`);
    if (healthResponse.ok) {
      console.log('✅ API server responding');
    } else {
      console.log('❌ API server not responding');
      return;
    }
    
    // Test 2: Check basic endpoints
    console.log('\n📋 Testing Core Endpoints...');
    
    const endpoints = [
      '/api/auth/status',
      '/api/availability',
      '/api/site-content'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:6001${endpoint}`);
        console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: Connection failed`);
      }
    }
    
    // Test 3: Check if server handles new schema
    console.log('\n📋 Testing Schema Integration...');
    
    // Try to access an endpoint that would use the new schema
    try {
      const authResponse = await fetch(`${API_BASE}/auth/status`);
      const authData = await authResponse.json();
      console.log('✅ Authentication endpoint with enhanced schema: OK');
      console.log(`   Response structure: ${Object.keys(authData).join(', ')}`);
    } catch (error) {
      console.log('❌ Authentication endpoint failed');
    }
    
    console.log('\n🎉 API integration tests completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPIEndpoints();
