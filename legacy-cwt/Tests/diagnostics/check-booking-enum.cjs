require('dotenv').config();
const { Client } = require('pg');

async function checkSchema() {
  try {
    console.log('Connecting to database using DATABASE_DIRECT_URL...');
    
    const client = new Client({
      connectionString: process.env.DATABASE_DIRECT_URL
    });
    
    await client.connect();
    
    console.log('Checking booking_status enum in Supabase...');
    
    // Query for enum types
    const enumTypes = await client.query(`
      SELECT typname AS name, 
             array_agg(enumlabel ORDER BY enumsortorder) AS values
      FROM pg_type
      JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
      WHERE typname = 'booking_status'
      GROUP BY typname;
    `);
    
    console.log('Booking status enum definition:', enumTypes.rows);
    
    // Check booking table schema
    const bookingColumns = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'bookings'
        AND column_name = 'status';
    `);
    
    console.log('Booking status column definition:', bookingColumns.rows);
    
    // Check for values in use
    const statusValues = await client.query(`
      SELECT status, COUNT(*) as count
      FROM bookings
      GROUP BY status
      ORDER BY count DESC;
    `);
    
    console.log('Current booking status values in use:', statusValues.rows);
    
    // Close the connection
    await client.end();
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkSchema();
