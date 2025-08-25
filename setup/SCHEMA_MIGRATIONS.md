# Database Schema Migrations Guide

Guide for managing database schema updates and migrations for the CoachWillTumbles platform.

## 📋 Migration Overview

The system uses **manual SQL migrations** executed through the Supabase SQL Editor. This approach provides:
- **Full Control**: Execute complex schema changes safely
- **Review Process**: All changes are reviewed before execution
- **Rollback Support**: Easy to reverse changes if needed
- **Production Safety**: Test migrations before production deployment

## 🗄️ Available Schema Files

### Core Schema Files
Located in this directory and root folder:

#### Essential Schemas
- **[site-content-schema.sql](./site-content-schema.sql)** - Site content management system
- **[complete-database-schema-core.json](../complete-database-schema-core.json)** - Main application tables
- **[complete-database-schema-auth.json](../complete-database-schema-auth.json)** - Authentication system

#### Migration Files
- **[booking-status-migration.sql](../booking-status-migration.sql)** - Booking status enum updates
- **[parent-login-tracking.sql](../parent-login-tracking.sql)** - Parent login tracking
- **[focus_areas_level_update.sql](../focus_areas_level_update.sql)** - Focus areas enhancements
- **[comprehensive-waiver-cleanup.sql](../comprehensive-waiver-cleanup.sql)** - Waiver system cleanup

#### Utility Scripts
- **[find-duplicate-bookings.sql](../find-duplicate-bookings.sql)** - Data cleanup queries
- **[check-triggers.sql](../check-triggers.sql)** - Validate database triggers
- **[debug-waiver-triggers.sql](../debug-waiver-triggers.sql)** - Waiver system debugging

## 🚀 Migration Process

### 1. Development Environment
```sql
-- Execute in Supabase SQL Editor for your development project
-- Test all changes thoroughly before production
```

### 2. Production Deployment
```sql
-- 1. Backup database (Supabase does this automatically)
-- 2. Execute during maintenance window
-- 3. Verify changes with test queries
-- 4. Monitor application logs
```

### 3. Rollback Process
```sql
-- Keep rollback scripts ready for each migration
-- Test rollback process in development first
-- Document rollback steps in migration comments
```

## 📋 Execution Order

### Initial Setup (New Installation)
Execute in this order:
```sql
-- 1. Core application schema
-- Execute: complete-database-schema-core.json (via Supabase dashboard)

-- 2. Authentication system
-- Execute: complete-database-schema-auth.json (via Supabase dashboard)

-- 3. Site content management
-- Execute: site-content-schema.sql

-- 4. Any additional feature schemas
-- Execute based on requirements
```

### Updates (Existing Installation)
```sql
-- 1. Check current schema version
SELECT version FROM schema_versions ORDER BY applied_at DESC LIMIT 1;

-- 2. Apply migrations in chronological order
-- Check file dates and migration dependencies

-- 3. Update schema version
INSERT INTO schema_versions (version, description, applied_at) 
VALUES ('v2.1.0', 'Site content management', NOW());
```

## 🔧 Schema Management

### Version Tracking
```sql
-- Create schema versioning table
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  applied_at TIMESTAMP DEFAULT NOW(),
  applied_by VARCHAR(255) DEFAULT current_user
);

-- Track migrations
INSERT INTO schema_versions (version, description)
VALUES ('v1.0.0', 'Initial schema setup');
```

### Migration Template
```sql
-- Migration: [DESCRIPTION]
-- Version: [VERSION]
-- Date: [DATE]
-- Author: [AUTHOR]

-- Pre-migration checks
DO $$
BEGIN
  -- Check prerequisites
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'required_table') THEN
    RAISE EXCEPTION 'Required table missing. Run previous migrations first.';
  END IF;
END $$;

-- Begin transaction
BEGIN;

-- Migration changes
CREATE TABLE new_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_new_table_name ON new_table(name);

-- Update data
UPDATE existing_table SET status = 'active' WHERE status IS NULL;

-- Verify changes
SELECT COUNT(*) FROM new_table; -- Should return 0 for new table

-- Commit transaction
COMMIT;

-- Post-migration validation
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'new_table'
ORDER BY ordinal_position;

-- Record migration
INSERT INTO schema_versions (version, description)
VALUES ('v1.1.0', 'Added new_table for feature X');
```

## 🛠️ Common Migration Patterns

### Adding New Tables
```sql
-- Create table with proper constraints
CREATE TABLE lesson_schedules (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_lesson_schedules_booking_id ON lesson_schedules(booking_id);
CREATE INDEX idx_lesson_schedules_date ON lesson_schedules(scheduled_date);

-- Add RLS policies
ALTER TABLE lesson_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own schedules" ON lesson_schedules
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE parent_id = current_setting('app.current_parent_id')::INTEGER
    )
  );
```

### Modifying Existing Tables
```sql
-- Add new columns safely
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

-- Modify columns with data preservation
ALTER TABLE athletes ALTER COLUMN experience TYPE VARCHAR(50);
UPDATE athletes SET experience = 'intermediate' WHERE experience IS NULL;
ALTER TABLE athletes ALTER COLUMN experience SET NOT NULL;

-- Add constraints
ALTER TABLE bookings ADD CONSTRAINT check_priority CHECK (priority BETWEEN 1 AND 5);
```

### Updating Enums
```sql
-- Add new enum values
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rescheduled';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'refunded';

-- Update existing data
UPDATE bookings SET status = 'rescheduled' WHERE status = 'cancelled' AND reschedule_date IS NOT NULL;
```

## 🔍 Validation Queries

### Schema Validation
```sql
-- Check table existence
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check column definitions
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;
```

### Data Validation
```sql
-- Check data integrity
SELECT 
  'bookings' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status IS NULL) as null_status,
  COUNT(*) FILTER (WHERE parent_id IS NULL) as null_parent_id
FROM bookings

UNION ALL

SELECT 
  'athletes' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE name IS NULL OR name = '') as null_or_empty_name,
  COUNT(*) FILTER (WHERE experience IS NULL) as null_experience
FROM athletes;
```

## 🚨 Rollback Procedures

### Rollback Templates
```sql
-- Rollback for table creation
DROP TABLE IF EXISTS new_table CASCADE;

-- Rollback for column addition
ALTER TABLE existing_table DROP COLUMN IF EXISTS new_column;

-- Rollback for data updates
UPDATE table_name SET column_name = 'old_value' WHERE condition;

-- Remove migration record
DELETE FROM schema_versions WHERE version = 'v1.1.0';
```

### Emergency Rollback
```sql
-- Complete rollback to previous state
BEGIN;

-- 1. Drop new objects
DROP TABLE IF EXISTS new_tables CASCADE;

-- 2. Restore modified data
UPDATE modified_table SET column = original_value WHERE condition;

-- 3. Remove constraints
ALTER TABLE table_name DROP CONSTRAINT IF EXISTS new_constraint;

-- 4. Update version
DELETE FROM schema_versions WHERE version >= 'v1.1.0';

COMMIT;
```

## 📊 Migration Monitoring

### Performance Impact
```sql
-- Monitor migration performance
SELECT 
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_tup_upd + n_tup_ins + n_tup_del DESC;
```

### Lock Monitoring
```sql
-- Check for locks during migration
SELECT 
  pl.pid,
  pl.mode,
  pl.locktype,
  pl.relation::regclass,
  pa.query
FROM pg_locks pl
JOIN pg_stat_activity pa ON pl.pid = pa.pid
WHERE pl.granted = true;
```

## 📝 Best Practices

### Before Migration
- [ ] **Backup database** (Supabase auto-backups available)
- [ ] **Test in development** environment first
- [ ] **Review migration** with team
- [ ] **Plan rollback** procedure
- [ ] **Schedule maintenance** window if needed

### During Migration
- [ ] **Use transactions** for atomic changes
- [ ] **Monitor performance** impact
- [ ] **Validate each step** before proceeding
- [ ] **Keep rollback scripts** ready
- [ ] **Document any issues** encountered

### After Migration
- [ ] **Verify application** functionality
- [ ] **Check data integrity** with validation queries
- [ ] **Monitor error logs** for issues
- [ ] **Update documentation** if needed
- [ ] **Communicate completion** to team

## 🆘 Troubleshooting

### Common Issues
```sql
-- Permission errors
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Constraint violations
SELECT * FROM table_name WHERE condition_that_violates_constraint;

-- Lock timeouts
SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE query LIKE '%stuck_query%';
```

### Debug Queries
```sql
-- Find problematic data
SELECT * FROM table_name WHERE column_name NOT IN (SELECT valid_value FROM reference_table);

-- Check foreign key violations
SELECT * FROM child_table c LEFT JOIN parent_table p ON c.parent_id = p.id WHERE p.id IS NULL;

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM large_table WHERE indexed_column = 'value';
```

For more information, see:
- [Database Setup Guide](./02-DATABASE_SETUP.md)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Migration Best Practices](https://www.postgresql.org/docs/current/)
