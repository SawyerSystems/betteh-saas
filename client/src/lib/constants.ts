export const LESSON_TYPES = {
  "quick-journey": {
    name: "Quick Journey",
    duration: "30 minutes",
    athletes: 1,
    maxFocusAreas: 2,
    description: "Perfect for skill checks, focused practice, or when time is limited",
    benefits: ["Skill assessment", "Quick corrections", "Confidence building"],
    color: "blue",
    price: 40
  },
  "dual-quest": {
    name: "Dual Quest",
    duration: "30 minutes",
    athletes: 2,
    maxFocusAreas: 2,
    description: "Semi-private lesson for friends or siblings to learn together",
    benefits: ["Shared experience", "Peer motivation", "Cost effective"],
    color: "purple",
    price: 50
  },
  "deep-dive": {
    name: "Deep Dive",
    duration: "60 minutes",
    athletes: 1,
    maxFocusAreas: 4,
    description: "Comprehensive training session for significant skill development",
    benefits: ["Detailed instruction", "Multiple skills", "Progress tracking"],
    color: "teal",
    price: 60
  },
  "partner-progression": {
    name: "Partner Progression",
    duration: "60 minutes",
    athletes: 2,
    maxFocusAreas: 4,
    description: "Extended semi-private lesson for serious skill development",
    benefits: ["Intensive training", "Partner support", "Advanced techniques"],
    color: "orange",
    price: 80
  }
} as const;

// Map lesson types to their database IDs
export const LESSON_TYPE_IDS: { [key: string]: number } = {
  'quick-journey': 1,
  'dual-quest': 2,  
  'deep-dive': 3,
  'partner-progression': 4
};

// Event-based skills structure for two-step dropdown selection
export const GYMNASTICS_EVENTS = {
  tumbling: {
    name: "Tumbling",
    skills: [
      "Forward Roll",
      "Backward Roll", 
      "Cartwheel",
      "Round-off",
      "Handstand",
      "Bridge",
      "Back Walkover",
      "Front Walkover",
      "Back Handspring",
      "Front Handspring",
      "Back Tuck",
      "Front Tuck",
      "Layout",
      "Twist"
    ]
  },
  beam: {
    name: "Beam",
    skills: [
      "Handstand and Handstand Dismounts",
      "Backward Roll",
      "Cartwheel",
      "Back Walkover",
      "Back Handspring",
      "Split Leap",
      "Full Turn",
      "Side Aerial",
      "Back Tuck Dismount"
    ]
  },
  vault: {
    name: "Vault",
    skills: [
      "Handspring",
      "Handspring ½",
      "Half-On",
      "Front Pike",
      "Yurchenko Timer"
    ]
  },
  bars: {
    name: "Bars",
    skills: [
      "Spin-the-Cat",
      "Kickover",
      "Cast",
      "Pullover",
      "Glide Kip",
      "Cast Handstand",
      "Back Hip Circle",
      "Flyaway",
      "Baby Giant",
      "Toe-On Circle",
      "Clear Hip to Handstand"
    ]
  },
  "side-quests": {
    name: "Side Quests",
    skills: [
      "Flexibility Training",
      "Strength Training", 
      "Agility Training",
      "Meditation and Breathing Techniques",
      "Mental Blocks"
    ]
  }
} as const;

// Legacy focus areas for backward compatibility
export const FOCUS_AREAS = [
  // Apparatus
  "Floor",
  "Beam", 
  "Bars",
  "Vault",
  "Trampoline",
  "Tumble Track",
  
  // Basic Skills
  "Forward Rolls",
  "Backward Rolls", 
  "Handstands",
  "Bridges & Backbends",
  
  // Intermediate Skills
  "Walkovers",
  "Cartwheel",
  "Roundoff",
  "Front Handspring",
  "Back Handspring",
  
  // Advanced Skills
  "Front Tuck",
  "Back Tuck", 
  "Front Layout",
  "Back Layout",
  "Fulls",
  "Double Fulls",
  "Double Backs"
] as const;

export const EXPERIENCE_LEVELS = [
  "beginner",
  "intermediate", 
  "advanced"
] as const;

// Note: Gender options are now dynamically loaded from the database via useGenders hook
// This ensures consistency with the normalized genders table

export const AGES = [
  "4", "5", "6", "7", "8", "9", "10", "11", "12", "13+"
] as const;

export const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM", 
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM"
] as const;
