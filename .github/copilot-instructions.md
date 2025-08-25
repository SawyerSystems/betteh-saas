# CoachWillTumbles - AI Coding Agent Instructions

## PRIMARY DATABASE RULES (TOP PRIORITY)

**⚠️ CRITICAL: Always reference `attached_assets/complete_current_schema.txt` for the complete database schema, including all triggers and functions. Treat this file as the single source of truth for anything related to the codebase's interaction with the database. Never deviate from it under any circumstance.**

**Schema Updates:**
- If a schema update is needed, provide SQL commands to run in Supabase
- User will manually update the file afterward to reflect current database state
- Do not attempt to run SQL commands yourself

**⚠️ PERMISSION REQUIRED: Always ask explicit user permission before:**
- Creating/modifying database schema for new features
- Performing complex data operations with full SQL power
- Accessing system catalogs for comprehensive database analysis
- Executing migrations and schema updates directly
- Implementing advanced database features like triggers, functions, and views

**Error Handling:**
- Always communicate database-related errors clearly
- Provide multiple options or solutions before continuing any iteration

## Architecture Overview

This is a full-stack gymnastics booking platform with React frontend, Express backend, and Supabase PostgreSQL database.

**Key Structure:**
- `client/` - Vite React app with TypeScript, Tailwind CSS, TanStack Query
- `server/` - Express.js API with session-based authentication  
- `shared/` - Drizzle ORM schema shared between frontend/backend
- `emails/` - React Email templates for notifications
- `scripts/` - Database seeding and reset utilities
- `test-suite.js` - Comprehensive testing framework

## Critical Development Knowledge

### Database Schema Pattern
- **ABSOLUTE SOURCE OF TRUTH:** `attached_assets/complete_current_schema.txt` - contains complete Supabase schema including triggers and functions
- **Secondary schema:** `shared/schema.ts` using Drizzle ORM - must match the complete schema exactly
- **Supabase integration:** All queries go through `server/storage.ts` abstraction layer
- **Migration workflow:** Schema changes via manual SQL in Supabase SQL editor ONLY
- **Important:** When Supabase changes are needed, provide SQL commands to user for manual entry in Supabase SQL editor
- **NEVER use:** `supabase.from(...).rpc('exec_sql')` - this function does not exist in our project
- **NEVER edit .env file:** Environment variables are configured correctly. Always ask explicit permission before touching .env file

### Authentication System
- **Dual auth:** Admin (email/password) + Parent (email magic codes via Resend)
- **Session storage:** Express sessions with `req.session.adminId` / `req.session.parentId`
- **Protected routes:** Use `isAdminAuthenticated` / `isParentAuthenticated` middleware
- **Parent auth flow:** Email code → 10min expiry → session creation
- **Required endpoints:** 
  - `POST /api/auth/login`, `GET /api/auth/status`, `GET /api/auth/logout`
  - `POST /api/parent-auth/send-code`, `POST /api/parent-auth/verify-code`, `GET /api/parent-auth/status`

### Core Business Logic
- **Booking flow:** Lesson Type → Athlete → Schedule → Parent Info → Payment (Stripe) → Confirmation
- **Payment integration:** Stripe webhooks auto-update booking status and create parent accounts
- **Waiver system:** Digital signing with PDF generation, linked to athletes/bookings
- **Time slot management:** Availability matrix with exception handling
- **Multi-athlete bookings:** Bookings may have multiple athletes via booking_athletes junction table – never rely on athleteId column in bookings

## Development Workflow

### Starting Development
```bash
npm install
npm run dev:clean  # PREFERRED: Cleans ports then starts both client (6173) and server (6001)
# OR if ports are already clean:
npm run dev  # Starts both client (6173) and server (6001)
```

**⚠️ CRITICAL PORT ENFORCEMENT:** Always use the OFFICIAL development ports:
- **FRONTEND (Vite):** `http://localhost:6173` - NEVER change this port
- **BACKEND (Express):** `http://localhost:6001` - NEVER change this port
- **If ports are in use:** Kill existing processes and restart on official ports
- **NEVER use alternative ports** like 5174, 3000, etc. Always kill and restart on 6173/6001

**⚠️ IMPORTANT:** Always use `npm run dev:clean` to avoid port conflicts. This command:
1. Runs `scripts/kill-ports.sh` to gracefully shutdown existing processes
2. Cleans up ports 6001 (Express) and 6173 (Vite) 
3. Starts fresh development servers on correct ports

**Never use `npm run dev` if you see port conflicts** - always use `npm run dev:clean` instead.

### Essential Commands
- `npm run check` - TypeScript validation across client/server/shared
- `npm run db:push` - Apply schema changes to Supabase
- `npm run build` - Production build for Render deployment
- `npm run test` - Run comprehensive test suite

### Development URLs
- **Frontend (Vite):** http://localhost:5173
- **Backend (Express):** http://localhost:5001
- Never hard-code localhost:3000 in API calls

### File Organization Patterns
- **API routes:** `server/routes.ts` (5500+ lines, organized by feature)
- **Frontend pages:** `client/src/pages/` with lazy loading
- **Components:** `client/src/components/` with UI components in `ui/` subfolder
- **Shared types:** Import from `@shared/schema` for consistency

## Key Integration Points

### Supabase Storage Layer
- **Never bypass:** Always use `storage.ts` methods, never direct Supabase queries
- **Error handling:** Storage methods include proper error handling and logging
- **Relationships:** Foreign keys use explicit naming (e.g., `athletes_parent_id_fkey`)
- **Retry strategy:** Storage layer already implements 3x retry with exponential backoff

### Payment Processing
- **Stripe webhooks:** Handle `checkout.session.completed` for booking confirmation
- **Auto-account creation:** Successful payments create parent accounts automatically
- **Test mode:** Use test keys in development, switch to live keys for production
- **Metadata keys:** Pass `bookingId` and `parentId` to Stripe for webhook processing

### Email System
- **React Email:** Templates in `emails/` folder with styled components
- **Delivery:** Resend API for transactional emails (auth codes, confirmations)
- **Templates:** BookingConfirmation, WaiverReminder, SessionCancellation, etc.
- **Template props:** All template props are snake_case to match DB fields

## Project-Specific Conventions

### State Management
- **TanStack Query:** For all API data fetching with automatic caching
- **Query keys:** Use endpoint paths as keys (e.g., `['/api/bookings']`)
- **Optimistic updates:** Invalidate queries after mutations for fresh data

### Component Patterns
- **Modal management:** Complex modal flows with step-based state machines
- **Form handling:** React Hook Form with Zod validation matching backend schemas
- **Loading states:** Consistent loading patterns with skeleton screens

### Error Handling
- **API responses:** Consistent error format with status codes and messages
- **Frontend:** Toast notifications for user feedback via `useToast`
- **Logging:** Server-side logging with request context for debugging
- **Error object format:** `{ error: 'Booking not found', code: 'BOOKING_404' }`

## Common Development Patterns

### Adding New Features
1. Update `shared/schema.ts` if database changes needed
2. Run `npm run db:push` to apply schema changes
3. Update `server/storage.ts` with new data access methods
4. Add API routes in `server/routes.ts`
5. Create frontend components and hooks
6. Add tests to `test-suite.js`

### Authentication Guards
```typescript
// Protect admin routes
app.use('/api/admin/*', isAdminAuthenticated);

// Protect parent routes  
app.use('/api/parent/*', isParentAuthenticated);
```

### Query Pattern
```typescript
// Standard TanStack Query pattern
const { data: bookings = [] } = useQuery<Booking[]>({
  queryKey: ['/api/bookings'],
  enabled: authStatus?.loggedIn,
});
```

## Deployment & Environment

### Render Platform
- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Environment:** Set all variables from `.env.example` in Render dashboard
- **Warning:** Render removes devDependencies; ensure production builds don't rely on dev packages

### Critical Environment Variables
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `SUPABASE_SERVICE_ROLE_KEY` - For admin database operations
- `STRIPE_SECRET_KEY` - Payment processing
- `RESEND_API_KEY` - Email delivery
- `SESSION_SECRET` - Secure session encryption

**⚠️ CREDENTIALS REMINDER:** Always check `.env` file for login credentials when debugging authentication issues or when you need to login:
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` - For admin panel access (admin@coachwilltumbles.com / TumbleCoach2025!)
- `PARENT_TEST_USER_EMAIL` and `PARENT_TEST_USER_PASSWORD` - For parent portal testing
- **IMPORTANT:** Check the .env file FIRST whenever you need credentials - don't forget this step
- Never hardcode credentials - always reference from environment variables

**⚠️ ABSOLUTE RULE:** Never add new tables/columns without updating `shared/schema.ts` and documenting SQL for manual Supabase run.

Remember: This platform handles real payments and personal data. Always test thoroughly before deploying changes to production.
