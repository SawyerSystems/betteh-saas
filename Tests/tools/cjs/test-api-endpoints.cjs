require('dotenv').config();

async function testAPIEndpoints() {
  console.log('🧪 Testing API endpoints with authentication...');
  
  try {
    // First, let's try to authenticate as admin
    const response1 = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@coachwilltumbles.com',
        password: 'TumbleCoach2025!'
      })
    });
    
    console.log('🔐 Login response status:', response1.status);
    
    if (response1.status === 200) {
      const authResult = await response1.json();
      console.log('✅ Login successful:', authResult);
      
      // Extract session cookie
      const cookies = response1.headers.get('set-cookie');
      console.log('🍪 Session cookies:', cookies);
      
      if (cookies) {
        // Test bookings API with authentication
        const response2 = await fetch('http://localhost:5001/api/bookings', {
          headers: {
            'Cookie': cookies
          }
        });
        
        console.log('📊 Bookings API status:', response2.status);
        
        if (response2.status === 200) {
          const bookings = await response2.json();
          console.log(`✅ Active bookings returned: ${bookings.length}`);
        } else {
          const error = await response2.text();
          console.log('❌ Bookings API error:', error);
        }
        
        // Test archived bookings API
        const response3 = await fetch('http://localhost:5001/api/archived-bookings', {
          headers: {
            'Cookie': cookies
          }
        });
        
        console.log('📦 Archived bookings API status:', response3.status);
        
        if (response3.status === 200) {
          const archivedBookings = await response3.json();
          console.log(`✅ Archived bookings returned: ${archivedBookings.length}`);
          if (archivedBookings.length > 0) {
            console.log('📋 Sample archived booking:', {
              id: archivedBookings[0].id,
              status: archivedBookings[0].status,
              attendanceStatus: archivedBookings[0].attendanceStatus
            });
          }
        } else {
          const error = await response3.text();
          console.log('❌ Archived bookings API error:', error);
        }
      }
    } else {
      const error = await response1.text();
      console.log('❌ Login failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPIEndpoints();
