#!/usr/bin/env python3
import json
import os
import sys
from dataclasses import dataclass
from typing import Dict, List, Tuple

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), '..', 'attached_assets', 'complete_current_schema.txt')

@dataclass
class Column:
    column_name: str
    data_type: str

@dataclass
class Table:
    name: str
    columns: List[Column]


def load_schema_file() -> Dict:
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        text = f.read()
    # Extract the JSON after the marker 'DETAILED SCHEMA DATA:'
    marker = 'DETAILED SCHEMA DATA:'
    idx = text.find(marker)
    if idx == -1:
        raise RuntimeError('Marker not found in schema file')
    json_part = text[idx + len(marker):].strip()
    # Some files may have leading code fences or plaintext labels; try to locate first '{'
    brace = json_part.find('{')
    if brace > 0:
        json_part = json_part[brace:]
    data = json.loads(json_part)
    return data


def fetch_live_schema(conn) -> Dict[str, List[Tuple[str, str]]]:
    """Return mapping table_name -> list of (column_name, data_type). Only public schema."""
    q = """
    select c.table_name,
           c.column_name,
           case
             when c.udt_name = 'hstore' then 'hstore'
             when c.data_type = 'ARRAY' then 'ARRAY'
             when c.data_type ilike 'USER-DEFINED' then c.udt_name
             else c.data_type
           end as data_type
    from information_schema.columns c
    join information_schema.tables t on t.table_name = c.table_name and t.table_schema = c.table_schema
    where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
    order by c.table_name, c.ordinal_position
    """
    cur = conn.execute(q)
    rows = cur.fetchall()
    out: Dict[str, List[Tuple[str, str]]] = {}
    for r in rows:
        out.setdefault(r['table_name'], []).append((r['column_name'], r['data_type']))
    return out


def compare(schema_file_data: Dict, live: Dict[str, List[Tuple[str, str]]]) -> List[str]:
    problems: List[str] = []
    file_tables = schema_file_data.get('tables', {})

    # Compare table presence
    file_table_names = set(file_tables.keys())
    live_table_names = set(live.keys())

    missing_in_live = file_table_names - live_table_names
    extra_in_live = live_table_names - file_table_names
    if missing_in_live:
        problems.append(f"Tables missing in live: {sorted(missing_in_live)}")
    if extra_in_live:
        problems.append(f"Tables missing in file: {sorted(extra_in_live)}")

    # Compare columns and types
    for tname in sorted(file_table_names & live_table_names):
        file_cols = [(c['column_name'], c['data_type']) for c in file_tables[tname].get('columns', [])]
        live_cols = live.get(tname, [])
        file_col_names = [c[0] for c in file_cols]
        live_col_names = [c[0] for c in live_cols]

        # Column presence
        missing_cols = set(file_col_names) - set(live_col_names)
        extra_cols = set(live_col_names) - set(file_col_names)
        if missing_cols:
            problems.append(f"{tname}: columns missing in live: {sorted(missing_cols)}")
        if extra_cols:
            problems.append(f"{tname}: columns missing in file: {sorted(extra_cols)}")

        # Type mismatches
        live_types = {n: t for n, t in live_cols}
        for n, t in file_cols:
            lt = live_types.get(n)
            if lt and lt != t:
                problems.append(f"{tname}.{n}: type mismatch file={t} live={lt}")

    return problems


def main():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        # Fallback to DIRECT_DATABASE_URL for local Supabase direct connections
        db_url = os.getenv('DIRECT_DATABASE_URL')
    if not db_url:
        print('ERROR: DATABASE_URL (or DIRECT_DATABASE_URL) not set in environment. Skipping live check.', file=sys.stderr)
        # Still parse the file to ensure JSON integrity
        _ = load_schema_file()
        sys.exit(2)

    schema_file_data = load_schema_file()

    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        live = fetch_live_schema(conn)

    problems = compare(schema_file_data, live)

    if problems:
        print('SCHEMA DRIFT DETECTED:')
        for p in problems:
            print('-', p)
        sys.exit(1)
    else:
        print('Schema file matches live database (tables/columns/types).')
        sys.exit(0)


if __name__ == '__main__':
    main()
