-- Phase 4: Cleanup - Remove availability_exceptions table after successful migration
-- ⚠️ WARNING: This is destructive! Only run after thorough testing and validation

-- Step 1: Final validation before cleanup
-- Ensure migration was successful and availability blocking works with events table

DO $$
DECLARE
    exception_count INTEGER;
    blocking_event_count INTEGER;
    validation_passed BOOLEAN := true;
BEGIN
    -- Count records in both tables
    SELECT COUNT(*) INTO exception_count FROM availability_exceptions;
    SELECT COUNT(*) INTO blocking_event_count FROM events WHERE is_availability_block = true;
    
    RAISE NOTICE 'Pre-cleanup validation:';
    RAISE NOTICE '- Availability exceptions: %', exception_count;
    RAISE NOTICE '- Blocking events: %', blocking_event_count;
    
    -- Validation checks
    IF blocking_event_count = 0 AND exception_count > 0 THEN
        validation_passed := false;
        RAISE EXCEPTION 'VALIDATION FAILED: No blocking events found but availability exceptions exist. Migration may have failed.';
    END IF;
    
    IF blocking_event_count < exception_count THEN
        RAISE WARNING 'Blocking events (%) < availability exceptions (%). Some data may not have migrated.', blocking_event_count, exception_count;
    END IF;
    
    IF validation_passed THEN
        RAISE NOTICE 'Validation passed. Ready for cleanup.';
    END IF;
END $$;

-- Step 2: Create backup table (optional safety measure)
-- Uncomment this section if you want to keep a backup
/*
CREATE TABLE availability_exceptions_backup AS 
SELECT * FROM availability_exceptions;

COMMENT ON TABLE availability_exceptions_backup IS 'Backup of availability_exceptions before migration to events table';
RAISE NOTICE 'Created backup table: availability_exceptions_backup';
*/

-- Step 3: Remove any remaining references to availability_exceptions
-- Check for foreign key constraints that might prevent dropping the table
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name = 'availability_exceptions' OR ccu.table_name = 'availability_exceptions');

-- Step 4: Drop the availability_exceptions table
-- ⚠️ UNCOMMENT ONLY AFTER THOROUGH TESTING ⚠️
/*
DROP TABLE IF EXISTS availability_exceptions CASCADE;
RAISE NOTICE 'Dropped availability_exceptions table and its constraints';
*/

-- Step 5: Update any remaining code references
-- Note: Code updates must be done manually:
-- 1. Remove availability_exceptions from shared/schema.ts
-- 2. Remove any unused storage methods
-- 3. Update admin UI if it directly referenced availability_exceptions
-- 4. Update any documentation

-- Step 6: Final verification
SELECT 
    'CLEANUP COMPLETED' as status,
    COUNT(*) as remaining_blocking_events,
    MIN(start_at) as earliest_event,
    MAX(start_at) as latest_event
FROM events 
WHERE is_availability_block = true AND is_deleted = false;

RAISE NOTICE 'Phase 4 cleanup preparation completed.';
RAISE NOTICE 'To complete cleanup: Uncomment the DROP TABLE statement above and run again.';
RAISE NOTICE 'Remember to update code references to availability_exceptions manually.';
