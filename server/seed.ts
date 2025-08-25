import { db } from "./db";
import { users, blogPosts, tips } from "@shared/schema";

async function seed() {
  console.log("Seeding database with sample data...");

  // Check if data already exists
  const existingPosts = await db.select().from(blogPosts);
  if (existingPosts.length > 0) {
    console.log("Database already has data, skipping seed.");
    return;
  }

  // Sample blog posts
  const sampleBlogPosts = [
    {
      title: "5 Essential Stretches for Young Gymnasts",
      content: "Flexibility is crucial for gymnastics success. Here are five stretches every young gymnast should do daily...",
      excerpt: "Learn the most important stretches to improve flexibility and prevent injuries in young gymnasts.",
      category: "Tips",
      imageUrl: null
    },
    {
      title: "Building Confidence on the Balance Beam",
      content: "The balance beam can be intimidating for beginners. Start with these progressive exercises...",
      excerpt: "Step-by-step approach to help young gymnasts overcome beam anxiety and build confidence.",
      category: "Training",
      imageUrl: null
    },
    {
      title: "Sarah's First Competition Success",
      content: "At just 8 years old, Sarah overcame her nerves to place 3rd in her first competition...",
      excerpt: "An inspiring story of a young gymnast's journey from nervous beginner to confident competitor.",
      category: "Story",
      imageUrl: null
    },
    {
      title: "Home Practice: Setting Up a Safe Space",
      content: "Create a safe practice area at home with these essential tips for parents...",
      excerpt: "Essential safety guidelines and equipment recommendations for practicing gymnastics at home.",
      category: "Guide",
      imageUrl: null
    },
    {
      title: "The Importance of Mental Training",
      content: "Gymnastics is as much mental as it is physical. Here's how to develop mental toughness...",
      excerpt: "Discover techniques to build mental strength and resilience in young athletes.",
      category: "Tips",
      imageUrl: null
    },
    {
      title: "Nutrition for Young Athletes",
      content: "Proper nutrition fuels performance and supports healthy growth in young gymnasts...",
      excerpt: "Learn about nutrition basics to support your young gymnast's training and development.",
      category: "Guide",
      imageUrl: null
    }
  ];

  // Sample tips
  const sampleTips = [
    {
      title: "Perfect Your Cartwheel",
      content: "Step 1: Start with hands up high. Step 2: Step forward with your dominant leg. Step 3: Place hands down one at a time in a straight line. Step 4: Keep legs straight and wide. Step 5: Land one foot at a time.",
      category: "Floor Skills",
      difficulty: "Beginner",
      videoUrl: null
    },
    {
      title: "Back Handspring Progression",
      content: "Master the back handspring with this step-by-step progression. Start with back bends, then wall walks, followed by back walkovers. Practice with a spotter until you can safely perform the skill independently.",
      category: "Floor Skills", 
      difficulty: "Intermediate",
      videoUrl: null
    },
    {
      title: "Handstand Hold Technique",
      content: "Build a strong handstand by focusing on proper alignment. Keep your body in a straight line, engage your core, and look at your hands. Start against a wall and gradually work toward freestanding holds.",
      category: "Strength",
      difficulty: "Beginner",
      videoUrl: null
    },
    {
      title: "Beam Walk Confidence",
      content: "Start on a line on the floor, then progress to a low beam. Keep your eyes focused ahead, not down at your feet. Practice with arms out for balance and gradually bring them to your sides.",
      category: "Beam",
      difficulty: "Beginner", 
      videoUrl: null
    }
  ];

  // Insert blog posts
  for (const post of sampleBlogPosts) {
    await db.insert(blogPosts).values(post);
  }

  // Insert tips
  for (const tip of sampleTips) {
    await db.insert(tips).values(tip);
  }

  console.log("Database seeded successfully!");
}

// Run seed if called directly
seed().then(() => process.exit(0)).catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

export { seed };