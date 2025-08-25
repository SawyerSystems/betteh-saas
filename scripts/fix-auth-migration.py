#!/usr/bin/env python3
"""
Execute the remaining auth migration statements
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def main():
    db_url = os.getenv("DIRECT_DATABASE_URL") or os.getenv("DATABASE_URL")
    
    with open('migrations/fix-auth-migration.sql', 'r') as f:
        sql_content = f.read()
    
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        
        with conn.cursor() as cursor:
            cursor.execute(sql_content)
            print("✅ Auth migration fix executed successfully!")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    main()
