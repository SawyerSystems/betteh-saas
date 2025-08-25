-- Phase 3: Migrate availability_exceptions to events table
-- This script copies all existing availability exceptions to the unified events table

-- First, ensure the events table has the required columns (should already exist from Phase 1)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_availability_block BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS blocking_reason TEXT;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_events_availability_blocking 
ON events (is_availability_block, start_at, end_at) 
WHERE is_availability_block = true AND is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_events_start_end_dates 
ON events (start_at, end_at) 
WHERE is_deleted = false;

-- Migrate data from availability_exceptions to events
-- Convert each availability exception to an event record
INSERT INTO events (
    id,
    series_id,
    parent_event_id,
    title,
    notes,
    location,
    is_all_day,
    timezone,
    start_at,
    end_at,
    recurrence_rule,
    recurrence_end_at,
    recurrence_exceptions,
    is_availability_block,
    blocking_reason,
    created_by,
    updated_by,
    is_deleted,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    gen_random_uuid() as series_id,
    NULL as parent_event_id,
    COALESCE(title, 'Availability Block') as title,
    notes,
    CASE 
        WHEN address_line_1 IS NOT NULL THEN 
            CONCAT_WS(', ', address_line_1, address_line_2, city, state, zip_code)
        ELSE NULL 
    END as location,
    all_day as is_all_day,
    'America/Los_Angeles' as timezone,
    -- Construct timestamp from date and time
    CASE 
        WHEN all_day = true OR start_time IS NULL THEN 
            (date || ' 00:00:00')::timestamp AT TIME ZONE 'America/Los_Angeles'
        ELSE 
            (date || ' ' || start_time)::timestamp AT TIME ZONE 'America/Los_Angeles'
    END as start_at,
    CASE 
        WHEN all_day = true OR end_time IS NULL THEN 
            (date || ' 23:59:59')::timestamp AT TIME ZONE 'America/Los_Angeles'
        ELSE 
            (date || ' ' || end_time)::timestamp AT TIME ZONE 'America/Los_Angeles'
    END as end_at,
    NULL as recurrence_rule,        -- No recurrence for migrated single-day exceptions
    NULL as recurrence_end_at,
    '[]'::jsonb as recurrence_exceptions,
    true as is_availability_block,  -- All exceptions become blocking events
    reason as blocking_reason,
    NULL as created_by,             -- No admin tracking for migrated data
    NULL as updated_by,
    false as is_deleted,
    created_at,
    COALESCE(created_at, NOW()) as updated_at
FROM availability_exceptions
WHERE NOT EXISTS (
    -- Avoid duplicates if migration has been run before
    SELECT 1 FROM events e 
    WHERE e.is_availability_block = true 
    AND e.blocking_reason = availability_exceptions.reason
    AND DATE(e.start_at AT TIME ZONE 'America/Los_Angeles') = availability_exceptions.date
);

-- Add comments to document the migration
COMMENT ON TABLE events IS 'Unified table for events and availability blocking (replaces availability_exceptions)';

-- Log migration results
DO $$
DECLARE
    migrated_count INTEGER;
    total_exceptions INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_exceptions FROM availability_exceptions;
    SELECT COUNT(*) INTO migrated_count FROM events WHERE is_availability_block = true;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '- Total availability_exceptions: %', total_exceptions;
    RAISE NOTICE '- Total blocking events after migration: %', migrated_count;
    RAISE NOTICE '- Migration completed successfully';
END $$;

-- First, apply the schema changes
-- (Run add-availability-blocking-to-events.sql first)

-- Copy all availability_exceptions as blocking events
INSERT INTO events (
  id,
  series_id,
  title,
  notes,
  location,
  is_all_day,
  timezone,
  start_at,
  end_at,
  is_availability_block,
  blocking_reason,
  is_deleted,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid() as id,
  gen_random_uuid() as series_id,
  COALESCE(title, 'Availability Block') as title,
  notes,
  CASE 
    WHEN address_line_1 IS NOT NULL THEN 
      CONCAT_WS(', ', address_line_1, address_line_2, city, state, zip_code)
    ELSE NULL 
  END as location,
  all_day as is_all_day,
  'America/Los_Angeles' as timezone,
  -- Convert date + time to timestamp with timezone
  CASE 
    WHEN all_day OR start_time IS NULL THEN 
      (date || 'T00:00:00-08:00')::timestamptz
    ELSE
      (date || 'T' || start_time || ':00-08:00')::timestamptz
  END as start_at,
  CASE 
    WHEN all_day OR end_time IS NULL THEN 
      (date || 'T23:59:59-08:00')::timestamptz
    ELSE
      (date || 'T' || end_time || ':00-08:00')::timestamptz
  END as end_at,
  true as is_availability_block,
  reason as blocking_reason,
  false as is_deleted,
  created_at,
  NOW() as updated_at
FROM availability_exceptions
WHERE NOT EXISTS (
  -- Avoid duplicates if script is run multiple times
  SELECT 1 FROM events 
  WHERE events.is_availability_block = true 
  AND events.blocking_reason = availability_exceptions.reason
  AND DATE(events.start_at AT TIME ZONE 'America/Los_Angeles') = availability_exceptions.date
);

-- Add comment about the migration
COMMENT ON TABLE events IS 'Unified events and availability blocking table. Replaces availability_exceptions after migration.';

-- Show migration results
SELECT 
  'Migrated' as status,
  COUNT(*) as count,
  'availability exceptions copied to events table' as description
FROM events 
WHERE is_availability_block = true;

-- Show what will be in the events table after migration
SELECT 
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE is_availability_block = true) as blocking_events,
  COUNT(*) FILTER (WHERE is_availability_block = false) as regular_events,
  COUNT(*) FILTER (WHERE recurrence_rule IS NOT NULL) as recurring_events
FROM events 
WHERE is_deleted = false;
