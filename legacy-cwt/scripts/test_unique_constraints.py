#!/usr/bin/env python3
"""
Test if unique constraints will succeed before running db:push
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def test_unique_constraints():
    """Test if adding unique constraints will succeed"""
    
    conn = psycopg2.connect(os.getenv('DIRECT_DATABASE_URL'))
    cursor = conn.cursor()
    
    tables_to_test = [
        ('lesson_types', 'name'),
        ('genders', 'name'), 
        ('parent_password_reset_tokens', 'token'),
        ('focus_areas', 'name'),
        ('apparatus', 'name'),
        ('side_quests', 'name'),
        ('admins', 'email')
    ]
    
    print("Testing unique constraints...")
    all_safe = True
    
    for table, column in tables_to_test:
        cursor.execute(f"""
            SELECT {column}, COUNT(*) as count 
            FROM {table} 
            GROUP BY {column} 
            HAVING COUNT(*) > 1;
        """)
        
        duplicates = cursor.fetchall()
        if duplicates:
            print(f"❌ {table}.{column} has duplicates:")
            for dup in duplicates:
                print(f"  '{dup[0]}' appears {dup[1]} times")
            all_safe = False
        else:
            print(f"✅ {table}.{column} - no duplicates found")
    
    conn.close()
    
    if all_safe:
        print("\n🎉 All unique constraints should succeed!")
        print("It's safe to run 'npm run db:push' and answer 'No' to truncate questions.")
    else:
        print("\n⚠️  Some tables have duplicate values. Fix duplicates before pushing.")
    
    return all_safe

if __name__ == "__main__":
    test_unique_constraints()
