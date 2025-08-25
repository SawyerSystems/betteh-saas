/**
 * Payment Sync Test - Verify proper payment status flow
 * 
 * This test verifies that:
 * 1. Completed Stripe checkout only sets booking to 'reservation-paid'
 * 2. 'session-paid' is only applied after attendance is marked 'completed'
 */

const { BookingStatusEnum, PaymentStatusEnum, AttendanceStatusEnum } = require('../shared/schema');

describe('Payment Sync Flow', () => {
  let storage;
  let testBookingId;
  
  beforeEach(async () => {
    // Mock storage implementation or use test database
    const { MockStorage } = require('./mocks/mock-storage');
    storage = new MockStorage();
    
    // Create a test booking with Stripe session
    testBookingId = await storage.createBooking({
      parentId: 1,
      lessonTypeId: 1,
      weekday: 'monday',
      preferredTime: '10:00',
      preferredDate: '2025-08-10',
      status: BookingStatusEnum.PENDING,
      paymentStatus: PaymentStatusEnum.RESERVATION_PENDING,
      stripeSessionId: 'test_session_123',
      attendanceStatus: AttendanceStatusEnum.CONFIRMED
    });
  });

  test('Completed Stripe session should only set reservation-paid status', async () => {
    // Mock Stripe session as completed
    const mockStripeSession = {
      id: 'test_session_123',
      status: 'complete',
      payment_status: 'paid'
    };
    
    // Mock Stripe client
    const mockStripeClient = {
      checkout: {
        sessions: {
          retrieve: jest.fn().mockResolvedValue(mockStripeSession)
        }
      }
    };
    
    // Inject mock Stripe client
    storage.setStripeClient(mockStripeClient);
    
    // Run payment sync
    await storage.syncBookingPaymentStatus();
    
    // Verify booking is only set to reservation-paid (not session-paid)
    const updatedBooking = await storage.getBooking(testBookingId);
    
    expect(updatedBooking.paymentStatus).toBe(PaymentStatusEnum.RESERVATION_PAID);
    expect(updatedBooking.status).toBe(BookingStatusEnum.PENDING);
    expect(updatedBooking.attendanceStatus).toBe(AttendanceStatusEnum.CONFIRMED);
    
    // Verify it's NOT session-paid yet
    expect(updatedBooking.paymentStatus).not.toBe(PaymentStatusEnum.SESSION_PAID);
    expect(updatedBooking.status).not.toBe(BookingStatusEnum.CONFIRMED);
  });

  test('Session-paid should only be set after attendance is completed', async () => {
    // Set up booking with reservation-paid status
    await storage.updateBookingPaymentStatus(testBookingId, PaymentStatusEnum.RESERVATION_PAID);
    
    // Verify initial state
    let booking = await storage.getBooking(testBookingId);
    expect(booking.paymentStatus).toBe(PaymentStatusEnum.RESERVATION_PAID);
    expect(booking.attendanceStatus).toBe(AttendanceStatusEnum.CONFIRMED);
    
    // Mark attendance as completed
    await storage.updateBookingAttendanceStatus(testBookingId, AttendanceStatusEnum.COMPLETED);
    
    // Verify payment status is upgraded to session-paid
    booking = await storage.getBooking(testBookingId);
    expect(booking.paymentStatus).toBe(PaymentStatusEnum.SESSION_PAID);
    expect(booking.attendanceStatus).toBe(AttendanceStatusEnum.COMPLETED);
  });

  test('Session-paid should not be set if attendance is not completed', async () => {
    // Set up booking with reservation-paid status
    await storage.updateBookingPaymentStatus(testBookingId, PaymentStatusEnum.RESERVATION_PAID);
    
    // Mark attendance as no-show (not completed)
    await storage.updateBookingAttendanceStatus(testBookingId, AttendanceStatusEnum.NO_SHOW);
    
    // Verify payment status remains reservation-paid
    const booking = await storage.getBooking(testBookingId);
    expect(booking.paymentStatus).toBe(PaymentStatusEnum.RESERVATION_PAID);
    expect(booking.paymentStatus).not.toBe(PaymentStatusEnum.SESSION_PAID);
    expect(booking.attendanceStatus).toBe(AttendanceStatusEnum.NO_SHOW);
  });

  test('Integration: Full payment flow from Stripe to completion', async () => {
    // 1. Initial state: pending reservation
    let booking = await storage.getBooking(testBookingId);
    expect(booking.paymentStatus).toBe(PaymentStatusEnum.RESERVATION_PENDING);
    expect(booking.status).toBe(BookingStatusEnum.PENDING);
    
    // 2. Mock Stripe payment completion
    const mockStripeSession = {
      id: 'test_session_123',
      status: 'complete',
      payment_status: 'paid'
    };
    
    const mockStripeClient = {
      checkout: {
        sessions: {
          retrieve: jest.fn().mockResolvedValue(mockStripeSession)
        }
      }
    };
    
    storage.setStripeClient(mockStripeClient);
    
    // 3. Run payment sync - should only set reservation-paid
    await storage.syncBookingPaymentStatus();
    
    booking = await storage.getBooking(testBookingId);
    expect(booking.paymentStatus).toBe(PaymentStatusEnum.RESERVATION_PAID);
    expect(booking.status).toBe(BookingStatusEnum.PENDING);
    expect(booking.paymentStatus).not.toBe(PaymentStatusEnum.SESSION_PAID);
    
    // 4. Mark attendance as completed - should upgrade to session-paid
    await storage.updateBookingAttendanceStatus(testBookingId, AttendanceStatusEnum.COMPLETED);
    
    booking = await storage.getBooking(testBookingId);
    expect(booking.paymentStatus).toBe(PaymentStatusEnum.SESSION_PAID);
    expect(booking.attendanceStatus).toBe(AttendanceStatusEnum.COMPLETED);
  });
});
