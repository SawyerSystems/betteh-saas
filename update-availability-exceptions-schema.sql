-- Add new columns to availability_exceptions table for personal reminder functionality
-- This enhances the table to support address fields and category classification

-- First, make start_time and end_time nullable to support all-day events
ALTER TABLE availability_exceptions ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE availability_exceptions ALTER COLUMN end_time DROP NOT NULL;

-- Add address fields (all nullable as requested)
ALTER TABLE availability_exceptions ADD COLUMN address_line_1 TEXT;
ALTER TABLE availability_exceptions ADD COLUMN address_line_2 TEXT;
ALTER TABLE availability_exceptions ADD COLUMN city TEXT;
ALTER TABLE availability_exceptions ADD COLUMN state TEXT;
ALTER TABLE availability_exceptions ADD COLUMN zip_code TEXT;
ALTER TABLE availability_exceptions ADD COLUMN country TEXT DEFAULT 'United States';

-- Add category selector with predefined options
ALTER TABLE availability_exceptions ADD COLUMN category TEXT CHECK (category IN (
  'Coaching: Team Meet/Competition',
  'Coaching: Practice', 
  'Own: Team Meet/Competition',
  'Own: Practice',
  'Medical Appointment',
  'Dental Appointment',
  'Other Appointment',
  'Meeting',
  'Busy: Work',
  'Busy: Personal'
));

-- Add optional title field for better event naming
ALTER TABLE availability_exceptions ADD COLUMN title TEXT;

-- Add notes field for additional details
ALTER TABLE availability_exceptions ADD COLUMN notes TEXT;

-- Add all_day boolean field for full day events
ALTER TABLE availability_exceptions ADD COLUMN all_day BOOLEAN DEFAULT false;

-- Update the table comment to reflect new functionality
COMMENT ON TABLE availability_exceptions IS 'Stores both availability exceptions (blocked times) and personal calendar events/reminders for Coach Will';

-- Index for better performance on date queries (sorted display)
CREATE INDEX IF NOT EXISTS idx_availability_exceptions_date_category ON availability_exceptions(date, category);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_availability_exceptions_category ON availability_exceptions(category);
