import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Create a Supabase client with the service role key for admin access
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Debug function for adding an athlete to a booking
 * This function logs detailed information about each step of the process
 */
async function addAthleteSlotDebug(bookingId: number, athleteId: number, slotOrder: number): Promise<void> {
  console.log(`[DEBUG] Starting addAthleteSlotDebug with bookingId=${bookingId}, athleteId=${athleteId}, slotOrder=${slotOrder}`);
  
  try {
    // Step 1: Verify the booking exists
    console.log(`[DEBUG] Verifying booking exists (ID: ${bookingId})...`);
    const { data: bookingDetails, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (bookingError) {
      console.error(`[DEBUG] Error retrieving booking details:`, bookingError);
      throw new Error(`Booking ${bookingId} not found: ${bookingError.message}`);
    }
    
    console.log(`[DEBUG] Found booking:`, JSON.stringify(bookingDetails, null, 2));
    
    // Step 2: Verify the athlete exists
    console.log(`[DEBUG] Verifying athlete exists (ID: ${athleteId})...`);
    const { data: athleteDetails, error: athleteError } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single();
    
    if (athleteError) {
      console.error(`[DEBUG] Error retrieving athlete details:`, athleteError);
      throw new Error(`Athlete ${athleteId} not found: ${athleteError.message}`);
    }
    
    console.log(`[DEBUG] Found athlete:`, JSON.stringify(athleteDetails, null, 2));
    
    // Step 3: Check if this athlete is already linked to this booking
    console.log(`[DEBUG] Checking if athlete is already linked to booking...`);
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('booking_athletes')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('athlete_id', athleteId)
      .maybeSingle();
    
    if (existingError) {
      console.error(`[DEBUG] Error checking existing booking-athlete link:`, existingError);
    } else if (existing) {
      console.log(`[DEBUG] Athlete already linked to booking:`, JSON.stringify(existing, null, 2));
      console.log(`[DEBUG] No need to create new link - returning.`);
      return;
    }
    
    // Step 4: Insert booking_athletes record
    console.log(`[DEBUG] Inserting booking_athletes record...`);
    const insertData = {
      booking_id: bookingId,
      athlete_id: athleteId,
      slot_order: slotOrder
    };
    
    console.log(`[DEBUG] Insert data:`, JSON.stringify(insertData, null, 2));
    
    const { data: insertResult, error } = await supabaseAdmin
      .from('booking_athletes')
      .insert([insertData]);
    
    if (error) {
      console.error(`[DEBUG] ❌ Primary insert failed with error:`, error);
      console.log(`[DEBUG] Error code:`, error.code);
      console.log(`[DEBUG] Error message:`, error.message);
      console.log(`[DEBUG] Error details:`, error.details);
      
      // Step 5: Try alternative insert approach if primary fails
      console.log(`[DEBUG] Attempting alternative insert approach...`);
      try {
        const { data: altResult, error: altError } = await supabaseAdmin
          .from('booking_athletes')
          .insert([insertData]);
        
        if (altError) {
          console.error(`[DEBUG] ❌ Alternative insert approach also failed:`, altError);
          console.log(`[DEBUG] Alt error code:`, altError.code);
          console.log(`[DEBUG] Alt error message:`, altError.message);
          console.log(`[DEBUG] Alt error details:`, altError.details);
          
          throw new Error(`Failed to link athlete ${athleteId} to booking ${bookingId}: ${altError.message}`);
        } else {
          console.log(`[DEBUG] ✅ Alternative insert approach succeeded:`, altResult);
        }
      } catch (altTryError) {
        console.error(`[DEBUG] ❌ Exception in alternative insert approach:`, altTryError);
        throw altTryError;
      }
    } else {
      console.log(`[DEBUG] ✅ Primary insert succeeded:`, insertResult);
    }

    console.log(`[DEBUG] Successfully added athlete ${athleteId} to booking ${bookingId}`);
    
    // Step 6: Verify the booking_athletes record was created
    console.log(`[DEBUG] Verifying booking_athletes record was created...`);
    const { data: verification, error: verificationError } = await supabaseAdmin
      .from('booking_athletes')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('athlete_id', athleteId);
    
    if (verificationError) {
      console.error(`[DEBUG] Error verifying booking_athletes record:`, verificationError);
    } else {
      console.log(`[DEBUG] Verification result:`, JSON.stringify(verification, null, 2));
    }
  } catch (error) {
    console.error(`[DEBUG] ❌ Exception in addAthleteSlotDebug:`, error);
    throw error;
  }
}

// Example usage (commented out):
/*
async function runTest() {
  try {
    // Replace with actual booking ID, athlete ID, and slot order
    await addAthleteSlotDebug(123, 456, 1);
    console.log('Debug test completed successfully');
  } catch (error) {
    console.error('Debug test failed:', error);
  }
}

runTest();
*/

export { addAthleteSlotDebug };
