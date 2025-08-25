#!/usr/bin/env python3
"""
Investigate the booking_waiver_status view to find the ambiguous column reference.
"""

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def connect_to_db():
    """Connect to the PostgreSQL database using environment variables."""
    try:
        # Try direct database URL first
        database_url = os.getenv('DIRECT_DATABASE_URL')
        if database_url:
            conn = psycopg2.connect(database_url)
            return conn
            
        # Fallback to individual env vars
        host = os.getenv('SUPABASE_DB_HOST')
        port = os.getenv('SUPABASE_DB_PORT', '5432')
        dbname = os.getenv('SUPABASE_DB_NAME')
        user = os.getenv('SUPABASE_DB_USER')
        password = os.getenv('SUPABASE_DB_PASSWORD')
        
        if not all([host, dbname, user, password]):
            # Try alternative env var names
            host = host or os.getenv('DATABASE_HOST')
            port = port or os.getenv('DATABASE_PORT', '5432')
            dbname = dbname or os.getenv('DATABASE_NAME')
            user = user or os.getenv('DATABASE_USER')
            password = password or os.getenv('DATABASE_PASSWORD')
            
        if not all([host, dbname, user, password]):
            print("Missing database connection details in environment variables")
            return None
            
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def investigate_view(conn):
    """Investigate the booking_waiver_status view."""
    try:
        cur = conn.cursor()
        
        print("=== Checking if booking_waiver_status view exists ===")
        cur.execute("""
            SELECT schemaname, viewname, definition 
            FROM pg_views 
            WHERE viewname = 'booking_waiver_status';
        """)
        
        views = cur.fetchall()
        if not views:
            print("❌ booking_waiver_status view not found")
            
            # Check for similar view names
            print("\n=== Looking for similar view names ===")
            cur.execute("""
                SELECT schemaname, viewname 
                FROM pg_views 
                WHERE viewname LIKE '%waiver%' OR viewname LIKE '%booking%'
                ORDER BY viewname;
            """)
            similar_views = cur.fetchall()
            for schema, viewname in similar_views:
                print(f"  {schema}.{viewname}")
        else:
            for schema, viewname, definition in views:
                print(f"✅ Found view: {schema}.{viewname}")
                print(f"\n=== View Definition ===")
                print(definition)
                
        print("\n=== Checking tables with booking_id column ===")
        cur.execute("""
            SELECT table_schema, table_name, column_name
            FROM information_schema.columns
            WHERE column_name = 'booking_id'
            AND table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_name;
        """)
        
        tables_with_booking_id = cur.fetchall()
        print("Tables containing booking_id column:")
        for schema, table, column in tables_with_booking_id:
            print(f"  {schema}.{table}.{column}")
            
        print("\n=== Checking for views that might reference booking_id ===")
        cur.execute("""
            SELECT schemaname, viewname, definition
            FROM pg_views
            WHERE definition ILIKE '%booking_id%'
            AND schemaname NOT IN ('information_schema', 'pg_catalog')
            ORDER BY viewname;
        """)
        
        views_with_booking_id = cur.fetchall()
        for schema, viewname, definition in views_with_booking_id:
            print(f"\n--- View: {schema}.{viewname} ---")
            # Show just the relevant parts of the definition
            lines = definition.split('\n')
            for i, line in enumerate(lines):
                if 'booking_id' in line.lower():
                    print(f"Line {i+1}: {line.strip()}")
        
        cur.close()
        
    except Exception as e:
        print(f"Error investigating view: {e}")

def main():
    """Main function."""
    print("🔍 Investigating booking_waiver_status view...")
    
    conn = connect_to_db()
    if not conn:
        return
        
    try:
        investigate_view(conn)
    finally:
        conn.close()
        
    print("\n✅ Investigation complete!")

if __name__ == "__main__":
    main()
