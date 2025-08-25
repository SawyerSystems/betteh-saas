-- Parent Login Tracking Migration
-- Adds a dedicated column to properly track the last time a parent logged in
-- This fixes the issue where updated_at was incorrectly used as a proxy for login time

-- Add lastLoginAt column to parents table with NULL as default (no login yet)
ALTER TABLE parents ADD COLUMN last_login_at TIMESTAMPTZ;

-- Initialize existing records to have their updated_at as the initial last_login_at value
-- This ensures existing parents don't have a NULL last_login_at until their next login
UPDATE parents SET last_login_at = updated_at WHERE last_login_at IS NULL;
