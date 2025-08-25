import os, sys, json, psycopg

DB_URL = os.getenv("DATABASE_URL") or os.getenv("DATABASE_DIRECT_URL")
if not DB_URL:
    print("ERROR: DATABASE_URL (or DATABASE_DIRECT_URL) not set", file=sys.stderr)
    sys.exit(2)

# Pull a summarized schema similar to the existing asset format.
QUERY = """
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE'
ORDER BY table_name;
"""

DETAILS_QUERY = """
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name=%s
ORDER BY ordinal_position;
"""

OUTPUT_PATH = os.path.join('attached_assets', 'complete_current_schema.txt')

with psycopg.connect(DB_URL) as conn:
    with conn.cursor() as cur:
        cur.execute(QUERY)
        tables = [r[0] for r in cur.fetchall()]
        lines = []
        lines.append("Complete Schema - Auto-updated via script\n")
        lines.append("TABLE LIST:\n" + "\n".join(f"- {t}" for t in tables) + "\n\n")
        lines.append("DETAILED SCHEMA DATA:\n")
        lines.append("{\n  \"tables\": {\n")
        first_table = True
        for t in tables:
            cur.execute(DETAILS_QUERY, (t,))
            cols = cur.fetchall()
            if not first_table:
                lines.append(",\n")
            lines.append(f"    \"{t}\": {{\n      \"exists\": true,\n      \"columns\": [\n")
            for i, (col, typ) in enumerate(cols):
                sep = "," if i < len(cols) - 1 else ""
                lines.append(f"        {{\n          \"column_name\": \"{col}\",\n          \"data_type\": \"{typ}\"\n        }}{sep}\n")
            lines.append("      ]\n    }")
            first_table = False
        lines.append("\n  }\n}\n")

content = "".join(lines)
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Updated {OUTPUT_PATH} with current schema summary.")
