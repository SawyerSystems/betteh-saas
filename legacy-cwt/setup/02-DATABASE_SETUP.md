# Database Setup Guide

Complete guide for setting up the PostgreSQL database using Supabase for the CoachWillTumbles platform.

## 📋 Database Overview

The system uses PostgreSQL via Supabase with the following key components:
- **Core Tables**: Athletes, bookings, parents, lesson types, etc.
- **Authentication**: Admin and parent login systems
- **Storage**: File uploads and media management
- **RLS Policies**: Row-level security for data protection
- **Triggers**: Automated data processing and validation

## 🚀 Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project
3. Choose region closest to your users
4. Save your project URL and keys

### 2. Run Schema Setup
Execute these SQL files in order through Supabase SQL Editor:

```sql
-- 1. Core schema (athletes, bookings, etc.)
-- Copy and run: complete-database-schema-core.sql

-- 2. Authentication schema (admin/parent auth)  
-- Copy and run: complete-database-schema-auth.sql

-- 3. Site content management
-- Copy and run: site-content-schema.sql
```

## 📊 Core Database Schema

### Main Tables

#### Athletes
```sql
CREATE TABLE athletes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  experience VARCHAR(20) CHECK (experience IN ('beginner', 'intermediate', 'advanced')),
  parent_id INTEGER REFERENCES parents(id),
  photo TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Bookings
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES parents(id),
  lesson_type_id INTEGER REFERENCES lesson_types(id),
  preferred_date DATE NOT NULL,
  preferred_time TIME,
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Parents
```sql
CREATE TABLE parents (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Authentication Tables

#### Admin Users
```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Verification Tokens
```sql
CREATE TABLE parent_verification_tokens (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔒 Security Setup

### Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Parent can only see their own data
CREATE POLICY "Parents can view own athletes" ON athletes
  FOR SELECT USING (parent_id = current_setting('app.current_parent_id')::INTEGER);

-- Admin can see everything
CREATE POLICY "Admin full access" ON athletes
  FOR ALL USING (current_setting('app.user_role') = 'admin');
```

### Database Functions
```sql
-- Set current user context
CREATE OR REPLACE FUNCTION set_current_parent(parent_id INTEGER)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_parent_id', parent_id::text, true);
  PERFORM set_config('app.user_role', 'parent', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📁 Schema Files

### Available SQL Files
- **[complete-database-schema-core.sql](../complete-database-schema-core.json)** - Main application tables
- **[complete-database-schema-auth.sql](../complete-database-schema-auth.json)** - Authentication system
- **[site-content-schema.sql](./site-content-schema.sql)** - Site content management
- **[parent-login-tracking.sql](../parent-login-tracking.sql)** - Login tracking
- **[booking-status-migration.sql](../booking-status-migration.sql)** - Status management

### Execution Order
```bash
# 1. Core schema first
# 2. Authentication schema  
# 3. Site content schema
# 4. Any migration files
# 5. Sample data (optional)
```

## 🔧 Configuration

### Database Settings
```sql
-- Set timezone
SET timezone = 'America/Los_Angeles';

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Connection Settings
```bash
# In .env file
DATABASE_DIRECT_URL="postgresql://postgres:password@db.project-id.supabase.co:5432/postgres"
SUPABASE_URL=https://project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🧪 Testing & Validation

### Verify Tables
```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check relationships
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY';
```

### Test Data (Optional)
```sql
-- Create test admin
INSERT INTO admin_users (email, password_hash, name) 
VALUES ('admin@coachwilltumbles.com', '$2b$10$hashed_password', 'Admin User');

-- Create test parent
INSERT INTO parents (email, name, phone) 
VALUES ('test@example.com', 'Test Parent', '555-1234');
```

## 🚨 Important Notes

### Backup Strategy
- Supabase automatically backs up your database
- Download manual backups before major changes
- Test migrations on a copy first

### Migration Process
1. **Development**: Test changes locally
2. **Staging**: Verify on staging database  
3. **Production**: Apply during maintenance window
4. **Rollback**: Keep rollback scripts ready

### Performance Considerations
- Add indexes on frequently queried columns
- Monitor query performance in Supabase dashboard
- Use connection pooling for high traffic

## 🆘 Troubleshooting

### Common Issues
- **Connection timeouts**: Check connection string format
- **Permission errors**: Verify service role key
- **Migration failures**: Check for data conflicts
- **RLS blocking queries**: Verify policy setup

### Debug Queries
```sql
-- Check current user context
SELECT current_setting('app.current_parent_id', true);
SELECT current_setting('app.user_role', true);

-- View active connections
SELECT * FROM pg_stat_activity WHERE datname = current_database();
```

Need help? Check the [copilot-instructions.md](../.github/copilot-instructions.md) for detailed architecture information.
