import os
from dotenv import load_dotenv
import psycopg2
import json

# Load environment variables
load_dotenv()

# Try different environment variables for database connection
db_url = os.getenv('DATABASE_URL')
if not db_url:
    # Try the direct URL
    db_url = os.getenv('DATABASE_DIRECT_URL')
    if db_url:
        print(f"Using DATABASE_DIRECT_URL: {db_url[:30]}...")

try:
    # Connect to the database
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # Query to get columns from lesson_types table
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'lesson_types'
        ORDER BY ordinal_position;
    """)
    
    columns = cur.fetchall()
    print("Available columns in lesson_types table:")
    print("=" * 60)
    for col_name, data_type, is_nullable, col_default in columns:
        print(f"- {col_name:<20} | {data_type:<15} | Nullable: {is_nullable:<3} | Default: {col_default}")
    
    print("\n" + "=" * 60)
    
    # Query to get sample data from lesson_types
    cur.execute("""
        SELECT *
        FROM lesson_types
        LIMIT 1;
    """)
    
    # Get column names
    column_names = [desc[0] for desc in cur.description]
    row = cur.fetchone()
    
    if row:
        print("Sample lesson_types record:")
        print("=" * 60)
        for i, col_name in enumerate(column_names):
            value = row[i]
            if isinstance(value, str) and len(str(value)) > 50:
                value = str(value)[:50] + "..."
            print(f"{col_name:<20} | {value}")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
