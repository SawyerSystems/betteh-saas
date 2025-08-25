#!/usr/bin/env python3
"""
Fix the get_booking_waiver_status function that has ambiguous column references.
"""

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def connect_to_db():
    """Connect to the PostgreSQL database using environment variables."""
    try:
        database_url = os.getenv('DIRECT_DATABASE_URL')
        if database_url:
            conn = psycopg2.connect(database_url)
            return conn
        else:
            print("No DIRECT_DATABASE_URL found")
            return None
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def investigate_function(conn):
    """Investigate the get_booking_waiver_status function."""
    try:
        cur = conn.cursor()
        
        print("=== Finding get_booking_waiver_status function ===")
        cur.execute("""
            SELECT 
                n.nspname as schema_name,
                p.proname as function_name,
                pg_get_functiondef(p.oid) as function_definition
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE p.proname = 'get_booking_waiver_status';
        """)
        
        functions = cur.fetchall()
        
        if not functions:
            print("❌ Function get_booking_waiver_status not found")
            return
            
        for schema, fname, definition in functions:
            print(f"✅ Found function: {schema}.{fname}")
            print(f"\n=== Function Definition ===")
            print(definition)
            
        cur.close()
        
    except Exception as e:
        print(f"Error investigating function: {e}")

def fix_function(conn):
    """Fix the get_booking_waiver_status function."""
    try:
        cur = conn.cursor()
        
        print("\n=== Dropping view first (it depends on the function) ===")
        cur.execute("DROP VIEW IF EXISTS booking_waiver_status;")
        
        print("=== Dropping existing function ===")
        cur.execute("DROP FUNCTION IF EXISTS get_booking_waiver_status(integer);")
        
        print("=== Creating corrected function ===")
        # Create a corrected version that properly qualifies table references
        corrected_function = """
        CREATE OR REPLACE FUNCTION get_booking_waiver_status(booking_id_param integer)
        RETURNS text
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path TO 'public'
        AS $$
        DECLARE
            has_athletes boolean;
            all_signed boolean;
        BEGIN
            -- Check if booking has any athletes
            SELECT EXISTS (
                SELECT 1 FROM booking_athletes ba
                WHERE ba.booking_id = booking_id_param
            ) INTO has_athletes;
            
            IF NOT has_athletes THEN
                RETURN 'pending';
            END IF;
            
            -- Check if all athletes have signed waivers using the waiver_signed column
            SELECT COALESCE(
                (SELECT BOOL_AND(a.waiver_signed) 
                FROM athletes a
                JOIN booking_athletes ba ON a.id = ba.athlete_id
                WHERE ba.booking_id = booking_id_param), 
                FALSE
            ) INTO all_signed;
            
            IF all_signed THEN
                RETURN 'signed';
            ELSE
                RETURN 'pending';
            END IF;
        END;
        $$;
        """
        
        cur.execute(corrected_function)
        
        print("✅ Function successfully recreated with qualified column references")
        
        print("\n=== Testing the corrected function ===")
        # Test with a real booking ID if available
        cur.execute("SELECT id FROM bookings LIMIT 1;")
        test_booking = cur.fetchone()
        
        if test_booking:
            test_id = test_booking[0]
            cur.execute("SELECT get_booking_waiver_status(%s);", (test_id,))
            result = cur.fetchone()[0]
            print(f"✅ Function test successful. Booking {test_id} status: {result}")
        
        print("\n=== Recreating the view ===")
        
        create_view_sql = """
        CREATE VIEW booking_waiver_status AS
        SELECT b.id AS booking_id,
               get_booking_waiver_status(b.id) AS waiver_status,
               b.status AS booking_status
        FROM bookings b;
        """
        
        cur.execute(create_view_sql)
        
        print("✅ View successfully recreated")
        
        print("\n=== Final test of the view ===")
        cur.execute("SELECT COUNT(*) FROM booking_waiver_status;")
        count = cur.fetchone()[0]
        print(f"✅ View query successful. Found {count} rows.")
        
        # Test selecting specific columns
        cur.execute("SELECT booking_id, waiver_status, booking_status FROM booking_waiver_status LIMIT 3;")
        rows = cur.fetchall()
        print(f"✅ Column selection successful. Sample rows:")
        for row in rows:
            print(f"  booking_id: {row[0]}, waiver_status: {row[1]}, booking_status: {row[2]}")
        
        # Commit the changes
        conn.commit()
        cur.close()
        
    except Exception as e:
        print(f"Error fixing function: {e}")
        conn.rollback()

def main():
    """Main function."""
    print("🔧 Investigating and fixing get_booking_waiver_status function...")
    
    conn = connect_to_db()
    if not conn:
        return
        
    try:
        investigate_function(conn)
        fix_function(conn)
    finally:
        conn.close()
        
    print("\n✅ Fix complete!")

if __name__ == "__main__":
    main()
