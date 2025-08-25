#!/usr/bin/env python3

import os
import psycopg2
from dotenv import load_dotenv

def main():
    load_dotenv()
    database_url = os.getenv('DIRECT_DATABASE_URL')
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        print("🔍 CHECKING ATHLETE SKILL VIDEO UPLOADS")
        print("=" * 50)
        
        # Check recent video uploads in the database
        cur.execute("""
            SELECT 
                asv.id,
                asv.url,
                asv.title,
                asv.created_at,
                a.first_name,
                a.last_name,
                s.name as skill_name
            FROM athlete_skill_videos asv
            JOIN athlete_skills ats ON asv.athlete_skill_id = ats.id
            JOIN athletes a ON ats.athlete_id = a.id
            JOIN skills s ON ats.skill_id = s.id
            ORDER BY asv.created_at DESC
            LIMIT 10;
        """)
        
        videos = cur.fetchall()
        
        if videos:
            print(f"📹 Found {len(videos)} recent athlete skill videos:")
            print()
            for video in videos:
                video_id, url, title, created_at, first_name, last_name, skill_name = video
                
                # Check if URL contains the correct folder path
                if url and 'athlete-skills/' in url:
                    folder_status = "✅ CORRECT (athlete-skills/)"
                elif url and 'skill-reference/' in url:
                    folder_status = "❌ WRONG (skill-reference/)"
                else:
                    folder_status = "❓ UNKNOWN FOLDER"
                
                print(f"🎬 Video #{video_id}: {title or 'Untitled'}")
                print(f"   👤 Athlete: {first_name} {last_name}")
                print(f"   🎯 Skill: {skill_name}")
                print(f"   📅 Created: {created_at}")
                print(f"   🔗 URL: {url}")
                print(f"   📁 Storage: {folder_status}")
                print()
        else:
            print("📹 No athlete skill videos found in database")
            
        # Show storage folder summary
        print("📊 STORAGE FOLDER ANALYSIS")
        print("=" * 50)
        
        cur.execute("""
            SELECT 
                CASE 
                    WHEN url LIKE '%athlete-skills/%' THEN 'athlete-skills'
                    WHEN url LIKE '%skill-reference/%' THEN 'skill-reference'
                    ELSE 'other'
                END as folder,
                COUNT(*) as count
            FROM athlete_skill_videos
            WHERE url IS NOT NULL
            GROUP BY folder
            ORDER BY count DESC;
        """)
        
        folder_stats = cur.fetchall()
        
        if folder_stats:
            for folder, count in folder_stats:
                status_icon = "✅" if folder == "athlete-skills" else "❌" if folder == "skill-reference" else "❓"
                print(f"{status_icon} {folder}: {count} videos")
        else:
            print("No athlete skill videos with URLs found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
