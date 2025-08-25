import os
from dotenv import load_dotenv
import psycopg2
import json
import urllib.parse

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

    # Query to get columns from the view
    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'athletes_with_waiver_status'
        ORDER BY ordinal_position;
    """)
    
    columns = [col[0] for col in cur.fetchall()]
    print("Available columns in athletes_with_waiver_status view:")
    for col in columns:
        print(f"- {col}")
    
    # Query to get sample data
    cur.execute("""
        SELECT *
        FROM athletes_with_waiver_status
        WHERE waiver_relationship_to_athlete IS NOT NULL
        LIMIT 1;
    """)
    
    row = cur.fetchone()
    if row:
        # Create a dictionary of column names and values
        sample_data = {}
        for i, col in enumerate(columns):
            sample_data[col] = row[i]
        
        print("\nSample data for relationship_to_athlete:")
        if 'waiver_relationship_to_athlete' in sample_data:
            print(f"waiver_relationship_to_athlete: \"{sample_data['waiver_relationship_to_athlete']}\"")
        else:
            print("waiver_relationship_to_athlete column not found in results")
            
        print("\nRelated waiver fields:")
        for key in sample_data:
            if key.startswith('waiver_'):
                print(f"{key}: \"{sample_data[key]}\"")
                
        print("\nFull sample data:")
        print(json.dumps(sample_data, indent=2, default=str))
    else:
        print("No sample data found with non-null relationship_to_athlete")
    
    cur.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
