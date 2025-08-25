# Legacy Coach Will Tumbles Platform Files

This directory contains all original files from the **Coach Will Tumbles** single-tenant platform, preserved for reference and context during the migration to the multi-tenant **Betteh SaaS Platform**.

## Directory Structure

### `/setup/` (Original CWT Setup)
Original setup documentation and scripts for the single-tenant platform:
- Database setup guides
- Environment configuration
- Deployment instructions
- Legacy migration scripts

### `/Tests/` (Original CWT Tests)
Original test suites for the single-tenant platform:
- Integration tests
- E2E tests
- Schema comparison tools
- Admin and booking tests

### `/migrations/`
Legacy SQL migration files for CWT platform features:
- Availability system migrations
- Booking status implementations
- Security fixes
- Schema updates

### `/scripts/`
Legacy utility scripts:
- Python analysis scripts
- JavaScript test files
- Shell scripts for validation
- Schema comparison tools

### `/docs/`
Legacy documentation:
- Feature implementation guides
- Migration summaries
- System enhancement documentation

## Purpose

These files are maintained for:

1. **Reference**: Understanding the original system architecture
2. **Context**: Providing background for migration decisions
3. **Fallback**: Emergency reference if SaaS migration encounters issues
4. **Documentation**: Historical record of platform evolution

## ⚠️ Important Notes

- **DO NOT** modify files in this directory
- **DO NOT** run legacy scripts without understanding their impact
- **USE** these files only for reference when working on SaaS migration
- **REFER** to `/saas-setup/` and `/saas-tests/` for current development

## Migration Status

The platform has been successfully migrated from this legacy single-tenant system to the new multi-tenant SaaS architecture. See `/saas-setup/docs/BETTEH_SAAS_MIGRATION_PLAN.md` for the complete migration roadmap and current status.
