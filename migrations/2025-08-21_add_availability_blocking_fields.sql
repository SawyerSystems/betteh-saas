-- Add availability blocking fields and address fields to events table
-- Run this SQL in Supabase after the initial events table creation

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_availability_block boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS blocking_reason text,
ADD COLUMN IF NOT EXISTS address_line_1 text,
ADD COLUMN IF NOT EXISTS address_line_2 text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'United States';

-- Add index for availability block queries
CREATE INDEX IF NOT EXISTS events_is_availability_block_idx ON public.events (is_availability_block);

-- Comments for clarity
COMMENT ON COLUMN public.events.is_availability_block IS 'Whether this event blocks availability for booking lessons';
COMMENT ON COLUMN public.events.blocking_reason IS 'Reason for blocking availability (e.g., "Team Practice", "Vacation")';
COMMENT ON COLUMN public.events.address_line_1 IS 'Primary address line';
COMMENT ON COLUMN public.events.address_line_2 IS 'Secondary address line (apt, suite, etc.)';
COMMENT ON COLUMN public.events.city IS 'City';
COMMENT ON COLUMN public.events.state IS 'State or province';
COMMENT ON COLUMN public.events.zip_code IS 'ZIP or postal code';
COMMENT ON COLUMN public.events.country IS 'Country name';
