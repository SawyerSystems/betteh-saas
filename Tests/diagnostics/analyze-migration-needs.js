#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDataForMigration() {
  console.log('🔍 Analyzing current data for migration requirements...\n');

  try {
    // 1. Check bookings with null foreign keys
    console.log('📝 BOOKINGS WITH NULL FOREIGN KEYS:');
    const { data: nullFKBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, parentId, lessonTypeId, waiverId, parentFirstName, parentLastName, parentEmail, lessonTypeName, lessonTypePrice')
      .or('parentId.is.null,lessonTypeId.is.null,waiverId.is.null');

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return;
    }

    console.log(`Found ${nullFKBookings?.length || 0} bookings with null foreign keys`);
    nullFKBookings?.slice(0, 3).forEach(booking => {
      console.log(`  ID ${booking.id}: parentId=${booking.parentId}, lessonTypeId=${booking.lessonTypeId}, waiverId=${booking.waiverId}`);
      console.log(`    Legacy data: ${booking.parentFirstName} ${booking.parentLastName} (${booking.parentEmail}), ${booking.lessonTypeName} ($${booking.lessonTypePrice})`);
    });

    // 2. Check parents table
    console.log('\n👥 PARENTS TABLE:');
    const { data: parents, error: parentsError } = await supabase
      .from('parents')
      .select('id, firstName, lastName, email')
      .limit(5);

    if (parentsError) {
      console.error('Error fetching parents:', parentsError);
    } else {
      console.log(`Found ${parents?.length || 0} parents (showing first 5):`);
      parents?.forEach(parent => {
        console.log(`  ID ${parent.id}: ${parent.firstName} ${parent.lastName} (${parent.email})`);
      });
    }

    // 3. Check lesson_types table
    console.log('\n🏃 LESSON TYPES TABLE:');
    const { data: lessonTypes, error: lessonTypesError } = await supabase
      .from('lesson_types')
      .select('id, name, price')
      .limit(5);

    if (lessonTypesError) {
      console.error('Error fetching lesson types:', lessonTypesError);
    } else {
      console.log(`Found ${lessonTypes?.length || 0} lesson types (showing first 5):`);
      lessonTypes?.forEach(lt => {
        console.log(`  ID ${lt.id}: ${lt.name} ($${lt.price})`);
      });
    }

    // 4. Check waivers table
    console.log('\n📄 WAIVERS TABLE:');
    const { data: waivers, error: waiversError } = await supabase
      .from('waivers')
      .select('id, athleteFirstName, athleteLastName, parentEmail')
      .limit(5);

    if (waiversError) {
      console.error('Error fetching waivers:', waiversError);
    } else {
      console.log(`Found ${waivers?.length || 0} waivers (showing first 5):`);
      waivers?.forEach(waiver => {
        console.log(`  ID ${waiver.id}: ${waiver.athleteFirstName} ${waiver.athleteLastName} (parent: ${waiver.parentEmail})`);
      });
    }

    // 5. Analyze migration potential
    console.log('\n🔧 MIGRATION ANALYSIS:');
    
    if (nullFKBookings && nullFKBookings.length > 0) {
      // Check if we can match booking data to existing parents
      const uniqueParentEmails = [...new Set(nullFKBookings.map(b => b.parentEmail).filter(Boolean))];
      const { data: matchingParents } = await supabase
        .from('parents')
        .select('id, email')
        .in('email', uniqueParentEmails);

      console.log(`\n📧 Email matching analysis:`);
      console.log(`  - Unique parent emails in bookings: ${uniqueParentEmails.length}`);
      console.log(`  - Matching parents in parents table: ${matchingParents?.length || 0}`);

      // Check lesson type matching
      const uniqueLessonTypeNames = [...new Set(nullFKBookings.map(b => b.lessonTypeName).filter(Boolean))];
      const { data: matchingLessonTypes } = await supabase
        .from('lesson_types')
        .select('id, name')
        .in('name', uniqueLessonTypeNames);

      console.log(`\n🏃 Lesson type matching analysis:`);
      console.log(`  - Unique lesson type names in bookings: ${uniqueLessonTypeNames.length}`);
      console.log(`  - Matching lesson types in lesson_types table: ${matchingLessonTypes?.length || 0}`);
    }

    console.log('\n✅ Analysis complete!');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeDataForMigration();
