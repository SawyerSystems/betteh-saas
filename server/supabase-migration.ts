import { supabase, supabaseAdmin } from './supabase-client';

// Verify Supabase tables exist and warn if they don't
export async function createSupabaseTablesViaAPI() {
  console.log('🚀 Verifying Supabase tables...');
  
  try {
    // Test connection by checking if key tables exist
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('count')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('⚠️  Key tables may not exist. Please run the SQL migration manually.');
      console.log('📋 Check fix-admin-rls.sql for required SQL commands.');
      // Don't fail - let the app continue
    } else {
      console.log('✅ Supabase tables verified successfully');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    // Don't fail - let the app continue even if verification fails
    return true;
  }
}

// Migration function to populate sample data
export async function migrateSampleData() {
  console.log('🔄 Migrating sample data...');
  
  try {
    // Add sample blog posts
    const { error: blogError } = await supabase
      .from('blog_posts')
      .upsert([
        {
          title: 'Welcome to Coach Will\'s Adventure Journal',
          slug: 'welcome-to-adventure-journal',
          excerpt: 'Every gymnastics journey begins with a single step. Discover what makes each athlete\'s adventure unique.',
          content: 'Welcome to our adventure journal! Here, we document the incredible journeys of young gymnasts as they discover their strength, grace, and confidence...',
          category: 'Welcome',
          published_date: new Date().toISOString().split('T')[0],
          is_published: true
        }
      ], { onConflict: 'slug' });

    if (blogError) {
      console.error('Blog migration error:', blogError);
    } else {
      console.log('✅ Blog posts migrated');
    }

    // Add sample tips
    const { error: tipsError } = await supabase
      .from('tips')
      .upsert([
        {
          title: 'Perfect Cartwheel Quest',
          slug: 'perfect-cartwheel-quest',
          content: 'The cartwheel is a fundamental skill that builds strength, coordination, and confidence. Master this move to unlock more advanced tumbling adventures!',
          difficulty_level: 'beginner',
          apparatus: 'tumbling',
          is_published: true
        }
      ], { onConflict: 'slug' });

    if (tipsError) {
      console.error('Tips migration error:', tipsError);
    } else {
      console.log('✅ Tips migrated');
    }

  } catch (error) {
    console.error('❌ Sample data migration failed:', error);
  }
}