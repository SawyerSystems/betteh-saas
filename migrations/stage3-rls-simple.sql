-- SIMPLE RLS ENABLEMENT SCRIPT
-- Run this in Supabase SQL Editor to enable RLS on all tables
-- This is a simplified version that focuses on the core tables first

-- Enable RLS on core tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_plans ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Enable RLS on core business tables
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_faqs ENABLE ROW LEVEL SECURITY;

-- Create helper function for tenant extraction
CREATE OR REPLACE FUNCTION auth.get_current_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auth.get_current_tenant_id() TO authenticated;

-- Create basic tenant isolation policies
CREATE POLICY "tenant_isolation" ON tenants FOR ALL USING (id = auth.get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON tenant_users FOR ALL USING (tenant_id = auth.get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON athletes FOR ALL USING (tenant_id = auth.get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON parents FOR ALL USING (tenant_id = auth.get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON skills FOR ALL USING (tenant_id = auth.get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON focus_areas FOR ALL USING (tenant_id = auth.get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON bookings FOR ALL USING (tenant_id = auth.get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON availability FOR ALL USING (tenant_id = auth.get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON events FOR ALL USING (tenant_id = auth.get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON waivers FOR ALL USING (tenant_id = auth.get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON testimonials FOR ALL USING (tenant_id = auth.get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON site_content FOR ALL USING (tenant_id = auth.get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON site_faqs FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('tenants', 'athletes', 'parents', 'skills', 'bookings')
ORDER BY tablename;
