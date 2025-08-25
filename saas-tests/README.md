# Betteh SaaS Platform Tests

This directory contains comprehensive test suites for the **Betteh SaaS Platform**.

## Directory Structure

### `/api/`
API endpoint testing:
- `test-phase-1.5-api.mjs` - Complete Phase 1.5 API test suite

### `/database/`
Database schema and migration testing:
- `test-schema.mjs` - Database schema validation
- `test-drizzle-schema.mjs` - Drizzle ORM schema testing
- `test-permissions.mjs` - Role-based permission system testing
- `test-api.mjs` - API integration testing

### `/auth/`
Authentication and authorization testing:
- `debug-auth.mjs` - Authentication flow debugging

## Running Tests

### Complete Test Suite
```bash
# TypeScript compilation check
npm run check

# Database schema validation
node saas-tests/database/test-schema.mjs

# Permission system validation
node saas-tests/database/test-permissions.mjs

# API endpoints testing
node saas-tests/api/test-phase-1.5-api.mjs

# Authentication debugging
node saas-tests/auth/debug-auth.mjs
```

### Production Build Test
```bash
npm run build
```

## Test Coverage

### ✅ Phase 1.5 Validation (Complete)
- **TypeScript Compilation**: 0 errors
- **Database Schema**: All tables and relations verified
- **API Endpoints**: All 14 new endpoints tested
- **Permission System**: 65+ permissions across 9 roles validated
- **Production Build**: Successful with optimizations

### 🚧 Phase 2 Testing (In Progress)
- Frontend integration tests
- Multi-tenant UI component tests
- End-to-end booking flow tests

## Legacy CWT Tests

Original Coach Will Tumbles test files are preserved in `/legacy-cwt/Tests/` for reference during migration.

## Test Results Documentation

Detailed test results and validation reports are available in `/saas-setup/docs/PHASE_1.5_TEST_RESULTS.md`.
