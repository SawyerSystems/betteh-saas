-- Add key_points array and reservation_fee field to lesson_types table
-- This migration assumes lesson_types table already exists

-- Add reservation_fee column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'lesson_types' 
                    AND column_name = 'reservation_fee') 
    THEN
        ALTER TABLE lesson_types ADD COLUMN reservation_fee DECIMAL(10,2) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added reservation_fee column to lesson_types table';
    ELSE
        RAISE NOTICE 'reservation_fee column already exists in lesson_types table';
    END IF;
END $$;

-- Seed default lesson types if table is empty
DO $$
DECLARE
    lt_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO lt_count FROM lesson_types;
    IF lt_count = 0 THEN
        INSERT INTO lesson_types (name, description, duration_minutes, is_private, total_price, reservation_fee, key_points, max_athletes, is_active)
        VALUES
        ('Quick Journey', 'Perfect for skill checks, focused practice, or when time is limited', 30, TRUE, 40.00, 10.00, '["Skill assessment","Quick corrections","Confidence building"]'::jsonb, 1, TRUE),
        ('Dual Quest', 'Train with a partner for twice the motivation and fun', 30, FALSE, 60.00, 10.00, '["Partner accountability","Shared goals","Friendly competition"]'::jsonb, 2, TRUE),
        ('Deep Dive', 'Focused 60-minute session for measurable progress', 60, TRUE, 70.00, 10.00, '["Form refinement","Strength building","Technique mastery"]'::jsonb, 1, TRUE),
        ('Partner Progression', 'Longer semi-private session to progress together', 60, FALSE, 90.00, 10.00, '["Teamwork","Endurance","Goal tracking"]'::jsonb, 2, TRUE);
        RAISE NOTICE 'Seeded default lesson types.';
    ELSE
        RAISE NOTICE 'Lesson types already present (%). Skipping seed.', lt_count;
    END IF;
END $$;

-- Add key_points column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'lesson_types' 
                    AND column_name = 'key_points') 
    THEN
        ALTER TABLE lesson_types ADD COLUMN key_points JSONB DEFAULT '[]'::JSONB;
        RAISE NOTICE 'Added key_points column to lesson_types table';
    ELSE
        RAISE NOTICE 'key_points column already exists in lesson_types table';
    END IF;
END $$;

-- Add max_athletes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'lesson_types' 
                    AND column_name = 'max_athletes') 
    THEN
        ALTER TABLE lesson_types ADD COLUMN max_athletes INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added max_athletes column to lesson_types table';
    ELSE
        RAISE NOTICE 'max_athletes column already exists in lesson_types table';
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'lesson_types' 
                    AND column_name = 'is_active') 
    THEN
        ALTER TABLE lesson_types ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column to lesson_types table';
    ELSE
        RAISE NOTICE 'is_active column already exists in lesson_types table';
    END IF;
END $$;
