import { db } from "./db";
import { athletes } from "@shared/schema";
import { sql } from "drizzle-orm";

async function migrateAthleteNames() {
  console.log("Starting athlete name migration...");
  
  try {
    // First, ensure the columns exist
    await db.execute(sql`
      ALTER TABLE athletes 
      ADD COLUMN IF NOT EXISTS first_name TEXT,
      ADD COLUMN IF NOT EXISTS last_name TEXT
    `);
    
    // Fetch all athletes
    const allAthletes = await db.select().from(athletes);
    
    console.log(`Found ${allAthletes.length} athletes to migrate`);
    
    // Update each athlete
    for (const athlete of allAthletes) {
      if (athlete.name && (!athlete.firstName || !athlete.lastName)) {
        const nameParts = athlete.name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await db.execute(sql`
          UPDATE athletes 
          SET first_name = ${firstName}, 
              last_name = ${lastName}
          WHERE id = ${athlete.id}
        `);
        
        console.log(`Migrated: ${athlete.name} -> ${firstName} ${lastName}`);
      }
    }
    
    console.log("Athlete name migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migrateAthleteNames()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateAthleteNames };