#!/usr/bin/env python3
"""
Query the database to check the events table schema and current data
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import json

def load_env():
    """Load environment variables from .env file"""
    env_vars = {}
    try:
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip().strip('"\'')
    except FileNotFoundError:
        print("Warning: .env file not found")
    return env_vars

def get_db_connection():
    """Get database connection using environment variables"""
    env_vars = load_env()
    
    # Try different database URL formats
    db_url = env_vars.get('DIRECT_DATABASE_URL') or env_vars.get('DATABASE_URL')
    
    if not db_url:
        print("No database URL found in environment variables")
        print("Available environment variables:", list(env_vars.keys()))
        return None
    
    try:
        # Parse the URL and create connection
        print(f"Connecting to database...")
        print(f"Database URL format: {db_url[:30]}...")
        conn = psycopg2.connect(db_url)
        print("Connected successfully!")
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        return None

def check_events_table(conn):
    """Check if events table exists and get its schema"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check if events table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'events'
            );
        """)
        result = cur.fetchone()
        table_exists = result['exists'] if result else False
        
        print(f"Events table exists: {table_exists}")
        
        if table_exists:
            # Get table schema
            cur.execute("""
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    character_maximum_length
                FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = 'events'
                ORDER BY ordinal_position;
            """)
            columns = cur.fetchall()
            
            print("\nEvents table schema:")
            print("-" * 80)
            for col in columns:
                print(f"{col['column_name']:25} {col['data_type']:20} {col['is_nullable']:10} {col['column_default'] or ''}")
            
            # Get sample data
            cur.execute("SELECT COUNT(*) FROM events;")
            count_result = cur.fetchone()
            count = count_result['count'] if count_result else 0
            print(f"\nTotal events in table: {count}")
            
            if count > 0:
                cur.execute("""
                    SELECT id, title, start_at, end_at, recurrence_rule, is_availability_block
                    FROM events 
                    ORDER BY created_at DESC 
                    LIMIT 5;
                """)
                events = cur.fetchall()
                
                print("\nSample events:")
                print("-" * 80)
                for event in events:
                    print(f"ID: {event['id']}, Title: {event['title']}, Start: {event['start_at']}")
                    print(f"  Recurrence: {event['recurrence_rule']}, Availability Block: {event['is_availability_block']}")
                    print()
        
        return table_exists

def check_availability_exceptions(conn):
    """Check availability_exceptions table"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check if table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'availability_exceptions'
            );
        """)
        result = cur.fetchone()
        table_exists = result['exists'] if result else False
        
        print(f"\nAvailability exceptions table exists: {table_exists}")
        
        if table_exists:
            cur.execute("SELECT COUNT(*) FROM availability_exceptions;")
            count_result = cur.fetchone()
            count = count_result['count'] if count_result else 0
            print(f"Total availability exceptions: {count}")
            
            if count > 0:
                cur.execute("""
                    SELECT id, date, reason, all_day, start_time, end_time
                    FROM availability_exceptions 
                    ORDER BY date DESC 
                    LIMIT 3;
                """)
                exceptions = cur.fetchall()
                
                print("\nSample availability exceptions:")
                for exc in exceptions:
                    print(f"  {exc['date']}: {exc['reason']} (All day: {exc['all_day']})")

def check_related_tables(conn):
    """Check for other related tables"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        tables_to_check = [
            'bookings',
            'lesson_types', 
            'athletes',
            'parents'
        ]
        
        print("\nRelated tables:")
        print("-" * 40)
        
        for table in tables_to_check:
            cur.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = '{table}'
                );
            """)
            result = cur.fetchone()
            exists = result['exists'] if result else False
            
            if exists:
                cur.execute(f"SELECT COUNT(*) FROM {table};")
                count_result = cur.fetchone()
                count = count_result['count'] if count_result else 0
                print(f"{table:20} EXISTS ({count} records)")
            else:
                print(f"{table:20} MISSING")

def main():
    print("=== Database Schema Query ===")
    
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        # Check events table
        print("Checking events table...")
        events_exists = check_events_table(conn)
        
        # Check availability exceptions
        print("Checking availability exceptions...")
        check_availability_exceptions(conn)
        
        # Check related tables
        print("Checking related tables...")
        check_related_tables(conn)
        
        print("\n=== Query Complete ===")
        
    except Exception as e:
        print(f"Error during query: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
