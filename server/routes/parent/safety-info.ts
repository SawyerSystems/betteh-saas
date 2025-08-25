// Backend API handler for updating safety information
// Path: /server/routes/parent/safety-info.ts

import { z } from "zod";
import { db } from "../../db";

// Define the request schema for safety info
const safetyInfoSchema = z.object({
  dropoffPersonName: z.string().min(1, "Dropoff person name is required"),
  dropoffPersonRelationship: z.string().min(1, "Dropoff person relationship is required"),
  dropoffPersonPhone: z.string().min(1, "Dropoff person phone is required"),
  pickupPersonName: z.string().min(1, "Pickup person name is required"),
  pickupPersonRelationship: z.string().min(1, "Pickup person relationship is required"),
  pickupPersonPhone: z.string().min(1, "Pickup person phone is required"),
  altPickupPersonName: z.string().optional(),
  altPickupPersonRelationship: z.string().optional(),
  altPickupPersonPhone: z.string().optional(),
  updateCurrentBookings: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const session = await verifyParentSession();
    if (!session?.parentId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const safetyData = safetyInfoSchema.parse(await req.json());

    // Store the safety information in the parent profile (can be useful for future bookings)
    // This requires adding safety fields to the parents table, which we'll assume for now
    // In production, you might want to store this in a separate table or add these fields to the parents table

    // If requested, update all upcoming bookings with the new safety information
    if (safetyData.updateCurrentBookings) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Update all future bookings for this parent
      await db.from('bookings')
        .update({
          dropoff_person_name: safetyData.dropoffPersonName,
          dropoff_person_relationship: safetyData.dropoffPersonRelationship,
          dropoff_person_phone: safetyData.dropoffPersonPhone,
          pickup_person_name: safetyData.pickupPersonName,
          pickup_person_relationship: safetyData.pickupPersonRelationship,
          pickup_person_phone: safetyData.pickupPersonPhone,
          alt_pickup_person_name: safetyData.altPickupPersonName || null,
          alt_pickup_person_relationship: safetyData.altPickupPersonRelationship || null,
          alt_pickup_person_phone: safetyData.altPickupPersonPhone || null,
          safety_verification_signed: true,
          safety_verification_signed_at: new Date().toISOString(),
        })
        .match({
          parent_id: session.parentId,
          status: 'confirmed' // Only update confirmed bookings
        })
        .gte('preferred_date', todayStr); // Only future bookings
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Safety information updated successfully"
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating safety information:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to update safety information", 
        message: error.message 
      }),
      { status: 500 }
    );
  }
}

// Helper function to verify parent session
async function verifyParentSession() {
  // This would be replaced with your actual authentication logic
  // For example, checking cookies or JWT tokens
  
  // For now, we'll return a mock session
  return {
    parentId: 1,
    email: "parent@example.com",
    loggedIn: true
  };
}
