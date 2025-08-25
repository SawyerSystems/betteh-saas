#!/usr/bin/env python3

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to database
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()

print("=== Current constraints on genders table ===")
cur.execute("""
    SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        tc.table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'genders' 
        AND tc.table_schema = 'public'
    ORDER BY tc.constraint_name;
""")

for row in cur.fetchall():
    print(f"  {row}")

print("\n=== Foreign keys referencing genders table ===")
cur.execute("""
    SELECT 
        tc.constraint_name,
        tc.table_name as referencing_table,
        kcu.column_name as referencing_column,
        ccu.table_name as referenced_table,
        ccu.column_name as referenced_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'genders'
    ORDER BY tc.table_name;
""")

for row in cur.fetchall():
    print(f"  {row}")

print("\n=== Check if genders_name_key constraint exists ===")
cur.execute("""
    SELECT constraint_name, constraint_type 
    FROM information_schema.table_constraints 
    WHERE table_name = 'genders' 
        AND constraint_name = 'genders_name_key';
""")

result = cur.fetchall()
if result:
    print(f"  Found: {result[0]}")
else:
    print("  genders_name_key constraint not found")

print("\n=== Check unique constraints on genders.name ===")
cur.execute("""
    SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'genders' 
        AND tc.constraint_type = 'UNIQUE'
        AND kcu.column_name = 'name';
""")

for row in cur.fetchall():
    print(f"  {row}")

cur.close()
conn.close()
