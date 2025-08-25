#!/usr/bin/env python3

import os
import psycopg2
from dotenv import load_dotenv
from supabase import create_client, Client

def migrate_athlete_videos():
    """
    Migrate existing athlete skill videos from skill-reference/ to athlete-skills/ folder
    """
    load_dotenv()
    
    # Database connection
    database_url = os.getenv('DIRECT_DATABASE_URL')
    
    # Supabase client for file operations
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not all([database_url, supabase_url, supabase_key]):
        print("❌ Missing required environment variables")
        return False
    
    print("🚀 STARTING ATHLETE VIDEO MIGRATION")
    print("=" * 60)
    
    try:
        # Initialize connections
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Get videos to migrate
        cur.execute("""
            SELECT id, url
            FROM athlete_skill_videos
            WHERE url LIKE '%skill-reference/%'
            ORDER BY id;
        """)
        
        videos_to_migrate = cur.fetchall()
        
        if not videos_to_migrate:
            print("✅ No videos to migrate - all already in correct location!")
            return True
        
        print(f"📹 Found {len(videos_to_migrate)} videos to migrate")
        
        successful_migrations = 0
        failed_migrations = 0
        
        for video_id, current_url in videos_to_migrate:
            try:
                print(f"\n🎬 Migrating Video #{video_id}...")
                
                # Extract file path from URL
                # URL format: https://.../storage/v1/object/public/site-media/skill-reference/filename
                url_parts = current_url.split('/site-media/')
                if len(url_parts) != 2:
                    print(f"   ❌ Invalid URL format: {current_url}")
                    failed_migrations += 1
                    continue
                
                old_path = url_parts[1]  # skill-reference/filename
                filename = old_path.split('/')[-1]  # just the filename
                new_path = f"athlete-skills/{filename}"
                
                print(f"   📁 Moving: {old_path} → {new_path}")
                
                # Step 1: Copy file to new location
                copy_result = supabase.storage.from_('site-media').copy(old_path, new_path)
                
                # Handle copy result - it returns a list, not dict with error
                if not copy_result:
                    print(f"   ❌ File copy failed: No result returned")
                    failed_migrations += 1
                    continue
                
                # Step 2: Update database URL
                new_url = current_url.replace('skill-reference/', 'athlete-skills/')
                cur.execute("""
                    UPDATE athlete_skill_videos
                    SET url = %s
                    WHERE id = %s;
                """, (new_url, video_id))
                
                # Step 3: Delete old file
                delete_result = supabase.storage.from_('site-media').remove([old_path])
                # Delete result is also a list, check if it's empty or has errors
                if not delete_result:
                    print(f"   ⚠️  File delete may have failed, but URL updated successfully")
                else:
                    print(f"   ✅ Migration successful")
                
                successful_migrations += 1
                
            except Exception as e:
                print(f"   ❌ Migration failed: {e}")
                failed_migrations += 1
                continue
        
        # Commit database changes
        conn.commit()
        
        print(f"\n📊 MIGRATION SUMMARY")
        print("=" * 60)
        print(f"✅ Successful migrations: {successful_migrations}")
        print(f"❌ Failed migrations: {failed_migrations}")
        print(f"📹 Total videos processed: {len(videos_to_migrate)}")
        
        if successful_migrations > 0:
            print(f"\n🎉 SUCCESS! {successful_migrations} videos moved to athlete-skills/ folder")
            print("💡 Videos will now appear correctly organized in storage")
            print("🔗 All URLs have been updated - no broken links!")
        
        return failed_migrations == 0
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

def preview_migration():
    """
    Preview what the migration would do without making changes
    """
    load_dotenv()
    database_url = os.getenv('DIRECT_DATABASE_URL')
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        print("🔍 MIGRATION PREVIEW (NO CHANGES MADE)")
        print("=" * 60)
        
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
            WHERE asv.url LIKE '%skill-reference/%'
            ORDER BY asv.id;
        """)
        
        videos = cur.fetchall()
        
        if not videos:
            print("✅ No videos need migration - all already in correct location!")
            return
        
        print(f"📹 Would migrate {len(videos)} videos:")
        print()
        
        for video_id, current_url, title, first_name, last_name, skill_name in videos:
            new_url = current_url.replace('skill-reference/', 'athlete-skills/')
            print(f"🎬 Video #{video_id}: {title or 'Untitled'}")
            print(f"   👤 {first_name} {last_name} - {skill_name}")
            print(f"   🔄 {current_url}")
            print(f"   ➡️  {new_url}")
            print()
        
        print("💡 To perform the migration, run:")
        print("   python3 migrate_athlete_videos.py --migrate")
        
    except Exception as e:
        print(f"❌ Preview failed: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--migrate':
        # Perform actual migration
        success = migrate_athlete_videos()
        if success:
            print(f"\n🏁 Migration completed successfully!")
        else:
            print(f"\n💥 Migration completed with errors - check logs above")
    else:
        # Show preview by default
        preview_migration()
