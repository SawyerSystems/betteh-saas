require('dotenv').config();
const { Client } = require('pg');

async function createTestBooking() {
  const client = new Client({
    connectionString: process.env.DATABASE_DIRECT_URL
  });
  
  try {
    await client.connect();
    console.log('🧪 Creating test booking with pending status...');
    
    // First, check if we have required data
    const parentCheck = await client.query('SELECT id FROM parents LIMIT 1');
    const lessonTypeCheck = await client.query('SELECT id FROM lesson_types LIMIT 1');
    
    if (parentCheck.rows.length === 0) {
      console.log('⚠️  No parents found, creating test parent...');
      await client.query(`
        INSERT INTO parents (first_name, last_name, email, phone, created_at, updated_at)
        VALUES ('Test', 'Parent', 'test.parent@example.com', '555-0123', NOW(), NOW())
      `);
    }
    
    if (lessonTypeCheck.rows.length === 0) {
      console.log('⚠️  No lesson types found, creating test lesson type...');
      await client.query(`
        INSERT INTO lesson_types (name, description, duration_minutes, price, max_participants, created_at, updated_at)
        VALUES ('Test Lesson', 'Test lesson for demo', 60, 75.00, 1, NOW(), NOW())
      `);
    }
    
    // Get the parent and lesson type IDs
    const parent = await client.query('SELECT id FROM parents ORDER BY id DESC LIMIT 1');
    const lessonType = await client.query('SELECT id FROM lesson_types ORDER BY id DESC LIMIT 1');
    
    const parentId = parent.rows[0].id;
    const lessonTypeId = lessonType.rows[0].id;
    
    // Create test booking with pending status
    const result = await client.query(`
      INSERT INTO bookings (
        parent_id, 
        lesson_type_id,
        preferred_date,
        preferred_time,
        status,
        payment_status,
        attendance_status,
        booking_method,
        special_requests,
        focus_areas,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, 
        CURRENT_DATE + INTERVAL '3 days',
        '14:00:00',
        'pending',
        'unpaid', 
        'pending',
        'Admin',
        'Test booking for admin dashboard verification',
        ARRAY['Test Focus Area', 'Balance Training'],
        NOW(),
        NOW()
      ) RETURNING id, status, payment_status, attendance_status
    `, [parentId, lessonTypeId]);
    
    const booking = result.rows[0];
    console.log('✅ Test booking created successfully!');
    console.log('📋 Booking details:', {
      id: booking.id,
      status: booking.status,
      payment_status: booking.payment_status,
      attendance_status: booking.attendance_status
    });
    
    // Also create an athlete and link it to the booking
    const athleteResult = await client.query(`
      INSERT INTO athletes (
        first_name, last_name, date_of_birth, parent_id, experience, created_at, updated_at
      ) VALUES (
        'Test', 'Athlete', '2015-01-01', $1, 'beginner', NOW(), NOW()
      ) RETURNING id
    `, [parentId]);
    
    const athleteId = athleteResult.rows[0].id;
    
    await client.query(`
      INSERT INTO booking_athletes (booking_id, athlete_id, slot_order)
      VALUES ($1, $2, 1)
    `, [booking.id, athleteId]);
    
    console.log('👤 Test athlete created and linked to booking');
    
    return booking.id;
    
  } catch (error) {
    console.error('❌ Error creating test booking:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

createTestBooking().catch(console.error);
