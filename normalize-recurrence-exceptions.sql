-- normalize-recurrence-exceptions.sql
-- Purpose: Normalize truncated timestamps inside events.recurrence_exceptions (jsonb array)
-- Run manually in Supabase SQL editor. Review output of each step before proceeding.

-- =============================
-- 1. Preview rows that would change
-- =============================
WITH expanded AS (
  SELECT e.id, jsonb_array_elements_text(e.recurrence_exceptions) AS val
  FROM events e
), normalized AS (
  SELECT id,
    ARRAY_AGG(
      CASE
        WHEN val ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}$' THEN val || ':00:00.000Z'
        WHEN val ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$' THEN val || ':00.000Z'
        WHEN val ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}$' AND val !~ 'Z$' THEN val || '.000Z'
        ELSE val
      END
    ) AS new_vals
  FROM expanded
  GROUP BY id
), diff AS (
  SELECT e.id,
         e.recurrence_exceptions AS old_jsonb,
         to_jsonb((SELECT ARRAY(SELECT DISTINCT v FROM unnest(n.new_vals) v ORDER BY v))) AS new_jsonb
  FROM events e
  JOIN normalized n USING (id)
)
SELECT * FROM diff WHERE old_jsonb <> new_jsonb;

-- Inspect result set. If empty, no action needed.

-- =============================
-- 2. Backup affected rows (idempotent)
-- =============================
CREATE TABLE IF NOT EXISTS events_recurrence_exceptions_backup AS
SELECT e.*
FROM events e
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements_text(e.recurrence_exceptions) x(val)
  WHERE val ~ 'T[0-9]{2}$'
     OR val ~ 'T[0-9]{2}:[0-9]{2}$'
     OR (val ~ 'T[0-9]{2}:[0-9]{2}:[0-9]{2}$' AND val !~ 'Z$')
);

-- Optional: record when backup taken
COMMENT ON TABLE events_recurrence_exceptions_backup IS 'Backup before recurrence_exceptions normalization';

-- =============================
-- 3. Apply normalization (only rows needing change)
-- =============================
WITH expanded AS (
  SELECT e.id, jsonb_array_elements_text(e.recurrence_exceptions) AS val
  FROM events e
), normalized AS (
  SELECT id,
    ARRAY_AGG(
      CASE
        WHEN val ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}$' THEN val || ':00:00.000Z'
        WHEN val ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$' THEN val || ':00.000Z'
        WHEN val ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}$' AND val !~ 'Z$' THEN val || '.000Z'
        ELSE val
      END
    ) AS new_vals
  FROM expanded
  GROUP BY id
), dedup AS (
  SELECT id, to_jsonb((SELECT ARRAY(SELECT DISTINCT v FROM unnest(new_vals) v ORDER BY v))) AS new_jsonb
  FROM normalized
)
UPDATE events e
SET recurrence_exceptions = d.new_jsonb
FROM dedup d
WHERE e.id = d.id
  AND e.recurrence_exceptions <> d.new_jsonb
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(e.recurrence_exceptions) x(val)
    WHERE val ~ 'T[0-9]{2}$'
       OR val ~ 'T[0-9]{2}:[0-9]{2}$'
       OR (val ~ 'T[0-9]{2}:[0-9]{2}:[0-9]{2}$' AND val !~ 'Z$')
  );

-- Row count from UPDATE indicates how many series cleaned.

-- =============================
-- 4. Verification (expect zero rows)
-- =============================
SELECT id, recurrence_exceptions
FROM events
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements_text(recurrence_exceptions) v(val)
  WHERE val ~ 'T[0-9]{2}$'
     OR val ~ 'T[0-9]{2}:[0-9]{2}$'
     OR (val ~ 'T[0-9]{2}:[0-9]{2}:[0-9]{2}$' AND val !~ 'Z$')
);

-- =============================
-- 5. Rollback (if needed)
-- =============================
-- Restores original recurrence_exceptions for backed-up rows.
-- ONLY run if you need to revert.
-- UPDATE events e
-- SET recurrence_exceptions = b.recurrence_exceptions
-- FROM events_recurrence_exceptions_backup b
-- WHERE e.id = b.id;

-- End of script