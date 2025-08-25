#!/usr/bin/env python3
import json
import os
import sys
from typing import Dict, List, Tuple

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), '..', 'attached_assets', 'complete_current_schema.txt')

def fetch_live_schema(conn) -> Dict:
    """Return complete schema information from the live database"""
    # Get all tables
    tables_q = """
    select table_name 
    from information_schema.tables 
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
    """
    cur = conn.execute(tables_q)
    table_rows = cur.fetchall()
    table_names = [r['table_name'] for r in table_rows]
    
    # Get detailed column info for each table
    columns_q = """
    select c.table_name,
           c.column_name,
           case
             when c.udt_name = 'hstore' then 'hstore'
             when c.data_type = 'ARRAY' then 'ARRAY'
             when c.data_type ilike 'USER-DEFINED' then c.udt_name
             else c.data_type
           end as data_type
    from information_schema.columns c
    join information_schema.tables t on t.table_name = c.table_name and t.table_schema = c.table_schema
    where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
    order by c.table_name, c.ordinal_position
    """
    cur = conn.execute(columns_q)
    column_rows = cur.fetchall()
    
    # Group columns by table
    tables = {}
    for table_name in table_names:
        tables[table_name] = {
            "exists": True,
            "columns": []
        }
    
    for row in column_rows:
        tables[row['table_name']]["columns"].append({
            "column_name": row['column_name'],
            "data_type": row['data_type']
        })
    
    return {
        "tables": tables
    }

def generate_schema_file(schema_data: Dict):
    """Generate the complete schema file content"""
    table_list = sorted(schema_data["tables"].keys())
    
    content = "Complete Schema - Auto-updated via script\n"
    content += "TABLE LIST:\n"
    for table in table_list:
        content += f"- {table}\n"
    content += "\n"
    content += "DETAILED SCHEMA DATA:\n"
    content += json.dumps(schema_data, indent=2)
    content += "\n"
    
    return content

def main():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL') or os.getenv('DIRECT_DATABASE_URL')
    if not db_url:
        print('ERROR: Neither DATABASE_URL nor DIRECT_DATABASE_URL set in environment.', file=sys.stderr)
        sys.exit(1)

    print("Connecting to database and fetching current schema...")
    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        schema_data = fetch_live_schema(conn)

    print(f"Found {len(schema_data['tables'])} tables in the database.")
    
    # Generate new schema file content
    new_content = generate_schema_file(schema_data)
    
    # Write to file
    with open(SCHEMA_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Updated schema file: {SCHEMA_PATH}")
    print("Schema file now reflects the current database state.")

if __name__ == '__main__':
    main()
