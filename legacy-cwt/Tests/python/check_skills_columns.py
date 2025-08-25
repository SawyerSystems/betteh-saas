import os, sys, json, psycopg

DB_URL = os.getenv("DATABASE_URL") or os.getenv("DATABASE_DIRECT_URL")
if not DB_URL:
    print("ERROR: DATABASE_URL (or DATABASE_DIRECT_URL) not set", file=sys.stderr)
    sys.exit(2)

QUERY = """
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='skills'
ORDER BY ordinal_position
"""

with psycopg.connect(DB_URL) as conn:
    with conn.cursor() as cur:
        cur.execute(QUERY)
        cols = cur.fetchall()
        print(json.dumps([
            {"column": c[0], "type": c[1], "nullable": c[2]} for c in cols
        ], indent=2))
