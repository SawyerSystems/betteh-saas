#!/usr/bin/env python3
"""
Script to check existing parents in the Supabase database
"""
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_database_url():
    """Get the database URL from environment variables"""
    database_url = os.getenv('DATABASE_DIRECT_URL') or os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_DIRECT_URL or DATABASE_URL not found in environment variables")
    return database_url

def check_parents():
    """Check existing parents in the database"""
    try:
        # Connect to the database
        conn = psycopg2.connect(get_database_url())
        cur = conn.cursor()
        
        # Get all parents
        cur.execute("""
            SELECT id, email, first_name, last_name, phone, is_verified, created_at
            FROM parents 
            ORDER BY created_at DESC
            LIMIT 10
        """)
        
        parents = cur.fetchall()
        
        print("🔍 Existing Parents in Database:")
        print("-" * 80)
        
        if not parents:
            print("❌ No parents found in the database")
        else:
            print(f"✅ Found {len(parents)} parents:")
            for parent in parents:
                id, email, first_name, last_name, phone, is_verified, created_at = parent
                verified_status = "✅ Verified" if is_verified else "❌ Not Verified"
                print(f"  ID: {id}")
                print(f"  Email: {email}")
                print(f"  Name: {first_name} {last_name}")
                print(f"  Phone: {phone}")
                print(f"  Status: {verified_status}")
                print(f"  Created: {created_at}")
                print("-" * 40)
        
        # Also check total count
        cur.execute("SELECT COUNT(*) FROM parents")
        total_count = cur.fetchone()[0]
        print(f"\n📊 Total parents in database: {total_count}")
        
        cur.close()
        conn.close()
        
        return parents
        
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return []

def check_database_schema():
    """Check the parents table schema"""
    try:
        conn = psycopg2.connect(get_database_url())
        cur = conn.cursor()
        
        # Get table schema
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'parents'
            ORDER BY ordinal_position
        """)
        
        columns = cur.fetchall()
        
        print("\n🏗️  Parents Table Schema:")
        print("-" * 80)
        
        for column in columns:
            column_name, data_type, is_nullable, column_default = column
            nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
            default = f" DEFAULT {column_default}" if column_default else ""
            print(f"  {column_name}: {data_type} {nullable}{default}")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking schema: {e}")

if __name__ == "__main__":
    print("🔍 Checking Supabase Database...")
    print("=" * 80)
    
    # Check parents
    parents = check_parents()
    
    # Check schema
    check_database_schema()
    
    # Suggest test emails if no parents exist
    if not parents:
        print("\n💡 Suggestion: Create a test parent first using the admin panel or API")
        print("   Or use the parent registration endpoint to create a test parent")
