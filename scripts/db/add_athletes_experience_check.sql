-- Adds a CHECK constraint enforcing allowed experience values on athletes.experience
-- Allowed: beginner, intermediate, advanced, elite
-- Safe to run multiple times: uses IF NOT EXISTS pattern by naming and checking.

-- 1) Create the constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = 'athletes_experience_check'
      AND tc.table_name = 'athletes'
      AND tc.table_schema = 'public'
  ) THEN
    ALTER TABLE public.athletes
      ADD CONSTRAINT athletes_experience_check
      CHECK (experience IN ('beginner','intermediate','advanced','elite'));
  END IF;
END $$;

-- 2) Optionally validate existing rows (Postgres validates by default on ADD CONSTRAINT)
-- If you added NOT VALID, you could run: ALTER TABLE public.athletes VALIDATE CONSTRAINT athletes_experience_check;
