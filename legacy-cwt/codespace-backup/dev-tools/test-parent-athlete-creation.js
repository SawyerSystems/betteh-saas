#!/usr/bin/env node
/**
 * Direct test of athlete creation via API with known parent credentials
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const API_BASE = 'http://localhost:5001/api';
const PARENT_EMAIL = 'will@sawyerss.com';

async function testAthleteCreationFlow() {
  console.log('🔍 Testing athlete creation with known parent account...');
  
  try {
    // Step 1: Send auth code
    console.log('1️⃣ Sending auth code to parent...');
    const sendCodeResponse = await fetch(`${API_BASE}/parent-auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: PARENT_EMAIL })
    });
    
    if (!sendCodeResponse.ok) {
      console.error('❌ Failed to send auth code:', await sendCodeResponse.text());
      return;
    }
    
    console.log('✅ Auth code sent successfully');
    
    // Step 2: Get the most recent auth token from database
    console.log('2️⃣ Retrieving auth token...');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: tokens } = await supabase
      .from('parent_verification_tokens')
      .select('token, parent_id, expires_at')
      .eq('parent_id', 158) // Will Webb's parent ID
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!tokens || tokens.length === 0) {
      console.error('❌ No auth token found');
      return;
    }
    
    const authToken = tokens[0].token;
    console.log('✅ Retrieved auth token:', authToken.substring(0, 8) + '...');
    
    // Step 3: Verify auth code to get session
    console.log('3️⃣ Verifying auth code...');
    const verifyResponse = await fetch(`${API_BASE}/parent-auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: PARENT_EMAIL,
        code: authToken 
      })
    });
    
    if (!verifyResponse.ok) {
      console.error('❌ Failed to verify auth code:', await verifyResponse.text());
      return;
    }
    
    const cookies = verifyResponse.headers.raw()['set-cookie'];
    const sessionCookie = cookies?.find(cookie => cookie.includes('cwt.sid.dev'));
    
    if (!sessionCookie) {
      console.error('❌ No session cookie received');
      return;
    }
    
    console.log('✅ Parent authenticated successfully');
    
    // Step 4: Create athlete via API
    console.log('4️⃣ Creating athlete via API...');
    const athleteData = {
      firstName: 'Test',
      lastName: 'Athlete',
      dateOfBirth: '2010-06-15',
      experience: 'beginner',
      allergies: 'None',
      gender: 'Male'
    };
    
    const createAthleteResponse = await fetch(`${API_BASE}/parent/athletes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(athleteData)
    });
    
    if (!createAthleteResponse.ok) {
      console.error('❌ Failed to create athlete:', await createAthleteResponse.text());
      return;
    }
    
    const createdAthlete = await createAthleteResponse.json();
    console.log('✅ Created athlete via API:', {
      id: createdAthlete.id,
      name: createdAthlete.name,
      firstName: createdAthlete.firstName,
      lastName: createdAthlete.lastName,
      parentId: createdAthlete.parentId
    });
    
    // Step 5: Verify the name field is set correctly
    if (createdAthlete.name === 'Test Athlete') {
      console.log('🎉 SUCCESS: Athlete creation properly sets full_name (name field)!');
    } else {
      console.log('❌ ISSUE: Name field not set correctly. Expected "Test Athlete", got:', createdAthlete.name);
    }
    
    // Step 6: Verify in database directly
    console.log('5️⃣ Verifying in database...');
    const { data: dbAthlete } = await supabase
      .from('athletes')
      .select('id, name, first_name, last_name')
      .eq('id', createdAthlete.id)
      .single();
    
    console.log('Database record:', dbAthlete);
    
    if (dbAthlete.name === 'Test Athlete') {
      console.log('✅ Database verification: name field is correctly set!');
    } else {
      console.log('❌ Database issue: name field is:', dbAthlete.name);
    }
    
    // Cleanup
    console.log('6️⃣ Cleaning up test athlete...');
    await supabase.from('athletes').delete().eq('id', createdAthlete.id);
    console.log('✅ Test athlete cleaned up');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

async function main() {
  await testAthleteCreationFlow();
  console.log('\n🎯 Test completed!');
}

main().catch(console.error);
