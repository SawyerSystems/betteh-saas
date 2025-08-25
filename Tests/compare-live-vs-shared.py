import json
import os
import re
import sys
from typing import Dict, List, Set


def load_snapshot(path: str) -> Dict:
    with open(path, 'r') as f:
        return json.load(f)


def read_shared_schema(path: str) -> str:
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def find_table_block(ts: str, table: str) -> str | None:
    # Deterministically locate pgTable('<table>', { ... }) and return the content inside { ... }
    needle_single = f"pgTable('{table}'"
    needle_double = f'pgTable("{table}"'
    idx = ts.find(needle_single)
    if idx == -1:
        idx = ts.find(needle_double)
    if idx == -1:
        return None
    # Find the first '{' after this point
    start_brace = ts.find('{', idx)
    if start_brace == -1:
        return None
    # Brace matching to find the corresponding '}'
    depth = 0
    end_brace = -1
    for i in range(start_brace, len(ts)):
        c = ts[i]
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                end_brace = i
                break
    if end_brace == -1:
        return None
    # Return content inside braces
    return ts[start_brace + 1:end_brace]


def extract_columns_from_block(block: str) -> Set[str]:
    # Find occurrences of typeFn("col") where typeFn is one of supported types
    pattern = re.compile(
        r"\b(?:text|integer|serial|timestamp|time|date|boolean|decimal|json|varchar)\s*\(\s*['\"]([a-zA-Z0-9_]+)['\"]",
        re.DOTALL,
    )
    cols: Set[str] = set(m.group(1) for m in pattern.finditer(block))
    return cols


def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    snapshot_path = os.getenv('SNAPSHOT', os.path.join(repo_root, 'attached_assets', '_live_schema_snapshot.json'))
    shared_path = os.path.join(repo_root, 'shared', 'schema.ts')

    data = load_snapshot(snapshot_path)
    ts = read_shared_schema(shared_path)

    tables = sorted(data.get('tables', {}).keys())
    missing_tables_in_shared: List[str] = []
    column_diffs: Dict[str, Dict[str, List[str]]] = {}

    for t in tables:
        block = find_table_block(ts, t)
        if not block:
            missing_tables_in_shared.append(t)
            continue
        shared_cols = extract_columns_from_block(block)
        live_cols = {c['column_name'] for c in data['tables'][t]['columns']}
        missing_in_shared = sorted(list(live_cols - shared_cols))
        missing_in_live = sorted(list(shared_cols - live_cols))
        if missing_in_shared or missing_in_live:
            column_diffs[t] = {
                'missing_in_shared': missing_in_shared,
                'missing_in_live': missing_in_live,
            }

    report = {
        'missing_tables_in_shared': missing_tables_in_shared,
        'column_diffs': column_diffs,
    }
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)
