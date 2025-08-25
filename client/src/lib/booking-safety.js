// Helper function to update booking safety information from the client side

import { API_BASE_URL } from './config';

/**
 * Updates the safety information for a booking.
 * This function can be used by the parent dashboard to update pickup/dropoff info.
 * 
 * @param bookingId - The ID of the booking to update
 * @param safetyInfo - Object containing safety information fields to update
 * @returns Promise resolving to the API response
 */
export async function updateBookingSafetyInfo(bookingId, safetyInfo) {
  try {
    // Validate booking ID
    if (!bookingId || typeof bookingId !== 'number') {
      throw new Error('Invalid booking ID');
    }

    // Validate safety info
    if (!safetyInfo || typeof safetyInfo !== 'object') {
      throw new Error('Safety information must be provided as an object');
    }
    
    // Optional validation for required fields
    const requiredPersonInfo = ['name', 'relationship', 'phone'];
    
    if (safetyInfo.dropoffPerson) {
      for (const field of requiredPersonInfo) {
        if (!safetyInfo.dropoffPerson[field]) {
          throw new Error(`Dropoff person ${field} is required`);
        }
      }
    }
    
    if (safetyInfo.pickupPerson) {
      for (const field of requiredPersonInfo) {
        if (!safetyInfo.pickupPerson[field]) {
          throw new Error(`Pickup person ${field} is required`);
        }
      }
    }

    // Format data for API request
    const apiPayload = {
      dropoffPersonName: safetyInfo.dropoffPerson?.name,
      dropoffPersonRelationship: safetyInfo.dropoffPerson?.relationship,
      dropoffPersonPhone: safetyInfo.dropoffPerson?.phone,
      pickupPersonName: safetyInfo.pickupPerson?.name,
      pickupPersonRelationship: safetyInfo.pickupPerson?.relationship,
      pickupPersonPhone: safetyInfo.pickupPerson?.phone,
      // Alternative pickup person is optional
      altPickupPersonName: safetyInfo.altPickupPerson?.name,
      altPickupPersonRelationship: safetyInfo.altPickupPerson?.relationship,
      altPickupPersonPhone: safetyInfo.altPickupPerson?.phone,
    };

    // Remove undefined fields
    Object.keys(apiPayload).forEach(key => {
      if (apiPayload[key] === undefined) {
        delete apiPayload[key];
      }
    });
    
    // Send request to API
    const response = await fetch(`${API_BASE_URL}/api/parent/bookings/${bookingId}/safety`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
      credentials: 'include', // Important for sending cookies
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update safety information');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating booking safety information:', error);
    throw error;
  }
}
