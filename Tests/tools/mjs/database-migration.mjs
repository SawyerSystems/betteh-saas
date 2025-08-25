#!/usr/bin/env node

/**
 * Complete Database Migration to Normalized Schema
 * 
 * This script migrates the database to use proper foreign key relationships
 * by ensuring all booking records have valid parentId, lessonTypeId references
 * and that the UI components work with the normalized data structure.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...');
  
  try {
    // Check if we can query bookings table
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, parent_id, lesson_type_id, waiver_id')
      .limit(1);

    if (bookingsError) {
      return {
        success: false,
        message: 'Database structure check failed',
        error: bookingsError.message
      };
    }

    // Check if parents table exists and has data
    const { data: parents, error: parentsError } = await supabase
      .from('parents')
      .select('id, first_name, last_name, email')
      .limit(1);

    if (parentsError) {
      return {
        success: false,
        message: 'Parents table check failed',
        error: parentsError.message
      };
    }

    // Check if lesson_types table exists and has data
    const { data: lessonTypes, error: lessonTypesError } = await supabase
      .from('lesson_types')
      .select('id, name, price')
      .limit(1);

    if (lessonTypesError) {
      return {
        success: false,
        message: 'Lesson types table check failed',
        error: lessonTypesError.message
      };
    }

    return {
      success: true,
      message: 'Database structure is valid',
      details: {
        bookingsCount: bookings?.length || 0,
        parentsCount: parents?.length || 0,
        lessonTypesCount: lessonTypes?.length || 0
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Database structure check failed',
      error: error.message
    };
  }
}

async function ensureBasicData() {
  console.log('📋 Ensuring basic data exists...');
  
  try {
    // Ensure at least one parent exists
    const { data: existingParents } = await supabase
      .from('parents')
      .select('id')
      .limit(1);

    if (!existingParents || existingParents.length === 0) {
      console.log('Creating default parent...');
      const { error: parentError } = await supabase
        .from('parents')
        .insert({
          first_name: 'Test',
          last_name: 'Parent',
          email: 'test@example.com',
          phone: '555-0123',
          emergency_contact_name: 'Emergency Contact',
          emergency_contact_phone: '555-0124'
        });

      if (parentError) {
        return {
          success: false,
          message: 'Failed to create default parent',
          error: parentError.message
        };
      }
    }

    // Ensure at least one lesson type exists
    const { data: existingLessonTypes } = await supabase
      .from('lesson_types')
      .select('id')
      .limit(1);

    if (!existingLessonTypes || existingLessonTypes.length === 0) {
      console.log('Creating default lesson type...');
      const { error: lessonTypeError } = await supabase
        .from('lesson_types')
        .insert({
          name: 'Open Gym',
          duration: 60,
          price: 25.00,
          description: 'Open gym session'
        });

      if (lessonTypeError) {
        return {
          success: false,
          message: 'Failed to create default lesson type',
          error: lessonTypeError.message
        };
      }
    }

    return {
      success: true,
      message: 'Basic data ensured'
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to ensure basic data',
      error: error.message
    };
  }
}

async function migrateBookingRelationships() {
  console.log('🔄 Migrating booking relationships...');
  
  try {
    // Get all bookings that might need foreign key updates
    const { data: allBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, parent_id, lesson_type_id, waiver_id');

    if (bookingsError) {
      return {
        success: false,
        message: 'Failed to fetch bookings',
        error: bookingsError.message
      };
    }

    if (!allBookings || allBookings.length === 0) {
      return {
        success: true,
        message: 'No bookings found - nothing to migrate'
      };
    }

    // Find bookings with null foreign keys
    const bookingsNeedingUpdate = allBookings.filter(b => 
      b.parent_id === null || b.lesson_type_id === null
    );

    if (bookingsNeedingUpdate.length === 0) {
      return {
        success: true,
        message: `All ${allBookings.length} bookings already have proper foreign keys`
      };
    }

    console.log(`Found ${bookingsNeedingUpdate.length} bookings needing foreign key updates`);

    // Get first available parent and lesson type for default assignment
    const { data: firstParent } = await supabase
      .from('parents')
      .select('id')
      .limit(1)
      .single();

    const { data: firstLessonType } = await supabase
      .from('lesson_types')
      .select('id')
      .limit(1)
      .single();

    if (!firstParent || !firstLessonType) {
      return {
        success: false,
        message: 'No parent or lesson type available for migration'
      };
    }

    // Update bookings with missing foreign keys
    let updatedCount = 0;
    for (const booking of bookingsNeedingUpdate) {
      const updates = {};
      
      if (booking.parent_id === null) {
        updates.parent_id = firstParent.id;
      }
      
      if (booking.lesson_type_id === null) {
        updates.lesson_type_id = firstLessonType.id;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update(updates)
          .eq('id', booking.id);

        if (updateError) {
          console.error(`Failed to update booking ${booking.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }

    return {
      success: true,
      message: `Successfully updated ${updatedCount} bookings with foreign key relationships`,
      details: {
        totalBookings: allBookings.length,
        updatedBookings: updatedCount,
        parentId: firstParent.id,
        lessonTypeId: firstLessonType.id
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Migration failed',
      error: error.message
    };
  }
}

async function validateMigration() {
  console.log('✅ Validating migration...');
  
  try {
    // Check that all bookings now have proper foreign keys
    const { data: allBookings, error } = await supabase
      .from('bookings')
      .select(`
        id, parent_id, lesson_type_id, waiver_id,
        parents!inner(id, first_name, last_name),
        lesson_types!inner(id, name, price)
      `);

    if (error) {
      return {
        success: false,
        message: 'Validation query failed',
        error: error.message
      };
    }

    const bookingsWithNullKeys = allBookings?.filter(b => 
      b.parent_id === null || b.lesson_type_id === null
    ) || [];

    return {
      success: bookingsWithNullKeys.length === 0,
      message: bookingsWithNullKeys.length === 0 
        ? `All ${allBookings?.length || 0} bookings have proper foreign key relationships`
        : `${bookingsWithNullKeys.length} bookings still have null foreign keys`,
      details: {
        totalBookings: allBookings?.length || 0,
        validBookings: (allBookings?.length || 0) - bookingsWithNullKeys.length,
        invalidBookings: bookingsWithNullKeys.length
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Validation failed',
      error: error.message
    };
  }
}

async function runCompleteMigration() {
  console.log('🚀 Starting Complete Database Migration...\n');

  try {
    // Step 1: Check database structure
    const structureCheck = await checkDatabaseStructure();
    console.log(`📊 Structure Check: ${structureCheck.message}`);
    if (!structureCheck.success) {
      console.error('❌ Migration aborted:', structureCheck.error);
      return;
    }

    // Step 2: Ensure basic data exists
    const dataCheck = await ensureBasicData();
    console.log(`📋 Data Check: ${dataCheck.message}`);
    if (!dataCheck.success) {
      console.error('❌ Migration aborted:', dataCheck.error);
      return;
    }

    // Step 3: Migrate booking relationships
    const migrationResult = await migrateBookingRelationships();
    console.log(`🔄 Migration: ${migrationResult.message}`);
    if (!migrationResult.success) {
      console.error('❌ Migration failed:', migrationResult.error);
      return;
    }

    // Step 4: Validate migration
    const validationResult = await validateMigration();
    console.log(`✅ Validation: ${validationResult.message}`);
    
    if (validationResult.success) {
      console.log('\n🎉 Database migration completed successfully!');
      console.log('📋 Summary:', {
        ...structureCheck.details,
        ...migrationResult.details,
        ...validationResult.details
      });
    } else {
      console.log('\n⚠️  Migration completed with issues:', validationResult.error);
    }

  } catch (error) {
    console.error('❌ Unexpected error during migration:', error.message);
  }
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteMigration().then(() => {
    console.log('\n✨ Migration script finished');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });
}

export { runCompleteMigration };
