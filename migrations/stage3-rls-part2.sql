-- Complete RLS Migration - Part 2
-- Run this in Supabase SQL Editor to finish the RLS setup

-- Create tenant helper function in public schema (we can't access auth schema)
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT '00000000-0000-0000-0000-000000000001'::UUID; -- Default tenant for now
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO authenticated;

-- Create tenant isolation policies using the public function
CREATE POLICY "tenant_isolation" ON tenants FOR ALL USING (id = get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON tenant_users FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON athletes FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON parents FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON skills FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON focus_areas FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON bookings FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON availability FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON events FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON waivers FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON testimonials FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON site_content FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY "tenant_isolation" ON site_faqs FOR ALL USING (tenant_id = get_current_tenant_id());

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('tenants', 'athletes', 'skills', 'bookings')
ORDER BY tablename, policyname;
