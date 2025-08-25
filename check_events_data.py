#!/usr/bin/env python3
"""
Check what data exists in the events table vs availability_exceptions table
"""

import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL
db_url = os.getenv('DATABASE_URL')
if not db_url:
    print("❌ DATABASE_URL not found in environment")
    exit(1)

def check_events_data():
    try:
        # Connect to database
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        print("🔍 Checking Events Table Data...")
        print("=" * 50)
        
        # Check events table
        print("\n📅 EVENTS TABLE:")
        cur.execute("""
            SELECT 
                count(*) as total_events,
                count(*) FILTER (WHERE is_deleted = false) as active_events,
                count(*) FILTER (WHERE is_availability_block = true) as availability_blocks,
                count(*) FILTER (WHERE is_availability_block = false) as regular_events
            FROM events
        """)
        
        result = cur.fetchone()
        if result:
            total, active, blocks, regular = result
            print(f"  📊 Total Events: {total}")
            print(f"  ✅ Active Events: {active}")
            print(f"  🚫 Availability Blocks: {blocks}")
            print(f"  📅 Regular Events: {regular}")
        
        print("\n📋 Sample Events:")
        cur.execute("""
            SELECT 
                id, title, start_at, end_at, is_availability_block, blocking_reason, is_deleted
            FROM events 
            WHERE is_deleted = false
            ORDER BY start_at 
            LIMIT 5
        """)
        
        events = cur.fetchall()
        for event in events:
            event_id, title, start_at, end_at, is_block, reason, is_deleted = event
            event_type = "🚫 Block" if is_block else "📅 Event"
            print(f"  {event_type}: {title} ({start_at} - {end_at})")
            if reason:
                print(f"    Reason: {reason}")
        
        print("\n" + "=" * 50)
        print("\n🔍 Checking Availability Exceptions Table...")
        print("=" * 50)
        
        # Check availability_exceptions table
        print("\n⚠️  AVAILABILITY_EXCEPTIONS TABLE:")
        try:
            cur.execute("SELECT count(*) FROM availability_exceptions")
            exceptions_count = cur.fetchone()[0]
            print(f"  📊 Total Exceptions: {exceptions_count}")
            
            if exceptions_count > 0:
                print("\n📋 Sample Availability Exceptions:")
                cur.execute("""
                    SELECT date, start_time, end_time, reason, is_available 
                    FROM availability_exceptions 
                    ORDER BY date 
                    LIMIT 5
                """)
                
                exceptions = cur.fetchall()
                for exc in exceptions:
                    date, start_time, end_time, reason, is_available = exc
                    status = "✅ Available" if is_available else "🚫 Blocked"
                    print(f"  {status}: {date} {start_time}-{end_time} - {reason}")
                    
        except psycopg2.Error as e:
            print(f"  ❌ Error checking availability_exceptions: {e}")
        
        print("\n" + "=" * 50)
        print("\n🎯 CONCLUSION:")
        
        if total > 0:
            print(f"✅ Events table has {total} events ({active} active)")
            print("✅ Enhanced calendar system data is ready!")
            
            if exceptions_count > 0:
                print(f"⚠️  Old availability_exceptions table still has {exceptions_count} records")
                print("💡 Consider migrating remaining exceptions to events table")
            else:
                print("✅ No old availability_exceptions data found")
                
            print("\n🚀 READY TO UPDATE CODEBASE TO USE ENHANCED CALENDAR!")
        else:
            print("❌ Events table is empty - need to migrate data first")
            
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    check_events_data()
