#!/usr/bin/env python3
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import json

# Get database URL from .env file
def get_database_url():
    with open('.env', 'r') as f:
        for line in f:
            if line.startswith('DIRECT_DATABASE_URL='):
                return line.split('=', 1)[1].strip()
    return None

def query_database():
    db_url = get_database_url()
    if not db_url:
        print("❌ Could not find DATABASE_URL in .env file")
        return
    
    try:
        # Connect to database
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("🔍 Investigating availability_exceptions table...")
        
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'availability_exceptions'
            );
        """)
        result = cursor.fetchone()
        table_exists = result['exists']
        print(f"📋 Table exists: {table_exists}")
        
        if not table_exists:
            print("❌ availability_exceptions table does not exist!")
            return
        
        # Get table schema
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'availability_exceptions'
            ORDER BY ordinal_position;
        """)
        schema = cursor.fetchall()
        print("\n📊 Table Schema:")
        for col in schema:
            print(f"  {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})")
        
        # Count total records
        cursor.execute("SELECT COUNT(*) FROM availability_exceptions;")
        result = cursor.fetchone()
        total_count = result['count']
        print(f"\n📈 Total records: {total_count}")
        
        # Get all records with details
        cursor.execute("""
            SELECT id, date, title, reason, start_time, end_time, all_day, 
                   is_available, category, notes, created_at
            FROM availability_exceptions 
            ORDER BY date DESC, id DESC
            LIMIT 20;
        """)
        records = cursor.fetchall()
        
        print(f"\n📋 Latest {len(records)} records:")
        for record in records:
            print(f"  ID {record['id']}: {record['date']} - {record['title'] or record['reason']} (available: {record['is_available']})")
        
        # Check specifically for ID 19
        cursor.execute("SELECT * FROM availability_exceptions WHERE id = 19;")
        record_19 = cursor.fetchone()
        
        if record_19:
            print(f"\n✅ Record ID 19 EXISTS:")
            print(json.dumps(dict(record_19), indent=2, default=str))
        else:
            print(f"\n❌ Record ID 19 does NOT exist!")
        
        # Check for records around October 2025
        cursor.execute("""
            SELECT id, date, title, reason, is_available
            FROM availability_exceptions 
            WHERE date >= '2025-10-01' AND date <= '2025-10-31'
            ORDER BY date;
        """)
        october_records = cursor.fetchall()
        
        print(f"\n🍂 October 2025 records ({len(october_records)}):")
        for record in october_records:
            print(f"  ID {record['id']}: {record['date']} - {record['title'] or record['reason']}")
        
        # Check for any recent updates/deletes
        cursor.execute("""
            SELECT id, date, title, created_at
            FROM availability_exceptions 
            WHERE created_at > NOW() - INTERVAL '1 hour'
            ORDER BY created_at DESC;
        """)
        recent_updates = cursor.fetchall()
        
        print(f"\n⏰ Recent updates (last hour): {len(recent_updates)}")
        for record in recent_updates:
            print(f"  ID {record['id']}: {record['date']} - created at {record['created_at']}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    query_database()
