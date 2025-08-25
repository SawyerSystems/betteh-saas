-- Helper functions for managing multiple athletes in bookings

-- Function to add an athlete to a booking with automatic slot ordering
CREATE OR REPLACE FUNCTION add_athlete_to_booking(
  p_booking_id INTEGER,
  p_athlete_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
  next_slot_order INTEGER;
  lesson_is_private BOOLEAN;
  current_athlete_count INTEGER;
BEGIN
  -- Check if lesson type allows multiple athletes
  SELECT lt.is_private INTO lesson_is_private
  FROM bookings b
  JOIN lesson_types lt ON b.lesson_type_id = lt.id
  WHERE b.id = p_booking_id;
  
  -- Count current athletes in this booking
  SELECT COUNT(*) INTO current_athlete_count
  FROM booking_athletes
  WHERE booking_id = p_booking_id;
  
  -- Check capacity limits
  IF lesson_is_private AND current_athlete_count >= 1 THEN
    RAISE EXCEPTION 'Private lessons can only have 1 athlete';
  END IF;
  
  IF NOT lesson_is_private AND current_athlete_count >= 2 THEN
    RAISE EXCEPTION 'Semi-private lessons can only have 2 athletes';
  END IF;
  
  -- Get next slot order
  SELECT COALESCE(MAX(slot_order), 0) + 1 INTO next_slot_order
  FROM booking_athletes
  WHERE booking_id = p_booking_id;
  
  -- Insert the athlete
  INSERT INTO booking_athletes (booking_id, athlete_id, slot_order)
  VALUES (p_booking_id, p_athlete_id, next_slot_order);
  
  RETURN next_slot_order;
END;
$$ LANGUAGE plpgsql;

-- Function to remove an athlete from a booking
CREATE OR REPLACE FUNCTION remove_athlete_from_booking(
  p_booking_id INTEGER,
  p_athlete_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM booking_athletes
  WHERE booking_id = p_booking_id AND athlete_id = p_athlete_id;
  
  -- Reorder remaining athletes to fill gaps
  UPDATE booking_athletes
  SET slot_order = new_order.rn
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY slot_order) as rn
    FROM booking_athletes
    WHERE booking_id = p_booking_id
  ) new_order
  WHERE booking_athletes.id = new_order.id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get all athletes in a booking with their slot positions
CREATE OR REPLACE FUNCTION get_booking_athletes(p_booking_id INTEGER)
RETURNS TABLE(
  athlete_id INTEGER,
  athlete_name TEXT,
  slot_order INTEGER,
  waiver_signed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    COALESCE(a.first_name || ' ' || a.last_name, a.name) as athlete_name,
    ba.slot_order,
    CASE WHEN w.id IS NOT NULL THEN true ELSE false END as waiver_signed
  FROM booking_athletes ba
  JOIN athletes a ON ba.athlete_id = a.id
  LEFT JOIN waivers w ON a.id = w.athlete_id
  WHERE ba.booking_id = p_booking_id
  ORDER BY ba.slot_order;
END;
$$ LANGUAGE plpgsql;

-- View to show bookings with their athlete details
CREATE OR REPLACE VIEW bookings_with_athletes AS
SELECT 
  b.*,
  lt.name as lesson_type_name,
  lt.is_private,
  p.first_name as parent_first_name,
  p.last_name as parent_last_name,
  p.email as parent_email,
  p.phone as parent_phone,
  json_agg(
    json_build_object(
      'athleteId', a.id,
      'athleteName', COALESCE(a.first_name || ' ' || a.last_name, a.name),
      'slotOrder', ba.slot_order,
      'waiverSigned', CASE WHEN w.id IS NOT NULL THEN true ELSE false END
    ) ORDER BY ba.slot_order
  ) as athletes
FROM bookings b
JOIN parents p ON b.parent_id = p.id
JOIN lesson_types lt ON b.lesson_type_id = lt.id
LEFT JOIN booking_athletes ba ON b.id = ba.booking_id
LEFT JOIN athletes a ON ba.athlete_id = a.id
LEFT JOIN waivers w ON a.id = w.athlete_id
GROUP BY b.id, lt.name, lt.is_private, p.first_name, p.last_name, p.email, p.phone;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_athlete_to_booking(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_athlete_from_booking(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_booking_athletes(INTEGER) TO authenticated;
GRANT SELECT ON bookings_with_athletes TO authenticated;
