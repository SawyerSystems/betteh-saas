-- Add cancellation tracking fields to bookings table
-- Run this SQL in Supabase SQL editor

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS wants_reschedule BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reschedule_preferences TEXT;

-- Add helpful comments
COMMENT ON COLUMN bookings.cancellation_reason IS 'Reason provided by parent when cancelling booking';
COMMENT ON COLUMN bookings.cancellation_requested_at IS 'Timestamp when cancellation was requested';
COMMENT ON COLUMN bookings.wants_reschedule IS 'Whether parent wants to reschedule vs fully cancel';
COMMENT ON COLUMN bookings.reschedule_preferences IS 'JSON string with preferred dates/times for reschedule';
