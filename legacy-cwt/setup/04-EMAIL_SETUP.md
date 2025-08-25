# Email System Setup Guide

Complete guide for configuring the email system using Resend for the CoachWillTumbles platform.

## 📧 Email System Overview

The platform uses **Resend** for reliable email delivery with React-based email templates:

### Email Types
- **Authentication**: Magic link codes for parent login
- **Booking Confirmations**: Session confirmations and updates
- **Reminders**: Session reminders and waiver completions
- **Admin Notifications**: New bookings and system alerts
- **Password Management**: Setup and reset emails

## 🚀 Quick Setup

### 1. Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up and verify your account
3. Add your domain (for production)
4. Get your API key from dashboard

### 2. Configure Environment Variables
```bash
# Required environment variables
RESEND_API_KEY=re_your_resend_api_key_here
FROM_EMAIL=noreply@coachwilltumbles.com
SUPPORT_EMAIL=support@coachwilltumbles.com

# Development settings
DEBUG_EMAIL=true  # Logs emails instead of sending
NODE_ENV=development
```

### 3. Domain Setup (Production)
1. **Add Domain in Resend**
   - Go to Domains → Add Domain
   - Enter your domain (e.g., coachwilltumbles.com)

2. **DNS Configuration**
   ```dns
   # Add these DNS records to your domain
   Type: TXT
   Name: @
   Value: resend-verification=your_verification_code

   Type: MX  
   Name: @
   Value: 10 feedback-smtp.us-east-1.amazonses.com
   ```

## 📝 Email Templates

### Available Templates
All templates are in the `emails/` directory using React Email:

#### Authentication Templates
- **`EmailVerification.tsx`** - Parent email verification
- **`PasswordSetupEmail.tsx`** - Password setup for parents
- **`MinimalEmailVerification.tsx`** - Simple verification template

#### Booking Templates  
- **`BookingConfirmation.tsx`** - Session booking confirmation
- **`SessionReminder.tsx`** - Upcoming session reminders
- **`SessionCancellation.tsx`** - Cancellation notifications
- **`RescheduleConfirmation.tsx`** - Reschedule confirmations

#### Administrative Templates
- **`WaiverReminder.tsx`** - Waiver completion reminders
- **`SafetyInformationLink.tsx`** - Safety info delivery
- **`BirthdayEmail.tsx`** - Birthday notifications

### Template Structure
```tsx
// Example template structure
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

export function BookingConfirmation({ 
  parentName, 
  athleteName, 
  sessionDate, 
  sessionTime 
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container>
          <Text>Hi {parentName},</Text>
          <Text>
            Your booking for {athleteName} has been confirmed!
          </Text>
          <Text>
            <strong>Date:</strong> {sessionDate}<br/>
            <strong>Time:</strong> {sessionTime}
          </Text>
          <Button href="https://coachwilltumbles.com/parent/dashboard">
            View Booking Details
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

## 🔧 Email Functions

### Core Email Functions
Located in `server/lib/email.ts`:

```typescript
// Send booking confirmation
export async function sendSessionConfirmation(
  parentEmail: string,
  parentName: string,
  bookingDetails: BookingDetails
): Promise<boolean>

// Send authentication code
export async function sendParentAuthCode(
  email: string,
  name: string,
  code: string
): Promise<boolean>

// Send password setup
export async function sendPasswordSetupEmail(
  email: string,
  name: string,
  setupUrl: string
): Promise<boolean>
```

### Usage Examples
```typescript
// Send booking confirmation
const success = await sendSessionConfirmation(
  'parent@example.com',
  'John Doe',
  {
    athleteName: 'Jane Doe',
    sessionDate: '2025-08-15',
    sessionTime: '10:00 AM',
    lessonType: 'Private Lesson'
  }
);

// Send auth code
const authSent = await sendParentAuthCode(
  'parent@example.com',
  'John Doe',
  '123456'
);
```

## 🛠️ Development Configuration

### Local Development
```bash
# .env settings for development
DEBUG_EMAIL=true
NODE_ENV=development
RESEND_API_KEY=re_your_test_key

# Emails will be logged to console instead of sent
```

### Console Output Example
```
📧 EMAIL DEBUG: Would send email
To: parent@example.com
Subject: Booking Confirmation - Jane Doe
Template: BookingConfirmation
Data: {
  parentName: "John Doe",
  athleteName: "Jane Doe",
  sessionDate: "2025-08-15"
}
```

## 🔒 Security & Best Practices

### Email Security
- **Rate Limiting**: Prevent spam with request limits
- **Token Expiry**: Auth tokens expire in 10 minutes
- **Verified Domains**: Only send from verified domains
- **No Sensitive Data**: Never include passwords in emails

### Error Handling
```typescript
try {
  const result = await sendEmail(template, data);
  if (!result.success) {
    console.error('Email failed:', result.error);
    // Fallback logic here
  }
} catch (error) {
  console.error('Email system error:', error);
  // System notification logic
}
```

## 📊 Monitoring & Analytics

### Email Metrics
Track through Resend dashboard:
- **Delivery Rate**: Emails successfully delivered
- **Open Rate**: Emails opened by recipients  
- **Click Rate**: Links clicked in emails
- **Bounce Rate**: Failed deliveries

### Application Logging
```typescript
// Email events are logged
[EMAIL] Sent booking confirmation to parent@example.com
[EMAIL] Auth code sent to parent@example.com  
[EMAIL] Failed to send reminder: Rate limit exceeded
```

## 🧪 Testing

### Test Email Delivery
```bash
# Test individual email functions
npm run test:email

# Send test emails
curl -X POST http://localhost:5001/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"type":"booking_confirmation","email":"test@example.com"}'
```

### Email Template Testing
```bash
# Preview templates locally
npm run email:preview

# Test template rendering
npm run test:templates
```

## 🚨 Troubleshooting

### Common Issues

#### Emails Not Sending
1. **Check API Key**: Verify `RESEND_API_KEY` is correct
2. **Domain Status**: Ensure domain is verified in Resend
3. **Rate Limits**: Check if hitting Resend limits
4. **DNS Issues**: Verify MX and TXT records

#### Template Errors
1. **Missing Props**: Check all required template props
2. **React Errors**: Validate JSX syntax in templates
3. **Image Issues**: Use absolute URLs for images
4. **Styling**: Inline styles work best in emails

#### Development Issues
```bash
# Check if debug mode is enabled
echo $DEBUG_EMAIL

# Verify email service initialization
grep "Email service" server-logs.txt

# Test Resend connection
curl -X GET https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

### Debug Commands
```typescript
// Test email configuration
await testEmailConfiguration();

// Send test email
await sendTestEmail('your-email@example.com');

// Validate email template
await validateTemplate('BookingConfirmation', sampleData);
```

## 📈 Production Optimization

### Performance Tips
- **Template Caching**: Cache compiled templates
- **Batch Sending**: Group emails when possible
- **Async Processing**: Use background jobs for bulk emails
- **Error Recovery**: Implement retry logic with exponential backoff

### Monitoring Setup
```typescript
// Email delivery monitoring
const emailMetrics = {
  sent: 0,
  failed: 0,
  bounced: 0
};

// Track in application logs
console.log('📊 Email Metrics:', emailMetrics);
```

For more details, see [EMAIL_SYSTEM_GUIDE.md](../EMAIL_SYSTEM_GUIDE.md) and [EMAIL_TESTING_PLAN.md](../EMAIL_TESTING_PLAN.md).
