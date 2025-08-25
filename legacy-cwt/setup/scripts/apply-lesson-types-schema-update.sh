#!/bin/bash

# Apply lesson_types schema updates (reservation_fee, key_points, max_athletes, is_active)

set -euo pipefail

if [ -z "${SUPABASE_HOST:-}" ] || [ -z "${SUPABASE_PORT:-}" ] || [ -z "${SUPABASE_DB:-}" ] || [ -z "${SUPABASE_USER:-}" ]; then
	echo "Error: Database environment variables not set."
	echo "Please export SUPABASE_HOST, SUPABASE_PORT, SUPABASE_DB, and SUPABASE_USER."
	exit 1
fi

if [ -z "${SUPABASE_PASSWORD:-}" ]; then
	read -s -p "Enter database password for $SUPABASE_USER: " SUPABASE_PASSWORD
	echo
fi

echo "Applying lesson_types schema update to $SUPABASE_DB@$SUPABASE_HOST:$SUPABASE_PORT..."

PGPASSWORD="$SUPABASE_PASSWORD" psql \
	-h "$SUPABASE_HOST" \
	-p "$SUPABASE_PORT" \
	-d "$SUPABASE_DB" \
	-U "$SUPABASE_USER" \
	-v ON_ERROR_STOP=1 \
	-f lesson-types-schema-update.sql

status=$?
if [ $status -eq 0 ]; then
	echo "Lesson types schema migration completed successfully."
else
	echo "Lesson types schema migration failed with status $status."
	exit $status
fi

