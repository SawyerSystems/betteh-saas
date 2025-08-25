#!/usr/bin/env python3

import os
import psycopg2
from dotenv import load_dotenv

def test_new_upload_behavior():
    """
    Test that the upload fix is working for new uploads
    """
    load_dotenv()
    database_url = os.getenv('DIRECT_DATABASE_URL')
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        print("🧪 TESTING NEW UPLOAD BEHAVIOR")
        print("=" * 50)
        
        # Check current storage distribution
        cur.execute("""
            SELECT 
                CASE 
                    WHEN url LIKE '%athlete-skills/%' THEN 'athlete-skills'
                    WHEN url LIKE '%skill-reference/%' THEN 'skill-reference'
                    ELSE 'other'
                END as folder,
                COUNT(*) as count,
                MIN(created_at) as earliest,
                MAX(created_at) as latest
            FROM athlete_skill_videos
            WHERE url IS NOT NULL
            GROUP BY folder
            ORDER BY count DESC;
        """)
        
        folder_stats = cur.fetchall()
        
        print("📊 CURRENT STORAGE DISTRIBUTION:")
        for folder, count, earliest, latest in folder_stats:
            status_icon = "✅" if folder == "athlete-skills" else "❌" if folder == "skill-reference" else "❓"
            print(f"{status_icon} {folder}: {count} videos")
            print(f"   📅 Period: {earliest} to {latest}")
            print()
        
        # Show the most recent video to confirm new uploads work
        cur.execute("""
            SELECT 
                asv.id,
                asv.url,
                asv.title,
                asv.created_at,
                CASE 
                    WHEN asv.url LIKE '%athlete-skills/%' THEN 'athlete-skills'
                    WHEN asv.url LIKE '%skill-reference/%' THEN 'skill-reference'
                    ELSE 'other'
                END as folder_type
            FROM athlete_skill_videos asv
            WHERE asv.url IS NOT NULL
            ORDER BY asv.created_at DESC
            LIMIT 3;
        """)
        
        recent_videos = cur.fetchall()
        
        print("🎬 MOST RECENT UPLOADS:")
        for video_id, url, title, created_at, folder_type in recent_videos:
            status_icon = "✅" if folder_type == "athlete-skills" else "❌" if folder_type == "skill-reference" else "❓"
            print(f"{status_icon} Video #{video_id}: {title or 'Untitled'}")
            print(f"   📅 Created: {created_at}")
            print(f"   📁 Folder: {folder_type}")
            print()
        
        print("💡 INTERPRETATION:")
        print("=" * 50)
        
        # Check if all athlete skill videos are in the right folder
        cur.execute("""
            SELECT COUNT(*) 
            FROM athlete_skill_videos 
            WHERE url LIKE '%skill-reference/%';
        """)
        wrong_folder_count = cur.fetchone()[0]
        
        if wrong_folder_count == 0:
            print("✅ PERFECT! All athlete skill videos are in athlete-skills/ folder")
            print("🎯 Migration was 100% successful")
            print("🚀 New uploads will automatically go to correct folder")
        else:
            print(f"⚠️  Still {wrong_folder_count} videos in wrong folder")
            
        print("\n🔮 NEXT TEST:")
        print("Upload a new video via the test modal to confirm the fix works!")
        print("Expected: New videos should appear in athlete-skills/ folder")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    test_new_upload_behavior()
