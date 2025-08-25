import os
import sys
import json
import re
from typing import Any, Dict

import psycopg

def resolve_db_url() -> str | None:
  # Prefer DATABASE_URL, fallback to DATABASE_DIRECT_URL
  env_url = os.getenv("DATABASE_URL") or os.getenv("DATABASE_DIRECT_URL")
  if env_url:
    return env_url
  # Try to parse from test helper files (kept within the repo for diagnostics)
  candidates = [
    "Tests/tools/cjs/run-sql-direct.cjs",
    "Tests/tools/cjs/run-sql.cjs",
  ]
  url_re = re.compile(r"postgresql://[^'\"]+")
  for path in candidates:
    try:
      with open(path, "r", encoding="utf-8") as f:
        m = url_re.search(f.read())
        if m:
          return m.group(0)
    except FileNotFoundError:
      continue
  return None

DB_URL = resolve_db_url()
if not DB_URL:
  print("ERROR: Could not resolve database URL from env or repo test files", file=sys.stderr)
  sys.exit(2)

QUERY = """
WITH col AS (
  SELECT
    c.table_schema,
    c.table_name,
    c.column_name,
    c.data_type,
    c.udt_name,
    c.ordinal_position
  FROM information_schema.columns c
  WHERE c.table_name = 'site_inquiries'
    AND c.column_name = 'status'
)
SELECT
  col.table_schema,
  col.table_name,
  col.column_name,
  col.data_type,
  col.udt_name,
  -- Check enum labels if enum
  CASE WHEN t.typcategory = 'E' THEN (
    SELECT json_agg(e.enumlabel ORDER BY e.enumsortorder)
    FROM pg_enum e WHERE e.enumtypid = t.oid
  ) ELSE NULL END AS enum_labels,
  -- Check constraints mentioning status
  (
    SELECT json_agg(json_build_object('conname', con.conname, 'consrc', pg_get_constraintdef(con.oid)))
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = con.connamespace
    WHERE nsp.nspname = col.table_schema
      AND cls.relname = col.table_name
      AND pg_get_constraintdef(con.oid) LIKE '%status%'
  ) AS related_constraints
FROM col
LEFT JOIN pg_type t ON t.typname = col.udt_name;
"""

with psycopg.connect(DB_URL) as conn:
    with conn.cursor() as cur:
        cur.execute(QUERY)
        row = cur.fetchone()
        if not row:
            print("ERROR: site_inquiries.status not found", file=sys.stderr)
            sys.exit(3)
        schema, table, column, data_type, udt_name, enum_labels, related_constraints = row
        result: Dict[str, Any] = {
            "schema": schema,
            "table": table,
            "column": column,
            "data_type": data_type,
            "udt_name": udt_name,
            "enum_labels": enum_labels,
            "related_constraints": related_constraints,
        }
        print(json.dumps(result, indent=2))
