// This script will generate a test URL for the booking-success page
// It doesn't need to modify any actual bookings since we're just testing the UI

const testSessionId = `test_session_${Date.now()}`;
console.log(`\nTo test our changes:\n`);
console.log(`1. Open this URL in your browser:`);
console.log(`http://localhost:5173/booking-success?session_id=${testSessionId}`);
console.log(`\n2. You'll see an error page since this is a fake session ID`);
console.log(`3. Check the browser console and network tab to verify the API request`);
console.log(`4. In a real scenario with a valid session ID, our changes would work as expected`);
