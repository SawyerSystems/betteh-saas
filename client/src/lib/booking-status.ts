import { AttendanceStatusEnum, BookingStatusEnum, PaymentStatusEnum } from '@shared/schema';

/**
 * Determines a booking's status based on payment and attendance status
 * 
 * @param paymentStatus Current payment status
 * @param attendanceStatus Current attendance status
 * @returns Appropriate booking status
 */
export function determineBookingStatus(
  paymentStatus: string, 
  attendanceStatus: string
): string {
  // Convert to lowercase to ensure case-insensitive comparison
  const payment = paymentStatus.toLowerCase();
  const attendance = attendanceStatus.toLowerCase();

  // Handle reservation failures
  if (payment === PaymentStatusEnum.RESERVATION_FAILED.toLowerCase()) {
    return BookingStatusEnum.FAILED;
  }

  // Handle cancellations and refunds
  if (payment === PaymentStatusEnum.RESERVATION_REFUNDED.toLowerCase() || 
      payment === PaymentStatusEnum.SESSION_REFUNDED.toLowerCase() || 
      attendance === AttendanceStatusEnum.CANCELLED.toLowerCase()) {
    return BookingStatusEnum.CANCELLED;
  }

  // Handle completed sessions
  if (attendance === AttendanceStatusEnum.COMPLETED.toLowerCase()) {
    if (payment === PaymentStatusEnum.SESSION_PAID.toLowerCase()) {
      return BookingStatusEnum.COMPLETED;
    }
    // If completed but not paid
    return BookingStatusEnum.COMPLETED;
  }

  // Handle no-shows (treated as completed for status simplification)
  if (attendance === AttendanceStatusEnum.NO_SHOW.toLowerCase()) {
    return BookingStatusEnum.COMPLETED; // Changed from NO_SHOW to COMPLETED
  }

  // Handle confirmed sessions
  if (attendance === AttendanceStatusEnum.CONFIRMED.toLowerCase()) {
    if ([PaymentStatusEnum.RESERVATION_PAID.toLowerCase(), PaymentStatusEnum.SESSION_PAID.toLowerCase()].includes(payment)) {
      return BookingStatusEnum.CONFIRMED;
    }
    return BookingStatusEnum.CONFIRMED;
  }

  // Handle paid but not yet confirmed
  if ([PaymentStatusEnum.RESERVATION_PAID.toLowerCase(), PaymentStatusEnum.SESSION_PAID.toLowerCase()].includes(payment)) {
    return BookingStatusEnum.PAID;
  }

  // Handle manual entries (map to pending/confirmed based on payment status)
  if (attendance === AttendanceStatusEnum.MANUAL.toLowerCase()) {
    if ([PaymentStatusEnum.RESERVATION_PAID.toLowerCase(), PaymentStatusEnum.SESSION_PAID.toLowerCase()].includes(payment)) {
      return BookingStatusEnum.CONFIRMED; // Changed from MANUAL_PAID to CONFIRMED
    }
    return BookingStatusEnum.PENDING; // Changed from MANUAL to PENDING
  }

  // Default case
  return BookingStatusEnum.PENDING;
}

/**
 * Gets a user-friendly description of a booking status for tooltips
 * 
 * @param bookingStatus The booking status
 * @param paymentStatus The payment status
 * @param attendanceStatus The attendance status
 * @returns A human-readable explanation of the booking status
 */
export function getBookingStatusDescription(
  bookingStatus: string,
  paymentStatus: string,
  attendanceStatus: string
): string {
  switch (bookingStatus.toLowerCase()) {
    case BookingStatusEnum.PENDING.toLowerCase():
      return "This booking is awaiting payment and confirmation.";
    
    case BookingStatusEnum.PAID.toLowerCase():
      return "Payment has been received but the session is not yet confirmed.";
    
    case BookingStatusEnum.CONFIRMED.toLowerCase():
      return "This session is confirmed and ready to take place.";
    
    case BookingStatusEnum.COMPLETED.toLowerCase():
      return "This session has been completed successfully.";
    
    case BookingStatusEnum.CANCELLED.toLowerCase():
      return `This booking was cancelled. ${paymentStatus.includes('refunded') ? 'A refund has been issued.' : ''}`;
    
    case BookingStatusEnum.FAILED.toLowerCase():
      return "The payment for this booking failed.";
    
    // Legacy status handling
    case "no-show":
      return "The athlete did not attend this scheduled session.";
    
    case "manual":
    case "manual-paid":
      return "This booking was manually entered by an administrator.";
    
    default:
      return "Current status based on payment and attendance information.";
  }
}

/**
 * Gets color styling for a booking status badge
 * 
 * @param status The booking status
 * @returns CSS class name(s) for the badge
 */
export function getBookingStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case BookingStatusEnum.PENDING.toLowerCase():
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    
    case BookingStatusEnum.PAID.toLowerCase():
      return "bg-blue-100 text-blue-800 border-blue-200";
    
    case BookingStatusEnum.CONFIRMED.toLowerCase():
      return "bg-green-100 text-green-800 border-green-200";
    
    case BookingStatusEnum.COMPLETED.toLowerCase():
      return "bg-teal-100 text-teal-800 border-teal-200";
    
    case BookingStatusEnum.CANCELLED.toLowerCase():
      return "bg-red-100 text-red-800 border-red-200";
    
    case BookingStatusEnum.FAILED.toLowerCase():
      return "bg-red-100 text-red-800 border-red-200";
    
    // Legacy status handling
    case "no-show":
      return "bg-orange-100 text-orange-800 border-orange-200";
    
    case "manual":
      return "bg-purple-100 text-purple-800 border-purple-200";
    
    case "manual-paid":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}
