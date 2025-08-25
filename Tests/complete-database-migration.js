#!/usr/bin/env node

// Complete Database Migration Script
// This migrates existing denormalized booking data to use proper foreign key relationships

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runCompleteMigration() {
  console.log('🚀 Starting Complete Database Migration...\n');

  try {
    // Step 1: Analyze current state
    console.log('📊 STEP 1: Analyzing current data state...');
    
    const { data: bookingsToMigrate, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id, parentFirstName, parentLastName, parentEmail, parentPhone,
        lessonTypeName, lessonTypePrice, athleteFirstName, athleteLastName,
        waiverId, parentId, lessonTypeId
      `)
      .or('parentId.is.null,lessonTypeId.is.null');

    if (bookingsError) {
      console.error('❌ Error fetching bookings to migrate:', bookingsError);
      return;
    }

    console.log(`Found ${bookingsToMigrate?.length || 0} bookings needing migration\n`);

    if (!bookingsToMigrate || bookingsToMigrate.length === 0) {
      console.log('✅ No bookings need migration!');
      return;
    }

    // Step 2: Get all existing lookup data
    console.log('📚 STEP 2: Loading existing lookup data...');
    
    const [
      { data: existingParents },
      { data: existingLessonTypes },
      { data: existingWaivers }
    ] = await Promise.all([
      supabase.from('parents').select('*'),
      supabase.from('lesson_types').select('*'),
      supabase.from('waivers').select('*')
    ]);

    console.log(`- Found ${existingParents?.length || 0} existing parents`);
    console.log(`- Found ${existingLessonTypes?.length || 0} existing lesson types`);
    console.log(`- Found ${existingWaivers?.length || 0} existing waivers\n`);

    // Step 3: Create missing parents
    console.log('👥 STEP 3: Creating missing parents...');
    
    const parentLookup = new Map();
    existingParents?.forEach(p => {
      parentLookup.set(p.email?.toLowerCase(), p);
    });

    const parentsToCreate = [];
    const uniqueParentEmails = new Set();

    bookingsToMigrate.forEach((booking) => {
      if (!booking.parentId && booking.parentEmail) {
        const email = booking.parentEmail.toLowerCase();
        if (!parentLookup.has(email) && !uniqueParentEmails.has(email)) {
          uniqueParentEmails.add(email);
          parentsToCreate.push({
            firstName: booking.parentFirstName || '',
            lastName: booking.parentLastName || '',
            email: booking.parentEmail,
            phone: booking.parentPhone || ''
          });
        }
      }
    });

    console.log(`Creating ${parentsToCreate.length} new parents...`);
    
    if (parentsToCreate.length > 0) {
      const { data: newParents, error: parentError } = await supabase
        .from('parents')
        .insert(parentsToCreate)
        .select();

      if (parentError) {
        console.error('❌ Error creating parents:', parentError);
        return;
      }

      // Update lookup map
      newParents?.forEach(p => {
        parentLookup.set(p.email?.toLowerCase(), p);
      });

      console.log(`✅ Created ${newParents?.length || 0} new parents`);
    }

    // Step 4: Create missing lesson types
    console.log('\n🏃 STEP 4: Creating missing lesson types...');
    
    const lessonTypeLookup = new Map();
    existingLessonTypes?.forEach(lt => {
      lessonTypeLookup.set(lt.name?.toLowerCase(), lt);
    });

    const lessonTypesToCreate = [];
    const uniqueLessonTypes = new Set();

    bookingsToMigrate.forEach((booking) => {
      if (!booking.lessonTypeId && booking.lessonTypeName) {
        const name = booking.lessonTypeName.toLowerCase();
        if (!lessonTypeLookup.has(name) && !uniqueLessonTypes.has(name)) {
          uniqueLessonTypes.add(name);
          lessonTypesToCreate.push({
            name: booking.lessonTypeName,
            price: booking.lessonTypePrice || 0,
            description: `Migrated from legacy booking data`
          });
        }
      }
    });

    console.log(`Creating ${lessonTypesToCreate.length} new lesson types...`);
    
    if (lessonTypesToCreate.length > 0) {
      const { data: newLessonTypes, error: lessonTypeError } = await supabase
        .from('lesson_types')
        .insert(lessonTypesToCreate)
        .select();

      if (lessonTypeError) {
        console.error('❌ Error creating lesson types:', lessonTypeError);
        return;
      }

      // Update lookup map
      newLessonTypes?.forEach(lt => {
        lessonTypeLookup.set(lt.name?.toLowerCase(), lt);
      });

      console.log(`✅ Created ${newLessonTypes?.length || 0} new lesson types`);
    }

    // Step 5: Update booking foreign keys
    console.log('\n🔗 STEP 5: Updating booking foreign keys...');
    
    const bookingUpdates = [];

    for (const booking of bookingsToMigrate) {
      const update = { id: booking.id };
      let needsUpdate = false;

      // Set parentId
      if (!booking.parentId && booking.parentEmail) {
        const parent = parentLookup.get(booking.parentEmail.toLowerCase());
        if (parent) {
          update.parentId = parent.id;
          needsUpdate = true;
        }
      }

      // Set lessonTypeId
      if (!booking.lessonTypeId && booking.lessonTypeName) {
        const lessonType = lessonTypeLookup.get(booking.lessonTypeName.toLowerCase());
        if (lessonType) {
          update.lessonTypeId = lessonType.id;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        bookingUpdates.push(update);
      }
    }

    console.log(`Updating ${bookingUpdates.length} bookings with foreign keys...`);

    // Update bookings in batches
    const batchSize = 50;
    let updatedCount = 0;

    for (let i = 0; i < bookingUpdates.length; i += batchSize) {
      const batch = bookingUpdates.slice(i, i + batchSize);
      
      for (const update of batch) {
        const { id, ...updateData } = update;
        const { error: updateError } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', id);

        if (updateError) {
          console.error(`❌ Error updating booking ${id}:`, updateError);
        } else {
          updatedCount++;
        }
      }

      console.log(`  Updated batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(bookingUpdates.length/batchSize)}`);
    }

    console.log(`✅ Successfully updated ${updatedCount} bookings`);

    // Step 6: Verification
    console.log('\n🔍 STEP 6: Verifying migration...');
    
    const { data: verificationBookings, error: verifyError } = await supabase
      .from('bookings')
      .select('id, parentId, lessonTypeId, waiverId')
      .or('parentId.is.null,lessonTypeId.is.null');

    if (verifyError) {
      console.error('❌ Error during verification:', verifyError);
      return;
    }

    const stillNullCount = verificationBookings?.filter(b => 
      b.parentId === null || b.lessonTypeId === null
    ).length || 0;

    console.log(`Bookings still with null foreign keys: ${stillNullCount}`);

    if (stillNullCount === 0) {
      console.log('\n🎉 MIGRATION COMPLETE! All bookings now have proper foreign key relationships.');
    } else {
      console.log('\n⚠️  Some bookings still need manual attention.');
      verificationBookings?.slice(0, 5).forEach(b => {
        console.log(`  Booking ${b.id}: parentId=${b.parentId}, lessonTypeId=${b.lessonTypeId}`);
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Check if this is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteMigration();
}

export { runCompleteMigration };
