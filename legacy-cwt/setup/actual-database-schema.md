-- Updated schema documentation based on actual Supabase structure
-- This file documents the ACTUAL database schema as it exists in Supabase
-- Use this as reference when updating shared/schema.ts

-- TABLES WITH ACTUAL COLUMNS:

-- athletes table
CREATE TABLE athletes (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER REFERENCES parents(id),
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  allergies TEXT,
  experience TEXT NOT NULL,
  photo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_of_birth DATE,
  gender TEXT, -- references genders(name)
  latest_waiver_id INTEGER REFERENCES waivers(id),
  waiver_status VARCHAR DEFAULT 'pending'
);

-- parents table  
CREATE TABLE parents (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- waivers table (CURRENT STRUCTURE)
CREATE TABLE waivers (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  athlete_id INTEGER NOT NULL REFERENCES athletes(id),
  parent_id INTEGER NOT NULL REFERENCES parents(id),
  relationship_to_athlete TEXT DEFAULT 'Parent/Guardian',
  signature TEXT NOT NULL,
  emergency_contact_number TEXT NOT NULL,
  understands_risks BOOLEAN DEFAULT false,
  agrees_to_policies BOOLEAN DEFAULT false,
  authorizes_emergency_care BOOLEAN DEFAULT false,
  allows_photo_video BOOLEAN DEFAULT true,
  confirms_authority BOOLEAN DEFAULT false,
  pdf_path TEXT,
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- bookings table (CURRENT STRUCTURE)
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id),
  lesson_type_id INTEGER NOT NULL REFERENCES lesson_types(id),
  waiver_id INTEGER REFERENCES waivers(id),
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  focus_areas TEXT[] NOT NULL,
  status booking_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'unpaid',
  attendance_status attendance_status DEFAULT 'pending',
  booking_method booking_method DEFAULT 'Website',
  reservation_fee_paid BOOLEAN DEFAULT false,
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  stripe_session_id TEXT,
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
  safety_verification_signed BOOLEAN DEFAULT false,
  safety_verification_signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- booking_athletes junction table
CREATE TABLE booking_athletes (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  slot_order INTEGER NOT NULL -- 1 = first slot, 2 = second, etc.
);

-- lesson_types table
CREATE TABLE lesson_types (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  is_private BOOLEAN DEFAULT false,
  max_athletes INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KEY INSIGHTS:
-- 1. Waivers table has athlete_id/parent_id foreign keys - NO athlete_name/signer_name columns
-- 2. Bookings use junction table booking_athletes for multi-athlete support  
-- 3. All relationships are properly normalized with foreign keys
-- 4. Field names are snake_case in database, need camelCase in frontend
