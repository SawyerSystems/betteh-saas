#!/usr/bin/env python3

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def analyze_migration_progress():
    """Analyze the current state of multi-tenant migration"""
    
    database_url = os.getenv('DIRECT_DATABASE_URL')
    if not database_url:
        print("❌ DIRECT_DATABASE_URL not found in environment variables")
        return False
    
    try:
        print("🔍 Analyzing Multi-Tenant Migration Progress...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("✅ Connected successfully!")
        print()
        
        # Check what tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        all_tables = [row[0] for row in cursor.fetchall()]
        
        # Check for tenant_id columns
        cursor.execute("""
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND column_name = 'tenant_id'
            ORDER BY table_name;
        """)
        tables_with_tenant_id = [row[0] for row in cursor.fetchall()]
        
        # Check RLS enabled tables
        cursor.execute("""
            SELECT schemaname, tablename, rowsecurity
            FROM pg_tables
            WHERE schemaname = 'public'
            AND rowsecurity = true
            ORDER BY tablename;
        """)
        rls_enabled_tables = [row[1] for row in cursor.fetchall()]
        
        # Check existing policies
        cursor.execute("""
            SELECT schemaname, tablename, policyname
            FROM pg_policies
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname;
        """)
        policies = cursor.fetchall()
        
        # Check core multi-tenant tables
        core_tables = ['tenants', 'tenant_users', 'tenant_settings', 'feature_plans', 'invitations']
        existing_core_tables = [t for t in core_tables if t in all_tables]
        
        print("="*80)
        print("📊 MULTI-TENANT MIGRATION PROGRESS REPORT")
        print("="*80)
        
        print("\n1️⃣ CORE MULTI-TENANT TABLES:")
        for table in core_tables:
            status = "✅ EXISTS" if table in all_tables else "❌ MISSING"
            print(f"   {table:<20} {status}")
        
        completion_core = len(existing_core_tables) / len(core_tables) * 100
        print(f"\n   📈 Core Tables: {completion_core:.0f}% complete ({len(existing_core_tables)}/{len(core_tables)})")
        
        print(f"\n2️⃣ TENANT_ID COLUMN MIGRATION:")
        print(f"   📋 Total tables: {len(all_tables)}")
        print(f"   ✅ With tenant_id: {len(tables_with_tenant_id)}")
        print(f"   ❌ Missing tenant_id: {len(all_tables) - len(tables_with_tenant_id)}")
        
        # Tables that should have tenant_id but don't
        should_have_tenant_id = [
            'athletes', 'parents', 'skills', 'focus_areas', 'bookings', 
            'availability', 'events', 'waivers', 'testimonials', 'site_content',
            'site_faqs', 'lesson_types', 'apparatus', 'archived_waivers',
            'blog_posts', 'site_inquiries', 'side_quests', 'tips',
            'gym_payout_rates', 'gym_payout_runs', 'athlete_skills',
            'athlete_skill_videos', 'booking_athletes', 'booking_focus_areas',
            'skills_prerequisites', 'parent_password_reset_tokens'
        ]
        
        missing_tenant_id = [t for t in should_have_tenant_id if t in all_tables and t not in tables_with_tenant_id]
        
        if missing_tenant_id:
            print(f"\n   🚨 Tables missing tenant_id:")
            for table in missing_tenant_id:
                print(f"      - {table}")
        
        tenant_id_completion = len([t for t in should_have_tenant_id if t in tables_with_tenant_id]) / len(should_have_tenant_id) * 100
        print(f"\n   📈 Tenant ID Migration: {tenant_id_completion:.0f}% complete")
        
        print(f"\n3️⃣ ROW LEVEL SECURITY (RLS):")
        print(f"   ✅ RLS enabled: {len(rls_enabled_tables)} tables")
        print(f"   📋 Total policies: {len(policies)}")
        
        # Group policies by table
        policy_count_by_table = {}
        for schema, table, policy in policies:
            if table not in policy_count_by_table:
                policy_count_by_table[table] = 0
            policy_count_by_table[table] += 1
        
        print(f"\n   📋 Policy distribution:")
        for table in sorted(policy_count_by_table.keys()):
            count = policy_count_by_table[table]
            print(f"      {table:<30} {count} policies")
        
        rls_completion = len(rls_enabled_tables) / len(all_tables) * 100
        print(f"\n   📈 RLS Migration: {rls_completion:.0f}% complete ({len(rls_enabled_tables)}/{len(all_tables)} tables)")
        
        print(f"\n4️⃣ WHAT'S LEFT TO DO:")
        remaining_tasks = []
        
        if len(existing_core_tables) < len(core_tables):
            remaining_tasks.append("Create missing core tables (tenants, tenant_users, etc.)")
        
        if missing_tenant_id:
            remaining_tasks.append(f"Add tenant_id to {len(missing_tenant_id)} tables")
        
        if len(rls_enabled_tables) < len(all_tables):
            remaining_tasks.append(f"Enable RLS on {len(all_tables) - len(rls_enabled_tables)} remaining tables")
        
        # Check for JWT integration
        remaining_tasks.extend([
            "JWT integration with tenant_id claims",
            "Tenant routing middleware (subdomain/path resolution)",
            "Branding system (replace hardcoded Coach Will references)",
            "Platform admin dashboard",
            "Stripe Connect integration for multi-tenant billing",
            "Email template system per tenant",
            "Storage namespace isolation",
            "Invitation & onboarding flows"
        ])
        
        print(f"\n   🎯 Priority tasks:")
        for i, task in enumerate(remaining_tasks[:8], 1):
            print(f"      {i}. {task}")
        
        # Overall completion estimate
        stage_weights = {
            'core_tables': 0.15,      # 15%
            'tenant_id': 0.35,        # 35%
            'rls': 0.25,              # 25%
            'remaining': 0.25         # 25% for JWT, routing, branding, etc.
        }
        
        overall_completion = (
            completion_core * stage_weights['core_tables'] / 100 +
            tenant_id_completion * stage_weights['tenant_id'] / 100 +
            rls_completion * stage_weights['rls'] / 100
            # remaining tasks are 0% complete for now
        )
        
        print(f"\n🎯 OVERALL MIGRATION PROGRESS:")
        print(f"   📊 Estimated completion: {overall_completion:.0f}%")
        print(f"   🏁 Current stage: Database Schema & Security (Stage 3 of 8)")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as error:
        print(f"❌ Analysis failed: {error}")
        return False

if __name__ == "__main__":
    analyze_migration_progress()
