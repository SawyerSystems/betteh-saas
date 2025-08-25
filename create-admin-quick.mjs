#!/usr/bin/env node

/**
 * Quick Admin Account Creation for Phase 1.5 Testing
 * Creates admin account directly in Supabase database
 */

import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Load environment variables
config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminAccount() {
  try {
    console.log('🔐 Creating admin account for Phase 1.5 testing...');

    const adminEmail = 'admin@coachwilltumbles.com';
    const adminPassword = 'TumbleCoach2025!';

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id, email')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      console.log('✅ Admin account already exists');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      return true;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const { data: newAdmin, error } = await supabase
      .from('admins')
      .insert({
        email: adminEmail,
        password_hash: hashedPassword,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating admin:', error);
      return false;
    }

    console.log('✅ Admin account created successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   User ID: ${newAdmin.id}`);

    return true;
  } catch (error) {
    console.error('❌ Failed to create admin account:', error.message);
    return false;
  }
}

createAdminAccount().then(success => {
  process.exit(success ? 0 : 1);
});
