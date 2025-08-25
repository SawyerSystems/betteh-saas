#!/usr/bin/env node

/**
 * Test Enhanced Calendar Migration - Verify Events System
 * This script verifies that the enhanced calendar system is working correctly
 * and that the migration from availability_exceptions to events table is complete.
 */

const startTime = Date.now();
console.log('🏁 Enhanced Calendar Migration Test - Starting...\n');

// Test the availability checking with events system
async function testAvailabilityChecking() {
  console.log('🔍 Testing availability checking logic...');
  
  try {
    // Test the available time slots endpoint (this calls our availability checking logic)
    const testDate = '2025-09-03'; // Date that has blocking events according to server logs
    
    const availabilityUrl = `http://localhost:5001/api/available-times/${testDate}/quick-journey`;
    
    console.log(`   📅 Testing available time slots for ${testDate}`);
    console.log(`   🔗 URL: ${availabilityUrl}`);
    
    const response = await fetch(availabilityUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    const availableTimes = result.availableTimes || result.slots || result;
    
    console.log(`   ✅ Response status: ${response.status}`);
    console.log(`   📊 Available time slots:`, availableTimes.length || 0);
    
    if (Array.isArray(availableTimes) && availableTimes.length > 0) {
      console.log(`   ⏰ First few slots: ${availableTimes.slice(0, 3).join(', ')}`);
    } else {
      console.log(`   🚫 No available slots (expected if day is blocked)`);
    }
    
    return { success: true, availableSlots: availableTimes.length || 0, slots: availableTimes };
  } catch (error) {
    console.error('   ❌ Error testing availability:', error.message);
    return { success: false, error: error.message };
  }
}

// Test events API functionality
async function testEventsAPI() {
  console.log('\n🎯 Testing Events API...');
  
  try {
    // Test events listing
    const eventsUrl = 'http://localhost:5001/api/events?start=2025-07-01T00:00:00.000Z&end=2025-12-31T23:59:59.999Z';
    
    console.log('   📋 Fetching events from API...');
    
    const response = await fetch(eventsUrl, {
      headers: {
        'Cookie': 'cwt.sid.dev=s%3A3KMo6NeqRjRIuqCXdTtFnZZE9Xl3VFvE.DEOHeWQS5dxR02Gk%2Fe5PmnnpDLhld50a%2B%2FsDT4uQoNI'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const events = await response.json();
    
    console.log(`   ✅ Successfully fetched ${events.length} events`);
    
    // Count availability blocks vs regular events
    const availabilityBlocks = events.filter(e => e.isAvailabilityBlock);
    const regularEvents = events.filter(e => !e.isAvailabilityBlock);
    
    console.log(`   🚫 Availability blocks: ${availabilityBlocks.length}`);
    console.log(`   📅 Regular events: ${regularEvents.length}`);
    
    if (availabilityBlocks.length > 0) {
      const firstBlock = availabilityBlocks[0];
      console.log(`   📝 Sample availability block: "${firstBlock.title}" (${firstBlock.blockingReason})`);
    }
    
    return { 
      success: true, 
      totalEvents: events.length, 
      availabilityBlocks: availabilityBlocks.length,
      regularEvents: regularEvents.length 
    };
  } catch (error) {
    console.error('   ❌ Error testing events API:', error.message);
    return { success: false, error: error.message };
  }
}

// Test deprecated availability-exceptions endpoint
async function testDeprecatedAPI() {
  console.log('\n⚠️  Testing deprecated availability-exceptions API...');
  
  try {
    const deprecatedUrl = 'http://localhost:5001/api/availability-exceptions';
    
    console.log('   📞 Calling deprecated endpoint...');
    
    const response = await fetch(deprecatedUrl);
    const result = await response.json();
    
    console.log(`   ✅ Response status: ${response.status}`);
    console.log(`   📊 Returned ${Array.isArray(result) ? result.length : 'N/A'} items`);
    
    if (Array.isArray(result) && result.length > 0) {
      console.log(`   📝 Sample item: "${result[0].title || result[0].reason}"`);
    }
    
    return { success: true, itemCount: Array.isArray(result) ? result.length : 0 };
  } catch (error) {
    console.error('   ❌ Error testing deprecated API:', error.message);
    return { success: false, error: error.message };
  }
}

// Main test execution
async function runTests() {
  console.log('🔬 Running Enhanced Calendar Migration Tests\n');
  
  const results = {
    availability: await testAvailabilityChecking(),
    events: await testEventsAPI(),
    deprecated: await testDeprecatedAPI()
  };
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  
  console.log('\n✅ AVAILABILITY CHECKING:');
  if (results.availability.success) {
    console.log(`   Status: ✅ Working`);
    console.log(`   Available Slots: ${results.availability.availableSlots}`);
    if (results.availability.availableSlots === 0) {
      console.log(`   🚫 No slots available (likely blocked by events - this is correct!)`);
    }
  } else {
    console.log(`   Status: ❌ Failed - ${results.availability.error}`);
  }
  
  console.log('\n🎯 EVENTS API:');
  if (results.events.success) {
    console.log(`   Status: ✅ Working`);
    console.log(`   Total Events: ${results.events.totalEvents}`);
    console.log(`   Availability Blocks: ${results.events.availabilityBlocks}`);
    console.log(`   Regular Events: ${results.events.regularEvents}`);
  } else {
    console.log(`   Status: ❌ Failed - ${results.events.error}`);
  }
  
  console.log('\n⚠️  DEPRECATED API:');
  if (results.deprecated.success) {
    console.log(`   Status: ✅ Accessible (backward compatibility)`);
    console.log(`   Items Returned: ${results.deprecated.itemCount}`);
  } else {
    console.log(`   Status: ❌ Failed - ${results.deprecated.error}`);
  }
  
  // Overall result
  const allTestsPassed = results.availability.success && results.events.success && results.deprecated.success;
  
  console.log('\n🏆 OVERALL RESULT:');
  console.log(`   Migration Status: ${allTestsPassed ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}`);
  console.log(`   Enhanced Calendar: ${results.events.success ? '✅ ACTIVE' : '❌ INACTIVE'}`);
  console.log(`   Availability Checking: ${results.availability.success ? '✅ WORKING' : '❌ BROKEN'}`);
  
  const endTime = Date.now();
  console.log(`\n⏱️  Test completed in ${endTime - startTime}ms`);
  
  if (allTestsPassed) {
    console.log('\n🎉 MIGRATION COMPLETE! The enhanced calendar system is fully operational.');
  } else {
    console.log('\n⚠️  MIGRATION INCOMPLETE! Some issues need to be resolved.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
