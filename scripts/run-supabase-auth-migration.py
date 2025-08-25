#!/usr/bin/env python3
"""
Execute Supabase Auth multi-tenant setup migration
"""

import os
import sys
import logging
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Execute the Supabase Auth setup migration"""
    
    # Get database URL
    db_url = os.getenv("DIRECT_DATABASE_URL") or os.getenv("DATABASE_URL")
    
    if not db_url:
        logger.error("Missing DIRECT_DATABASE_URL or DATABASE_URL environment variable")
        sys.exit(1)
    
    logger.info("🚀 Starting Supabase Auth multi-tenant setup...")
    
    # Read the migration file
    try:
        with open('migrations/stage4-supabase-auth-setup.sql', 'r') as f:
            migration_sql = f.read()
    except FileNotFoundError:
        logger.error("Migration file not found: migrations/stage4-supabase-auth-setup.sql")
        sys.exit(1)
    
    # Split into individual statements (PostgreSQL functions can't be executed in one go)
    statements = []
    current_statement = []
    in_function = False
    
    for line in migration_sql.split('\n'):
        line = line.strip()
        
        # Skip comments and empty lines
        if not line or line.startswith('--'):
            continue
            
        # Track function boundaries
        if 'CREATE OR REPLACE FUNCTION' in line or 'CREATE FUNCTION' in line:
            in_function = True
        elif line == '$$;' or (line.endswith('$$;') and in_function):
            in_function = False
            current_statement.append(line)
            statements.append('\n'.join(current_statement))
            current_statement = []
            continue
            
        current_statement.append(line)
        
        # For non-function statements, split on semicolon
        if not in_function and line.endswith(';') and not line.endswith('$$;'):
            statements.append('\n'.join(current_statement))
            current_statement = []
    
    # Add any remaining statement
    if current_statement:
        statements.append('\n'.join(current_statement))
    
    # Connect to the database
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True  # For DDL statements
        logger.info("✅ Connected to database successfully")
    except Exception as e:
        logger.error(f"❌ Failed to connect to database: {str(e)}")
        sys.exit(1)
    
    # Execute each statement
    success_count = 0
    with conn.cursor() as cursor:
        for i, statement in enumerate(statements):
            statement = statement.strip()
            if not statement:
                continue
                
            try:
                logger.info(f"📝 Executing statement {i+1}/{len(statements)}")
                
                # Execute the SQL statement
                cursor.execute(statement)
                
                logger.info(f"✅ Statement {i+1} executed successfully")
                success_count += 1
                    
            except Exception as e:
                logger.error(f"❌ Error executing statement {i+1}: {str(e)}")
                logger.error(f"Statement was: {statement[:100]}...")
                # Continue with other statements
                continue
    
    conn.close()
    logger.info(f"🎉 Migration completed! {success_count}/{len(statements)} statements executed successfully")
    
    if success_count == len(statements):
        logger.info("✅ All statements executed successfully!")
        logger.info("🎯 Next: Update server code to use Supabase Auth with JWT claims")
    else:
        logger.warning(f"⚠️  {len(statements) - success_count} statements failed - check logs above")

if __name__ == "__main__":
    main()
