-- Adventure Log Schema Updates
-- Add fields needed for progress tracking in the Adventure Log

-- Add focus_areas field to bookings table (array of text for multiple focus areas)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS focus_areas TEXT[];

-- Add progress_note field to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS progress_note TEXT;

-- Add coach_name field to bookings table (default to Coach Will since you're the only coach)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS coach_name TEXT DEFAULT 'Coach Will';

-- Add some sample focus areas and progress notes to existing completed bookings for demo purposes
UPDATE bookings 
SET focus_areas = CASE 
  WHEN id % 7 = 0 THEN ARRAY['Tumbling: Forward Roll', 'Side Quests: Flexibility Training']
  WHEN id % 7 = 1 THEN ARRAY['Tumbling: Cartwheel', 'Beam: Balance']
  WHEN id % 7 = 2 THEN ARRAY['Beam: Balance', 'Side Quests: Strength Building']
  WHEN id % 7 = 3 THEN ARRAY['Vault: Run and Jump', 'Tumbling: Round Off']
  WHEN id % 7 = 4 THEN ARRAY['Rings: Support Hold', 'Parallel Bars: L-Sit']
  WHEN id % 7 = 5 THEN ARRAY['Tumbling: Back Handspring', 'Side Quests: Mental Blocks']
  ELSE ARRAY['Tumbling: Forward Roll', 'Side Quests: Flexibility Training']
END
WHERE attendance_status = 'completed' 
  AND (focus_areas IS NULL OR array_length(focus_areas, 1) IS NULL);

UPDATE bookings 
SET progress_note = CASE 
  WHEN focus_areas IS NOT NULL AND array_length(focus_areas, 1) > 0 THEN
    CASE 
      WHEN 'Tumbling: Forward Roll' = ANY(focus_areas) THEN 'Improved forward roll technique - better form and landing control'
      WHEN 'Tumbling: Cartwheel' = ANY(focus_areas) THEN 'Excellent progress on cartwheel - straighter legs and smoother transition'
      WHEN 'Beam: Balance' = ANY(focus_areas) THEN 'Increased confidence on beam - held balance poses for 5+ seconds'
      WHEN 'Vault: Run and Jump' = ANY(focus_areas) THEN 'Great improvement in run-up speed and takeoff timing'
      WHEN 'Rings: Support Hold' = ANY(focus_areas) THEN 'Built upper body strength - holding support position longer'
      WHEN 'Side Quests: Flexibility Training' = ANY(focus_areas) THEN 'Noticeable improvement in flexibility - splits getting closer to floor'
      WHEN 'Tumbling: Back Handspring' = ANY(focus_areas) THEN 'Building confidence with back handspring - great progression!'
      WHEN 'Side Quests: Mental Blocks' = ANY(focus_areas) THEN 'Worked through mental barriers - showing more confidence'
      ELSE 'Solid progress made - athlete showing consistent improvement and effort'
    END
  ELSE 'Great session! Athlete demonstrated focus and made steady progress'
END
WHERE attendance_status = 'completed' 
  AND progress_note IS NULL;

-- Ensure all bookings have Coach Will as the coach (since you're the only coach)
UPDATE bookings 
SET coach_name = 'Coach Will'
WHERE coach_name IS NULL OR coach_name != 'Coach Will';

COMMENT ON COLUMN bookings.focus_areas IS 'Array of focus areas/skills worked on during the session';
COMMENT ON COLUMN bookings.progress_note IS 'Progress notes from coach about athlete development during the session';
COMMENT ON COLUMN bookings.coach_name IS 'Name of the coach who conducted the session';
