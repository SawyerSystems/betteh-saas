# Render Deployment Guide

This guide walks you through deploying the CoachWillTumbles application to Render.

## Prerequisites

- GitHub repository with your code
- Render account (free tier available)
- Environment variables configured (see VSCODE_SETUP.md)

## Initial Render Setup

### 1. Create Render Account

1. Visit [render.com](https://render.com)
2. Sign up with your GitHub account
3. Grant Render access to your repositories

### 2. Create PostgreSQL Database

1. In Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Configure:
   - **Name**: `coachwilltumbles-db`
   - **Database**: `coachwilltumbles`
   - **User**: `coachwill`
   - **Plan**: Free (for development) or Starter (for production)
4. Click "Create Database"
5. **Save the connection details** - you'll need them for the web service

### 3. Create Web Service

1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `coachwilltumbles`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (for development) or Starter (for production)

## Environment Configuration

### Required Environment Variables

Set these in your Render web service settings:

```bash
# Core Configuration
NODE_ENV=production
PORT=5001
BASE_URL=https://your-service-name.onrender.com

# Database (from your Render PostgreSQL service)
DATABASE_URL=postgresql://coachwill:password@hostname:port/coachwilltumbles

# Session Security
SESSION_SECRET=your-super-secure-session-secret-at-least-32-chars

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Configuration (use live keys for production)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=coach@coachwilltumbles.com

# Admin Access
ADMIN_EMAIL=admin@coachwilltumbles.com
ADMIN_PASSWORD=your-secure-admin-password

# CORS Configuration
CORS_ORIGIN=https://your-service-name.onrender.com
```

### Setting Environment Variables

1. Go to your web service dashboard
2. Click "Environment" tab
3. Add each variable:
   - Click "Add Environment Variable"
   - Enter key and value
   - Click "Save Changes"

## Database Setup

### 1. Connect to Database

After creating your PostgreSQL service:

1. Note the connection details from Render
2. Update `DATABASE_URL` in your web service environment variables
3. The URL format is: `postgresql://user:password@hostname:port/database`

### 2. Initialize Schema

Your application will automatically run database migrations on startup. The Drizzle schema will be applied when the server starts.

## Domain Configuration

### Custom Domain (Optional)

1. In your web service settings, go to "Settings" tab
2. Scroll to "Custom Domains"
3. Add your domain (e.g., `coachwilltumbles.com`)
4. Configure DNS records as instructed by Render
5. Update `BASE_URL` environment variable to use your custom domain

## Stripe Webhook Configuration

### 1. Create Production Webhook

1. Log into Stripe Dashboard
2. Go to "Developers" → "Webhooks"
3. Click "Add endpoint"
4. Enter URL: `https://your-service-name.onrender.com/api/stripe-webhook`
5. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
6. Copy the webhook secret

### 2. Update Environment Variables

Add the webhook secret to your Render environment variables:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Monitoring and Logs

### Viewing Logs

1. Go to your web service dashboard
2. Click "Logs" tab
3. Monitor real-time application logs
4. Use logs to debug deployment issues

### Health Checks

Render automatically monitors your service health at `/api/health`. Ensure this endpoint returns a 200 status.

### Performance Monitoring

1. Monitor response times in Render dashboard
2. Set up alerts for downtime
3. Consider upgrading to paid plan for better performance

## Continuous Deployment

### Automatic Deployments

Your service will automatically deploy when you push to the main branch of your connected GitHub repository.

### Manual Deployments

1. Go to your web service dashboard
2. Click "Manual Deploy"
3. Select "Deploy latest commit"

### GitHub Actions (Optional)

Use the included GitHub Actions workflow for additional CI/CD features:

1. Set up GitHub secrets:
   - `RENDER_SERVICE_ID`: Your service ID from Render
   - `RENDER_API_KEY`: Your Render API key

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Render dashboard
   - Verify all dependencies are in `package.json`
   - Ensure build command is correct

2. **Environment Variable Issues**
   - Double-check all required variables are set
   - Verify no typos in variable names
   - Restart service after adding variables

3. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check PostgreSQL service status
   - Ensure database is in same region as web service

4. **Stripe Webhook Issues**
   - Verify webhook URL is correct
   - Check webhook secret matches
   - Monitor webhook logs in Stripe dashboard

### Performance Optimization

1. **Enable Compression**: Application includes gzip compression
2. **Database Optimization**: Use connection pooling (already configured)
3. **Caching**: Consider adding Redis for session storage in production
4. **CDN**: Use Render's CDN features or integrate with Cloudflare

## Scaling Considerations

### Free Tier Limitations

- Service spins down after 15 minutes of inactivity
- 750 hours per month limit
- Shared CPU and memory

### Upgrading for Production

1. **Starter Plan**: $7/month
   - Always-on service
   - Dedicated resources
   - Custom domains

2. **Standard Plan**: $25/month
   - More CPU and memory
   - Advanced metrics
   - Priority support

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **Session Security**: Use strong session secrets
3. **HTTPS**: Render provides free SSL certificates
4. **Database**: Use strong passwords and enable SSL
5. **Admin Access**: Use strong admin passwords
6. **CORS**: Configure CORS properly for your domain

## Backup and Recovery

1. **Database Backups**: Render automatically backs up PostgreSQL
2. **Code Backups**: Use GitHub for version control
3. **Environment Variables**: Keep secure backups of your `.env` template

## Next Steps

- Monitor application performance
- Set up custom domain
- Configure email notifications for deployments
- Consider implementing Redis for sessions
- Set up monitoring and alerting
