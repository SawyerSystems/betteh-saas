require('dotenv').config();
const { Client } = require('pg');

async function checkDefaultConstraints() {
  try {
    console.log('Connecting to database...');
    
    const client = new Client({
      connectionString: process.env.DATABASE_DIRECT_URL
    });
    
    await client.connect();
    
    // Check for default constraint on the status column
    const defaultConstraints = await client.query(`
      SELECT pg_get_expr(adbin, adrelid) as default_expr
      FROM pg_attribute
      JOIN pg_attrdef ON pg_attribute.attrelid = pg_attrdef.adrelid AND pg_attribute.attnum = pg_attrdef.adnum
      JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
      JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
      WHERE pg_namespace.nspname = 'public'
        AND pg_class.relname = 'bookings'
        AND pg_attribute.attname = 'status';
    `);
    
    console.log('Default constraints for status column:', defaultConstraints.rows);
    
    // Close the connection
    await client.end();
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDefaultConstraints();
