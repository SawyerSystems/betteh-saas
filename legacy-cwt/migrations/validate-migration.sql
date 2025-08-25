-- Phase 3 Validation: Test that availability blocking works with unified events table
-- This script validates that the migration preserves availability blocking functionality

-- Test 1: Compare availability exception counts before and after migration
SELECT 
    'Availability Exceptions' as source,
    COUNT(*) as count
FROM availability_exceptions
UNION ALL
SELECT 
    'Blocking Events' as source,
    COUNT(*) as count
FROM events 
WHERE is_availability_block = true;

-- Test 2: Verify date/time conversion accuracy
-- Compare a few sample records to ensure timestamp conversion is correct
SELECT 
    ae.id as exception_id,
    ae.date as original_date,
    ae.start_time as original_start_time,
    ae.end_time as original_end_time,
    ae.all_day as original_all_day,
    e.start_at as converted_start_at,
    e.end_at as converted_end_at,
    e.is_all_day as converted_all_day,
    DATE(e.start_at AT TIME ZONE 'America/Los_Angeles') = ae.date as date_matches
FROM availability_exceptions ae
JOIN events e ON (
    e.is_availability_block = true 
    AND e.blocking_reason = ae.reason
    AND DATE(e.start_at AT TIME ZONE 'America/Los_Angeles') = ae.date
)
LIMIT 5;

-- Test 3: Verify no duplicates were created
SELECT 
    blocking_reason,
    DATE(start_at AT TIME ZONE 'America/Los_Angeles') as block_date,
    COUNT(*) as duplicate_count
FROM events 
WHERE is_availability_block = true
GROUP BY blocking_reason, DATE(start_at AT TIME ZONE 'America/Los_Angeles')
HAVING COUNT(*) > 1;

-- Test 4: Check that all required fields are populated
SELECT 
    COUNT(*) as total_blocking_events,
    COUNT(CASE WHEN title IS NULL OR title = '' THEN 1 END) as missing_title,
    COUNT(CASE WHEN start_at IS NULL THEN 1 END) as missing_start_at,
    COUNT(CASE WHEN end_at IS NULL THEN 1 END) as missing_end_at,
    COUNT(CASE WHEN timezone IS NULL THEN 1 END) as missing_timezone
FROM events 
WHERE is_availability_block = true;

-- Test 5: Validate timezone handling
-- Show sample timezone conversions
SELECT 
    title,
    start_at as utc_timestamp,
    start_at AT TIME ZONE 'America/Los_Angeles' as pacific_time,
    is_all_day
FROM events 
WHERE is_availability_block = true
LIMIT 3;

-- Generate summary report
SELECT 
    'MIGRATION VALIDATION SUMMARY' as report_title,
    COUNT(*) as total_blocking_events,
    COUNT(CASE WHEN created_at IS NOT NULL THEN 1 END) as events_with_created_at,
    COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_events,
    MIN(start_at) as earliest_blocking_event,
    MAX(start_at) as latest_blocking_event
FROM events 
WHERE is_availability_block = true;
