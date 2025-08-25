# Email System Guide for Coach Will Tumbles

## Overview

This guide explains the email system in Coach Will Tumbles, including:

1. All automatic email types and when they're triggered
2. How to test that emails are sending correctly
3. Common issues and how to fix them

## Email Types and Triggers

| Email Type | Function | Trigger Event | Content |
|------------|----------|---------------|---------|
| Session Confirmation | `sendSessionConfirmation` | - Payment completed<br>- Admin creates booking | Confirms lesson booking with parent and athlete name, date, time |
| Manual Booking Confirmation | `sendManualBookingConfirmation` | Admin creates booking manually | Similar to session confirmation but with admin context |
| Reschedule Confirmation | `sendRescheduleConfirmation` | Booking date/time changed | Notifies of new date and time for rescheduled session |
| Waiver Reminder | `sendWaiverReminder` | - Admin sends reminder<br>- Automatic reminders | Reminds parents to complete waiver for athlete |
| Session Reminder | `sendSessionReminder` | - 24hr before session<br>- Automatic daily check | Reminds about upcoming session |
| Session Cancellation | `sendSessionCancellation` | Session canceled by admin | Notifies of cancellation |
| Session Follow-up | `sendSessionFollowUp` | After session completion | Asks for feedback, provides tips |
| Birthday Email | `sendBirthdayEmail` | On athlete's birthday | Birthday wishes |
| New Tip/Blog Notification | `sendNewTipOrBlogNotification` | New tip/blog posted | Notifies subscribed parents |
| Reservation Payment Link | `sendReservationPaymentLink` | Reservation created | Payment link for reservation |
| Waiver Completion Link | `sendWaiverCompletionLink` | When waiver needs signing | Link to complete waiver |
| Safety Information Link | `sendSafetyInformationLink` | New safety forms | Link to complete safety form |
| Signed Waiver Confirmation | `sendSignedWaiverConfirmation` | Waiver signed | Confirmation of signed waiver |
| Parent Auth Code | `sendParentAuthCode` | Parent login attempt | Login verification code |

## Testing Email Functionality

We've created a comprehensive test script (`test-email-functionality.js`) that verifies all critical email sending functions. This script:

1. Tests Session Confirmation Email
2. Tests Reschedule Confirmation Email (this was the one that was fixed)
3. Tests Waiver Reminder Email
4. Tests Session Reminder Email
5. Tests Birthday Email
6. Tests Reservation Payment Link Email

### Running the Email Test Suite

```bash
# Make sure the development server is running first
node Tests/test-email-functionality.js
```

The script will:
1. Login as an admin to get proper authentication
2. Test each email type and report success/failure
3. Provide a summary of results

### Manual Testing of Individual Emails

If you need to test a specific email type manually, you can use these methods:

#### Session Confirmation
```bash
curl -X POST http://localhost:5001/api/test-email-thomas -H "Cookie: YOUR_ADMIN_COOKIE"
```

#### Reschedule Confirmation
```bash
curl -X PATCH http://localhost:5001/api/bookings/127 \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_ADMIN_COOKIE" \
  -d '{"preferredDate":"2025-10-20","preferredTime":"17:00:00"}'
```

#### Session Reminder (Trigger the cron job)
```bash
curl -X POST http://localhost:5001/api/admin/trigger-session-reminders \
  -H "Cookie: YOUR_ADMIN_COOKIE"
```

## Common Issues and Solutions

### 1. Missing Parent Email

**Problem:** Email sending fails because parent email can't be found.

**Solution:** 
- Always handle null/undefined `parentId` values with conditional checks
- Verify parent email exists before attempting to send
- Add proper logging to debug email sending issues

```typescript
// Correct pattern for sending emails with parent data
const parentData = bookingData.parentId ? await storage.getParentById(bookingData.parentId) : null;
if (parentData?.email) {
  await sendEmailFunction(parentData.email, otherParams);
} else {
  console.log(`No parent email found for parentId: ${bookingData.parentId}`);
}
```

### 2. Wrong Method Name

**Problem:** Using incorrect method names like `getParent` instead of `getParentById`.

**Solution:** 
- Always use TypeScript to catch these errors
- Run `npm run check` to validate types before testing
- Use code completion in your IDE to prevent mistakes

### 3. Email Template Issues

**Problem:** Email templates have missing or incorrectly formatted variables.

**Solution:**
- Test templates with sample data
- Use React Email's preview feature to check formatting
- Verify that all required data is passed to templates

## Monitoring Email Deliveries

For production, you can monitor email deliveries through the Resend dashboard. Key metrics to watch:

- Delivery rate (should be >99%)
- Open rate 
- Bounce rate (should be <1%)
- Complaints

## Recent Fix: Reschedule Email

We recently fixed an issue where reschedule confirmation emails weren't being sent. The problem was:

1. Using incorrect method name `getParent` instead of `getParentById`
2. Not handling the case where `parentId` could be null

The fix applied was:

```typescript
// Before (with bug):
const parentData = await storage.getParent(updatedBooking.parentId);

// After (fixed):
const parentData = updatedBooking.parentId ? await storage.getParentById(updatedBooking.parentId) : null;
```

This fix ensures all reschedule emails now send correctly.
