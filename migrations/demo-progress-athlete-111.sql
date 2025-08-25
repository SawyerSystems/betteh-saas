-- Demo progress data for Athlete ID 111 (Julie Webb)
-- Using correct status values: prepping, learning, consistent, mastered

BEGIN;

DO $$
DECLARE
  v_athlete_id INTEGER := 111;
  v_apparatus_floor_id INTEGER;
  v_skill_handstand_id INTEGER;
  v_skill_cartwheel_id INTEGER;
  v_skill_roundoff_id INTEGER;
  v_skill_bhs_id INTEGER;
  v_as_handstand_id INTEGER;
  v_as_cartwheel_id INTEGER;
  v_as_roundoff_id INTEGER;
  v_as_bhs_id INTEGER;
BEGIN
  -- Ensure athlete exists; abort if missing to avoid orphaned data
  IF NOT EXISTS (SELECT 1 FROM public.athletes WHERE id = v_athlete_id) THEN
    RAISE EXCEPTION 'Athlete id % not found. Aborting.', v_athlete_id;
  END IF;

  -- Ensure apparatus: Floor
  SELECT id INTO v_apparatus_floor_id FROM public.apparatus WHERE name = 'Floor' LIMIT 1;
  IF v_apparatus_floor_id IS NULL THEN
    INSERT INTO public.apparatus (name, sort_order, created_at)
    VALUES ('Floor', 10, now())
    RETURNING id INTO v_apparatus_floor_id;
  END IF;

  -- Ensure skills with proper reference_videos structure
  -- Handstand
  SELECT id INTO v_skill_handstand_id FROM public.skills WHERE name = 'Handstand' LIMIT 1;
  IF v_skill_handstand_id IS NULL THEN
    INSERT INTO public.skills (
      name, category, level, description, display_order, created_at, apparatus_id, 
      is_connected_combo, reference_videos
    )
    VALUES (
      'Handstand', 'Floor', 'beginner', 
      'Straight-body handstand holds and shoulder alignment', 
      10, now(), v_apparatus_floor_id, false, '[]'::jsonb
    )
    RETURNING id INTO v_skill_handstand_id;
  END IF;

  -- Cartwheel
  SELECT id INTO v_skill_cartwheel_id FROM public.skills WHERE name = 'Cartwheel' LIMIT 1;
  IF v_skill_cartwheel_id IS NULL THEN
    INSERT INTO public.skills (
      name, category, level, description, display_order, created_at, apparatus_id,
      is_connected_combo, reference_videos
    )
    VALUES (
      'Cartwheel', 'Floor', 'beginner', 
      'Lunge entry, hand placement, finish rebound', 
      20, now(), v_apparatus_floor_id, false, '[]'::jsonb
    )
    RETURNING id INTO v_skill_cartwheel_id;
  END IF;

  -- Roundoff
  SELECT id INTO v_skill_roundoff_id FROM public.skills WHERE name = 'Roundoff' LIMIT 1;
  IF v_skill_roundoff_id IS NULL THEN
    INSERT INTO public.skills (
      name, category, level, description, display_order, created_at, apparatus_id,
      is_connected_combo, reference_videos
    )
    VALUES (
      'Roundoff', 'Floor', 'intermediate', 
      'Snap-down and block, straight-arm support', 
      30, now(), v_apparatus_floor_id, false, '[]'::jsonb
    )
    RETURNING id INTO v_skill_roundoff_id;
  END IF;

  -- Back Handspring
  SELECT id INTO v_skill_bhs_id FROM public.skills WHERE name = 'Back Handspring' LIMIT 1;
  IF v_skill_bhs_id IS NULL THEN
    INSERT INTO public.skills (
      name, category, level, description, display_order, created_at, apparatus_id,
      is_connected_combo, reference_videos
    )
    VALUES (
      'Back Handspring', 'Floor', 'intermediate', 
      'Sit, reach, block through shoulders, tight snap-down', 
      40, now(), v_apparatus_floor_id, false, '[]'::jsonb
    )
    RETURNING id INTO v_skill_bhs_id;
  END IF;

  -- Add skill prerequisite: Roundoff is prerequisite for Back Handspring
  IF v_skill_roundoff_id IS NOT NULL AND v_skill_bhs_id IS NOT NULL THEN
    INSERT INTO public.skills_prerequisites (skill_id, prerequisite_skill_id)
    VALUES (v_skill_bhs_id, v_skill_roundoff_id)
    ON CONFLICT (skill_id, prerequisite_skill_id) DO NOTHING;
  END IF;

  -- Upsert athlete_skills progress with CORRECT status values
  -- Handstand (learning)
  IF NOT EXISTS (
    SELECT 1 FROM public.athlete_skills WHERE athlete_id = v_athlete_id AND skill_id = v_skill_handstand_id
  ) THEN
    INSERT INTO public.athlete_skills
      (athlete_id, skill_id, status, notes, unlock_date, first_tested_at, last_tested_at, created_at, updated_at)
    VALUES
      (v_athlete_id, v_skill_handstand_id, 'learning',
       'Working on straight body line and shoulder push. Can hold 20–25s on wall.',
       NULL, now() - interval '30 days', now(), now(), now());
  ELSE
    UPDATE public.athlete_skills
      SET status = 'learning',
          notes = 'Working on straight body line and shoulder push. Can hold 20–25s on wall.',
          last_tested_at = now(),
          updated_at = now()
      WHERE athlete_id = v_athlete_id AND skill_id = v_skill_handstand_id;
  END IF;

  -- Cartwheel (consistent - showing good progress)
  IF NOT EXISTS (
    SELECT 1 FROM public.athlete_skills WHERE athlete_id = v_athlete_id AND skill_id = v_skill_cartwheel_id
  ) THEN
    INSERT INTO public.athlete_skills
      (athlete_id, skill_id, status, notes, unlock_date, first_tested_at, last_tested_at, created_at, updated_at)
    VALUES
      (v_athlete_id, v_skill_cartwheel_id, 'consistent',
       'Great improvement! Straight legs, proper hand placement, strong finish position.',
       (current_date - interval '7 days')::date, now() - interval '20 days', now(), now(), now());
  ELSE
    UPDATE public.athlete_skills
      SET status = 'consistent',
          notes = 'Great improvement! Straight legs, proper hand placement, strong finish position.',
          unlock_date = (current_date - interval '7 days')::date,
          last_tested_at = now(),
          updated_at = now()
      WHERE athlete_id = v_athlete_id AND skill_id = v_skill_cartwheel_id;
  END IF;

  -- Roundoff (learning)
  IF NOT EXISTS (
    SELECT 1 FROM public.athlete_skills WHERE athlete_id = v_athlete_id AND skill_id = v_skill_roundoff_id
  ) THEN
    INSERT INTO public.athlete_skills
      (athlete_id, skill_id, status, notes, unlock_date, first_tested_at, last_tested_at, created_at, updated_at)
    VALUES
      (v_athlete_id, v_skill_roundoff_id, 'learning',
       'Developing snap-down and block. Drills with panel mat and spotted reps.',
       NULL, now() - interval '14 days', now(), now(), now());
  ELSE
    UPDATE public.athlete_skills
      SET status = 'learning',
          notes = 'Developing snap-down and block. Drills with panel mat and spotted reps.',
          last_tested_at = now(),
          updated_at = now()
      WHERE athlete_id = v_athlete_id AND skill_id = v_skill_roundoff_id;
  END IF;

  -- Back Handspring (prepping - prerequisites still in progress)
  IF NOT EXISTS (
    SELECT 1 FROM public.athlete_skills WHERE athlete_id = v_athlete_id AND skill_id = v_skill_bhs_id
  ) THEN
    INSERT INTO public.athlete_skills
      (athlete_id, skill_id, status, notes, unlock_date, first_tested_at, last_tested_at, created_at, updated_at)
    VALUES
      (v_athlete_id, v_skill_bhs_id, 'prepping',
       'Building strength and confidence. Jump back drills and conditioning.',
       NULL, now() - interval '3 days', now() - interval '1 days', now(), now());
  ELSE
    UPDATE public.athlete_skills
      SET status = 'prepping',
          notes = 'Building strength and confidence. Jump back drills and conditioning.',
          last_tested_at = now() - interval '1 days',
          updated_at = now()
      WHERE athlete_id = v_athlete_id AND skill_id = v_skill_bhs_id;
  END IF;

  -- Fetch athlete_skill IDs
  SELECT id INTO v_as_handstand_id FROM public.athlete_skills
    WHERE athlete_id = v_athlete_id AND skill_id = v_skill_handstand_id
    ORDER BY id DESC LIMIT 1;

  SELECT id INTO v_as_cartwheel_id FROM public.athlete_skills
    WHERE athlete_id = v_athlete_id AND skill_id = v_skill_cartwheel_id
    ORDER BY id DESC LIMIT 1;

  SELECT id INTO v_as_roundoff_id FROM public.athlete_skills
    WHERE athlete_id = v_athlete_id AND skill_id = v_skill_roundoff_id
    ORDER BY id DESC LIMIT 1;

  SELECT id INTO v_as_bhs_id FROM public.athlete_skills
    WHERE athlete_id = v_athlete_id AND skill_id = v_skill_bhs_id
    ORDER BY id DESC LIMIT 1;

  -- Sample videos with new enhanced columns
  IF v_as_handstand_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.athlete_skill_videos
     WHERE athlete_skill_id = v_as_handstand_id AND url = 'https://example.com/videos/handstand-1.mp4'
  ) THEN
    INSERT INTO public.athlete_skill_videos (
      athlete_skill_id, url, title, caption, recorded_at, created_at, updated_at,
      is_featured, is_visible, sort_index, processing_status, display_date
    )
    VALUES (
      v_as_handstand_id, 'https://example.com/videos/handstand-1.mp4', 
      'Wall Handstand Hold - Week 1', 'Great progress on body alignment!',
      now() - interval '21 days', now(), now(),
      true, true, 1, 'ready', now() - interval '21 days'
    );
  END IF;

  IF v_as_cartwheel_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.athlete_skill_videos
     WHERE athlete_skill_id = v_as_cartwheel_id AND url = 'https://example.com/videos/cartwheel-1.mp4'
  ) THEN
    INSERT INTO public.athlete_skill_videos (
      athlete_skill_id, url, title, caption, recorded_at, created_at, updated_at,
      is_featured, is_visible, sort_index, processing_status, display_date
    )
    VALUES (
      v_as_cartwheel_id, 'https://example.com/videos/cartwheel-1.mp4', 
      'Cartwheel Technique Check - Week 2', 'Working on straight leg and hand placement',
      now() - interval '9 days', now(), now(),
      false, true, 1, 'ready', now() - interval '9 days'
    );
  END IF;

  -- Add a second video for cartwheel to show progression
  IF v_as_cartwheel_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.athlete_skill_videos
     WHERE athlete_skill_id = v_as_cartwheel_id AND url = 'https://example.com/videos/cartwheel-2.mp4'
  ) THEN
    INSERT INTO public.athlete_skill_videos (
      athlete_skill_id, url, title, caption, recorded_at, created_at, updated_at,
      is_featured, is_visible, sort_index, processing_status, display_date
    )
    VALUES (
      v_as_cartwheel_id, 'https://example.com/videos/cartwheel-2.mp4', 
      'Cartwheel Progress Check - Current', 'Much improved form and consistency!',
      now() - interval '2 days', now(), now(),
      true, true, 2, 'ready', now() - interval '2 days'
    );
  END IF;

  -- Create a progress share link if none exists
  IF NOT EXISTS (SELECT 1 FROM public.progress_share_links WHERE athlete_id = v_athlete_id) THEN
    INSERT INTO public.progress_share_links (athlete_id, token, expires_at, created_at)
    VALUES (
      v_athlete_id,
      substring(md5(random()::text || clock_timestamp()::text) for 24),
      now() + interval '30 days',
      now()
    );
  END IF;

  RAISE NOTICE 'Demo progress data successfully created/updated for Athlete ID %', v_athlete_id;

END $$;

COMMIT;
