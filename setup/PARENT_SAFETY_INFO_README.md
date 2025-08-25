# Parent Booking Safety Information Update Feature

This feature allows parents to update safety information (pickup/dropoff details) for their bookings.

## Components

1. **Server-side API Endpoint**:
   - Endpoint: `PUT /api/parent/bookings/:id/safety`
   - Location: Added to `server/routes.ts`
   - Authentication: Requires parent authentication
   - Functionality: Updates only safety-related fields for a booking

2. **Client-side API Helper**:
   - Location: `client/src/lib/booking-safety.js`
   - Function: `updateBookingSafetyInfo(bookingId, safetyInfo)`
   - Handles validation and API communication

3. **React Component**:
   - Location: `client/src/components/BookingSafetyForm.jsx`
   - Renders a form for parents to update safety information
   - Provides validation and error handling

4. **Demo Page**:
   - Location: `client/src/pages/BookingSafetyPage.jsx`
   - Example implementation of the BookingSafetyForm component
   - Shows how to fetch booking data and handle form submission

## Integration Guide

### Adding the Route

Add the BookingSafetyPage to your routes configuration:

```jsx
// In your routes file (e.g., App.jsx or routes.jsx)
import BookingSafetyPage from './pages/BookingSafetyPage';

// Add to your routes
<Route path="/parent/bookings/:id/safety" element={<BookingSafetyPage />} />
```

### Linking to the Safety Form

Add links to the safety form from your parent dashboard or booking details page:

```jsx
import { Button } from './components/ui/button';
import { Link } from 'react-router-dom';

// In your booking list or details component
function BookingItem({ booking }) {
  return (
    <div>
      {/* Other booking information */}
      
      <Link to={`/parent/bookings/${booking.id}/safety`}>
        <Button variant="outline" size="sm">
          {booking.safetyVerificationSigned ? 'Update Safety Info' : 'Add Safety Info'}
        </Button>
      </Link>
    </div>
  );
}
```

### Using the Component Directly

You can also use the BookingSafetyForm component directly in any parent-facing page:

```jsx
import { BookingSafetyForm } from './components/BookingSafetyForm';

function MyParentPage({ booking }) {
  const handleSafetyUpdate = (response) => {
    console.log('Safety info updated:', response);
    // Update local state or refresh data
  };

  return (
    <div>
      {/* Other content */}
      <BookingSafetyForm 
        booking={booking} 
        onSuccess={handleSafetyUpdate} 
      />
    </div>
  );
}
```

## Security Considerations

1. The endpoint verifies the parent ID matches the booking's parent_id
2. Only specific safety-related fields can be updated
3. The endpoint is protected by the isParentAuthenticated middleware

## Fields That Can Be Updated

- `dropoffPersonName`
- `dropoffPersonRelationship`
- `dropoffPersonPhone`
- `pickupPersonName`
- `pickupPersonRelationship`
- `pickupPersonPhone`
- `altPickupPersonName`
- `altPickupPersonRelationship`
- `altPickupPersonPhone`
- `safetyVerificationSigned` (automatically set to true)
- `safetyVerificationSignedAt` (automatically set to current time)
