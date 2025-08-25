import os
import json
import sys
from typing import List, Dict

from dotenv import load_dotenv
import psycopg2


def get_db_url() -> str:
	load_dotenv()
	url = os.getenv("DATABASE_URL") or os.getenv("DATABASE_DIRECT_URL")
	if not url:
		raise RuntimeError("DATABASE_URL (or DATABASE_DIRECT_URL) not set in environment")
	return url


def get_bookings_columns() -> List[Dict[str, str]]:
	url = get_db_url()
	conn = psycopg2.connect(url)
	try:
		with conn.cursor() as cur:
			cur.execute(
				"""
				SELECT column_name, data_type, is_nullable, column_default
				FROM information_schema.columns
				WHERE table_schema = 'public' AND table_name = 'bookings'
				ORDER BY ordinal_position;
				"""
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
	finally:
		conn.close()


def main():
	try:
		cols = get_bookings_columns()
		print(json.dumps({"table": "bookings", "columns": cols}, indent=2))
	except Exception as e:
		print(f"Error: {e}", file=sys.stderr)
		sys.exit(1)


if __name__ == "__main__":
	main()

