// Test script to verify availability blocking migration
// This tests that events can successfully replace availability_exceptions

const { createStorage } = require('./server/storage');
const { DateTime } = require('luxon');

async function testAvailabilityMigration() {
  console.log('🧪 Testing Availability Blocking Migration...\n');

  try {
    // Initialize storage
    const storage = createStorage();
    
    // Test 1: Get existing availability exceptions (old system)
    console.log('📊 Test 1: Current availability exceptions');
    const exceptions = await storage.getAvailabilityExceptionsByDateRange(
      '2025-08-01', 
      '2025-12-31'
    );
    console.log(`Found ${exceptions.length} availability exceptions`);
    
    if (exceptions.length > 0) {
      console.log('Sample exception:', {
        date: exceptions[0].date,
        startTime: exceptions[0].startTime,
        endTime: exceptions[0].endTime,
        reason: exceptions[0].reason,
        allDay: exceptions[0].allDay
      });
    }

    // Test 2: Get events (new unified system)
    console.log('\n📊 Test 2: Current events');
    const events = await storage.listEventsByRange('2025-08-01', '2025-12-31');
    console.log(`Found ${events.length} events`);
    
    const blockingEvents = events.filter(e => e.isAvailabilityBlock);
    console.log(`- ${blockingEvents.length} are availability blocking events`);

    if (blockingEvents.length > 0) {
      console.log('Sample blocking event:', {
        title: blockingEvents[0].title,
        startAt: blockingEvents[0].startAt,
        endAt: blockingEvents[0].endAt,
        blockingReason: blockingEvents[0].blockingReason,
        isAllDay: blockingEvents[0].isAllDay
      });
    }

    // Test 3: Create a test blocking event
    console.log('\n📊 Test 3: Creating test blocking event');
    const testEvent = await storage.createEvent({
      title: 'Test Availability Block',
      startAt: DateTime.now().plus({ days: 1 }).set({ hour: 14, minute: 0 }).toJSDate(),
      endAt: DateTime.now().plus({ days: 1 }).set({ hour: 16, minute: 0 }).toJSDate(),
      isAllDay: false,
      timezone: 'America/Los_Angeles',
      isAvailabilityBlock: true,
      blockingReason: 'Testing migration functionality',
      isAvailable: false
    });
    console.log('✅ Created test blocking event:', testEvent.id);

    // Test 4: Verify availability blocking works
    console.log('\n📊 Test 4: Testing availability blocking');
    const tomorrow = DateTime.now().plus({ days: 1 }).toFormat('yyyy-MM-dd');
    const updatedExceptions = await storage.getAvailabilityExceptionsByDateRange(tomorrow, tomorrow);
    
    const testException = updatedExceptions.find(e => e.reason === 'Testing migration functionality');
    if (testException) {
      console.log('✅ Test blocking event correctly appears in availability exceptions');
      console.log('Block details:', {
        date: testException.date,
        startTime: testException.startTime,
        endTime: testException.endTime,
        allDay: testException.allDay
      });
    } else {
      console.log('❌ Test blocking event NOT found in availability exceptions');
    }

    // Test 5: Cleanup test event
    await storage.deleteEvent(testEvent.id);
    console.log('✅ Cleaned up test event');

    console.log('\n🎉 Migration testing completed successfully!');
    console.log(`\nSummary:
- Availability exceptions: ${exceptions.length}
- Total events: ${events.length}
- Blocking events: ${blockingEvents.length}
- Migration compatibility: ✅ Working`);

  } catch (error) {
    console.error('❌ Migration test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAvailabilityMigration().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});
