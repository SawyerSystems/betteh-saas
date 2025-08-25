-- Stage 3: Enable Row Level Security (RLS) and Create Tenant Isolation Policies
-- This migration enables RLS on all tables and creates policies for tenant isolation

-- =============================================================================
-- STEP 1: Enable RLS on all tables
-- =============================================================================

-- Core tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_plans ENABLE ROW LEVEL SECURITY;

-- User and admin tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE session ENABLE ROW LEVEL SECURITY;

-- Athletes and parents
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Skills and apparatus (tenant-specific)
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_skill_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE apparatus ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_prerequisites ENABLE ROW LEVEL SECURITY;

-- Focus areas and lesson types
ALTER TABLE focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_types ENABLE ROW LEVEL SECURITY;

-- Booking system
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Events and calendar
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_recurrence_exceptions_backup ENABLE ROW LEVEL SECURITY;

-- Content management
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Waivers and documentation
ALTER TABLE waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_waivers ENABLE ROW LEVEL SECURITY;

-- Gamification and tips
ALTER TABLE side_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Reference data (might not need tenant isolation)
ALTER TABLE genders ENABLE ROW LEVEL SECURITY;

-- Financial/payout system
ALTER TABLE gym_payout_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_payout_runs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 2: Create helper function for tenant extraction from JWT
-- =============================================================================

CREATE OR REPLACE FUNCTION auth.get_current_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID  -- Default tenant fallback
  );
$$;

-- =============================================================================
-- STEP 3: Create RLS policies for tenant isolation
-- =============================================================================

-- TENANTS table - users can only see their own tenant
CREATE POLICY "tenant_isolation" ON tenants
  FOR ALL USING (id = auth.get_current_tenant_id());

-- TENANT_USERS table - users can only see users in their tenant
CREATE POLICY "tenant_isolation" ON tenant_users
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- TENANT_SETTINGS table - users can only see settings for their tenant
CREATE POLICY "tenant_isolation" ON tenant_settings
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- INVITATIONS table - users can only see invitations for their tenant
CREATE POLICY "tenant_isolation" ON invitations
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- ACTIVITY_LOGS table - users can only see logs for their tenant
CREATE POLICY "tenant_isolation" ON activity_logs
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- FEATURE_PLANS table - users can only see plans for their tenant
CREATE POLICY "tenant_isolation" ON feature_plans
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- USERS table - users can only see users in their tenant
CREATE POLICY "tenant_isolation" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_users tu 
      WHERE tu.user_id = users.id 
      AND tu.tenant_id = auth.get_current_tenant_id()
    )
  );

-- ADMINS table - admins can only see admin records for their tenant
CREATE POLICY "tenant_isolation" ON admins
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- SESSION table - users can only access their own sessions
CREATE POLICY "user_isolation" ON session
  FOR ALL USING (user_id = auth.uid());

-- ATHLETES table - users can only see athletes in their tenant
CREATE POLICY "tenant_isolation" ON athletes
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- PARENTS table - users can only see parents in their tenant
CREATE POLICY "tenant_isolation" ON parents
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- PARENT_PASSWORD_RESET_TOKENS table - users can only see tokens for their tenant
CREATE POLICY "tenant_isolation" ON parent_password_reset_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM parents p 
      WHERE p.id = parent_password_reset_tokens.parent_id 
      AND p.tenant_id = auth.get_current_tenant_id()
    )
  );

-- SKILLS table - users can only see skills for their tenant
CREATE POLICY "tenant_isolation" ON skills
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- ATHLETE_SKILLS table - users can only see athlete skills for their tenant
CREATE POLICY "tenant_isolation" ON athlete_skills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM athletes a 
      WHERE a.id = athlete_skills.athlete_id 
      AND a.tenant_id = auth.get_current_tenant_id()
    )
  );

-- ATHLETE_SKILL_VIDEOS table - users can only see videos for their tenant
CREATE POLICY "tenant_isolation" ON athlete_skill_videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM athlete_skills asv
      JOIN athletes a ON a.id = asv.athlete_id
      WHERE asv.id = athlete_skill_videos.athlete_skill_id 
      AND a.tenant_id = auth.get_current_tenant_id()
    )
  );

-- APPARATUS table - users can only see apparatus for their tenant
CREATE POLICY "tenant_isolation" ON apparatus
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- SKILL_COMPONENTS table - users can only see components for their tenant
CREATE POLICY "tenant_isolation" ON skill_components
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM skills s 
      WHERE s.id = skill_components.skill_id 
      AND s.tenant_id = auth.get_current_tenant_id()
    )
  );

-- SKILLS_PREREQUISITES table - users can only see prerequisites for their tenant
CREATE POLICY "tenant_isolation" ON skills_prerequisites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM skills s 
      WHERE s.id = skills_prerequisites.skill_id 
      AND s.tenant_id = auth.get_current_tenant_id()
    )
  );

-- FOCUS_AREAS table - users can only see focus areas for their tenant
CREATE POLICY "tenant_isolation" ON focus_areas
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- LESSON_TYPES table - users can only see lesson types for their tenant
CREATE POLICY "tenant_isolation" ON lesson_types
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- BOOKINGS table - users can only see bookings for their tenant
CREATE POLICY "tenant_isolation" ON bookings
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- BOOKING_ATHLETES table - users can only see booking athletes for their tenant
CREATE POLICY "tenant_isolation" ON booking_athletes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = booking_athletes.booking_id 
      AND b.tenant_id = auth.get_current_tenant_id()
    )
  );

-- BOOKING_FOCUS_AREAS table - users can only see booking focus areas for their tenant
CREATE POLICY "tenant_isolation" ON booking_focus_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.id = booking_focus_areas.booking_id 
      AND b.tenant_id = auth.get_current_tenant_id()
    )
  );

-- AVAILABILITY table - users can only see availability for their tenant
CREATE POLICY "tenant_isolation" ON availability
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- EVENTS table - users can only see events for their tenant
CREATE POLICY "tenant_isolation" ON events
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- EVENTS_RECURRENCE_EXCEPTIONS_BACKUP table - users can only see exceptions for their tenant
CREATE POLICY "tenant_isolation" ON events_recurrence_exceptions_backup
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = events_recurrence_exceptions_backup.event_id 
      AND e.tenant_id = auth.get_current_tenant_id()
    )
  );

-- SITE_CONTENT table - users can only see content for their tenant
CREATE POLICY "tenant_isolation" ON site_content
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- SITE_FAQS table - users can only see FAQs for their tenant
CREATE POLICY "tenant_isolation" ON site_faqs
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- SITE_INQUIRIES table - users can only see inquiries for their tenant
CREATE POLICY "tenant_isolation" ON site_inquiries
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- BLOG_POSTS table - users can only see blog posts for their tenant
CREATE POLICY "tenant_isolation" ON blog_posts
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- TESTIMONIALS table - users can only see testimonials for their tenant
CREATE POLICY "tenant_isolation" ON testimonials
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- WAIVERS table - users can only see waivers for their tenant
CREATE POLICY "tenant_isolation" ON waivers
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- ARCHIVED_WAIVERS table - users can only see archived waivers for their tenant
CREATE POLICY "tenant_isolation" ON archived_waivers
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- SIDE_QUESTS table - users can only see side quests for their tenant
CREATE POLICY "tenant_isolation" ON side_quests
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- TIPS table - users can only see tips for their tenant
CREATE POLICY "tenant_isolation" ON tips
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- GYM_PAYOUT_RATES table - users can only see payout rates for their tenant
CREATE POLICY "tenant_isolation" ON gym_payout_rates
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- GYM_PAYOUT_RUNS table - users can only see payout runs for their tenant
CREATE POLICY "tenant_isolation" ON gym_payout_runs
  FOR ALL USING (tenant_id = auth.get_current_tenant_id());

-- GENDERS table - this is reference data, allow read access to all authenticated users
CREATE POLICY "public_read" ON genders
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================================================
-- STEP 4: Grant necessary permissions
-- =============================================================================

-- Grant execute permission on the tenant function to authenticated users
GRANT EXECUTE ON FUNCTION auth.get_current_tenant_id() TO authenticated;

-- =============================================================================
-- STEP 5: Create verification queries
-- =============================================================================

-- Function to verify RLS is enabled on all tables
CREATE OR REPLACE FUNCTION verify_rls_enabled()
RETURNS TABLE(table_name text, rls_enabled boolean, policy_count bigint)
LANGUAGE SQL
AS $$
  SELECT 
    t.table_name,
    t.row_security = 'YES' as rls_enabled,
    COALESCE(p.policy_count, 0) as policy_count
  FROM information_schema.tables t
  LEFT JOIN (
    SELECT 
      schemaname || '.' || tablename as table_name,
      COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename
  ) p ON 'public.' || t.table_name = p.table_name
  WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE '%backup%'
  ORDER BY t.table_name;
$$;

COMMENT ON FUNCTION verify_rls_enabled() IS 'Verify that RLS is enabled on all tables and show policy counts';
