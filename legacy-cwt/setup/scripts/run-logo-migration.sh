#!/bin/bash

# Script to run the site-content-logo-schema.sql file with environment variables

# Check if database credentials exist in environment
if [ -z "$SUPABASE_HOST" ] || [ -z "$SUPABASE_PORT" ] || [ -z "$SUPABASE_DB" ] || [ -z "$SUPABASE_USER" ]; then
  echo "Error: Database environment variables not set."
  echo "Please set SUPABASE_HOST, SUPABASE_PORT, SUPABASE_DB, and SUPABASE_USER."
  exit 1
fi

# Ask for password if not in environment
if [ -z "$SUPABASE_PASSWORD" ]; then
  echo "Enter database password for $SUPABASE_USER:"
  read -s SUPABASE_PASSWORD
  export SUPABASE_PASSWORD
fi

# Run the SQL file
PGPASSWORD=$SUPABASE_PASSWORD psql \
  -h "$SUPABASE_HOST" \
  -p "$SUPABASE_PORT" \
  -d "$SUPABASE_DB" \
  -U "$SUPABASE_USER" \
  -f site-content-logo-schema.sql

# Check if the command succeeded
if [ $? -eq 0 ]; then
  echo "SQL migration completed successfully."
else
  echo "SQL migration failed."
  exit 1
fi
