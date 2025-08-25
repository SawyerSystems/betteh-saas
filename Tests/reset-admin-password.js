import bcrypt from 'bcrypt';
import { config } from 'dotenv';
import path from 'path';
import { storage } from './server/storage.js';

// Load environment variables
config({ path: path.join(process.cwd(), '.env') });

async function resetAdminPassword() {
  try {
    const adminEmail = 'admin@coachwilltumbles.com';
    const newPassword = 'admin123';
    
    console.log('🔄 Resetting admin password...');
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log('🔑 Password hashed successfully');
    
    // Update the admin password directly using storage
    const result = await storage.updateAdminPassword(adminEmail, passwordHash);
    
    if (result) {
      console.log('✅ Admin password reset successfully!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${newPassword}`);
    } else {
      console.error('❌ Failed to reset admin password');
    }
    
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
