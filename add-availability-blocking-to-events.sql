-- Migration: Add availability blocking fields to events table
-- This allows events to replace availability_exceptions functionality

-- Add new columns for availability blocking
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_availability_block BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS blocking_reason TEXT;

-- Add index for efficient availability queries
CREATE INDEX IF NOT EXISTS idx_events_availability_blocking 
ON events (is_availability_block, start_at, end_at) 
WHERE is_availability_block = true AND is_deleted = false;

-- Add index for date range queries (for availability checking)
CREATE INDEX IF NOT EXISTS idx_events_start_end_dates 
ON events (start_at, end_at) 
WHERE is_deleted = false;

COMMENT ON COLUMN events.is_availability_block IS 'True if this event blocks availability for bookings (replaces availability_exceptions)';
COMMENT ON COLUMN events.blocking_reason IS 'Reason for blocking availability (maps to availability_exceptions.reason)';
