-- CoachWillTumbles: Enhance athlete_skill_videos for multi-clip/day, metadata, and background processing
-- IMPORTANT: Run this in Supabase SQL editor. After applying, update shared/schema.ts to match.
-- Safe to re-run: uses IF NOT EXISTS and guarded constraints.

BEGIN;

-- 1) Add metadata and control columns
ALTER TABLE athlete_skill_videos
  ADD COLUMN IF NOT EXISTS caption            text,
  ADD COLUMN IF NOT EXISTS is_visible         boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_date       date,
  ADD COLUMN IF NOT EXISTS sort_index         integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thumbnail_url      text,
  ADD COLUMN IF NOT EXISTS optimized_url      text,
  ADD COLUMN IF NOT EXISTS processing_status  text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processing_error   text;

-- 2) Backfill display_date from recorded_at (fallback created_at)
UPDATE athlete_skill_videos
SET display_date = (COALESCE(recorded_at, created_at) AT TIME ZONE 'UTC')::date
WHERE display_date IS NULL;

-- In case any rows still NULL, set to today as a final fallback
UPDATE athlete_skill_videos
SET display_date = CURRENT_DATE
WHERE display_date IS NULL;

-- 3) Initialize processing_status for existing rows to 'ready' so parents aren't blocked
UPDATE athlete_skill_videos
SET processing_status = 'ready'
WHERE processing_status IS NULL OR processing_status = 'pending';

-- 4) Seed sort_index within each (athlete_skill_id, display_date) group by time
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY athlete_skill_id, display_date
           ORDER BY recorded_at NULLS LAST, id
         ) - 1 AS rn
  FROM athlete_skill_videos
)
UPDATE athlete_skill_videos v
SET sort_index = r.rn
FROM ranked r
WHERE v.id = r.id;

-- 5) Add a CHECK constraint for processing_status (text with allowed values)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_asv_processing_status'
  ) THEN
    ALTER TABLE athlete_skill_videos
      ADD CONSTRAINT chk_asv_processing_status
      CHECK (processing_status IN ('pending','processing','ready','failed'));
  END IF;
END $$;

-- 6) Optional: enforce display_date presence after backfill
-- (Uncomment if you want this guarantee at the DB level)
-- ALTER TABLE athlete_skill_videos ALTER COLUMN display_date SET NOT NULL;

-- 7) Indexes for grouping, ordering, and visibility filtering
CREATE INDEX IF NOT EXISTS idx_asv_grouping
  ON athlete_skill_videos (athlete_skill_id, display_date DESC, sort_index ASC, recorded_at ASC);

CREATE INDEX IF NOT EXISTS idx_asv_visible
  ON athlete_skill_videos (athlete_skill_id, is_visible);

COMMIT;

-- Post-apply notes:
-- - Update shared/schema.ts: add the new columns to athleteSkillVideos.
-- - In storage layer, order videos by (display_date DESC, sort_index ASC, recorded_at ASC).
-- - For parents, filter is_visible = true. Admins can view all.
-- - New uploads can set processing_status = 'pending' and later update to 'ready' when background processing completes.
