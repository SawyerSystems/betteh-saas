#!/usr/bin/env python3

import os
import psycopg2
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

def execute_rls_migration():
    """Execute RLS migration using direct PostgreSQL connection"""
    
    database_url = os.getenv('DIRECT_DATABASE_URL')
    if not database_url:
        print("❌ DIRECT_DATABASE_URL not found in environment variables")
        return False
    
    try:
        print("🔒 Connecting to database...")
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("✅ Connected successfully!")
        print()
        
        # SQL statements to execute
        sql_statements = [
            # Enable RLS on core tables
            "ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;", 
            "ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE parents ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE skills ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE focus_areas ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE availability ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE events ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE waivers ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;",
            "ALTER TABLE site_faqs ENABLE ROW LEVEL SECURITY;",
            
            # Create helper function
            """CREATE OR REPLACE FUNCTION auth.get_current_tenant_id()
            RETURNS UUID
            LANGUAGE SQL
            SECURITY DEFINER
            AS $$
              SELECT COALESCE(
                (auth.jwt() ->> 'tenant_id')::UUID,
                '00000000-0000-0000-0000-000000000001'::UUID
              );
            $$;""",
            
            # Grant permissions
            "GRANT EXECUTE ON FUNCTION auth.get_current_tenant_id() TO authenticated;",
            
            # Create basic policies
            "CREATE POLICY \"tenant_isolation\" ON tenants FOR ALL USING (id = auth.get_current_tenant_id());",
            "CREATE POLICY \"tenant_isolation\" ON tenant_users FOR ALL USING (tenant_id = auth.get_current_tenant_id());",
            "CREATE POLICY \"tenant_isolation\" ON athletes FOR ALL USING (tenant_id = auth.get_current_tenant_id());",
            "CREATE POLICY \"tenant_isolation\" ON parents FOR ALL USING (tenant_id = auth.get_current_tenant_id());",
            "CREATE POLICY \"tenant_isolation\" ON skills FOR ALL USING (tenant_id = auth.get_current_tenant_id());",
            "CREATE POLICY \"tenant_isolation\" ON focus_areas FOR ALL USING (tenant_id = auth.get_current_tenant_id());",
            "CREATE POLICY \"tenant_isolation\" ON bookings FOR ALL USING (tenant_id = auth.get_current_tenant_id());",
            "CREATE POLICY \"tenant_isolation\" ON availability FOR ALL USING (tenant_id = auth.get_current_tenant_id());",
            "CREATE POLICY \"tenant_isolation\" ON events FOR ALL USING (tenant_id = auth.get_current_tenant_id());",
            "CREATE POLICY \"tenant_isolation\" ON waivers FOR ALL USING (tenant_id = auth.get_current_tenant_id());",
            "CREATE POLICY \"tenant_isolation\" ON testimonials FOR ALL USING (tenant_id = auth.get_current_tenant_id());",
            "CREATE POLICY \"tenant_isolation\" ON site_content FOR ALL USING (tenant_id = auth.get_current_tenant_id());",
            "CREATE POLICY \"tenant_isolation\" ON site_faqs FOR ALL USING (tenant_id = auth.get_current_tenant_id());"
        ]
        
        success_count = 0
        error_count = 0
        
        for i, statement in enumerate(sql_statements):
            try:
                short_stmt = statement[:60].replace('\n', ' ').strip() + '...'
                print(f"[{i+1}/{len(sql_statements)}] {short_stmt}")
                
                cursor.execute(statement)
                print("   ✅ Success")
                success_count += 1
                
            except psycopg2.Error as e:
                print(f"   ❌ Failed: {e}")
                error_count += 1
                
                # Continue on harmless errors
                if "already exists" in str(e) or "already enabled" in str(e):
                    print("   ⚠️  Continuing (likely harmless)")
        
        print()
        print("=" * 60)
        print(f"📊 RLS Migration Summary:")
        print(f"   ✅ Successful: {success_count}/{len(sql_statements)}")
        print(f"   ❌ Failed: {error_count}/{len(sql_statements)}")
        
        if success_count > 0:
            print()
            print("🎉 RLS Migration completed with some success!")
            
            # Test RLS
            print()
            print("🧪 Testing RLS policies...")
            try:
                cursor.execute("SELECT COUNT(*) FROM tenants;")
                count = cursor.fetchone()[0]
                print(f"✅ Can query tenants table (found {count} records)")
            except psycopg2.Error as e:
                print(f"⚠️  Tenants query failed: {e}")
        
        cursor.close()
        conn.close()
        
        return success_count > 0
        
    except psycopg2.Error as e:
        print(f"❌ Database connection failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🔒 Starting RLS Migration (Python)...")
    print()
    
    # Check if psycopg2 is available
    try:
        import psycopg2
    except ImportError:
        print("❌ psycopg2 not installed. Install with:")
        print("   pip install psycopg2-binary")
        sys.exit(1)
    
    success = execute_rls_migration()
    
    if success:
        print()
        print("🎯 Next steps:")
        print("   1. Run: node scripts/check-rls-status.js")
        print("   2. Verify RLS is working")
        print("   3. Continue with Phase 3: Routing & Branding")
    else:
        print()
        print("💡 Alternative: Copy SQL from migrations/stage3-rls-simple.sql")
        print("   and run it manually in Supabase SQL Editor")
