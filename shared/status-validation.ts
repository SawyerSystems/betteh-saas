import { AttendanceStatusEnum, BookingStatusEnum, PaymentStatusEnum } from "./schema";

/**
 * Status Synchronization Rules for Booking Management
 * 
 * This utility ensures that attendance status, booking status, and payment status
 * are synchronized and follow business logic rules.
 */

export interface BookingStatusState {
  bookingStatus: BookingStatusEnum;
  paymentStatus: PaymentStatusEnum;
  attendanceStatus: AttendanceStatusEnum;
}

export interface StatusValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedChanges?: Partial<BookingStatusState>;
}

/**
 * Determines if a booking should be archived based on its status
 * RULE: Attendance status is the authoritative field for determining booking state
 */
export function isBookingArchived(state: BookingStatusState): boolean {
  const { attendanceStatus } = state;
  
  // Only attendance status determines archival - not booking status or payment status
  const archivedAttendanceStatuses = [
    "completed",
    "no-show",
    "cancelled"
  ];
  
  return archivedAttendanceStatuses.includes(attendanceStatus);
}

/**
 * Determines if a booking is active (should show in active bookings)
 */
export function isBookingActive(state: BookingStatusState): boolean {
  return !isBookingArchived(state);
}

/**
 * Validates if the status combination is logically consistent
 */
export function validateStatusCombination(state: BookingStatusState): StatusValidationResult {
  const { bookingStatus, paymentStatus, attendanceStatus } = state;
  const errors: string[] = [];
  const warnings: string[] = [];
  let suggestedChanges: Partial<BookingStatusState> = {};

  // Rule 1: If attendance is completed, booking should be completed
  if (attendanceStatus === AttendanceStatusEnum.COMPLETED && 
      bookingStatus !== BookingStatusEnum.COMPLETED) {
    errors.push("Booking status should be 'completed' when attendance is 'completed'");
    suggestedChanges.bookingStatus = BookingStatusEnum.COMPLETED;
  }

  // Rule 2: If booking is completed, attendance should be completed
  if (bookingStatus === BookingStatusEnum.COMPLETED && 
      attendanceStatus !== AttendanceStatusEnum.COMPLETED) {
    errors.push("Attendance status should be 'completed' when booking is 'completed'");
    suggestedChanges.attendanceStatus = AttendanceStatusEnum.COMPLETED;
  }

  // Rule 3: If attendance is no-show, booking should be completed (updated logic)
  if (attendanceStatus === AttendanceStatusEnum.NO_SHOW && 
      bookingStatus !== BookingStatusEnum.COMPLETED) {
    errors.push("Booking status should be 'completed' when attendance is 'no-show'");
    suggestedChanges.bookingStatus = BookingStatusEnum.COMPLETED;
  }

  // Rule 4 removed - no-show is now mapped to completed status

  // Rule 5: If attendance is cancelled, booking should be cancelled
  if (attendanceStatus === AttendanceStatusEnum.CANCELLED && 
      bookingStatus !== BookingStatusEnum.CANCELLED) {
    errors.push("Booking status should be 'cancelled' when attendance is 'cancelled'");
    suggestedChanges.bookingStatus = BookingStatusEnum.CANCELLED;
  }

  // Rule 6: If booking is cancelled, attendance should be cancelled
  if (bookingStatus === BookingStatusEnum.CANCELLED && 
      attendanceStatus !== AttendanceStatusEnum.CANCELLED) {
    errors.push("Attendance status should be 'cancelled' when booking is 'cancelled'");
    suggestedChanges.attendanceStatus = AttendanceStatusEnum.CANCELLED;
  }

  // Rule 7: Payment validation for completed bookings
  if (bookingStatus === BookingStatusEnum.COMPLETED || 
      attendanceStatus === AttendanceStatusEnum.COMPLETED) {
    if (paymentStatus === PaymentStatusEnum.UNPAID) {
      warnings.push("Completed booking should typically have payment processed");
    }
  }

  // Rule 8: Session payment should correspond to confirmed/completed status
  if (paymentStatus === PaymentStatusEnum.SESSION_PAID) {
    if (![BookingStatusEnum.CONFIRMED, BookingStatusEnum.COMPLETED].includes(bookingStatus)) {
      warnings.push("Session paid status typically corresponds to confirmed or completed bookings");
    }
  }

  // Rule 9: Cancelled bookings should have appropriate payment status
  if (bookingStatus === BookingStatusEnum.CANCELLED || 
      attendanceStatus === AttendanceStatusEnum.CANCELLED) {
    if ([PaymentStatusEnum.SESSION_PAID, PaymentStatusEnum.RESERVATION_PAID].includes(paymentStatus)) {
      warnings.push("Cancelled bookings may need payment refund consideration");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestedChanges: Object.keys(suggestedChanges).length > 0 ? suggestedChanges : undefined
  };
}

/**
 * Auto-synchronizes status fields to maintain consistency
 */
export function synchronizeStatuses(
  currentState: BookingStatusState,
  changedField: 'bookingStatus' | 'paymentStatus' | 'attendanceStatus',
  newValue: string
): BookingStatusState {
  const newState = { ...currentState };
  
  // Update the changed field
  if (changedField === 'bookingStatus') {
    newState.bookingStatus = newValue as BookingStatusEnum;
  } else if (changedField === 'paymentStatus') {
    newState.paymentStatus = newValue as PaymentStatusEnum;
  } else if (changedField === 'attendanceStatus') {
    newState.attendanceStatus = newValue as AttendanceStatusEnum;
  }

  // Apply synchronization rules based on what changed
  if (changedField === 'attendanceStatus') {
    switch (newValue) {
      case AttendanceStatusEnum.COMPLETED:
        newState.bookingStatus = BookingStatusEnum.COMPLETED;
        break;
      case AttendanceStatusEnum.NO_SHOW:
        newState.bookingStatus = BookingStatusEnum.COMPLETED; // Updated to match new mapping
        break;
      case AttendanceStatusEnum.CANCELLED:
        newState.bookingStatus = BookingStatusEnum.CANCELLED;
        break;
    }
  } else if (changedField === 'bookingStatus') {
    switch (newValue) {
      case BookingStatusEnum.COMPLETED:
        newState.attendanceStatus = AttendanceStatusEnum.COMPLETED;
        break;
      // NO_SHOW case removed - now maps to COMPLETED
      case BookingStatusEnum.CANCELLED:
        newState.attendanceStatus = AttendanceStatusEnum.CANCELLED;
        break;
      case BookingStatusEnum.CONFIRMED:
        if (newState.attendanceStatus === AttendanceStatusEnum.PENDING) {
          newState.attendanceStatus = AttendanceStatusEnum.CONFIRMED;
        }
        break;
    }
  }

  return newState;
}

/**
 * Gets the display category for booking filtering (active vs archived)
 */
export function getBookingCategory(state: BookingStatusState): 'active' | 'archived' {
  return isBookingArchived(state) ? 'archived' : 'active';
}

/**
 * Gets user-friendly status descriptions
 */
export function getStatusDescription(status: string, type: 'booking' | 'payment' | 'attendance'): string {
  const descriptions = {
    booking: {
      [BookingStatusEnum.PENDING]: "Awaiting confirmation",
      [BookingStatusEnum.PAID]: "Payment received",
      [BookingStatusEnum.CONFIRMED]: "Confirmed and scheduled",
      [BookingStatusEnum.COMPLETED]: "Session completed",
      [BookingStatusEnum.FAILED]: "Booking failed",
      [BookingStatusEnum.CANCELLED]: "Booking cancelled",
      // Legacy values as string literals
      'manual': "Manually created",
      'manual-paid': "Manually marked as paid",
      'no-show': "Student did not attend",
    } as Record<string, string>,
    payment: {
      [PaymentStatusEnum.UNPAID]: "No payment received",
      [PaymentStatusEnum.RESERVATION_PENDING]: "Payment processing",
      [PaymentStatusEnum.RESERVATION_PAID]: "Reservation fee paid",
      [PaymentStatusEnum.RESERVATION_FAILED]: "Payment failed",
      [PaymentStatusEnum.SESSION_PAID]: "Full session paid",
      [PaymentStatusEnum.RESERVATION_REFUNDED]: "Reservation refunded",
      [PaymentStatusEnum.SESSION_REFUNDED]: "Session refunded",
    } as Record<string, string>,
    attendance: {
      [AttendanceStatusEnum.PENDING]: "Not yet attended",
      [AttendanceStatusEnum.CONFIRMED]: "Confirmed to attend",
      [AttendanceStatusEnum.COMPLETED]: "Successfully attended",
      [AttendanceStatusEnum.CANCELLED]: "Cancelled attendance",
      [AttendanceStatusEnum.NO_SHOW]: "Did not show up",
      [AttendanceStatusEnum.MANUAL]: "Manually managed",
    } as Record<string, string>
  };

  return descriptions[type][status] || status;
}
