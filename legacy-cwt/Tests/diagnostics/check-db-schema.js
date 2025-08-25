const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_DIRECT_URL
});

async function checkSchema() {
  try {
    // Connect to the database
    const client = await pool.connect();
    
    console.log('Connected to Supabase PostgreSQL successfully');
    
    // Check bookings table structure
    console.log('\n--- BOOKINGS TABLE STRUCTURE ---');
    const bookingsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position;
    `);
    console.table(bookingsResult.rows);
    
    // Check booking_athletes table structure
    console.log('\n--- BOOKING_ATHLETES TABLE STRUCTURE ---');
    const bookingAthletesResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'booking_athletes'
      ORDER BY ordinal_position;
    `);
    console.table(bookingAthletesResult.rows);
    
    // Check foreign key relationships
    console.log('\n--- FOREIGN KEY RELATIONSHIPS ---');
    const fkResult = await client.query(`
      SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND
        (tc.table_name = 'bookings' OR tc.table_name = 'booking_athletes' OR 
         ccu.table_name = 'bookings' OR ccu.table_name = 'booking_athletes')
      ORDER BY tc.table_name;
    `);
    console.table(fkResult.rows);
    
    // Check if waiver_status column exists in bookings
    console.log('\n--- CHECK FOR WAIVER_STATUS COLUMN ---');
    const waiverStatusResult = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'waiver_status'
      ) as waiver_status_exists;
    `);
    console.log(`waiver_status column exists in bookings table: ${waiverStatusResult.rows[0].waiver_status_exists}`);
    
    // Check for relevant triggers
    console.log('\n--- RELEVANT TRIGGERS ---');
    const triggersResult = await client.query(`
      SELECT 
        event_object_table as table_name,
        trigger_name,
        event_manipulation as event,
        action_statement as definition
      FROM information_schema.triggers
      WHERE event_object_table IN ('bookings', 'booking_athletes', 'waivers')
      ORDER BY event_object_table, trigger_name;
    `);
    console.table(triggersResult.rows);
    
    // Release the client back to the pool
    client.release();
    console.log('Database connection released');
    
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    // Close the pool
    await pool.end();
  }
}

checkSchema();
