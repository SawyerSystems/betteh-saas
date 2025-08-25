#!/bin/bash

# Script to create new Betteh SaaS repository
# This migrates the essential files from the single-tenant version

set -e

echo "🚀 Creating Betteh SaaS Repository..."

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Get the target directory
read -p "📁 Enter the path for the new SaaS repository (e.g., /Users/will/Programming/betteh-saas): " SAAS_DIR

# Create the directory
echo "📁 Creating directory: $SAAS_DIR"
mkdir -p "$SAAS_DIR"
cd "$SAAS_DIR"

# Initialize git repository
echo "🔧 Initializing git repository..."
git init
git branch -m main

# Create directory structure
echo "📂 Creating directory structure..."
mkdir -p {client,server,shared,emails,scripts,migrations,docs,attached_assets}

# Copy essential files
echo "📋 Copying essential files..."

# Root configuration files
cp "/Users/will/Programming/betteh/betteh/package.json" .
cp "/Users/will/Programming/betteh/betteh/package-lock.json" .
cp "/Users/will/Programming/betteh/betteh/tsconfig.json" .
cp "/Users/will/Programming/betteh/betteh/vite.config.ts" .
cp "/Users/will/Programming/betteh/betteh/tailwind.config.ts" .
cp "/Users/will/Programming/betteh/betteh/postcss.config.js" .
cp "/Users/will/Programming/betteh/betteh/drizzle.config.ts" .
cp "/Users/will/Programming/betteh/betteh/components.json" .
cp "/Users/will/Programming/betteh/betteh/.gitignore" .
cp "/Users/will/Programming/betteh/betteh/render.yaml" .

# Environment and configuration
cp "/Users/will/Programming/betteh/betteh/.env.example" .
echo "⚠️  Remember to create your own .env file with new credentials"

# Documentation
cp "/Users/will/Programming/betteh/betteh/BETTEH_SAAS_MIGRATION_PLAN.md" ./docs/
cp "/Users/will/Programming/betteh/betteh/README.md" .

# Database assets
cp -r "/Users/will/Programming/betteh/betteh/attached_assets/" .
cp -r "/Users/will/Programming/betteh/betteh/migrations/" .

# Copy all source code directories
echo "💻 Copying source code..."
cp -r "/Users/will/Programming/betteh/betteh/client/" .
cp -r "/Users/will/Programming/betteh/betteh/server/" .
cp -r "/Users/will/Programming/betteh/betteh/shared/" .
cp -r "/Users/will/Programming/betteh/betteh/emails/" .

# Copy essential scripts
echo "🔧 Copying scripts..."
cp -r "/Users/will/Programming/betteh/betteh/scripts/" .

# Create new README for SaaS version
cat > README.md << 'EOF'
# Betteh - Multi-Tenant Gymnastics SaaS Platform

A multi-tenant SaaS platform for gymnastics coaches to manage their athletes, bookings, and business operations.

## 🎯 Vision

Transform the single-tenant "Coach Will Tumbles" application into "Betteh" - a comprehensive SaaS platform serving multiple gymnastics coaches and their communities.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + TanStack Query
- **Backend**: Express.js + Supabase PostgreSQL
- **Authentication**: Supabase Auth with JWT + Row Level Security
- **Payments**: Stripe Connect for multi-tenant payouts
- **Storage**: Supabase Storage with tenant isolation

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Start development servers
npm run dev:clean
```

## 📊 Migration Progress

**Current Status: 35% Complete**

- ✅ **Phase 1**: Database Foundation (100% Complete)
- ✅ **Phase 2**: JWT & Authentication (100% Complete)  
- 🔄 **Phase 3**: Branding System (Next Up)
- ⏳ **Phase 4**: Tenant Routing
- ⏳ **Phase 5**: Platform Features
- ⏳ **Phase 6**: Billing Integration

See `docs/BETTEH_SAAS_MIGRATION_PLAN.md` for detailed migration roadmap.

## 🔑 Key Features

### For Platform Admins
- Multi-tenant management
- Usage analytics and billing
- Coach onboarding and support

### For Coaches
- Complete athlete management
- Booking and scheduling system
- Progress tracking and videos
- Payment processing
- Custom branding

### For Parents
- Easy booking interface
- Progress visibility
- Secure payments
- Digital waivers

## 🏢 Multi-Tenant Architecture

- **Tenant Isolation**: Row Level Security (RLS) ensures complete data separation
- **Custom Domains**: `coach-name.betteh.app` subdomains
- **Role-Based Access**: Platform Admin → Coach Admin → Coach Staff → Parent → Athlete
- **Billing**: Per-tenant Stripe Connect accounts with platform fees

## 🛠️ Development

```bash
# Type checking
npm run check

# Database operations
npm run db:push

# Production build
npm run build

# Run tests
npm run test
```

## 📁 Project Structure

```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared types and utilities
├── emails/          # Email templates (React Email)
├── migrations/      # Database migration scripts
├── scripts/         # Utility and setup scripts
├── docs/           # Documentation and migration plans
└── attached_assets/ # Database schema and reference files
```

## 🔒 Security

- Row Level Security (RLS) for tenant isolation
- JWT-based authentication with custom claims
- Service role operations for administrative tasks
- Encrypted sensitive data storage

## 📈 Roadmap

1. **Q4 2025**: Complete core SaaS features (Phases 3-6)
2. **Q1 2026**: Beta launch with 3+ coach partners
3. **Q2 2026**: GA launch with full platform features
4. **Q3 2026**: Advanced features (analytics, integrations)

## 🤝 Contributing

This is a private SaaS platform under active development. See migration plan for current focus areas.

## 📞 Support

For development questions, see the comprehensive API documentation at `/api/docs` when running locally.
EOF

# Update package.json for SaaS version
echo "📦 Updating package.json for SaaS version..."
sed -i '' 's/"name": "coach-will-gymnastics"/"name": "betteh-saas"/' package.json
sed -i '' 's/"description": "Gymnastics booking platform"/"description": "Multi-tenant gymnastics SaaS platform"/' package.json

# Create initial commit
echo "📝 Creating initial commit..."
git add .
git commit -m "🎉 Initial commit: Betteh SaaS Platform

- Migrated from single-tenant Coach Will Tumbles application
- Database foundation: RLS enabled, tenant isolation complete
- Authentication: Supabase Auth + JWT claims + role-based access
- API documentation system included
- Ready for Phase 3: Branding System implementation

Migration status: 35% complete (Phases 1-2 done)
Next: Replace hardcoded branding with dynamic tenant system"

echo ""
echo "✅ Betteh SaaS repository created successfully!"
echo "📁 Location: $SAAS_DIR"
echo ""
echo "🔧 Next steps:"
echo "1. cd $SAAS_DIR"
echo "2. Create .env file with your credentials"
echo "3. npm install"
echo "4. npm run dev:clean"
echo ""
echo "📚 See docs/BETTEH_SAAS_MIGRATION_PLAN.md for next development phases"
echo ""
echo "🎯 Ready to implement Phase 3: Branding System!"
