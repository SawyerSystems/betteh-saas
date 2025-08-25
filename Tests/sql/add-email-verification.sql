-- Add email verification support to parents table and create verification tokens table

-- Add is_verified column to parents table
ALTER TABLE parents 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Create parent_verification_tokens table
CREATE TABLE IF NOT EXISTS parent_verification_tokens (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_parent_verification_tokens_token ON parent_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_parent_verification_tokens_parent_id ON parent_verification_tokens(parent_id);

-- Add RLS policies for parent_verification_tokens
ALTER TABLE parent_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to manage verification tokens
CREATE POLICY "Service role can manage verification tokens" ON parent_verification_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Policy to allow anon to read verification tokens (for verification endpoint)
CREATE POLICY "Anonymous can read verification tokens" ON parent_verification_tokens
    FOR SELECT USING (true);

-- Update any existing parents to be unverified by default (optional)
-- UPDATE parents SET is_verified = FALSE WHERE is_verified IS NULL;
