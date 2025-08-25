-- Create default tenant for existing data
INSERT INTO tenants (id, slug, name, status, timezone, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'legacy-coach', 
  'Legacy Coach', 
  'active', 
  'America/Los_Angeles',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
