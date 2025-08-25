import { config } from 'dotenv';
import path from 'path';
import { createStorage } from '../server/storage.js';

// Load environment variables
config({ path: path.join(process.cwd(), '.env') });

async function ensureAdminExists() {
  try {
    const storage = await createStorage();
    
    // Check if any admins exist
    const existingAdmins = await storage.getAllAdmins();
    
    if (existingAdmins.length > 0) {
      console.log(`✅ Found ${existingAdmins.length} existing admin(s):`);
      existingAdmins.forEach(admin => {
        console.log(`   - ${admin.email} (created: ${admin.created_at})`);
      });
      console.log('No need to create admin account.');
      return;
    }
    
    console.log('No admin accounts found. Creating default admin...');
    
    // Create the default admin
    const adminEmail = 'admin@coachwilltumbles.com';
    const adminPassword = 'admin123'; // You should change this immediately after login
    
    const newAdmin = await storage.createAdmin({
      email: adminEmail,
      password: adminPassword
    });
    
    if (newAdmin) {
      console.log('✅ Admin account created successfully!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('   ⚠️  IMPORTANT: Please log in and change this password immediately!');
    } else {
      console.error('❌ Failed to create admin account');
    }
    
  } catch (error) {
    console.error('❌ Error ensuring admin exists:', error);
    process.exit(1);
  }
}

ensureAdminExists();
