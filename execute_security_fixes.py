#!/usr/bin/env python3

import os
import psycopg2
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()
    
    database_url = os.getenv('DIRECT_DATABASE_URL')
    if not database_url:
        print("ERROR: DIRECT_DATABASE_URL not found in environment")
        return
    
    print("Connecting to database...")
    
    try:
        # Connect to database
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        print("Connected successfully!")
        print("Reading SQL script...")
        
        # Read the SQL script
        with open('fix-all-security-definer-complete.sql', 'r') as f:
            sql_script = f.read()
        
        print(f"Executing SQL script ({len(sql_script)} characters)...")
        
        # Execute the script
        cur.execute(sql_script)
        
        # Commit the changes
        conn.commit()
        
        print("✅ Security fixes applied successfully!")
        print("All SECURITY DEFINER functions have been recreated without SECURITY DEFINER")
        print("All related views have been recreated")
        print("All permissions have been granted to service_role")
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        print(f"Error code: {e.pgcode}")
        if hasattr(e, 'pgerror'):
            print(f"PostgreSQL error: {e.pgerror}")
    except Exception as e:
        print(f"❌ General error: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()
        print("Database connection closed.")

if __name__ == "__main__":
    main()
