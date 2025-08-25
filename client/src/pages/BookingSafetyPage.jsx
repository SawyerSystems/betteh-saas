import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookingSafetyForm } from '../components/BookingSafetyForm';
import { Spinner } from '../components/Spinner';
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/use-toast';
import { API_BASE_URL } from '../lib/config';

export default function BookingSafetyPage() {
  const { id } = useParams(); // Get booking ID from URL
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch booking data when component mounts
  useEffect(() => {
    async function fetchBookingData() {
      try {
        // First check if we have parent bookings in local storage
        const storedBookings = localStorage.getItem('parentBookings');
        if (storedBookings) {
          const parsedBookings = JSON.parse(storedBookings);
          const foundBooking = parsedBookings.find(b => b.id === parseInt(id));
          if (foundBooking) {
            setBooking(foundBooking);
            setIsLoading(false);
            return;
          }
        }

        // If not found in local storage, fetch from API
        const response = await fetch(`${API_BASE_URL}/api/parent/bookings/${id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch booking information');
        }

        const data = await response.json();
        setBooking(data);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err.message);
        toast({
          title: 'Error',
          description: 'Failed to load booking information. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchBookingData();
    }
  }, [id]);

  const handleUpdateSuccess = (updatedData) => {
    toast({
      title: 'Success',
      description: 'Safety information has been updated successfully!',
    });
    
    // Update the booking in state
    setBooking((prev) => ({
      ...prev,
      safetyVerificationSigned: true,
      // Update other fields as needed
    }));
    
    // Navigate back to bookings page after a brief delay
    setTimeout(() => {
      navigate('/parent/bookings');
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Error Loading Booking</h2>
        <p className="mb-6">{error || 'Booking not found'}</p>
        <Button onClick={() => navigate('/parent/bookings')}>
          Return to Bookings
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/parent/bookings')}
          className="mb-4"
        >
          ← Back to Bookings
        </Button>
        <h1 className="text-3xl font-bold">Update Safety Information</h1>
        <p className="text-gray-600 mt-2">
          Session Date: {new Date(`${booking.preferredDate}T12:00:00Z`).toLocaleDateString()}
          {booking.preferredTime && ` at ${booking.preferredTime}`}
        </p>
      </div>
      
      <BookingSafetyForm booking={booking} onSuccess={handleUpdateSuccess} />
    </div>
  );
}
