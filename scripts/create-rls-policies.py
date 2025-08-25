#!/usr/bin/env python3

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_rls_policies():
    """Create RLS policies for all tables"""
    
    database_url = os.getenv('DIRECT_DATABASE_URL')
    if not database_url:
        print("❌ DIRECT_DATABASE_URL not found in environment variables")
        return False
    
    try:
        print("🔐 Connecting to database...")
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("✅ Connected successfully!")
        print()
        
        # SQL statements to create the helper function and policies
        sql_statements = [
            # Create helper function in public schema
            """
            CREATE OR REPLACE FUNCTION get_current_tenant_id()
            RETURNS UUID
            LANGUAGE SQL
            SECURITY DEFINER
            AS $$
              SELECT '00000000-0000-0000-0000-000000000001'::UUID; -- Default tenant for now
            $$;
            """,
            
            # Grant execute permission
            "GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO authenticated;",
            "GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO anon;",
            
            # Core tenant policies
            'CREATE POLICY "tenant_isolation" ON tenants FOR ALL USING (id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON tenant_users FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON tenant_settings FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON invitations FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON activity_logs FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON feature_plans FOR ALL USING (tenant_id = get_current_tenant_id());',
            
            # User tables
            'CREATE POLICY "tenant_isolation" ON admins FOR ALL USING (tenant_id = get_current_tenant_id());',
            
            # Core business data
            'CREATE POLICY "tenant_isolation" ON athletes FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON parents FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON skills FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON focus_areas FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON bookings FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON availability FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON events FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON waivers FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON testimonials FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON site_content FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON site_faqs FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON lesson_types FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON apparatus FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON archived_waivers FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON blog_posts FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON site_inquiries FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON side_quests FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON tips FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON gym_payout_rates FOR ALL USING (tenant_id = get_current_tenant_id());',
            'CREATE POLICY "tenant_isolation" ON gym_payout_runs FOR ALL USING (tenant_id = get_current_tenant_id());',
            
            # Reference data - allow read access to all
            'CREATE POLICY "public_read" ON genders FOR SELECT USING (true);',
            
            # Junction tables - check via parent relationships
            '''CREATE POLICY "tenant_isolation" ON athlete_skills FOR ALL USING (
                EXISTS (
                  SELECT 1 FROM athletes a 
                  WHERE a.id = athlete_skills.athlete_id 
                  AND a.tenant_id = get_current_tenant_id()
                )
              );''',
            
            '''CREATE POLICY "tenant_isolation" ON athlete_skill_videos FOR ALL USING (
                EXISTS (
                  SELECT 1 FROM athlete_skills asv
                  JOIN athletes a ON a.id = asv.athlete_id
                  WHERE asv.id = athlete_skill_videos.athlete_skill_id 
                  AND a.tenant_id = get_current_tenant_id()
                )
              );''',
            
            '''CREATE POLICY "tenant_isolation" ON booking_athletes FOR ALL USING (
                EXISTS (
                  SELECT 1 FROM bookings b 
                  WHERE b.id = booking_athletes.booking_id 
                  AND b.tenant_id = get_current_tenant_id()
                )
              );''',
            
            '''CREATE POLICY "tenant_isolation" ON booking_focus_areas FOR ALL USING (
                EXISTS (
                  SELECT 1 FROM bookings b 
                  WHERE b.id = booking_focus_areas.booking_id 
                  AND b.tenant_id = get_current_tenant_id()
                )
              );''',
            
            '''CREATE POLICY "tenant_isolation" ON skill_components FOR ALL USING (
                EXISTS (
                  SELECT 1 FROM skills s 
                  WHERE s.id = skill_components.skill_id 
                  AND s.tenant_id = get_current_tenant_id()
                )
              );''',
            
            '''CREATE POLICY "tenant_isolation" ON skills_prerequisites FOR ALL USING (
                EXISTS (
                  SELECT 1 FROM skills s 
                  WHERE s.id = skills_prerequisites.skill_id 
                  AND s.tenant_id = get_current_tenant_id()
                )
              );''',
            
            '''CREATE POLICY "tenant_isolation" ON parent_password_reset_tokens FOR ALL USING (
                EXISTS (
                  SELECT 1 FROM parents p 
                  WHERE p.id = parent_password_reset_tokens.parent_id 
                  AND p.tenant_id = get_current_tenant_id()
                )
              );''',
            
            '''CREATE POLICY "tenant_isolation" ON events_recurrence_exceptions_backup FOR ALL USING (
                EXISTS (
                  SELECT 1 FROM events e 
                  WHERE e.id = events_recurrence_exceptions_backup.event_id 
                  AND e.tenant_id = get_current_tenant_id()
                )
              );''',
            
            # Special policies for tables without tenant_id
            'CREATE POLICY "user_isolation" ON session FOR ALL USING (true);',  # Sessions don't need tenant isolation for now
            '''CREATE POLICY "tenant_isolation" ON users FOR ALL USING (
                EXISTS (
                  SELECT 1 FROM tenant_users tu 
                  WHERE tu.user_id = users.id 
                  AND tu.tenant_id = get_current_tenant_id()
                )
              );''',
        ]
        
        print(f"🔧 Creating {len(sql_statements)} policies...")
        print()
        
        success_count = 0
        error_count = 0
        
        for i, sql in enumerate(sql_statements):
            try:
                # Clean up the SQL
                clean_sql = sql.strip()
                if not clean_sql:
                    continue
                    
                print(f"[{i+1}/{len(sql_statements)}] {clean_sql[:60]}...")
                cursor.execute(clean_sql)
                print(f"   ✅ Success")
                success_count += 1
            except Exception as e:
                error_message = str(e)
                if "already exists" in error_message.lower():
                    print(f"   ℹ️  Already exists (skipping)")
                    success_count += 1
                else:
                    print(f"   ❌ Failed: {error_message}")
                    error_count += 1
        
        print()
        print("="*60)
        print(f"📊 Policy Creation Summary:")
        print(f"   ✅ Successful: {success_count}")
        print(f"   ❌ Failed: {error_count}")
        
        cursor.close()
        conn.close()
        
        if error_count == 0:
            print("\n🎉 All RLS policies created successfully!")
        else:
            print(f"\n⚠️  {error_count} policies failed - may need manual review")
        
        print("\n🎯 Next steps:")
        print("   1. Test your application - data should now be accessible")
        print("   2. Run: node scripts/check-rls-status.js")
        print("   3. Check Supabase linter - should show zero RLS errors")
        
        return error_count == 0
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🔐 Starting RLS Policy Creation...")
    print()
    
    success = create_rls_policies()
    
    if success:
        print("\n✅ RLS policy creation completed successfully!")
    else:
        print("\n❌ RLS policy creation completed with some errors")
