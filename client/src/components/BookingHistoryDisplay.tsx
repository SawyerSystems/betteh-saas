import { AdminModalSection, AdminModalDetailRow, AdminModalGrid } from "@/components/admin-ui/AdminModal";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    DollarSign,
    FileText,
    MapPin,
    Target,
    User,
    Users,
    XCircle
} from "lucide-react";
import { useState } from "react";

interface BookingDetails {
  id: number;
  lessonTypeName: string;
  preferredDate: string;
  preferredTime: string;
  status: string;
  paymentStatus: string;
  attendanceStatus: string;
  paidAmount: string;
  focusAreas: string[];
  progressNote?: string;
  coachName: string;
  bookingMethod: string;
  specialRequests?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  athleteCount: number;
  otherAthleteNames?: string[];
  // Safety and waiver info
  safetyVerificationSigned: boolean;
  waiverStatus: 'signed' | 'pending' | 'not_required';
  // Pickup/dropoff info
  dropoffPersonName?: string;
  dropoffPersonRelationship?: string;
  pickupPersonName?: string;
  pickupPersonRelationship?: string;
}

interface BookingHistoryDisplayProps {
  athleteId: number;
  fallbackBookings?: any[]; // Fallback bookings from props
}

export function BookingHistoryDisplay({ athleteId, fallbackBookings = [] }: BookingHistoryDisplayProps) {
  const [expandedBookings, setExpandedBookings] = useState<Set<number>>(new Set());

  const toggleBookingExpansion = (bookingId: number) => {
    const newExpanded = new Set(expandedBookings);
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId);
    } else {
      newExpanded.add(bookingId);
    }
    setExpandedBookings(newExpanded);
  };
  const { data: bookingHistory, isLoading, error } = useQuery<BookingDetails[]>({
    queryKey: [`/api/athletes/${athleteId}/booking-history`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/athletes/${athleteId}/booking-history`);
      if (!response.ok) {
        throw new Error('Failed to fetch booking history');
      }
      return response.json();
    },
    retry: 1,
  });

  const bookings = bookingHistory || fallbackBookings;

  if (isLoading) {
    return (
      <AdminModalSection title="Booking History" className="mb-6">
        <div className="flex items-center justify-center py-4">
          <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="animate-spin w-5 h-5" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading booking history...</span>
        </div>
      </AdminModalSection>
    );
  }

  if (error && fallbackBookings.length === 0) {
    return (
      <AdminModalSection title="Booking History" className="mb-6">
        <div className="flex items-center justify-center py-4 text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Unable to load detailed booking history</span>
        </div>
      </AdminModalSection>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'attended':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
      case 'no-show':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'confirmed':
      case 'scheduled':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getPaymentStatusIcon = (paymentStatus: string) => {
    switch (paymentStatus.toLowerCase()) {
      case 'paid':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(`${dateString}T12:00:00Z`).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Handle time format like "14:30:00" or "2:30 PM"
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  return (
    <AdminModalSection title={`Booking History (${bookings.length})`} className="mb-6">
      
      {bookings.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400" role="status">No bookings found for this athlete</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {bookings
            .sort((a, b) => {
              const dateA = new Date(a.preferredDate || a.createdAt).getTime();
              const dateB = new Date(b.preferredDate || b.createdAt).getTime();
              return dateB - dateA; // Most recent first
            })
            .map((booking) => {
              const isExpanded = expandedBookings.has(booking.id);
              
              return (
                <div 
                  key={booking.id} 
                  className="border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  role="article" 
                  aria-label={`Booking ${booking.id}`}
                >
                  {/* Condensed header - always visible */}
                  <div 
                    className="p-3 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleBookingExpansion(booking.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleBookingExpansion(booking.id);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* Expand/collapse icon */}
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                      
                      {/* Date and time */}
                      <div className="flex items-center space-x-2 text-sm text-gray-600 flex-shrink-0">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">
                          {formatDate(booking.preferredDate)}
                        </span>
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatTime(booking.preferredTime)}
                        </span>
                      </div>
                      
                      {/* Lesson type */}
                      <div className="flex items-center space-x-1 min-w-0 flex-1">
                        <Target className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {booking.lessonTypeName || 'Gymnastics Session'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status indicators */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {/* Payment status */}
                      <div className="flex items-center space-x-1">
                        {getPaymentStatusIcon(booking.paymentStatus)}
                        {(() => {
                          const status = (booking.paymentStatus || '').toLowerCase();
                          let amount = booking.paidAmount;
                          // If server didn’t compute it, fallback logic
                          if (!amount || amount === '0.00') {
                            const anyPrice = (booking as any).lessonTypeTotalPrice || (booking as any).lesson_types?.total_price;
                            const anyFee = (booking as any).lessonTypeReservationFee || (booking as any).lesson_types?.reservation_fee;
                            if (status.includes('reservation') && status.includes('paid') && anyFee) amount = String(anyFee);
                            if (status.includes('session') && status.includes('paid') && anyPrice) amount = String(anyPrice);
                          }
                          return amount ? (
                            <span className="text-xs text-gray-600 dark:text-gray-400">${amount}</span>
                          ) : null;
                        })()}
                      </div>
                      
                      {/* Booking status */}
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(booking.attendanceStatus || booking.status)}
                        <span className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
                          {booking.attendanceStatus || booking.status}
                        </span>
                      </div>
                      
                      {/* Multi-athlete indicator */}
                      {booking.athleteCount > 1 && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                            {booking.athleteCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded details - only visible when expanded */}
                  {isExpanded && (
                    <div className="px-6 pb-4 border-t border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="pt-3 space-y-3">
                        {/* Basic details grid */}
                        <AdminModalGrid cols={2}>
                          {/* Coach info */}
                          <AdminModalDetailRow
                            label="Coach"
                            value={booking.coachName || 'Coach Will'}
                            icon={<User className="w-4 h-4" />}
                          />

                          {/* Booking method */}
                          <AdminModalDetailRow
                            label="Booking Method"
                            value={booking.bookingMethod}
                            icon={<MapPin className="w-4 h-4" />}
                          />

                          {/* Payment details */}
                          <AdminModalDetailRow
                            label="Payment Status"
                            value={(() => {
                              const status = (booking.paymentStatus || '').toLowerCase();
                              let amount = booking.paidAmount;
                              if (!amount || amount === '0.00') {
                                const anyPrice = (booking as any).lessonTypeTotalPrice || (booking as any).lesson_types?.total_price;
                                const anyFee = (booking as any).lessonTypeReservationFee || (booking as any).lesson_types?.reservation_fee;
                                if (status.includes('reservation') && status.includes('paid') && anyFee) amount = String(anyFee);
                                if (status.includes('session') && status.includes('paid') && anyPrice) amount = String(anyPrice);
                              }
                              return `${booking.paymentStatus}${amount ? ` - $${amount}` : ''}`;
                            })()}
                            icon={<DollarSign className="w-4 h-4" />}
                          />

                          {/* Attendance status */}
                          {booking.attendanceStatus && booking.attendanceStatus !== 'pending' && (
                            <AdminModalDetailRow
                              label="Attendance"
                              value={booking.attendanceStatus}
                              icon={getStatusIcon(booking.attendanceStatus)}
                            />
                          )}
                        </AdminModalGrid>

                        {/* Focus Areas */}
                        {booking.focusAreas && booking.focusAreas.length > 0 && (
                          <div>
                            <div className="flex items-center mb-2">
                              <Target className="w-4 h-4 text-orange-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Focus Areas:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {booking.focusAreas.map((area: string, index: number) => (
                                <span 
                                  key={index}
                                  className="inline-block bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs px-2 py-1 rounded-full"
                                >
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Progress note */}
                        {booking.progressNote && (
                          <div>
                            <div className="flex items-center mb-2">
                              <FileText className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Progress Note:</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-green-50/50 dark:bg-green-900/20 p-2 rounded border border-green-200/50 dark:border-green-800/30">
                              {booking.progressNote}
                            </p>
                          </div>
                        )}

                        {/* Special requests */}
                        {booking.specialRequests && (
                          <div>
                            <div className="flex items-center mb-2">
                              <AlertCircle className="w-4 h-4 text-blue-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Special Requests:</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50/50 dark:bg-blue-900/20 p-2 rounded border border-blue-200/50 dark:border-blue-800/30">
                              {booking.specialRequests}
                            </p>
                          </div>
                        )}

                        {/* Progress note */}
                        {booking.progressNote && (
                          <div>
                            <div className="flex items-center mb-2">
                              <FileText className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Progress Note:</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-green-50/50 dark:bg-green-900/20 p-2 rounded border border-green-200/50 dark:border-green-800/30">
                              {booking.progressNote}
                            </p>
                          </div>
                        )}

                        {/* Special requests */}
                        {booking.specialRequests && (
                          <div>
                            <div className="flex items-center mb-2">
                              <AlertCircle className="w-4 h-4 text-blue-500 mr-1" />
                              <span className="text-sm font-medium">Special Requests:</span>
                            </div>
                            <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                              {booking.specialRequests}
                            </p>
                          </div>
                        )}

                        {/* Admin notes */}
                        {booking.adminNotes && (
                          <div>
                            <div className="flex items-center mb-2">
                              <AlertCircle className="w-4 h-4 text-purple-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Admin Notes:</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-purple-50/50 dark:bg-purple-900/20 p-2 rounded border border-purple-200/50 dark:border-purple-800/30">
                              {booking.adminNotes}
                            </p>
                          </div>
                        )}

                        {/* Pickup/Dropoff info */}
                        {(booking.dropoffPersonName || booking.pickupPersonName) && (
                          <div>
                            <div className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Transportation:</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-800/50 p-2 rounded border border-gray-200/50 dark:border-gray-700/50 space-y-1">
                              {booking.dropoffPersonName && (
                                <div>
                                  <span className="font-medium">Drop-off:</span> {booking.dropoffPersonName}
                                  {booking.dropoffPersonRelationship && ` (${booking.dropoffPersonRelationship})`}
                                </div>
                              )}
                              {booking.pickupPersonName && (
                                <div>
                                  <span className="font-medium">Pick-up:</span> {booking.pickupPersonName}
                                  {booking.pickupPersonRelationship && ` (${booking.pickupPersonRelationship})`}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Footer with safety and booking info */}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-slate-200 dark:border-slate-600 pt-2 mt-3">
                          <div className="flex items-center space-x-4">
                            {booking.safetyVerificationSigned && (
                              <div className="flex items-center text-green-600 dark:text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Safety Verified
                              </div>
                            )}
                            {booking.waiverStatus === 'signed' && (
                              <div className="flex items-center text-green-600 dark:text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Waiver Signed
                              </div>
                            )}
                          </div>
                          <div>
                            Booked: {formatDate(booking.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </AdminModalSection>
  );
}
