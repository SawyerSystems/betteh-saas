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

See `BETTEH_SAAS_MIGRATION_PLAN.md` for detailed migration roadmap.

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

## 🚀 GitHub Repository

This repository is part of the SawyerSystems organization:
- **Organization**: https://github.com/SawyerSystems
- **Repository**: https://github.com/SawyerSystems/betteh-saas

## Critical rules and expectations

- Official dev ports: Frontend http://localhost:5173 and Backend http://localhost:5001. Always use these; if busy, free them and restart.
- Use npm run dev:clean to kill ports and start both servers together.
- Database source of truth: attached_assets/complete_current_schema.txt. Treat this as canonical for DB shape, triggers, and functions.
- Schema changes in production must be applied with SQL in Supabase, then mirrored in shared/schema.ts. Do not run ad‑hoc destructive migrations against production.

## System requirements

- Node.js 20+ and npm
- A Supabase project (PostgreSQL + Storage)
- Stripe test keys for development
- Resend API key for sending emails

## Environment setup

1) Install dependencies

```bash
npm install
```

2) Create and fill in your .env

- Copy setup/example.env to .env and fill values for your environment.
- Key variables (see setup/example.env for the full list):
   - DATABASE_URL (Supabase Postgres connection string)
   - SUPABASE_SERVICE_ROLE_KEY (admin operations)
   - STRIPE_SECRET_KEY (test)
   - RESEND_API_KEY
   - SESSION_SECRET
   - ADMIN_EMAIL / ADMIN_PASSWORD (for admin panel)
   - FRONTEND_URL and BACKEND_URL (typically http://localhost:5173 and http://localhost:5001)

3) Database and storage

- Create your Supabase project and set up storage buckets per setup/docs/SUPABASE_STORAGE_SETUP.md.
- The live production schema is documented in attached_assets/complete_current_schema.txt.
- For local/dev iteration with Drizzle types, you can use:

```bash
npm run db:generate   # generate migration artifacts/types
npm run db:push       # push non-destructive changes to your dev database
```

Important: For production schema updates, write explicit SQL in Supabase’s SQL editor and then update shared/schema.ts to match. Keep attached_assets/complete_current_schema.txt in sync (manually exported).

4) Start development servers

```bash
npm run dev:clean   # preferred (kills ports 5001/5173 then starts both)
# or
npm run dev         # if ports are free
```

Open frontend at http://localhost:5173 and backend at http://localhost:5001.

## Repository layout

- client/ — Vite React app (TypeScript, Tailwind)
- server/ — Express API (TypeScript) with session auth
- shared/ — Drizzle ORM schema and shared types imported by both sides
- emails/ — React Email templates for Resend
- migrations/ — Database schema migrations and update scripts
- dev-tools/ — Development utilities, test scripts, and debugging tools
- docs/ — Project documentation and implementation guides
- setup/
   - docs/ — all setup and feature docs (storage, payments, fixes, etc.)
   - migrations/sql/ — SQL files for schema and data migrations
   - scripts/ — one‑off setup/migration scripts
   - schema/ — exported snapshots, e.g., _live_schema_snapshot.json
- scripts/ — project scripts (kill ports, admin utilities, etc.)
- Tests/
   - e2e/ — browser harnesses and end‑to‑end utilities
   - integration/ — integration tests and API checks
   - diagnostics/ — local debug and schema/health checks
   - python/ — Python helpers for schema/data inspection
   - tools/ — language‑specific helper scripts (cjs/mjs/ts/js)
- attached_assets/ — static exports and images (plus complete_current_schema.txt)

## Development workflow

- Type check everywhere

```bash
npm run check
```

- Build (client + server bundle)

```bash
npm run build
```

- Run tests

```bash
npm test          # test-suite.js orchestrates checks
npm run test:verbose
```

## Authentication overview

- Admin auth: email/password from .env, session stored server‑side.
- Parent auth: email magic code via Resend; session established on verify.
- Session cookies: cwt.sid.dev in development; guard routes with isAdminAuthenticated / isParentAuthenticated.

## Booking and payments overview

- Flow: Lesson Type → Athlete → Schedule → Parent Info → Payment → Confirmation.
- Stripe Checkout used for payment; webhook finalizes booking state.
- Idempotent confirmation email: bookings.session_confirmation_email_sent/at flags are set atomically to send exactly once.

## Database and schema workflow (important)

- Canonical schema reference: attached_assets/complete_current_schema.txt
- shared/schema.ts must reflect the exact live schema (columns, enums, relations). Keep these synchronized.
- Prefer adding SQL files to setup/migrations/sql and documenting changes in setup/docs.
- Production changes: run SQL in Supabase SQL editor; then update shared/schema.ts and commit both code and SQL.

## Running in production (Render)

- Build command: npm install && npm run build
- Start command: npm start
- Ensure environment variables in Render match setup/example.env.
- Render removes devDependencies; production build must not rely on dev packages.

## Common commands

- Start dev (clean ports): npm run dev:clean
- Start frontend only: npm run dev:client (http://localhost:5173)
- Start backend only: npm run dev:server (http://localhost:5001)
- Type check: npm run check
- Build: npm run build
- Generate Drizzle artifacts: npm run db:generate
- Push Drizzle changes to dev DB: npm run db:push

## Troubleshooting

- Port already in use: Use npm run dev:clean to free 5173/5001.
- Emails not sending: verify RESEND_API_KEY; check server logs for errors.
- Stripe webhook: ensure your backend URL is accessible; in dev, use a tunnel (e.g., ngrok) and set the endpoint in Stripe Dashboard.
- Database mismatch: run Tests/python/compare-live-vs-shared.py against your Supabase to spot diffs; update shared/schema.ts and docs.
- 401/403 on API: confirm session cookies; use GET /api/auth/status and /api/parent-auth/status to verify.

## Contributing

- Follow the database rules above for any schema changes.
- Keep ports and URLs consistent in code (never hardcode localhost:3000).
- Add or update tests in Tests/ accordingly.

## License

MIT