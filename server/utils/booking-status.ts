import { BookingStatusEnum } from "../../shared/schema";

/**
 * Determines a booking's status based on payment and attendance status
 * 
 * @param paymentStatus Current payment status
 * @param attendanceStatus Current attendance status
 * @returns Appropriate booking status
 */
export function determineBookingStatus(paymentStatus: string, attendanceStatus: string): BookingStatusEnum {
  // Handle all lowercase and case-sensitive variations
  const payment = paymentStatus.toLowerCase();
  const attendance = attendanceStatus.toLowerCase();

  // Handle reservation failures
  if (payment === 'reservation-failed') {
    return BookingStatusEnum.FAILED;
  }

  // Handle cancellations and refunds
  if (payment === 'reservation-refunded' || payment === 'session-refunded' || attendance === 'cancelled') {
    return BookingStatusEnum.CANCELLED;
  }

  // Handle completed sessions
  if (attendance === 'completed') {
    return BookingStatusEnum.COMPLETED;
  }

  // Handle no-shows (treated as completed for status simplification)
  if (attendance === 'no-show') {
    return BookingStatusEnum.COMPLETED; // Changed from no-show to completed
  }

  // Handle confirmed sessions
  if (attendance === 'confirmed') {
    if (payment === 'reservation-paid' || payment === 'session-paid') {
      return BookingStatusEnum.CONFIRMED;
    }
    return BookingStatusEnum.CONFIRMED;
  }

  // Handle paid but not yet confirmed
  if (payment === 'reservation-paid' || payment === 'session-paid') {
    return BookingStatusEnum.PAID;
  }

  // Handle manual entries (map to pending/confirmed based on payment status)
  if (attendance === 'manual') {
    if (payment === 'reservation-paid' || payment === 'session-paid') {
      return BookingStatusEnum.CONFIRMED; // Changed from manual-paid to confirmed
    }
    return BookingStatusEnum.PENDING; // Changed from manual to pending
  }

  // Default case
  return BookingStatusEnum.PENDING;
}
