-- Blog Email Opt-in Migration
-- Add blog_emails column to parents table and create blog_email_signups table

-- Add blog_emails column to parents table
ALTER TABLE parents 
ADD COLUMN IF NOT EXISTS blog_emails BOOLEAN DEFAULT false NOT NULL;

-- Create blog_email_signups table for guest subscribers
CREATE TABLE IF NOT EXISTS blog_email_signups (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_blog_email_signups_email ON blog_email_signups(email);
CREATE INDEX IF NOT EXISTS idx_parents_blog_emails ON parents(blog_emails) WHERE blog_emails = true;

-- Enable RLS on the new table
ALTER TABLE blog_email_signups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for guest signups)
CREATE POLICY "Allow public inserts for blog email signups" 
ON blog_email_signups FOR INSERT 
TO public 
WITH CHECK (true);

-- Create policy to allow admin access for reading
CREATE POLICY "Allow admin read access to blog email signups" 
ON blog_email_signups FOR SELECT 
TO authenticated 
USING (true);

-- Test the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'parents' AND column_name = 'blog_emails';

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'blog_email_signups'
ORDER BY ordinal_position;
