# Payment System Setup Guide

Complete guide for configuring Stripe payment processing for the CoachWillTumbles platform.

## 💳 Payment System Overview

The platform uses **Stripe** for secure payment processing with the following features:
- **Checkout Sessions**: Secure hosted payment pages
- **Webhook Integration**: Automatic booking confirmation
- **Multiple Payment Methods**: Cards, digital wallets, etc.
- **Test/Live Modes**: Safe testing environment

## 🚀 Quick Setup

### 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create account
2. Complete business verification
3. Get your API keys from the dashboard
4. Set up webhook endpoint

### 2. Configure Environment Variables
```bash
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here    # Test mode
STRIPE_SECRET_KEY=sk_test_your_secret_key_here             # Test mode
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# For production, use live keys:
# STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
# STRIPE_SECRET_KEY=sk_live_your_live_key_here
```

### 3. Webhook Setup
1. **Create Webhook in Stripe Dashboard**
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-app.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`

2. **Get Webhook Secret**
   - Copy the webhook signing secret
   - Add to environment variables

## 🔧 Payment Flow Configuration

### Lesson Types & Pricing
The system supports multiple lesson types with different pricing:

```typescript
// Example lesson types (configured in database)
const LESSON_TYPES = [
  {
    id: 1,
    name: "Private Lesson (1 hour)",
    duration: 60,
    price: 75.00,
    max_athletes: 1
  },
  {
    id: 2, 
    name: "Group Lesson (1 hour)",
    duration: 60,
    price: 45.00,
    max_athletes: 4
  },
  {
    id: 3,
    name: "Assessment Session",
    duration: 30,
    price: 25.00,
    max_athletes: 1
  }
];
```

### Payment Process
1. **Customer Books**: Selects lesson type and date
2. **Stripe Checkout**: Redirected to secure payment page
3. **Payment Success**: Webhook confirms payment
4. **Booking Confirmed**: Email sent, status updated
5. **Parent Account**: Created automatically

## 💻 Frontend Integration

### Payment Step Component
Located in `client/src/components/booking-steps/PaymentStep.tsx`:

```typescript
const handlePayment = async () => {
  try {
    const response = await apiRequest('POST', '/api/create-checkout-session', {
      bookingId: booking.id,
      lessonTypeId: lesson.id,
      returnUrl: `${window.location.origin}/booking-success`
    });

    const { sessionUrl } = await response.json();
    
    // Redirect to Stripe Checkout
    window.location.href = sessionUrl;
  } catch (error) {
    console.error('Payment error:', error);
    setError('Payment failed. Please try again.');
  }
};
```

### Payment Button
```tsx
<Button 
  onClick={handlePayment}
  disabled={processing}
  className="w-full bg-green-600 hover:bg-green-700"
>
  {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
</Button>
```

## 🔙 Backend Integration

### Checkout Session Creation
Located in `server/routes.ts`:

```typescript
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { bookingId, lessonTypeId, returnUrl } = req.body;
    
    // Get booking and lesson details
    const booking = await storage.getBooking(bookingId);
    const lessonType = await storage.getLessonType(lessonTypeId);
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: lessonType.name,
            description: `Gymnastics lesson for ${booking.athleteName}`
          },
          unit_amount: Math.round(lessonType.price * 100) // Convert to cents
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?cancelled=true`,
      metadata: {
        bookingId: bookingId.toString(),
        parentId: booking.parentId?.toString() || ''
      }
    });

    res.json({ sessionUrl: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});
```

### Webhook Handler
```typescript
app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Update booking status
    await storage.updateBooking(session.metadata.bookingId, {
      paymentStatus: 'completed',
      status: 'confirmed',
      stripeSessionId: session.id
    });
    
    // Send confirmation email
    await sendBookingConfirmation(session.metadata.parentEmail);
    
    // Create parent account if needed
    await createParentAccountFromBooking(session.metadata);
  }

  res.json({ received: true });
});
```

## 🧪 Testing

### Test Mode Setup
```bash
# Use Stripe test keys
STRIPE_PUBLISHABLE_KEY=pk_test_51234567890
STRIPE_SECRET_KEY=sk_test_51234567890

# Test card numbers (these always work in test mode)
# Visa: 4242424242424242
# Visa (debit): 4000056655665556  
# Mastercard: 5555555555554444
# American Express: 378282246310005
```

### Test Payment Flow
1. **Create Test Booking**: Use the normal booking flow
2. **Use Test Cards**: Use Stripe test card numbers
3. **Verify Webhook**: Check webhook events in Stripe dashboard
4. **Confirm Booking**: Verify booking status updated to 'confirmed'

### Manual Testing Commands
```bash
# Test Stripe connection
curl -X GET https://api.stripe.com/v1/balance \
  -H "Authorization: Bearer sk_test_your_secret_key"

# Create test customer
curl -X POST https://api.stripe.com/v1/customers \
  -H "Authorization: Bearer sk_test_your_secret_key" \
  -d "email=test@example.com"
```

## 🔒 Security & Compliance

### PCI Compliance
- **Never store card data**: Let Stripe handle all sensitive data
- **Use HTTPS**: All payment pages must use SSL
- **Validate webhooks**: Always verify webhook signatures
- **Secure API keys**: Keep secret keys server-side only

### Security Best Practices
```typescript
// Validate webhook signatures
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

// Sanitize metadata
const bookingId = parseInt(session.metadata.bookingId);
if (isNaN(bookingId)) {
  throw new Error('Invalid booking ID');
}

// Use idempotency keys for critical operations
const idempotencyKey = `booking-${bookingId}-${session.id}`;
```

## 📊 Payment Analytics

### Stripe Dashboard Metrics
- **Successful Payments**: Track completion rate
- **Failed Payments**: Monitor decline reasons
- **Revenue**: Daily/monthly revenue tracking
- **Customer Data**: Payment method preferences

### Application Metrics
```typescript
// Track payment events
const paymentMetrics = {
  attempts: 0,
  successes: 0,
  failures: 0,
  revenue: 0
};

// Log payment events
console.log('💳 Payment completed:', {
  amount: session.amount_total / 100,
  bookingId: session.metadata.bookingId,
  timestamp: new Date().toISOString()
});
```

## 🚨 Troubleshooting

### Common Issues

#### Payments Failing
1. **Check API Keys**: Ensure correct test/live keys
2. **Webhook Endpoint**: Verify webhook URL is accessible
3. **CORS Issues**: Configure CORS for Stripe domains
4. **SSL Certificate**: Ensure valid SSL for production

#### Webhook Problems
```bash
# Test webhook endpoint
curl -X POST https://your-app.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check webhook delivery in Stripe dashboard
# Go to Developers → Webhooks → View logs
```

#### Development Issues
```typescript
// Debug payment flow
console.log('Creating checkout session:', {
  bookingId,
  lessonType: lessonType.name,
  amount: lessonType.price
});

// Test webhook locally using Stripe CLI
// stripe listen --forward-to localhost:5001/api/stripe/webhook
```

### Error Handling
```typescript
try {
  const session = await stripe.checkout.sessions.create(sessionData);
  return session;
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Card was declined
    throw new Error('Payment was declined. Please try a different card.');
  } else if (error.type === 'StripeInvalidRequestError') {
    // Invalid parameters
    throw new Error('Invalid payment request. Please try again.');
  } else {
    // Other error
    throw new Error('Payment processing error. Please contact support.');
  }
}
```

## 🌐 Production Setup

### Live Mode Configuration
```bash
# Production environment variables
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
STRIPE_SECRET_KEY=sk_live_your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Update webhook endpoint to production URL
# https://your-production-app.com/api/stripe/webhook
```

### Go-Live Checklist
- [ ] Business verification completed in Stripe
- [ ] Live API keys configured
- [ ] Production webhook endpoint set up
- [ ] SSL certificate installed
- [ ] Payment flow tested end-to-end
- [ ] Error handling implemented
- [ ] Customer support process defined

## 📞 Support & Resources

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Test Cards**: [stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Webhook Testing**: [stripe.com/docs/webhooks/test](https://stripe.com/docs/webhooks/test)
- **API Reference**: [stripe.com/docs/api](https://stripe.com/docs/api)

For implementation details, see the payment-related code in:
- `client/src/components/booking-steps/PaymentStep.tsx`
- `server/routes.ts` (search for "stripe" and "checkout")
- `server/utils.ts` (payment utilities)
