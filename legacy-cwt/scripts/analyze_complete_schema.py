#!/usr/bin/env python3
"""
Comprehensive Database Schema Analyzer
Extracts complete schema information from PostgreSQL database to match Drizzle schema
"""

import os
import psycopg2
import json
from dotenv import load_dotenv

load_dotenv()

def get_database_connection():
    """Get database connection using DIRECT_DATABASE_URL"""
    try:
        conn = psycopg2.connect(os.getenv('DIRECT_DATABASE_URL'))
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def get_all_tables(cursor):
    """Get all user tables (excluding system tables)"""
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    return [row[0] for row in cursor.fetchall()]

def get_table_columns(cursor, table_name):
    """Get detailed column information for a table"""
    cursor.execute("""
        SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            udt_name
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = %s
        ORDER BY ordinal_position;
    """, (table_name,))
    
    columns = []
    for row in cursor.fetchall():
        column_info = {
            'name': row[0],
            'data_type': row[1],
            'is_nullable': row[2] == 'YES',
            'default': row[3],
            'max_length': row[4],
            'precision': row[5],
            'scale': row[6],
            'udt_name': row[7]
        }
        columns.append(column_info)
    
    return columns

def get_primary_keys(cursor, table_name):
    """Get primary key columns for a table"""
    cursor.execute("""
        SELECT column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = %s
        AND tc.constraint_type = 'PRIMARY KEY';
    """, (table_name,))
    
    return [row[0] for row in cursor.fetchall()]

def get_foreign_keys(cursor, table_name):
    """Get foreign key relationships for a table"""
    cursor.execute("""
        SELECT 
            kcu.column_name,
            ccu.table_name AS referenced_table,
            ccu.column_name AS referenced_column
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = %s
        AND tc.constraint_type = 'FOREIGN KEY';
    """, (table_name,))
    
    foreign_keys = {}
    for row in cursor.fetchall():
        foreign_keys[row[0]] = {
            'referenced_table': row[1],
            'referenced_column': row[2]
        }
    
    return foreign_keys

def get_unique_constraints(cursor, table_name):
    """Get unique constraints for a table"""
    cursor.execute("""
        SELECT column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = %s
        AND tc.constraint_type = 'UNIQUE';
    """, (table_name,))
    
    return [row[0] for row in cursor.fetchall()]

def get_enums(cursor):
    """Get all custom enum types"""
    cursor.execute("""
        SELECT 
            t.typname as enum_name,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.typname
        ORDER BY t.typname;
    """)
    
    enums = {}
    for row in cursor.fetchall():
        enums[row[0]] = row[1]
    
    return enums

def map_postgres_to_drizzle_type(column_info, enums):
    """Map PostgreSQL data types to Drizzle ORM types"""
    data_type = column_info['data_type']
    udt_name = column_info['udt_name']
    
    # Check if it's a custom enum
    if udt_name in enums:
        return f"{udt_name}Enum(\"{column_info['name']}\")"
    
    # Map standard PostgreSQL types to Drizzle types
    type_mapping = {
        'integer': 'integer',
        'bigint': 'bigserial' if 'nextval' in (column_info['default'] or '') else 'bigint',
        'serial': 'serial',
        'bigserial': 'bigserial',
        'text': 'text',
        'character varying': 'varchar',
        'varchar': 'varchar',
        'boolean': 'boolean',
        'timestamp without time zone': 'timestamp',
        'timestamp with time zone': 'timestamp',
        'date': 'date',
        'time without time zone': 'time',
        'numeric': 'decimal',
        'json': 'json',
        'jsonb': 'jsonb',
        'uuid': 'uuid',
        'ARRAY': 'text' # Handle arrays as text for now
    }
    
    base_type = type_mapping.get(data_type, 'text')
    
    # Handle specific cases
    if base_type == 'serial' and 'nextval' in (column_info['default'] or ''):
        return 'serial'
    elif base_type == 'varchar' and column_info['max_length']:
        return f'varchar({{ length: {column_info["max_length"]} }})'
    elif base_type == 'decimal' and column_info['precision']:
        if column_info['scale']:
            return f'decimal({{ precision: {column_info["precision"]}, scale: {column_info["scale"]} }})'
        else:
            return f'decimal({{ precision: {column_info["precision"]} }})'
    elif base_type == 'timestamp':
        if data_type == 'timestamp with time zone':
            return 'timestamp({{ withTimezone: true }})'
        else:
            return 'timestamp'
    
    return base_type

def generate_drizzle_table_definition(table_name, columns, primary_keys, foreign_keys, unique_columns, enums):
    """Generate Drizzle table definition"""
    lines = []
    lines.append(f'export const {camel_case(table_name)} = pgTable("{table_name}", {{')
    
    for column in columns:
        col_name = column['name']
        drizzle_type = map_postgres_to_drizzle_type(column, enums)
        
        # Build column definition
        col_def = f'  {camel_case(col_name)}: {drizzle_type}("{col_name}")'
        
        # Add modifiers
        modifiers = []
        
        # Primary key
        if col_name in primary_keys:
            if drizzle_type == 'serial':
                modifiers.append('.primaryKey()')
            elif drizzle_type == 'uuid':
                modifiers.append('.primaryKey().defaultRandom()')
            else:
                modifiers.append('.primaryKey()')
        
        # Foreign key
        if col_name in foreign_keys:
            ref_table = foreign_keys[col_name]['referenced_table']
            ref_col = foreign_keys[col_name]['referenced_column']
            modifiers.append(f'.references(() => {camel_case(ref_table)}.{camel_case(ref_col)})')
        
        # Unique
        if col_name in unique_columns and col_name not in primary_keys:
            modifiers.append('.unique()')
        
        # Not null
        if not column['is_nullable']:
            modifiers.append('.notNull()')
        
        # Default value
        if column['default'] and 'nextval' not in column['default']:
            default_val = column['default']
            if default_val.startswith("'") and default_val.endswith("'::text"):
                default_val = default_val[1:-7]  # Remove quotes and ::text
                modifiers.append(f'.default("{default_val}")')
            elif default_val in ['true', 'false']:
                modifiers.append(f'.default({default_val})')
            elif default_val == 'now()':
                modifiers.append('.defaultNow()')
            elif default_val.startswith("'") and default_val.endswith("'"):
                default_val = default_val[1:-1]  # Remove quotes
                modifiers.append(f'.default("{default_val}")')
        
        col_def += ''.join(modifiers)
        col_def += ','
        lines.append(col_def)
    
    lines.append('});')
    lines.append('')
    
    return '\n'.join(lines)

def camel_case(snake_str):
    """Convert snake_case to camelCase"""
    components = snake_str.split('_')
    return components[0] + ''.join(word.capitalize() for word in components[1:])

def analyze_complete_schema():
    """Main function to analyze complete database schema"""
    print("=== Complete Database Schema Analysis ===")
    
    conn = get_database_connection()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        # Get all enums first
        print("Analyzing custom enums...")
        enums = get_enums(cursor)
        print(f"Found {len(enums)} custom enums:")
        for enum_name, values in enums.items():
            print(f"  {enum_name}: {values}")
        
        # Get all tables
        print("\nAnalyzing tables...")
        tables = get_all_tables(cursor)
        print(f"Found {len(tables)} tables:")
        for table in tables:
            print(f"  {table}")
        
        # Analyze each table in detail
        print("\n=== Detailed Table Analysis ===")
        
        schema_output = []
        
        # Add enum definitions first
        if enums:
            schema_output.append("// Custom PostgreSQL Enums")
            for enum_name, values in enums.items():
                values_str = ', '.join([f'"{v}"' for v in values])
                schema_output.append(f'export const {enum_name}Enum = pgEnum("{enum_name}", [{values_str}]);')
            schema_output.append('')
        
        for table_name in tables:
            print(f"\n--- {table_name} ---")
            
            # Get detailed info
            columns = get_table_columns(cursor, table_name)
            primary_keys = get_primary_keys(cursor, table_name)
            foreign_keys = get_foreign_keys(cursor, table_name)
            unique_columns = get_unique_constraints(cursor, table_name)
            
            print(f"Columns ({len(columns)}):")
            for col in columns:
                nullable = "NULL" if col['is_nullable'] else "NOT NULL"
                default = f" DEFAULT {col['default']}" if col['default'] else ""
                print(f"  {col['name']}: {col['data_type']} {nullable}{default}")
            
            print(f"Primary Keys: {primary_keys}")
            print(f"Foreign Keys: {foreign_keys}")
            print(f"Unique Constraints: {unique_columns}")
            
            # Generate Drizzle definition
            table_def = generate_drizzle_table_definition(
                table_name, columns, primary_keys, foreign_keys, unique_columns, enums
            )
            schema_output.append(table_def)
        
        # Write complete schema to file
        print("\n=== Writing Complete Schema ===")
        
        # Read current schema header (imports, etc.)
        schema_header = '''import { relations } from "drizzle-orm";
import { boolean, date, decimal, integer, json, jsonb, pgEnum, pgTable, serial, text, time, timestamp, varchar, uuid, bigserial, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

'''
        
        complete_schema = schema_header + '\n'.join(schema_output)
        
        with open('/workspaces/coach-will-gymnastics-clean/generated_schema.ts', 'w') as f:
            f.write(complete_schema)
        
        print("Complete schema written to: generated_schema.ts")
        print("\nReview the generated schema and replace your shared/schema.ts content")
        print("This will ensure your Drizzle schema exactly matches your database!")
        
    except Exception as e:
        print(f"Analysis error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        conn.close()

if __name__ == "__main__":
    analyze_complete_schema()
