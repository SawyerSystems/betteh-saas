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
        # Check constraint definition for athlete_skill_videos
        constraint_q = """
        SELECT 
            tc.constraint_name,
            cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'athlete_skill_videos' 
        AND tc.constraint_type = 'CHECK'
        AND tc.table_schema = 'public'
        """
        
        cur = conn.execute(constraint_q)
        constraints = cur.fetchall()
        
        print("Check constraints on athlete_skill_videos table:")
        for constraint in constraints:
            print(f"- {constraint['constraint_name']}: {constraint['check_clause']}")

if __name__ == '__main__':
    main()
