import bcrypt from 'bcrypt';
import { storage } from './storage';

// Create the first admin account
async function main() {
  const email = 'admin@coachwilltumbles.com';
  const password = 'TumbleCoach2025!';
  
  console.log('Creating first admin account...');
  
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getAdminByEmail(email);
    if (existingAdmin) {
      console.log('Admin already exists with email:', email);
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create the admin
    const admin = await storage.createAdmin({
      email,
      passwordHash
    });

    console.log('Admin created successfully!');
    console.log(`ID: ${admin.id}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Please change the password after first login.');
  } catch (error) {
    console.error('Error creating admin:', error);
  }
  
  process.exit(0);
}

main().catch(console.error);