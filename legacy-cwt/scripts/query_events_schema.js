/**
 * Query the database to check events table schema
 */
const { Client } = require('pg');
require('dotenv').config();

async function queryDatabase() {
    console.log('=== Database Schema Query ===');
    
    const client = new Client({
        connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('✅ Connected to database successfully');

        // Check if events table exists
        const tableExistsResult = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'events'
            );
        `);
        
        const eventsTableExists = tableExistsResult.rows[0].exists;
        console.log(`\nEvents table exists: ${eventsTableExists}`);

        if (eventsTableExists) {
            // Get events table schema
            const schemaResult = await client.query(`
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    character_maximum_length
                FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = 'events'
                ORDER BY ordinal_position;
            `);

            console.log('\nEvents table schema:');
            console.log('─'.repeat(80));
            schemaResult.rows.forEach(col => {
                console.log(`${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable.padEnd(10)} ${col.column_default || ''}`);
            });

            // Get count and sample data
            const countResult = await client.query('SELECT COUNT(*) FROM events;');
            const count = parseInt(countResult.rows[0].count);
            console.log(`\nTotal events in table: ${count}`);

            if (count > 0) {
                const sampleResult = await client.query(`
                    SELECT id, title, start_at, end_at, recurrence_rule, is_availability_block, series_id, parent_event_id
                    FROM events 
                    ORDER BY created_at DESC 
                    LIMIT 5;
                `);

                console.log('\nSample events:');
                console.log('─'.repeat(80));
                sampleResult.rows.forEach(event => {
                    console.log(`ID: ${event.id}, Title: ${event.title || 'No title'}`);
                    console.log(`  Start: ${event.start_at}, Series: ${event.series_id}, Parent: ${event.parent_event_id}`);
                    console.log(`  Recurrence: ${event.recurrence_rule || 'None'}`);
                    console.log(`  Availability Block: ${event.is_availability_block}`);
                    console.log();
                });
            }
        }

        // Check availability_exceptions table
        const availExistsResult = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'availability_exceptions'
            );
        `);
        
        const availTableExists = availExistsResult.rows[0].exists;
        console.log(`\nAvailability exceptions table exists: ${availTableExists}`);

        if (availTableExists) {
            const availCountResult = await client.query('SELECT COUNT(*) FROM availability_exceptions;');
            const availCount = parseInt(availCountResult.rows[0].count);
            console.log(`Total availability exceptions: ${availCount}`);

            if (availCount > 0) {
                const availSampleResult = await client.query(`
                    SELECT id, date, reason, all_day, start_time, end_time
                    FROM availability_exceptions 
                    ORDER BY date DESC 
                    LIMIT 3;
                `);

                console.log('\nSample availability exceptions:');
                availSampleResult.rows.forEach(exc => {
                    console.log(`  ${exc.date}: ${exc.reason} (All day: ${exc.all_day})`);
                });
            }
        }

        // Check related tables
        const tablesToCheck = ['bookings', 'lesson_types', 'athletes', 'parents'];
        console.log('\nRelated tables:');
        console.log('─'.repeat(40));

        for (const table of tablesToCheck) {
            try {
                const tableExistsResult = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    );
                `, [table]);
                
                const exists = tableExistsResult.rows[0].exists;
                
                if (exists) {
                    const countResult = await client.query(`SELECT COUNT(*) FROM ${table};`);
                    const count = parseInt(countResult.rows[0].count);
                    console.log(`${table.padEnd(20)} EXISTS (${count} records)`);
                } else {
                    console.log(`${table.padEnd(20)} MISSING`);
                }
            } catch (err) {
                console.log(`${table.padEnd(20)} ERROR: ${err.message}`);
            }
        }

        console.log('\n=== Query Complete ===');

    } catch (error) {
        console.error('❌ Database error:', error.message);
        console.error('Full error:', error);
    } finally {
        await client.end();
    }
}

queryDatabase().catch(console.error);
