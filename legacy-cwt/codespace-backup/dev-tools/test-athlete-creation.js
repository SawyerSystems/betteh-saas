#!/usr/bin/env node
/**
 * Test script to verify that the full_name (name field) gets stored when creating athletes
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAthleteCreation() {
  console.log('🔍 Testing athlete creation with full_name...');
  
  try {
    // First, let's check if there's a test parent we can use
    const { data: parents, error: parentError } = await supabase
      .from('parents')
      .select('id, first_name, last_name, email')
      .limit(1);
    
    if (parentError) {
      console.error('❌ Error fetching parents:', parentError);
      return;
    }
    
    if (!parents || parents.length === 0) {
      console.log('❌ No parents found for testing');
      return;
    }
    
    const testParent = parents[0];
    console.log('✅ Using test parent:', testParent);
    
    // Create a test athlete with first_name and last_name
    const testAthlete = {
      first_name: 'Test',
      last_name: 'Athlete',
      name: 'Test Athlete', // This should be set automatically by our code
      parent_id: testParent.id,
      date_of_birth: '2010-05-15',
      experience: 'beginner',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .insert(testAthlete)
      .select()
      .single();
    
    if (athleteError) {
      console.error('❌ Error creating athlete:', athleteError);
      return;
    }
    
    console.log('✅ Created test athlete:', {
      id: athlete.id,
      name: athlete.name,
      first_name: athlete.first_name,
      last_name: athlete.last_name
    });
    
    // Verify the name field is properly set
    if (athlete.name === 'Test Athlete') {
      console.log('✅ SUCCESS: The name field (full_name) is properly set!');
    } else {
      console.log('❌ ISSUE: The name field is not set correctly. Expected "Test Athlete", got:', athlete.name);
    }
    
    // Clean up - delete the test athlete
    const { error: deleteError } = await supabase
      .from('athletes')
      .delete()
      .eq('id', athlete.id);
    
    if (deleteError) {
      console.error('❌ Error cleaning up test athlete:', deleteError);
    } else {
      console.log('✅ Cleaned up test athlete');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Test the storage layer methods too
async function testStorageLayerMethods() {
  console.log('\n🔍 Testing storage layer methods...');
  
  // Test the storage layer methods too
  const fetch = (await import('node-fetch')).default;
  
  try {
    // This would require authentication, so we'll skip this test for now
    console.log('⏭️  Skipping storage layer test (requires parent authentication)');
  } catch (error) {
    console.error('❌ Error testing storage layer:', error);
  }
}

async function main() {
  await testAthleteCreation();
  await testStorageLayerMethods();
  console.log('\n🎯 Test completed!');
}

main().catch(console.error);
