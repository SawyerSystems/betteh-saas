#!/usr/bin/env python3

import os
import psycopg2
import requests
from dotenv import load_dotenv

def verify_migrated_videos():
    """
    Verify that migrated videos are accessible and working
    """
    load_dotenv()
    database_url = os.getenv('DIRECT_DATABASE_URL')
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        print("🔍 VERIFYING MIGRATED VIDEOS")
        print("=" * 50)
        
        # Get migrated videos
        cur.execute("""
            SELECT 
                asv.id,
                asv.url,
                asv.title,
                a.first_name,
                a.last_name,
                s.name as skill_name
            FROM athlete_skill_videos asv
            JOIN athlete_skills ats ON asv.athlete_skill_id = ats.id
            JOIN athletes a ON ats.athlete_id = a.id
            JOIN skills s ON ats.skill_id = s.id
            WHERE asv.url LIKE '%athlete-skills/%'
            ORDER BY asv.id;
        """)
        
        migrated_videos = cur.fetchall()
        
        print(f"📹 Found {len(migrated_videos)} videos in athlete-skills/ folder")
        print()
        
        accessible_count = 0
        inaccessible_count = 0
        
        for video_id, url, title, first_name, last_name, skill_name in migrated_videos:
            print(f"🎬 Video #{video_id}: {title or 'Untitled'}")
            print(f"   👤 {first_name} {last_name} - {skill_name}")
            
            # Test if URL is accessible
            try:
                # Just check the HEAD to see if file exists without downloading
                response = requests.head(url, timeout=10)
                if response.status_code == 200:
                    file_size = response.headers.get('content-length', 'Unknown')
                    content_type = response.headers.get('content-type', 'Unknown')
                    print(f"   ✅ ACCESSIBLE - Size: {file_size} bytes, Type: {content_type}")
                    accessible_count += 1
                else:
                    print(f"   ❌ INACCESSIBLE - Status: {response.status_code}")
                    inaccessible_count += 1
            except Exception as e:
                print(f"   ❌ ERROR - {e}")
                inaccessible_count += 1
            
            print(f"   🔗 {url}")
            print()
        
        print("📊 VERIFICATION SUMMARY")
        print("=" * 50)
        print(f"✅ Accessible videos: {accessible_count}")
        print(f"❌ Inaccessible videos: {inaccessible_count}")
        print(f"📹 Total migrated: {len(migrated_videos)}")
        
        if inaccessible_count == 0:
            print()
            print("🎉 SUCCESS! All migrated videos are accessible!")
            print("🏆 Migration completed without any broken links!")
        else:
            print()
            print(f"⚠️  Warning: {inaccessible_count} videos may have issues")
            
        # Check if old folder still has files (should be empty now)
        print()
        print("🗂️  CHECKING OLD FOLDER STATUS")
        print("=" * 50)
        
        cur.execute("""
            SELECT COUNT(*)
            FROM athlete_skill_videos
            WHERE url LIKE '%skill-reference/%';
        """)
        
        old_folder_count = cur.fetchone()[0]
        
        if old_folder_count == 0:
            print("✅ Old skill-reference/ folder is clean (no athlete videos)")
            print("🧹 Migration cleanup was successful!")
        else:
            print(f"⚠️  Still {old_folder_count} videos in old skill-reference/ folder")
            
    except Exception as e:
        print(f"❌ Verification failed: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    verify_migrated_videos()
