# Tests Directory

This directory contains various test scripts and utilities for the Coach Will's Gymnastics application.

## Organization

- **JavaScript files (.js)** - Main test scripts in the root Tests folder
- **CommonJS files (.cjs)** - Test scripts that use CommonJS module format in the `cjs` directory
- **ECMAScript Modules (.mjs)** - Test scripts that use ES module format in the `mjs` directory
- **TypeScript files (.ts)** - TypeScript test scripts in the `ts` directory
- **SQL files (.sql)** - Database test and validation scripts in the `sql` directory

## Running Tests

Most test scripts can be run directly using Node.js:

```bash
# For JavaScript files
node Tests/test-file-name.js

# For CommonJS files
node Tests/cjs/test-file-name.cjs

# For MJS files
node Tests/mjs/test-file-name.mjs

# For TypeScript files
npx tsx Tests/ts/test-file-name.ts
```

For SQL files, use the database client or the run-sql.cjs utility:

```bash
node Tests/cjs/run-sql.cjs Tests/sql/file-name.sql
```
