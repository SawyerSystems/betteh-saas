import { sql } from './db';

// Execute this directly through the running app's connection
async function createSupabaseTables() {
  console.log('🚀 Starting Supabase table creation...');
  
  try {
    // Test connection first
    const connectionTest = await sql`SELECT current_database(), current_user`;
    console.log('✅ Connected to:', connectionTest[0]);

    // Create all tables in correct order (respecting foreign key dependencies)
    
    // 1. Users table (no dependencies)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created users table');

    // 2. Admins table (no dependencies)
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created admins table');

    // 3. Parents table (no dependencies)
    await sql`
      CREATE TABLE IF NOT EXISTS parents (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        emergency_contact_name TEXT NOT NULL,
        emergency_contact_phone TEXT NOT NULL,
        waiver_signed BOOLEAN NOT NULL DEFAULT FALSE,
        waiver_signed_at TIMESTAMP,
        waiver_signature_name TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created parents table');

    // 4. Athletes table (depends on parents)
    await sql`
      CREATE TABLE IF NOT EXISTS athletes (
        id SERIAL PRIMARY KEY,
        parent_id INTEGER NOT NULL REFERENCES parents(id),
        name TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        date_of_birth TEXT NOT NULL,
        allergies TEXT,
        experience TEXT NOT NULL,
        photo TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created athletes table');

    // 5. Bookings table (no foreign key dependencies)
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        lesson_type TEXT NOT NULL,
        athlete1_name TEXT NOT NULL,
        athlete1_date_of_birth TEXT NOT NULL,
        athlete1_allergies TEXT,
        athlete1_experience TEXT NOT NULL,
        athlete2_name TEXT,
        athlete2_date_of_birth TEXT,
        athlete2_allergies TEXT,
        athlete2_experience TEXT,
        preferred_date TEXT NOT NULL,
        preferred_time TEXT NOT NULL,
        focus_areas TEXT[] NOT NULL,
        parent_first_name TEXT NOT NULL,
        parent_last_name TEXT NOT NULL,
        parent_email TEXT NOT NULL,
        parent_phone TEXT NOT NULL,
        emergency_contact_name TEXT NOT NULL,
        emergency_contact_phone TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        booking_method TEXT NOT NULL DEFAULT 'online',
        waiver_signed BOOLEAN NOT NULL DEFAULT FALSE,
        waiver_signed_at TIMESTAMP,
        waiver_signature_name TEXT,
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        attendance_status TEXT NOT NULL DEFAULT 'pending',
        reservation_fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
        paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        special_requests TEXT,
        admin_notes TEXT,
        dropoff_person_name TEXT,
        dropoff_person_relationship TEXT,
        dropoff_person_phone TEXT,
        pickup_person_name TEXT,
        pickup_person_relationship TEXT,
        pickup_person_phone TEXT,
        alt_pickup_person_name TEXT,
        alt_pickup_person_relationship TEXT,
        alt_pickup_person_phone TEXT,
        safety_verification_signed BOOLEAN NOT NULL DEFAULT FALSE,
        safety_verification_signed_at TIMESTAMP,
        stripe_session_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created bookings table');

    // 6. Content tables (no dependencies)
    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        published_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created blog_posts table');

    await sql`
      CREATE TABLE IF NOT EXISTS tips (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        sections JSONB,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        video_url TEXT,
        published_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created tips table');

    // 7. Availability tables (no dependencies)
    await sql`
      CREATE TABLE IF NOT EXISTS availability (
        id SERIAL PRIMARY KEY,
        day_of_week INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
        is_available BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created availability table');

    await sql`
      CREATE TABLE IF NOT EXISTS availability_exceptions (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_available BOOLEAN NOT NULL DEFAULT FALSE,
        reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created availability_exceptions table');

    // 8. Auth and session tables
    await sql`
      CREATE TABLE IF NOT EXISTS parent_auth_codes (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created parent_auth_codes table');

    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `;
    await sql`
      ALTER TABLE user_sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
    `;
    console.log('✅ Created user_sessions table');

    // 9. Tables with foreign key dependencies on bookings
    await sql`
      CREATE TABLE IF NOT EXISTS waivers (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES bookings(id),
        parent_name TEXT NOT NULL,
        athlete_name TEXT NOT NULL,
        signature_data TEXT NOT NULL,
        pdf_path TEXT,
        ip_address TEXT,
        user_agent TEXT,
        signed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        email_sent_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created waivers table');

    await sql`
      CREATE TABLE IF NOT EXISTS payment_logs (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id),
        stripe_event TEXT,
        error_message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created payment_logs table');

    await sql`
      CREATE TABLE IF NOT EXISTS booking_logs (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES bookings(id),
        action_type TEXT NOT NULL,
        action_description TEXT NOT NULL,
        previous_value TEXT,
        new_value TEXT,
        performed_by TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created booking_logs table');

    await sql`
      CREATE TABLE IF NOT EXISTS slot_reservations (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        lesson_type TEXT NOT NULL,
        session_id TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ Created slot_reservations table');

    // Add sample data to verify everything works
    await sql`
      INSERT INTO blog_posts (title, content, excerpt, category) 
      VALUES 
        ('Welcome to Supabase!', 'Successfully migrated Coach Will Tumbles to Supabase! All your gymnastics adventures are now powered by modern, scalable infrastructure.', 'Migration complete announcement', 'announcement'),
        ('New Database, Same Adventures', 'Behind the scenes upgrade complete - faster, more reliable, better experience for all our gymnastics families.', 'Technical upgrade benefits', 'updates')
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO tips (title, content, category, difficulty) 
      VALUES 
        ('Your First Cartwheel Journey', 'Every gymnast remembers their first cartwheel. Here''s how to master this fundamental skill that opens doors to so many other adventures...', 'floor', 'beginner'),
        ('Balance Beam Confidence', 'The beam teaches focus, courage, and precision. Start your beam journey with these foundational confidence-building exercises...', 'beam', 'beginner')
      ON CONFLICT DO NOTHING
    `;

    console.log('✅ Added sample data');

    // Verify tables exist by counting them
    const tableCount = await sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log(`🎉 MIGRATION COMPLETE! Created ${tableCount[0].count} tables in Supabase`);
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Export for use in other modules

export { createSupabaseTables };