#!/usr/bin/env python3
"""
Search the codebase to see how is_available and is_availability_block are used
"""

import os
import re

def search_codebase():
    print("🔍 Searching Codebase for Availability Column Usage")
    print("=" * 55)
    
    # Files to search
    search_files = [
        "shared/schema.ts",
        "server/storage.ts", 
        "server/routes.ts",
        "migrate-availability-exceptions-to-events.sql",
        "add-availability-blocking-to-events.sql"
    ]
    
    patterns = {
        "is_available": r"is_available|isAvailable",
        "is_availability_block": r"is_availability_block|isAvailabilityBlock"
    }
    
    results = {"is_available": [], "is_availability_block": []}
    
    for file_path in search_files:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                content = f.read()
                lines = content.split('\n')
                
                for pattern_name, pattern in patterns.items():
                    matches = re.finditer(pattern, content, re.IGNORECASE)
                    for match in matches:
                        # Find line number
                        line_num = content[:match.start()].count('\n') + 1
                        line_content = lines[line_num - 1].strip()
                        
                        results[pattern_name].append({
                            "file": file_path,
                            "line": line_num,
                            "content": line_content
                        })
    
    # Print results
    for column_name, matches in results.items():
        print(f"\n📋 {column_name} usage ({len(matches)} matches):")
        print("-" * 40)
        
        if not matches:
            print("   No usage found")
        else:
            for match in matches:
                print(f"   {match['file']}:{match['line']}")
                print(f"      {match['content']}")
                print()
    
    # Analysis
    print("\n💡 Usage Analysis:")
    
    is_available_count = len(results["is_available"])
    is_availability_block_count = len(results["is_availability_block"])
    
    print(f"is_available: {is_available_count} references")
    print(f"is_availability_block: {is_availability_block_count} references")
    
    if is_availability_block_count > is_available_count:
        print("\n✅ is_availability_block is more widely used")
    elif is_available_count > is_availability_block_count:
        print("\n⚠️  is_available is more widely used")
    else:
        print("\n🤔 Both columns used equally")
    
    print("\n🎯 Recommendation:")
    print("Since we're doing a migration anyway, we should:")
    print("1. Remove is_available completely")
    print("2. Use only is_availability_block as the single source of truth")
    print("3. Simplify the logic to avoid confusion")

if __name__ == "__main__":
    search_codebase()
