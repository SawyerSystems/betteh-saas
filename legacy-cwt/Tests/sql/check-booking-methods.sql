-- Check existing booking_method values before normalization
SELECT DISTINCT booking_method, COUNT(*) as count
FROM bookings 
GROUP BY booking_method
ORDER BY count DESC;

-- Check for any NULL values
SELECT COUNT(*) as null_count
FROM bookings 
WHERE booking_method IS NULL;

-- Show all unique values as a simple list
SELECT DISTINCT booking_method 
FROM bookings 
WHERE booking_method IS NOT NULL
ORDER BY booking_method;
