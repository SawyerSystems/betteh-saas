-- Add focus_area_other column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS focus_area_other TEXT;

-- Update existing bookings to check for "Other:" entries and extract them
UPDATE bookings
SET focus_area_other = (
  SELECT SUBSTRING(area FROM 8) -- Extracts text after "Other: "
  FROM UNNEST(focus_areas) AS area
  WHERE area LIKE 'Other:%'
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM UNNEST(focus_areas) AS area
  WHERE area LIKE 'Other:%'
);

-- Add function to handle other focus areas in new bookings
CREATE OR REPLACE FUNCTION handle_focus_area_other()
RETURNS TRIGGER AS $$
BEGIN
  -- When focus_area_other is provided, ensure it's in the focus_areas array with "Other:" prefix
  IF NEW.focus_area_other IS NOT NULL AND LENGTH(TRIM(NEW.focus_area_other)) > 0 THEN
    -- Check if we already have an "Other:" entry
    IF NOT EXISTS (
      SELECT 1 FROM UNNEST(NEW.focus_areas) AS area
      WHERE area LIKE 'Other:%'
    ) THEN
      -- Add the custom focus area with "Other:" prefix
      NEW.focus_areas = array_append(NEW.focus_areas, 'Other: ' || NEW.focus_area_other);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to handle focus_area_other changes
DROP TRIGGER IF EXISTS focus_area_other_trigger ON bookings;
CREATE TRIGGER focus_area_other_trigger
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION handle_focus_area_other();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_focus_area_other ON bookings(focus_area_other);
