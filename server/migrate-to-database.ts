import { promises as fs } from 'fs';
import { join } from 'path';
import { db } from './db';
import { 
  users, parents, athletes, bookings, blogPosts, tips, 
  availability, availabilityExceptions, admins, parentAuthCodes
} from '@shared/schema';
import type { 
  User, Parent, Athlete, Booking, BlogPost, Tip, 
  Availability, AvailabilityException, Admin, ParentAuthCode
} from '@shared/schema';

const DATA_DIR = join(process.cwd(), 'data');

async function readJsonFile<T>(filename: string): Promise<T[]> {
  try {
    const filePath = join(DATA_DIR, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : Object.values(parsed);
  } catch (error) {
    console.log(`No ${filename} file found or empty, skipping...`);
    return [];
  }
}

async function migrateData() {
  console.log('Starting data migration from files to database...');

  try {
    // Migrate admins
    const adminData = await readJsonFile<Admin>('admins.json');
    if (adminData.length > 0) {
      console.log(`Migrating ${adminData.length} admins...`);
      for (const admin of adminData) {
        try {
          await db.insert(admins).values({
            email: admin.email,
            passwordHash: admin.passwordHash,
            createdAt: admin.createdAt ? new Date(admin.createdAt) : new Date()
          }).onConflictDoNothing();
        } catch (error) {
          console.log(`Skipping admin ${admin.email} - already exists`);
        }
      }
    }

    // Migrate parents (parents)
    const parentData = await readJsonFile<Parent>('parents.json');
    if (parentData.length > 0) {
      console.log(`Migrating ${parentData.length} parents...`);
      for (const parent of parentData) {
        try {
          await db.insert(parents).values({
            firstName: parent.firstName,
            lastName: parent.lastName,
            email: parent.email,
            phone: parent.phone,
            emergencyContactName: parent.emergencyContactName || 'Not provided',
            emergencyContactPhone: parent.emergencyContactPhone || 'Not provided',
            waiverSigned: parent.waiverSigned || false,
            waiverSignedAt: parent.waiverSignedAt ? new Date(parent.waiverSignedAt) : null,
            waiverSignatureName: parent.waiverSignatureName || null,
            createdAt: parent.createdAt ? new Date(parent.createdAt) : new Date(),
            updatedAt: parent.updatedAt ? new Date(parent.updatedAt) : new Date()
          }).onConflictDoNothing();
        } catch (error) {
          console.log(`Skipping parent ${parent.email} - already exists`);
        }
      }
    }

    // Migrate athletes
    const athleteData = await readJsonFile<Athlete>('athletes.json');
    if (athleteData.length > 0) {
      console.log(`Migrating ${athleteData.length} athletes...`);
      for (const athlete of athleteData) {
        try {
          await db.insert(athletes).values({
            firstName: athlete.firstName,
            lastName: athlete.lastName,
            birthDate: athlete.birthDate,
            parentId: athlete.parentId,
            experience: athlete.experience,
            medicalNotes: athlete.medicalNotes,
            photoUrl: athlete.photoUrl,
            createdAt: athlete.createdAt ? new Date(athlete.createdAt) : new Date(),
            updatedAt: athlete.updatedAt ? new Date(athlete.updatedAt) : new Date()
          }).onConflictDoNothing();
        } catch (error) {
          console.log(`Skipping athlete ${athlete.firstName} ${athlete.lastName} - already exists or parent not found`);
        }
      }
    }

    // Migrate bookings
    const bookingData = await readJsonFile<Booking>('bookings.json');
    if (bookingData.length > 0) {
      console.log(`Migrating ${bookingData.length} bookings...`);
      for (const booking of bookingData) {
        try {
          await db.insert(bookings).values({
            athleteId: booking.athleteId,
            parentId: booking.parentId,
            lessonType: booking.lessonType,
            sessionDate: booking.sessionDate,
            sessionTime: booking.sessionTime,
            focusAreas: booking.focusAreas,
            status: booking.status,
            attendanceStatus: booking.attendanceStatus,
            amount: booking.amount,
            paymentStatus: booking.paymentStatus,
            stripePaymentIntentId: booking.stripePaymentIntentId,
            notes: booking.notes,
            dropoffPerson: booking.dropoffPerson,
            pickupPerson: booking.pickupPerson,
            dropoffRelationship: booking.dropoffRelationship,
            pickupRelationship: booking.pickupRelationship,
            createdAt: booking.createdAt ? new Date(booking.createdAt) : new Date(),
            updatedAt: booking.updatedAt ? new Date(booking.updatedAt) : new Date()
          }).onConflictDoNothing();
        } catch (error) {
          console.log(`Skipping booking ${booking.id} - already exists or related data not found`);
        }
      }
    }

    // Migrate availability
    const availabilityData = await readJsonFile<Availability>('availability.json');
    if (availabilityData.length > 0) {
      console.log(`Migrating ${availabilityData.length} availability records...`);
      for (const avail of availabilityData) {
        try {
          await db.insert(availability).values({
            dayOfWeek: avail.dayOfWeek,
            startTime: avail.startTime,
            endTime: avail.endTime,
            isAvailable: avail.isAvailable,
            createdAt: avail.createdAt ? new Date(avail.createdAt) : new Date()
          }).onConflictDoNothing();
        } catch (error) {
          console.log(`Skipping availability ${avail.dayOfWeek} - already exists`);
        }
      }
    }

    // Migrate availability exceptions
    const exceptionData = await readJsonFile<AvailabilityException>('exceptions.json');
    if (exceptionData.length > 0) {
      console.log(`Migrating ${exceptionData.length} availability exceptions...`);
      for (const exception of exceptionData) {
        try {
          await db.insert(availabilityExceptions).values({
            date: exception.date,
            startTime: exception.startTime,
            endTime: exception.endTime,
            isAvailable: exception.isAvailable,
            reason: exception.reason,
            createdAt: exception.createdAt ? new Date(exception.createdAt) : new Date()
          }).onConflictDoNothing();
        } catch (error) {
          console.log(`Skipping exception ${exception.date} - already exists`);
        }
      }
    }

    // Migrate auth codes
    const authCodeData = await readJsonFile<ParentAuthCode>('auth-codes.json');
    if (authCodeData.length > 0) {
      console.log(`Migrating ${authCodeData.length} auth codes...`);
      for (const authCode of authCodeData) {
        try {
          await db.insert(parentAuthCodes).values({
            email: authCode.email,
            code: authCode.code,
            expiresAt: authCode.expiresAt ? new Date(authCode.expiresAt) : new Date(),
            used: authCode.used,
            createdAt: authCode.createdAt ? new Date(authCode.createdAt) : new Date()
          }).onConflictDoNothing();
        } catch (error) {
          console.log(`Skipping auth code for ${authCode.email} - already exists`);
        }
      }
    }

    // Check if we need to migrate sample data
    const existingBlogPosts = await db.select().from(blogPosts);
    const existingTips = await db.select().from(tips);

    if (existingBlogPosts.length === 0) {
      console.log('Adding sample blog posts...');
      await addSampleBlogPosts();
    }

    if (existingTips.length === 0) {
      console.log('Adding sample tips...');
      await addSampleTips();
    }

    console.log('Migration completed successfully!');
    
    // Show migration summary
    const counts = await Promise.all([
      db.select().from(admins).then(r => r.length),
      db.select().from(parents).then(r => r.length),
      db.select().from(athletes).then(r => r.length),
      db.select().from(bookings).then(r => r.length),
      db.select().from(availability).then(r => r.length),
      db.select().from(availabilityExceptions).then(r => r.length),
      db.select().from(parentAuthCodes).then(r => r.length),
      db.select().from(blogPosts).then(r => r.length),
      db.select().from(tips).then(r => r.length)
    ]);

    console.log('\n=== Migration Summary ===');
    console.log(`Admins: ${counts[0]}`);
    console.log(`Parents: ${counts[1]}`);
    console.log(`Athletes: ${counts[2]}`);
    console.log(`Bookings: ${counts[3]}`);
    console.log(`Availability: ${counts[4]}`);
    console.log(`Availability Exceptions: ${counts[5]}`);
    console.log(`Auth Codes: ${counts[6]}`);
    console.log(`Blog Posts: ${counts[7]}`);
    console.log(`Tips: ${counts[8]}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

async function addSampleBlogPosts() {
  const samplePosts = [
    {
      title: "Building Confidence Through Small Wins",
      content: `# Building Confidence Through Small Wins

Every gymnastics journey begins with a single step, and at Coach Will's Adventure Academy, we believe that confidence grows through celebrating the small victories along the way.

## The Power of Progressive Achievement

When young athletes first step into our training space, they might feel overwhelmed by the skills they see others performing. But here's the secret: every gymnast started with their first cartwheel, their first handstand, their first moment of believing "I can do this."

## Creating Success Moments

Our approach focuses on:

**Daily Victories**: Every session includes achievable goals that build momentum. Whether it's holding a handstand for one second longer or landing a jump with better form, these moments matter.

**Skill Progression**: We break down complex movements into manageable steps. A back handspring becomes a series of smaller skills that, when mastered individually, combine naturally.

**Celebration Culture**: We make noise about progress! When an athlete conquers a fear or nails a skill they've been working on, the whole training family celebrates.

## The Ripple Effect

Confidence built in gymnastics doesn't stay on the mat. Our athletes carry this self-assurance into school, friendships, and new challenges. They learn that with persistence and the right support, they can achieve things that once seemed impossible.

## Your Role as a Parent

Your encouragement at home reinforces what we build in training. Ask about their favorite part of practice, celebrate their effort over perfection, and remind them that every expert was once a beginner.

Remember: we're not just teaching gymnastics skills—we're building confident, resilient young people who know they can face any challenge with courage and determination.`,
      category: "motivation",
      publishedAt: new Date('2024-06-15'),
      imageUrl: null
    },
    {
      title: "The Journey of Learning: Why Mistakes Are Magnificent",
      content: `# The Journey of Learning: Why Mistakes Are Magnificent

At Coach Will's Adventure Academy, we've discovered something remarkable: the athletes who embrace their mistakes are the ones who soar the highest. Today, let's explore why "failure" is actually the secret ingredient to success.

## Reframing the Fall

When a gymnast misses a skill, our first response isn't disappointment—it's curiosity. "What did we learn from that attempt?" becomes our guiding question. This shift in perspective transforms every stumble into a stepping stone.

## The Science of Skill Development

Research shows that our brains actually grow stronger when we struggle with challenges. Those moments of difficulty are literally building new neural pathways. When your child comes home saying practice was "hard," celebrate—that means they're growing!

## Building Resilience Through Repetition

Every gymnast learns that:
- **Repetition builds muscle memory**: The 50th cartwheel is smoother than the first
- **Adjustments improve performance**: Each attempt provides feedback
- **Persistence pays off**: Breakthrough moments often come after the hardest days

## Creating a Safe Space to Struggle

Our training environment is designed to make mistakes feel safe:
- **Supportive coaching**: We guide through challenges rather than criticizing
- **Peer encouragement**: Athletes cheer each other through difficulties
- **Growth mindset**: We celebrate effort and improvement over perfection

## The Transfer to Life

Athletes who learn to embrace challenges in gymnastics become:
- More willing to try new things at school
- Better at handling academic struggles
- More resilient in social situations
- Confident in their ability to overcome obstacles

## Tips for Parents

- Ask "What did you learn today?" instead of "Did you get it right?"
- Share your own learning experiences and mistakes
- Celebrate effort and progress, not just achievements
- Remind them that every gymnast has "learning days"

Remember: we're not just building gymnasts—we're building young people who know that every expert was once a beginner, and every success story includes chapters of struggle and growth.`,
      category: "training",
      publishedAt: new Date('2024-06-20'),
      imageUrl: null
    },
    {
      title: "Nutrition for Young Athletes: Fueling the Adventure",
      content: `# Nutrition for Young Athletes: Fueling the Adventure

Just as a car needs the right fuel to run efficiently, young gymnasts need proper nutrition to power their training and support their growth. Let's explore how to fuel your young athlete's adventures in gymnastics.

## The Foundation: Balanced Meals

Growing athletes need a variety of nutrients to support their active lifestyle:

**Protein**: Building blocks for strong muscles
- Lean meats, fish, eggs, dairy, beans, nuts
- Aim for protein at every meal and snack

**Carbohydrates**: The body's preferred energy source
- Whole grains, fruits, vegetables
- Essential for sustained energy during training

**Healthy Fats**: Important for growth and brain development
- Avocados, nuts, olive oil, fish
- Support overall health and development

## Pre-Training Fuel

**1-2 Hours Before Practice:**
- Light meal with carbs and protein
- Examples: banana with peanut butter, Greek yogurt with berries, whole grain toast with turkey

**30 Minutes Before:**
- Quick energy snack if needed
- Examples: small piece of fruit, crackers, sports drink

## Recovery Nutrition

**Within 30 Minutes After Training:**
- Combination of protein and carbs
- Examples: chocolate milk, trail mix, fruit smoothie with protein powder

**Full Recovery Meal:**
- Balanced meal within 2 hours
- Include all food groups for optimal recovery

## Hydration Heroes

Water is crucial for:
- Temperature regulation
- Joint lubrication
- Nutrient transport
- Performance maintenance

**Hydration Tips:**
- Start each day with water
- Bring a water bottle to every practice
- Drink before, during, and after training
- Monitor urine color (pale yellow is ideal)

## Special Considerations

**Growth Spurts**: Increased calorie needs during rapid growth periods
**Competition Days**: Familiar foods, avoid trying new things
**Travel**: Pack healthy snacks for competitions and meets

## Building Healthy Habits

- Involve kids in meal planning and preparation
- Make healthy foods easily accessible
- Model good eating habits as a family
- Focus on how food makes them feel and perform

## Foods to Limit

While all foods can fit in a balanced diet, limit:
- Excessive sugary drinks and snacks
- Highly processed foods
- Foods high in saturated fats
- Anything that makes them feel sluggish

## Listen to Your Body

Teach young athletes to:
- Recognize hunger and fullness cues
- Notice how different foods affect their energy
- Understand that nutrition supports their goals
- Enjoy food as part of their healthy lifestyle

Remember: We're building lifelong healthy relationships with food, not strict dietary rules. Focus on nourishing the body to support their gymnastics adventures and overall well-being.`,
      category: "health",
      publishedAt: new Date('2024-06-25'),
      imageUrl: null
    }
  ];

  for (const post of samplePosts) {
    await db.insert(blogPosts).values(post);
  }
}

async function addSampleTips() {
  const sampleTips = [
    {
      title: "Perfect Your Handstand Foundation",
      content: `# Perfect Your Handstand Foundation

The handstand is the cornerstone of gymnastics - it appears in floor routines, beam sequences, and vault approaches. Building a strong handstand foundation is essential for every gymnast.

## Body Positioning Basics

**Straight Line**: Your body should form one straight line from your fingertips to your toes. Imagine a string pulling you up from your feet.

**Hollow Body**: Engage your core to create a slight hollow in your torso. This prevents arching and provides stability.

**Shoulder Alignment**: Push through your shoulders, creating an active, strong base. Your ears should be between your arms.

## Hand Placement

- **Finger Position**: Spread fingers wide, like starfish
- **Weight Distribution**: Lean slightly forward onto your fingertips
- **Grip**: Press firmly into the ground, creating an active base

## Progressive Training Steps

**Week 1-2: Wall Handstands**
- Face the wall, walk feet up
- Hold for 10-30 seconds
- Focus on straight body position

**Week 3-4: Chest-to-Wall Handstands**
- Back to wall, walk feet up
- This teaches proper shoulder alignment
- Work up to 60-second holds

**Week 5-6: Freestanding Attempts**
- Use skills learned from wall work
- Practice kick-ups with a spotter
- Focus on consistency over hold time

## Common Mistakes to Avoid

- **Banana Back**: Arching the back instead of staying straight
- **Shoulder Sag**: Not pushing through the shoulders
- **Looking Around**: Keep your head neutral, look at your hands
- **Uneven Kick**: Both legs should move together

## Daily Practice Routine

**Warm-up**: 5 minutes of shoulder and wrist mobility
**Strength**: 3 sets of hollow body holds (30 seconds)
**Skill Work**: 10 minutes of handstand practice
**Cool-down**: Gentle stretching

## Building Strength

Strong handstands require:
- **Core strength**: Hollow body holds, planks
- **Shoulder stability**: Pike push-ups, shoulder shrugs
- **Wrist flexibility**: Regular stretching and mobility work

## Mental Tips

- **Visualize Success**: Picture yourself in a perfect handstand
- **Stay Calm**: Tension makes balancing harder
- **Celebrate Progress**: Small improvements add up to big results

Remember: Handstands take time to develop. Be patient with yourself and focus on proper form over hold time. With consistent practice, you'll build the foundation for advanced gymnastics skills!`,
      category: "Floor",
      difficulty: "beginner",
      videoUrl: null,
      publishedAt: new Date('2024-06-10')
    },
    {
      title: "Cartwheel Mastery: From Beginner to Beautiful",
      content: `# Cartwheel Mastery: From Beginner to Beautiful

The cartwheel is often the first "big" skill young gymnasts learn, and it's the foundation for many advanced tumbling elements. Let's break down how to achieve cartwheel perfection.

## The Basic Pattern

Think of a cartwheel as "hand-hand-foot-foot" - you're placing your hands down one at a time, then your feet one at a time, creating a wheel-like motion.

## Step-by-Step Breakdown

**Starting Position**
- Stand sideways to your line of travel
- Arms reach toward the sky in a "Y" shape
- Strong, confident posture

**The Reach**
- Reach your first hand toward the ground
- Keep your head up and eyes forward
- Legs start to lift as you reach

**Hand Placement**
- Hands go down one at a time on a straight line
- Fingers spread wide for stability
- Arms stay strong and straight

**The Kick**
- Kick your legs over your head
- Keep legs straight and together
- Think "kick to the sky"

**The Landing**
- Feet land one at a time
- Land on balls of feet, not flat-footed
- Finish with arms reaching up

## Progressive Learning Steps

**Level 1: Lines and Dots**
- Practice hand-hand-foot-foot pattern walking
- Use chalk lines or tape on the floor
- Focus on placement, not speed

**Level 2: Elevated Cartwheels**
- Practice on a raised surface (like a beam on the floor)
- Helps with the "up and over" feeling
- Builds confidence in leg lift

**Level 3: One-Handed Cartwheels**
- Advanced progression for strength
- Helps identify stronger vs. weaker side
- Builds toward round-offs

## Common Fixes

**Problem: Bent Arms**
- *Solution*: Practice wheelbarrow walks for strength
- *Drill*: Hold handstand against wall

**Problem: Legs Don't Go Over Head**
- *Solution*: Practice kicks to vertical
- *Drill*: Cartwheel over a small obstacle

**Problem: Curved Path**
- *Solution*: Use a straight line guide
- *Drill*: Practice stepping pattern first

**Problem: Heavy Landing**
- *Solution*: Focus on light, controlled placement
- *Drill*: Practice landing position separately

## Strength and Flexibility Needs

**Strength Requirements:**
- Shoulder and arm strength for support
- Core strength for control
- Leg strength for powerful kick

**Flexibility Requirements:**
- Shoulder flexibility for reaching
- Hip flexibility for leg lift
- Ankle flexibility for light landings

## Practice Routine

**Daily Practice (10 minutes):**
1. 5 stepping patterns on the line
2. 5 cartwheels with a spotter
3. 5 independent attempts
4. 2 minutes of strength exercises

## Fun Variations to Try

Once you master the basic cartwheel:
- **Fast cartwheels**: Focus on speed and flow
- **Slow cartwheels**: Ultimate control challenge
- **One-handed cartwheels**: Advanced strength builder
- **Cartwheel to different positions**: Landing in lunge, squat, or jump

## Building Confidence

- Start with a spotter until the pattern feels natural
- Practice on different surfaces (grass, mats, floor)
- Film yourself to see your progress
- Celebrate small improvements

Remember: Every gymnast's cartwheel journey is unique. Some learn quickly, others need more time. Focus on your personal progress and enjoy the process of mastering this fundamental skill!`,
      category: "Floor",
      difficulty: "beginner",
      videoUrl: null,
      publishedAt: new Date('2024-06-15')
    },
    {
      title: "Back Handspring Prep: Building the Foundation",
      content: `# Back Handspring Prep: Building the Foundation

The back handspring is a milestone skill that opens the door to advanced tumbling. Before attempting this skill, proper preparation is essential for both safety and success.

## Prerequisites You Must Master

**Essential Skills:**
- Solid handstand (30+ seconds)
- Strong bridge kickover
- Confident backward roll
- Hollow body hold (45+ seconds)
- Back walkover with control

**Strength Requirements:**
- Shoulder and arm strength for support
- Core strength for body control
- Leg power for takeoff and landing

## Progressive Preparation Sequence

**Phase 1: Bridge Development**
- Bridge holds (30+ seconds)
- Bridge rocks (10+ reps)
- Bridge kickovers from standing
- Bridge kickovers from walk-in

**Phase 2: Jumping Backwards**
- Jump backwards onto raised surface
- Practice landing in bridge position
- Work on fast, powerful jump

**Phase 3: Handstand Snap-downs**
- From handstand, snap feet down quickly
- Land in hollow body position
- Builds the "snap" motion needed

## Technical Breakdown

**The Sit and Set**
- Slight sit in preparation
- Arms swing back and up
- Think "sit, set, jump"

**The Jump**
- Powerful jump up and back
- Arms reach for the floor behind you
- Maintain hollow body position

**The Support Phase**
- Hands contact floor with strong arms
- Push through shoulders
- Brief moment of handstand

**The Snap Down**
- Fast snap of legs and feet
- Land in hollow body position
- Absorb landing with slight bend

## Drill Progressions

**Drill 1: Timer Jumps**
- Jump backwards onto timer/raised mat
- Practice the jumping motion
- Focus on reaching back with arms

**Drill 2: Handstand Snap-downs**
- From handstand, snap feet down
- Land in standing position
- Builds the snap motion

**Drill 3: Back Handspring over Obstacle**
- Place obstacle in middle of skill
- Forces proper "up and over" trajectory
- Prevents low, fast attempts

**Drill 4: Spotted Attempts**
- Work with qualified coach
- Practice full motion with support
- Build confidence and muscle memory

## Safety Considerations

**Never Attempt Without:**
- Proper supervision from qualified coach
- Adequate space and appropriate surface
- Sufficient strength and flexibility
- Mastery of prerequisite skills

**Red Flags to Stop:**
- Wrist, shoulder, or back pain
- Fear that prevents proper technique
- Inability to maintain proper form
- Lack of prerequisite skills

## Mental Preparation

**Visualization:**
- Picture yourself completing the skill successfully
- Visualize the feel of each phase
- Imagine confident, controlled landing

**Confidence Building:**
- Master each drill thoroughly
- Celebrate small progressions
- Trust your preparation process

## Common Mistakes to Avoid

- **Rushing the Process**: Take time to build properly
- **Skipping Drills**: Each drill builds essential elements
- **Ignoring Fear**: Address concerns with coach
- **Poor Landing Position**: Always land in control

## Timeline Expectations

**Beginner**: 6-12 months of consistent preparation
**Intermediate**: 3-6 months with proper foundation
**Advanced**: 1-3 months if prerequisites are solid

Remember: The back handspring is an advanced skill that requires patience, preparation, and proper coaching. Focus on building a strong foundation through drills and prerequisite skills. When you're ready, this amazing skill will come together naturally!`,
      category: "Floor",
      difficulty: "advanced",
      videoUrl: null,
      publishedAt: new Date('2024-06-20')
    }
  ];

  for (const tip of sampleTips) {
    await db.insert(tips).values(tip);
  }
}

// Execute migration if this file is run directly
migrateData().then(() => {
  console.log('Migration script completed');
  process.exit(0);
}).catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
});