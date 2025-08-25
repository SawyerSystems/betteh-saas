-- Stage 4: Supabase Auth Multi-Tenant Setup
-- This migration sets up Supabase Auth with custom claims for multi-tenant support

-- =============================================================================
-- STEP 1: Create function to update JWT claims when tenant_users changes
-- =============================================================================

CREATE OR REPLACE FUNCTION update_user_jwt_claims()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users.app_metadata with tenant membership
  UPDATE auth.users 
  SET app_metadata = COALESCE(app_metadata, '{}'::jsonb) || 
    jsonb_build_object(
      'tenant_id', NEW.tenant_id::text,
      'role', NEW.role,
      'tenant_memberships', (
        SELECT jsonb_object_agg(
          tu.tenant_id::text, 
          jsonb_build_object('role', tu.role, 'status', tu.status)
        )
        FROM tenant_users tu 
        WHERE tu.user_id = NEW.user_id
      )
    )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_jwt_claims() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_jwt_claims() TO service_role;

-- =============================================================================
-- STEP 2: Create trigger on tenant_users insert/update
-- =============================================================================

DROP TRIGGER IF EXISTS update_jwt_claims_trigger ON tenant_users;

CREATE TRIGGER update_jwt_claims_trigger
  AFTER INSERT OR UPDATE ON tenant_users
  FOR EACH ROW EXECUTE FUNCTION update_user_jwt_claims();

-- =============================================================================
-- STEP 3: Update RLS policies to use Supabase JWT claims
-- =============================================================================

-- Drop existing tenant isolation policies and recreate with JWT claims
DO $$
DECLARE
    table_record RECORD;
    policy_name TEXT;
BEGIN
    -- List of tables that need tenant isolation policies
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'athletes', 'parents', 'skills', 'focus_areas', 'bookings', 
            'availability', 'events', 'waivers', 'testimonials', 'site_content',
            'site_faqs', 'lesson_types', 'apparatus', 'archived_waivers',
            'blog_posts', 'site_inquiries', 'side_quests', 'tips',
            'gym_payout_rates', 'gym_payout_runs', 'athlete_skills',
            'athlete_skill_videos', 'booking_athletes', 'booking_focus_areas',
            'skills_prerequisites', 'parent_password_reset_tokens'
        )
    LOOP
        -- Drop existing tenant_isolation policy if it exists
        policy_name := 'tenant_isolation';
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_record.tablename);
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Ignore if policy doesn't exist
        END;
        
        -- Create new policy using JWT claims
        EXECUTE format('
            CREATE POLICY %I ON %I
            FOR ALL TO authenticated
            USING (tenant_id::text = COALESCE(auth.jwt() ->> ''tenant_id'', auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))
        ', policy_name, table_record.tablename);
        
        RAISE NOTICE 'Updated policy % on table %', policy_name, table_record.tablename;
    END LOOP;
END $$;

-- =============================================================================
-- STEP 4: Create service role bypass policies for system operations
-- =============================================================================

-- Allow service role to bypass RLS for system operations
CREATE POLICY "service_role_bypass" ON site_content 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass" ON testimonials 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass" ON site_faqs 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass" ON bookings 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass" ON athletes 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_bypass" ON parents 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- =============================================================================
-- STEP 5: Create helper function to get current tenant from JWT
-- =============================================================================

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::UUID,
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID  -- Default tenant fallback
  );
$$;

GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO anon;

-- =============================================================================
-- STEP 6: Create users table for Supabase Auth integration
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Service role full access" ON users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- STEP 7: Update tenant_users to reference auth.users
-- =============================================================================

-- Add foreign key constraint to ensure tenant_users.user_id references auth.users.id
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tenant_users_user_id_fkey_auth'
    ) THEN
        -- Add the constraint
        ALTER TABLE tenant_users 
        ADD CONSTRAINT tenant_users_user_id_fkey_auth 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================================================
-- STEP 8: Create function to handle new user creation
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table when new auth.user is created
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- If user has tenant_id in app_metadata, add them to tenant_users
  IF NEW.raw_app_meta_data->>'tenant_id' IS NOT NULL THEN
    INSERT INTO tenant_users (tenant_id, user_id, role, status)
    VALUES (
      (NEW.raw_app_meta_data->>'tenant_id')::UUID,
      NEW.id,
      COALESCE(NEW.raw_app_meta_data->>'role', 'parent'),
      'active'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- =============================================================================
-- SUMMARY
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Stage 4: Supabase Auth Multi-Tenant Setup COMPLETE';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '✅ JWT claims update function created';
  RAISE NOTICE '✅ Trigger for tenant_users changes created';
  RAISE NOTICE '✅ RLS policies updated to use JWT claims';
  RAISE NOTICE '✅ Service role bypass policies created';
  RAISE NOTICE '✅ Helper functions for tenant resolution created';
  RAISE NOTICE '✅ Users table created and linked to auth.users';
  RAISE NOTICE '✅ New user creation handler implemented';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '   1. Update server code to use Supabase Auth';
  RAISE NOTICE '   2. Implement dual auth middleware';
  RAISE NOTICE '   3. Test JWT claims and RLS policies';
  RAISE NOTICE '=================================================================';
END $$;
