import os
import sys
import json
from typing import Any, Dict, List

from dotenv import load_dotenv
import psycopg2
import psycopg2.extras


def get_db_url() -> str:
    load_dotenv()
    url = os.getenv("DATABASE_URL") or os.getenv("DATABASE_DIRECT_URL")
    if not url:
        raise RuntimeError("DATABASE_URL (or DATABASE_DIRECT_URL) not set in environment")
    return url


def fetch_tables(conn) -> List[str]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type='BASE TABLE'
            ORDER BY table_name;
            """
        )
        return [r[0] for r in cur.fetchall()]


def fetch_columns(conn, table: str) -> List[Dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position;
            """,
            (table,),
        )
        rows = cur.fetchall()
        cols = []
        for r in rows:
            cols.append(
                {
                    "column_name": r[0],
                    "data_type": r[1],
                    "is_nullable": r[2],
                    "column_default": None if r[3] is None else str(r[3]),
                }
            )
        return cols


def fetch_sample_record(conn, table: str) -> Dict[str, Any] | None:
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        try:
            cur.execute(f"SELECT * FROM public.{table} LIMIT 1;")
            rec = cur.fetchone()
            return dict(rec) if rec else None
        except Exception:
            return None


def main():
    url = get_db_url()
    conn = psycopg2.connect(url)
    try:
        tables = fetch_tables(conn)
        data = {"tables": {}, "timestamp": os.getenv("SCHEMA_SNAPSHOT_TIME")}
        for t in tables:
            cols = fetch_columns(conn, t)
            sample = fetch_sample_record(conn, t)
            data["tables"][t] = {
                "columns": cols,
                "sample_record": sample,
            }
        print(json.dumps(data, indent=2, default=str))
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
