const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: DATABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeSchema() {
  try {
    console.log('🔍 Starting comprehensive database schema analysis...\n');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(path.join(__dirname, 'sql/analyze-database-schema.sql'), 'utf8');
    
    // Split into individual queries (rough split by semicolon, but handle multi-line)
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'))
      .map(q => q + ';');
    
    const results = {};
    
    for (const query of queries) {
      try {
        console.log('Executing query...');
        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        
        if (error) {
          console.error('Query error:', error);
          continue;
        }
        
        if (data && data.length > 0) {
          const queryType = data[0].query_type || 'UNKNOWN';
          if (!results[queryType]) {
            results[queryType] = [];
          }
          results[queryType] = results[queryType].concat(data);
        }
      } catch (err) {
        console.log('Skipping query due to error:', err.message);
      }
    }
    
    // Output results in organized format
    console.log('\n📊 DATABASE SCHEMA ANALYSIS RESULTS\n');
    console.log('=' .repeat(80));
    
    // Table Information
    if (results.TABLE_INFO) {
      console.log('\n🗃️  TABLES:');
      results.TABLE_INFO.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`);
      });
    }
    
    // Column Information for key tables
    if (results.COLUMN_INFO) {
      const keyTables = ['athletes', 'parents', 'waivers', 'bookings'];
      keyTables.forEach(tableName => {
        const tableColumns = results.COLUMN_INFO.filter(col => col.table_name === tableName);
        if (tableColumns.length > 0) {
          console.log(`\n📋 ${tableName.toUpperCase()} TABLE COLUMNS:`);
          tableColumns.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
          });
        }
      });
    }
    
    // Foreign Keys
    if (results.FOREIGN_KEY_INFO) {
      console.log('\n🔗 FOREIGN KEY RELATIONSHIPS:');
      results.FOREIGN_KEY_INFO.forEach(fk => {
        console.log(`  - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }
    
    // Views
    if (results.VIEW_INFO) {
      console.log('\n👁️  VIEWS:');
      results.VIEW_INFO.forEach(view => {
        console.log(`  - ${view.view_name}`);
      });
    }
    
    // Sample data
    console.log('\n📄 SAMPLE DATA:');
    
    if (results.ATHLETES_SAMPLE) {
      console.log('\n🏃 ATHLETES SAMPLE:');
      console.log(JSON.stringify(results.ATHLETES_SAMPLE, null, 2));
    }
    
    if (results.PARENTS_SAMPLE) {
      console.log('\n👨‍👩‍👧‍👦 PARENTS SAMPLE:');
      console.log(JSON.stringify(results.PARENTS_SAMPLE, null, 2));
    }
    
    if (results.WAIVERS_SAMPLE) {
      console.log('\n📝 WAIVERS SAMPLE:');
      console.log(JSON.stringify(results.WAIVERS_SAMPLE, null, 2));
    }
    
    if (results.BOOKINGS_SAMPLE) {
      console.log('\n📅 BOOKINGS SAMPLE:');
      console.log(JSON.stringify(results.BOOKINGS_SAMPLE, null, 2));
    }
    
    // Athlete waiver view check
    if (results.ATHLETE_WAIVER_VIEW_CHECK) {
      console.log('\n🔍 ATHLETE_WAIVER_STATUS VIEW COLUMNS:');
      results.ATHLETE_WAIVER_VIEW_CHECK.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    }
    
    // Enum types
    if (results.ENUM_TYPES) {
      console.log('\n🏷️  ENUM TYPES:');
      const enumGroups = {};
      results.ENUM_TYPES.forEach(item => {
        if (!enumGroups[item.enum_name]) {
          enumGroups[item.enum_name] = [];
        }
        enumGroups[item.enum_name].push(item.enum_value);
      });
      
      Object.entries(enumGroups).forEach(([enumName, values]) => {
        console.log(`  - ${enumName}: [${values.join(', ')}]`);
      });
    }
    
    // Save full results to file
    fs.writeFileSync(
      path.join(__dirname, 'schema-analysis-results.json'),
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n✅ Schema analysis complete! Full results saved to schema-analysis-results.json');
    
  } catch (error) {
    console.error('❌ Schema analysis failed:', error);
  }
}

// Alternative approach using direct database connection if RPC fails
async function analyzeSchemaFallback() {
  console.log('🔄 Trying fallback approach with individual queries...\n');
  
  try {
    // Simple table list
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public');
    
    if (!tablesError && tables) {
      console.log('📋 TABLES FOUND:');
      tables.forEach(table => console.log(`  - ${table.table_name}`));
    }
    
    // Check specific table structures
    const tablesToCheck = ['athletes', 'parents', 'waivers', 'bookings'];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error && data && data.length > 0) {
          console.log(`\n🔍 ${tableName.toUpperCase()} STRUCTURE (from sample row):`);
          const sampleRow = data[0];
          Object.keys(sampleRow).forEach(key => {
            const value = sampleRow[key];
            const type = typeof value;
            console.log(`  - ${key}: ${type} (${value === null ? 'NULL' : 'has value'})`);
          });
        }
      } catch (err) {
        console.log(`⚠️  Could not analyze ${tableName}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Fallback analysis also failed:', error);
  }
}

// Run the analysis
analyzeSchema().catch(() => {
  console.log('\n🔄 Primary analysis failed, trying fallback...');
  analyzeSchemaFallback();
});
