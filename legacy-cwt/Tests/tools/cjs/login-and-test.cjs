require('dotenv').config();

async function loginAndTestAdmin() {
  console.log('🔐 Logging in to admin and testing dashboard...');
  
  try {
    // Login
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@coachwilltumbles.com',
        password: 'TumbleCoach2025!'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('✅ Login response:', loginResult);
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Session cookies:', cookies);
    
    // Check auth status after login
    const statusResponse = await fetch('http://localhost:5001/api/auth/status', {
      headers: { 'Cookie': cookies }
    });
    
    const statusResult = await statusResponse.json();
    console.log('📋 Auth status after login:', statusResult);
    
    // Test bookings endpoint
    const bookingsResponse = await fetch('http://localhost:5001/api/bookings', {
      headers: { 'Cookie': cookies }
    });
    
    const bookings = await bookingsResponse.json();
    console.log(`📊 Bookings count: ${bookings.length}`);
    
    if (bookings.length > 0) {
      console.log('First booking status:', bookings[0].status);
      console.log('First booking attendance:', bookings[0].attendanceStatus);
    }
    
    console.log('\n🌐 Now open http://localhost:5001/admin in browser and check console');
    console.log('💡 You should log in with:');
    console.log('   Email: admin@coachwilltumbles.com');
    console.log('   Password: TumbleCoach2025!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

loginAndTestAdmin();
