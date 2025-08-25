#!/usr/bin/env python3

import os
import psycopg2
from dotenv import load_dotenv

def main():
    load_dotenv()
    database_url = os.getenv('DIRECT_DATABASE_URL')
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        print("🔍 VERIFYING SECURITY FIXES")
        print("=" * 50)
        
        # Check for SECURITY DEFINER functions
        print("\n1. Checking for SECURITY DEFINER functions...")
        cur.execute("""
            SELECT proname, prosecdef 
            FROM pg_proc 
            WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND prosecdef = true;
        """)
        security_definer_functions = cur.fetchall()
        
        if security_definer_functions:
            print(f"❌ Found {len(security_definer_functions)} SECURITY DEFINER functions:")
            for func_name, is_secdef in security_definer_functions:
                print(f"   - {func_name}")
        else:
            print("✅ No SECURITY DEFINER functions found")
        
        # Check for functions with mutable search_path
        print("\n2. Checking for functions with mutable search_path...")
        cur.execute("""
            SELECT p.proname, p.proconfig
            FROM pg_proc p
            WHERE p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND (p.proconfig IS NULL OR NOT EXISTS (
                SELECT 1 FROM unnest(p.proconfig) AS config_setting
                WHERE config_setting LIKE 'search_path=%'
            ));
        """)
        mutable_path_functions = cur.fetchall()
        
        if mutable_path_functions:
            print(f"❌ Found {len(mutable_path_functions)} functions with mutable search_path:")
            for func_name, config in mutable_path_functions:
                print(f"   - {func_name} (config: {config})")
        else:
            print("✅ All functions have proper search_path configuration")
        
        # Check views that might still have SECURITY DEFINER
        print("\n3. Checking views for SECURITY DEFINER...")
        cur.execute("""
            SELECT viewname, definition 
            FROM pg_views 
            WHERE schemaname = 'public'
            AND definition ILIKE '%security definer%';
        """)
        security_definer_views = cur.fetchall()
        
        if security_definer_views:
            print(f"❌ Found {len(security_definer_views)} views with SECURITY DEFINER:")
            for view_name, definition in security_definer_views:
                print(f"   - {view_name}")
        else:
            print("✅ No views with SECURITY DEFINER found")
        
        # Summary
        total_issues = len(security_definer_functions) + len(mutable_path_functions) + len(security_definer_views)
        
        print("\n" + "=" * 50)
        print("📊 SUMMARY")
        print("=" * 50)
        
        if total_issues == 0:
            print("🎉 ALL SECURITY ISSUES RESOLVED!")
            print("✅ No SECURITY DEFINER functions")
            print("✅ All functions have proper search_path")
            print("✅ No SECURITY DEFINER views")
        else:
            print(f"❌ {total_issues} security issues remaining")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
