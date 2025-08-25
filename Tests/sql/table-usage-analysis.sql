-- Comprehensive Table Usage Analysis
-- This script examines specific tables to determine if they're being used and if they should be kept

-- 1. Basic table statistics - row counts and recent activity (only for existing tables)
SELECT 
  'TABLE_STATS' as analysis_type,
  table_name,
  (
    CASE table_name
      WHEN 'booking_logs' THEN (SELECT COUNT(*) FROM booking_logs)
      WHEN 'email_logs' THEN (SELECT COUNT(*) FROM email_logs)
      WHEN 'parent_auth_codes' THEN (SELECT COUNT(*) FROM parent_auth_codes)
      WHEN 'payment_logs' THEN (SELECT COUNT(*) FROM payment_logs)
      WHEN 'slot_reservations' THEN (SELECT COUNT(*) FROM slot_reservations)
      ELSE 0
    END
  ) as total_rows,
  (
    CASE table_name
      WHEN 'booking_logs' THEN (SELECT COUNT(*) FROM booking_logs WHERE created_at > NOW() - INTERVAL '30 days')
      WHEN 'email_logs' THEN 0 -- No created_at column
      WHEN 'parent_auth_codes' THEN (SELECT COUNT(*) FROM parent_auth_codes WHERE created_at > NOW() - INTERVAL '30 days')
      WHEN 'payment_logs' THEN (SELECT COUNT(*) FROM payment_logs WHERE created_at > NOW() - INTERVAL '30 days')
      WHEN 'slot_reservations' THEN (SELECT COUNT(*) FROM slot_reservations WHERE created_at > NOW() - INTERVAL '30 days')
      ELSE 0
    END
  ) as recent_rows_30_days,
  (
    CASE table_name
      WHEN 'booking_apparatus' THEN 'TABLE_DOES_NOT_EXIST'
      WHEN 'booking_focus_areas' THEN 'TABLE_DOES_NOT_EXIST'
      WHEN 'booking_side_quests' THEN 'TABLE_DOES_NOT_EXIST'
      ELSE 'EXISTS'
    END
  ) as table_status
FROM (
  VALUES 
    ('booking_apparatus'),
    ('booking_focus_areas'),
    ('booking_logs'),
    ('booking_side_quests'),
    ('email_logs'),
    ('parent_auth_codes'),
    ('payment_logs'),
    ('slot_reservations')
) AS t(table_name);

-- 2. Check for foreign key relationships and constraints (only existing tables)
SELECT 
  'FOREIGN_KEYS' as analysis_type,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name IN (
  'booking_logs', 'email_logs', 'parent_auth_codes', 
  'payment_logs', 'slot_reservations'
)
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- 3. Check if tables are referenced by other tables (only existing tables)
SELECT 
  'REFERENCED_BY' as analysis_type,
  ccu.table_name as referenced_table,
  tc.table_name as referencing_table,
  tc.constraint_name,
  kcu.column_name as referencing_column,
  ccu.column_name as referenced_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE ccu.table_name IN (
  'booking_logs', 'email_logs', 'parent_auth_codes', 
  'payment_logs', 'slot_reservations'
)
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY ccu.table_name;

-- 4. Check if lookup tables exist (for context about missing junction tables)
SELECT 
  'MISSING_JUNCTION_TABLES' as analysis_type,
  'booking_apparatus, booking_focus_areas, booking_side_quests' as missing_tables,
  'These junction tables do not exist in the database' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'apparatus') THEN 'apparatus table exists'
    ELSE 'apparatus table missing'
  END as apparatus_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'focus_areas') THEN 'focus_areas table exists'
    ELSE 'focus_areas table missing'
  END as focus_areas_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'side_quests') THEN 'side_quests table exists'
    ELSE 'side_quests table missing'
  END as side_quests_status;

-- 5. Analyze logging tables for recent activity patterns (only existing tables)
SELECT 
  'LOGGING_ANALYSIS' as analysis_type,
  'booking_logs' as table_name,
  COUNT(*) as total_logs,
  COUNT(DISTINCT action_type) as unique_action_types,
  string_agg(DISTINCT action_type, ', ') as action_types,
  MIN(created_at) as earliest_log,
  MAX(created_at) as latest_log,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as logs_last_7_days
FROM booking_logs
WHERE EXISTS (SELECT 1 FROM booking_logs LIMIT 1)

UNION ALL

SELECT 
  'LOGGING_ANALYSIS' as analysis_type,
  'email_logs' as table_name,
  COUNT(*) as total_logs,
  COUNT(DISTINCT CASE WHEN error_message IS NOT NULL THEN 'error' ELSE 'success' END) as unique_statuses,
  string_agg(DISTINCT CASE WHEN error_message IS NOT NULL THEN 'error' ELSE 'success' END, ', ') as status_types,
  NULL::timestamp as earliest_log, -- No created_at column
  NULL::timestamp as latest_log,   -- No created_at column
  0 as logs_last_7_days -- Cannot analyze recent activity without created_at
FROM email_logs
WHERE EXISTS (SELECT 1 FROM email_logs LIMIT 1)

UNION ALL

SELECT 
  'LOGGING_ANALYSIS' as analysis_type,
  'payment_logs' as table_name,
  COUNT(*) as total_logs,
  COUNT(DISTINCT stripe_event) as unique_events,
  string_agg(DISTINCT stripe_event, ', ') as event_types,
  MIN(created_at) as earliest_log,
  MAX(created_at) as latest_log,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as logs_last_7_days
FROM payment_logs
WHERE EXISTS (SELECT 1 FROM payment_logs LIMIT 1);

-- 6. Check parent authentication usage
SELECT 
  'AUTH_ANALYSIS' as analysis_type,
  'parent_auth_codes' as table_name,
  COUNT(*) as total_codes,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_codes,
  COUNT(*) FILTER (WHERE used_at IS NOT NULL) as used_codes,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as codes_last_30_days,
  MIN(created_at) as earliest_code,
  MAX(created_at) as latest_code
FROM parent_auth_codes
WHERE EXISTS (SELECT 1 FROM parent_auth_codes LIMIT 1);

-- 7. Analyze slot reservations
SELECT 
  'RESERVATION_ANALYSIS' as analysis_type,
  'slot_reservations' as table_name,
  COUNT(*) as total_reservations,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_reservations,
  COUNT(*) FILTER (WHERE booking_id IS NOT NULL) as confirmed_reservations,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_reservations,
  MIN(created_at) as earliest_reservation,
  MAX(created_at) as latest_reservation
FROM slot_reservations
WHERE EXISTS (SELECT 1 FROM slot_reservations LIMIT 1);

-- 8. Final recommendations based on analysis
SELECT 
  'RECOMMENDATIONS' as analysis_type,
  table_name,
  CASE 
    WHEN table_name = 'booking_apparatus' THEN 'DROP - Table does not exist, junction table not implemented'
    WHEN table_name = 'booking_focus_areas' THEN 'DROP - Table does not exist, junction table not implemented'
    WHEN table_name = 'booking_side_quests' THEN 'DROP - Table does not exist, junction table not implemented'
    WHEN table_name = 'booking_logs' THEN 
      CASE 
        WHEN (SELECT COUNT(*) FROM booking_logs) = 0 THEN 'CONSIDER_DROP - No logging data, but useful for auditing'
        ELSE 'KEEP - Important for audit trail and debugging'
      END
    WHEN table_name = 'email_logs' THEN 
      CASE 
        WHEN (SELECT COUNT(*) FROM email_logs) = 0 THEN 'CONSIDER_DROP - No email logging, but useful for troubleshooting'
        ELSE 'KEEP - Important for email delivery tracking'
      END
    WHEN table_name = 'payment_logs' THEN 
      CASE 
        WHEN (SELECT COUNT(*) FROM payment_logs) = 0 THEN 'CONSIDER_DROP - No payment logging, but useful for financial auditing'
        ELSE 'KEEP - Critical for payment reconciliation'
      END
    WHEN table_name = 'parent_auth_codes' THEN 
      CASE 
        WHEN (SELECT COUNT(*) FROM parent_auth_codes) = 0 THEN 'KEEP - Essential for parent authentication system'
        ELSE 'KEEP - Actively used for parent login'
      END
    WHEN table_name = 'slot_reservations' THEN 
      CASE 
        WHEN (SELECT COUNT(*) FROM slot_reservations) = 0 THEN 'CONSIDER_DROP - No reservations, may not be implemented'
        ELSE 'KEEP - Used for temporary slot holding during booking process'
      END
  END as recommendation,
  CASE 
    WHEN table_name LIKE 'booking_%' AND table_name NOT LIKE '%logs' THEN 
      CASE WHEN table_name IN ('booking_apparatus', 'booking_focus_areas', 'booking_side_quests') 
           THEN 'Junction table for booking relationships (NOT IMPLEMENTED)'
           ELSE 'Junction table for booking relationships'
      END
    WHEN table_name LIKE '%logs' THEN 'Logging/audit table for system monitoring'
    WHEN table_name = 'parent_auth_codes' THEN 'Authentication system table'
    WHEN table_name = 'slot_reservations' THEN 'Booking flow management table'
  END as purpose,
  CASE 
    WHEN table_name IN ('booking_apparatus', 'booking_focus_areas', 'booking_side_quests') THEN 'TABLE_MISSING'
    ELSE 'TABLE_EXISTS'
  END as existence_status
FROM (
  VALUES 
    ('booking_apparatus'),
    ('booking_focus_areas'),
    ('booking_logs'),
    ('booking_side_quests'),
    ('email_logs'),
    ('parent_auth_codes'),
    ('payment_logs'),
    ('slot_reservations')
) AS t(table_name)
ORDER BY table_name;

-- 9. SUMMARY: Tables that exist vs requested
SELECT 
  'SUMMARY' as analysis_type,
  'EXISTING_TABLES' as category,
  string_agg(table_name, ', ') as tables
FROM (
  VALUES 
    ('booking_logs'),
    ('email_logs'),
    ('parent_auth_codes'),
    ('payment_logs'),
    ('slot_reservations')
) AS existing(table_name)

UNION ALL

SELECT 
  'SUMMARY' as analysis_type,
  'MISSING_TABLES' as category,
  string_agg(table_name, ', ') as tables
FROM (
  VALUES 
    ('booking_apparatus'),
    ('booking_focus_areas'),
    ('booking_side_quests')
) AS missing(table_name);

-- 10. ACTION ITEMS based on analysis
SELECT 
  'ACTION_ITEMS' as analysis_type,
  action_priority,
  action_description
FROM (
  VALUES 
    (1, 'IMMEDIATE: Remove references to booking_apparatus, booking_focus_areas, booking_side_quests from application code'),
    (2, 'REVIEW: Check if apparatus/focus_areas/side_quests functionality is needed and implement properly'),
    (3, 'MONITOR: Review logging tables (booking_logs, email_logs, payment_logs) for actual usage'),
    (4, 'MAINTAIN: Keep parent_auth_codes and slot_reservations as they are essential for authentication and booking flow'),
    (5, 'CONSIDER: Add created_at column to email_logs for better monitoring and debugging')
) AS actions(action_priority, action_description)
ORDER BY action_priority;



