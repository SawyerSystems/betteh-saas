import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.join(process.cwd(), '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetAdminPassword() {
  try {
    const adminEmail = 'admin@coachwilltumbles.com';
    const newPassword = 'TumbleCoach2025!';
    
    console.log('🔄 Resetting admin password...');
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log('🔑 Password hashed successfully');
    
    // Update the admin password directly in Supabase
    const { data, error } = await supabase
      .from('admins')
      .update({ password_hash: passwordHash })
      .eq('email', adminEmail)
      .select();
    
    if (error) {
      console.error('❌ Supabase error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Admin password reset successfully!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${newPassword}`);
      console.log(`   Admin ID: ${data[0].id}`);
    } else {
      console.error('❌ No admin found with that email');
    }
    
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
