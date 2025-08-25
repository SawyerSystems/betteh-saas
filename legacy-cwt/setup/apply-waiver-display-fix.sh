#!/bin/bash

# Script to apply the waiver display fix to the database

echo "Applying waiver display fix to database..."
echo "This will update the athletes_with_waiver_status view to include relationship_to_athlete field"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable not set"
  echo "Please set DATABASE_URL or provide connection details to continue"
  exit 1
fi

echo "Running SQL fix..."
psql "$DATABASE_URL" -f fixed-add-relationship-to-athlete-view.sql

if [ $? -eq 0 ]; then
  echo "✅ Successfully updated athletes_with_waiver_status view"
  echo "The parent portal waiver cards should now display signer name and relationship correctly"
else
  echo "❌ Error applying the SQL fix"
  echo "Please check the SQL syntax and database connection"
  exit 1
fi

echo "Testing the updated view..."
psql "$DATABASE_URL" -c "SELECT id, waiver_signer_name, waiver_relationship_to_athlete, waiver_signed_at FROM athletes_with_waiver_status WHERE latest_waiver_id IS NOT NULL LIMIT 3;"

echo ""
echo "View update complete. Please check the parent portal to verify the fix."
