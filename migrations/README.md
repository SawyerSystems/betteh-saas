# Database Migrations

This directory contains SQL migration files and shell scripts for updating the database schema.

## Files

- `*.sql` - Database migration scripts
- `*.sh` - Shell scripts for applying migrations
- `fix-booking-waiver-status.sql` - Documentation for booking waiver status view fix

## Usage

1. Review the SQL file before applying
2. Run the migration in Supabase SQL editor (for .sql files)
3. Execute shell scripts if needed (for .sh files)

## Important Notes

- Always backup the database before running migrations
- Test migrations in development environment first
- Update `attached_assets/complete_current_schema.txt` after schema changes
