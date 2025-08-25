#!/usr/bin/env python3

import re

# Read the storage.ts file
with open('/workspaces/coach-will-gymnastics-clean/server/storage.ts', 'r') as f:
    content = f.read()

print("=== FINDING ALL PARENT SELECT QUERIES ===")

# Find all parent select statements that are missing blog_emails and last_login_at
parent_selects = re.findall(
    r"\.select\('([^']*(?:first_name|last_name)[^']*)'\)",
    content
)

for i, select in enumerate(parent_selects):
    print(f"{i+1}. {select}")
    if 'blog_emails' not in select and 'last_login_at' not in select:
        print(f"   ❌ MISSING: blog_emails, last_login_at")
    else:
        print(f"   ✅ HAS: blog_emails, last_login_at")

print(f"\nFound {len(parent_selects)} parent select statements")

# Count how many need fixing
needs_fixing = [s for s in parent_selects if 'blog_emails' not in s and 'last_login_at' not in s]
print(f"Need fixing: {len(needs_fixing)}")
