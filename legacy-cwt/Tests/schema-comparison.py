import json
import os
import re
import sys
from typing import Dict, Any

from dotenv import load_dotenv


REQUIRED_COLUMNS = {
	"session_confirmation_email_sent": {
		"data_type": "boolean",
		"is_nullable": "NO",
		"default_contains": "false",
	},
	"session_confirmation_email_sent_at": {
		# In Postgres/Supabase, timestamptz shows as 'timestamp with time zone'
		# timestamp without tz shows as 'timestamp without time zone'
		# We'll accept either here and let the attached schema be the source of truth for tz decision
		"data_type_any_of": [
			"timestamp with time zone",
			"timestamp without time zone",
		],
		"is_nullable": "YES",
	},
}


def read_supabase_schema_json(path: str) -> Dict[str, Any]:
	with open(path, "r") as f:
		return json.load(f)


def parse_shared_schema_ts(path: str) -> Dict[str, Any]:
	# Lightweight check: ensure drizzle schema contains both columns on bookings
	with open(path, "r", encoding="utf-8") as f:
		content = f.read()
	has_sent = "session_confirmation_email_sent" in content
	has_sent_at = "session_confirmation_email_sent_at" in content
	return {"has_sent": has_sent, "has_sent_at": has_sent_at}


def parse_attached_schema_txt(path: str) -> Dict[str, Any]:
	try:
		with open(path, "r", encoding="utf-8") as f:
			content = f.read()
	except FileNotFoundError:
		return {"attached_present": False}

	# Try to locate bookings table definition and detect column lines
	bookings_block = re.findall(r"CREATE TABLE\s+public\.bookings[\s\S]*?;", content, re.IGNORECASE)
	block = bookings_block[0] if bookings_block else ""
	return {
		"attached_present": True,
		"attached_has_sent": "session_confirmation_email_sent" in block,
		"attached_has_sent_at": "session_confirmation_email_sent_at" in block,
	}


def compare(cols_json: Dict[str, Any]) -> int:
	columns = {c["column_name"]: c for c in cols_json.get("columns", [])}
	failures = []

	# bookings.session_confirmation_email_sent
	sent = columns.get("session_confirmation_email_sent")
	if not sent:
		failures.append("Missing column: session_confirmation_email_sent")
	else:
		if sent.get("data_type") != REQUIRED_COLUMNS["session_confirmation_email_sent"]["data_type"]:
			failures.append(
				f"session_confirmation_email_sent data_type expected 'boolean' got '{sent.get('data_type')}'"
			)
		if sent.get("is_nullable") != REQUIRED_COLUMNS["session_confirmation_email_sent"]["is_nullable"]:
			failures.append(
				f"session_confirmation_email_sent is_nullable expected 'NO' got '{sent.get('is_nullable')}'"
			)
		default = (sent.get("column_default") or "").lower()
		if "default_contains" in REQUIRED_COLUMNS["session_confirmation_email_sent"]:
			if "false" not in default:
				failures.append(
					f"session_confirmation_email_sent default should include 'false' got '{sent.get('column_default')}'"
				)

	# bookings.session_confirmation_email_sent_at
	sent_at = columns.get("session_confirmation_email_sent_at")
	if not sent_at:
		failures.append("Missing column: session_confirmation_email_sent_at")
	else:
		allowed = set(REQUIRED_COLUMNS["session_confirmation_email_sent_at"]["data_type_any_of"])  # type: ignore
		if sent_at.get("data_type") not in allowed:
			failures.append(
				f"session_confirmation_email_sent_at data_type expected one of {sorted(allowed)} got '{sent_at.get('data_type')}'"
			)
		if sent_at.get("is_nullable") != REQUIRED_COLUMNS["session_confirmation_email_sent_at"]["is_nullable"]:
			failures.append(
				f"session_confirmation_email_sent_at is_nullable expected 'YES' got '{sent_at.get('is_nullable')}'"
			)

	if failures:
		print("Schema parity check: FAIL")
		for f in failures:
			print(f"- {f}")
		return 1
	else:
		print("Schema parity check: PASS — bookings has both session confirmation columns with expected shapes")
		return 0


def main():
	load_dotenv()
	# Pull output JSON from pull-supabase-schema.py via stdin or file path
	if not sys.stdin.isatty():
		data = sys.stdin.read()
		cols_json = json.loads(data)
	else:
		# Allow running directly on a previously saved json file
		path = os.getenv("BOOKINGS_SCHEMA_JSON", "bookings_schema.json")
		if not os.path.exists(path):
			print("Provide schema JSON via stdin or set BOOKINGS_SCHEMA_JSON to a file path", file=sys.stderr)
			sys.exit(2)
		cols_json = read_supabase_schema_json(path)

	# Resolve paths relative to this script directory
	script_dir = os.path.dirname(os.path.abspath(__file__))
	repo_root = os.path.abspath(os.path.join(script_dir, ".."))
	shared_schema_path = os.path.join(repo_root, "shared", "schema.ts")
	attached_schema_path = os.path.join(repo_root, "attached_assets", "complete_current_schema.txt")
	shared_info = parse_shared_schema_ts(shared_schema_path)
	attached_info = parse_attached_schema_txt(attached_schema_path)

	print(f"shared/schema.ts contains sent columns: {shared_info}")
	print(f"attached schema has bookings columns: {attached_info}")

	exit_code = compare(cols_json)
	sys.exit(exit_code)


if __name__ == "__main__":
	main()

