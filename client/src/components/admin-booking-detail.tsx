import { BookingEditModal } from '@/components/BookingEditModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import type { Athlete, Booking, LessonType } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Clock, CreditCard, Edit, FileText, Shield, User, Users } from 'lucide-react';
import { useState } from 'react';

interface AdminBookingDetailProps {
  booking: Booking;
  onRefresh?: () => void;
}

export function AdminBookingDetail({ booking, onRefresh }: AdminBookingDetailProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch booking details including athletes
  const { data: bookingDetails, isLoading } = useQuery({
    queryKey: ['/api/bookings', booking.id, 'details'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/bookings/${booking.id}/details`);
      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }
      return response.json();
    },
  });

  // Fetch lesson type details
  const { data: lessonType } = useQuery<LessonType>({
    queryKey: ['/api/lesson-types', booking.lessonTypeId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/lesson-types/${booking.lessonTypeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch lesson type details');
      }
      return response.json();
    },
    enabled: !!booking.lessonTypeId,
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, label: string }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      'paid': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Paid' },
      'confirmed': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Confirmed' },
      'completed': { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Completed' },
      'cancelled': { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Cancelled' },
      'no-show': { color: 'bg-red-100 text-red-800 border-red-200', label: 'No Show' },
    };

    const defaultStyle = { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status.charAt(0).toUpperCase() + status.slice(1) };
    const style = statusMap[status] || defaultStyle;

    return (
      <Badge className={`font-medium ${style.color}`} variant="outline">
        {style.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const statusMap: Record<string, { color: string, label: string }> = {
      'unpaid': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Unpaid' },
      'reservation-pending': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Reservation Pending' },
      'reservation-paid': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Reservation Paid' },
      'session-paid': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Session Paid' },
    };

    const defaultStyle = { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status.charAt(0).toUpperCase() + status.slice(1) };
    const style = statusMap[status] || defaultStyle;

    return (
      <Badge className={`font-medium ${style.color}`} variant="outline">
        {style.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      return format(new Date(`${dateString}T12:00:00Z`), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      if (!timeString) return '';
      // Handle time format like "18:00:00"
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      return format(date, 'h:mm a');
    } catch (e) {
      return timeString;
    }
  };

  const getAthletesDisplay = () => {
    if (isLoading || !bookingDetails?.athletes) {
      return <p className="text-sm text-gray-500">Loading athlete information...</p>;
    }

    return (
      <div className="space-y-2">
        {bookingDetails.athletes.map((athlete: Athlete) => (
          <div key={athlete.id} className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{athlete.name || `${athlete.firstName} ${athlete.lastName}`}</span>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-xs">
              {athlete.experience}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  const handleEditSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-blue-900">Booking #{booking.id}</h2>
          <Button onClick={() => setShowEditModal(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Booking
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status and Payment Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Status Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Booking Status</p>
                  {getStatusBadge(booking.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  {getPaymentBadge(booking.paymentStatus)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Attendance Status</p>
                  <Badge className="font-medium bg-gray-100 text-gray-800 border-gray-200" variant="outline">
                    {booking.attendanceStatus.charAt(0).toUpperCase() + booking.attendanceStatus.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Paid Amount</p>
                  <p className="font-medium">${booking.paidAmount}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">Booking Method</p>
                <p className="font-medium">{booking.bookingMethod}</p>
              </div>
            </CardContent>
          </Card>

          {/* Lesson Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Lesson Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Lesson Type</p>
                  <p className="font-medium">{lessonType?.name || 'Loading...'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <p className="font-medium">{lessonType?.durationMinutes || '-'} minutes</p>
                  </div>
                </div>
                              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{booking.preferredDate ? formatDate(booking.preferredDate) : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{booking.preferredTime ? formatTime(booking.preferredTime) : '-'}</p>
              </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">Focus Areas</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {booking.focusAreas && booking.focusAreas.length > 0 ? (
                    booking.focusAreas.map((area, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {area}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No focus areas specified</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Athletes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Athletes
              </CardTitle>
              <CardDescription>
                {isLoading || !bookingDetails?.athletes
                  ? 'Loading...'
                  : `${bookingDetails.athletes.length} athlete${bookingDetails.athletes.length !== 1 ? 's' : ''} assigned`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {getAthletesDisplay()}
            </CardContent>
          </Card>

          {/* Safety Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Safety Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Drop-off Person</p>
                <p className="font-medium">{booking.dropoffPersonName || 'N/A'}</p>
                <p className="text-xs text-gray-500">
                  {booking.dropoffPersonRelationship} • {booking.dropoffPersonPhone}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">Pick-up Person</p>
                <p className="font-medium">{booking.pickupPersonName || 'N/A'}</p>
                <p className="text-xs text-gray-500">
                  {booking.pickupPersonRelationship} • {booking.pickupPersonPhone}
                </p>
              </div>

              {booking.altPickupPersonName && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">Alternative Pick-up Person</p>
                  <p className="font-medium">{booking.altPickupPersonName}</p>
                  <p className="text-xs text-gray-500">
                    {booking.altPickupPersonRelationship} • {booking.altPickupPersonPhone}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Admin Notes</p>
              <div className="bg-amber-50 p-3 rounded-lg min-h-[100px]">
                {booking.adminNotes ? (
                  <p className="text-sm whitespace-pre-wrap">{booking.adminNotes}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No admin notes added</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Special Requests</p>
              <div className="bg-teal-50 p-3 rounded-lg min-h-[100px]">
                {booking.specialRequests ? (
                  <p className="text-sm whitespace-pre-wrap">{booking.specialRequests}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No special requests</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showEditModal && (
        <BookingEditModal
          booking={booking}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
