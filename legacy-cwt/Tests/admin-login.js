import axios from 'axios';

const login = async () => {
  try {
    console.log('🔑 Logging in as admin...');
    
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@coachwilltumbles.com',
      password: 'TumbleCoach2025!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('📝 Status:', response.status);
    console.log('🍪 Check the response headers for Set-Cookie:');
    console.log(JSON.stringify(response.headers, null, 2));
    
    // Get the cookie from the response headers
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      console.log('🍪 Session cookie:', setCookieHeader);
      
      // Extract just the session cookie for easy copy-paste
      const sessionCookie = setCookieHeader[0].split(';')[0];
      console.log('📋 Copy this for use in test scripts:', sessionCookie);
    } else {
      console.log('❌ No Set-Cookie header found in response');
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    if (error.response) {
      console.error('📝 Status:', error.response.status);
      console.error('📝 Response:', error.response.data);
    }
  }
}

login();
