-- First, let's check which tables exist and their column structures
SELECT 
  'TABLE_EXISTS' as check_type,
  table_name,
  'exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'booking_apparatus', 'booking_focus_areas', 'booking_logs', 
  'booking_side_quests', 'email_logs', 'parent_auth_codes', 
  'payment_logs', 'slot_reservations'
)
ORDER BY table_name;

-- Check column structures for each table that exists
SELECT 
  'COLUMN_CHECK' as check_type,
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
  'booking_apparatus', 'booking_focus_areas', 'booking_logs', 
  'booking_side_quests', 'email_logs', 'parent_auth_codes', 
  'payment_logs', 'slot_reservations'
)
AND column_name IN ('created_at', 'updated_at', 'id')
ORDER BY table_name, column_name;
