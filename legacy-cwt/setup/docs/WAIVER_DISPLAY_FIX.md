# Waiver Cards Display Fix

## Issue 1: Waiver cards show blank signer info and 'Invalid Date'

### Problem
In the parent portal's waiver management section, waiver cards for signed waivers were displaying:
1. Blank signer name (where it should show the parent's name)
2. Blank relationship to athlete (where it should show "Parent/Guardian" or other relationship)
3. "Invalid Date" instead of the actual date when the waiver was signed

### Root Cause
1. The database view `athletes_with_waiver_status` was missing the `relationship_to_athlete` field from the waivers table.
2. The existing SQL script to fix this issue (`add-relationship-to-athlete-view.sql`) incorrectly referenced a non-existent `waiver_signatures` table.
3. The original SQL script was selecting the wrong fields and using the wrong join structure.

### Solution
1. Created a corrected SQL script (`fixed-add-relationship-to-athlete-view.sql`) that:
   - Properly joins the `athletes`, `waivers`, and `parents` tables
   - Selects the `relationship_to_athlete` field directly from the `waivers` table
   - Uses the same pattern as the working `fix-waiver-signer-name.sql` file

2. The frontend component was correctly trying to display:
   - `status.waiver?.signer_name` for the signer name
   - `status.waiver?.relationship_to_athlete` for the relationship
   - `new Date(status.waiver.signed_at).toLocaleDateString()` for the date formatting

3. The corrected SQL uses the proper schema structure as documented in `actual-database-schema.md`:
   ```sql
   -- waivers table (CURRENT STRUCTURE)
   CREATE TABLE waivers (
     id INTEGER PRIMARY KEY,
     booking_id INTEGER REFERENCES bookings(id),
     athlete_id INTEGER NOT NULL REFERENCES athletes(id),
     parent_id INTEGER NOT NULL REFERENCES parents(id),
     relationship_to_athlete TEXT DEFAULT 'Parent/Guardian',
     ...
   ```

### Implementation
1. Run the corrected SQL script (`fixed-add-relationship-to-athlete-view.sql`) on the database to update the view.
2. No changes are needed in the frontend as it already expected these fields to be present.

### Testing
1. After applying this SQL change, the parent portal waiver cards should correctly display:
   - The parent's name as the signer
   - The relationship to athlete (usually "Parent/Guardian")
   - The correctly formatted date when the waiver was signed

### Verification
The change can be verified by checking the response from the `/api/parent/waivers` endpoint, which should now include the `relationship_to_athlete` field in the waiver object.
