-- Adventure Log + Normalized Focus Areas Migration
-- Run this in Supabase SQL Editor

-- Step 1: Add Adventure Log fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS progress_note TEXT,
ADD COLUMN IF NOT EXISTS coach_name TEXT DEFAULT 'Coach Will';

-- Step 2: Create the booking_focus_areas junction table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS booking_focus_areas (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  focus_area_id INTEGER NOT NULL REFERENCES focus_areas(id) ON DELETE CASCADE,
  UNIQUE(booking_id, focus_area_id)
);

-- Step 3: Create other junction tables if they don't exist
CREATE TABLE IF NOT EXISTS booking_apparatus (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  apparatus_id INTEGER NOT NULL REFERENCES apparatus(id) ON DELETE CASCADE,
  UNIQUE(booking_id, apparatus_id)
);

CREATE TABLE IF NOT EXISTS booking_side_quests (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  side_quest_id INTEGER NOT NULL REFERENCES side_quests(id) ON DELETE CASCADE,
  UNIQUE(booking_id, side_quest_id)
);

-- Step 4: Migrate existing focus_areas data from TEXT[] to junction table
-- (Only if there's existing data in the focus_areas column)
DO $$
DECLARE
    booking_rec RECORD;
    focus_area_name TEXT;
    focus_area_id INTEGER;
BEGIN
    -- Check if focus_areas column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'focus_areas'
    ) THEN
        -- Loop through all bookings that have focus_areas data
        FOR booking_rec IN 
            SELECT id, focus_areas 
            FROM bookings 
            WHERE focus_areas IS NOT NULL AND array_length(focus_areas, 1) > 0
        LOOP
            -- Loop through each focus area in the array
            FOREACH focus_area_name IN ARRAY booking_rec.focus_areas
            LOOP
                -- Find the focus_area_id for this name
                SELECT id INTO focus_area_id 
                FROM focus_areas 
                WHERE name = focus_area_name;
                
                -- If found, insert into junction table
                IF focus_area_id IS NOT NULL THEN
                    INSERT INTO booking_focus_areas (booking_id, focus_area_id)
                    VALUES (booking_rec.id, focus_area_id)
                    ON CONFLICT (booking_id, focus_area_id) DO NOTHING;
                END IF;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Migration of focus_areas data completed successfully';
    ELSE
        RAISE NOTICE 'focus_areas column does not exist, skipping migration';
    END IF;
END $$;

-- Step 5: Add RLS policies for the new junction tables
ALTER TABLE booking_focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_apparatus ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_side_quests ENABLE ROW LEVEL SECURITY;

-- Service role can manage all junction tables
CREATE POLICY "Service role can manage booking_focus_areas" ON booking_focus_areas
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage booking_apparatus" ON booking_apparatus
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage booking_side_quests" ON booking_side_quests
FOR ALL USING (auth.role() = 'service_role');

-- Public read access (if needed for frontend)
CREATE POLICY "Public read access to booking_focus_areas" ON booking_focus_areas
FOR SELECT USING (true);

CREATE POLICY "Public read access to booking_apparatus" ON booking_apparatus
FOR SELECT USING (true);

CREATE POLICY "Public read access to booking_side_quests" ON booking_side_quests
FOR SELECT USING (true);

-- Step 6: Add comments for documentation
COMMENT ON COLUMN bookings.progress_note IS 'Progress notes from coach for Adventure Log tracking';
COMMENT ON COLUMN bookings.coach_name IS 'Name of coach who conducted the session, defaults to Coach Will';
COMMENT ON TABLE booking_focus_areas IS 'Junction table linking bookings to focus areas';
COMMENT ON TABLE booking_apparatus IS 'Junction table linking bookings to apparatus';
COMMENT ON TABLE booking_side_quests IS 'Junction table linking bookings to side quests';

-- Step 7: (Optional) Remove the old focus_areas column after migration is verified
-- IMPORTANT: Only run this after verifying the migration worked correctly!
-- ALTER TABLE bookings DROP COLUMN IF EXISTS focus_areas;
