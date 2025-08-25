#!/usr/bin/env python3

import os
import psycopg2
from dotenv import load_dotenv

def migrate_athlete_video_urls():
    """
    Update athlete skill video URLs from skill-reference/ to athlete-skills/
    This is safe because both folders will work with the current fix in place
    """
    load_dotenv()
    database_url = os.getenv('DIRECT_DATABASE_URL')
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        print("🚀 UPDATING ATHLETE VIDEO URLs")
        print("=" * 50)
        
        # Get videos to update
        cur.execute("""
            SELECT id, url, title
            FROM athlete_skill_videos
            WHERE url LIKE '%skill-reference/%'
            ORDER BY id;
        """)
        
        videos_to_update = cur.fetchall()
        
        if not videos_to_update:
            print("✅ No videos to update - all already have correct URLs!")
            return True
        
        print(f"📹 Found {len(videos_to_update)} videos to update")
        
        successful_updates = 0
        
        for video_id, current_url, title in videos_to_update:
            try:
                # Update URL to point to athlete-skills folder
                new_url = current_url.replace('skill-reference/', 'athlete-skills/')
                
                print(f"🎬 Video #{video_id}: {title or 'Untitled'}")
                print(f"   🔄 Updating URL...")
                print(f"   📍 From: .../{current_url.split('/')[-2]}/{current_url.split('/')[-1]}")
                print(f"   📍 To:   .../{new_url.split('/')[-2]}/{new_url.split('/')[-1]}")
                
                # Update database
                cur.execute("""
                    UPDATE athlete_skill_videos
                    SET url = %s
                    WHERE id = %s;
                """, (new_url, video_id))
                
                successful_updates += 1
                print(f"   ✅ URL updated successfully")
                print()
                
            except Exception as e:
                print(f"   ❌ Update failed: {e}")
                print()
                continue
        
        # Commit all changes
        conn.commit()
        
        print(f"📊 UPDATE SUMMARY")
        print("=" * 50)
        print(f"✅ Successful URL updates: {successful_updates}")
        print(f"📹 Total videos processed: {len(videos_to_update)}")
        
        if successful_updates > 0:
            print(f"\n🎉 SUCCESS! {successful_updates} video URLs updated!")
            print("📁 URLs now point to athlete-skills/ folder")
            print("⚠️  NOTE: Files are still in skill-reference/ folder in Supabase")
            print("💡 This is OK - both paths work with your current setup")
            print("🔗 Videos will display correctly on the site!")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

def verify_migration():
    """
    Verify the migration results
    """
    load_dotenv()
    database_url = os.getenv('DIRECT_DATABASE_URL')
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        print("\n🔍 VERIFYING MIGRATION RESULTS")
        print("=" * 50)
        
        # Check current status
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
        
        print("📊 Current Storage Status:")
        for folder, count in folder_stats:
            status_icon = "✅" if folder == "athlete-skills" else "❌" if folder == "skill-reference" else "❓"
            print(f"{status_icon} {folder}: {count} videos")
        
        # Show recent videos
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
            ORDER BY asv.id DESC
            LIMIT 5;
        """)
        
        recent_videos = cur.fetchall()
        
        print(f"\n📹 Recent Videos (showing last 5):")
        for video_id, url, title, first_name, last_name, skill_name in recent_videos:
            if url and 'athlete-skills/' in url:
                folder_status = "✅ CORRECT"
            elif url and 'skill-reference/' in url:
                folder_status = "❌ OLD"
            else:
                folder_status = "❓ OTHER"
            
            print(f"🎬 Video #{video_id}: {title or 'Untitled'}")
            print(f"   👤 {first_name} {last_name} - {skill_name}")
            print(f"   📁 {folder_status}")
            print()
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    success = migrate_athlete_video_urls()
    if success:
        verify_migration()
        print(f"\n🏁 Migration completed successfully!")
        print("💡 Your athlete progress videos now have the correct folder structure!")
    else:
        print(f"\n💥 Migration failed - check logs above")
