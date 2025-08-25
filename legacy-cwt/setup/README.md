# CoachWillTumbles - Setup Guide

Welcome to the CoachWillTumbles gymnastics booking platform setup guide! This directory contains everything you need to get the system running from scratch.

## 📋 Quick Start Checklist

- [ ] **Database Setup** - Configure Supabase PostgreSQL database
- [ ] **Environment Variables** - Set up all required configuration
- [ ] **Storage Setup** - Create Supabase Storage buckets for media files
- [ ] **Email Configuration** - Configure Resend for email delivery
- [ ] **Payment Setup** - Configure Stripe for payment processing
- [ ] **Development Server** - Start the local development environment
- [ ] **Production Deployment** - Deploy to Render platform

## 📁 Setup Files Overview

### Essential Setup (Execute in Order)
- **[01-ENVIRONMENT_SETUP.md](./01-ENVIRONMENT_SETUP.md)** - Environment variables and basic configuration
- **[02-DATABASE_SETUP.md](./02-DATABASE_SETUP.md)** - Complete database schema and setup
- **[03-STORAGE_SETUP.md](./03-STORAGE_SETUP.md)** - Supabase Storage buckets configuration
- **[04-EMAIL_SETUP.md](./04-EMAIL_SETUP.md)** - Email system configuration with Resend
- **[05-PAYMENT_SETUP.md](./05-PAYMENT_SETUP.md)** - Stripe payment processing setup

### Development & Deployment
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Local development setup and workflow
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment to Render
- **[SCHEMA_MIGRATIONS.md](./SCHEMA_MIGRATIONS.md)** - Database schema updates and migrations

### Configuration Files & Scripts
- **[example.env](./example.env)** - Complete environment variables template
- **[dev-setup.sh](./dev-setup.sh)** - Automated development setup script
- **[site-content-schema.sql](./site-content-schema.sql)** - Site content management database schema

### Additional Resources
- **[EMAIL_SYSTEM_GUIDE.md](./EMAIL_SYSTEM_GUIDE.md)** - Detailed email system documentation
- **[SESSION_CONFIG_README.md](./SESSION_CONFIG_README.md)** - Session management configuration

## 🚀 Quick Setup (Development)

```bash
# 1. Clone and install dependencies
git clone https://github.com/SawyerSystems/coach-will-gymnastics.git
cd coach-will-gymnastics
npm install

# 2. Configure environment
cp setup/example.env .env
# Edit .env with your Supabase and API keys

# 3. Set up database
# Follow setup/02-DATABASE_SETUP.md for complete schema setup

# 4. Start development server
npm run dev:clean
```

## 🌐 Production Setup

```bash
# 1. Deploy to Render
# Follow setup/DEPLOYMENT_GUIDE.md for complete instructions

# 2. Configure environment variables in Render dashboard
# Use setup/01-ENVIRONMENT_SETUP.md as reference

# 3. Run database migrations
# Execute SQL files in setup/ directory through Supabase dashboard
```

## 📞 Support & Troubleshooting

- **Architecture**: See [copilot-instructions.md](../.github/copilot-instructions.md) for technical details
- **Email Issues**: Check [EMAIL_SYSTEM_GUIDE.md](../EMAIL_SYSTEM_GUIDE.md)
- **Database Problems**: Reference [SCHEMA_UPDATE_SUMMARY.md](../SCHEMA_UPDATE_SUMMARY.md)
- **Deployment Issues**: See [RENDER_DEPLOYMENT.md](../RENDER_DEPLOYMENT.md)

## 🔧 System Requirements

- **Node.js**: 18+ 
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **Email**: Resend API
- **Payments**: Stripe
- **Deployment**: Render platform

---

**Need Help?** Check the individual setup files for detailed step-by-step instructions.
