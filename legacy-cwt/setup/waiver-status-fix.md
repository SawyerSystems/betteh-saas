# Waiver Status Handling Fix

## Issue
Admin booking creation was failing with 500 errors due to database triggers trying to update a non-existent `waiver_status` column in the `bookings` table.

## Solution Applied
1. Removed problematic triggers:
   - `trigger_update_booking_waiver_status_on_waiver`
   - `trigger_update_booking_waiver_status_on_booking_athletes`

2. Removed problematic function:
   - `update_booking_waiver_status()`

3. Created a new approach that doesn't rely on storing waiver status directly in the bookings table:
   - Added a new function `get_booking_waiver_status(booking_id INT)` that calculates waiver status based on associated athletes
   - Created a view `booking_waiver_status` that makes it easy to query booking waiver status

## Usage
To get a booking's waiver status, either:
- Call the function: `SELECT get_booking_waiver_status(booking_id)`
- Query the view: `SELECT * FROM booking_waiver_status WHERE booking_id = X`

## Date Fixed
July 31, 2025
