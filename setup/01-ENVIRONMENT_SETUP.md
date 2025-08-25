# Environment Setup Guide

This guide covers all environment variables and configuration needed for the CoachWillTumbles platform.

## 📋 Required Environment Variables

### Core Configuration
```bash
# Server Configuration
PORT=5001
NODE_ENV=development  # or 'production'

# Base URL (for emails and redirects)
BASE_URL=http://localhost:5173  # Development
# BASE_URL=https://your-app.onrender.com  # Production
```

### Database Configuration (Supabase)
```bash
# Supabase PostgreSQL Database
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_DIRECT_URL="postgresql://postgres:password@db.your-project-id.supabase.co:5432/postgres"

# Legacy keys (used by some components)
SUPABASE_SECRET_KEY=sb_secret_your_secret_key
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_publishable_key
```

### Session Security
```bash
# Session Configuration (Environment-Aware)
SESSION_SECRET_DEV="your-dev-secret-key-64-chars-long"
SESSION_SECRET_PROD="your-production-secret-key-64-chars-long"
```

### Email Configuration (Resend)
```bash
# Email Service
RESEND_API_KEY=re_your_resend_api_key

# Admin Email Settings
ADMIN_EMAIL=admin@coachwilltumbles.com
ADMIN_PASSWORD=your_admin_password

# Email Templates
FROM_EMAIL=noreply@coachwilltumbles.com
SUPPORT_EMAIL=support@coachwilltumbles.com
```

### Payment Processing (Stripe)
```bash
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key  # or pk_live_
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key           # or sk_live_
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Testing & Development
```bash
# Test User Credentials
PARENT_TEST_USER_EMAIL=test@example.com
PARENT_TEST_USER_PASSWORD=test_password_123

# Debug Settings
DEBUG_EMAIL=true  # Logs emails to console instead of sending
```

## 🔧 Setup Instructions

### 1. Create Environment File
```bash
# Copy the example file
cp setup/example.env .env

# Edit with your actual values
nano .env  # or use your preferred editor
```

### 2. Supabase Setup
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy URL and keys from Settings → API

2. **Get Database URL**
   - Go to Settings → Database
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your actual password

### 3. Generate Session Secrets
```bash
# Generate secure random keys (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Email Setup (Resend)
1. **Create Resend Account**
   - Go to [resend.com](https://resend.com)
   - Get API key from dashboard
   - Add your domain for production

2. **Configure Email Templates**
   - Templates are in `emails/` directory
   - Automatically used by the system

### 5. Stripe Setup
1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com)
   - Get API keys from dashboard
   - Set up webhook endpoint: `https://your-app.com/api/stripe/webhook`

2. **Webhook Events**
   - Enable: `checkout.session.completed`
   - Copy webhook secret

## 🚨 Security Notes

### Development vs Production
- **Development**: Use `_DEV` suffixed environment variables
- **Production**: Use `_PROD` suffixed environment variables
- **Never commit** real credentials to version control

### Required Permissions
- **Supabase Service Role**: Full database access
- **Stripe**: Read/write access to payments
- **Resend**: Send email permissions

## 🔍 Validation

### Test Configuration
```bash
# Check environment variables are loaded
npm run check-env

# Test database connection
npm run test:db

# Test email configuration  
npm run test:email

# Test Stripe connection
npm run test:stripe
```

### Common Issues
- **Database connection fails**: Check `DATABASE_DIRECT_URL` format
- **Emails not sending**: Verify `RESEND_API_KEY` and domain setup
- **Payments failing**: Check Stripe keys match your account mode (test/live)
- **Session issues**: Ensure session secrets are properly set

## 📝 Environment File Template

See [example.env](./example.env) for a complete template with all required variables.
