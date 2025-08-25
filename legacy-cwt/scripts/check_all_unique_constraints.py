#!/usr/bin/env python3

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to database
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()

# Get all unique constraints in the database
print("=== All unique constraints in database ===")
cur.execute("""
    SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
        AND tc.table_name IN ('lesson_types', 'genders', 'parent_password_reset_tokens', 'focus_areas', 'apparatus', 'side_quests', 'admins')
    ORDER BY tc.table_name, tc.constraint_name;
""")

constraints = {}
for row in cur.fetchall():
    table_name, constraint_name, column_name = row
    if table_name not in constraints:
        constraints[table_name] = []
    constraints[table_name].append((constraint_name, column_name))
    print(f"  {table_name}.{column_name} -> {constraint_name}")

print("\n=== Foreign key dependencies on unique constraints ===")
cur.execute("""
    SELECT 
        tc.constraint_name as fk_name,
        tc.table_name as referencing_table,
        kcu.column_name as referencing_column,
        ccu.table_name as referenced_table,
        ccu.column_name as referenced_column,
        -- Find the unique constraint name
        uc.constraint_name as unique_constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
    LEFT JOIN information_schema.table_constraints uc
        ON uc.table_name = ccu.table_name 
        AND uc.constraint_type = 'UNIQUE'
    LEFT JOIN information_schema.key_column_usage uc_kcu
        ON uc.constraint_name = uc_kcu.constraint_name
        AND uc_kcu.column_name = ccu.column_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name IN ('lesson_types', 'genders', 'parent_password_reset_tokens', 'focus_areas', 'apparatus', 'side_quests', 'admins')
        AND uc.constraint_name IS NOT NULL
    ORDER BY ccu.table_name;
""")

dependencies = cur.fetchall()
for row in dependencies:
    print(f"  {row}")

cur.close()
conn.close()
