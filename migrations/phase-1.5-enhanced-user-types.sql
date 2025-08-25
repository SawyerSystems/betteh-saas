-- =============================================================================
-- PHASE 1.5: ENHANCED USER TYPES & PLANS MIGRATION
-- =============================================================================
-- This migration implements the enhanced multi-tier user architecture
-- Supports both Individual and Organizational tenants with role hierarchies
-- =============================================================================

-- Step 1: Add tenant type enum
CREATE TYPE tenant_type AS ENUM (
  'individual',      -- Solo coach operations
  'organization'     -- Gym/multi-coach operations
);

-- Step 2: Enhance tenants table with new columns
ALTER TABLE tenants 
  ADD COLUMN tenant_type tenant_type NOT NULL DEFAULT 'individual',
  ADD COLUMN parent_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  ADD COLUMN coach_count INTEGER DEFAULT 1 CHECK (coach_count > 0);

-- Add constraint for tenant type
ALTER TABLE tenants ADD CONSTRAINT tenants_tenant_type_check 
  CHECK (tenant_type IN ('individual', 'organization'));

-- Add index for parent-child tenant relationships
CREATE INDEX idx_tenants_parent_tenant_id ON tenants(parent_tenant_id) WHERE parent_tenant_id IS NOT NULL;

-- Step 3: Add new user roles to existing enum
-- Note: PostgreSQL doesn't allow adding values to existing enums directly
-- We need to create a new enum and migrate
ALTER TYPE tenant_user_role ADD VALUE 'gym_owner';
ALTER TYPE tenant_user_role ADD VALUE 'head_coach';
ALTER TYPE tenant_user_role ADD VALUE 'assistant_coach';
ALTER TYPE tenant_user_role ADD VALUE 'front_desk';

-- Step 4: Enhance feature_plans table
ALTER TABLE feature_plans 
  ADD COLUMN tenant_type tenant_type NOT NULL DEFAULT 'individual',
  ADD COLUMN is_per_seat BOOLEAN DEFAULT false,
  ADD COLUMN max_coaches INTEGER DEFAULT 1;

-- Step 5: Create locations table for multi-location organizations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address JSONB,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS and indexes for locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy for locations
CREATE POLICY "locations_tenant_isolation" ON locations
  FOR ALL TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- Platform admin full access
CREATE POLICY "locations_platform_admin_full_access" ON locations
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'platform_admin');

-- Indexes for locations
CREATE INDEX idx_locations_tenant_id ON locations(tenant_id);
CREATE INDEX idx_locations_is_primary ON locations(tenant_id, is_primary) WHERE is_primary = true;

-- Step 6: Create staff_locations table for location-based access
CREATE TABLE staff_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id, location_id)
);

-- Add RLS for staff_locations
ALTER TABLE staff_locations ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY "staff_locations_tenant_isolation" ON staff_locations
  FOR ALL TO authenticated
  USING (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- Platform admin full access
CREATE POLICY "staff_locations_platform_admin_full_access" ON staff_locations
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'platform_admin');

-- Indexes for staff_locations
CREATE INDEX idx_staff_locations_tenant_id ON staff_locations(tenant_id);
CREATE INDEX idx_staff_locations_user_id ON staff_locations(user_id);
CREATE INDEX idx_staff_locations_location_id ON staff_locations(location_id);

-- Step 7: Create organization_hierarchy table for multi-level organizations
CREATE TABLE organization_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  child_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'location', -- 'location', 'franchise', 'division'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_tenant_id, child_tenant_id),
  CHECK (parent_tenant_id != child_tenant_id)
);

-- Add RLS for organization_hierarchy
ALTER TABLE organization_hierarchy ENABLE ROW LEVEL SECURITY;

-- Platform admin and organization owners can manage hierarchy
CREATE POLICY "organization_hierarchy_admin_access" ON organization_hierarchy
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'platform_admin' OR
    parent_tenant_id::text = auth.jwt() ->> 'tenant_id' OR
    child_tenant_id::text = auth.jwt() ->> 'tenant_id'
  );

-- Indexes for organization_hierarchy
CREATE INDEX idx_organization_hierarchy_parent ON organization_hierarchy(parent_tenant_id);
CREATE INDEX idx_organization_hierarchy_child ON organization_hierarchy(child_tenant_id);

-- Step 8: Migrate existing data
-- Set all existing tenants to 'individual' type (already default)
-- Create default location for each existing tenant
INSERT INTO locations (tenant_id, name, is_primary, timezone)
SELECT 
  id,
  'Main Location',
  true,
  COALESCE(timezone, 'UTC')
FROM tenants
WHERE NOT EXISTS (
  SELECT 1 FROM locations WHERE locations.tenant_id = tenants.id
);

-- Step 9: Add constraints and final indexes
-- Ensure each tenant has at least one primary location
-- This will be enforced at the application level for now

-- Add composite indexes for performance
CREATE INDEX idx_tenants_type_status ON tenants(tenant_type, status);
CREATE INDEX idx_feature_plans_tenant_type ON feature_plans(tenant_type, is_per_seat);

-- Step 10: Create enhanced feature plans for different tenant types and tiers
INSERT INTO feature_plans (code, name, description, limits, price_lookup_key, tenant_type, is_per_seat, max_coaches) VALUES

-- Individual Coach Plans
('individual-solo', 'Solo Coach', 'Perfect for individual coaches starting out', 
 '{
   "maxAthletes": 25,
   "maxMonthlyBookings": 100,
   "maxStaff": 1,
   "maxLocations": 1,
   "features": {
     "videoAnalysis": false,
     "advancedReporting": false,
     "customBranding": false,
     "apiAccess": false,
     "multiLocation": false,
     "whiteLabel": false,
     "customIntegrations": false
   }
 }'::jsonb, 
 'solo_monthly', 'individual', false, 1),

('individual-pro', 'Pro Coach', 'Advanced features for professional coaches', 
 '{
   "maxAthletes": -1,
   "maxMonthlyBookings": -1,
   "maxStaff": 1,
   "maxLocations": 1,
   "features": {
     "videoAnalysis": true,
     "advancedReporting": true,
     "customBranding": true,
     "apiAccess": true,
     "multiLocation": false,
     "whiteLabel": false,
     "customIntegrations": false
   }
 }'::jsonb, 
 'pro_monthly', 'individual', false, 1),

-- Organizational Plans (seat-based)
('org-starter', 'Starter', 'Perfect for small gymnastics programs', 
 '{
   "maxAthletes": -1,
   "maxMonthlyBookings": -1,
   "maxStaff": 5,
   "maxLocations": 1,
   "features": {
     "videoAnalysis": true,
     "advancedReporting": true,
     "customBranding": true,
     "apiAccess": true,
     "multiLocation": false,
     "whiteLabel": false,
     "customIntegrations": false
   }
 }'::jsonb, 
 'org_starter_monthly', 'organization', true, 5),

('org-professional', 'Professional', 'Advanced features for growing organizations', 
 '{
   "maxAthletes": -1,
   "maxMonthlyBookings": -1,
   "maxStaff": 25,
   "maxLocations": 5,
   "features": {
     "videoAnalysis": true,
     "advancedReporting": true,
     "customBranding": true,
     "apiAccess": true,
     "multiLocation": true,
     "whiteLabel": false,
     "customIntegrations": false
   }
 }'::jsonb, 
 'org_professional_monthly', 'organization', true, 25),

('org-enterprise', 'Enterprise', 'Complete solution for large organizations', 
 '{
   "maxAthletes": -1,
   "maxMonthlyBookings": -1,
   "maxStaff": -1,
   "maxLocations": -1,
   "features": {
     "videoAnalysis": true,
     "advancedReporting": true,
     "customBranding": true,
     "apiAccess": true,
     "multiLocation": true,
     "whiteLabel": true,
     "customIntegrations": true
   }
 }'::jsonb, 
 'org_enterprise_monthly', 'organization', true, -1)

ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify tenant types
SELECT tenant_type, COUNT(*) as count FROM tenants GROUP BY tenant_type;

-- Verify locations created
SELECT t.name as tenant_name, l.name as location_name, l.is_primary 
FROM tenants t 
JOIN locations l ON t.id = l.tenant_id 
ORDER BY t.name;

-- Verify feature plans created
SELECT code, name, tenant_type, is_per_seat, max_coaches 
FROM feature_plans 
WHERE tenant_type IS NOT NULL
ORDER BY tenant_type, max_coaches;

-- =============================================================================
-- ROLLBACK PLAN (if needed)
-- =============================================================================
/*
-- To rollback this migration:

-- Remove new feature plans
DELETE FROM feature_plans WHERE tenant_type IS NOT NULL;

-- Drop new tables
DROP TABLE IF EXISTS organization_hierarchy CASCADE;
DROP TABLE IF EXISTS staff_locations CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

-- Remove new columns
ALTER TABLE feature_plans 
  DROP COLUMN IF EXISTS tenant_type,
  DROP COLUMN IF EXISTS is_per_seat,
  DROP COLUMN IF EXISTS max_coaches;

ALTER TABLE tenants 
  DROP COLUMN IF EXISTS tenant_type,
  DROP COLUMN IF EXISTS parent_tenant_id,
  DROP COLUMN IF EXISTS coach_count;

-- Drop enum type
DROP TYPE IF EXISTS tenant_type;

*/
