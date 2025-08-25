-- Safe booking method normalization - run step by step

-- Step 1: See current values
SELECT 'Current booking_method values:' as step;
SELECT DISTINCT booking_method, COUNT(*) as count
FROM bookings 
GROUP BY booking_method
ORDER BY count DESC;

-- Step 2: Update values (run this only after seeing step 1 results)
-- UPDATE bookings SET booking_method = 'Website' WHERE booking_method = 'online';

-- Step 3: Verify update worked
-- SELECT 'After update:' as step;
-- SELECT DISTINCT booking_method, COUNT(*) as count
-- FROM bookings 
-- GROUP BY booking_method
-- ORDER BY count DESC;

-- Step 4: Add constraint (only after step 3 shows all values are correct)
-- ALTER TABLE bookings ADD CONSTRAINT booking_method_check 
-- CHECK (booking_method IN ('Website', 'Admin', 'Text', 'Call', 'In-Person', 'Email'));
