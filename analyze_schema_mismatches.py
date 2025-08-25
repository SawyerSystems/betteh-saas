#!/usr/bin/env python3

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to database
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()

print("=== Analyzing schema mismatches after restore ===")

# Check specific problematic columns
print("\n1. TIMESTAMP TIMEZONE ISSUES:")
cur.execute("""
    SELECT 
        table_name, 
        column_name, 
        data_type,
        is_nullable,
        column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND data_type = 'timestamp with time zone'
        AND (column_name = 'updated_at' OR column_name = 'created_at')
    ORDER BY table_name, column_name;
""")

for row in cur.fetchall():
    print(f"  {row[0]}.{row[1]}: {row[2]} (nullable: {row[3]}, default: {row[4]})")

print("\n2. NUMERIC PRECISION ISSUES:")
cur.execute("""
    SELECT 
        table_name, 
        column_name, 
        data_type,
        numeric_precision,
        numeric_scale
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND data_type = 'numeric'
        AND (column_name = 'total_price' OR column_name = 'reservation_fee')
    ORDER BY table_name, column_name;
""")

for row in cur.fetchall():
    print(f"  {row[0]}.{row[1]}: {row[2]} (precision: {row[3]}, scale: {row[4]})")

print("\n3. VARCHAR LENGTH ISSUES:")
cur.execute("""
    SELECT 
        table_name, 
        column_name, 
        data_type,
        character_maximum_length
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND column_name = 'level'
        AND character_maximum_length = 20
    ORDER BY table_name, column_name;
""")

for row in cur.fetchall():
    print(f"  {row[0]}.{row[1]}: {row[2]}({row[3]})")

print("\n4. BIGSERIAL vs BIGINT ISSUES:")
cur.execute("""
    SELECT 
        table_name, 
        column_name, 
        data_type,
        column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND column_name = 'id'
        AND data_type = 'bigint'
        AND column_default LIKE '%nextval%'
    ORDER BY table_name;
""")

for row in cur.fetchall():
    print(f"  {row[0]}.{row[1]}: {row[2]} (default: {row[3][:50]}...)")

cur.close()
conn.close()
