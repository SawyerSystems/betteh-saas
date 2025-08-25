-- Diagnostic: Check booking_method values after attempted update
SELECT DISTINCT booking_method, COUNT(*) as count
FROM bookings 
GROUP BY booking_method
ORDER BY count DESC;

-- Check if there are any values that don't match our constraint
SELECT DISTINCT booking_method
FROM bookings 
WHERE booking_method NOT IN ('Website', 'Admin', 'Text', 'Call', 'In-Person', 'Email');

-- Check exact values with quotes to see hidden characters
SELECT DISTINCT '"' || booking_method || '"' as quoted_value, LENGTH(booking_method) as length
FROM bookings;
