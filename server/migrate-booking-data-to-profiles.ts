
import { storage } from './storage';

async function migrateBookingDataToProfiles() {
  console.log('🔄 Starting migration of booking data to parent and athlete profiles...');
  
  try {
    // Get all existing bookings
    const bookings = await storage.getAllBookings();
    console.log(`📊 Found ${bookings.length} bookings to process`);
    
    const createdParents = new Map();
    const createdAthletes = new Map();
    
    for (const booking of bookings) {
      try {
        // Create or find parent account
        let parent = await storage.identifyParent(booking.parentEmail, booking.parentPhone);
        
        if (!parent) {
          console.log(`👤 Creating parent: ${booking.parentFirstName} ${booking.parentLastName}`);
          parent = await storage.createParent({
            firstName: booking.parentFirstName,
            lastName: booking.parentLastName,
            email: booking.parentEmail,
            phone: booking.parentPhone,
            emergencyContactName: booking.emergencyContactName || '',
            emergencyContactPhone: booking.emergencyContactPhone || '',
            waiverSigned: booking.waiverSigned || false,
            waiverSignedAt: booking.waiverSignedAt || null,
            waiverSignatureName: booking.waiverSignatureName || null
          });
          createdParents.set(booking.parentEmail, parent);
          console.log(`✅ Created parent account for ${booking.parentEmail}`);
        } else {
          console.log(`♻️ Found existing parent: ${parent.firstName} ${parent.lastName}`);
        }
        
        // Create athlete 1 if doesn't exist
        if (booking.athlete1Name && booking.athlete1DateOfBirth) {
          const athleteKey = `${booking.athlete1Name}-${booking.athlete1DateOfBirth}`;
          
          if (!createdAthletes.has(athleteKey)) {
            const existingAthletes = await storage.getAllAthletes();
            const existingAthlete = existingAthletes.find(a => 
              a.name === booking.athlete1Name && 
              a.dateOfBirth === booking.athlete1DateOfBirth
            );
            
            if (!existingAthlete) {
              const [firstName, ...lastNameParts] = booking.athlete1Name.split(' ');
              const lastName = lastNameParts.join(' ') || '';
              
              const validExperience = ['beginner', 'intermediate', 'advanced', 'elite'].includes(booking.athlete1Experience) 
                ? booking.athlete1Experience as 'beginner' | 'intermediate' | 'advanced'
                : 'beginner';
                
              const athlete = await storage.createAthlete({
                parentId: parent.id,
                name: booking.athlete1Name,
                firstName,
                lastName,
                dateOfBirth: booking.athlete1DateOfBirth,
                experience: validExperience,
                allergies: booking.athlete1Allergies || null
              });
              
              createdAthletes.set(athleteKey, athlete);
              console.log(`🏃 Created athlete: ${booking.athlete1Name}`);
            }
          }
        }
        
        // Create athlete 2 if exists and doesn't exist in database
        if (booking.athlete2Name && booking.athlete2DateOfBirth) {
          const athleteKey = `${booking.athlete2Name}-${booking.athlete2DateOfBirth}`;
          
          if (!createdAthletes.has(athleteKey)) {
            const existingAthletes = await storage.getAllAthletes();
            const existingAthlete = existingAthletes.find(a => 
              a.name === booking.athlete2Name && 
              a.dateOfBirth === booking.athlete2DateOfBirth
            );
            
            if (!existingAthlete) {
              const [firstName, ...lastNameParts] = booking.athlete2Name.split(' ');
              const lastName = lastNameParts.join(' ') || '';
              
              const validExperience = booking.athlete2Experience && ['beginner', 'intermediate', 'advanced', 'elite'].includes(booking.athlete2Experience) 
                ? booking.athlete2Experience as 'beginner' | 'intermediate' | 'advanced'
                : 'beginner';
                
              const athlete = await storage.createAthlete({
                parentId: parent.id,
                name: booking.athlete2Name,
                firstName,
                lastName,
                dateOfBirth: booking.athlete2DateOfBirth,
                experience: validExperience,
                allergies: booking.athlete2Allergies || null
              });
              
              createdAthletes.set(athleteKey, athlete);
              console.log(`🏃 Created athlete: ${booking.athlete2Name}`);
            }
          }
        }
        
      } catch (bookingError) {
        console.error(`❌ Error processing booking ${booking.id}:`, bookingError);
      }
    }
    
    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📈 Created ${createdParents.size} parent accounts`);
    console.log(`🏃 Created ${createdAthletes.size} athlete profiles`);
    
    // Verify the results
    const allParents = await storage.getAllParents();
    const allAthletes = await storage.getAllAthletes();
    console.log(`\n📊 Final counts:`);
    console.log(`👥 Total parents in database: ${allParents.length}`);
    console.log(`🏃 Total athletes in database: ${allAthletes.length}`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migrateBookingDataToProfiles()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateBookingDataToProfiles };
