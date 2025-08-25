-- Enhanced waiver checking for booking flow
-- This system determines if the waiver step should be shown during booking

-- Function to check if a booking needs the waiver step
CREATE OR REPLACE FUNCTION booking_needs_waiver_step(p_booking_id INTEGER)
RETURNS TABLE(
  needs_waiver_step BOOLEAN,
  athletes_needing_waivers JSON,
  athletes_with_waivers JSON,
  summary TEXT
) AS $$
DECLARE
  athletes_without_waivers INTEGER;
  total_athletes INTEGER;
BEGIN
  -- Count athletes with and without waivers for this booking
  SELECT 
    COUNT(*) FILTER (WHERE w.id IS NULL) as without_waivers,
    COUNT(*) as total
  INTO athletes_without_waivers, total_athletes
  FROM booking_athletes ba
  JOIN athletes a ON ba.athlete_id = a.id
  LEFT JOIN waivers w ON a.id = w.athlete_id
  WHERE ba.booking_id = p_booking_id;
  
  RETURN QUERY
  SELECT 
    -- Need waiver step if ANY athlete doesn't have a waiver
    (athletes_without_waivers > 0) as needs_waiver_step,
    
    -- Athletes that need waivers
    (
      SELECT COALESCE(json_agg(
        json_build_object(
          'athleteId', a.id,
          'athleteName', COALESCE(a.first_name || ' ' || a.last_name, a.name),
          'slotOrder', ba.slot_order
        ) ORDER BY ba.slot_order
      ), '[]'::json)
      FROM booking_athletes ba
      JOIN athletes a ON ba.athlete_id = a.id
      LEFT JOIN waivers w ON a.id = w.athlete_id
      WHERE ba.booking_id = p_booking_id AND w.id IS NULL
    ) as athletes_needing_waivers,
    
    -- Athletes that already have waivers
    (
      SELECT COALESCE(json_agg(
        json_build_object(
          'athleteId', a.id,
          'athleteName', COALESCE(a.first_name || ' ' || a.last_name, a.name),
          'slotOrder', ba.slot_order,
          'waiverSignedAt', w.signed_at
        ) ORDER BY ba.slot_order
      ), '[]'::json)
      FROM booking_athletes ba
      JOIN athletes a ON ba.athlete_id = a.id
      JOIN waivers w ON a.id = w.athlete_id
      WHERE ba.booking_id = p_booking_id
    ) as athletes_with_waivers,
    
    -- Summary message
    CASE 
      WHEN total_athletes = 0 THEN 'No athletes assigned to booking'
      WHEN athletes_without_waivers = 0 THEN 'All athletes have signed waivers - skip waiver step'
      WHEN athletes_without_waivers = total_athletes THEN 'All athletes need waivers - show waiver step'
      ELSE format('%s of %s athletes need waivers - show waiver step', 
                  athletes_without_waivers, total_athletes)
    END as summary;
END;
$$ LANGUAGE plpgsql;

-- Function to check waiver status for new athlete being added to booking
CREATE OR REPLACE FUNCTION check_athlete_waiver_for_booking(
  p_athlete_id INTEGER,
  p_parent_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
  athlete_id INTEGER,
  athlete_name TEXT,
  has_waiver BOOLEAN,
  waiver_signed_at TIMESTAMP,
  needs_new_waiver BOOLEAN,
  message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    COALESCE(a.first_name || ' ' || a.last_name, a.name) as athlete_name,
    (w.id IS NOT NULL) as has_waiver,
    w.signed_at,
    (w.id IS NULL) as needs_new_waiver,
    CASE 
      WHEN w.id IS NOT NULL THEN 
        format('Athlete already has waiver signed on %s - no waiver step needed', 
               w.signed_at::date)
      ELSE 'Athlete needs waiver - include in waiver step'
    END as message
  FROM athletes a
  LEFT JOIN waivers w ON a.id = w.athlete_id
  WHERE a.id = p_athlete_id
    AND (p_parent_id IS NULL OR a.parent_id = p_parent_id);
END;
$$ LANGUAGE plpgsql;

-- Function for booking flow: determine if waiver step needed for a parent's athletes
CREATE OR REPLACE FUNCTION booking_flow_waiver_check(
  p_parent_id INTEGER,
  p_athlete_ids INTEGER[] DEFAULT NULL
)
RETURNS TABLE(
  show_waiver_step BOOLEAN,
  athletes_needing_waivers JSON,
  athletes_with_waivers JSON,
  waiver_summary TEXT
) AS $$
DECLARE
  target_athlete_ids INTEGER[];
BEGIN
  -- If specific athlete IDs provided, use those; otherwise use all parent's athletes
  IF p_athlete_ids IS NOT NULL THEN
    target_athlete_ids := p_athlete_ids;
  ELSE
    SELECT array_agg(id) INTO target_athlete_ids
    FROM athletes WHERE parent_id = p_parent_id;
  END IF;
  
  RETURN QUERY
  SELECT 
    -- Show waiver step if ANY athlete needs a waiver
    bool_or(w.id IS NULL) as show_waiver_step,
    
    -- Athletes needing waivers
    (
      SELECT COALESCE(json_agg(
        json_build_object(
          'athleteId', a.id,
          'athleteName', COALESCE(a.first_name || ' ' || a.last_name, a.name),
          'dateOfBirth', a.date_of_birth,
          'experience', a.experience
        )
      ), '[]'::json)
      FROM athletes a
      LEFT JOIN waivers w ON a.id = w.athlete_id
      WHERE a.id = ANY(target_athlete_ids) AND w.id IS NULL
    ) as athletes_needing_waivers,
    
    -- Athletes with existing waivers
    (
      SELECT COALESCE(json_agg(
        json_build_object(
          'athleteId', a.id,
          'athleteName', COALESCE(a.first_name || ' ' || a.last_name, a.name),
          'waiverSignedAt', w.signed_at,
          'canSkipWaiver', true
        )
      ), '[]'::json)
      FROM athletes a
      JOIN waivers w ON a.id = w.athlete_id
      WHERE a.id = ANY(target_athlete_ids)
    ) as athletes_with_waivers,
    
    -- Summary for UI
    CASE 
      WHEN target_athlete_ids IS NULL OR array_length(target_athlete_ids, 1) = 0 THEN 
        'No athletes selected'
      WHEN NOT bool_or(w.id IS NULL) THEN 
        'All selected athletes have waivers - skip waiver step'
      ELSE 
        format('%s athletes need waivers - show waiver step', 
               (SELECT COUNT(*) FROM athletes a LEFT JOIN waivers w ON a.id = w.athlete_id 
                WHERE a.id = ANY(target_athlete_ids) AND w.id IS NULL))
    END as waiver_summary
  FROM athletes a
  LEFT JOIN waivers w ON a.id = w.athlete_id
  WHERE a.id = ANY(target_athlete_ids);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION booking_needs_waiver_step(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_athlete_waiver_for_booking(INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION booking_flow_waiver_check(INTEGER, INTEGER[]) TO authenticated, anon;
