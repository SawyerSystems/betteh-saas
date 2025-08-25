# Betteh SaaS Platform Setup

This directory contains all setup files, migrations, and documentation for the new **Betteh SaaS Platform**.

## Directory Structure

### `/migrations/`
Database migration scripts for transforming from single-tenant CWT to multi-tenant SaaS:
- `phase-1.5-enhanced-user-types.sql` - Enhanced user types and organizational support

### `/scripts/`
Setup and utility scripts for SaaS platform:
- `run-migration.mjs` - Migration execution utility
- `cleanup-dependencies.sql` - Database dependency cleanup
- `create-admin-quick.mjs` - Quick admin account creation

### `/docs/`
SaaS platform documentation:
- `BETTEH_SAAS_MIGRATION_PLAN.md` - Complete migration roadmap
- `PHASE_1.5_*` - Phase 1.5 implementation documentation
- `NEW_SAAS_DB_BOOTSTRAP.md` - Database bootstrap guide

## Getting Started

1. **Run Database Migration**:
   ```bash
   npm run db:push
   ```

2. **Create Admin Account**:
   ```bash
   node saas-setup/scripts/create-admin-quick.mjs
   ```

3. **Start Development Server**:
   ```bash
   npm run dev:clean
   ```

## Migration Status

- ✅ **Phase 1.5**: Enhanced User Types & Plans - COMPLETE
- 🚧 **Phase 2**: Frontend Integration - In Progress
- ⏳ **Phase 3**: Authentication Enhancement - Planned
- ⏳ **Phase 4**: Billing Integration - Planned

## Legacy CWT Platform

The original Coach Will Tumbles platform files are preserved in `/legacy-cwt/` for reference and context during the migration process.
