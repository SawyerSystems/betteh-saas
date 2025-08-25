-- Minimal tables to log cookie consent and privacy requests if desired
-- This is optional since current implementation stores privacy requests in site_inquiries with source='privacy'

-- Cookie consent log (optional)
CREATE TABLE IF NOT EXISTS cookie_consent (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NULL, -- optional if authenticated
  necessary BOOLEAN NOT NULL DEFAULT TRUE,
  analytics BOOLEAN NOT NULL DEFAULT FALSE,
  marketing BOOLEAN NOT NULL DEFAULT FALSE,
  region TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dedicated privacy_requests table (optional)
CREATE TABLE IF NOT EXISTS privacy_requests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  request_type TEXT NOT NULL, -- access | deletion | correction | optout
  details TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- new | in_progress | completed | declined
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
