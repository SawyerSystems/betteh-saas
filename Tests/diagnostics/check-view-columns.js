import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkViewColumns() {
  console.log('Checking columns in athletes_with_waiver_status view...');
  
  try {
    // Get a sample row from the view
    const { data, error } = await supabase
      .from('athletes_with_waiver_status')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching data:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No data found in the view');
      return;
    }
    
    // Get the column names from the first row
    const columns = Object.keys(data[0]);
    console.log('Columns in athletes_with_waiver_status view:');
    columns.forEach(col => console.log(`- ${col}`));
    
    // Check for waiver-related columns
    const waiverColumns = columns.filter(col => col.includes('waiver'));
    console.log('\nWaiver-related columns:');
    waiverColumns.forEach(col => console.log(`- ${col}`));
    
    // Show sample data for specific columns we're interested in
    console.log('\nSample data for waiver columns:');
    waiverColumns.forEach(col => {
      console.log(`${col}: ${JSON.stringify(data[0][col])}`);
    });
    
    console.log('\nFull sample data:');
    console.log(JSON.stringify(data[0], null, 2));
  } catch (err) {
    console.error('Exception:', err);
  }
}

checkViewColumns();
