-- Fix the remaining statements from stage4-supabase-auth-setup.sql

-- 1. Add foreign key constraint for tenant_users -> auth.users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tenant_users_user_id_fkey_auth'
    ) THEN
        ALTER TABLE tenant_users
        ADD CONSTRAINT tenant_users_user_id_fkey_auth
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Create the new user handler function
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

-- 3. Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- 4. Summary message
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
