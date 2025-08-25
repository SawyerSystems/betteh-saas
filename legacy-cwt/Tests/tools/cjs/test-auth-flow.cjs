require('dotenv').config();

async function testAuthFlow() {
  console.log('🔍 Testing complete auth flow...');
  
  try {
    // Step 1: Login
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@coachwilltumbles.com',
        password: 'TumbleCoach2025!'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login success:', loginResult.success);
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Got cookies:', !!cookies);
    
    // Step 2: Check auth status (same as frontend does)
    console.log('\n2️⃣ Checking auth status...');
    const authResponse = await fetch('http://localhost:5001/api/auth/status', {
      headers: { 'Cookie': cookies },
      credentials: 'include'
    });
    
    const authStatus = await authResponse.json();
    console.log('Auth status response:', authStatus);
    console.log('Auth loggedIn:', authStatus.loggedIn);
    
    // Step 3: Test bookings call (enabled check)
    console.log('\n3️⃣ Testing bookings query enablement...');
    if (authStatus.loggedIn) {
      console.log('✅ Auth status allows bookings query to run');
      
      const bookingsResponse = await fetch('http://localhost:5001/api/bookings', {
        headers: { 'Cookie': cookies },
        credentials: 'include'
      });
      
      const bookings = await bookingsResponse.json();
      console.log('Bookings count:', bookings.length);
      
      if (bookings.length > 0) {
        console.log('First booking:', {
          id: bookings[0].id,
          status: bookings[0].status,
          attendanceStatus: bookings[0].attendanceStatus
        });
      }
    } else {
      console.log('❌ Auth status would prevent bookings query from running');
    }
    
    // Step 4: Test with simple browser session
    console.log('\n4️⃣ Testing what browser might receive...');
    const browserAuthResponse = await fetch('http://localhost:5001/api/auth/status');
    const browserAuthStatus = await browserAuthResponse.json();
    console.log('Browser auth status (no cookies):', browserAuthStatus);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAuthFlow();
