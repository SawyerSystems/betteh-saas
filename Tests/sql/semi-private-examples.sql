-- Examples of managing multiple athletes in bookings

-- Example 1: Create a semi-private lesson booking
-- First, ensure you have a semi-private lesson type
INSERT INTO lesson_types (name, duration_minutes, is_private, total_price, reservation_fee, description)
VALUES ('Semi-Private Tumbling', 60, false, 120.00, 0.00, 'Semi-private lesson for 2 athletes')
ON CONFLICT (name) DO NOTHING;

-- Example 2: Add athletes to a booking (for booking ID 123)
-- Add first athlete
SELECT add_athlete_to_booking(123, 45); -- Returns slot_order 1

-- Add second athlete  
SELECT add_athlete_to_booking(123, 67); -- Returns slot_order 2

-- Example 3: Try to add third athlete (should fail for semi-private)
-- SELECT add_athlete_to_booking(123, 89); -- Will raise exception

-- Example 4: View all athletes in a booking
SELECT * FROM get_booking_athletes(123);

-- Example 5: Remove an athlete and reorder
SELECT remove_athlete_from_booking(123, 45); -- Removes first athlete, second becomes first

-- Example 6: Check booking with all athlete details
SELECT * FROM bookings_with_athletes WHERE id = 123;

-- Example 7: Find all semi-private bookings
SELECT 
  b.id,
  b.preferred_date,
  b.preferred_time,
  lt.name as lesson_type,
  COUNT(ba.athlete_id) as athlete_count,
  json_agg(
    COALESCE(a.first_name || ' ' || a.last_name, a.name) 
    ORDER BY ba.slot_order
  ) as athlete_names
FROM bookings b
JOIN lesson_types lt ON b.lesson_type_id = lt.id AND lt.is_private = false
LEFT JOIN booking_athletes ba ON b.id = ba.booking_id
LEFT JOIN athletes a ON ba.athlete_id = a.id
GROUP BY b.id, b.preferred_date, b.preferred_time, lt.name
HAVING COUNT(ba.athlete_id) > 1;
