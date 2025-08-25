-- Examples: How waiver checking works in booking flow

-- Example 1: Check if existing booking needs waiver step
SELECT * FROM booking_needs_waiver_step(123);
-- Returns: needs_waiver_step, athletes_needing_waivers, athletes_with_waivers, summary

-- Example 2: Check waiver status for specific athlete before adding to booking
SELECT * FROM check_athlete_waiver_for_booking(45, 12); -- athlete_id, parent_id
-- Returns: athlete info and whether they need waiver

-- Example 3: Booking flow - check parent's athletes before showing waiver step
-- For new booking with specific athletes
SELECT * FROM booking_flow_waiver_check(12, ARRAY[45, 67]); -- parent_id, athlete_ids
-- Returns: show_waiver_step = true/false, plus athlete details

-- Example 4: Booking flow - check all parent's athletes
SELECT * FROM booking_flow_waiver_check(12); -- parent_id only
-- Returns: waiver status for all parent's athletes

-- Example 5: Frontend integration - determine booking flow steps
WITH waiver_check AS (
  SELECT * FROM booking_flow_waiver_check(12, ARRAY[45, 67])
)
SELECT 
  CASE 
    WHEN show_waiver_step THEN 
      json_build_object(
        'steps', ARRAY['athlete-selection', 'lesson-details', 'waiver', 'payment'],
        'waiver_step_needed', true,
        'athletes_needing_waivers', athletes_needing_waivers
      )
    ELSE 
      json_build_object(
        'steps', ARRAY['athlete-selection', 'lesson-details', 'payment'],
        'waiver_step_needed', false,
        'message', 'All athletes have waivers - skipping waiver step'
      )
  END as booking_flow
FROM waiver_check;

-- Example 6: Real-time waiver checking during athlete selection
-- As user selects athletes, check each one
SELECT 
  a.id,
  a.first_name || ' ' || a.last_name as name,
  CASE WHEN w.id IS NOT NULL THEN 'Has Waiver' ELSE 'Needs Waiver' END as waiver_status,
  w.signed_at as waiver_date
FROM athletes a
LEFT JOIN waivers w ON a.id = w.athlete_id
WHERE a.parent_id = 12  -- parent selecting athletes
ORDER BY a.first_name;

-- Example 7: Update booking flow based on athlete selection changes
-- When athlete is added/removed from selection, re-check waiver needs
CREATE OR REPLACE FUNCTION update_booking_flow_steps(
  p_parent_id INTEGER,
  p_selected_athlete_ids INTEGER[]
)
RETURNS JSON AS $$
DECLARE
  waiver_result RECORD;
  flow_steps TEXT[];
BEGIN
  -- Check waiver status for selected athletes
  SELECT * INTO waiver_result 
  FROM booking_flow_waiver_check(p_parent_id, p_selected_athlete_ids);
  
  -- Build appropriate flow steps
  flow_steps := ARRAY['athlete-selection', 'lesson-details'];
  
  IF waiver_result.show_waiver_step THEN
    flow_steps := flow_steps || 'waiver';
  END IF;
  
  flow_steps := flow_steps || 'payment';
  
  RETURN json_build_object(
    'steps', flow_steps,
    'current_step', 1,
    'waiver_step_needed', waiver_result.show_waiver_step,
    'waiver_summary', waiver_result.waiver_summary,
    'athletes_needing_waivers', waiver_result.athletes_needing_waivers,
    'athletes_with_waivers', waiver_result.athletes_with_waivers
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION update_booking_flow_steps(INTEGER, INTEGER[]) TO authenticated;
