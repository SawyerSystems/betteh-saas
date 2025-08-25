require('dotenv').config();

// Define the enums directly in the test script to avoid import issues
const PaymentStatusEnum = {
  UNPAID: "unpaid",
  RESERVATION_PENDING: "reservation-pending",
  RESERVATION_PAID: "reservation-paid",
  RESERVATION_FAILED: "reservation-failed",
  SESSION_PAID: "session-paid",
  RESERVATION_REFUNDED: "reservation-refunded",
  SESSION_REFUNDED: "session-refunded"
};

const AttendanceStatusEnum = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show",
  MANUAL: "manual"
};

// Import the server-side booking status utility
const { determineBookingStatus } = require('./server/utils/booking-status');

// Test cases that should validate all possible combinations
const testCases = [
  // Test Case 1: Default state
  {
    paymentStatus: PaymentStatusEnum.UNPAID,
    attendanceStatus: AttendanceStatusEnum.PENDING,
    expectedStatus: 'pending',
    description: 'New booking (unpaid, pending)'
  },
  
  // Test Case 2: Payment received but not yet confirmed
  {
    paymentStatus: PaymentStatusEnum.RESERVATION_PAID,
    attendanceStatus: AttendanceStatusEnum.PENDING,
    expectedStatus: 'paid',
    description: 'Payment received (reservation paid, pending)'
  },
  
  // Test Case 3: Payment received and confirmed
  {
    paymentStatus: PaymentStatusEnum.SESSION_PAID,
    attendanceStatus: AttendanceStatusEnum.CONFIRMED,
    expectedStatus: 'confirmed',
    description: 'Confirmed booking (session paid, confirmed)'
  },
  
  // Test Case 4: Completed session
  {
    paymentStatus: PaymentStatusEnum.SESSION_PAID,
    attendanceStatus: AttendanceStatusEnum.COMPLETED,
    expectedStatus: 'completed',
    description: 'Completed session (session paid, completed)'
  },
  
  // Test Case 5: Cancelled booking
  {
    paymentStatus: PaymentStatusEnum.SESSION_REFUNDED,
    attendanceStatus: AttendanceStatusEnum.CANCELLED,
    expectedStatus: 'cancelled',
    description: 'Cancelled booking (session refunded, cancelled)'
  },
  
  // Test Case 6: Failed payment
  {
    paymentStatus: PaymentStatusEnum.RESERVATION_FAILED,
    attendanceStatus: AttendanceStatusEnum.PENDING,
    expectedStatus: 'failed',
    description: 'Failed payment (reservation failed, pending)'
  },
  
  // Test Case 7: No-show (should be mapped to completed)
  {
    paymentStatus: PaymentStatusEnum.SESSION_PAID,
    attendanceStatus: AttendanceStatusEnum.NO_SHOW,
    expectedStatus: 'completed',
    description: 'No-show (session paid, no-show)'
  },
  
  // Test Case 8: Manual entry (should be mapped to pending)
  {
    paymentStatus: PaymentStatusEnum.UNPAID,
    attendanceStatus: AttendanceStatusEnum.MANUAL,
    expectedStatus: 'pending',
    description: 'Manual entry (unpaid, manual)'
  },
  
  // Test Case 9: Manual entry with payment (should be mapped to confirmed)
  {
    paymentStatus: PaymentStatusEnum.SESSION_PAID,
    attendanceStatus: AttendanceStatusEnum.MANUAL,
    expectedStatus: 'confirmed',
    description: 'Manual entry with payment (session paid, manual)'
  }
];

// Run the tests
console.log('🧪 Testing Booking Status Derivation Logic\n');

let passCount = 0;
let failCount = 0;

testCases.forEach((test, index) => {
  const { paymentStatus, attendanceStatus, expectedStatus, description } = test;
  
  // Calculate the derived status
  const actualStatus = determineBookingStatus(paymentStatus, attendanceStatus);
  
  // Check if the test passed
  const passed = actualStatus === expectedStatus;
  
  if (passed) {
    passCount++;
    console.log(`✅ Test ${index + 1}: ${description}`);
    console.log(`   Payment: ${paymentStatus}, Attendance: ${attendanceStatus} => Status: ${actualStatus}\n`);
  } else {
    failCount++;
    console.log(`❌ Test ${index + 1}: ${description}`);
    console.log(`   Payment: ${paymentStatus}, Attendance: ${attendanceStatus}`);
    console.log(`   Expected: ${expectedStatus}, Actual: ${actualStatus}\n`);
  }
});

// Summary
console.log(`\n📊 Test Summary: ${passCount} passed, ${failCount} failed (${testCases.length} total)`);

if (failCount === 0) {
  console.log('🎉 All tests passed! The booking status derivation logic is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Please review the logic in determineBookingStatus function.');
}
