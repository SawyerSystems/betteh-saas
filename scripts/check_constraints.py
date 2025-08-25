#!/usr/bin/env python3
import os
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

def main():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL') or os.getenv('DIRECT_DATABASE_URL')
    if not db_url:
        print('ERROR: Neither DATABASE_URL nor DIRECT_DATABASE_URL set in environment.')
        return

    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        # Check constraint definition
        constraint_q = """
        SELECT 
            tc.constraint_name,
            cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'athlete_skills' 
        AND tc.constraint_type = 'CHECK'
        AND tc.table_schema = 'public'
        """
        
        cur = conn.execute(constraint_q)
        constraints = cur.fetchall()
        
        print("Check constraints on athlete_skills table:")
        for constraint in constraints:
            print(f"- {constraint['constraint_name']}: {constraint['check_clause']}")
        
        # Also check if there's an enum type
        enum_q = """
        SELECT 
            t.typname,
            string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname LIKE '%status%'
        GROUP BY t.typname
        """
        
        cur = conn.execute(enum_q)
        enums = cur.fetchall()
        
        if enums:
            print("\nRelated enum types:")
            for enum in enums:
                print(f"- {enum['typname']}: {enum['enum_values']}")

if __name__ == '__main__':
    main()
