-- Update athlete_skills status constraint to match application expectations
-- Change from: not_started, learning, working, consistent, mastered
-- To: prepping, learning, consistent, mastered

BEGIN;

-- First, update any existing 'working' status to 'prepping' to match app expectations
UPDATE public.athlete_skills 
SET status = 'prepping', updated_at = now()
WHERE status = 'working';

-- Update any existing 'not_started' status to 'prepping' since app doesn't use 'not_started'
UPDATE public.athlete_skills 
SET status = 'prepping', updated_at = now() 
WHERE status = 'not_started';

-- Drop the old constraint
ALTER TABLE public.athlete_skills 
DROP CONSTRAINT IF EXISTS athlete_skills_status_check;

-- Add the new constraint with correct status values
ALTER TABLE public.athlete_skills 
ADD CONSTRAINT athlete_skills_status_check 
CHECK (status::text = ANY (ARRAY['prepping'::character varying, 'learning'::character varying, 'consistent'::character varying, 'mastered'::character varying]::text[]));

COMMIT;
