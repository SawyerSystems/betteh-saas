#!/usr/bin/env python3
"""
Fix the booking_waiver_status view by properly qualifying the column reference.
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

def fix_view(conn):
    """Fix the booking_waiver_status view."""
    try:
        cur = conn.cursor()
        
        print("=== Current view definition ===")
        cur.execute("""
            SELECT definition 
            FROM pg_views 
            WHERE viewname = 'booking_waiver_status';
        """)
        
        current_def = cur.fetchone()
        if current_def:
            print(current_def[0])
        
        print("\n=== Dropping existing view ===")
        cur.execute("DROP VIEW IF EXISTS booking_waiver_status;")
        
        print("=== Creating corrected view ===")
        # The issue is that 'id' and 'status' need to be qualified with the table alias 'b'
        corrected_sql = """
        CREATE VIEW booking_waiver_status AS
        SELECT b.id AS booking_id,
               get_booking_waiver_status(b.id) AS waiver_status,
               b.status AS booking_status
        FROM bookings b;
        """
        
        cur.execute(corrected_sql)
        
        print("✅ View successfully recreated with qualified column references")
        
        print("\n=== Testing the corrected view ===")
        cur.execute("SELECT COUNT(*) FROM booking_waiver_status;")
        count = cur.fetchone()[0]
        print(f"✅ View query successful. Found {count} rows.")
        
        # Test selecting specific columns to make sure there's no ambiguity
        cur.execute("SELECT booking_id, waiver_status, booking_status FROM booking_waiver_status LIMIT 5;")
        rows = cur.fetchall()
        print(f"✅ Column selection successful. Sample rows:")
        for row in rows[:3]:  # Show first 3 rows
            print(f"  booking_id: {row[0]}, waiver_status: {row[1]}, booking_status: {row[2]}")
        
        # Commit the changes
        conn.commit()
        cur.close()
        
    except Exception as e:
        print(f"Error fixing view: {e}")
        conn.rollback()

def main():
    """Main function."""
    print("🔧 Fixing booking_waiver_status view...")
    
    conn = connect_to_db()
    if not conn:
        return
        
    try:
        fix_view(conn)
    finally:
        conn.close()
        
    print("\n✅ Fix complete!")

if __name__ == "__main__":
    main()
