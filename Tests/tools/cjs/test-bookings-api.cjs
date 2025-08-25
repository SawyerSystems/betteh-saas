require('dotenv').config();

async function testBookingsAPI() {
  console.log('🧪 Testing bookings API endpoint...');
  
  try {
    // Test direct storage method first
    const { storage } = require('./server/storage');
    console.log('📦 Testing storage.getAllBookingsWithRelations()...');
    
    const bookings = await storage.getAllBookingsWithRelations();
    console.log(`✅ Storage method returned ${bookings.length} bookings`);
    
    if (bookings.length > 0) {
      console.log('📋 Sample booking:', {
        id: bookings[0].id,
        status: bookings[0].status,
        parent_id: bookings[0].parent_id,
        lessonType: bookings[0].lessonType?.name
      });
    }
    
  } catch (error) {
    console.error('❌ Storage test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testBookingsAPI();
