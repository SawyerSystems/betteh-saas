require('dotenv').config();

async function testStatusValidation() {
  console.log('🧪 Testing booking status validation and synchronization...\n');
  
  // Import the validation functions
  const {
    validateStatusCombination,
    synchronizeStatuses,
    isBookingArchived,
    isBookingActive,
    getBookingCategory,
    getStatusDescription
  } = require('./shared/status-validation');
  
  const { BookingStatusEnum, PaymentStatusEnum, AttendanceStatusEnum } = require('./shared/schema');
  
  // Test case 1: Valid pending booking
  console.log('📋 Test 1: Valid pending booking');
  const pendingBooking = {
    bookingStatus: BookingStatusEnum.PENDING,
    paymentStatus: PaymentStatusEnum.UNPAID,
    attendanceStatus: AttendanceStatusEnum.PENDING
  };
  
  const validation1 = validateStatusCombination(pendingBooking);
  console.log('  Status:', pendingBooking);
  console.log('  Valid:', validation1.isValid);
  console.log('  Category:', getBookingCategory(pendingBooking));
  console.log('  Is Active:', isBookingActive(pendingBooking));
  console.log('');
  
  // Test case 2: Invalid combination - completed attendance but pending booking
  console.log('📋 Test 2: Invalid combination - completed attendance but pending booking');
  const invalidBooking = {
    bookingStatus: BookingStatusEnum.PENDING,
    paymentStatus: PaymentStatusEnum.SESSION_PAID,
    attendanceStatus: AttendanceStatusEnum.COMPLETED
  };
  
  const validation2 = validateStatusCombination(invalidBooking);
  console.log('  Status:', invalidBooking);
  console.log('  Valid:', validation2.isValid);
  console.log('  Errors:', validation2.errors);
  console.log('  Suggested changes:', validation2.suggestedChanges);
  console.log('');
  
  // Test case 3: Auto-synchronization when attendance is marked completed
  console.log('📋 Test 3: Auto-synchronization when attendance is marked completed');
  const syncedBooking = synchronizeStatuses(
    pendingBooking,
    'attendanceStatus',
    AttendanceStatusEnum.COMPLETED
  );
  console.log('  Original:', pendingBooking);
  console.log('  After sync:', syncedBooking);
  console.log('  Category after sync:', getBookingCategory(syncedBooking));
  console.log('  Is Archived:', isBookingArchived(syncedBooking));
  console.log('');
  
  // Test case 4: Status descriptions
  console.log('📋 Test 4: Status descriptions');
  console.log('  Booking "pending":', getStatusDescription('pending', 'booking'));
  console.log('  Payment "session-paid":', getStatusDescription('session-paid', 'payment'));
  console.log('  Attendance "completed":', getStatusDescription('completed', 'attendance'));
  console.log('');
  
  // Test case 5: Cancelled booking with payment
  console.log('📋 Test 5: Cancelled booking with payment (should warn about refund)');
  const cancelledBooking = {
    bookingStatus: BookingStatusEnum.CANCELLED,
    paymentStatus: PaymentStatusEnum.SESSION_PAID,
    attendanceStatus: AttendanceStatusEnum.CANCELLED
  };
  
  const validation5 = validateStatusCombination(cancelledBooking);
  console.log('  Status:', cancelledBooking);
  console.log('  Valid:', validation5.isValid);
  console.log('  Warnings:', validation5.warnings);
  console.log('  Category:', getBookingCategory(cancelledBooking));
  
  console.log('\\n✅ Status validation tests complete!');
}

testStatusValidation().catch(console.error);
