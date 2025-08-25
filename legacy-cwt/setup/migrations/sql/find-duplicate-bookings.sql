-- Create a function to find potential duplicate bookings
CREATE OR REPLACE FUNCTION find_duplicate_bookings()
RETURNS TABLE (
  group_id UUID,
  booking_ids TEXT[],
  parent_id UUID,
  event_id UUID,
  created_at_times TIMESTAMP[],
  minutes_between_bookings NUMERIC,
  payment_statuses TEXT[],
  booking_statuses TEXT[]
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
    WITH booking_groups AS (
      SELECT
        parent_id,
        event_id,
        ARRAY_AGG(id) as booking_ids,
        ARRAY_AGG(created_at) as created_at_times,
        ARRAY_AGG(payment_status) as payment_statuses,
        ARRAY_AGG(booking_status) as booking_statuses,
        MIN(created_at) as first_booking_time,
        MAX(created_at) as last_booking_time,
        EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/60 as minutes_between
      FROM
        booking
      WHERE
        created_at > (NOW() - INTERVAL '30 days')
      GROUP BY
        parent_id, event_id
      HAVING
        COUNT(*) > 1
        AND EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/60 < 60 -- Less than 60 minutes apart
    )
    SELECT
      gen_random_uuid() as group_id,
      bg.booking_ids,
      bg.parent_id,
      bg.event_id,
      bg.created_at_times,
      bg.minutes_between,
      bg.payment_statuses,
      bg.booking_statuses
    FROM
      booking_groups bg
    ORDER BY
      bg.minutes_between ASC;
END;
$$;
-- Execute the function to find duplicate bookings