#!/usr/bin/env python3

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def enable_remaining_rls():
    """Enable RLS on all remaining tables from the linter errors"""
    
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
        
        # Tables that still need RLS enabled (from the linter errors)
        remaining_tables = [
            'feature_plans',
            'users', 
            'tenant_settings',
            'invitations',
            'activity_logs',
            'admins',
            'apparatus',
            'archived_waivers',
            'athlete_skills',
            'athlete_skill_videos',
            'lesson_types',
            'booking_athletes',
            'booking_focus_areas',
            'blog_posts',
            'events_recurrence_exceptions_backup',
            'genders',
            'gym_payout_rates',
            'gym_payout_runs',
            'parent_password_reset_tokens',
            'session',
            'side_quests',
            'site_inquiries',
            'skill_components',
            'skills_prerequisites',
            'tips'
        ]
        
        print(f"🔧 Enabling RLS on {len(remaining_tables)} remaining tables...")
        print()
        
        success_count = 0
        error_count = 0
        
        # Enable RLS on remaining tables
        for i, table in enumerate(remaining_tables):
            try:
                sql = f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;"
                print(f"[{i+1}/{len(remaining_tables)}] {sql}")
                cursor.execute(sql)
                print(f"   ✅ Success")
                success_count += 1
            except Exception as e:
                print(f"   ❌ Failed: {e}")
                error_count += 1
        
        print()
        print("="*60)
        print(f"📊 RLS Enablement Summary:")
        print(f"   ✅ Successful: {success_count}/{len(remaining_tables)}")
        print(f"   ❌ Failed: {error_count}/{len(remaining_tables)}")
        
        if error_count == 0:
            print("\n🎉 All remaining tables now have RLS enabled!")
        else:
            print(f"\n⚠️  {error_count} tables failed - may need manual intervention")
        
        # Test a few tables to see if RLS is working
        print("\n🧪 Testing RLS status on key tables...")
        
        test_tables = ['users', 'admins', 'apparatus', 'genders']
        for table in test_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table} LIMIT 1;")
                result = cursor.fetchone()
                print(f"   ✅ {table}: Query allowed (found {result[0] if result else 0} records)")
            except Exception as e:
                print(f"   🔒 {table}: Access blocked by RLS - {str(e)[:50]}...")
        
        cursor.close()
        conn.close()
        
        print("\n🎯 Next steps:")
        print("   1. Run: node scripts/check-rls-status.js")
        print("   2. Check Supabase linter for remaining RLS errors")
        print("   3. Create policies for tables that need data access")
        
        return success_count == len(remaining_tables)
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🔒 Starting Remaining RLS Migration...")
    print()
    
    success = enable_remaining_rls()
    
    if success:
        print("\n✅ RLS migration completed successfully!")
    else:
        print("\n❌ RLS migration completed with some errors")
