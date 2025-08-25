#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeRLSMigration() {
  console.log('🔒 Executing RLS Migration...\n');

  // Define the SQL statements to execute in order
  const sqlStatements = [
    // Enable RLS on core tables
    'ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE feature_plans ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE users ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE admins ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE parents ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE skills ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE focus_areas ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE availability ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE events ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE waivers ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE site_faqs ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE lesson_types ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE apparatus ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE athlete_skills ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE athlete_skill_videos ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE booking_athletes ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE booking_focus_areas ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE archived_waivers ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE side_quests ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE tips ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE skill_components ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE skills_prerequisites ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE site_inquiries ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE gym_payout_rates ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE gym_payout_runs ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE parent_password_reset_tokens ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE session ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE genders ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE events_recurrence_exceptions_backup ENABLE ROW LEVEL SECURITY;',
    
    // Create helper function
    `CREATE OR REPLACE FUNCTION auth.get_current_tenant_id()
     RETURNS UUID
     LANGUAGE SQL
     SECURITY DEFINER
     AS $$
       SELECT COALESCE(
         (auth.jwt() ->> 'tenant_id')::UUID,
         '00000000-0000-0000-0000-000000000001'::UUID
       );
     $$;`,
    
    // Grant permissions
    'GRANT EXECUTE ON FUNCTION auth.get_current_tenant_id() TO authenticated;',
    
    // Create core policies
    'CREATE POLICY "tenant_isolation" ON tenants FOR ALL USING (id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON tenant_users FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON athletes FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON parents FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON skills FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON focus_areas FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON bookings FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON availability FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON events FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON waivers FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON testimonials FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON site_content FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON site_faqs FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON lesson_types FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON apparatus FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON archived_waivers FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON blog_posts FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON side_quests FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON tips FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON site_inquiries FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON gym_payout_rates FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    'CREATE POLICY "tenant_isolation" ON gym_payout_runs FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    
    // Junction table policies (check parent table)
    `CREATE POLICY "tenant_isolation" ON athlete_skills FOR ALL USING (
      EXISTS (
        SELECT 1 FROM athletes a 
        WHERE a.id = athlete_skills.athlete_id 
        AND a.tenant_id = auth.get_current_tenant_id()
      )
    );`,
    
    `CREATE POLICY "tenant_isolation" ON athlete_skill_videos FOR ALL USING (
      EXISTS (
        SELECT 1 FROM athlete_skills asv
        JOIN athletes a ON a.id = asv.athlete_id
        WHERE asv.id = athlete_skill_videos.athlete_skill_id 
        AND a.tenant_id = auth.get_current_tenant_id()
      )
    );`,
    
    `CREATE POLICY "tenant_isolation" ON booking_athletes FOR ALL USING (
      EXISTS (
        SELECT 1 FROM bookings b 
        WHERE b.id = booking_athletes.booking_id 
        AND b.tenant_id = auth.get_current_tenant_id()
      )
    );`,
    
    `CREATE POLICY "tenant_isolation" ON booking_focus_areas FOR ALL USING (
      EXISTS (
        SELECT 1 FROM bookings b 
        WHERE b.id = booking_focus_areas.booking_id 
        AND b.tenant_id = auth.get_current_tenant_id()
      )
    );`,
    
    `CREATE POLICY "tenant_isolation" ON skill_components FOR ALL USING (
      EXISTS (
        SELECT 1 FROM skills s 
        WHERE s.id = skill_components.skill_id 
        AND s.tenant_id = auth.get_current_tenant_id()
      )
    );`,
    
    `CREATE POLICY "tenant_isolation" ON skills_prerequisites FOR ALL USING (
      EXISTS (
        SELECT 1 FROM skills s 
        WHERE s.id = skills_prerequisites.skill_id 
        AND s.tenant_id = auth.get_current_tenant_id()
      )
    );`,
    
    `CREATE POLICY "tenant_isolation" ON parent_password_reset_tokens FOR ALL USING (
      EXISTS (
        SELECT 1 FROM parents p 
        WHERE p.id = parent_password_reset_tokens.parent_id 
        AND p.tenant_id = auth.get_current_tenant_id()
      )
    );`,
    
    // Reference data - allow read access to authenticated users
    'CREATE POLICY "public_read" ON genders FOR SELECT USING (auth.role() = \'authenticated\');',
    
    // Session table - user isolation
    'CREATE POLICY "user_isolation" ON session FOR ALL USING (user_id = auth.uid());',
    
    // Users table - tenant-based access
    `CREATE POLICY "tenant_isolation" ON users FOR ALL USING (
      EXISTS (
        SELECT 1 FROM tenant_users tu 
        WHERE tu.user_id = users.id 
        AND tu.tenant_id = auth.get_current_tenant_id()
      )
    );`,
    
    // Admins table
    'CREATE POLICY "tenant_isolation" ON admins FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    
    // Activity logs
    'CREATE POLICY "tenant_isolation" ON activity_logs FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    
    // Feature plans
    'CREATE POLICY "tenant_isolation" ON feature_plans FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    
    // Invitations
    'CREATE POLICY "tenant_isolation" ON invitations FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    
    // Tenant settings
    'CREATE POLICY "tenant_isolation" ON tenant_settings FOR ALL USING (tenant_id = auth.get_current_tenant_id());',
    
    // Events backup table
    `CREATE POLICY "tenant_isolation" ON events_recurrence_exceptions_backup FOR ALL USING (
      EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = events_recurrence_exceptions_backup.event_id 
        AND e.tenant_id = auth.get_current_tenant_id()
      )
    );`
  ];

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i];
    const shortStatement = statement.substring(0, 60).replace(/\s+/g, ' ') + '...';
    
    try {
      console.log(`[${i + 1}/${sqlStatements.length}] ${shortStatement}`);
      
      // Execute using the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: statement })
      });
      
      if (!response.ok) {
        // Try an alternative approach - use a direct query
        const { error } = await supabase
          .rpc('exec', { sql: statement });
          
        if (error) {
          throw error;
        }
      }
      
      console.log(`   ✅ Success`);
      successCount++;
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      errors.push({ statement: shortStatement, error: error.message });
      errorCount++;
      
      // Continue with non-critical errors
      if (error.message.includes('already exists') || 
          error.message.includes('already enabled') ||
          error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log(`   ⚠️  Continuing (likely harmless)`);
      }
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 RLS Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}/${sqlStatements.length}`);
  console.log(`   ❌ Failed: ${errorCount}/${sqlStatements.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(({ statement, error }) => {
      console.log(`   - ${statement}: ${error}`);
    });
  }
  
  if (successCount > 0) {
    console.log('\n🎉 RLS Migration completed with some success!');
    console.log('\n🧪 Running verification test...');
    
    // Run verification
    await verifyRLS();
  }
}

async function verifyRLS() {
  try {
    console.log('\n🔍 Testing RLS policies...');
    
    // Test with anon client (no auth)
    const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey);
    
    const { data: tenants, error: tenantsError } = await anonClient
      .from('tenants')
      .select('id, slug')
      .limit(1);
    
    if (tenantsError && tenantsError.code === 'PGRST116') {
      console.log('✅ Tenants table properly protected by RLS');
    } else if (tenantsError) {
      console.log(`⚠️  Tenants table error: ${tenantsError.message}`);
    } else {
      console.log(`⚠️  Tenants table still accessible (returned ${tenants?.length || 0} records)`);
    }
    
    const { data: skills, error: skillsError } = await anonClient
      .from('skills')
      .select('id, name')
      .limit(1);
    
    if (skillsError && skillsError.code === 'PGRST116') {
      console.log('✅ Skills table properly protected by RLS');
    } else if (skillsError) {
      console.log(`⚠️  Skills table error: ${skillsError.message}`);
    } else {
      console.log(`⚠️  Skills table still accessible (returned ${skills?.length || 0} records)`);
    }
    
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  executeRLSMigration().catch(console.error);
}

export { executeRLSMigration };
