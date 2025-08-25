// API endpoint to update parent safety information
import { z } from "zod";
import { getParentSession } from "../../auth/parent-session";
import { db } from "../../db";

// Define validation schema for safety information
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
  updateCurrentBookings: z.boolean().default(false)
});

export async function POST(req, res) {
  try {
    // Verify parent is authenticated
    const session = await getParentSession(req);
    if (!session || !session.parentId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Parse and validate request body
    const safetyData = safetyInfoSchema.parse(req.body);

    // If requested, update all upcoming bookings with the new safety information
    if (safetyData.updateCurrentBookings) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get all future bookings for this parent that aren't cancelled
      const futureBookings = await db.from('bookings')
        .select('id')
        .eq('parent_id', session.parentId)
        .gte('preferred_date', todayStr)
        .not('status', 'eq', 'cancelled');
        
      if (futureBookings.data && futureBookings.data.length > 0) {
        // Update each booking with the new safety information
        for (const booking of futureBookings.data) {
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
              safety_verification_signed_at: new Date().toISOString()
            })
            .eq('id', booking.id);
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: "Safety information updated successfully" 
    });
  } catch (error) {
    console.error("Error updating safety information:", error);
    return res.status(500).json({ 
      error: "Failed to update safety information", 
      message: error.message 
    });
  }
}
