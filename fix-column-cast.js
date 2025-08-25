require('dotenv').config();
const { Client } = require('pg');

async function fixColumnCast() {
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.slice(0, 15) + '...');
  
  const client = new Client(process.env.DATABASE_URL);
  try {
    await client.connect();
    console.log('Connected to database');
    
    // First check current column type
    const typeCheck = await client.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'status'
    `);
    console.log('Current status column info:', typeCheck.rows[0]);
    
    // Check if it's already the correct type
    if (typeCheck.rows[0]?.udt_name === 'booking_status') {
      console.log('Column is already booking_status enum type - no change needed');
      return;
    }
    
    // Apply the fix PostgreSQL suggested
    console.log('Applying PostgreSQL suggested fix...');
    await client.query('ALTER TABLE bookings ALTER COLUMN status TYPE booking_status USING status::booking_status');
    console.log('✅ Successfully cast status column to booking_status enum');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixColumnCast();
