// ...existing code...
// ...existing code...
import { type Admin, type Apparatus, type ArchivedWaiver, type Athlete, type AthleteSkill, type AthleteSkillVideo, type AthleteWithWaiverStatus, type Availability, type AvailabilityException, type BlogEmailSignup, type BlogPost, type Booking, type BookingWithRelations, type CookieConsent, type FocusArea, type InsertAdmin, type InsertApparatus, type InsertArchivedWaiver, type InsertAthlete, type InsertAthleteInput, type InsertAthleteSkill, type InsertAthleteSkillVideo, type InsertAvailability, type InsertAvailabilityException, type InsertBlogPost, type InsertBooking, type InsertBookingInput, type InsertCookieConsent, type InsertFocusArea, type InsertParent, type InsertParentInput, type InsertPrivacyRequest, type InsertProgressShareLink, type InsertSideQuest, type InsertSiteInquiry, type InsertSkill, type InsertTip, type InsertWaiver, type Parent, type PrivacyRequest, type ProgressShareLink, type SideQuest, type SiteInquiry, type Skill, type Tip, type Waiver, type ActivityLog, type InsertActivityLog, ActivityActorType, ActivityActionType, ActivityCategory, ActivityTargetType, AttendanceStatusEnum, BookingStatusEnum, PaymentStatusEnum, type Event, type InsertEvent } from "../shared/schema";
import Stripe from 'stripe';
import { supabase, supabaseAdmin } from "./supabase-client";
import { supabaseServiceRole } from "./supabase-service-role";

// Temporary types for unused auth codes (intentionally missing from database)
interface ParentAuthCode {
  id: number;
  email: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
}

interface InsertParentAuthCode {
  email: string;
  code: string;
  expiresAt: Date;
  used?: boolean;
}
export interface IStorage {
  // Archiving logic
  archiveBookingsByParentId(parentId: number, reason: string): Promise<void>;
  archiveBookingsByAthleteId(athleteId: number, reason: string): Promise<void>;
  getAllArchivedBookings(): Promise<any[]>;
  // Parents (preferred terminology)
  getAllParents(): Promise<Parent[]>;
  identifyParent(email: string, phone: string): Promise<Parent | undefined>;
  createParent(parent: InsertParentInput): Promise<Parent>;
  updateParent(id: number, parent: Partial<InsertParentInput>): Promise<Parent | undefined>;
  deleteParent(id: number): Promise<boolean>;
  getParentAthletes(parentId: number): Promise<Athlete[]>;
  getParentById(id: number): Promise<Parent | undefined>;
  getParent(id: number): Promise<Parent | undefined>;

  // Parents (legacy compatibility)
  identifyParent(email: string, phone: string): Promise<Parent | undefined>;
  createParent(parent: InsertParent): Promise<Parent>;
  updateParent(id: number, parent: Partial<InsertParent>): Promise<Parent | undefined>;
  deleteParent(id: number): Promise<boolean>;
  getParentAthletes(parentId: number): Promise<Athlete[]>;
// ...rest of interface unchanged...

  // Lesson Types
  getAllLessonTypes(): Promise<any[]>;
  getLessonType(id: number): Promise<any | undefined>;
  createLessonType(lessonType: any): Promise<any>;
  updateLessonType(id: number, lessonType: any): Promise<any | undefined>;
  deleteLessonType(id: number): Promise<boolean>;
  
  // Athletes
  getAllAthletes(): Promise<Athlete[]>;
  getAllAthletesWithWaiverStatus(): Promise<AthleteWithWaiverStatus[]>;
  createAthlete(athlete: InsertAthleteInput): Promise<Athlete>;
  getAthlete(id: number): Promise<Athlete | undefined>;
  getAthleteWithWaiverStatus(id: number): Promise<AthleteWithWaiverStatus | undefined>;
  updateAthlete(id: number, athlete: Partial<InsertAthleteInput>): Promise<Athlete | undefined>;
  deleteAthlete(id: number): Promise<boolean>;
  getAthleteBookingHistory(athleteId: number): Promise<Booking[]>;
  addAthleteSlot(bookingId: number, athleteId: number, slotOrder: number): Promise<void>;

  // Bookings
  createBooking(booking: InsertBookingInput): Promise<Booking>;
  getBooking(id: number): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  updateBooking(id: number, data: Partial<Booking>): Promise<Booking | undefined>;
  updateBookingStatus(id: number, status: BookingStatusEnum): Promise<Booking | undefined>;
  updateBookingPaymentStatus(id: number, paymentStatus: PaymentStatusEnum): Promise<Booking | undefined>;
  updateBookingAttendanceStatus(id: number, attendanceStatus: AttendanceStatusEnum): Promise<Booking | undefined>;
  // Idempotent email flagging
  markSessionConfirmationEmailSent(bookingId: number, sentAt: string): Promise<boolean>;
  deleteBooking(id: number): Promise<boolean>;
  getUpcomingSessions(): Promise<{
    id: number;
    sessionDate: string;
    sessionTime: string;
    lessonType: string;
    parentName: string;
    athleteNames: string[];
    athletes: { id: number; firstName: string; lastName: string }[];
    focusAreas: string[];
    paymentStatus: string;
    attendanceStatus: string;
  }[]>;

  // Payment Logs
  createPaymentLog(log: { bookingId: number | null; stripeEvent: string | null; errorMessage: string | null }): Promise<void>;

  // Blog Posts
  getAllBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: InsertBlogPost): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;

  // Tips
  getAllTips(): Promise<Tip[]>;
  getTip(id: number): Promise<Tip | undefined>;
  createTip(tip: InsertTip): Promise<Tip>;
  updateTip(id: number, tip: InsertTip): Promise<Tip | undefined>;
  deleteTip(id: number): Promise<boolean>;

  // Availability
  getAllAvailability(): Promise<Availability[]>;
  getAvailability(id: number): Promise<Availability | undefined>;
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  updateAvailability(id: number, availability: InsertAvailability): Promise<Availability | undefined>;
  deleteAvailability(id: number): Promise<boolean>;

  // Availability Exceptions
  getAllAvailabilityExceptions(): Promise<AvailabilityException[]>;
  getAvailabilityException(id: number): Promise<AvailabilityException | undefined>;
  createAvailabilityException(exception: InsertAvailabilityException): Promise<AvailabilityException>;
  updateAvailabilityException(id: number, exception: InsertAvailabilityException): Promise<AvailabilityException | undefined>;
  deleteAvailabilityException(id: number): Promise<boolean>;
  getAvailabilityExceptionsByDateRange(startDate: string, endDate: string): Promise<AvailabilityException[]>;

  // Events (recurrence series)
  listEventsByRange(startIso: string, endIso: string): Promise<Event[]>; // raw series/overrides rows
  createEvent(input: InsertEvent): Promise<Event>;
  updateEvent(id: string, input: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>; // Legacy - use deleteEventWithMode
  deleteEventWithMode(id: string, mode: 'this' | 'future' | 'all', instanceDate?: string): Promise<boolean>;

  // Admins
  getAllAdmins(): Promise<Admin[]>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdmin(id: number): Promise<Admin | undefined>;

  // Parent Authentication
  createParentAuthCode(authCode: InsertParentAuthCode): Promise<ParentAuthCode>;
  getParentAuthCode(email: string, code: string): Promise<ParentAuthCode | undefined>;
  deleteParentAuthCode(email: string): Promise<boolean>;
  markAuthCodeAsUsed(id: number): Promise<void>;
  cleanupExpiredAuthCodes(): Promise<void>;

  // Email Verification
  createVerificationToken(token: { parentId: number; token: string; expiresAt: Date }): Promise<any>;
  getVerificationToken(token: string): Promise<any>;
  markParentAsVerified(parentId: number): Promise<void>;
  deleteVerificationToken(token: string): Promise<void>;
  deleteVerificationTokensByParentId(parentId: number): Promise<void>;

  // Password Reset
  createPasswordResetToken(token: { parentId: number; token: string; expiresAt: Date }): Promise<any>;
  getPasswordResetToken(token: string): Promise<any>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  deletePasswordResetToken(token: string): Promise<void>;
  deletePasswordResetTokensByParentId(parentId: number): Promise<void>;

  // Slot Reservations
  getActiveReservations(date: string): Promise<{ startTime: string; lessonType: string }[]>;
  reserveSlot(date: string, startTime: string, lessonType: string, sessionId: string): Promise<boolean>;
  releaseSlot(date: string, startTime: string): Promise<boolean>;
  cleanupExpiredReservations(): Promise<void>;

  // Waivers
  createWaiver(waiver: InsertWaiver): Promise<Waiver>;
  getWaiver(id: number): Promise<Waiver | undefined>;
  getWaiverByAthleteId(athleteId: number): Promise<Waiver | undefined>;
  getWaiverByBookingId(bookingId: number): Promise<Waiver | undefined>;
  getAllWaivers(): Promise<Waiver[]>;
  updateWaiver(id: number, waiver: Partial<InsertWaiver>): Promise<Waiver | undefined>;
  updateWaiverPdfPath(id: number, pdfPath: string): Promise<Waiver | undefined>;
  updateWaiverEmailSent(id: number): Promise<Waiver | undefined>;

  // Skills master + athlete progress
  listSkills(filters?: { apparatusId?: number; level?: string }): Promise<Skill[]>;
  createSkill(input: InsertSkill): Promise<Skill>;
  updateSkill(id: number, input: Partial<InsertSkill>): Promise<Skill | undefined>;
  deleteSkill(id: number): Promise<boolean>;

  // Skill relations (prerequisites and connected components)
  getSkillRelations(skillId: number): Promise<{ prerequisiteIds: number[]; componentIds: number[] }>;
  setSkillRelations(skillId: number, prereqIds: number[], componentIds: number[]): Promise<{ prerequisiteIds: number[]; componentIds: number[] }>;

  getAthleteSkills(athleteId: number): Promise<Array<AthleteSkill & { skill?: Skill | null }>>;
  upsertAthleteSkill(input: InsertAthleteSkill): Promise<AthleteSkill>;

  addAthleteSkillVideo(input: InsertAthleteSkillVideo): Promise<AthleteSkillVideo>;
  listAthleteSkillVideos(athleteSkillId: number): Promise<AthleteSkillVideo[]>;
  deleteAthleteSkillVideo(id: number): Promise<boolean>;

  createProgressShareLink(input: InsertProgressShareLink): Promise<ProgressShareLink>;
  getProgressByToken(token: string): Promise<{
    athlete: Athlete | null;
    skills: Array<{
      athleteSkill: AthleteSkill;
      skill?: Skill | null;
      videos: AthleteSkillVideo[];
    }>;
    link: ProgressShareLink | null;
  } | null>;
  /**
   * Session-authorized progress fetch for a given athlete.
   * Returns the same shape as getProgressByToken but without link metadata.
   */
  getProgressByAthleteId(athleteId: number): Promise<{
    athlete: Athlete | null;
    skills: Array<{
      athleteSkill: AthleteSkill;
      skill?: Skill | null;
      videos: AthleteSkillVideo[];
    }>;
    link: ProgressShareLink | null;
  } | null>;

  // Archived Waivers
  getAllArchivedWaivers(): Promise<ArchivedWaiver[]>;
  createArchivedWaiver(waiver: InsertArchivedWaiver): Promise<ArchivedWaiver>;
  deleteArchivedWaiver(id: number): Promise<boolean>;
  archiveWaiver(waiverId: number, reason: string): Promise<ArchivedWaiver | undefined>;

  // Normalized Lookup Tables
  getAllApparatus(): Promise<Apparatus[]>;
  createApparatus(apparatus: InsertApparatus): Promise<Apparatus>;
  updateApparatus(id: number, apparatus: Partial<InsertApparatus>): Promise<Apparatus | undefined>;
  deleteApparatus(id: number): Promise<boolean>;

  getAllFocusAreas(): Promise<FocusArea[]>;
  getFocusAreasByApparatus(apparatusId: number): Promise<FocusArea[]>;
  getFocusAreasByLevel(level: string): Promise<FocusArea[]>;
  createFocusArea(focusArea: InsertFocusArea): Promise<FocusArea>;
  updateFocusArea(id: number, focusArea: Partial<InsertFocusArea>): Promise<FocusArea | undefined>;
  deleteFocusArea(id: number): Promise<boolean>;
  addBookingFocusArea(bookingId: number, focusAreaId: number | number[]): Promise<void>;

  getAllSideQuests(): Promise<SideQuest[]>;
  createSideQuest(sideQuest: InsertSideQuest): Promise<SideQuest>;
  updateSideQuest(id: number, sideQuest: Partial<InsertSideQuest>): Promise<SideQuest | undefined>;
  deleteSideQuest(id: number): Promise<boolean>;

  // Enhanced booking methods with normalized relationships
  getBookingWithRelations(id: number): Promise<BookingWithRelations | undefined>;
  getAllBookingsWithRelations(): Promise<BookingWithRelations[]>;
  createBookingWithRelations(
    booking: InsertBooking,
    apparatusIds: number[],
    focusAreaIds: number[],
    sideQuestIds: number[]
  ): Promise<BookingWithRelations>;
  updateBookingRelations(
    bookingId: number,
    apparatusIds: number[],
    focusAreaIds: number[],
    sideQuestIds: number[]
  ): Promise<BookingWithRelations | undefined>;

  // Blog Email Subscriptions
  updateParentBlogEmailOptIn(parentId: number, optIn: boolean): Promise<Parent | undefined>;
  createBlogEmailSignup(email: string): Promise<BlogEmailSignup>;
  getAllBlogEmailSignups(): Promise<BlogEmailSignup[]>;
  getAllParentsWithBlogOptIn(): Promise<Parent[]>;
  getAllBlogEmailAddresses(): Promise<string[]>;

  // Site Content Management
  getSiteContent(): Promise<any>;
  updateSiteContent(content: any): Promise<any>;
  getAllTestimonials(): Promise<any[]>;
  createTestimonial(testimonial: any): Promise<any>;
  updateTestimonial(id: number, testimonial: any): Promise<any>;
  deleteTestimonial(id: number): Promise<boolean>;
  setFeaturedTestimonial(id: number): Promise<any>;
  getAllSiteFaqs(): Promise<any[]>;
  createSiteFaq(faq: any): Promise<any>;
  updateSiteFaq(id: number, faq: any): Promise<any>;
  deleteSiteFaq(id: number): Promise<boolean>;
  bulkUpsertSiteFaqs(faqs: any[]): Promise<any[]>;
  uploadMedia(file: Buffer, fileName: string, contentType: string): Promise<string>;

  // Site Inquiries
  listSiteInquiries(): Promise<SiteInquiry[]>;
  createSiteInquiry(input: InsertSiteInquiry): Promise<SiteInquiry>;
  updateSiteInquiryStatus(id: number, status: SiteInquiry['status']): Promise<SiteInquiry | undefined>;
  deleteSiteInquiry(id: number): Promise<boolean>;

  // Privacy Requests
  listPrivacyRequests(): Promise<PrivacyRequest[]>;
  createPrivacyRequest(input: InsertPrivacyRequest): Promise<PrivacyRequest>;
  updatePrivacyRequestStatus(id: number, status: PrivacyRequest['status']): Promise<PrivacyRequest | undefined>;

  // Cookie Consent
  createCookieConsentLog(input: InsertCookieConsent): Promise<CookieConsent>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getAllActivityLogs(options?: {
    limit?: number;
    offset?: number;
    actorType?: ActivityActorType;
    actionCategory?: ActivityCategory;
    targetType?: ActivityTargetType;
    targetId?: number;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
  }): Promise<{ logs: ActivityLog[]; total: number }>;
  getActivityLogsByTarget(targetType: ActivityTargetType, targetId: number, limit?: number): Promise<ActivityLog[]>;
  markActivityReversed(id: number, reversedBy?: number, reverseActionId?: number): Promise<boolean>;
  deleteActivityLog(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  // Archive all bookings for a parent (stub)
  async archiveBookingsByParentId(parentId: number, reason: string): Promise<void> {
    // Not implemented in MemStorage
    return;
  }
  
  // Athlete and focus area association methods
  async addAthleteSlot(bookingId: number, athleteId: number, slotOrder: number): Promise<void> {
    throw new Error("addAthleteSlot not implemented in MemStorage");
  }
  
  async addBookingFocusArea(bookingId: number, focusAreaId: number | number[]): Promise<void> {
    throw new Error("addBookingFocusArea not implemented in MemStorage");
  }

  // Archive all bookings for an athlete (stub)
  async archiveBookingsByAthleteId(athleteId: number, reason: string): Promise<void> {
    // Not implemented in MemStorage
    return;
  }

  // Get all archived bookings (stub)
  async getAllArchivedBookings(): Promise<any[]> {
    // Not implemented in MemStorage
    return [];
  }

  // Session-authorized progress by athlete (stub for MemStorage)
  async getProgressByAthleteId(athleteId: number): Promise<{
    athlete: Athlete | null;
    skills: Array<{ athleteSkill: AthleteSkill; skill?: Skill | null; videos: AthleteSkillVideo[] }>;
    link: ProgressShareLink | null;
  } | null> {
    const athlete = (this.athletes && this.athletes.get(athleteId)) || null;
    return {
      athlete,
      skills: [],
      link: null,
    };
  }
  
  // Get all lesson types (stub)
  async getAllLessonTypes(): Promise<any[]> {
    // Return a simple implementation for MemStorage with mock data
    return [
      {
        id: 1,
        name: "Quick Journey",
        description: "30-minute private session",
        price: 40,
        reservationFee: 10,
        keyPoints: ["Skill assessment", "Quick corrections", "Confidence building"],
        duration: 30,
        isPrivate: true,
        maxAthletes: 1,
        isActive: true
      },
      {
        id: 2,
        name: "Dual Quest",
        description: "30-minute semi-private session",
        price: 50,
        reservationFee: 15,
        keyPoints: ["Partner training", "Social skills", "Shared experience"],
        duration: 30,
        isPrivate: false,
        maxAthletes: 2,
        isActive: true
      }
    ];
  }

  async getLessonType(id: number): Promise<any | undefined> {
    const lessonTypes = await this.getAllLessonTypes();
    return lessonTypes.find(lt => lt.id === id);
  }

  async createLessonType(lessonType: any): Promise<any> {
    // Mock implementation for MemStorage
    const newId = Math.max(...(await this.getAllLessonTypes()).map(lt => lt.id)) + 1;
    return { ...lessonType, id: newId };
  }

  async updateLessonType(id: number, lessonType: any): Promise<any | undefined> {
    // Mock implementation for MemStorage
    const existing = await this.getLessonType(id);
    if (!existing) return undefined;
    return { ...existing, ...lessonType };
  }

  async deleteLessonType(id: number): Promise<boolean> {
    // Mock implementation for MemStorage
    return true;
  }
  
  async getAllWaivers(): Promise<Waiver[]> {
    // In-memory stub for test/dev only
    return [];
  }
  private bookings: Map<number, Booking>;
  private blogPosts: Map<number, BlogPost>;
  private tips: Map<number, Tip>;
  private availability: Map<number, Availability>;
  private availabilityExceptions: Map<number, AvailabilityException>;
  private eventsMap: Map<string, Event>;
  private parents: Map<number, Parent>;
  private athletes: Map<number, Athlete>;
  private admins: Map<number, Admin>;
  private parentAuthCodes: Map<string, ParentAuthCode>;
  private waivers: Map<number, Waiver>;
  private archivedWaivers: Map<number, ArchivedWaiver>;
  private apparatus: Map<number, Apparatus>;
  private focusAreas: Map<number, FocusArea>;
  private sideQuests: Map<number, SideQuest>;
  private currentUserId: number;
  private currentBookingId: number;
  private currentBlogPostId: number;
  private currentTipId: number;
  private currentAvailabilityId: number;
  private currentAvailabilityExceptionId: number;
  private currentParentId: number;
  private currentAthleteId: number;
  private currentAdminId: number;
  private currentWaiverId: number;
  private currentArchivedWaiverId: number;
  private currentApparatusId: number;
  private currentFocusAreaId: number;
  private currentSideQuestId: number;

  constructor() {
    this.bookings = new Map();
    this.blogPosts = new Map();
    this.tips = new Map();
    this.availability = new Map();
  this.availabilityExceptions = new Map();
  this.eventsMap = new Map();
    this.parents = new Map();
    this.athletes = new Map();
    this.admins = new Map();
    this.parentAuthCodes = new Map();
    this.waivers = new Map();
    this.archivedWaivers = new Map();
    this.apparatus = new Map();
    this.focusAreas = new Map();
    this.sideQuests = new Map();
    this.currentUserId = 1;
    this.currentBookingId = 1;
    this.currentBlogPostId = 1;
    this.currentTipId = 1;
    this.currentAvailabilityId = 1;
    this.currentAvailabilityExceptionId = 1;
    this.currentParentId = 1;
    this.currentAthleteId = 1;
    this.currentAdminId = 1;
    this.currentWaiverId = 1;
    this.currentArchivedWaiverId = 1;
    this.currentApparatusId = 1;
    this.currentFocusAreaId = 1;
    this.currentSideQuestId = 1;

    // Initialize with some sample data
    this.initializeSampleData();
  }

  // Helper function to log queries (no-op for MemStorage)
  private logQuery(operation: string, table: string, filters?: any) {
    // No-op for in-memory storage
  }

  private initializeSampleData() {
    // Sample blog posts
  const samplePosts: Omit<BlogPost, 'id'>[] = [
      {
        title: "5 Essential Stretches for Young Gymnasts",
        content: `Flexibility is crucial for gymnastics success and injury prevention. Here are five essential stretches that every young gymnast should practice daily to improve their performance and maintain healthy muscles and joints.

**1. Pike Stretch**
Sit with legs straight out in front of you, feet together. Reach forward with your arms and try to touch your toes while keeping your knees straight. This stretch targets your hamstrings and lower back. Hold for 30 seconds and repeat 3 times.

**2. Straddle Stretch**
Sit with legs spread wide apart in a straddle position. Lean forward with your chest, keeping your back straight. This improves hip flexibility crucial for splits and leaps. Breathe deeply and hold for 30 seconds.

**3. Bridge Stretch**
Lie on your back, place hands by your ears, and push up into a bridge. This stretch opens up your shoulders and spine, essential for back walkovers and handsprings. Start with 10-15 second holds and gradually increase.

**4. Couch Stretch**
Place one foot on a couch or elevated surface behind you, with the other leg in a lunge position. This targets your hip flexors, which often get tight from tumbling. Hold for 30 seconds each leg.

**5. Shoulder Rolls and Arm Circles**
Roll your shoulders backward and forward, then make large and small circles with your arms. This keeps your shoulders healthy and prevents injury from all the overhead movements in gymnastics.

**Important Safety Tips:**
- Never force a stretch to the point of pain
- Hold each stretch for at least 20-30 seconds
- Breathe deeply throughout each stretch
- Warm up with light movement before stretching
- Be consistent - stretch daily for best results

Remember, flexibility takes time to develop. Be patient with yourself and celebrate small improvements!`,
        excerpt: "Learn these five essential stretches that every young gymnast should practice daily to improve their performance and prevent injuries.",
        category: "Tips",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
  publishedAt: new Date('2024-12-10'),
  sections: []
      },
      {
        title: "Emma's First Back Handspring Journey",
        content: `When 8-year-old Emma first walked into my gym six months ago, the idea of going backwards was absolutely terrifying to her. Like many young gymnasts, she had mastered her forward rolls and handstands but froze at the thought of a back handspring. Today, I'm thrilled to share her inspiring journey from fear to confidence.

**Month 1: Building Trust**
Emma's first lesson focused entirely on building trust - not just in me as her coach, but in her own abilities. We started with basic backward movements: backward rolls on an incline mat, walking backward on the beam, and simple back extensions on the floor. The key was making every movement feel safe and controlled.

**Month 2: Strength Development**
We dedicated this month to building the specific strength needed for back handsprings. Emma worked on hollow body holds, arch holds, and wall handstand holds. Her favorite exercise became the "rocket ship" - jumping backward from a squat position onto a stack of soft mats. This taught her the feeling of pushing backward with power.

**Month 3: The Breakthrough**
This was when Emma had her first "aha" moment. Using our overhead spotting rig, she finally felt what a complete back handspring rotation feels like. The smile on her face was priceless! We practiced this assisted version until she could do 10 in a row with confidence.

**Month 4: Reducing Assistance**
Gradually, I reduced my spotting. First, just a light touch on her back for confidence. Then, hovering my hands without touching. Emma was developing the muscle memory and spatial awareness needed for independent back handsprings.

**Month 5: First Solo Attempt**
Emma surprised both of us when she suddenly said, "Coach Will, I think I can do it by myself!" Her first solo back handspring wasn't perfect - she landed in a deep squat - but she did it! The joy and pride in her eyes reminded me why I love coaching.

**Month 6: Consistency and Confidence**
By month six, Emma could perform back handsprings consistently and was ready to connect them in series. More importantly, she had gained confidence that would help her tackle any skill in the future.

**Lessons for Parents and Gymnasts:**
- Fear is normal and okay - we work with it, not against it
- Every child progresses at their own pace
- Strength and flexibility training is just as important as skill practice
- Celebration of small victories builds confidence for bigger achievements
- Trust between coach and athlete is everything

Emma's journey reminds us that with patience, proper progression, and lots of encouragement, any goal is achievable. She's now working on her back handspring series and has her sights set on a back tuck!`,
        excerpt: "Follow Emma's inspiring 6-month journey from being afraid of going backwards to confidently performing her first back handspring.",
        category: "Story",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
  publishedAt: new Date('2024-12-08'),
  sections: []
      },
      {
        title: "Setting Up a Safe Home Practice Space",
        content: `Supporting your child's gymnastics development at home can make a huge difference in their progress. However, safety should always be the top priority. Here's your comprehensive guide to creating an effective and safe home practice space without breaking the bank.

**Essential Safety Rules First:**
Before we discuss equipment, let's establish the golden rules:
- Adult supervision is required for all gymnastics practice
- No attempting new skills at home without coach approval
- Practice only skills your child has already learned in class
- Stop immediately if anyone feels tired or unfocused

**Space Requirements:**
You'll need a minimum of 8x8 feet of clear space with 8-foot ceilings. Ideally, choose a room with:
- Soft flooring (carpet or exercise mats)
- No furniture with sharp corners nearby
- Good lighting
- Adequate ventilation

**Budget-Friendly Equipment:**

**Level 1: Basic Setup ($50-100)**
- Exercise mats (2-inch thick minimum): $30-50
- Yoga mat for stretching: $15-25
- Resistance bands for strength training: $10-15

**Level 2: Intermediate Setup ($150-300)**
- Folding gymnastics mat (4-inch thick): $100-150
- Low balance beam or tape line: $50-100
- Pull-up bar for upper body strength: $25-50

**Level 3: Advanced Setup ($300-500)**
- Gymnastics air mat: $200-300
- Adjustable parallette bars: $50-100
- Wall-mounted pull-up system: $50-100

**What NOT to Buy:**
- Trampolines (injury risk is too high)
- Cheap gymnastics equipment from big box stores
- Any equipment that promises to teach "advanced skills"
- Spring-loaded training aids

**Recommended Home Practices:**

**Flexibility Training (Daily):**
- Basic stretches from our blog post series
- Holding bridges, splits, and straddles
- Shoulder and wrist mobility exercises

**Strength Training (3x per week):**
- Hollow body holds
- Arch holds
- Push-ups and modified handstand holds against the wall
- Core strengthening exercises

**Basic Skills Review:**
- Forward and backward rolls on proper mats
- Handstand holds against the wall
- Cartwheel practice (if space allows)
- Balance and coordination drills

**Creating the Right Environment:**
Make the space inviting and fun! Consider:
- Playing upbeat music during practice
- Setting up a "gym corner" that stays consistent
- Creating a simple routine chart
- Celebrating progress with stickers or charts

**When to Practice:**
- 15-20 minutes, 3-4 times per week is ideal
- Never right after meals
- When your child is alert and energetic
- As a complement to, not replacement for, regular classes

**Red Flags to Watch For:**
- Your child attempting skills beyond their level
- Practicing when tired or distracted
- Using unsafe equipment or spaces
- Ignoring pain or discomfort

**Storage Solutions:**
Keep equipment organized and accessible:
- Wall hooks for resistance bands
- Under-bed storage for mats
- Designated bin for small equipment
- Easy setup and breakdown routine

**Working with Your Coach:**
Always communicate with your child's gymnastics coach about home practice:
- Ask which skills are appropriate for home practice
- Share any concerns or observations
- Get specific recommendations for your child's level
- Report any fears or difficulties your child mentions

Remember, the goal of home practice is to supplement, not replace, professional instruction. Focus on building strength, flexibility, and confidence in skills your child has already mastered. Most importantly, keep it fun and stress-free!

With the right setup and approach, home practice can accelerate your child's gymnastics development while building discipline and body awareness that will benefit them in all areas of life.`,
        excerpt: "Want to support your child's gymnastics practice at home? Here's how to create a safe and effective practice space without breaking the bank.",
        category: "Guide",
        imageUrl: "https://images.unsplash.com/photo-1540479859555-17af45c78602?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
  publishedAt: new Date('2024-12-05'),
  sections: []
      }
    ];

    samplePosts.forEach(post => {
      const id = this.currentBlogPostId++;
      this.blogPosts.set(id, { ...post, id });
    });

    // Sample tips
    const sampleTips: Omit<Tip, 'id'>[] = [
      {
        title: "Perfect Your Cartwheel",
        content: `The cartwheel is one of the fundamental skills in gymnastics, building strength, coordination, and spatial awareness. Here's how to master this essential skill step by step.`,
        sections: [
          {
            title: "Step 1: Body Position",
            content: "Start standing tall with arms raised overhead. Your body should be in a straight line from fingertips to toes. This position teaches proper alignment for the entire skill.",
            imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
          },
          {
            title: "Step 2: The Reach",
            content: "Reach toward the ground with your lead hand (right hand for right cartwheel). Your body should tilt to the side like a capital 'T'. Keep your eyes on your hand placement."
          },
          {
            title: "Step 3: Hand Placement",
            content: "Place your hands on the ground in a straight line, shoulder-width apart. Think of it as walking on a tightrope with your hands. Your first hand goes down, then your second hand follows in the same line.",
            imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
          },
          {
            title: "Step 4: Leg Action",
            content: "Kick your back leg up and over, followed by your front leg. Your legs should pass through a perfect side split position in the air. Keep them straight and strong."
          },
          {
            title: "Step 5: The Landing",
            content: "Land one foot at a time in the same straight line as your hands. Finish standing tall with arms overhead, just like you started."
          },
          {
            title: "Common Mistakes to Avoid",
            content: "- Placing hands too close together or too far apart\n- Allowing knees to bend during the kick\n- Landing with feet too far apart\n- Rushing through the skill instead of controlling each phase"
          }
        ],
        category: "Floor Skills",
        difficulty: "Beginner",
        videoUrl: null,
        publishedAt: new Date('2024-12-01')
      },
      {
        title: "Handstand Hold Tips",
        content: `Building a strong, consistent handstand is crucial for gymnastics success. This skill develops upper body strength, body awareness, and confidence for more advanced skills.`,
        sections: [
          {
            title: "Proper Setup",
            content: "Start facing away from a wall, about 6 inches away. Place your hands flat on the ground, shoulder-width apart, with fingers spread wide for maximum stability.",
            imageUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
          },
          {
            title: "The Kick Up",
            content: "From your setup position, step one foot forward (your stronger leg). Kick up with your back leg while simultaneously pushing through your front leg. Aim to get your legs together in a straight line above your head."
          },
          {
            title: "Body Position",
            content: "Once inverted, focus on these key points:\n- Press firmly through your fingertips and palm\n- Engage your entire core\n- Squeeze your legs together tightly\n- Point your toes toward the ceiling\n- Keep your head in a neutral position"
          },
          {
            title: "Progressive Training",
            content: "Week 1-2: Wall handstand holds (10 seconds)\nWeek 3-4: Hollow body training (30-60 seconds)\nWeek 5-6: Chest-to-wall handstands\nWeek 7-8: Free-standing attempts with spotter"
          }
        ],
        category: "Floor Skills", 
        difficulty: "Beginner",
        videoUrl: null,
        publishedAt: new Date('2024-11-30')
      },
      {
        title: "Back Handspring Progression",
        content: `The back handspring is often considered the gateway skill to advanced tumbling. It requires strength, flexibility, spatial awareness, and courage. Here's a comprehensive progression to help you master this exciting skill safely.`,
        sections: [
          {
            title: "Prerequisites",
            content: "Before attempting back handspring training, ensure you have:\n- Consistent bridge kickover\n- Strong hollow body hold (45+ seconds)\n- Back walkover proficiency\n- Adequate shoulder flexibility\n- No fear of going backwards"
          },
          {
            title: "Phase 1: Foundation Building",
            content: "Back Extension Rolls: Start lying on your back. Roll backward and push through your hands to land on your feet.\n\nBridge Kickovers: From a standing bridge, kick one leg over to land in a lunge.\n\nWall Walks: Start in a bridge with feet against the wall.",
            imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
          },
          {
            title: "Phase 2: Standing Back Handspring",
            content: "With a qualified spotter, practice the standing back handspring motion. Focus on:\n- Starting position with arms overhead\n- Sitting back slightly\n- Reaching back while jumping up and back\n- Hand contact shoulder-width apart\n- Pushing through hands to land"
          },
          {
            title: "Phase 3: Independence",
            content: "Gradually reduce spotter assistance. Start with a firm spot, then light touch, then just hands nearby for confidence. Focus on power development and mental preparation."
          }
        ],
        category: "Floor Skills",
        difficulty: "Intermediate",
        videoUrl: null,
        publishedAt: new Date('2024-11-28')
      },
      {
        title: "Balance Beam Confidence Building",
        content: `The balance beam can be intimidating, but with proper progression and mental training, any gymnast can develop confidence and skill on this apparatus.`,
        sections: [
          {
            title: "Start Low, Build High",
            content: "Begin all new skills on a floor line or low beam (2-4 inches high) before progressing to regulation height. This allows you to focus on technique without fear.",
            imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
          },
          {
            title: "Mental Preparation",
            content: "- Visualize successful completion before mounting the beam\n- Use positive self-talk ('I am strong and balanced')\n- Practice deep breathing to stay calm and focused\n- Start each session with skills you've already mastered"
          },
          {
            title: "Basic Positions",
            content: "Relevé Walk: Walk on the balls of your feet with arms in high V.\n\nStraight Leg Kicks: Kick to horizontal while maintaining perfect posture.\n\nPassé Balance: Balance on one leg with the other foot at your knee for 10 seconds."
          },
          {
            title: "Progression Steps",
            content: "1. Master skills on floor line first\n2. Progress to low beam with mats on both sides\n3. Gradually increase beam height\n4. Remove safety mats when confident"
          }
        ],
        category: "Beam",
        difficulty: "Beginner",
        videoUrl: null,
        publishedAt: new Date('2024-11-25')
      }
    ];

    sampleTips.forEach(tip => {
      const id = this.currentTipId++;
      this.tips.set(id, { ...tip, id });
    });

    // Initialize sample availability (weekly schedule)
    const sampleAvailability = [
      // Monday
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isRecurring: true, isAvailable: true },
      // Tuesday  
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isRecurring: true, isAvailable: true },
      // Wednesday
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isRecurring: true, isAvailable: true },
      // Thursday
      { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isRecurring: true, isAvailable: true },
      // Friday
      { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isRecurring: true, isAvailable: true },
      // Saturday
      { dayOfWeek: 6, startTime: "08:00", endTime: "16:00", isRecurring: true, isAvailable: true },
    ];

    sampleAvailability.forEach(availability => {
      const id = this.currentAvailabilityId++;
      this.availability.set(id, { 
        ...availability, 
        id, 
        tenantId: process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',
        createdAt: new Date()
      });
    });
  }

  // Parent management (stub implementations for compatibility)
  async identifyParent(email: string, phone: string): Promise<Parent | undefined> {
    // Stub implementation - actual logic is in routes using booking data
    return undefined;
  }

  async createParent(parent: InsertParent): Promise<Parent> {
    throw new Error("Parent management not implemented in MemStorage");
  }

  async updateParent(id: number, parent: Partial<InsertParent>): Promise<Parent | undefined> {
    throw new Error("Parent management not implemented in MemStorage");
  }

  async deleteParent(id: number): Promise<boolean> {
    throw new Error("Parent management not implemented in MemStorage");
  }

  async getParentAthletes(parentId: number): Promise<Athlete[]> {
    throw new Error("Parent management not implemented in MemStorage");
  }

  // Parent methods (preferred terminology - get all parents)
  async getAllParents(): Promise<Parent[]> {
    return [];
  }

  // Athlete management (stub implementations for compatibility)
  async getAllAthletes(): Promise<Athlete[]> {
    throw new Error("Athlete management not implemented in MemStorage");
  }

  async createAthlete(athlete: InsertAthlete): Promise<Athlete> {
    throw new Error("Athlete management not implemented in MemStorage");
  }

  async getAthlete(id: number): Promise<Athlete | undefined> {
    throw new Error("Athlete management not implemented in MemStorage");
  }

  async updateAthlete(id: number, athlete: Partial<InsertAthlete>): Promise<Athlete | undefined> {
    throw new Error("Athlete management not implemented in MemStorage");
  }

  async deleteAthlete(id: number): Promise<boolean> {
    throw new Error("Athlete management not implemented in MemStorage");
  }

  async getAthleteBookingHistory(athleteId: number): Promise<Booking[]> {
    throw new Error("Athlete management not implemented in MemStorage");
  }

  async getAllAthletesWithWaiverStatus(): Promise<AthleteWithWaiverStatus[]> {
    throw new Error("Athlete waiver status not implemented in MemStorage");
  }

  async getAthleteWithWaiverStatus(id: number): Promise<AthleteWithWaiverStatus | undefined> {
    throw new Error("Athlete waiver status not implemented in MemStorage");
  }

  // Bookings
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    
    // Extract parent name and phone for safety fields
    const parentFullName = 
      (insertBooking.parentFirstName && insertBooking.parentLastName) ? 
      `${insertBooking.parentFirstName} ${insertBooking.parentLastName}` : 
      "";
    const parentPhone = insertBooking.parentPhone || "";
    
    // Resolve tenant id with transitional default
  const effectiveTenantId: string = (
    (insertBooking as any).tenantId ||
    process.env.DEFAULT_TENANT_ID ||
    '00000000-0000-0000-0000-000000000001'
  ) as string;

  const booking: Booking = { 
      ...insertBooking,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: BookingStatusEnum.PENDING,
      paymentStatus: PaymentStatusEnum.UNPAID,
      attendanceStatus: AttendanceStatusEnum.PENDING,
      tenantId: effectiveTenantId,
      // Convert Date to string format for compatibility
      preferredDate: insertBooking.preferredDate instanceof Date ? 
        insertBooking.preferredDate.toISOString().split('T')[0] : 
        insertBooking.preferredDate,
      // Map focusAreaIds to focusAreas for backward compatibility
      focusAreas: Array.isArray(insertBooking.focusAreaIds) ? insertBooking.focusAreaIds.map(String) : [],
      focusAreaOther: insertBooking.focusAreaOther || null,
      // Ensure required fields are set for legacy athlete fields
      athlete1Allergies: Array.isArray(insertBooking.athletes) && insertBooking.athletes[0] ? insertBooking.athletes[0].allergies : null,
      athlete2Name: Array.isArray(insertBooking.athletes) && insertBooking.athletes[1] ? insertBooking.athletes[1].name : null,
      athlete2DateOfBirth: Array.isArray(insertBooking.athletes) && insertBooking.athletes[1] ? insertBooking.athletes[1].dateOfBirth : null,
      athlete2Allergies: Array.isArray(insertBooking.athletes) && insertBooking.athletes[1] ? insertBooking.athletes[1].allergies : null,
      athlete2Experience: Array.isArray(insertBooking.athletes) && insertBooking.athletes[1] ? insertBooking.athletes[1].experience : null,
      // Remove waiver fields - they're now in separate waivers table
      reservationFeePaid: insertBooking.reservationFeePaid ?? false,
      paidAmount: insertBooking.paidAmount ?? "0",
      specialRequests: insertBooking.specialRequests ?? null,
      adminNotes: insertBooking.adminNotes ?? null,
      // Safety verification fields
      dropoffPersonName: insertBooking.dropoffPersonName || parentFullName || "Parent",
      dropoffPersonRelationship: insertBooking.dropoffPersonRelationship || "Parent",
      dropoffPersonPhone: insertBooking.dropoffPersonPhone || parentPhone || "000-000-0000",
      pickupPersonName: insertBooking.pickupPersonName || parentFullName || "Parent",
      pickupPersonRelationship: insertBooking.pickupPersonRelationship || "Parent",
      pickupPersonPhone: insertBooking.pickupPersonPhone || parentPhone || "000-000-0000",
      altPickupPersonName: insertBooking.altPickupPersonName ?? null,
      altPickupPersonRelationship: insertBooking.altPickupPersonRelationship ?? null,
      altPickupPersonPhone: insertBooking.altPickupPersonPhone ?? null,
      safetyVerificationSigned: insertBooking.safetyVerificationSigned ?? false,
  safetyVerificationSignedAt: insertBooking.safetyVerificationSignedAt ?? null,
      progressNote: insertBooking.progressNote ?? null,
      coachName: insertBooking.coachName ?? "Coach Will",
  stripeSessionId: insertBooking.stripeSessionId ?? null,
  // Idempotent email defaults
  sessionConfirmationEmailSent: false,
  sessionConfirmationEmailSentAt: null,
  // Cancellation fields
  cancellationReason: insertBooking.cancellationReason ?? null,
  cancellationRequestedAt: insertBooking.cancellationRequestedAt ?? null,
  wantsReschedule: insertBooking.wantsReschedule ?? null,
  reschedulePreferences: insertBooking.reschedulePreferences ?? null
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getAllBookingsWithRelations(): Promise<BookingWithRelations[]> {
    // For in-memory storage, return bookings with empty relations (mainly for testing)
    const bookings = await this.getAllBookings();
    return bookings.map(booking => ({
      ...booking,
      apparatus: [],
      focusAreas: [],
      sideQuests: [],
      athletes: [],
      parent: undefined,
      lessonType: undefined,
      waiver: undefined,
    })) as BookingWithRelations[];
  }

  async getUpcomingSessions(): Promise<{
    id: number;
    sessionDate: string;
    sessionTime: string;
    lessonType: string;
    parentName: string;
    athleteNames: string[];
    athletes: { id: number; firstName: string; lastName: string }[];
    focusAreas: string[];
    paymentStatus: string;
    attendanceStatus: string;
  }[]> {
    // For in-memory storage, return empty array (this is mainly for testing)
    return [];
  }

  async updateBooking(id: number, data: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (booking) {
      Object.assign(booking, data);
      this.bookings.set(id, booking);
      return booking;
    }
    return undefined;
  }

  async updateBookingStatus(id: number, status: BookingStatusEnum): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (booking) {
      booking.status = status;
      this.bookings.set(id, booking);
      return booking;
    }
    return undefined;
  }

  async updateBookingPaymentStatus(id: number, paymentStatus: PaymentStatusEnum): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (booking) {
      booking.paymentStatus = paymentStatus;
      this.bookings.set(id, booking);
      return booking;
    }
    return undefined;
  }

  async updateBookingAttendanceStatus(id: number, attendanceStatus: AttendanceStatusEnum): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (booking) {
      booking.attendanceStatus = attendanceStatus;
      // Auto-upgrade payment status to session-paid when attendance is completed
      if (attendanceStatus === AttendanceStatusEnum.COMPLETED) {
        const isRefunded = (booking.paymentStatus as any)?.toString().includes('refunded');
        if (!isRefunded && booking.paymentStatus !== PaymentStatusEnum.SESSION_PAID) {
          booking.paymentStatus = PaymentStatusEnum.SESSION_PAID;
        }
      }
      this.bookings.set(id, booking);
      return booking;
    }
    return undefined;
  }

  // Atomically mark the session confirmation email as sent, only if not already sent
  async markSessionConfirmationEmailSent(bookingId: number, sentAt: string): Promise<boolean> {
    // In-memory implementation
    const booking = this.bookings.get(bookingId);
    if (!booking) return false;
    if (booking.sessionConfirmationEmailSent) return false;
    booking.sessionConfirmationEmailSent = true as any;
    booking.sessionConfirmationEmailSentAt = new Date(sentAt) as any;
    booking.updatedAt = new Date();
    this.bookings.set(bookingId, booking);
    return true;
  }

  async deleteBooking(id: number): Promise<boolean> {
    return this.bookings.delete(id);
  }

  // Payment Logs
  async createPaymentLog(log: { bookingId: number | null; stripeEvent: string | null; errorMessage: string | null }): Promise<void> {
    // In-memory storage doesn't persist payment logs
    console.log('Payment log:', log);
  }

  // Blog Posts
  async getAllBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).sort((a, b) => 
      b.publishedAt.getTime() - a.publishedAt.getTime()
    );
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = this.currentBlogPostId++;
    const post: BlogPost = { 
      ...insertPost, 
      id,
      publishedAt: new Date(),
  imageUrl: insertPost.imageUrl ?? null,
  sections: (insertPost as any).sections ?? []
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async updateBlogPost(id: number, insertPost: InsertBlogPost): Promise<BlogPost | undefined> {
    const existingPost = this.blogPosts.get(id);
    if (!existingPost) {
      return undefined;
    }
    const updatedPost: BlogPost = {
      ...existingPost,
      ...insertPost,
      id,
  imageUrl: insertPost.imageUrl ?? null,
  sections: (insertPost as any).sections ?? existingPost.sections ?? []
    };
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  // Tips
  async getAllTips(): Promise<Tip[]> {
    return Array.from(this.tips.values()).sort((a, b) => 
      b.publishedAt.getTime() - a.publishedAt.getTime()
    );
  }

  async getTip(id: number): Promise<Tip | undefined> {
    return this.tips.get(id);
  }

  async createTip(insertTip: InsertTip): Promise<Tip> {
    const id = this.currentTipId++;
    const tip: Tip = { 
      ...insertTip, 
      id,
      publishedAt: new Date(),
      videoUrl: insertTip.videoUrl ?? null,
      sections: insertTip.sections ?? null
    };
    this.tips.set(id, tip);
    return tip;
  }

  async updateTip(id: number, insertTip: InsertTip): Promise<Tip | undefined> {
    const existingTip = this.tips.get(id);
    if (!existingTip) {
      return undefined;
    }
    const updatedTip: Tip = {
      ...existingTip,
      ...insertTip,
      id,
      videoUrl: insertTip.videoUrl ?? null,
      sections: insertTip.sections ?? null
    };
    this.tips.set(id, updatedTip);
    return updatedTip;
  }

  async deleteTip(id: number): Promise<boolean> {
    return this.tips.delete(id);
  }

  // Availability
  async getAllAvailability(): Promise<Availability[]> {
    return Array.from(this.availability.values()).sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  async getAvailability(id: number): Promise<Availability | undefined> {
    return this.availability.get(id);
  }

  async createAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    const id = this.currentAvailabilityId++;
    const availability: Availability = { 
      ...insertAvailability, 
      id,
      createdAt: new Date(),
      isRecurring: insertAvailability.isRecurring ?? true,
      isAvailable: insertAvailability.isAvailable ?? true
    };
    this.availability.set(id, availability);
    return availability;
  }

  async updateAvailability(id: number, insertAvailability: InsertAvailability): Promise<Availability | undefined> {
    const existing = this.availability.get(id);
    if (!existing) return undefined;

    const updated: Availability = {
      ...existing,
      ...insertAvailability,
      id
    };
    this.availability.set(id, updated);
    return updated;
  }

  async deleteAvailability(id: number): Promise<boolean> {
    return this.availability.delete(id);
  }

  // Availability Exceptions
  async getAllAvailabilityExceptions(): Promise<AvailabilityException[]> {
    return Array.from(this.availabilityExceptions.values()).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      // Handle null startTime values for all-day events
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return -1; // All-day events come first
      if (!b.startTime) return 1;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  async getAvailabilityException(id: number): Promise<AvailabilityException | undefined> {
    return this.availabilityExceptions.get(id);
  }

  async createAvailabilityException(insertException: InsertAvailabilityException): Promise<AvailabilityException> {
    const id = this.currentAvailabilityExceptionId++;
    const exception: AvailabilityException = { 
      ...insertException, 
      id,
      createdAt: new Date(),
      // Date is already a string from the schema
      date: insertException.date,
      reason: insertException.reason ?? null,
      isAvailable: insertException.isAvailable ?? false,
      // Convert undefined to null for all new fields
      title: insertException.title ?? null,
      category: insertException.category ?? null,
      notes: insertException.notes ?? null,
      allDay: insertException.allDay ?? false,
      addressLine1: insertException.addressLine1 ?? null,
      addressLine2: insertException.addressLine2 ?? null,
      city: insertException.city ?? null,
      state: insertException.state ?? null,
      zipCode: insertException.zipCode ?? null,
      country: insertException.country ?? null,
      startTime: insertException.startTime ?? null,
      endTime: insertException.endTime ?? null,
    };
    this.availabilityExceptions.set(id, exception);
    return exception;
  }

  async updateAvailabilityException(id: number, insertException: InsertAvailabilityException): Promise<AvailabilityException | undefined> {
    const existing = this.availabilityExceptions.get(id);
    if (!existing) return undefined;

    const updated: AvailabilityException = {
      ...existing,
      ...insertException,
      id,
      // Date is already a string from the schema
      date: insertException.date,
      reason: insertException.reason ?? null,
      // Convert undefined to null for all new fields
      title: insertException.title ?? null,
      category: insertException.category ?? null,
      notes: insertException.notes ?? null,
      allDay: insertException.allDay ?? false,
      addressLine1: insertException.addressLine1 ?? null,
      addressLine2: insertException.addressLine2 ?? null,
      city: insertException.city ?? null,
      state: insertException.state ?? null,
      zipCode: insertException.zipCode ?? null,
      country: insertException.country ?? null,
      startTime: insertException.startTime ?? null,
      endTime: insertException.endTime ?? null,
    };
    this.availabilityExceptions.set(id, updated);
    return updated;
  }

  async deleteAvailabilityException(id: number): Promise<boolean> {
    return this.availabilityExceptions.delete(id);
  }

  async getAvailabilityExceptionsByDateRange(startDate: string, endDate: string): Promise<AvailabilityException[]> {
    // Get blocking events from our events map
    const blockingEvents = Array.from(this.eventsMap.values())
      .filter(event => event.isAvailabilityBlock && !event.isDeleted);
    
    const availabilityBlocks: AvailabilityException[] = [];
    
    for (const event of blockingEvents) {
      if (event.recurrenceRule) {
        // Expand recurring series for the date range
        const { expandSeriesForRange } = await import('./recurrence');
        const instances = expandSeriesForRange([event], startDate, endDate);
        
        for (const instance of instances) {
          availabilityBlocks.push(this.mapEventToAvailabilityException(instance, event));
        }
      } else {
        // Single event - check if it falls in the date range
        const eventDate = event.startAt.toISOString().split('T')[0];
        if (eventDate >= startDate && eventDate <= endDate) {
          availabilityBlocks.push(this.mapEventToAvailabilityException(event, event));
        }
      }
    }
    
    return availabilityBlocks.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return -1;
      if (!b.startTime) return 1;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  private mapEventToAvailabilityException(eventInstance: Event, sourceEvent: Event): AvailabilityException {
    const date = eventInstance.startAt.toISOString().split('T')[0];
    const startTime = eventInstance.isAllDay ? null : 
      String(eventInstance.startAt.getUTCHours()).padStart(2, '0') + ':' + 
      String(eventInstance.startAt.getUTCMinutes()).padStart(2, '0');
    const endTime = eventInstance.isAllDay ? null :
      String(eventInstance.endAt.getUTCHours()).padStart(2, '0') + ':' + 
      String(eventInstance.endAt.getUTCMinutes()).padStart(2, '0');

    return {
      id: parseInt(eventInstance.id.replace(/-/g, ''), 16) % 2147483647,
      date,
      startTime,
      endTime,
      isAvailable: !sourceEvent.isAvailabilityBlock, // If event blocks availability, slot is NOT available
      reason: sourceEvent.blockingReason || sourceEvent.title || 'Blocked',
      createdAt: sourceEvent.createdAt,
      title: sourceEvent.title,
      category: null,
      notes: sourceEvent.notes,
      allDay: eventInstance.isAllDay,
      addressLine1: null,
      addressLine2: null,
      city: null,
      state: null,
      zipCode: null,
      country: null,
    };
  }

  // Admin methods
  async getAllAdmins(): Promise<Admin[]> {
    return [];
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    return undefined;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    throw new Error("Admin creation not implemented in MemStorage");
  }

  async getAdmin(id: number): Promise<Admin | undefined> {
    return undefined;
  }

  // Waiver methods - Not implemented in MemStorage
  async createWaiver(waiver: InsertWaiver): Promise<Waiver> {
    throw new Error("Waiver creation not implemented in MemStorage");
  }

  async getWaiver(id: number): Promise<Waiver | undefined> {
    return undefined;
  }

  async getWaiverByAthleteId(athleteId: number): Promise<Waiver | undefined> {
    return undefined;
  }

  async getWaiverByBookingId(bookingId: number): Promise<Waiver | undefined> {
    return undefined;
  }

// ...existing code...
  async updateWaiver(id: number, waiver: Partial<InsertWaiver>): Promise<Waiver | undefined> {
    return undefined;
  }

  async updateWaiverPdfPath(id: number, pdfPath: string): Promise<Waiver | undefined> {
    return undefined;
  }

  async updateWaiverEmailSent(id: number): Promise<Waiver | undefined> {
    return undefined;
  }

  // Archived waiver methods - Not implemented in MemStorage
  async getAllArchivedWaivers(): Promise<ArchivedWaiver[]> {
    return [];
  }

  async createArchivedWaiver(waiver: InsertArchivedWaiver): Promise<ArchivedWaiver> {
    throw new Error("Archived waiver creation not implemented in MemStorage");
  }

  async deleteArchivedWaiver(id: number): Promise<boolean> {
    return false; // Not implemented in MemStorage
  }

  async archiveWaiver(waiverId: number, reason: string): Promise<ArchivedWaiver | undefined> {
    return undefined;
  }

  // Parent auth methods - Not implemented in MemStorage
  async getParentById(id: number): Promise<Parent | undefined> {
    return undefined;
  }

  async getParent(id: number): Promise<Parent | undefined> {
    return this.getParentById(id);
  }

  async createParentAuthCode(authCode: InsertParentAuthCode): Promise<ParentAuthCode> {
    throw new Error("Parent auth code creation not implemented in MemStorage");
  }

  async getParentAuthCode(email: string, code: string): Promise<ParentAuthCode | undefined> {
    return undefined;
  }

  async deleteParentAuthCode(email: string): Promise<boolean> {
    return true; // Not implemented in MemStorage
  }

  async markAuthCodeAsUsed(id: number): Promise<void> {
    // Not implemented
  }

  async cleanupExpiredAuthCodes(): Promise<void> {
    // Not implemented
  }
  
  // Password reset token methods - Not implemented in MemStorage
  async createPasswordResetToken(token: { parentId: number; token: string; expiresAt: Date }): Promise<any> {
    throw new Error("Password reset token creation not implemented in MemStorage");
  }
  
  async getPasswordResetToken(token: string): Promise<any> {
    return undefined;
  }
  
  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    // Not implemented
  }
  
  async deletePasswordResetToken(token: string): Promise<void> {
    // Not implemented
  }
  
  async deletePasswordResetTokensByParentId(parentId: number): Promise<void> {
    // Not implemented
  }

  // Slot reservation methods - Not implemented in MemStorage
  async getActiveReservations(date: string): Promise<{ startTime: string; lessonType: string }[]> {
    return [];
  }

  async reserveSlot(date: string, startTime: string, lessonType: string, sessionId: string): Promise<boolean> {
    return false;
  }

  async releaseSlot(date: string, startTime: string): Promise<boolean> {
    return false;
  }

  async cleanupExpiredReservations(): Promise<void> {
    // Not implemented
  }

  // Missing methods that need to be implemented
  async getAllApparatus(): Promise<Apparatus[]> {
    return Array.from(this.apparatus.values());
  }

  async createApparatus(apparatus: InsertApparatus): Promise<Apparatus> {
    const id = this.currentApparatusId++;
    const newApparatus: Apparatus = {
      ...apparatus,
      id,
      createdAt: new Date(),
      sortOrder: apparatus.sortOrder || 0
    };
    this.apparatus.set(id, newApparatus);
    return newApparatus;
  }

  async updateApparatus(id: number, apparatus: Partial<InsertApparatus>): Promise<Apparatus | undefined> {
    const existing = this.apparatus.get(id);
    if (!existing) return undefined;
    
    const updated: Apparatus = {
      ...existing,
      ...apparatus,
      id
    };
    this.apparatus.set(id, updated);
    return updated;
  }

  async deleteApparatus(id: number): Promise<boolean> {
    return this.apparatus.delete(id);
  }

  async getAllFocusAreas(): Promise<FocusArea[]> {
    return Array.from(this.focusAreas.values());
  }

  async getFocusAreasByApparatus(apparatusId: number): Promise<FocusArea[]> {
    return Array.from(this.focusAreas.values()).filter(fa => (fa as any).apparatusId === apparatusId);
  }
  
  async getFocusAreasByLevel(level: string): Promise<FocusArea[]> {
    const allFocusAreas = Array.from(this.focusAreas.values());
    
    if (level === 'beginner') {
      return allFocusAreas.filter(fa => fa.level === 'beginner');
    } else if (level === 'intermediate') {
      return allFocusAreas.filter(fa => ['beginner', 'intermediate'].includes(fa.level || 'intermediate'));
    } else {
      // For advanced, return all levels
      return allFocusAreas;
    }
  }

  async createFocusArea(focusArea: InsertFocusArea): Promise<FocusArea> {
    const id = this.currentFocusAreaId++;
    const newFocusArea: FocusArea = {
      ...focusArea,
      id,
      createdAt: new Date(),
      sortOrder: focusArea.sortOrder || 0,
      apparatusId: focusArea.apparatusId || null,
      level: focusArea.level || 'intermediate'
    };
    this.focusAreas.set(id, newFocusArea);
    return newFocusArea;
  }

  async updateFocusArea(id: number, focusArea: Partial<InsertFocusArea>): Promise<FocusArea | undefined> {
    const existing = this.focusAreas.get(id);
    if (!existing) return undefined;
    
    const updated: FocusArea = {
      ...existing,
      ...focusArea,
      id
    };
    this.focusAreas.set(id, updated);
    return updated;
  }

  async deleteFocusArea(id: number): Promise<boolean> {
    return this.focusAreas.delete(id);
  }

  async getAllSideQuests(): Promise<SideQuest[]> {
    return Array.from(this.sideQuests.values());
  }

  async createSideQuest(sideQuest: InsertSideQuest): Promise<SideQuest> {
    const id = this.currentSideQuestId++;
    const newSideQuest: SideQuest = {
      ...sideQuest,
      id,
      createdAt: new Date(),
      sortOrder: sideQuest.sortOrder || 0
    };
    this.sideQuests.set(id, newSideQuest);
    return newSideQuest;
  }

  async updateSideQuest(id: number, sideQuest: Partial<InsertSideQuest>): Promise<SideQuest | undefined> {
    const existing = this.sideQuests.get(id);
    if (!existing) return undefined;
    
    const updated: SideQuest = {
      ...existing,
      ...sideQuest,
      id
    };
    this.sideQuests.set(id, updated);
    return updated;
  }

  async deleteSideQuest(id: number): Promise<boolean> {
    return this.sideQuests.delete(id);
  }

  // Enhanced booking methods with normalized relationships - stub implementations
  async getBookingWithRelations(id: number): Promise<BookingWithRelations | undefined> {
    const booking = await this.getBooking(id);
    if (!booking) return undefined;
    
    return {
      ...booking,
      apparatus: [],
      focusAreas: [],
      sideQuests: []
    } as BookingWithRelations;
  }

  // getAllBookingsWithRelations implementation moved to the normalized section below

  async createBookingWithRelations(
    booking: InsertBooking,
    apparatusIds: number[],
    focusAreaIds: number[],
    sideQuestIds: number[]
  ): Promise<BookingWithRelations> {
    const createdBooking = await this.createBooking(booking);
    return {
      ...createdBooking,
      apparatus: [],
      focusAreas: [],
      sideQuests: []
    } as BookingWithRelations;
  }

  async updateBookingRelations(
    bookingId: number,
    apparatusIds: number[],
    focusAreaIds: number[],
    sideQuestIds: number[]
  ): Promise<BookingWithRelations | undefined> {
    const booking = await this.getBooking(bookingId);
    if (!booking) return undefined;
    
    return {
      ...booking,
      apparatus: [],
      focusAreas: [],
      sideQuests: []
    } as BookingWithRelations;
  }

  // Email verification methods - Not implemented in MemStorage
  async createVerificationToken(token: { parentId: number; token: string; expiresAt: Date }): Promise<any> {
    throw new Error("Verification token creation not implemented in MemStorage");
  }

  async getVerificationToken(token: string): Promise<any> {
    return undefined;
  }

  async markParentAsVerified(parentId: number): Promise<void> {
    // Not implemented
  }

  async deleteVerificationToken(token: string): Promise<void> {
    // Not implemented
  }

  async deleteVerificationTokensByParentId(parentId: number): Promise<void> {
    // Not implemented
  }

  // Blog Email Subscriptions (MemStorage - not implemented)
  async updateParentBlogEmailOptIn(parentId: number, optIn: boolean): Promise<Parent | undefined> {
    // Not implemented in MemStorage
    return undefined;
  }

  async createBlogEmailSignup(email: string): Promise<BlogEmailSignup> {
    // Not implemented in MemStorage
    throw new Error("MemStorage does not support blog email signups");
  }

  async getAllBlogEmailSignups(): Promise<BlogEmailSignup[]> {
    // Not implemented in MemStorage
    return [];
  }

  async getAllParentsWithBlogOptIn(): Promise<Parent[]> {
    // Not implemented in MemStorage
    return [];
  }

  async getAllBlogEmailAddresses(): Promise<string[]> {
    // Not implemented in MemStorage
    return [];
  }

  // Site Content Management Methods (stubs for MemStorage)
  async getSiteContent(): Promise<any> {
    return {
      bannerVideo: '',
      heroImages: [],
      about: {
        bio: 'Coach Will brings nearly 10 years of passionate gymnastics instruction to every lesson.',
        experience: 'Nearly 10 years of coaching experience with athletes of all levels',
        certifications: [
          { title: 'USA Gymnastics Certified', body: 'Official certification from USA Gymnastics' },
          { title: 'CPR/First Aid Certified', body: 'Current safety and emergency response training' },
          { title: 'Background Checked', body: 'Comprehensive background verification completed' }
        ]
      },
      contact: {
        phone: '(585) 755-8122',
        email: 'Admin@coachwilltumbles.com',
        address: {
          name: 'Oceanside Gymnastics',
          street: '1935 Ave. del Oro #A',
          city: 'Oceanside',
          state: 'CA',
          zip: '92056'
        }
      },
      hours: {
        monday: { available: true, start: '9:00 AM', end: '4:00 PM' },
        tuesday: { available: true, start: '9:00 AM', end: '3:30 PM' },
        wednesday: { available: true, start: '9:00 AM', end: '4:00 PM' },
        thursday: { available: true, start: '9:00 AM', end: '3:30 PM' },
        friday: { available: true, start: '9:00 AM', end: '4:00 PM' },
        saturday: { available: true, start: '10:00 AM', end: '2:00 PM' },
        sunday: { available: false, start: '', end: '' }
      },
      testimonials: [],
      faqs: []
    };
  }

  async updateSiteContent(content: any): Promise<any> {
    // Not implemented in MemStorage
    return content;
  }

  async getAllTestimonials(): Promise<any[]> {
    // Not implemented in MemStorage
    return [];
  }

  async createTestimonial(testimonial: any): Promise<any> {
    // Not implemented in MemStorage
    return { id: 1, ...testimonial };
  }

  async updateTestimonial(id: number, testimonial: any): Promise<any> {
    // Not implemented in MemStorage
    return { id, ...testimonial };
  }

  async deleteTestimonial(id: number): Promise<boolean> {
    // Not implemented in MemStorage
    return true;
  }

  async setFeaturedTestimonial(id: number): Promise<any> {
    // Not implemented in MemStorage
    return { id, featured: true };
  }

  async getAllSiteFaqs(): Promise<any[]> {
    // Not implemented in MemStorage
    return [];
  }

  async createSiteFaq(faq: any): Promise<any> {
    // Not implemented in MemStorage
    return { id: 1, ...faq };
  }

  async updateSiteFaq(id: number, faq: any): Promise<any> {
    // Not implemented in MemStorage
    return { id, ...faq };
  }

  async deleteSiteFaq(id: number): Promise<boolean> {
    // Not implemented in MemStorage
    return true;
  }

  async bulkUpsertSiteFaqs(faqs: any[]): Promise<any[]> {
    // Not implemented in MemStorage
    return faqs.map(faq => ({ id: Math.random(), ...faq }));
  }

  // Events (recurrence series) - MemStorage implementation
  async listEventsByRange(_startIso: string, _endIso: string): Promise<Event[]> {
    return Array.from(this.eventsMap.values()).filter((e): e is Event => !!e && !e.isDeleted);
  }

  async createEvent(input: InsertEvent): Promise<Event> {
    const id = (input.id as string) || (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    const seriesId = (input.seriesId as string) || id;
    const now = new Date().toISOString();
    const ev: Event = {
      id,
      seriesId,
      parentEventId: (input.parentEventId as any) ?? null,
      title: input.title ?? "",
      notes: (input as any).notes ?? null,
      location: (input as any).location ?? null,
      isAllDay: input.isAllDay ?? false,
      timezone: input.timezone ?? 'America/Los_Angeles',
      startAt: (input.startAt as any) ?? (now as any),
      endAt: (input.endAt as any) ?? (now as any),
      recurrenceRule: (input as any).recurrenceRule ?? null,
      recurrenceEndAt: (input as any).recurrenceEndAt ?? null,
      recurrenceExceptions: (input as any).recurrenceExceptions ?? [],
      isAvailabilityBlock: (input as any).isAvailabilityBlock ?? false,
      blockingReason: (input as any).blockingReason ?? null,
      category: (input as any).category ?? null,
      addressLine1: (input as any).addressLine1 ?? null,
      addressLine2: (input as any).addressLine2 ?? null,
      city: (input as any).city ?? null,
      state: (input as any).state ?? null,
      zipCode: (input as any).zipCode ?? null,
      country: (input as any).country ?? null,
      createdBy: (input as any).createdBy ?? null,
      updatedBy: (input as any).updatedBy ?? null,
      isDeleted: false,
      createdAt: (input as any).createdAt ?? (now as any),
      updatedAt: (input as any).updatedAt ?? (now as any),
    };
    this.eventsMap.set(id, ev);
    return ev;
  }

  async updateEvent(id: string, input: Partial<InsertEvent>): Promise<Event | undefined> {
    const existing = this.eventsMap.get(id);
    if (!existing) return undefined;
    const updated: Event = {
      ...existing,
      ...(input as any),
      id: existing.id,
      seriesId: (input.seriesId as any) ?? existing.seriesId,
      updatedAt: new Date().toISOString() as any,
    };
    this.eventsMap.set(id, updated);
    return updated;
  }

  async deleteEvent(id: string): Promise<boolean> {
    // Legacy method - defaults to "all" mode for backward compatibility
    return this.deleteEventWithMode(id, 'all');
  }

  async deleteEventWithMode(id: string, mode: 'this' | 'future' | 'all', instanceDate?: string): Promise<boolean> {
    // Extract base UUID from composite ID (for recurring event instances)
    // Format: "uuid:timestamp" -> "uuid"
    const baseId = id.includes(':') ? id.split(':')[0] : id;
    
    const existing = this.eventsMap.get(baseId);
    if (!existing) return false;

    console.log(`🗑️ [MEMSTORAGE] Delete mode: ${mode}, baseId: ${baseId}, instanceDate: ${instanceDate}`);

    if (mode === 'all') {
      // Delete entire series: soft delete master + all overrides
      existing.isDeleted = true;
      existing.updatedAt = new Date().toISOString() as any;
      this.eventsMap.set(baseId, existing);
      
      // Also soft delete any overrides for this series
      for (const [key, event] of Array.from(this.eventsMap.entries())) {
        if (event.seriesId === existing.seriesId && event.parentEventId) {
          event.isDeleted = true;
          event.updatedAt = new Date().toISOString() as any;
          this.eventsMap.set(key, event);
        }
      }
      
    } else if (mode === 'future' && instanceDate) {
      // Delete this and future: set recurrence end date before this instance
      const endDate = new Date(instanceDate);
      endDate.setSeconds(endDate.getSeconds() - 1); // 1 second before instance
      
      existing.recurrenceEndAt = endDate.toISOString() as any;
      existing.updatedAt = new Date().toISOString() as any;
      this.eventsMap.set(baseId, existing);
      
      // Delete any overrides at or after this date
      for (const [key, event] of Array.from(this.eventsMap.entries())) {
        if (event.seriesId === existing.seriesId && event.parentEventId) {
          const eventDate = new Date(event.startAt as unknown as string);
          if (eventDate >= new Date(instanceDate)) {
            event.isDeleted = true;
            event.updatedAt = new Date().toISOString() as any;
            this.eventsMap.set(key, event);
          }
        }
      }
      
    } else if (mode === 'this' && instanceDate) {
      // Normalize truncated instanceDate variants before storing
      if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}$/.test(instanceDate)) {
        instanceDate = instanceDate + ':00:00.000Z';
      } else if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(instanceDate)) {
        instanceDate = instanceDate + ':00.000Z';
      } else if (/Z$/.test(instanceDate) === false && /^[0-9]{4}-/.test(instanceDate) && instanceDate.length === 19) {
        instanceDate = instanceDate + '.000Z';
      }
      // Delete only this instance: add to recurrence exceptions
      const exceptions = Array.isArray(existing.recurrenceExceptions) 
        ? [...existing.recurrenceExceptions] 
        : [];
      
      if (!exceptions.includes(instanceDate)) {
        exceptions.push(instanceDate);
        existing.recurrenceExceptions = exceptions as any;
        existing.updatedAt = new Date().toISOString() as any;
        this.eventsMap.set(baseId, existing);
      }
      
      // If there's an override for this specific instance, delete it
      for (const [key, event] of Array.from(this.eventsMap.entries())) {
        if (event.seriesId === existing.seriesId && event.parentEventId) {
          const eventDate = new Date(event.startAt as unknown as string);
          const targetDate = new Date(instanceDate);
          if (Math.abs(eventDate.getTime() - targetDate.getTime()) < 60000) { // Within 1 minute
            event.isDeleted = true;
            event.updatedAt = new Date().toISOString() as any;
            this.eventsMap.set(key, event);
          }
        }
      }
    }
    
    return true;
  }

  // Site Inquiries (MemStorage stubs)
  async listSiteInquiries(): Promise<SiteInquiry[]> { return []; }
  async createSiteInquiry(input: InsertSiteInquiry): Promise<SiteInquiry> {
    return { id: Date.now(), ...input, createdAt: new Date(), updatedAt: new Date() } as any;
  }
  async updateSiteInquiryStatus(id: number, status: SiteInquiry['status']): Promise<SiteInquiry | undefined> { return undefined; }
  async deleteSiteInquiry(id: number): Promise<boolean> { return false; }

  // Privacy Requests (MemStorage stubs)
  async listPrivacyRequests(): Promise<PrivacyRequest[]> { return []; }
  async createPrivacyRequest(input: InsertPrivacyRequest): Promise<PrivacyRequest> {
    return { id: Date.now(), ...input, createdAt: new Date(), updatedAt: new Date() } as any;
  }
  async updatePrivacyRequestStatus(id: number, status: PrivacyRequest['status']): Promise<PrivacyRequest | undefined> { return undefined; }

  // Cookie Consent (MemStorage stubs)
  async createCookieConsentLog(input: InsertCookieConsent): Promise<CookieConsent> {
    return { id: Date.now(), ...input, createdAt: new Date() } as any;
  }

  // Activity Logs (MemStorage stubs)
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    return { id: Date.now(), ...log, createdAt: new Date() } as any;
  }
  async getActivityLog(id: number): Promise<ActivityLog | undefined> { return undefined; }
  async getAllActivityLogs(options?: any): Promise<{ logs: ActivityLog[]; total: number }> {
    return { logs: [], total: 0 };
  }
  async getActivityLogsByTarget(targetType: ActivityTargetType, targetId: number, limit?: number): Promise<ActivityLog[]> {
    return [];
  }
  async markActivityReversed(id: number, reversedBy?: number, reverseActionId?: number): Promise<boolean> {
    return false;
  }
  async deleteActivityLog(id: number): Promise<boolean> { return false; }

  // Skills (MemStorage stubs)
  async listSkills(): Promise<Skill[]> { return []; }
  async createSkill(input: InsertSkill): Promise<Skill> { return { id: Date.now(), ...input } as any; }
  async updateSkill(id: number, input: Partial<InsertSkill>): Promise<Skill | undefined> { return undefined; }
  async deleteSkill(id: number): Promise<boolean> { return false; }
  async getSkillRelations(_skillId: number): Promise<{ prerequisiteIds: number[]; componentIds: number[] }> { return { prerequisiteIds: [], componentIds: [] }; }
  async setSkillRelations(skillId: number, prereqIds: number[], componentIds: number[]): Promise<{ prerequisiteIds: number[]; componentIds: number[] }> {
    const uniq = (arr: number[]) => Array.from(new Set(arr.filter((n) => Number.isFinite(n) && n !== skillId)));
    return { prerequisiteIds: uniq(prereqIds), componentIds: uniq(componentIds) };
  }
  async getAthleteSkills(athleteId: number): Promise<Array<AthleteSkill & { skill?: Skill | null }>> { return []; }
  async upsertAthleteSkill(input: InsertAthleteSkill): Promise<AthleteSkill> { return { id: Date.now(), ...input } as any; }
  async addAthleteSkillVideo(input: InsertAthleteSkillVideo): Promise<AthleteSkillVideo> { return { id: Date.now(), ...input } as any; }
  async listAthleteSkillVideos(athleteSkillId: number): Promise<AthleteSkillVideo[]> { return []; }
  async deleteAthleteSkillVideo(id: number): Promise<boolean> { return false; }
  async createProgressShareLink(input: InsertProgressShareLink): Promise<ProgressShareLink> { return { id: Date.now(), ...input } as any; }
  async getProgressByToken(token: string): Promise<{ athlete: Athlete | null; skills: { athleteSkill: AthleteSkill; skill?: Skill | null; videos: AthleteSkillVideo[]; }[]; link: ProgressShareLink | null; } | null> { return null; }
  
  async uploadMedia(file: Buffer, fileName: string, contentType: string): Promise<string> {
    // MemStorage stub - return a mock URL
    return `https://mock-storage.com/${fileName}`;
  }
}

// Supabase Storage Implementation
export class SupabaseStorage implements IStorage {
  // Archive all bookings for a parent
  async archiveBookingsByParentId(parentId: number, reason: string): Promise<void> {
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('parent_id', parentId);
    if (error) {
      console.error('Error fetching bookings for archiving:', error);
      return;
    }
    if (!bookings) return;
    for (const booking of bookings) {
      await supabaseServiceRole.from('archived_bookings').insert({
        ...booking,
        original_booking_id: booking.id,
        archived_at: new Date().toISOString(),
        archive_reason: reason
      });
    }
  }

  // Archive all bookings for an athlete
  async archiveBookingsByAthleteId(athleteId: number, reason: string): Promise<void> {
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('athlete_id', athleteId);
    if (error) {
      console.error('Error fetching bookings for archiving:', error);
      return;
    }
    if (!bookings) return;
    for (const booking of bookings) {
      await supabaseServiceRole.from('archived_bookings').insert({
        ...booking,
        original_booking_id: booking.id,
        archived_at: new Date().toISOString(),
        archive_reason: reason
      });
    }
  }

  // Fetch all archived bookings
  async getAllArchivedBookings(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('archived_bookings')
      .select('*')
      .order('archived_at', { ascending: false });
    if (error) {
      console.error('Error fetching archived bookings:', error);
      return [];
    }
    return data || [];
  }

  // ===============================
  // Site Inquiries
  // ===============================
  async listSiteInquiries(): Promise<SiteInquiry[]> {
    const { data, error } = await supabaseAdmin
      .from('site_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[STORAGE][SITE-INQUIRIES] list error:', error);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      athleteInfo: row.athlete_info,
      message: row.message,
      status: row.status,
      source: row.source,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async createSiteInquiry(input: InsertSiteInquiry): Promise<SiteInquiry> {
    const insert = {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      athlete_info: input.athleteInfo ?? null,
      message: input.message,
      status: input.status ?? 'new',
      source: input.source ?? 'contact',
    } as any;
    const { data, error } = await supabaseAdmin
      .from('site_inquiries')
      .insert(insert)
      .select('*')
      .single();
    if (error) {
      console.error('[STORAGE][SITE-INQUIRIES] create error:', error);
      throw error;
    }
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      athleteInfo: data.athlete_info,
      message: data.message,
      status: data.status,
      source: data.source,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as SiteInquiry;
  }

  async updateSiteInquiryStatus(id: number, status: SiteInquiry['status']): Promise<SiteInquiry | undefined> {
    const { data, error } = await supabaseAdmin
      .from('site_inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      console.error('[STORAGE][SITE-INQUIRIES] update error:', error);
      return undefined;
    }
    return data ? {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      athleteInfo: data.athlete_info,
      message: data.message,
      status: data.status,
      source: data.source,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as SiteInquiry : undefined;
  }

  async deleteSiteInquiry(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('site_inquiries')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[STORAGE][SITE-INQUIRIES] delete error:', error);
      return false;
    }
    return true;
  }

  // ===============================
  // Privacy Requests
  // ===============================
  async listPrivacyRequests(): Promise<PrivacyRequest[]> {
    const { data, error } = await supabaseAdmin
      .from('privacy_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[STORAGE][PRIVACY-REQUESTS] list error:', error);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      requestType: row.request_type,
      details: row.details,
      status: row.status,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async createPrivacyRequest(input: InsertPrivacyRequest): Promise<PrivacyRequest> {
    const insert: any = {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      request_type: input.requestType,
      details: input.details ?? null,
      status: input.status ?? 'new',
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    };
    const { data, error } = await supabaseAdmin
      .from('privacy_requests')
      .insert(insert)
      .select('*')
      .single();
    if (error) {
      console.error('[STORAGE][PRIVACY-REQUESTS] create error:', error);
      throw error;
    }
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      requestType: data.request_type,
      details: data.details,
      status: data.status,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as PrivacyRequest;
  }

  async updatePrivacyRequestStatus(id: number, status: PrivacyRequest['status']): Promise<PrivacyRequest | undefined> {
    const { data, error } = await supabaseAdmin
      .from('privacy_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      console.error('[STORAGE][PRIVACY-REQUESTS] update error:', error);
      return undefined;
    }
    return data ? {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      requestType: data.request_type,
      details: data.details,
      status: data.status,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as PrivacyRequest : undefined;
  }

  // ===============================
  // Cookie Consent
  // ===============================
  async createCookieConsentLog(input: InsertCookieConsent): Promise<CookieConsent> {
    const insert: any = {
      user_id: input.userId ?? null,
      necessary: input.necessary ?? true,
      analytics: input.analytics ?? false,
      marketing: input.marketing ?? false,
      region: input.region ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    };
    const { data, error } = await supabaseAdmin
      .from('cookie_consent')
      .insert(insert)
      .select('*')
      .single();
    if (error) {
      console.error('[STORAGE][COOKIE-CONSENT] create error:', error);
      throw error;
    }
    return {
      id: data.id,
      userId: data.user_id,
      necessary: data.necessary,
      analytics: data.analytics,
      marketing: data.marketing,
      region: data.region,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      createdAt: data.created_at,
    } as CookieConsent;
  }

  // ===============================
  // Activity Logs
  // ===============================
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const insert: any = {
      actor_type: log.actorType,
      actor_id: log.actorId ?? null,
      actor_name: log.actorName,
      action_type: log.actionType,
      action_category: log.actionCategory,
      action_description: log.actionDescription,
      target_type: log.targetType,
      target_id: log.targetId ?? null,
      target_identifier: log.targetIdentifier,
      field_changed: log.fieldChanged ?? null,
      previous_value: log.previousValue ?? null,
      new_value: log.newValue ?? null,
      notes: log.notes ?? null,
      metadata: log.metadata ?? null,
      ip_address: log.ipAddress ?? null,
      user_agent: log.userAgent ?? null,
      batch_id: log.batchId ?? null,
      batch_description: log.batchDescription ?? null,
      is_deleted: log.isDeleted ?? false,
      is_reversed: log.isReversed ?? false,
      reversed_by: log.reversedBy ?? null,
      reverse_action_id: log.reverseActionId ?? null,
      original_action_id: log.originalActionId ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .insert(insert)
      .select('*')
      .single();

    if (error) {
      console.error('[STORAGE][ACTIVITY-LOGS] create error:', error);
      throw error;
    }

    return {
      id: data.id,
      actorType: data.actor_type,
      actorId: data.actor_id,
      actorName: data.actor_name,
      actionType: data.action_type,
      actionCategory: data.action_category,
      actionDescription: data.action_description,
      targetType: data.target_type,
      targetId: data.target_id,
      targetIdentifier: data.target_identifier,
      fieldChanged: data.field_changed,
      previousValue: data.previous_value,
      newValue: data.new_value,
      notes: data.notes,
      metadata: data.metadata,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      batchId: data.batch_id,
      batchDescription: data.batch_description,
      createdAt: data.created_at,
      isDeleted: data.is_deleted,
      deletedAt: data.deleted_at,
      deletedBy: data.deleted_by,
      isReversed: data.is_reversed,
      reversedAt: data.reversed_at,
      reversedBy: data.reversed_by,
      reverseActionId: data.reverse_action_id,
      originalActionId: data.original_action_id,
    } as ActivityLog;
  }

  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error) {
      console.error('[STORAGE][ACTIVITY-LOGS] get error:', error);
      return undefined;
    }

    if (!data) return undefined;

    return {
      id: data.id,
      actorType: data.actor_type,
      actorId: data.actor_id,
      actorName: data.actor_name,
      actionType: data.action_type,
      actionCategory: data.action_category,
      actionDescription: data.action_description,
      targetType: data.target_type,
      targetId: data.target_id,
      targetIdentifier: data.target_identifier,
      fieldChanged: data.field_changed,
      previousValue: data.previous_value,
      newValue: data.new_value,
      notes: data.notes,
      metadata: data.metadata,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      batchId: data.batch_id,
      batchDescription: data.batch_description,
      createdAt: data.created_at,
      isDeleted: data.is_deleted,
      deletedAt: data.deleted_at,
      deletedBy: data.deleted_by,
      isReversed: data.is_reversed,
      reversedAt: data.reversed_at,
      reversedBy: data.reversed_by,
      reverseActionId: data.reverse_action_id,
      originalActionId: data.original_action_id,
    } as ActivityLog;
  }

  async getAllActivityLogs(options?: {
    limit?: number;
    offset?: number;
    actorType?: ActivityActorType;
    actionCategory?: ActivityCategory;
    targetType?: ActivityTargetType;
    targetId?: number;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
  }): Promise<{ logs: ActivityLog[]; total: number }> {
    let query = supabaseAdmin.from('activity_logs').select('*', { count: 'exact' });
    
    // Apply filters
    query = query.eq('is_deleted', false);
    
    if (options?.actorType) {
      query = query.eq('actor_type', options.actorType);
    }
    
    if (options?.actionCategory) {
      query = query.eq('action_category', options.actionCategory);
    }
    
    if (options?.targetType) {
      query = query.eq('target_type', options.targetType);
    }
    
    if (options?.targetId) {
      query = query.eq('target_id', options.targetId);
    }
    
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }
    
    if (options?.searchTerm) {
      query = query.or(`action_description.ilike.%${options.searchTerm}%,target_identifier.ilike.%${options.searchTerm}%,actor_name.ilike.%${options.searchTerm}%`);
    }
    
    // Apply pagination
    query = query.order('created_at', { ascending: false });
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[STORAGE][ACTIVITY-LOGS] getAllActivityLogs error:', error);
      return { logs: [], total: 0 };
    }

    const logs = (data || []).map((row: any) => ({
      id: row.id,
      actorType: row.actor_type,
      actorId: row.actor_id,
      actorName: row.actor_name,
      actionType: row.action_type,
      actionCategory: row.action_category,
      actionDescription: row.action_description,
      targetType: row.target_type,
      targetId: row.target_id,
      targetIdentifier: row.target_identifier,
      fieldChanged: row.field_changed,
      previousValue: row.previous_value,
      newValue: row.new_value,
      notes: row.notes,
      metadata: row.metadata,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      batchId: row.batch_id,
      batchDescription: row.batch_description,
      createdAt: row.created_at,
      isDeleted: row.is_deleted,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
      isReversed: row.is_reversed,
      reversedAt: row.reversed_at,
      reversedBy: row.reversed_by,
      reverseActionId: row.reverse_action_id,
      originalActionId: row.original_action_id,
    })) as ActivityLog[];

    return { logs, total: count || 0 };
  }

  async getActivityLogsByTarget(targetType: ActivityTargetType, targetId: number, limit: number = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[STORAGE][ACTIVITY-LOGS] getActivityLogsByTarget error:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      actorType: row.actor_type,
      actorId: row.actor_id,
      actorName: row.actor_name,
      actionType: row.action_type,
      actionCategory: row.action_category,
      actionDescription: row.action_description,
      targetType: row.target_type,
      targetId: row.target_id,
      targetIdentifier: row.target_identifier,
      fieldChanged: row.field_changed,
      previousValue: row.previous_value,
      newValue: row.new_value,
      notes: row.notes,
      metadata: row.metadata,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      batchId: row.batch_id,
      batchDescription: row.batch_description,
      createdAt: row.created_at,
      isDeleted: row.is_deleted,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
      isReversed: row.is_reversed,
      reversedAt: row.reversed_at,
      reversedBy: row.reversed_by,
      reverseActionId: row.reverse_action_id,
      originalActionId: row.original_action_id,
    })) as ActivityLog[];
  }

  async markActivityReversed(id: number, reversedBy?: number, reverseActionId?: number): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('activity_logs')
      .update({
        is_reversed: true,
        reversed_at: new Date().toISOString(),
        reversed_by: reversedBy || null,
        reverse_action_id: reverseActionId || null,
      })
      .eq('id', id);

    if (error) {
      console.error('[STORAGE][ACTIVITY-LOGS] markActivityReversed error:', error);
      return false;
    }

    return true;
  }

  async deleteActivityLog(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('activity_logs')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[STORAGE][ACTIVITY-LOGS] deleteActivityLog error:', error);
      return false;
    }

    return true;
  }

  // ===============================
  // Skills master & athlete progress
  // ===============================
  async listSkills(filters?: { apparatusId?: number; level?: string }): Promise<Skill[]> {
    let query = supabaseAdmin.from('skills').select('*').order('display_order', { ascending: true });
    if (filters?.apparatusId) query = query.eq('apparatus_id', filters.apparatusId);
    if (filters?.level) query = query.eq('level', filters.level);
    const { data, error } = await query;
    if (error) {
      console.error('[STORAGE][SKILLS] list error:', error);
      return [];
    }
  return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      level: row.level,
      description: row.description,
      displayOrder: row.display_order,
      apparatusId: row.apparatus_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isConnectedCombo: row.is_connected_combo,
      referenceVideos: row.reference_videos || [],
      tenantId: row.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    }));
  }

  async createSkill(input: InsertSkill): Promise<Skill> {
  const insert: any = {
      name: input.name ?? null,
      category: input.category ?? null,
      level: input.level ?? null,
      description: input.description ?? null,
      display_order: (input as any).displayOrder ?? null,
      apparatus_id: input.apparatusId ?? null,
      reference_videos: (input as any).referenceVideos ?? [],
    };
    const { data, error } = await supabaseAdmin.from('skills').insert(insert).select('*').single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      level: data.level,
      description: data.description,
      displayOrder: data.display_order,
      apparatusId: data.apparatus_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isConnectedCombo: data.is_connected_combo,
      referenceVideos: data.reference_videos || [],
      tenantId: data.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    };
  }

  async updateSkill(id: number, input: Partial<InsertSkill>): Promise<Skill | undefined> {
    const patch: any = {};
    if ('name' in input) patch.name = (input as any).name;
    if ('category' in input) patch.category = (input as any).category;
    if ('level' in input) patch.level = (input as any).level;
    if ('description' in input) patch.description = (input as any).description;
  if ('displayOrder' in (input as any)) patch.display_order = (input as any).displayOrder;
    if ('apparatusId' in (input as any)) patch.apparatus_id = (input as any).apparatusId;
  if ('isConnectedCombo' in (input as any)) patch.is_connected_combo = (input as any).isConnectedCombo;
    if ('referenceVideos' in (input as any)) patch.reference_videos = (input as any).referenceVideos;
    if (Object.keys(patch).length === 0) return this.listSkills().then(r => r.find(s => s.id === id));
    let { data, error } = await supabaseAdmin.from('skills').update(patch).eq('id', id).select('*').single();
    if (error) {
      // If is_connected_combo column doesn't exist, retry without it
      if ((error as any)?.code === '42703' && 'is_connected_combo' in patch) {
        const { is_connected_combo, ...rest } = patch;
        const retry = await supabaseAdmin.from('skills').update(rest).eq('id', id).select('*').single();
        if (retry.error) {
          console.error('[STORAGE][SKILLS] update retry error:', retry.error);
          return undefined;
        }
        data = retry.data as any;
      } else {
        console.error('[STORAGE][SKILLS] update error:', error);
        return undefined;
      }
    }
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      level: data.level,
      description: data.description,
      displayOrder: data.display_order,
      apparatusId: data.apparatus_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isConnectedCombo: data.is_connected_combo,
      referenceVideos: data.reference_videos || [],
      tenantId: data.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    };
  }

  async deleteSkill(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('skills').delete().eq('id', id);
    if (error) {
      console.error('[STORAGE][SKILLS] delete error:', error);
      return false;
    }
    return true;
  }

  

  async getSkillRelations(skillId: number): Promise<{ prerequisiteIds: number[]; componentIds: number[] }> {
    // Fetch prerequisite skill IDs
    const preq = await supabaseAdmin
      .from('skills_prerequisites')
      .select('prerequisite_skill_id')
      .eq('skill_id', skillId);
    if (preq.error) {
      console.error('[STORAGE][SKILLS] getSkillRelations prerequisites error:', preq.error);
    }

    // Fetch component skill IDs ordered by position
    const comps = await supabaseAdmin
      .from('skill_components')
      .select('component_skill_id, position')
      .eq('parent_skill_id', skillId)
      .order('position', { ascending: true });
    if (comps.error) {
      console.error('[STORAGE][SKILLS] getSkillRelations components error:', comps.error);
    }

    const prerequisiteIds = (preq.data || []).map((r: any) => r.prerequisite_skill_id);
    const componentIds = (comps.data || [])
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
      .map((r: any) => r.component_skill_id);

    return { prerequisiteIds, componentIds };
  }

  async setSkillRelations(skillId: number, prereqIds: number[], componentIds: number[]): Promise<{ prerequisiteIds: number[]; componentIds: number[] }> {
    // Normalize inputs: remove duplicates and self-references
    const uniq = (arr: number[]) => Array.from(new Set(arr.filter((n) => Number.isFinite(n) && n !== skillId)));
    const pre = uniq(prereqIds);
    const comps = uniq(componentIds);

    // Replace prerequisites: delete then insert
    const delPre = await supabaseAdmin
      .from('skills_prerequisites')
      .delete()
      .eq('skill_id', skillId);
    if (delPre.error) {
      if ((delPre.error as any)?.code === '42P01') {
        // undefined_table
        throw new Error('Skills relations tables are missing. Please run scripts/db/add_skills_relations.sql in Supabase and try again.');
      }
      console.error('[STORAGE][SKILLS] setSkillRelations delete prerequisites error:', delPre.error);
      throw delPre.error;
    }
    if (pre.length > 0) {
      const insertPre = await supabaseAdmin
        .from('skills_prerequisites')
        .insert(pre.map((pid, idx) => ({ skill_id: skillId, prerequisite_skill_id: pid })));
      if (insertPre.error) {
        console.error('[STORAGE][SKILLS] setSkillRelations insert prerequisites error:', insertPre.error);
        throw insertPre.error;
      }
    }

    // Replace components: delete then insert with position
    const delComps = await supabaseAdmin
      .from('skill_components')
      .delete()
      .eq('parent_skill_id', skillId);
    if (delComps.error) {
      if ((delComps.error as any)?.code === '42P01') {
        // undefined_table
        throw new Error('Skills relations tables are missing. Please run scripts/db/add_skills_relations.sql in Supabase and try again.');
      }
      console.error('[STORAGE][SKILLS] setSkillRelations delete components error:', delComps.error);
      throw delComps.error;
    }
    if (comps.length > 0) {
      const insertComps = await supabaseAdmin
        .from('skill_components')
        .insert(comps.map((cid, idx) => ({ parent_skill_id: skillId, component_skill_id: cid, position: idx })));
      if (insertComps.error) {
        console.error('[STORAGE][SKILLS] setSkillRelations insert components error:', insertComps.error);
        throw insertComps.error;
      }
    }

    return { prerequisiteIds: pre, componentIds: comps };
  }

  async getAthleteSkills(athleteId: number): Promise<Array<AthleteSkill & { skill?: Skill | null }>> {
    const { data, error } = await supabaseAdmin
      .from('athlete_skills')
      .select('*, skills:skill_id ( id, name, category, level, description, display_order, apparatus_id, created_at, updated_at, reference_videos, is_connected_combo )')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('[STORAGE][ATHLETE-SKILLS] list error:', error);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      athleteId: row.athlete_id,
      skillId: row.skill_id,
      status: row.status,
      notes: row.notes,
      unlockDate: row.unlock_date,
      firstTestedAt: row.first_tested_at,
      lastTestedAt: row.last_tested_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      skill: row.skills ? {
        id: row.skills.id,
        name: row.skills.name,
        category: row.skills.category,
        level: row.skills.level,
        description: row.skills.description,
        displayOrder: row.skills.display_order,
        apparatusId: row.skills.apparatus_id,
        createdAt: row.skills.created_at,
        updatedAt: row.skills.updated_at,
        isConnectedCombo: row.skills.is_connected_combo,
        referenceVideos: row.skills.reference_videos || [],
        tenantId: row.skills.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
      } : null,
    }));
  }

  async upsertAthleteSkill(input: InsertAthleteSkill): Promise<AthleteSkill> {
    // If an athlete_id + skill_id exists, update; else insert
    const existing = await supabaseAdmin
      .from('athlete_skills')
      .select('id')
      .eq('athlete_id', (input as any).athleteId)
      .eq('skill_id', (input as any).skillId)
      .maybeSingle();
    const payload: any = {
      athlete_id: (input as any).athleteId,
      skill_id: (input as any).skillId,
  status: ((input as any).status === 'working' ? 'prepping' : (input as any).status) ?? null,
      notes: (input as any).notes ?? null,
      unlock_date: (input as any).unlockDate ?? null,
      first_tested_at: (input as any).firstTestedAt ?? null,
      last_tested_at: (input as any).lastTestedAt ?? null,
    };
    let data: any;
    const existingId: number | undefined = (existing.data as any)?.id;
    if (existingId) {
      const targetId = existingId;
      const upd = await supabaseAdmin.from('athlete_skills').update(payload).eq('id', targetId).select('*').single();
      if (upd.error) throw upd.error;
      data = upd.data;
    } else {
      const ins = await supabaseAdmin.from('athlete_skills').insert(payload).select('*').single();
      if (ins.error) throw ins.error;
      data = ins.data;
    }
    const result: AthleteSkill = {
      id: data.id,
      athleteId: data.athlete_id,
      skillId: data.skill_id,
      status: data.status,
      notes: data.notes,
      unlockDate: data.unlock_date,
      firstTestedAt: data.first_tested_at,
      lastTestedAt: data.last_tested_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Auto-upgrade experience level if mastered threshold reached
    try {
      const athleteId = (input as any).athleteId as number;
      const athlete = await this.getAthlete(athleteId);
      if (athlete && result.status === 'mastered') {
        // Load settings from site content
        const site = await this.getSiteContent();
        const requiredMap = (site?.about?.progressSettings?.requiredMasteredPerLevel) as Record<string, number> | undefined;
        const levelOrder: Array<'beginner'|'intermediate'|'advanced'|'elite'> = ['beginner','intermediate','advanced','elite'];
        const currentLevel = (athlete as any).experience as 'beginner'|'intermediate'|'advanced'|'elite' | undefined;
        if (currentLevel && requiredMap && typeof requiredMap[currentLevel] === 'number') {
          const required = requiredMap[currentLevel] ?? Infinity;
          if (Number.isFinite(required) && required > 0) {
            // Count mastered skills in current level
            const all = await this.getAthleteSkills(athleteId);
            const masteredCount = all.filter(row => {
              const st = String(row.status || '').toLowerCase();
              const lvl = (row.skill as any)?.level;
              return (st === 'mastered') && (lvl === currentLevel);
            }).length;

            if (masteredCount >= required) {
              const idx = levelOrder.indexOf(currentLevel);
              const next = idx >= 0 && idx < levelOrder.length - 1 ? levelOrder[idx + 1] : undefined;
              if (next) {
                await this.updateAthlete(athleteId, { experience: next as any });
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[STORAGE] Auto-upgrade experience check failed:', e);
    }

    return result;
  }

  async addAthleteSkillVideo(input: InsertAthleteSkillVideo): Promise<AthleteSkillVideo> {
    // Set display_date based on recordedAt in Pacific timezone, or current date as fallback
    let displayDate: string;
    if ((input as any).recordedAt) {
      // Convert recordedAt to Pacific timezone date
      const recordedDate = new Date((input as any).recordedAt);
      displayDate = recordedDate.toLocaleDateString('en-CA', { 
        timeZone: 'America/Los_Angeles' 
      }); // en-CA gives YYYY-MM-DD format
    } else {
      // Fallback to current date in Pacific timezone
      const today = new Date();
      displayDate = today.toLocaleDateString('en-CA', { 
        timeZone: 'America/Los_Angeles' 
      });
    }

    // Determine sort_index - if not provided, get the next index for this athlete_skill_id + display_date
    let sortIndex = (input as any).sortIndex;
    if (sortIndex == null || isNaN(sortIndex)) {
      // Get the highest sort_index for this athlete_skill_id + display_date combination
      const { data: existingVideos } = await supabaseAdmin
        .from('athlete_skill_videos')
        .select('sort_index')
        .eq('athlete_skill_id', (input as any).athleteSkillId)
        .eq('display_date', displayDate)
        .order('sort_index', { ascending: false })
        .limit(1);
      sortIndex = (existingVideos && existingVideos.length > 0 && typeof existingVideos[0].sort_index === 'number')
        ? (existingVideos[0].sort_index + 1)
        : 0;
    }
    // Ensure sortIndex is always a valid integer
    sortIndex = Number.isInteger(sortIndex) ? sortIndex : 0;

    const payload: any = {
      athlete_skill_id: (input as any).athleteSkillId,
      url: (input as any).url,
      title: (input as any).title ?? null,
      recorded_at: (input as any).recordedAt ?? null,
      caption: (input as any).caption ?? null,
      is_visible: (input as any).isVisible ?? true,
      is_featured: (input as any).isFeatured ?? false,
      sort_index: sortIndex,
      thumbnail_url: (input as any).thumbnailUrl ?? null,
      optimized_url: (input as any).optimizedUrl ?? null,
      processing_status: (input as any).processingStatus ?? 'pending',
      display_date: displayDate,
    };

    const { data, error } = await supabaseAdmin.from('athlete_skill_videos').insert(payload).select('*').single();
    if (error) throw error;
    return {
      id: data.id,
      athleteSkillId: data.athlete_skill_id,
      url: data.url,
      title: data.title,
      recordedAt: data.recorded_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      caption: data.caption,
      isVisible: data.is_visible,
      isFeatured: data.is_featured,
      displayDate: data.display_date,
      sortIndex: data.sort_index,
      thumbnailUrl: data.thumbnail_url,
      optimizedUrl: data.optimized_url,
      processingStatus: data.processing_status,
      processingError: data.processing_error,
    };
  }

  async listAthleteSkillVideos(athleteSkillId: number): Promise<AthleteSkillVideo[]> {
    const { data, error } = await supabaseAdmin
      .from('athlete_skill_videos')
      .select('*')
      .eq('athlete_skill_id', athleteSkillId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('[STORAGE][ATHLETE-SKILL-VIDEOS] list error:', error);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      athleteSkillId: row.athlete_skill_id,
      url: row.url,
      title: row.title,
      recordedAt: row.recorded_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      caption: row.caption,
      isVisible: row.is_visible,
      isFeatured: row.is_featured,
      displayDate: row.display_date,
      sortIndex: row.sort_index,
      thumbnailUrl: row.thumbnail_url,
      optimizedUrl: row.optimized_url,
      processingStatus: row.processing_status,
      processingError: row.processing_error,
    }));
  }

  async deleteAthleteSkillVideo(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin.from('athlete_skill_videos').delete().eq('id', id);
    if (error) {
      console.error('[STORAGE][ATHLETE-SKILL-VIDEOS] delete error:', error);
      return false;
    }
    return true;
  }

  async createProgressShareLink(input: InsertProgressShareLink): Promise<ProgressShareLink> {
    const { randomBytes } = await import('crypto');
    
    const payload: any = {
      athlete_id: (input as any).athleteId,
      token: (input as any).token || randomBytes(16).toString('hex'),
      expires_at: (input as any).expiresAt ?? null,
    };
    const { data, error } = await supabaseAdmin.from('progress_share_links').insert(payload).select('*').single();
    if (error) throw error;
    return {
      id: data.id,
      athleteId: data.athlete_id,
      token: data.token,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
    };
  }

  async listProgressShareLinks(athleteId: number): Promise<ProgressShareLink[]> {
    const { data, error } = await supabaseAdmin
      .from('progress_share_links')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[STORAGE][PROGRESS-SHARE] list error:', error);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      athleteId: row.athlete_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    }));
  }

  async deleteProgressShareLink(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('progress_share_links')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[STORAGE][PROGRESS-SHARE] delete error:', error);
      return false;
    }
    return true;
  }

  async revokeProgressShareLink(id: number, when: Date = new Date()): Promise<ProgressShareLink | null> {
    const { data, error } = await supabaseAdmin
      .from('progress_share_links')
      .update({ expires_at: when.toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      console.error('[STORAGE][PROGRESS-SHARE] revoke error:', error);
      return null;
    }
    return {
      id: data.id,
      athleteId: data.athlete_id,
      token: data.token,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
    };
  }

  async getProgressByToken(token: string): Promise<{ athlete: Athlete | null; skills: { athleteSkill: AthleteSkill; skill?: Skill | null; videos: AthleteSkillVideo[]; }[]; link: ProgressShareLink | null; } | null> {
    const { data: link, error: linkErr } = await supabaseAdmin
      .from('progress_share_links')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    if (linkErr || !link) return null;
    if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) return null;
    const athleteId = link.athlete_id;
    const { data: athleteRow } = await supabaseAdmin.from('athletes').select('*').eq('id', athleteId).maybeSingle();
    const athlete: Athlete | null = athleteRow ? {
      id: athleteRow.id,
      parentId: athleteRow.parent_id,
      name: athleteRow.name,
      firstName: athleteRow.first_name,
      lastName: athleteRow.last_name,
      allergies: athleteRow.allergies,
      experience: athleteRow.experience,
      photo: athleteRow.photo,
      createdAt: athleteRow.created_at,
      updatedAt: athleteRow.updated_at,
      dateOfBirth: athleteRow.date_of_birth,
      gender: athleteRow.gender,
      isGymMember: athleteRow.is_gym_member ?? false,
      latestWaiverId: athleteRow.latest_waiver_id,
      waiverStatus: athleteRow.waiver_status || 'pending',
      waiverSigned: athleteRow.waiver_signed || false,
  tenantId: athleteRow.tenant_id,
    } : null;
    const rows = await this.getAthleteSkills(athleteId);
    const withVideos: any[] = [];
    for (const row of rows) {
      const videos = await this.listAthleteSkillVideos(row.id);
      withVideos.push({ athleteSkill: row, skill: row.skill ?? null, videos });
    }
    return {
      athlete,
      skills: withVideos,
      link: {
        id: link.id,
        athleteId: link.athlete_id,
        token: link.token,
        expiresAt: link.expires_at,
        createdAt: link.created_at,
      }
    };
  }

  async getProgressByAthleteId(athleteId: number): Promise<{
    athlete: Athlete | null;
    skills: { athleteSkill: AthleteSkill; skill?: Skill | null; videos: AthleteSkillVideo[] }[];
    link: ProgressShareLink | null;
  } | null> {
    // Fetch athlete
    const { data: athleteRow, error: athleteErr } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .maybeSingle();
    if (athleteErr) {
      console.error('[STORAGE][PROGRESS][BY-ATHLETE] athlete fetch error:', athleteErr);
      return null;
    }
    const athlete: Athlete | null = athleteRow ? {
      id: athleteRow.id,
      parentId: athleteRow.parent_id,
      name: athleteRow.name,
      firstName: athleteRow.first_name,
      lastName: athleteRow.last_name,
      allergies: athleteRow.allergies,
      experience: athleteRow.experience,
      photo: athleteRow.photo,
      createdAt: athleteRow.created_at,
      updatedAt: athleteRow.updated_at,
      dateOfBirth: athleteRow.date_of_birth,
      gender: athleteRow.gender,
      isGymMember: athleteRow.is_gym_member ?? false,
      latestWaiverId: athleteRow.latest_waiver_id,
      waiverStatus: athleteRow.waiver_status || 'pending',
      waiverSigned: athleteRow.waiver_signed || false,
  tenantId: athleteRow.tenant_id,
    } : null;

    // Gather skills and videos
    const rows = await this.getAthleteSkills(athleteId);
    const withVideos: any[] = [];
    for (const row of rows) {
      const videos = await this.listAthleteSkillVideos(row.id);
      withVideos.push({ athleteSkill: row, skill: row.skill ?? null, videos });
    }
    return {
      athlete,
      skills: withVideos,
      link: null,
    };
  }
  // Helper function to log queries
  private logQuery(operation: string, table: string, filters?: any) {
    console.log('[SQL]', `${operation} FROM ${table}`, filters ? JSON.stringify(filters) : '');
  }

  // Parent methods (preferred terminology)
  async getAllParents(): Promise<Parent[]> {
    this.logQuery('SELECT', 'parents');
    const { data, error } = await supabaseAdmin
      .from('parents')
  .select('id, first_name, last_name, email, phone, emergency_contact_name, emergency_contact_phone, created_at, updated_at, password_hash, is_verified, blog_emails, last_login_at, tenant_id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching parents:', error);
      return [];
    }

    // Transform snake_case to camelCase
    return (data || []).map(parent => ({
      id: parent.id,
      firstName: parent.first_name,
      lastName: parent.last_name,
      email: parent.email,
      phone: parent.phone,
      emergencyContactName: parent.emergency_contact_name,
      emergencyContactPhone: parent.emergency_contact_phone,
      passwordHash: parent.password_hash || null,
      isVerified: parent.is_verified || false,
      blogEmails: parent.blog_emails || false,
      lastLoginAt: parent.last_login_at,
      createdAt: parent.created_at,
      updatedAt: parent.updated_at,
  tenantId: parent.tenant_id,
    }));
  }

  async identifyParent(email: string, phone: string): Promise<Parent | undefined> {
    // Normalize email to lower case for comparison
    const emailLower = email.toLowerCase();
    const { data, error } = await supabaseAdmin
      .from('parents')
  .select('id, first_name, last_name, email, phone, emergency_contact_name, emergency_contact_phone, created_at, updated_at, password_hash, is_verified, blog_emails, last_login_at, tenant_id')
      .or(`email.ilike.${emailLower},phone.eq.${phone}`)
      .single();

    if (error) {
      // If not found, that's expected behavior, don't log as error
      return undefined;
    }

    // Transform snake_case to camelCase
    return data ? {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      passwordHash: data.password_hash || null,
      isVerified: data.is_verified || false,
      blogEmails: data.blog_emails || false,
      lastLoginAt: data.last_login_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
  tenantId: data.tenant_id,
    } : undefined;
  }


  async createParent(insertParent: InsertParentInput): Promise<Parent> {
    // Validate required fields
    if (!insertParent.email) {
      throw new Error("Email is required to create a parent");
    }
    if (!insertParent.firstName) {
      throw new Error("First name is required to create a parent");
    }
    if (!insertParent.lastName) {
      throw new Error("Last name is required to create a parent");
    }
    if (!insertParent.phone) {
      throw new Error("Phone number is required to create a parent");
    }

    // Always store email in lower case
    // Provide default tenant during migration if not supplied (SaaS bootstrap tenant)
    const effectiveTenantId = (insertParent as any).tenantId || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';

    const supabaseData = {
      first_name: insertParent.firstName,
      last_name: insertParent.lastName,
      email: insertParent.email.toLowerCase(),
  password_hash: insertParent.passwordHash || '', // new field
  is_verified: insertParent.isVerified || false, // new field
      phone: insertParent.phone,
      emergency_contact_name: insertParent.emergencyContactName || 'Not Provided',
      emergency_contact_phone: insertParent.emergencyContactPhone || 'Not Provided',
      tenant_id: effectiveTenantId,
      // Remove waiver fields - they're now in separate waivers table
    };

    const { data, error } = await supabaseServiceRole
      .from('parents')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error('Error creating parent:', error);
      
      // Handle duplicate email error specifically
      if (error.code === '23505' && error.message.includes('email')) {
        throw new Error(`A parent with email ${insertParent.email} already exists`);
      }
      
      throw error;
    }

    // Always return a Parent object (never undefined)
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      passwordHash: data.password_hash || null,
      isVerified: data.is_verified || false,
      blogEmails: data.blog_emails || false,
      lastLoginAt: data.last_login_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
  tenantId: data.tenant_id,
    };
  }

  async getParentByEmail(email: string): Promise<Parent | undefined> {
    const { data, error } = await supabaseAdmin
      .from('parents')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // not found is not an error
        console.error('Error fetching parent by email:', error);
      }
      return undefined;
    }
    return data ? {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      passwordHash: data.password_hash || null,
      isVerified: data.is_verified || false,
      blogEmails: data.blog_emails || false,
      lastLoginAt: data.last_login_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
  tenantId: data.tenant_id,
    } : undefined;
  }

  async updateParent(id: number, updateData: Partial<InsertParentInput>): Promise<Parent | undefined> {
    // If updating email, always store in lower case
    const updateDataNormalized = { ...updateData };
    if (updateDataNormalized.email) {
      updateDataNormalized.email = updateDataNormalized.email.toLowerCase();
    }

    // Map camelCase fields to snake_case column names for Supabase
    const dbUpdateData: any = {};
    if (updateDataNormalized.firstName !== undefined) dbUpdateData.first_name = updateDataNormalized.firstName;
    if (updateDataNormalized.lastName !== undefined) dbUpdateData.last_name = updateDataNormalized.lastName;
    if (updateDataNormalized.email !== undefined) dbUpdateData.email = updateDataNormalized.email;
    if (updateDataNormalized.phone !== undefined) dbUpdateData.phone = updateDataNormalized.phone;
    if (updateDataNormalized.emergencyContactName !== undefined) dbUpdateData.emergency_contact_name = updateDataNormalized.emergencyContactName;
    if (updateDataNormalized.emergencyContactPhone !== undefined) dbUpdateData.emergency_contact_phone = updateDataNormalized.emergencyContactPhone;
    if (updateDataNormalized.passwordHash !== undefined) dbUpdateData.password_hash = updateDataNormalized.passwordHash;
    if (updateDataNormalized.isVerified !== undefined) dbUpdateData.is_verified = updateDataNormalized.isVerified;

    console.log('[DEBUG] Updating parent with data:', dbUpdateData);
    
    const { data, error } = await supabaseAdmin
      .from('parents')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating parent:', error);
      return undefined;
    }

    return data ? {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      passwordHash: data.password_hash || null,
      isVerified: data.is_verified || false,
      blogEmails: data.blog_emails || false,
      lastLoginAt: data.last_login_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
  tenantId: data.tenant_id,
    } : undefined;
  }

  async deleteParent(id: number): Promise<boolean> {
    // Cascade delete all athletes for this parent
    const athletes = await this.getParentAthletes(id);
    for (const athlete of athletes) {
      await this.deleteAthlete(athlete.id);
    }
    const { error } = await supabaseAdmin
      .from('parents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting parent:', error);
      return false;
    }

    return true;
  }

  async getParentAthletes(parentId: number): Promise<Athlete[]> {
    const { data, error } = await supabaseAdmin
      .from('athletes')
  .select('*')
      .eq('parent_id', parentId)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching parent athletes:', error);
      return [];
    }

    if (!data) return [];

    // Map snake_case to camelCase for frontend compatibility
    return data.map(athlete => ({
      id: athlete.id,
      parentId: athlete.parent_id,
      name: athlete.name,
      firstName: athlete.first_name,
      lastName: athlete.last_name,
      dateOfBirth: athlete.date_of_birth,
      gender: athlete.gender || null,
      allergies: athlete.allergies,
      experience: athlete.experience,
      photo: athlete.photo,
      isGymMember: athlete.is_gym_member ?? false,
      createdAt: new Date(athlete.created_at),
      updatedAt: new Date(athlete.updated_at),
      latestWaiverId: athlete.latest_waiver_id || null,
      waiverStatus: athlete.waiver_status || 'pending',
      waiverSigned: athlete.waiver_signed || false,
      tenantId: athlete.tenant_id || '00000000-0000-0000-0000-000000000001',
    }));
  }

  // Lesson Types
  async getAllLessonTypes(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('lesson_types')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error fetching all lesson types:', error);
      return [];
    }

    console.log('[DEBUG] Raw lesson types data from DB:', JSON.stringify(data, null, 2));

    return data.map(lt => {
      const mapped = {
        id: lt.id,
        name: lt.name,
        description: lt.description,
        price: parseFloat(lt.total_price || '0'),
        reservationFee: parseFloat(lt.reservation_fee || '0'),
        keyPoints: lt.key_points || [],
        duration: lt.duration_minutes,
        isPrivate: lt.is_private,
        maxAthletes: lt.max_athletes || (lt.is_private ? 1 : 2),
        isActive: lt.is_active !== false // Default to true if not set
      };
      console.log('[DEBUG] Mapped lesson type:', JSON.stringify(mapped, null, 2));
      return mapped;
    });
  }
  // Removed stray tenantId lines introduced by earlier patch
  async getLessonType(id: number): Promise<any | undefined> {
    const { data, error } = await supabaseAdmin
      .from('lesson_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching lesson type:', error);
      return undefined;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: parseFloat(data.total_price || '0'),
      reservationFee: parseFloat(data.reservation_fee || '0'),
      keyPoints: data.key_points || [],
      duration: data.duration_minutes,
      isPrivate: data.is_private,
      maxAthletes: data.max_athletes || (data.is_private ? 1 : 2),
      isActive: data.is_active !== false
    };
  }

  async createLessonType(lessonType: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('lesson_types')
      .insert({
        name: lessonType.name,
        description: lessonType.description,
        total_price: lessonType.price,
        reservation_fee: lessonType.reservationFee || 0,
        key_points: lessonType.keyPoints || [],
        duration_minutes: lessonType.duration,
        is_private: lessonType.isPrivate,
        max_athletes: lessonType.maxAthletes,
        is_active: lessonType.isActive !== false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lesson type:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
  tenantId: data.tenant_id || '00000000-0000-0000-0000-000000000001',
      description: data.description,
      price: parseFloat(data.total_price || '0'),
      reservationFee: parseFloat(data.reservation_fee || '0'),
      keyPoints: data.key_points || [],
      duration: data.duration_minutes,
      isPrivate: data.is_private,
      maxAthletes: data.max_athletes,
      isActive: data.is_active
    };
  }

  async updateLessonType(id: number, lessonType: any): Promise<any | undefined> {
    const updateData: any = {};
    
    if (lessonType.name !== undefined) updateData.name = lessonType.name;
    if (lessonType.description !== undefined) updateData.description = lessonType.description;
    if (lessonType.price !== undefined) updateData.total_price = lessonType.price;
    if (lessonType.reservationFee !== undefined) updateData.reservation_fee = lessonType.reservationFee;
    if (lessonType.keyPoints !== undefined) updateData.key_points = lessonType.keyPoints;
    if (lessonType.duration !== undefined) updateData.duration_minutes = lessonType.duration;
    if (lessonType.isPrivate !== undefined) updateData.is_private = lessonType.isPrivate;
    if (lessonType.maxAthletes !== undefined) updateData.max_athletes = lessonType.maxAthletes;
    if (lessonType.isActive !== undefined) updateData.is_active = lessonType.isActive;

    const { data, error } = await supabaseAdmin
      .from('lesson_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lesson type:', error);
      return undefined;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: parseFloat(data.total_price || '0'),
      reservationFee: parseFloat(data.reservation_fee || '0'),
      keyPoints: data.key_points || [],
      duration: data.duration_minutes,
      isPrivate: data.is_private,
      maxAthletes: data.max_athletes,
      isActive: data.is_active
    };
  }

  async deleteLessonType(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('lesson_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lesson type:', error);
      return false;
    }

    return true;
  }

  // Athletes
  async getAllAthletes(): Promise<Athlete[]> {
    const { data, error } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all athletes:', error);
      return [];
    }

    if (!data) return [];

    // Map snake_case to camelCase for frontend compatibility
    return data.map(athlete => ({
      id: athlete.id,
      parentId: athlete.parent_id,
      name: athlete.name,
      firstName: athlete.first_name,
      lastName: athlete.last_name,
      dateOfBirth: athlete.date_of_birth,
      gender: athlete.gender || null,
      allergies: athlete.allergies,
      experience: athlete.experience,
      photo: athlete.photo,
  isGymMember: athlete.is_gym_member ?? false,
      createdAt: new Date(athlete.created_at),
      updatedAt: new Date(athlete.updated_at),
      latestWaiverId: athlete.latest_waiver_id || null,
      waiverStatus: athlete.waiver_status || 'pending',
  waiverSigned: athlete.waiver_signed || false,
  tenantId: athlete.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    }));
  }

  async getAllAthletesWithWaiverStatus(): Promise<AthleteWithWaiverStatus[]> {
    this.logQuery('SELECT', 'athletes_with_waiver_status view');
    const { data, error } = await supabaseAdmin
      .from('athletes_with_waiver_status')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching athletes with waiver status:', error);
      return [];
    }

    if (!data) return [];

    // Map snake_case to camelCase for frontend compatibility
    return data.map(athlete => ({
      id: athlete.id,
      parentId: athlete.parent_id,
      name: athlete.name,
      firstName: athlete.first_name,
      lastName: athlete.last_name,
      dateOfBirth: athlete.date_of_birth,
      gender: athlete.gender,
      allergies: athlete.allergies,
      experience: athlete.experience,
      photo: athlete.photo,
      isGymMember: athlete.is_gym_member ?? false,
      createdAt: new Date(athlete.created_at),
      updatedAt: new Date(athlete.updated_at),
      latestWaiverId: athlete.latest_waiver_id,
      waiverStatus: athlete.waiver_status,
      waiverSigned: athlete.waiver_signed || false,
      // Remove direct waiver timestamp from athlete - now from waivers table
      waiverSignatureId: athlete.waiver_signature_id,
      waiverSignatureData: athlete.waiver_signature_data,
      waiverSignerName: athlete.waiver_signer_name,
      waiverCreatedAt: athlete.waiver_created_at,
      computedWaiverStatus: athlete.computed_waiver_status,
  tenantId: athlete.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    }));
  }

  async getAthleteWithWaiverStatus(id: number): Promise<AthleteWithWaiverStatus | undefined> {
    this.logQuery('SELECT', 'athletes_with_waiver_status view', { id });
    const { data, error } = await supabaseAdmin
      .from('athletes_with_waiver_status')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching athlete with waiver status:', error);
      return undefined;
    }

    if (!data) return undefined;

    // Map snake_case to camelCase for frontend compatibility
    return {
      id: data.id,
      parentId: data.parent_id,
      name: data.name,
      firstName: data.first_name,
      lastName: data.last_name,
      dateOfBirth: data.date_of_birth,
      gender: data.gender,
      allergies: data.allergies,
      experience: data.experience,
      photo: data.photo,
      isGymMember: data.is_gym_member ?? false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      latestWaiverId: data.latest_waiver_id,
      waiverStatus: data.waiver_status,
      waiverSigned: data.waiver_signed || false,
      // Remove direct waiver timestamp from athlete - now from waivers table
      waiverSignatureId: data.waiver_signature_id,
      waiverSignatureData: data.waiver_signature_data,
      waiverSignerName: data.waiver_signer_name,
      waiverCreatedAt: data.waiver_created_at,
      computedWaiverStatus: data.computed_waiver_status,
  tenantId: data.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    };
  }

  async createAthlete(insertAthlete: InsertAthleteInput): Promise<Athlete> {
    // Map camelCase to snake_case for Supabase
    const effectiveTenantId = (insertAthlete as any).tenantId || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
    const supabaseData = {
      name: insertAthlete.name || `${insertAthlete.firstName || ''} ${insertAthlete.lastName || ''}`.trim(),
      first_name: insertAthlete.firstName,
      last_name: insertAthlete.lastName,
      parent_id: insertAthlete.parentId,
      date_of_birth: insertAthlete.dateOfBirth,
      gender: insertAthlete.gender || null,
      allergies: insertAthlete.allergies,
      experience: insertAthlete.experience,
  photo: insertAthlete.photo || null,
  is_gym_member: (insertAthlete as any).isGymMember ?? false,
      tenant_id: effectiveTenantId,
    };

    // Use supabaseAdmin to bypass RLS when creating athletes from admin interface
    const { data, error } = await supabaseAdmin
      .from('athletes')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error('Error creating athlete:', error);
      throw error;
    }

    return {
      id: data.id,
      parentId: data.parent_id,
      name: data.name,
      firstName: data.first_name,
      lastName: data.last_name,
      allergies: data.allergies,
      experience: data.experience,
      photo: data.photo,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      dateOfBirth: data.date_of_birth,
      gender: data.gender,
      isGymMember: data.is_gym_member ?? false,
      latestWaiverId: data.latest_waiver_id,
      waiverStatus: data.waiver_status || 'pending',
      waiverSigned: data.waiver_signed || false,
      tenantId: data.tenant_id,
    } as any;
  }

  async getAthlete(id: number): Promise<Athlete | undefined> {
    const { data, error } = await supabaseAdmin
      .from('athletes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching athlete:', error);
      return undefined;
    }

    if (!data) return undefined;

    // Map snake_case to camelCase for frontend compatibility
    return {
      id: data.id,
      parentId: data.parent_id,
      name: data.name,
      firstName: data.first_name,
      lastName: data.last_name,
      dateOfBirth: data.date_of_birth,
      gender: data.gender || null,
      allergies: data.allergies,
      experience: data.experience,
      photo: data.photo,
  isGymMember: data.is_gym_member ?? false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      latestWaiverId: data.latest_waiver_id || null,
      waiverStatus: data.waiver_status || 'pending',
      waiverSigned: data.waiver_signed || false,
      tenantId: data.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    };
  }

  async updateAthlete(id: number, updateData: Partial<InsertAthlete>): Promise<Athlete | undefined> {
    console.log('[STORAGE-UPDATE-ATHLETE] Starting update:', { id, updateData });
    
    // Map camelCase to snake_case for DB update
    const dbUpdate: Record<string, any> = {};
    if (updateData.firstName !== undefined) dbUpdate.first_name = updateData.firstName;
    if (updateData.lastName !== undefined) dbUpdate.last_name = updateData.lastName;
    if (updateData.parentId !== undefined) dbUpdate.parent_id = updateData.parentId;
    if (updateData.dateOfBirth !== undefined) dbUpdate.date_of_birth = updateData.dateOfBirth;
    if (updateData.gender !== undefined) dbUpdate.gender = updateData.gender;
    if (updateData.name !== undefined) dbUpdate.name = updateData.name;
    if (updateData.allergies !== undefined) dbUpdate.allergies = updateData.allergies;
    if (updateData.experience !== undefined) dbUpdate.experience = updateData.experience;
    if (updateData.photo !== undefined) dbUpdate.photo = updateData.photo;
  if ((updateData as any).isGymMember !== undefined) dbUpdate.is_gym_member = (updateData as any).isGymMember;
    if (updateData.latestWaiverId !== undefined) dbUpdate.latest_waiver_id = updateData.latestWaiverId;
    if (updateData.waiverStatus !== undefined) dbUpdate.waiver_status = updateData.waiverStatus;
    if (updateData.waiverSigned !== undefined) dbUpdate.waiver_signed = updateData.waiverSigned;

    // If firstName or lastName is being updated but name is not explicitly provided,
    // we need to get the current values and update the name field
    if ((updateData.firstName !== undefined || updateData.lastName !== undefined) && updateData.name === undefined) {
      // Get current athlete data to compute the full name
      const currentAthlete = await this.getAthlete(id);
      if (currentAthlete) {
        const newFirstName = updateData.firstName !== undefined ? updateData.firstName : currentAthlete.firstName;
        const newLastName = updateData.lastName !== undefined ? updateData.lastName : currentAthlete.lastName;
        dbUpdate.name = `${newFirstName || ''} ${newLastName || ''}`.trim();
      }
    }

    console.log('[STORAGE-UPDATE-ATHLETE] DB update object:', dbUpdate);

    // Use supabaseAdmin to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('athletes')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();

    console.log('[STORAGE-UPDATE-ATHLETE] Supabase response:', { 
      success: !error, 
      error: error?.message, 
      data: data ? { id: data.id, name: data.name || data.first_name + ' ' + data.last_name } : null 
    });

    if (error) {
      console.error('Error updating athlete:', error);
      // Forward error for route to handle
      throw error;
    }

    if (!data) return undefined;

    // Transform snake_case to camelCase for frontend compatibility (SAME AS getAthlete)
    const transformedAthlete = {
      id: data.id,
      parentId: data.parent_id,
      name: data.name,
      firstName: data.first_name,
      lastName: data.last_name,
      dateOfBirth: data.date_of_birth,
      gender: data.gender || null,
      allergies: data.allergies,
      experience: data.experience,
      photo: data.photo,
  isGymMember: data.is_gym_member ?? false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      latestWaiverId: data.latest_waiver_id || null,
      waiverStatus: data.waiver_status || 'pending',
      waiverSigned: data.waiver_signed || false
    };

    console.log('[STORAGE-UPDATE-ATHLETE] Returning transformed athlete:', {
      id: transformedAthlete.id,
      firstName: transformedAthlete.firstName,
      lastName: transformedAthlete.lastName,
      allergies: transformedAthlete.allergies
    });

  return { ...transformedAthlete, tenantId: (transformedAthlete as any).tenantId || data.tenant_id };
  }

  async deleteAthlete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('athletes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting athlete:', error);
      return false;
    }

    return true;
  }

  async getAthleteBookingHistory(athleteId: number): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('athlete1_name', athleteId.toString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching athlete booking history:', error);
      return [];
    }

    return data || [];
  }

  // Bookings
  async createBooking(insertBooking: InsertBookingInput): Promise<Booking> {
    // Map camelCase to snake_case for database (normalized schema with foreign keys)
    const effectiveTenantId = (insertBooking as any).tenantId || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
    const dbBooking: any = {
      parent_id: insertBooking.parentId,
      lesson_type_id: insertBooking.lessonTypeId,
      preferred_date: insertBooking.preferredDate,
      preferred_time: insertBooking.preferredTime,
      status: insertBooking.status || 'pending',
      payment_status: insertBooking.paymentStatus || 'unpaid',
      attendance_status: insertBooking.attendanceStatus || 'pending',
      booking_method: insertBooking.bookingMethod || 'Website',
      reservation_fee_paid: insertBooking.reservationFeePaid || false,
      paid_amount: insertBooking.paidAmount || 0,
      tenant_id: effectiveTenantId,
    };

    // Optional fields - but safety contact fields must be provided for all bookings
    // For admin bookings, allow NULL values; for parent bookings, require them
    const isAdminBooking = insertBooking.bookingMethod === 'Admin';
    
    // Safety contact fields - required for parent bookings, optional for admin bookings
    if (isAdminBooking) {
      // Admin bookings can have NULL safety contact fields
      dbBooking.dropoff_person_name = insertBooking.dropoffPersonName || null;
      dbBooking.dropoff_person_relationship = insertBooking.dropoffPersonRelationship || null;
      dbBooking.dropoff_person_phone = insertBooking.dropoffPersonPhone || null;
      dbBooking.pickup_person_name = insertBooking.pickupPersonName || null;
      dbBooking.pickup_person_relationship = insertBooking.pickupPersonRelationship || null;
      dbBooking.pickup_person_phone = insertBooking.pickupPersonPhone || null;
    } else {
      // Parent bookings require safety contact information
      dbBooking.dropoff_person_name = insertBooking.dropoffPersonName || 'To be provided';
      dbBooking.dropoff_person_relationship = insertBooking.dropoffPersonRelationship || 'To be provided';
      dbBooking.dropoff_person_phone = insertBooking.dropoffPersonPhone || 'To be provided';
      dbBooking.pickup_person_name = insertBooking.pickupPersonName || 'To be provided';
      dbBooking.pickup_person_relationship = insertBooking.pickupPersonRelationship || 'To be provided';
      dbBooking.pickup_person_phone = insertBooking.pickupPersonPhone || 'To be provided';
    }
    
    // Alternative pickup is always optional
    if (insertBooking.altPickupPersonName) dbBooking.alt_pickup_person_name = insertBooking.altPickupPersonName;
    if (insertBooking.altPickupPersonRelationship) dbBooking.alt_pickup_person_relationship = insertBooking.altPickupPersonRelationship;
    if (insertBooking.altPickupPersonPhone) dbBooking.alt_pickup_person_phone = insertBooking.altPickupPersonPhone;
    if (insertBooking.safetyVerificationSigned) dbBooking.safety_verification_signed = insertBooking.safetyVerificationSigned;
    if (insertBooking.safetyVerificationSignedAt) dbBooking.safety_verification_signed_at = insertBooking.safetyVerificationSignedAt;
    if (insertBooking.specialRequests) dbBooking.special_requests = insertBooking.specialRequests;
    if (insertBooking.adminNotes) dbBooking.admin_notes = insertBooking.adminNotes;
    if (insertBooking.stripeSessionId) dbBooking.stripe_session_id = insertBooking.stripeSessionId;

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert(dbBooking)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      throw error;
    }

    if (!data) throw new Error('No data returned from booking creation');

  const booking = this.mapBookingFromDb(data);
    
    // Create athlete records and booking_athletes relationships if athletes provided
    if (insertBooking.athletes && Array.isArray(insertBooking.athletes) && insertBooking.athletes.length > 0) {
      for (let i = 0; i < insertBooking.athletes.length; i++) {
        const athleteData = insertBooking.athletes[i];
        
        // Create athlete if athleteId is not provided
        let athleteId = athleteData.athleteId;
        
        if (!athleteId) {
          // For new user flow, parent might not exist yet - create parent first
          let parent = await this.identifyParent(
            String(insertBooking.parentEmail || ''), 
            String(insertBooking.parentPhone || '')
          );
          
          if (!parent) {
            // Create parent account
            parent = await this.createParent({
              firstName: String((insertBooking as any).parentFirstName || ''),
              lastName: String((insertBooking as any).parentLastName || ''),
              email: String((insertBooking as any).parentEmail || ''),
              phone: String((insertBooking as any).parentPhone || ''),
              emergencyContactName: String((insertBooking as any).emergencyContactName || ''),
              emergencyContactPhone: String((insertBooking as any).emergencyContactPhone || ''),
              passwordHash: await import('bcryptjs').then(bcrypt => bcrypt.hash(Math.random().toString(36).slice(2), 10)),
            });
          }
          
          const newAthlete = await this.createAthlete({
            parentId: parent.id,
            name: athleteData.name,
            firstName: athleteData.name.split(' ')[0],
            lastName: athleteData.name.split(' ').slice(1).join(' ') || '',
            dateOfBirth: athleteData.dateOfBirth,
            gender: athleteData.gender,
            allergies: athleteData.allergies,
            experience: athleteData.experience as "beginner" | "intermediate" | "advanced",
            photo: athleteData.photo
          });
          athleteId = newAthlete.id;
        }
        
        // Create booking_athletes relationship
        try {
          const { error: athleteInsertError } = await supabaseAdmin
            .from('booking_athletes')
            .insert({
              booking_id: booking.id,
              athlete_id: athleteId,
              slot_order: athleteData.slotOrder || (i + 1)
            });
            
          if (athleteInsertError) {
            console.error(`Error linking athlete ${athleteId} to booking ${booking.id}:`, athleteInsertError);
            throw new Error(`Failed to link athlete ${athleteId} to booking ${booking.id}: ${athleteInsertError.message}`);
          }
        } catch (err) {
          console.error(`Exception linking athlete ${athleteId} to booking ${booking.id}:`, err);
          throw err;
        }
      }
    }

    // Create focus area relationships if provided
    if (insertBooking.focusAreaIds && Array.isArray(insertBooking.focusAreaIds) && insertBooking.focusAreaIds.length > 0) {
      const focusAreaInserts = insertBooking.focusAreaIds.map((focusAreaId: number) => ({
        booking_id: booking.id,
        focus_area_id: focusAreaId
      }));
      
      try {
        const { error: focusAreaInsertError } = await supabaseAdmin
          .from('booking_focus_areas')
          .insert(focusAreaInserts);
          
        if (focusAreaInsertError) {
          console.error(`Error adding focus areas to booking ${booking.id}:`, focusAreaInsertError);
          // Continue execution instead of throwing to not block the whole booking
        }
      } catch (err) {
        console.error(`Exception adding focus areas to booking ${booking.id}:`, err);
        // Continue execution instead of throwing to not block the whole booking
      }

      // Also populate legacy JSON focus_areas with names for consistent reads
      try {
        const { data: allFa } = await supabaseAdmin
          .from('focus_areas')
          .select('id, name')
          .in('id', insertBooking.focusAreaIds as number[]);
        const names = (allFa || [])
          .filter((fa: any) => insertBooking.focusAreaIds!.includes(fa.id))
          .map((fa: any) => fa.name);
        const { error: faJsonErr } = await supabaseAdmin
          .from('bookings')
          .update({ focus_areas: names })
          .eq('id', booking.id);
        if (faJsonErr) {
          console.error('Failed to update legacy JSON focus_areas on create:', faJsonErr);
        } else {
          (booking as any).focusAreas = names;
        }
      } catch (mapErr) {
        console.error('Exception mapping focus area names on create:', mapErr);
      }
    }

    // Create apparatus relationships if provided
    if (insertBooking.apparatusIds && Array.isArray(insertBooking.apparatusIds) && insertBooking.apparatusIds.length > 0) {
      const apparatusInserts = insertBooking.apparatusIds.map((apparatusId: number) => ({
        booking_id: booking.id,
        apparatus_id: apparatusId
      }));
      
      try {
        const { error: apparatusInsertError } = await supabaseAdmin
          .from('booking_apparatus')
          .insert(apparatusInserts);
          
        if (apparatusInsertError) {
          console.error(`Error adding apparatus to booking ${booking.id}:`, apparatusInsertError);
          // Continue execution instead of throwing to not block the whole booking
        }
      } catch (err) {
        console.error(`Exception adding apparatus to booking ${booking.id}:`, err);
        // Continue execution instead of throwing to not block the whole booking
      }
    }

    // Create side quest relationships if provided
    if (insertBooking.sideQuestIds && Array.isArray(insertBooking.sideQuestIds) && insertBooking.sideQuestIds.length > 0) {
      const sideQuestInserts = insertBooking.sideQuestIds.map((sideQuestId: number) => ({
        booking_id: booking.id,
        side_quest_id: sideQuestId
      }));
      
      try {
        const { error: sideQuestInsertError } = await supabaseAdmin
          .from('booking_side_quests')
          .insert(sideQuestInserts);
          
        if (sideQuestInsertError) {
          console.error(`Error adding side quests to booking ${booking.id}:`, sideQuestInsertError);
          // Continue execution instead of throwing to not block the whole booking
        }
      } catch (err) {
        console.error(`Exception adding side quests to booking ${booking.id}:`, err);
        // Continue execution instead of throwing to not block the whole booking
      }
    }

    // Persist custom focus area text if provided
    if ((insertBooking as any).focusAreaOther !== undefined) {
      try {
        const { error: otherErr } = await supabaseAdmin
          .from('bookings')
          .update({ focus_area_other: (insertBooking as any).focusAreaOther })
          .eq('id', booking.id);
        if (otherErr) {
          console.error('Failed to save focus_area_other on create:', otherErr);
        } else {
          (booking as any).focusAreaOther = (insertBooking as any).focusAreaOther;
        }
      } catch (otherEx) {
        console.error('Exception saving focus_area_other on create:', otherEx);
      }
    }

    return booking;
  }

  private mapBookingFromDb(data: any): Booking {
    return {
      id: data.id,
      parentId: data.parent_id,
  tenantId: data.tenant_id,
  // athleteId removed in new schema; use booking_athletes relation instead
      lessonTypeId: data.lesson_type_id,
      // Legacy fields for backward compatibility - these will be empty/undefined for normalized bookings
      athlete1Name: '',
      athlete1DateOfBirth: '',
      athlete1Allergies: null,
      athlete1Experience: '',
      athlete2Name: null,
      athlete2DateOfBirth: null,
      athlete2Allergies: null,
      athlete2Experience: null,
      parentFirstName: undefined,
      parentLastName: undefined,
      parentEmail: undefined,
      parentPhone: undefined,
      emergencyContactName: undefined,
      emergencyContactPhone: undefined,
      focusAreas: Array.isArray(data.focus_areas) ? data.focus_areas : [], // Read from JSON field in DB
      focusAreaOther: data.focus_area_other,
      amount: undefined, // Now calculated from lesson type
      preferredDate: data.preferred_date,
      preferredTime: data.preferred_time,
      status: data.status,
      paymentStatus: data.payment_status,
      attendanceStatus: data.attendance_status,
      bookingMethod: data.booking_method,
      reservationFeePaid: data.reservation_fee_paid || false,
      paidAmount: data.paid_amount?.toString() || "0.00",
      specialRequests: data.special_requests,
      adminNotes: data.admin_notes,
      dropoffPersonName: data.dropoff_person_name,
      dropoffPersonRelationship: data.dropoff_person_relationship,
      dropoffPersonPhone: data.dropoff_person_phone,
      pickupPersonName: data.pickup_person_name,
      pickupPersonRelationship: data.pickup_person_relationship,
      pickupPersonPhone: data.pickup_person_phone,
      altPickupPersonName: data.alt_pickup_person_name,
      altPickupPersonRelationship: data.alt_pickup_person_relationship,
      altPickupPersonPhone: data.alt_pickup_person_phone,
      safetyVerificationSigned: data.safety_verification_signed || false,
      safetyVerificationSignedAt: data.safety_verification_signed_at,
      progressNote: data.progress_note || null,
      coachName: data.coach_name || "Coach Will",
      stripeSessionId: data.stripe_session_id,
  // Idempotent session confirmation email tracking
  sessionConfirmationEmailSent: data.session_confirmation_email_sent ?? false,
  sessionConfirmationEmailSentAt: data.session_confirmation_email_sent_at ?? null,
      // Cancellation fields
      cancellationReason: data.cancellation_reason || null,
      cancellationRequestedAt: data.cancellation_requested_at ? new Date(data.cancellation_requested_at) : null,
      wantsReschedule: data.wants_reschedule || null,
      reschedulePreferences: data.reschedule_preferences || null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      return undefined;
    }

    if (!data) return undefined;

    // Map from snake_case to camelCase
    return this.mapBookingFromDb(data);
  }

  async getAllBookings(): Promise<Booking[]> {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all bookings:', error);
      return [];
    }

    if (!data) return [];

    // Map all bookings from snake_case to camelCase
    return data.map((booking: any) => this.mapBookingFromDb(booking));
  }

  async getUpcomingSessions(): Promise<{
    id: number;
    sessionDate: string;
    sessionTime: string;
    lessonType: string;
    parentName: string;
    athleteNames: string[];
    athletes: { id: number; firstName: string; lastName: string }[];
    focusAreas: string[];
    paymentStatus: string;
    attendanceStatus: string;
  }[]> {
    try {
      // Get bookings from today onwards with parent and athlete data
      const { data: bookingsData, error: bookingsError } = await supabaseAdmin
        .from('bookings')
        .select(`
          id,
          preferred_date,
          preferred_time,
          lesson_type_id,
          payment_status,
          attendance_status,
          parent_id
        `)
        .gte('preferred_date', new Date().toISOString().split('T')[0])
        .order('preferred_date', { ascending: true });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return [];
      }

      if (!bookingsData || bookingsData.length === 0) {
        return [];
      }

      // Get parent data for all bookings
      const parentIds = Array.from(new Set(bookingsData.map(b => b.parent_id)));
      const { data: parentsData, error: parentsError } = await supabaseAdmin
        .from('parents')
        .select('id, first_name, last_name')
        .in('id', parentIds);

      if (parentsError) {
        console.error('Error fetching parents:', parentsError);
      }

      // Get lesson type data for all bookings (include total_price)
      const lessonTypeIds = Array.from(new Set(bookingsData.map(b => b.lesson_type_id).filter(Boolean)));
      const { data: lessonTypesData, error: lessonTypesError } = await supabaseAdmin
        .from('lesson_types')
        .select('id, name, total_price')
        .in('id', lessonTypeIds);

      if (lessonTypesError) {
        console.error('Error fetching lesson types:', lessonTypesError);
      }

      // Get athlete data for all bookings
      const bookingIds = bookingsData.map(b => b.id);
      const { data: bookingAthletesData, error: bookingAthletesError } = await supabaseAdmin
        .from('booking_athletes')
        .select(`
          booking_id,
          athletes:athlete_id (
            id,
            first_name,
            last_name
          )
        `)
        .in('booking_id', bookingIds);

      if (bookingAthletesError) {
        console.error('Error fetching booking athletes:', bookingAthletesError);
      }

      // Get focus areas for all bookings
      const { data: bookingFocusAreasData, error: bookingFocusAreasError } = await supabaseAdmin
        .from('booking_focus_areas')
        .select(`
          booking_id,
          focus_areas!inner (
            name
          )
        `)
        .in('booking_id', bookingIds);

      if (bookingFocusAreasError) {
        console.error('Error fetching booking focus areas:', bookingFocusAreasError);
      }

      // Create lookup maps
      const parentsMap = new Map();
      parentsData?.forEach(parent => {
        parentsMap.set(parent.id, `${parent.first_name} ${parent.last_name}`);
      });

      const lessonTypesMap = new Map();
      lessonTypesData?.forEach(lessonType => {
        lessonTypesMap.set(lessonType.id, lessonType);
      });

      // Create athletes maps - both names and full objects
      const athleteNamesMap = new Map();
      const athletesObjectMap = new Map();
      bookingAthletesData?.forEach(ba => {
        if (!athleteNamesMap.has(ba.booking_id)) {
          athleteNamesMap.set(ba.booking_id, []);
          athletesObjectMap.set(ba.booking_id, []);
        }
        if (ba.athletes && typeof ba.athletes === 'object' && 'first_name' in ba.athletes) {
          const athlete = ba.athletes as any;
          athleteNamesMap.get(ba.booking_id)!.push(`${athlete.first_name} ${athlete.last_name}`);
          athletesObjectMap.get(ba.booking_id)!.push({
            id: athlete.id,
            firstName: athlete.first_name,
            lastName: athlete.last_name
          });
        }
      });

      // Create focus areas map
      const focusAreasMap = new Map();
      bookingFocusAreasData?.forEach(bfa => {
        if (!focusAreasMap.has(bfa.booking_id)) {
          focusAreasMap.set(bfa.booking_id, []);
        }
        if (bfa.focus_areas && typeof bfa.focus_areas === 'object' && 'name' in bfa.focus_areas) {
          const focusArea = bfa.focus_areas as any;
          focusAreasMap.get(bfa.booking_id)!.push(focusArea.name);
        }
      });

      // Transform to expected format
      return bookingsData.map(booking => {
        const lessonTypeObj = lessonTypesMap.get(booking.lesson_type_id);
        return {
          id: booking.id,
          sessionDate: booking.preferred_date,
          sessionTime: booking.preferred_time || 'TBD',
          lessonType: lessonTypeObj?.name || 'Unknown',
          totalPrice: lessonTypeObj?.total_price ? lessonTypeObj.total_price.toString() : '0',
          parentName: parentsMap.get(booking.parent_id) || 'Unknown Parent',
          athleteNames: athleteNamesMap.get(booking.id) || [],
          athletes: athletesObjectMap.get(booking.id) || [],
          focusAreas: focusAreasMap.get(booking.id) || [],
          paymentStatus: booking.payment_status || 'unpaid',
          attendanceStatus: booking.attendance_status || 'pending'
        };
      });

    } catch (error) {
      console.error('Error in getUpcomingSessions:', error);
      return [];
    }
  }

  async updateBooking(id: number, data: Partial<Booking>): Promise<Booking | undefined> {
    // Map camelCase to snake_case for database update
    const dbUpdate: any = {};

    // Map all possible update fields
    if (data.status !== undefined) dbUpdate.status = data.status;
    if (data.paymentStatus !== undefined) dbUpdate.payment_status = data.paymentStatus;
    if (data.attendanceStatus !== undefined) dbUpdate.attendance_status = data.attendanceStatus;
    if (data.stripeSessionId !== undefined) dbUpdate.stripe_session_id = data.stripeSessionId;
    if (data.paidAmount !== undefined) dbUpdate.paid_amount = data.paidAmount;
    if (data.reservationFeePaid !== undefined) dbUpdate.reservation_fee_paid = data.reservationFeePaid;
    // Remove waiver fields - they're now in separate waivers table
    if (data.adminNotes !== undefined) dbUpdate.admin_notes = data.adminNotes;
    if (data.specialRequests !== undefined) dbUpdate.special_requests = data.specialRequests;
    // Add missing fields for reschedule functionality
    if (data.preferredDate !== undefined) dbUpdate.preferred_date = data.preferredDate;
    if (data.preferredTime !== undefined) dbUpdate.preferred_time = data.preferredTime;
    
    // Persist custom "Other" focus area text
    if (data.focusAreaOther !== undefined) {
      dbUpdate.focus_area_other = data.focusAreaOther;
    }

    // ENHANCED FIX: Make sure focusAreas are synchronized with the junction table
    if (data.focusAreas !== undefined) {
      console.log('🔧 [FOCUS SYNC] Processing focusAreas:', data.focusAreas);
      console.log('🔧 [FOCUS SYNC] Type of focusAreas:', typeof data.focusAreas);
      console.log('🔧 [FOCUS SYNC] Is array?', Array.isArray(data.focusAreas));

      // Normalize to array of strings
      const nextFocusAreas: string[] = Array.isArray(data.focusAreas)
        ? data.focusAreas.filter((x): x is string => typeof x === 'string')
        : [];

      // Always update legacy JSON for backward compatibility (includes any "Other: ..." entries)
      dbUpdate.focus_areas = nextFocusAreas;

      // Update the normalized relations in booking_focus_areas
      try {
        // Fetch all focus areas to map names -> ids
        const { data: allFa, error: faErr } = await supabaseAdmin
          .from('focus_areas')
          .select('id, name');
        if (faErr) {
          console.error('🔧 [FOCUS SYNC] Failed to fetch focus areas for mapping:', faErr);
        }

        const nameToId = new Map<string, number>();
        (allFa || []).forEach((fa: any) => nameToId.set(fa.name, fa.id));

        // Map provided names to IDs, skipping custom "Other:" entries and unknowns
        const mappedIds = nextFocusAreas
          .filter(name => !name.toLowerCase().startsWith('other:'))
          .map(name => nameToId.get(name))
          .filter((id): id is number => typeof id === 'number');

        // Replace existing relations with the new set (idempotent update)
        const { error: delErr } = await supabaseAdmin
          .from('booking_focus_areas')
          .delete()
          .eq('booking_id', id);
        if (delErr) {
          console.error('🔧 [FOCUS SYNC] Failed to delete existing booking_focus_areas:', delErr);
        }

        if (mappedIds.length > 0) {
          const inserts = mappedIds.map(fid => ({ booking_id: id, focus_area_id: fid }));
          const { error: insErr } = await supabaseAdmin
            .from('booking_focus_areas')
            .insert(inserts);
          if (insErr) {
            console.error('🔧 [FOCUS SYNC] Failed to insert booking_focus_areas:', insErr);
          }
        }
      } catch (focusSyncErr) {
        console.error('🔧 [FOCUS SYNC] Exception while syncing booking_focus_areas:', focusSyncErr);
      }
    }
    
    // Idempotent email tracking fields
    if (data.sessionConfirmationEmailSent !== undefined) dbUpdate.session_confirmation_email_sent = data.sessionConfirmationEmailSent;
    if (data.sessionConfirmationEmailSentAt !== undefined) dbUpdate.session_confirmation_email_sent_at = data.sessionConfirmationEmailSentAt;
    
    // Safety information fields
    if (data.dropoffPersonName !== undefined) dbUpdate.dropoff_person_name = data.dropoffPersonName;
    if (data.dropoffPersonRelationship !== undefined) dbUpdate.dropoff_person_relationship = data.dropoffPersonRelationship;
    if (data.dropoffPersonPhone !== undefined) dbUpdate.dropoff_person_phone = data.dropoffPersonPhone;
    if (data.pickupPersonName !== undefined) dbUpdate.pickup_person_name = data.pickupPersonName;
    if (data.pickupPersonRelationship !== undefined) dbUpdate.pickup_person_relationship = data.pickupPersonRelationship;
    if (data.pickupPersonPhone !== undefined) dbUpdate.pickup_person_phone = data.pickupPersonPhone;
    if (data.altPickupPersonName !== undefined) dbUpdate.alt_pickup_person_name = data.altPickupPersonName;
    if (data.altPickupPersonRelationship !== undefined) dbUpdate.alt_pickup_person_relationship = data.altPickupPersonRelationship;
    if (data.altPickupPersonPhone !== undefined) dbUpdate.alt_pickup_person_phone = data.altPickupPersonPhone;
    
    // Safety verification fields
    if (data.safetyVerificationSigned !== undefined) dbUpdate.safety_verification_signed = data.safetyVerificationSigned;
    if (data.safetyVerificationSignedAt !== undefined) dbUpdate.safety_verification_signed_at = data.safetyVerificationSignedAt;

    // Update the updated_at timestamp
    dbUpdate.updated_at = new Date().toISOString();

    console.log('💾 [STORAGE] updateBooking - incoming data:', JSON.stringify(data, null, 2));
    console.log('💾 [STORAGE] updateBooking - dbUpdate object:', JSON.stringify(dbUpdate, null, 2));
    console.log('💾 [STORAGE] updateBooking - focus_areas specifically:', dbUpdate.focus_areas);
    console.log('💾 [STORAGE] updateBooking - focus_areas type:', typeof dbUpdate.focus_areas);
    console.log('💾 [STORAGE] updateBooking - updating booking ID:', id);
    
    // Query existing booking to check current focus_areas in database
    const { data: existingData } = await supabaseAdmin
      .from('bookings')
      .select('focus_areas, id')
      .eq('id', id)
      .single();
      
    console.log('💾 [STORAGE] updateBooking - EXISTING focus_areas in DB:', existingData?.focus_areas);
    console.log('💾 [STORAGE] updateBooking - EXISTING focus_areas type:', typeof existingData?.focus_areas);

    const { data: updatedBooking, error } = await supabaseAdmin
      .from('bookings')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();

    console.log('💾 [STORAGE] updateBooking - Supabase response error:', error);
    console.log('💾 [STORAGE] updateBooking - Supabase response data:', JSON.stringify(updatedBooking, null, 2));
    console.log('💾 [STORAGE] updateBooking - returned focus_areas:', updatedBooking?.focus_areas);
    console.log('💾 [STORAGE] updateBooking - returned focus_areas type:', typeof updatedBooking?.focus_areas);

    if (error) {
      console.error('Error updating booking:', error);
      return undefined;
    }

    if (!updatedBooking) return undefined;

    // Map the response back to camelCase
    return this.mapBookingFromDb(updatedBooking);
  }

  async updateBookingStatus(id: number, status: BookingStatusEnum): Promise<Booking | undefined> {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking status:', error);
      return undefined;
    }

    return booking ? this.mapBookingFromDb(booking) : undefined;
  }

  // ===============================
  // Gym payout runs helpers
  // ===============================
  async upsertGymPayoutRun(periodStart: string, periodEnd: string) {
    // Compute totals from booking_athletes joined to bookings by preferred_date
    const { data, error } = await supabaseAdmin
      .from('booking_athletes')
      .select('id, gym_payout_owed_cents, bookings!inner(preferred_date)')
      .not('gym_payout_owed_cents', 'is', null)
      .gte('bookings.preferred_date', periodStart)
      .lte('bookings.preferred_date', periodEnd);

    if (error) {
      console.error('[PAYOUT RUN] Failed to load booking_athletes for period', periodStart, periodEnd, error);
      throw error;
    }
    const totalSessions = data?.length || 0;
    const totalOwedCents = (data || []).reduce((sum: number, r: any) => sum + (r.gym_payout_owed_cents || 0), 0);

    // Check existing run
    const { data: existing } = await supabaseAdmin
      .from('gym_payout_runs')
      .select('*')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .maybeSingle();

    const nowIso = new Date().toISOString();

    if (existing) {
      const { data: updated, error: updErr } = await supabaseAdmin
        .from('gym_payout_runs')
        .update({ total_sessions: totalSessions, total_owed_cents: totalOwedCents, updated_at: nowIso })
        .eq('id', existing.id)
        .select()
        .single();
      if (updErr) throw updErr;
      return updated;
    } else {
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from('gym_payout_runs')
        .insert({ period_start: periodStart, period_end: periodEnd, status: 'open', total_sessions: totalSessions, total_owed_cents: totalOwedCents, generated_at: nowIso, updated_at: nowIso })
        .select()
        .single();
      if (insErr) throw insErr;
      return inserted;
    }
  }

  async listGymPayoutRuns(limit = 12) {
    const { data, error } = await supabaseAdmin
      .from('gym_payout_runs')
      .select('*')
      .order('period_start', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  async lockGymPayoutRun(id: number) {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('gym_payout_runs')
      .update({ status: 'locked', updated_at: nowIso })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteGymPayoutRun(id: number) {
    const { error } = await supabaseAdmin
      .from('gym_payout_runs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  // Backfill payouts for completed sessions in a period where owed is still null
  async backfillGymPayouts(periodStart: string, periodEnd: string) {
    const results = { total: 0, updated: 0, skipped: 0 };
    try {
      // Load booking_athletes rows needing computation joined with bookings for date and status
      const { data: rows, error } = await supabaseAdmin
        .from('booking_athletes')
        .select('id, gym_member_at_booking, duration_minutes, gym_rate_applied_cents, gym_payout_override_cents, gym_payout_owed_cents, gym_payout_computed_at, bookings!inner(preferred_date, lesson_type_id)')
        .is('gym_payout_owed_cents', null)
        .gte('bookings.preferred_date', periodStart)
        .lte('bookings.preferred_date', periodEnd);
      if (error) throw error;
      const list = rows || [];
      results.total = list.length;
      for (const row of list as any[]) {
        // Skip only if owed already exists
        if (row.gym_payout_owed_cents != null) {
          results.skipped++;
          continue;
        }
        const isMember = !!row.gym_member_at_booking;
        let duration: number | null = row.duration_minutes ?? null;
        // Fallback: look up lesson type duration if missing
        if (duration == null && row.bookings?.lesson_type_id) {
          try {
            const { data: lt } = await supabaseAdmin
              .from('lesson_types')
              .select('duration_minutes')
              .eq('id', row.bookings.lesson_type_id)
              .maybeSingle();
            duration = lt?.duration_minutes ?? null;
          } catch (e) {
            console.warn('[PAYOUT BACKFILL] Could not resolve lesson type duration for row', row.id, e);
          }
        }
        const effectiveIso = row.bookings?.preferred_date || new Date().toISOString();
        let rateCents: number | null = null;
        if (row.gym_rate_applied_cents != null) {
          rateCents = row.gym_rate_applied_cents;
        } else if (duration != null) {
          const { data: rate } = await supabaseAdmin
            .from('gym_payout_rates')
            .select('rate_cents')
            .eq('duration_minutes', duration)
            .eq('is_member', isMember)
            .lte('effective_from', effectiveIso)
            .or('effective_to.is.null,effective_to.gte.' + effectiveIso)
            .order('effective_from', { ascending: false })
            .limit(1)
            .maybeSingle();
          rateCents = rate?.rate_cents ?? null;
        }

        const owed = row.gym_payout_override_cents ?? rateCents ?? null;
        if (owed != null) {
          const nowIso = new Date().toISOString();
          const { error: updErr } = await supabaseAdmin
            .from('booking_athletes')
            .update({
              gym_rate_applied_cents: rateCents ?? row.gym_rate_applied_cents ?? null,
              gym_payout_owed_cents: owed,
              gym_payout_computed_at: nowIso,
            })
            .eq('id', row.id);
          if (updErr) {
            console.error('[PAYOUT BACKFILL] Failed to update booking_athletes', row.id, updErr);
            results.skipped++;
          } else {
            results.updated++;
          }
        } else {
          console.warn('[PAYOUT BACKFILL] No rate resolved for row', row.id, { isMember, duration, effectiveIso });
          results.skipped++;
        }
      }
    } catch (e) {
      console.error('[PAYOUT BACKFILL] Exception:', e);
      throw e;
    }
    return results;
  }

  // Clear (reset) computed payouts for a period. Preserves any manual overrides.
  // Guard: if an existing payout run for this exact period is locked, refuse to clear.
  async clearGymPayouts(periodStart: string, periodEnd: string): Promise<{ total: number; updated: number; locked?: boolean }> {
    try {
      // Check run lock state for this exact period
      const { data: run } = await supabaseAdmin
        .from('gym_payout_runs')
        .select('id, status')
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .maybeSingle();
      if (run && run.status === 'locked') {
        console.warn('[PAYOUT CLEAR] Attempted to clear a locked payout run', { periodStart, periodEnd, runId: run.id });
        return { total: 0, updated: 0, locked: true };
      }

      // Collect booking_athletes IDs within period (joined on bookings.preferred_date)
      const { data: rows, error } = await supabaseAdmin
        .from('booking_athletes')
        .select('id, bookings!inner(preferred_date)')
        .gte('bookings.preferred_date', periodStart)
        .lte('bookings.preferred_date', periodEnd);
      if (error) throw error;
      const ids: number[] = (rows || []).map((r: any) => r.id);
      if (ids.length === 0) {
        // Also refresh or upsert the payout run to reflect zero totals
        try { await this.upsertGymPayoutRun(periodStart, periodEnd); } catch {}
        return { total: 0, updated: 0 };
      }

      // Chunk update to avoid IN() size limits
      const chunkSize = 500;
      let updated = 0;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const { data: upd, error: updErr } = await supabaseAdmin
          .from('booking_athletes')
          .update({
            gym_rate_applied_cents: null,
            gym_payout_owed_cents: null,
            gym_payout_computed_at: null,
          })
          .in('id', chunk)
          .select('id');
        if (updErr) {
          console.error('[PAYOUT CLEAR] Failed updating chunk', updErr);
          throw updErr;
        }
        updated += (upd || []).length;
      }

      // Refresh payout run totals for this period (will drop to 0 if all cleared)
      try {
        await this.upsertGymPayoutRun(periodStart, periodEnd);
      } catch (e) {
        console.warn('[PAYOUT CLEAR] upsertGymPayoutRun post-clear failed', e);
      }

      return { total: ids.length, updated };
    } catch (e) {
      console.error('[PAYOUT CLEAR] Exception:', e);
      throw e;
    }
  }

  async updateBookingPaymentStatus(id: number, paymentStatus: PaymentStatusEnum): Promise<Booking | undefined> {
    console.log('[STORAGE] Updating booking payment status:', { id, paymentStatus });
    
    // Determine if we should set reservation_fee_paid based on payment status
    const reservationFeePaid = 
      paymentStatus === PaymentStatusEnum.RESERVATION_PAID || 
      paymentStatus === PaymentStatusEnum.SESSION_PAID;
    
    const updateData: any = { 
      payment_status: paymentStatus
    };
    
    // Set reservation_fee_paid = true when appropriate
    if (reservationFeePaid) {
      updateData.reservation_fee_paid = true;
      console.log('[STORAGE] Setting reservation_fee_paid = true for status:', paymentStatus);
    }
    
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking payment status:', error);
      return undefined;
    }

    console.log('[STORAGE] Successfully updated booking payment status:', { id, paymentStatus });
    return booking ? this.mapBookingFromDb(booking) : undefined;
  }

  async updateBookingAttendanceStatus(id: number, attendanceStatus: AttendanceStatusEnum): Promise<Booking | undefined> {
    console.log('[STORAGE] Updating booking attendance status:', { id, attendanceStatus });
    
    // Enhanced logging for debugging
    console.log(`[STORAGE-DEBUG] UPDATING attendance_status to ${attendanceStatus} for booking ID ${id}`);
    
    // Use service role key for privileged operations to bypass RLS
  const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update({ attendance_status: attendanceStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking attendance status:', error);
      console.error('Supabase error details:', JSON.stringify(error));
      return undefined;
    }

    if (!booking) {
      console.error(`[STORAGE-ERROR] No booking returned after update for ID ${id}`);
      return undefined;
    }

    console.log(`[STORAGE] Successfully updated booking attendance status to "${attendanceStatus}" for ID ${id}`);

    // If lesson cancelled, auto-set booking status to cancelled
    if (attendanceStatus === AttendanceStatusEnum.CANCELLED) {
      try {
        console.log('[STORAGE] Auto-updating booking status to cancelled due to attendance cancellation', { id });
        await supabaseAdmin
          .from('bookings')
          .update({ status: BookingStatusEnum.CANCELLED })
          .eq('id', id);
        // Reflect in local object for return mapping
        (booking as any).status = BookingStatusEnum.CANCELLED;
      } catch (e) {
        console.error('[STORAGE] Failed to auto-update booking status to cancelled:', e);
      }
    }

    // If lesson completed, auto-set payment_status to session-paid (unless refunded)
    if (attendanceStatus === AttendanceStatusEnum.COMPLETED) {
      try {
        const isRefunded = (booking as any)?.payment_status?.includes('refunded');
        const alreadySessionPaid = (booking as any)?.payment_status === PaymentStatusEnum.SESSION_PAID;
        if (!isRefunded && !alreadySessionPaid) {
          console.log('[STORAGE] Auto-updating payment_status to session-paid due to attendance completion', { id });
          // Use existing helper to ensure reservation_fee_paid flagging consistency
          await this.updateBookingPaymentStatus(id, PaymentStatusEnum.SESSION_PAID);
          // Reflect in local object for return mapping
          (booking as any).payment_status = PaymentStatusEnum.SESSION_PAID;
        }
      } catch (e) {
        console.error('[STORAGE] Failed to auto-update payment_status to session-paid:', e);
      }
    }

  // When completed, compute gym payout owed per athlete exactly-once
    if (attendanceStatus === AttendanceStatusEnum.COMPLETED) {
      try {
        // Fetch booking_athletes rows for this booking
        const { data: baRows, error: baErr } = await supabaseAdmin
          .from('booking_athletes')
          .select('id, gym_member_at_booking, duration_minutes, gym_rate_applied_cents, gym_payout_owed_cents, gym_payout_override_cents, gym_payout_computed_at')
          .eq('booking_id', id);
        if (baErr) {
          console.error('[PAYOUT] Error loading booking_athletes for payout:', baErr);
        } else if (baRows && baRows.length > 0) {
          const nowIso = new Date().toISOString();
          for (const row of baRows) {
            // Idempotency: skip if already computed or override present
            if (row.gym_payout_computed_at || row.gym_payout_owed_cents != null) {
              continue;
            }
            const isMember = !!row.gym_member_at_booking;
            const duration = row.duration_minutes ?? null;
            let rateCents: number | null = null;
            if (row.gym_rate_applied_cents != null) {
              rateCents = row.gym_rate_applied_cents;
            } else if (duration != null) {
              // Resolve effective-dated rate for now()
              const { data: rate } = await supabaseAdmin
                .from('gym_payout_rates')
                .select('rate_cents')
                .eq('duration_minutes', duration)
                .eq('is_member', isMember)
                .lte('effective_from', nowIso)
                .or('effective_to.is.null,effective_to.gte.' + nowIso)
                .order('effective_from', { ascending: false })
                .limit(1)
                .single();
              rateCents = rate?.rate_cents ?? null;
            }

            const owed = row.gym_payout_override_cents ?? rateCents ?? null;
            if (owed != null) {
              const { error: updErr } = await supabaseAdmin
                .from('booking_athletes')
                .update({
                  gym_rate_applied_cents: rateCents ?? row.gym_rate_applied_cents ?? null,
                  gym_payout_owed_cents: owed,
                  gym_payout_computed_at: nowIso,
                })
                .eq('id', row.id);
              if (updErr) {
                console.error('[PAYOUT] Failed to set owed for booking_athletes id', row.id, updErr);
              }
            } else {
              console.warn('[PAYOUT] No rate found for booking_athletes id', row.id, { isMember, duration });
            }
          }
        }
      } catch (e) {
        console.error('[PAYOUT] Exception computing payouts:', e);
      }
    }

    return booking ? this.mapBookingFromDb(booking) : undefined;
  }

  // Atomically mark the session confirmation email as sent, only if not already sent (Supabase implementation)
  async markSessionConfirmationEmailSent(bookingId: number, sentAt: string): Promise<boolean> {
    this.logQuery('UPDATE', 'bookings', { id: bookingId, session_confirmation_email_sent: true });
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({
        session_confirmation_email_sent: true,
        session_confirmation_email_sent_at: sentAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('session_confirmation_email_sent', false)
      .select('id');

    if (error) {
      console.error('[STORAGE] Error marking email as sent (Supabase):', error);
      return false;
    }

    const updated = Array.isArray(data) ? data.length > 0 : !!data;
    return updated;
  }

  async deleteBooking(id: number): Promise<boolean> {
    try {
      // First delete related records in junction tables
      // 1. Delete booking-athlete associations
      const { error: athleteSlotError } = await supabaseAdmin
        .from('booking_athletes')
        .delete()
        .eq('booking_id', id);
        
      if (athleteSlotError) {
        console.error('Error deleting booking athlete slots:', athleteSlotError);
      }
      
      // 2. Delete booking-focus area associations
      const { error: focusAreaError } = await supabaseAdmin
        .from('booking_focus_areas')
        .delete()
        .eq('booking_id', id);
        
      if (focusAreaError) {
        console.error('Error deleting booking focus areas:', focusAreaError);
      }
      
      // 3. Delete booking-apparatus associations
      const { error: apparatusError } = await supabaseAdmin
        .from('booking_apparatus')
        .delete()
        .eq('booking_id', id);
        
      if (apparatusError) {
        console.error('Error deleting booking apparatus:', apparatusError);
      }
      
      // 4. Delete booking-side quest associations
      const { error: sideQuestError } = await supabaseAdmin
        .from('booking_side_quests')
        .delete()
        .eq('booking_id', id);
        
      if (sideQuestError) {
        console.error('Error deleting booking side quests:', sideQuestError);
      }
      
      // Finally delete the booking itself
      const { error } = await supabaseAdmin
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting booking:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in deleteBooking:', error);
      return false;
    }
  }

  // Payment Logs
  async createPaymentLog(log: { bookingId: number | null; stripeEvent: string | null; errorMessage: string | null }): Promise<void> {
    const { error } = await supabaseAdmin
      .from('payment_logs')
      .insert({
        booking_id: log.bookingId,
        stripe_event: log.stripeEvent,
        error_message: log.errorMessage
      });

    if (error) {
      console.error('Error creating payment log:', error);
    }
  }

  // Blog Posts
  async getAllBlogPosts(): Promise<BlogPost[]> {
    try {
      console.log('🔍 Attempting to fetch blog posts from Supabase...');

      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error fetching blog posts:', error);
        throw error;
      }

      console.log('✅ Successfully fetched blog posts:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching blog posts:', error);
      throw error;
    }
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    try {
      console.log(`🔍 Fetching blog post with ID: ${id}`);
      
      // Try with direct SQL query to debug the issue
      const { data: rawData, error: sqlError } = await supabase
        .rpc('get_blog_post_by_id', { post_id: id });
        
      if (sqlError) {
        console.error(`❌ SQL error fetching blog post with ID ${id}:`, sqlError);
        
        // Fallback to standard query
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error(`❌ Error fetching blog post with ID ${id}:`, error);
          
          // Try the fallback approach when direct query fails
          console.log(`🔄 Trying fallback with getAllBlogPosts for ID ${id}`);
          const allPosts = await this.getAllBlogPosts();
          const foundPost = allPosts.find(p => p.id === id);
          
          if (!foundPost) {
            console.log(`⚠️ No blog post found with ID ${id} in all posts`);
            return undefined;
          }
          
          console.log(`✅ Successfully found blog post with ID ${id} in all posts`);
          return foundPost;
        }

        if (!data) {
          console.log(`⚠️ No blog post found with ID ${id}`);
          return undefined;
        }
        
        console.log(`✅ Successfully fetched blog post with ID ${id} (standard query)`);
        return data;
      }
      
      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        console.log(`⚠️ No blog post found with ID ${id} (SQL query)`);
        
        // Try alternative approach by getting all posts and finding the one we want
        const allPosts = await this.getAllBlogPosts();
        const foundPost = allPosts.find(p => p.id === id);
        
        if (!foundPost) {
          console.log(`⚠️ No blog post found with ID ${id} in all posts`);
          return undefined;
        }
        
        console.log(`✅ Successfully found blog post with ID ${id} in all posts`);
        return foundPost;
      }
      
      console.log(`✅ Successfully fetched blog post with ID ${id} (SQL query)`);
      return rawData[0];
    } catch (error) {
      console.error(`❌ Unexpected error fetching blog post with ID ${id}:`, error);
      return undefined;
    }
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        title: insertPost.title,
        content: insertPost.content,
        excerpt: insertPost.excerpt,
        category: insertPost.category,
        sections: insertPost.sections ?? null,
        image_url: insertPost.imageUrl ?? null,
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }

    return data;
  }

  async updateBlogPost(id: number, insertPost: InsertBlogPost): Promise<BlogPost | undefined> {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .update({
        title: insertPost.title,
        content: insertPost.content,
        excerpt: insertPost.excerpt,
        category: insertPost.category,
        sections: insertPost.sections ?? null,
        image_url: insertPost.imageUrl ?? null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog post:', error);
      return undefined;
    }

    return data || undefined;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog post:', error);
      return false;
    }

    return true;
  }

  // Tips
  async getAllTips(): Promise<Tip[]> {
    try {
      console.log('🔍 Attempting to fetch tips from Supabase...');

      const { data, error } = await supabaseAdmin
        .from('tips')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error fetching tips:', error);
        throw error;
      }

      console.log('✅ Successfully fetched tips:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching tips:', error);
      return [];
    }
  }

  async getTip(id: number): Promise<Tip | undefined> {
    try {
      console.log(`🔍 Fetching tip with ID: ${id}`);
      
      // Try with direct SQL query to debug the issue
      const { data: rawData, error: sqlError } = await supabase
        .rpc('get_tip_by_id', { tip_id: id });
        
      if (sqlError) {
        console.error(`❌ SQL error fetching tip with ID ${id}:`, sqlError);
        
        // Fallback to standard query
        const { data, error } = await supabase
          .from('tips')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error(`❌ Error fetching tip with ID ${id}:`, error);
          
          // Try the fallback approach when direct query fails
          console.log(`🔄 Trying fallback with getAllTips for ID ${id}`);
          const allTips = await this.getAllTips();
          const foundTip = allTips.find(t => t.id === id);
          
          if (!foundTip) {
            console.log(`⚠️ No tip found with ID ${id} in all tips`);
            return undefined;
          }
          
          console.log(`✅ Successfully found tip with ID ${id} in all tips`);
          return foundTip;
        }

        if (!data) {
          console.log(`⚠️ No tip found with ID ${id}`);
          return undefined;
        }
        
        console.log(`✅ Successfully fetched tip with ID ${id} (standard query)`);
        return data;
      }
      
      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        console.log(`⚠️ No tip found with ID ${id} (SQL query)`);
        
        // Try alternative approach by getting all tips and finding the one we want
        const allTips = await this.getAllTips();
        const foundTip = allTips.find(t => t.id === id);
        
        if (!foundTip) {
          console.log(`⚠️ No tip found with ID ${id} in all tips`);
          return undefined;
        }
        
        console.log(`✅ Successfully found tip with ID ${id} in all tips`);
        return foundTip;
      }
      
      console.log(`✅ Successfully fetched tip with ID ${id} (SQL query)`);
      return rawData[0];
    } catch (error) {
      console.error(`❌ Unexpected error fetching tip with ID ${id}:`, error);
      return undefined;
    }
  }

  async createTip(insertTip: InsertTip): Promise<Tip> {
    const { data, error } = await supabaseAdmin
      .from('tips')
      .insert({
        title: insertTip.title,
        content: insertTip.content,
        sections: insertTip.sections ?? null,
        category: insertTip.category,
        difficulty: insertTip.difficulty,
        video_url: insertTip.videoUrl ?? null,
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tip:', error);
      throw error;
    }

    return data;
  }

  async updateTip(id: number, insertTip: InsertTip): Promise<Tip | undefined> {
    const { data, error } = await supabaseAdmin
      .from('tips')
      .update({
        title: insertTip.title,
        content: insertTip.content,
        sections: insertTip.sections ?? null,
        category: insertTip.category,
        difficulty: insertTip.difficulty,
        video_url: insertTip.videoUrl ?? null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tip:', error);
      return undefined;
    }

    return data || undefined;
  }

  async deleteTip(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('tips')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tip:', error);
      return false;
    }

    return true;
  }

  // Availability
  async getAllAvailability(): Promise<Availability[]> {
    const { data, error } = await supabaseAdmin
      .from('availability')
      .select('*')
      .order('day_of_week')
      .order('start_time');

    if (error) {
      console.error('Error fetching availability:', error);
      return [];
    }

    // Map snake_case back to camelCase for the response
    return (data || []).map(item => ({
      id: item.id,
      dayOfWeek: item.day_of_week,
      startTime: item.start_time,
      endTime: item.end_time,
      isRecurring: item.is_recurring,
      isAvailable: item.is_available,
      createdAt: new Date(item.created_at),
      tenantId: item.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    }));
  }

  async getAvailability(id: number): Promise<Availability | undefined> {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching availability:', error);
      return undefined;
    }

    // Map snake_case back to camelCase for the response
    return {
      id: data.id,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time,
      endTime: data.end_time,
      isRecurring: data.is_recurring,
      isAvailable: data.is_available,
      createdAt: new Date(data.created_at),
      tenantId: data.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    };
  }

  async createAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    // Map camelCase to snake_case for database insertion
    const dbData = {
      day_of_week: insertAvailability.dayOfWeek,
      start_time: insertAvailability.startTime,
      end_time: insertAvailability.endTime,
      is_recurring: insertAvailability.isRecurring ?? true,
      is_available: insertAvailability.isAvailable ?? true,
    };

    const { data, error } = await supabaseAdmin
      .from('availability')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Error creating availability:', error);
      throw new Error('Failed to create availability');
    }

    // Map snake_case back to camelCase for the response
    return {
      id: data.id,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time,
      endTime: data.end_time,
      isRecurring: data.is_recurring,
      isAvailable: data.is_available,
      createdAt: new Date(data.created_at),
      tenantId: data.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    };
  }

  async updateAvailability(id: number, insertAvailability: InsertAvailability): Promise<Availability | undefined> {
    // Map camelCase to snake_case for database update
    const dbData = {
      day_of_week: insertAvailability.dayOfWeek,
      start_time: insertAvailability.startTime,
      end_time: insertAvailability.endTime,
      is_recurring: insertAvailability.isRecurring ?? true,
      is_available: insertAvailability.isAvailable ?? true,
    };

    const { data, error } = await supabaseAdmin
      .from('availability')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating availability:', error);
      return undefined;
    }

    // Map snake_case back to camelCase for the response
    return {
      id: data.id,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time,
      endTime: data.end_time,
      isRecurring: data.is_recurring,
      isAvailable: data.is_available,
      createdAt: new Date(data.created_at),
      tenantId: data.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    };
  }

  async deleteAvailability(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('availability')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting availability:', error);
      return false;
    }

    return true;
  }

  // Availability Exceptions
  async getAllAvailabilityExceptions(): Promise<AvailabilityException[]> {
    const { data, error } = await supabaseAdmin
      .from('availability_exceptions')
      .select('*')
      .order('date')
      .order('start_time');

    if (error) {
      console.error('Error fetching availability exceptions:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      isAvailable: row.is_available,
      reason: row.reason,
      createdAt: row.created_at,
      title: row.title,
      category: row.category,
      notes: row.notes,
      allDay: row.all_day,
      addressLine1: row.address_line_1,
      addressLine2: row.address_line_2,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      country: row.country,
    }));
  }

  async getAvailabilityException(id: number): Promise<AvailabilityException | undefined> {
    const { data, error } = await supabase
      .from('availability_exceptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching availability exception:', error);
      return undefined;
    }

    if (!data) return undefined;
    return {
      id: data.id,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      isAvailable: data.is_available,
      reason: data.reason,
      createdAt: data.created_at,
      title: data.title,
      category: data.category,
      notes: data.notes,
      allDay: data.all_day,
      addressLine1: data.address_line_1,
      addressLine2: data.address_line_2,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code,
      country: data.country,
    };
  }

  async createAvailabilityException(insertException: InsertAvailabilityException): Promise<AvailabilityException> {
    // Map camelCase to snake_case for database
    const dbData = {
      date: insertException.date,
      start_time: insertException.startTime,
      end_time: insertException.endTime,
      is_available: insertException.isAvailable ?? false,
      reason: insertException.reason ?? null,
      title: insertException.title ?? null,
      category: insertException.category ?? null,
      notes: insertException.notes ?? null,
      all_day: insertException.allDay ?? false,
      address_line_1: insertException.addressLine1 ?? null,
      address_line_2: insertException.addressLine2 ?? null,
      city: insertException.city ?? null,
      state: insertException.state ?? null,
      zip_code: insertException.zipCode ?? null,
      country: insertException.country ?? 'United States'
    };

    const { data, error } = await supabaseAdmin
      .from('availability_exceptions')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Error creating availability exception:', error);
      throw new Error('Failed to create availability exception');
    }

    return {
      id: data.id,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      isAvailable: data.is_available,
      reason: data.reason,
      createdAt: data.created_at,
      title: data.title,
      category: data.category,
      notes: data.notes,
      allDay: data.all_day,
      addressLine1: data.address_line_1,
      addressLine2: data.address_line_2,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code,
      country: data.country,
    };
  }

  async updateAvailabilityException(id: number, insertException: InsertAvailabilityException): Promise<AvailabilityException | undefined> {
    const dbData = {
      date: insertException.date,
      start_time: insertException.startTime,
      end_time: insertException.endTime,
      is_available: insertException.isAvailable ?? false,
      reason: insertException.reason ?? null,
      title: insertException.title ?? null,
      category: insertException.category ?? null,
      notes: insertException.notes ?? null,
      all_day: insertException.allDay ?? false,
      address_line_1: insertException.addressLine1 ?? null,
      address_line_2: insertException.addressLine2 ?? null,
      city: insertException.city ?? null,
      state: insertException.state ?? null,
      zip_code: insertException.zipCode ?? null,
      country: insertException.country ?? 'United States'
    };
    const { data, error } = await supabaseAdmin
      .from('availability_exceptions')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating availability exception:', error);
      return undefined;
    }

    return {
      id: data.id,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      isAvailable: data.is_available,
      reason: data.reason,
      createdAt: data.created_at,
      title: data.title,
      category: data.category,
      notes: data.notes,
      allDay: data.all_day,
      addressLine1: data.address_line_1,
      addressLine2: data.address_line_2,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code,
      country: data.country,
    };
  }

  async deleteAvailabilityException(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('availability_exceptions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting availability exception:', error);
      return false;
    }

    return true;
  }

  async getAvailabilityExceptionsByDateRange(startDate: string, endDate: string): Promise<AvailabilityException[]> {
    // Convert dates to timestamp range for events query 
    const startTs = `${startDate}T00:00:00.000Z`;
    const endTs = `${endDate}T23:59:59.999Z`;
    
    // Query events that are availability blocks in the date range
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_availability_block', true)
      .eq('is_deleted', false)
      .gte('start_at', startTs)
      .lte('start_at', endTs)
      .order('start_at');

    if (error) {
      console.error('Error fetching availability blocking events:', error);
      return [];
    }

    // Convert events to AvailabilityException format
    const blockingEvents = (data || []).map(row => this.mapEventToAvailabilityException(row));
    
    // Also expand any recurring series that might have instances in this range
    const recurringEvents = await this.expandRecurringAvailabilityBlocks(startDate, endDate);
    
    // Combine and deduplicate
    const allBlocks = [...blockingEvents, ...recurringEvents];
    const uniqueBlocks = this.deduplicateAvailabilityBlocks(allBlocks);
    
    console.debug(`[AVAILABILITY EXCEPTIONS] getAvailabilityExceptionsByDateRange(${startDate}, ${endDate}) -> ${uniqueBlocks.length} blocking events`);
    return uniqueBlocks;
  }

  private mapEventToAvailabilityException(eventData: any): AvailabilityException {
    // Convert event timestamp to date and time components
    const startAt = new Date(eventData.start_at);
    const endAt = new Date(eventData.end_at);
    
    // Format date as YYYY-MM-DD in the event's timezone
    const date = startAt.toISOString().split('T')[0];
    
    // Extract time components (HH:MM format) or null for all-day
    const startTime = eventData.is_all_day ? null : 
      String(startAt.getUTCHours()).padStart(2, '0') + ':' + 
      String(startAt.getUTCMinutes()).padStart(2, '0');
    const endTime = eventData.is_all_day ? null :
      String(endAt.getUTCHours()).padStart(2, '0') + ':' + 
      String(endAt.getUTCMinutes()).padStart(2, '0');

    return {
      id: parseInt(eventData.id.replace(/-/g, ''), 16) % 2147483647, // Convert UUID to int for compatibility
      date,
      startTime,
      endTime,
      isAvailable: !eventData.is_availability_block, // If event blocks availability, slot is NOT available
      reason: eventData.blocking_reason || eventData.title || 'Blocked',
      createdAt: eventData.created_at,
      title: eventData.title,
      category: null, // Events don't have categories yet
      notes: eventData.notes,
      allDay: eventData.is_all_day,
      addressLine1: null, // Events don't have address fields yet
      addressLine2: null,
      city: null,
      state: null,
      zipCode: null,
      country: null,
    };
  }

  private async expandRecurringAvailabilityBlocks(startDate: string, endDate: string): Promise<AvailabilityException[]> {
    // Query recurring availability blocking events that might have instances in range
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_availability_block', true)
      .eq('is_deleted', false)
      .not('recurrence_rule', 'is', null);

    if (error) {
      console.error('Error fetching recurring availability blocking events:', error);
      return [];
    }

    const expandedBlocks: AvailabilityException[] = [];
    
    for (const eventData of data || []) {
      // Convert DB row to Event type and use our recurrence expansion
      const event = this.mapEventFromDb(eventData);
      const { expandSeriesForRange } = await import('./recurrence');
      const instances = expandSeriesForRange([event], startDate, endDate);
      
      // Convert each instance to AvailabilityException format
      for (const instance of instances) {
        expandedBlocks.push(this.mapEventToAvailabilityException({
          ...eventData,
          start_at: instance.startAt.toISOString(),
          end_at: instance.endAt.toISOString(),
          is_all_day: instance.isAllDay,
        }));
      }
    }

    return expandedBlocks;
  }

  private mapEventFromDb(data: any): Event {
    return {
      id: data.id,
      seriesId: data.series_id,
      parentEventId: data.parent_event_id,
      title: data.title || '',
      notes: data.notes,
      location: data.location,
      isAllDay: data.is_all_day || false,
      timezone: data.timezone || 'America/Los_Angeles',
      startAt: new Date(data.start_at),
      endAt: new Date(data.end_at),
      recurrenceRule: data.recurrence_rule,
      recurrenceEndAt: data.recurrence_end_at ? new Date(data.recurrence_end_at) : null,
      recurrenceExceptions: data.recurrence_exceptions || [],
      isAvailabilityBlock: data.is_availability_block || false,
      blockingReason: data.blocking_reason,
      category: data.category,
      addressLine1: data.address_line_1,
      addressLine2: data.address_line_2,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code,
      country: data.country,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      isDeleted: data.is_deleted || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private deduplicateAvailabilityBlocks(blocks: AvailabilityException[]): AvailabilityException[] {
    const seen = new Set<string>();
    return blocks.filter(block => {
      const key = `${block.date}_${block.startTime}_${block.endTime}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Admin methods
  private mapAdminFromDb(data: any): Admin {
    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at)
    };
  }

  async getAllAdmins(): Promise<Admin[]> {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*');

    if (error) {
      console.error('Error fetching admins:', error);
      return [];
    }

    return (data || []).map(admin => this.mapAdminFromDb(admin));
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching admin:', error);
      return undefined;
    }

    return data ? this.mapAdminFromDb(data) : undefined;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    // Map camelCase to snake_case for database
    const dbAdmin = {
      email: admin.email,
      password_hash: admin.passwordHash
    };

    const { data, error } = await supabaseAdmin
      .from('admins')
      .insert(dbAdmin)
      .select()
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      throw error;
    }

    return this.mapAdminFromDb(data);
  }

  async getAdmin(id: number): Promise<Admin | undefined> {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching admin:', error);
      return undefined;
    }

    return data ? this.mapAdminFromDb(data) : undefined;
  }

  // Waiver methods
  async createWaiver(waiver: InsertWaiver): Promise<Waiver> {
    console.log('🔍 Creating waiver with data:', JSON.stringify(waiver, null, 2));

    try {
      // Direct insert (RPC method deprecated since athlete_name/signer_name columns were removed)
      const dbWaiver: any = {
        relationship_to_athlete: waiver.relationshipToAthlete,
        signature: waiver.signature,
        emergency_contact_number: waiver.emergencyContactNumber,
        understands_risks: waiver.understandsRisks,
        agrees_to_policies: waiver.agreesToPolicies,
        authorizes_emergency_care: waiver.authorizesEmergencyCare,
        allows_photo_video: waiver.allowsPhotoVideo,
        confirms_authority: waiver.confirmsAuthority,
        signed_at: waiver.signedAt ? 
          (waiver.signedAt instanceof Date ? waiver.signedAt.toISOString() : new Date(waiver.signedAt as string).toISOString()) : 
          new Date().toISOString()
      };

      // Only add optional fields if they exist
      if (waiver.bookingId) dbWaiver.booking_id = waiver.bookingId;
      if (waiver.athleteId) dbWaiver.athlete_id = waiver.athleteId;
      if (waiver.parentId) dbWaiver.parent_id = waiver.parentId;
      if (waiver.pdfPath) dbWaiver.pdf_path = waiver.pdfPath;
      if (waiver.ipAddress) dbWaiver.ip_address = waiver.ipAddress;
      if (waiver.userAgent) dbWaiver.user_agent = waiver.userAgent;

      console.log('📝 Inserting waiver with fields:', Object.keys(dbWaiver));

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('waivers')
        .insert(dbWaiver)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating waiver:', insertError);
        throw new Error(`Failed to create waiver: ${insertError.message}`);
      }

      const createdWaiver = this.mapWaiverFromDb(insertData);
      console.log('💎 Waiver created successfully with ID:', createdWaiver.id);

      // ✅ AUTOMATICALLY UPDATE ATHLETE'S WAIVER_SIGNED STATUS
      console.log('🚨 CHECKING ATHLETE UPDATE LOGIC - athleteId:', waiver.athleteId);
      if (waiver.athleteId) {
        console.log('🏃‍♂️ Updating athlete waiver_signed status to true for athleteId:', waiver.athleteId);
        try {
          const updateResult = await this.updateAthlete(waiver.athleteId, {
            waiverSigned: true,
            waiverStatus: 'signed',
            latestWaiverId: createdWaiver.id
          });
          console.log('✅ Successfully updated athlete waiver status:', updateResult);
        } catch (updateError) {
          console.error('❌ Error updating athlete waiver status:', updateError);
          // Don't throw here - waiver was created successfully, athlete update is secondary
        }
      } else {
        console.log('⚠️ No athleteId found in waiver data - skipping athlete update');
      }

      return createdWaiver;
    } catch (error) {
      console.error('Error in createWaiver:', error);
      throw new Error('Failed to create waiver');
    }
  }

  private mapWaiverFromDb(data: any): Waiver {
    if (!data) throw new Error('No data returned from waiver creation');

    // Map snake_case back to camelCase for return
    return {
      id: data.id,
      bookingId: data.booking_id,
      athleteId: data.athlete_id,
      parentId: data.parent_id,
      athleteName: data.athlete_name || 'Unknown Athlete',
      signerName: data.signer_name || 'Unknown Signer',
      relationshipToAthlete: data.relationship_to_athlete,
      signature: data.signature,
      emergencyContactNumber: data.emergency_contact_number,
      understandsRisks: data.understands_risks,
      agreesToPolicies: data.agrees_to_policies,
      authorizesEmergencyCare: data.authorizes_emergency_care,
      allowsPhotoVideo: data.allows_photo_video,
      confirmsAuthority: data.confirms_authority,
      pdfPath: data.pdf_path,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      signedAt: new Date(data.signed_at),
      emailSentAt: data.email_sent_at ? new Date(data.email_sent_at) : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      tenantId: data.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    };
  }

  async getWaiver(id: number): Promise<Waiver | undefined> {
    // First try: relationship-based select (may fail if FK alias names differ)
    let data: any | null = null;
    let error: any | null = null;
    try {
      const resp = await supabaseAdmin
        .from('waivers')
        .select(`
          *,
          athletes!fk_waivers_athlete (
            first_name,
            last_name
          ),
          parents!fk_waivers_parent (
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .single();
      data = resp.data;
      error = resp.error;
    } catch (e) {
      error = e;
    }

    if (error) {
      console.warn('getWaiver: relationship select failed (possible RLS or alias issue). Retrying with plain select. Error:', error);
      // Fallback: plain select without relationships
      const fallback = await supabaseAdmin
        .from('waivers')
        .select('*')
        .eq('id', id)
        .single();
      if (fallback.error) {
        console.error('getWaiver: plain select also failed:', fallback.error);
        return undefined;
      }
      data = fallback.data;
      if (!data) return undefined;
      return this.mapWaiverFromDb(data);
    }

    if (!data) return undefined;

    const athlete = (data as any).athletes;
    const parent = (data as any).parents;

    return this.mapWaiverFromDb({
      ...data,
      athlete_name: athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Unknown Athlete',
      signer_name: parent ? `${parent.first_name} ${parent.last_name}` : 'Unknown Signer'
    });
  }

  async getWaiverByAthleteId(athleteId: number): Promise<Waiver | undefined> {
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .eq('athlete_id', athleteId)
      .single();

    if (error) {
      console.error('Error fetching waiver by athlete ID:', error);
      return undefined;
    }

    return data;
  }

  async getWaiverByBookingId(bookingId: number): Promise<Waiver | undefined> {
    const { data, error } = await supabase
      .from('waivers')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching waiver by booking ID:', error);
      return undefined;
    }

    return data;
  }

  async getAllWaivers(): Promise<Waiver[]> {
    const { data, error } = await supabaseAdmin
      .from('waivers')
      .select(`
        *,
        athletes!fk_waivers_athlete (
          first_name,
          last_name
        ),
        parents!fk_waivers_parent (
          first_name,
          last_name
        )
      `)
      .order('signed_at', { ascending: false });

    if (error) {
      console.error('Error fetching waivers:', error);
      throw new Error('Failed to fetch waivers');
    }

    if (!data) return [];

    // Map all waivers from snake_case to camelCase with joined data
    return data.map((waiver: any) => {
      const athlete = waiver.athletes;
      const parent = waiver.parents;
      
      return this.mapWaiverFromDb({
        ...waiver,
        athlete_name: athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Unknown Athlete',
        signer_name: parent ? `${parent.first_name} ${parent.last_name}` : 'Unknown Signer'
      });
    });
  }


  // Events (recurrence series) - Supabase implementation
  async listEventsByRange(startIso: string, endIso: string): Promise<Event[]> {
    // For now, return all non-deleted rows; range filtering can be added later
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_deleted', false)
      .order('start_at', { ascending: true });

    if (error) {
      console.error('Error listing events:', error);
      throw new Error('Failed to list events');
    }
    return (data || []) as unknown as Event[];
  }

  async createEvent(input: InsertEvent): Promise<Event> {
    const insertData: any = {
      // Map camelCase to snake_case where needed
      id: input.id,
      series_id: (input.seriesId as any) || input.id,
      parent_event_id: (input.parentEventId as any) ?? null,
      title: input.title ?? '',
      notes: (input as any).notes ?? null,
      location: (input as any).location ?? null,
      // Address fields
      address_line_1: (input as any).addressLine1 ?? null,
      address_line_2: (input as any).addressLine2 ?? null,
      city: (input as any).city ?? null,
      state: (input as any).state ?? null,
      zip_code: (input as any).zipCode ?? null,
      country: (input as any).country ?? 'United States',
      is_all_day: input.isAllDay ?? false,
      timezone: input.timezone ?? 'America/Los_Angeles',
      start_at: input.startAt as any,
      end_at: input.endAt as any,
      recurrence_rule: (input as any).recurrenceRule ?? null,
      recurrence_end_at: (input as any).recurrenceEndAt ?? null,
      recurrence_exceptions: (input as any).recurrenceExceptions ?? [],
      is_availability_block: (input as any).isAvailabilityBlock ?? false,
      blocking_reason: (input as any).blockingReason ?? null,
      created_by: (input as any).createdBy ?? null,
      updated_by: (input as any).updatedBy ?? null,
      is_deleted: (input as any).isDeleted ?? false,
    };

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
    return data as unknown as Event;
  }

  async updateEvent(id: string, input: Partial<InsertEvent>): Promise<Event | undefined> {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (input.seriesId !== undefined) updateData.series_id = input.seriesId as any;
    if (input.parentEventId !== undefined) updateData.parent_event_id = input.parentEventId as any;
    if (input.title !== undefined) updateData.title = input.title;
    if ((input as any).notes !== undefined) updateData.notes = (input as any).notes;
    if ((input as any).location !== undefined) updateData.location = (input as any).location;
    // Address fields
    if ((input as any).addressLine1 !== undefined) updateData.address_line_1 = (input as any).addressLine1;
    if ((input as any).addressLine2 !== undefined) updateData.address_line_2 = (input as any).addressLine2;
    if ((input as any).city !== undefined) updateData.city = (input as any).city;
    if ((input as any).state !== undefined) updateData.state = (input as any).state;
    if ((input as any).zipCode !== undefined) updateData.zip_code = (input as any).zipCode;
    if ((input as any).country !== undefined) updateData.country = (input as any).country;
    if (input.isAllDay !== undefined) updateData.is_all_day = input.isAllDay;
    if (input.timezone !== undefined) updateData.timezone = input.timezone;
    if (input.startAt !== undefined) updateData.start_at = input.startAt as any;
    if (input.endAt !== undefined) updateData.end_at = input.endAt as any;
    if ((input as any).recurrenceRule !== undefined) updateData.recurrence_rule = (input as any).recurrenceRule;
    if ((input as any).recurrenceEndAt !== undefined) updateData.recurrence_end_at = (input as any).recurrenceEndAt;
    if ((input as any).recurrenceExceptions !== undefined) updateData.recurrence_exceptions = (input as any).recurrenceExceptions;
    if ((input as any).isAvailabilityBlock !== undefined) updateData.is_availability_block = (input as any).isAvailabilityBlock;
    if ((input as any).blockingReason !== undefined) updateData.blocking_reason = (input as any).blockingReason;
    if ((input as any).createdBy !== undefined) updateData.created_by = (input as any).createdBy;
    if ((input as any).updatedBy !== undefined) updateData.updated_by = (input as any).updatedBy;
    if ((input as any).isDeleted !== undefined) updateData.is_deleted = (input as any).isDeleted;

    const { data, error } = await supabaseAdmin
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event');
    }
    return (data || undefined) as unknown as Event | undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    // Legacy method - defaults to "all" mode for backward compatibility
    return this.deleteEventWithMode(id, 'all');
  }

  async deleteEventWithMode(id: string, mode: 'this' | 'future' | 'all', instanceDate?: string): Promise<boolean> {
    // Extract base UUID from composite ID (for recurring event instances)
    // Format: "uuid:timestamp" -> "uuid"
    const baseId = id.includes(':') ? id.split(':')[0] : id;
    
    console.log(`🗑️ [SUPABASE] Delete mode: ${mode}, baseId: ${baseId}, instanceDate: ${instanceDate}`);

    try {
      if (mode === 'all') {
        // Delete entire series: soft delete master + all overrides
        const { error: masterError } = await supabaseAdmin
          .from('events')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', baseId);

        if (masterError) {
          console.error('Error deleting master event:', masterError);
          return false;
        }

        // Get the series_id to delete all overrides
        const { data: masterEvent } = await supabaseAdmin
          .from('events')
          .select('series_id')
          .eq('id', baseId)
          .single();

        if (masterEvent?.series_id) {
          const { error: overridesError } = await supabaseAdmin
            .from('events')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('series_id', masterEvent.series_id)
            .not('parent_event_id', 'is', null);

          if (overridesError) {
            console.error('Error deleting override events:', overridesError);
          }
        }

      } else if (mode === 'future' && instanceDate) {
        // Delete this and future: set recurrence end date before this instance
        const endDate = new Date(instanceDate);
        endDate.setSeconds(endDate.getSeconds() - 1); // 1 second before instance

        const { error: masterError } = await supabaseAdmin
          .from('events')
          .update({ 
            recurrence_end_at: endDate.toISOString(), 
            updated_at: new Date().toISOString() 
          })
          .eq('id', baseId);

        if (masterError) {
          console.error('Error updating recurrence end date:', masterError);
          return false;
        }

        // Get the series_id to delete future overrides
        const { data: masterEvent } = await supabaseAdmin
          .from('events')
          .select('series_id')
          .eq('id', baseId)
          .single();

        if (masterEvent?.series_id) {
          const { error: overridesError } = await supabaseAdmin
            .from('events')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('series_id', masterEvent.series_id)
            .not('parent_event_id', 'is', null)
            .gte('start_at', instanceDate);

          if (overridesError) {
            console.error('Error deleting future override events:', overridesError);
          }
        }

      } else if (mode === 'this' && instanceDate) {
        // Normalize truncated instanceDate forms before processing
        let normalizedInstanceDate = instanceDate;
        if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}$/.test(normalizedInstanceDate)) {
          normalizedInstanceDate = normalizedInstanceDate + ':00:00.000Z';
        } else if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(normalizedInstanceDate)) {
          normalizedInstanceDate = normalizedInstanceDate + ':00.000Z';
        } else if (/Z$/.test(normalizedInstanceDate) === false && /^[0-9]{4}-/.test(normalizedInstanceDate) && normalizedInstanceDate.length === 19) {
          normalizedInstanceDate = normalizedInstanceDate + '.000Z';
        }
        if (normalizedInstanceDate !== instanceDate) {
          console.log('⚠️ [SUPABASE] Normalized truncated instanceDate', { original: instanceDate, normalized: normalizedInstanceDate });
          instanceDate = normalizedInstanceDate;
        }
        // Delete only this instance: add to recurrence exceptions
        console.log(`🗑️ [SUPABASE] Mode 'this' - adding exception for ${instanceDate} to event ${baseId}`);
        
        // First get the current event to read existing exceptions
        const { data: currentEvent, error: fetchError } = await supabaseAdmin
          .from('events')
          .select('recurrence_exceptions, recurrence_rule')
          .eq('id', baseId)
          .single();

        if (fetchError) {
          console.error('🚨 [SUPABASE] Error fetching current event:', fetchError);
          return false;
        }

        console.log(`🗑️ [SUPABASE] Current event:`, {
          id: baseId,
          recurrenceRule: currentEvent?.recurrence_rule,
          currentExceptions: currentEvent?.recurrence_exceptions
        });

        // Only add exception if this is actually a recurring event
        if (!currentEvent?.recurrence_rule) {
          console.log(`🗑️ [SUPABASE] Non-recurring event - should not use 'this' mode`);
          return false;
        }

        const currentExceptions = Array.isArray(currentEvent?.recurrence_exceptions) 
          ? currentEvent.recurrence_exceptions 
          : [];
        
        if (!currentExceptions.includes(instanceDate)) {
          const newExceptions = [...currentExceptions, instanceDate];
          
          console.log(`🗑️ [SUPABASE] Updating exceptions from:`, currentExceptions, `to:`, newExceptions);
          
          const { error: updateError } = await supabaseAdmin
            .from('events')
            .update({ 
              recurrence_exceptions: newExceptions, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', baseId);

          if (updateError) {
            console.error('🚨 [SUPABASE] Error updating recurrence exceptions:', updateError);
            return false;
          }
          
          console.log(`✅ [SUPABASE] Successfully added exception ${instanceDate} to event ${baseId}`);
        } else {
          console.log(`🗑️ [SUPABASE] Exception ${instanceDate} already exists for event ${baseId}`);
        }

        // If there's an override for this specific instance, delete it
        const { data: masterEvent } = await supabaseAdmin
          .from('events')
          .select('series_id')
          .eq('id', baseId)
          .single();

        if (masterEvent?.series_id) {
          // Delete overrides that match this instance time (within 1 minute tolerance)
          const targetTime = new Date(instanceDate).getTime();
          const { data: overrides } = await supabaseAdmin
            .from('events')
            .select('id, start_at')
            .eq('series_id', masterEvent.series_id)
            .not('parent_event_id', 'is', null)
            .eq('is_deleted', false);

          if (overrides) {
            for (const override of overrides) {
              const overrideTime = new Date(override.start_at).getTime();
              if (Math.abs(overrideTime - targetTime) < 60000) { // Within 1 minute
                await supabaseAdmin
                  .from('events')
                  .update({ is_deleted: true, updated_at: new Date().toISOString() })
                  .eq('id', override.id);
              }
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error in deleteEventWithMode:', error);
      return false;
    }
  }

  async updateWaiver(id: number, waiver: Partial<InsertWaiver>): Promise<Waiver | undefined> {
    const { data, error } = await supabaseAdmin
      .from('waivers')
      .update(waiver)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating waiver:', error);
      throw error;
    }

    // Return mapped waiver for consistency
    return this.getWaiver(id);
  }

  async updateWaiverPdfPath(id: number, pdfPath: string): Promise<Waiver | undefined> {
    const { data, error } = await supabaseAdmin
      .from('waivers')
      .update({ pdf_path: pdfPath })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating waiver PDF path:', error);
      throw error;
    }

    // Return mapped waiver with updated path
    return this.getWaiver(id);
  }

  async updateWaiverEmailSent(id: number): Promise<Waiver | undefined> {
    // Use admin client to bypass RLS and avoid single-row selection errors
    const { error } = await supabaseAdmin
      .from('waivers')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating waiver email sent:', error);
      return undefined;
    }

    // Fetch and return the updated waiver for consistency
    return this.getWaiver(id);
  }

  // Parent auth methods
  async getParentById(id: number): Promise<Parent | undefined> {
    const { data, error } = await supabaseAdmin
      .from('parents')
  .select('id, first_name, last_name, email, phone, emergency_contact_name, emergency_contact_phone, created_at, updated_at, password_hash, is_verified, blog_emails, last_login_at, tenant_id')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching parent by ID:', error);
      return undefined;
    }

    // Transform snake_case to camelCase
    return data ? {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      passwordHash: data.password_hash || null,
      isVerified: data.is_verified || false,
      blogEmails: data.blog_emails || false,
      lastLoginAt: data.last_login_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
  tenantId: data.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',
    } : undefined;
  }

  async getParent(id: number): Promise<Parent | undefined> {
    return this.getParentById(id);
  }

  async createParentAuthCode(authCode: InsertParentAuthCode): Promise<ParentAuthCode> {
    // Map camelCase to snake_case for Supabase
    const supabaseData = {
      email: authCode.email,
      code: authCode.code,
      expires_at: authCode.expiresAt,
      used: authCode.used || false,
      used_at: null, // usedAt property doesn't exist in schema
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('parent_auth_codes')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error('Error creating parent auth code:', error);
      throw new Error('Failed to create parent auth code');
    }

    return data;
  }

  async getParentAuthCode(email: string, code: string): Promise<ParentAuthCode | undefined> {
    const { data, error } = await supabase
      .from('parent_auth_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching parent auth code:', error);
      return undefined;
    }

    return data;
  }

  async deleteParentAuthCode(email: string): Promise<boolean> {
    const { error } = await supabase
      .from('parent_auth_codes')
      .delete()
      .eq('email', email);

    if (error) {
      console.error('Error deleting parent auth code:', error);
      return false;
    }

    return true;
  }

  async markAuthCodeAsUsed(id: number): Promise<void> {
    const { error } = await supabase
      .from('parent_auth_codes')
      .update({ used: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking auth code as used:', error);
    }
  }
  async cleanupExpiredAuthCodes(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { error } = await supabase
      .from('parent_auth_codes')
      .delete()
      .or(`used.eq.true,created_at.lt.${oneHourAgo.toISOString()}`);

    if (error) {
      console.error('Error cleaning up expired auth codes:', error);
    }
  }

  // Slot reservation methods
  async getActiveReservations(date: string): Promise<{ startTime: string; lessonType: string }[]> {
    const { data, error } = await supabase
      .from('slot_reservations')
      .select('start_time, lesson_type')
      .eq('date', date)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching active reservations:', error);
      return [];
    }

    return (data || []).map(r => ({
      startTime: r.start_time,
      lessonType: r.lesson_type
    }));
  }

  async reserveSlot(date: string, startTime: string, lessonType: string, sessionId: string): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const { error } = await supabase
        .from('slot_reservations')
        .insert({
          date,
          start_time: startTime,
          lesson_type: lessonType,
          session_id: sessionId,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        console.error('Error reserving slot:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error reserving slot:', error);
      return false;
    }
  }

  async releaseSlot(date: string, startTime: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('slot_reservations')
        .delete()
        .eq('date', date)
        .eq('start_time', startTime);

      if (error) {
        console.error('Error releasing slot:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error releasing slot:', error);
      return false;
    }
  }

  async cleanupExpiredReservations(): Promise<void> {
    const { error } = await supabase
      .from('slot_reservations')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning up expired reservations:', error);
    }
  }

  // Archived waiver methods
  async getAllArchivedWaivers(): Promise<ArchivedWaiver[]> {
    const { data, error } = await supabase
      .from('archived_waivers')
      .select('*')
      .order('archived_at', { ascending: false });

    if (error) {
      console.error('Error fetching archived waivers:', error);
      return [];
    }

    return data || [];
  }

  async createArchivedWaiver(waiver: InsertArchivedWaiver): Promise<ArchivedWaiver> {
    const { data, error } = await supabase
      .from('archived_waivers')
      .insert({
        original_waiver_id: waiver.originalWaiverId,
        athlete_name: waiver.athleteName,
        signer_name: waiver.signerName,
        relationship_to_athlete: waiver.relationshipToAthlete,
        signature: waiver.signature,
        emergency_contact_number: waiver.emergencyContactNumber,
        understands_risks: waiver.understandsRisks,
  tenant_id: (waiver as any).tenantId || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',
        authorizes_emergency_care: waiver.authorizesEmergencyCare,
        allows_photo_video: waiver.allowsPhotoVideo,
        confirms_authority: waiver.confirmsAuthority,
        pdf_path: waiver.pdfPath,
        ip_address: waiver.ipAddress,
        user_agent: waiver.userAgent,
        signed_at: waiver.signedAt,
        email_sent_at: waiver.emailSentAt,
        archived_at: waiver.archivedAt || new Date(),
        archive_reason: waiver.archiveReason,
        legal_retention_period: waiver.legalRetentionPeriod,
        original_parent_id: waiver.originalParentId,
        original_athlete_id: waiver.originalAthleteId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating archived waiver:', error);
      throw new Error('Failed to create archived waiver');
    }

    return data;
  }

  async deleteArchivedWaiver(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('archived_waivers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting archived waiver:', error);
      return false;
    }

    return true;
  }

  async archiveWaiver(waiverId: number, reason: string): Promise<ArchivedWaiver | undefined> {
    // First get the original waiver
    const originalWaiver = await this.getWaiver(waiverId);
    if (!originalWaiver) {
      return undefined;
    }

    // Get athlete and parent data for names if missing
    let athleteName = originalWaiver.athleteName;
    let signerName = originalWaiver.signerName;
    
    if (!athleteName || !signerName) {
      const [athlete, parent] = await Promise.all([
        this.getAthlete(originalWaiver.athleteId),
        this.getParentById(originalWaiver.parentId)
      ]);
      
      if (!athleteName) {
        athleteName = athlete ? 
          `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim() || athlete.name || 'Unknown Athlete' :
          'Unknown Athlete';
      }
      
      if (!signerName) {
        signerName = parent ? 
          `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || 'Unknown Parent' :
          'Unknown Parent';
      }
    }

    // Create archived waiver
    const archivedWaiver = await this.createArchivedWaiver({
      originalWaiverId: originalWaiver.id,
      athleteName: athleteName || 'Unknown Athlete',
      signerName: signerName,
      relationshipToAthlete: originalWaiver.relationshipToAthlete || 'Parent/Guardian',
      signature: originalWaiver.signature,
      emergencyContactNumber: originalWaiver.emergencyContactNumber,
      understandsRisks: originalWaiver.understandsRisks ?? false,
      agreesToPolicies: originalWaiver.agreesToPolicies ?? false,
      authorizesEmergencyCare: originalWaiver.authorizesEmergencyCare ?? false,
      allowsPhotoVideo: originalWaiver.allowsPhotoVideo ?? true,
      confirmsAuthority: originalWaiver.confirmsAuthority ?? false,
      pdfPath: originalWaiver.pdfPath,
      ipAddress: originalWaiver.ipAddress,
      userAgent: originalWaiver.userAgent,
      signedAt: originalWaiver.signedAt || new Date(),
      emailSentAt: originalWaiver.emailSentAt,
      archivedAt: new Date(),
      archiveReason: reason,
      legalRetentionPeriod: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 years
      originalParentId: originalWaiver.parentId,
      originalAthleteId: originalWaiver.athleteId
    });

    return archivedWaiver;
  }

  // Normalized Lookup Tables Implementation
  async getAllApparatus(): Promise<Apparatus[]> {
    const { data, error } = await supabaseAdmin
      .from('apparatus')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching apparatus:', error);
      return [];
    }

    return data || [];
  }

  async createApparatus(apparatus: InsertApparatus): Promise<Apparatus> {
    const { data, error } = await supabaseAdmin
      .from('apparatus')
      .insert({
        name: apparatus.name,
        sort_order: apparatus.sortOrder || 0
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create apparatus');
    }

    return data;
  }

  async updateApparatus(id: number, apparatus: Partial<InsertApparatus>): Promise<Apparatus | undefined> {
    const { data, error } = await supabase
      .from('apparatus')
      .update({
        name: apparatus.name,
        sort_order: apparatus.sortOrder
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating apparatus:', error);
      return undefined;
    }

    return data;
  }

  async deleteApparatus(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('apparatus')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting apparatus:', error);
      return false;
    }

    return true;
  }

  async getAllFocusAreas(): Promise<FocusArea[]> {
    const { data, error } = await supabaseAdmin
      .from('focus_areas')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching focus areas:', error);
      return [];
    }

    return data || [];
  }

  async getFocusAreasByApparatus(apparatusId: number): Promise<FocusArea[]> {
    const { data, error } = await supabase
      .from('focus_areas')
      .select('*')
      .eq('apparatus_id', apparatusId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching focus areas by apparatus:', error);
      return [];
    }
    return data || [];
  }
  
  async getFocusAreasByLevel(level: string): Promise<FocusArea[]> {
    // For 'beginner' level, we only return beginner focus areas
    // For 'intermediate' level, we return beginner and intermediate focus areas
    // For 'advanced' level, we return all focus areas
    let query = supabase.from('focus_areas').select('*');
    
    if (level === 'beginner') {
      query = query.eq('level', 'beginner');
    } else if (level === 'intermediate') {
      query = query.in('level', ['beginner', 'intermediate']);
    }
    // For 'advanced', we return all levels
    
    const { data, error } = await query.order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching focus areas by level:', error);
      return [];
    }
    
    return data || [];

    return data || [];
  }

  async createFocusArea(focusArea: InsertFocusArea): Promise<FocusArea> {
    const { data, error } = await supabase
      .from('focus_areas')
      .insert({
        name: focusArea.name,
        apparatus_id: focusArea.apparatusId,
        level: focusArea.level || 'intermediate',
        sort_order: focusArea.sortOrder || 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating focus area:', error);
      throw new Error('Failed to create focus area');
    }

    return data;
  }

  async updateFocusArea(id: number, focusArea: Partial<InsertFocusArea>): Promise<FocusArea | undefined> {
    const { data, error } = await supabase
      .from('focus_areas')
      .update({
        name: focusArea.name,
        apparatus_id: focusArea.apparatusId,
        level: focusArea.level,
        sort_order: focusArea.sortOrder
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating focus area:', error);
      return undefined;
    }

    return data;
  }

  async deleteFocusArea(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('focus_areas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting focus area:', error);
      return false;
    }

    return true;
  }

  async getAllSideQuests(): Promise<SideQuest[]> {
    const { data, error } = await supabaseAdmin
      .from('side_quests')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching side quests:', error);
      return [];
    }

    return data || [];
  }

  async createSideQuest(sideQuest: InsertSideQuest): Promise<SideQuest> {
    const { data, error } = await supabase
      .from('side_quests')
      .insert({
        name: sideQuest.name,
        sort_order: sideQuest.sortOrder || 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating side quest:', error);
      throw new Error('Failed to create side quest');
    }

    return data;
  }

  async updateSideQuest(id: number, sideQuest: Partial<InsertSideQuest>): Promise<SideQuest | undefined> {
    const { data, error } = await supabase
      .from('side_quests')
      .update({
        name: sideQuest.name,
        sort_order: sideQuest.sortOrder
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating side quest:', error);
      return undefined;
    }

    return data;
  }

  async deleteSideQuest(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('side_quests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting side quest:', error);
      return false;
    }

    return true;
  }

  async getAllBookingsWithRelations(): Promise<BookingWithRelations[]> {
    this.logQuery('SELECT', 'bookings with relations');
    
    // Get bookings with basic info first
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    if (!bookings || bookings.length === 0) {
      return [];
    }

    // Get related data for all bookings
    const bookingIds = bookings.map(b => b.id);
    const parentIds = Array.from(new Set(bookings.map(b => b.parent_id).filter(Boolean)));
    const lessonTypeIds = Array.from(new Set(bookings.map(b => b.lesson_type_id).filter(Boolean)));

    // Fetch parents
    const { data: parents } = await supabaseAdmin
      .from('parents')
      .select('*')
      .in('id', parentIds);

    // Fetch lesson types  
    const { data: lessonTypes } = await supabaseAdmin
      .from('lesson_types')
      .select('*')
      .in('id', lessonTypeIds);

    // Fetch athletes for bookings
    const { data: bookingAthletes } = await supabaseAdmin
      .from('booking_athletes')
      .select(`
        booking_id, slot_order,
        athletes!inner(
          id, first_name, last_name, date_of_birth, 
          gender, allergies, experience, photo
        )
      `)
      .in('booking_id', bookingIds);

    // Fetch focus areas for bookings
    const { data: bookingFocusAreas } = await supabaseAdmin
      .from('booking_focus_areas')
      .select(`
        booking_id,
        focus_areas!inner(id, name)
      `)
      .in('booking_id', bookingIds);

    // Create lookup maps
    const parentMap = new Map(parents?.map(p => [p.id, p]) || []);
    const lessonTypeMap = new Map(lessonTypes?.map(lt => [lt.id, lt]) || []);
    const athletesByBooking = new Map<number, any[]>();
    const focusAreasByBooking = new Map<number, string[]>();
    
    bookingAthletes?.forEach((ba: any) => {
      if (!athletesByBooking.has(ba.booking_id)) {
        athletesByBooking.set(ba.booking_id, []);
      }
      // Fix: Access the nested athletes object correctly - ba.athletes is the joined object
      const athlete = ba.athletes as any; // Force type to any to avoid TypeScript inference issues
      if (athlete) {
        athletesByBooking.get(ba.booking_id)!.push({
          athleteId: athlete.id,
          slotOrder: ba.slot_order,
          name: `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim(),
          firstName: athlete.first_name || '',
          lastName: athlete.last_name || '',
          dateOfBirth: athlete.date_of_birth || '',
          allergies: athlete.allergies || '',
          experience: athlete.experience || 'beginner',
          photo: athlete.photo || ''
        });
      }
    });

    // Map focus areas to bookings
    bookingFocusAreas?.forEach((bfa: any) => {
      if (!focusAreasByBooking.has(bfa.booking_id)) {
        focusAreasByBooking.set(bfa.booking_id, []);
      }
      const focusArea = bfa.focus_areas as any;
      if (focusArea) {
        focusAreasByBooking.get(bfa.booking_id)!.push(focusArea.name);
      }
    });

    return bookings.map((booking: any) => {
      const parent = parentMap.get(booking.parent_id);
      const lessonType = lessonTypeMap.get(booking.lesson_type_id);
      const athletes = athletesByBooking.get(booking.id) || [];
      const focusAreas = focusAreasByBooking.get(booking.id) || [];
      // Sort athletes by slot order
      athletes.sort((a, b) => a.slotOrder - b.slotOrder);
  return {
        id: booking.id,
        parentId: booking.parent_id,
        lessonTypeId: booking.lesson_type_id,
        waiverId: booking.waiver_id,
        preferredDate: booking.preferred_date,
        preferredTime: booking.preferred_time,
        status: booking.status,
        paymentStatus: booking.payment_status,
        attendanceStatus: booking.attendance_status,
        bookingMethod: booking.booking_method,
        amount: booking.amount || (lessonType?.total_price?.toString() ?? lessonType?.price?.toString()) || "0",
        reservationFeePaid: booking.reservation_fee_paid,
        paidAmount: booking.paid_amount,
        specialRequests: booking.special_requests,
        adminNotes: booking.admin_notes,
        progressNote: booking.progress_note || null,
        coachName: booking.coach_name || "Coach Will",
        
        // Safety verification fields
        dropoffPersonName: booking.dropoff_person_name,
        dropoffPersonRelationship: booking.dropoff_person_relationship,
        dropoffPersonPhone: booking.dropoff_person_phone,
        pickupPersonName: booking.pickup_person_name,
        pickupPersonRelationship: booking.pickup_person_relationship,
        pickupPersonPhone: booking.pickup_person_phone,
        altPickupPersonName: booking.alt_pickup_person_name,
        altPickupPersonRelationship: booking.alt_pickup_person_relationship,
        altPickupPersonPhone: booking.alt_pickup_person_phone,
        safetyVerificationSigned: booking.safety_verification_signed,
        safetyVerificationSignedAt: booking.safety_verification_signed_at,
        
  stripeSessionId: booking.stripe_session_id,
  createdAt: booking.created_at ? new Date(booking.created_at) : new Date(),
  updatedAt: booking.updated_at ? new Date(booking.updated_at) : new Date(),
  // Idempotent email tracking (required by Booking type)
  sessionConfirmationEmailSent: Boolean(booking.session_confirmation_email_sent),
  sessionConfirmationEmailSentAt: booking.session_confirmation_email_sent_at ? new Date(booking.session_confirmation_email_sent_at) : null,
        
        // Related entities
        parent: parent ? {
          id: parent.id,
          firstName: parent.first_name,
          lastName: parent.last_name,
          email: parent.email,
          phone: parent.phone,
          emergencyContactName: parent.emergency_contact_name,
          emergencyContactPhone: parent.emergency_contact_phone,
          createdAt: parent.created_at,
          updatedAt: parent.updated_at,
        } : undefined,
        
        lessonType: lessonType ? {
          id: lessonType.id,
          name: lessonType.name,
          description: lessonType.description,
          durationMinutes: lessonType.duration_minutes ?? lessonType.duration,
          isPrivate: Boolean(lessonType.is_private),
          totalPrice: (lessonType.total_price ?? lessonType.price)?.toString?.() ?? String(lessonType.total_price ?? lessonType.price ?? '0'),
          reservationFee: (lessonType.reservation_fee ?? 0)?.toString?.() ?? '0',
        } : undefined,
        
        // Legacy athlete fields for compatibility
        
        // Legacy compatibility fields
        parentFirstName: parent?.first_name,
        parentLastName: parent?.last_name,
        parentEmail: parent?.email,
        parentPhone: parent?.phone,
        emergencyContactName: parent?.emergency_contact_name,
        emergencyContactPhone: parent?.emergency_contact_phone,
        lessonTypeName: lessonType?.name,
        
        // Legacy athlete fields for backward compatibility
        athlete1Name: athletes[0] ? athletes[0].name : null,
        athlete1DateOfBirth: athletes[0]?.dateOfBirth,
        athlete1Allergies: athletes[0]?.allergies,
        athlete1Experience: athletes[0]?.experience,
        athlete2Name: athletes[1] ? athletes[1].name : null,
        athlete2DateOfBirth: athletes[1]?.dateOfBirth,
        athlete2Allergies: athletes[1]?.allergies,
        athlete2Experience: athletes[1]?.experience,
        
        // Add the athletes array with the correct structure
        athletes: athletes,
        
        // Empty arrays for relations not yet implemented
        apparatus: [],
        focusAreas: focusAreas,
        focusAreaOther: booking.focus_area_other || null,
        sideQuests: [],
        
        // Legacy waiver fields (set to defaults since waivers are separate now)
        waiverSigned: false,
        waiverSignedAt: null,
        waiverSignatureName: undefined,
  } as unknown as BookingWithRelations;
    });
  }

  async getBookingWithRelations(id: number): Promise<BookingWithRelations | undefined> {
    this.logQuery('SELECT', 'booking with relations', { id });
    
    const booking = await this.getBooking(id);
    if (!booking) return undefined;
    
    // Get parent data
    let parent = undefined;
    if (booking.parentId) {
      parent = await this.getParentById(booking.parentId);
    }

    // Get lesson type data
    let lessonType = undefined;
    if (booking.lessonTypeId) {
      const { data } = await supabase
        .from('lesson_types')
        .select('*')
        .eq('id', booking.lessonTypeId)
        .single();
      if (data) {
        lessonType = {
          id: data.id,
          name: data.name,
          duration: data.duration_minutes,
          price: parseFloat(data.total_price || '0'),
          description: data.description,
          key: data.name.toLowerCase().replace(/\s+/g, '-') // Add slug/key for the lessonType
        };
      }
      
      // Set the booking amount if it's not already set
      booking.amount = booking.amount ?? lessonType?.price?.toString() ?? '0';
    }

    // Get waiver data
    // Waivers are now tied to athletes, not bookings
    // Get related apparatus
    const { data: apparatusData } = await supabaseAdmin
      .from('booking_apparatus')
      .select(`
        apparatus_id,
        apparatus!inner(id, name)
      `)
      .eq('booking_id', id);

    // Get related focus areas
    const { data: focusAreasData } = await supabaseAdmin
      .from('booking_focus_areas')
      .select(`
        focus_area_id,
        focus_areas!inner(id, name)
      `)
      .eq('booking_id', id);

    // Get related side quests
    const { data: sideQuestsData } = await supabaseAdmin
      .from('booking_side_quests')
      .select(`
        side_quest_id,
        side_quests!inner(id, name)
      `)
      .eq('booking_id', id);

    // Get related athletes
    const { data: athletesData } = await supabaseAdmin
      .from('booking_athletes')
      .select(`
        athlete_id,
        slot_order,
        athletes!inner(
          id, 
          first_name, 
          last_name, 
          date_of_birth, 
          gender, 
          allergies, 
          experience, 
          parent_id,
          waiver_status,
          latest_waiver_id,
          waiver_signed
        )
      `)
      .eq('booking_id', id)
      .order('slot_order', { ascending: true });

    // Prepare the complete booking data with all relations
    const bookingWithRelations = {
      ...booking,
  // Ensure idempotent email tracking fields are present on the combined shape
  sessionConfirmationEmailSent: (booking as any).sessionConfirmationEmailSent ?? false,
  sessionConfirmationEmailSentAt: (booking as any).sessionConfirmationEmailSentAt ?? null,
      parent,
      lessonType,
      apparatus: apparatusData?.map(item => ({ id: (item.apparatus as any).id, name: (item.apparatus as any).name })) || [],
      // Use direct focus_areas from booking if available, otherwise use junction table data
      focusAreas: booking.focusAreas && booking.focusAreas.length > 0 ? 
                 booking.focusAreas : 
                 (focusAreasData?.map(item => (item.focus_areas as any).name) || []),
      sideQuests: sideQuestsData?.map(item => ({ id: (item.side_quests as any).id, name: (item.side_quests as any).name })) || [],
      athletes: athletesData?.map(item => {
        const athlete = item.athletes as any;
        return {
          id: athlete.id,
          name: `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim(),
          firstName: athlete.first_name || '',
          lastName: athlete.last_name || '',
          parentId: athlete.parent_id || null,
          createdAt: athlete.created_at || null,
          updatedAt: athlete.updated_at || null,
          gender: athlete.gender || null,
          isGymMember: athlete.is_gym_member ?? false,
          latestWaiverId: athlete.latest_waiver_id || null,
          waiverSigned: athlete.waiver_signed || false,
          waiverStatus: athlete.waiver_status || 'pending',
          allergies: athlete.allergies || '',
          experience: athlete.experience || 'beginner',
          dateOfBirth: athlete.date_of_birth || null,
          photo: athlete.photo || '',
          // Add additional fields for UI consumption
          athleteId: athlete.id, // Include athleteId for easier access
          slotOrder: item.slot_order || 1, // Get slot_order from booking_athletes
          tenantId: athlete.tenant_id || '00000000-0000-0000-0000-000000000001'
        };
      }) || []
    } as BookingWithRelations;

    console.log("Returning booking with relations:", {
      id: bookingWithRelations.id,
      hasLessonType: !!bookingWithRelations.lessonType,
      hasParent: !!bookingWithRelations.parent,
      athleteCount: bookingWithRelations.athletes?.length || 0,
      focusAreaCount: bookingWithRelations.focusAreas?.length || 0
    });

    return bookingWithRelations;
  }

  async createBookingWithRelations(
    booking: InsertBooking,
    apparatusIds: number[],
    focusAreaIds: number[],
    sideQuestIds: number[]
  ): Promise<BookingWithRelations> {
    this.logQuery('INSERT', 'booking with relations');
    
    const createdBooking = await this.createBooking(booking);
    
    // Create apparatus relationships
    if (apparatusIds.length > 0) {
      const apparatusRelations = apparatusIds.map(apparatusId => ({
        booking_id: createdBooking.id,
        apparatus_id: apparatusId
      }));
      
      await supabase
        .from('booking_apparatus')
        .insert(apparatusRelations);
    }
    
    // Create focus area relationships
    if (focusAreaIds.length > 0) {
      const focusAreaRelations = focusAreaIds.map(focusAreaId => ({
        booking_id: createdBooking.id,
        focus_area_id: focusAreaId
      }));
      
      await supabase
        .from('booking_focus_areas')
        .insert(focusAreaRelations);
    }
    
    // Create side quest relationships
    if (sideQuestIds.length > 0) {
      const sideQuestRelations = sideQuestIds.map(sideQuestId => ({
        booking_id: createdBooking.id,
        side_quest_id: sideQuestId
      }));
      
      await supabase
        .from('booking_side_quests')
        .insert(sideQuestRelations);
    }
    
    // Return the booking with all relations loaded
    const bookingWithRelations = await this.getBookingWithRelations(createdBooking.id);
    return bookingWithRelations!;
  }

  async updateBookingRelations(
    bookingId: number,
    apparatusIds: number[],
    focusAreaIds: number[],
    sideQuestIds: number[]
  ): Promise<BookingWithRelations | undefined> {
    this.logQuery('UPDATE', 'booking relations', { bookingId });
    
    const booking = await this.getBooking(bookingId);
    if (!booking) return undefined;
    
    // Delete existing apparatus relationships
    await supabase
      .from('booking_apparatus')
      .delete()
      .eq('booking_id', bookingId);
    
    // Delete existing focus area relationships
    await supabase
      .from('booking_focus_areas')
      .delete()
      .eq('booking_id', bookingId);
    
    // Delete existing side quest relationships
    await supabase
      .from('booking_side_quests')
      .delete()
      .eq('booking_id', bookingId);
    
    // Create new apparatus relationships
    if (apparatusIds.length > 0) {
      const apparatusRelations = apparatusIds.map(apparatusId => ({
        booking_id: bookingId,
        apparatus_id: apparatusId
      }));
      
      await supabase
        .from('booking_apparatus')
        .insert(apparatusRelations);
    }
    
    // Create new focus area relationships
    if (focusAreaIds.length > 0) {
      const focusAreaRelations = focusAreaIds.map(focusAreaId => ({
        booking_id: bookingId,
        focus_area_id: focusAreaId
      }));
      
      await supabase
        .from('booking_focus_areas')
        .insert(focusAreaRelations);
    }
    
    // Create new side quest relationships
    if (sideQuestIds.length > 0) {
      const sideQuestRelations = sideQuestIds.map(sideQuestId => ({
        booking_id: bookingId,
        side_quest_id: sideQuestId
      }));
      
      await supabase
        .from('booking_side_quests')
        .insert(sideQuestRelations);
    }
    
    // Return the booking with all relations loaded
    return await this.getBookingWithRelations(bookingId);
  }

  // Email verification methods
  async createVerificationToken(token: { parentId: number; token: string; expiresAt: Date }): Promise<any> {
    const supabaseData = {
      parent_id: token.parentId,
      token: token.token,
      expires_at: token.expiresAt.toISOString(),
    };

    const { data, error } = await supabaseServiceRole
      .from('parent_verification_tokens')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error('Error creating verification token:', error);
      throw error;
    }

    return data;
  }

  async getVerificationToken(token: string): Promise<any> {
    const { data, error } = await supabaseServiceRole
      .from('parent_verification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      console.error('Error fetching verification token:', error);
      return undefined;
    }

    return data;
  }

  async markParentAsVerified(parentId: number): Promise<void> {
    const { error } = await supabaseServiceRole
      .from('parents')
      .update({ is_verified: true })
      .eq('id', parentId);

    if (error) {
      console.error('Error marking parent as verified:', error);
      throw error;
    }
  }

  async deleteVerificationToken(token: string): Promise<void> {
    const { error } = await supabaseServiceRole
      .from('parent_verification_tokens')
      .delete()
      .eq('token', token);

    if (error) {
      console.error('Error deleting verification token:', error);
      throw error;
    }
  }

  async deleteVerificationTokensByParentId(parentId: number): Promise<void> {
    const { error } = await supabaseServiceRole
      .from('parent_verification_tokens')
      .delete()
      .eq('parent_id', parentId);

    if (error) {
      console.error('Error deleting verification tokens by parent ID:', error);
      throw error;
    }
  }

  // Password Reset methods
  async createPasswordResetToken(token: { parentId: number; token: string; expiresAt: Date }): Promise<any> {
    const supabaseData = {
      parent_id: token.parentId,
      token: token.token,
      expires_at: token.expiresAt.toISOString(),
      used: false
    };

    const { data, error } = await supabaseServiceRole
      .from('parent_password_reset_tokens')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      console.error('Error creating password reset token:', error);
      throw error;
    }

    return data;
  }

  async getPasswordResetToken(token: string): Promise<any> {
    const { data, error } = await supabaseServiceRole
      .from('parent_password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (error) {
      console.error('Error fetching password reset token:', error);
      return undefined;
    }

    return data;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    const { error } = await supabaseServiceRole
      .from('parent_password_reset_tokens')
      .update({ used: true })
      .eq('token', token);

    if (error) {
      console.error('Error marking password reset token as used:', error);
      throw error;
    }
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    const { error } = await supabaseServiceRole
      .from('parent_password_reset_tokens')
      .delete()
      .eq('token', token);

    if (error) {
      console.error('Error deleting password reset token:', error);
      throw error;
    }
  }

  async deletePasswordResetTokensByParentId(parentId: number): Promise<void> {
    const { error } = await supabaseServiceRole
      .from('parent_password_reset_tokens')
      .delete()
      .eq('parent_id', parentId);

    if (error) {
      console.error('Error deleting password reset tokens by parent ID:', error);
      throw error;
    }
  }

  // Blog Email Subscriptions
  async updateParentBlogEmailOptIn(parentId: number, optIn: boolean): Promise<Parent | undefined> {
    // Fetch parent to get email
    const parent = await this.getParentById(parentId);
    if (!parent) return undefined;

    try {
      const email = parent.email.toLowerCase();
      if (optIn) {
        // Upsert into blog_email_signups
        const { error } = await supabaseAdmin
          .from('blog_email_signups')
          .upsert({ email })
          .select();
        if (error) throw error;
      } else {
        // Remove from blog_email_signups
        const { error } = await supabaseAdmin
          .from('blog_email_signups')
          .delete()
          .eq('email', email);
        if (error) throw error;
      }
      // Return the parent (no blogEmails on Parent type)
      return parent;
    } catch (error) {
      console.error('Error updating parent blog email opt-in via signups table:', error);
      throw error;
    }
  }

  async createBlogEmailSignup(email: string): Promise<BlogEmailSignup> {
    const { data, error } = await supabaseAdmin
      .from('blog_email_signups')
      .insert({ email })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog email signup:', error);
      throw error;
    }

    return {
      id: data.id,
      email: data.email,
      createdAt: new Date(data.created_at),
    };
  }

  async getAllBlogEmailSignups(): Promise<BlogEmailSignup[]> {
    const { data, error } = await supabaseAdmin
      .from('blog_email_signups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog email signups:', error);
      throw error;
    }

    return data.map(item => ({
      id: item.id,
      email: item.email,
      createdAt: new Date(item.created_at),
    }));
  }

  async getAllParentsWithBlogOptIn(): Promise<Parent[]> {
    // Get emails from blog_email_signups
    const { data: signups, error: signupError } = await supabaseAdmin
      .from('blog_email_signups')
      .select('email');
    if (signupError) {
      console.error('Error fetching blog email signups:', signupError);
    }

    const emails = (signups || []).map(s => s.email);
    if (emails.length === 0) return [];

    const { data: parentsData, error: parentsError } = await supabaseAdmin
      .from('parents')
      .select('*')
      .in('email', emails)
      .order('created_at', { ascending: false });
    if (parentsError) {
      console.error('Error fetching parents by email list:', parentsError);
      throw parentsError;
    }

    return (parentsData || []).map(item => ({
      id: item.id,
      firstName: item.first_name,
      lastName: item.last_name,
      email: item.email,
      passwordHash: item.password_hash,
      phone: item.phone,
      emergencyContactName: item.emergency_contact_name,
      emergencyContactPhone: item.emergency_contact_phone,
      isVerified: item.is_verified,
      blogEmails: item.blog_emails || false,
      lastLoginAt: item.last_login_at,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
  tenantId: item.tenant_id,
    }));
  }

  async getAllBlogEmailAddresses(): Promise<string[]> {
    // Return all emails subscribed in blog_email_signups
    const { data, error } = await supabaseAdmin
      .from('blog_email_signups')
      .select('email');
    if (error) {
      console.error('Error fetching blog email addresses:', error);
      throw error;
    }
    return (data || []).map(r => r.email);
  }

  // Add an athlete to a booking with a specific slot order
  async addAthleteSlot(bookingId: number, athleteId: number, slotOrder: number): Promise<void> {
    console.log(`[STORAGE] Attempting to add athlete ${athleteId} to booking ${bookingId} with slot order ${slotOrder}`);
    
    try {
      // Check if this combination already exists
      const { data: existing } = await supabaseAdmin
        .from('booking_athletes')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('athlete_id', athleteId);

      if (existing && existing.length > 0) {
        console.log(`[STORAGE] Athlete ${athleteId} is already linked to booking ${bookingId}`);
        return; // Already exists, no need to insert
      }

      // Before inserting, let's get detailed database schema information
      console.log(`[STORAGE] DETAILED DATABASE INFO - Before insert operation`);
      try {
        const { data: tableDetails, error: tableError } = await supabaseAdmin
          .from('pg_tables')
          .select('*')
          .eq('tablename', 'booking_athletes');
        
        if (tableError) {
          console.error(`[STORAGE] Error getting table details:`, tableError);
        } else {
          console.log(`[STORAGE] booking_athletes table details:`, tableDetails);
        }
      } catch (e) {
        console.log(`[STORAGE] Could not get table details:`, e);
      }

      console.log(`[STORAGE] Trying insert operation now...`);
      // Determine snapshot values
      let durationMinutes: number | null = null;
      try {
        const { data: bookingRow } = await supabaseAdmin
          .from('bookings')
          .select('lesson_type_id')
          .eq('id', bookingId)
          .single();
        if (bookingRow?.lesson_type_id) {
          const { data: lt } = await supabaseAdmin
            .from('lesson_types')
            .select('duration_minutes')
            .eq('id', bookingRow.lesson_type_id)
            .single();
          durationMinutes = lt?.duration_minutes ?? null;
        }
      } catch (e) {
        console.warn('[STORAGE] Could not fetch lesson duration for snapshot', e);
      }

      let gymMemberAtBooking = false;
      try {
        const { data: athleteRow } = await supabaseAdmin
          .from('athletes')
          .select('is_gym_member')
          .eq('id', athleteId)
          .single();
        gymMemberAtBooking = !!athleteRow?.is_gym_member;
      } catch (e) {
        console.warn('[STORAGE] Could not fetch athlete membership for snapshot', e);
      }

      const { error } = await supabaseAdmin
        .from('booking_athletes')
        .insert({
          booking_id: bookingId,
          athlete_id: athleteId,
          slot_order: slotOrder,
          gym_member_at_booking: gymMemberAtBooking,
          duration_minutes: durationMinutes,
        });

      if (error) {
        console.error(`[STORAGE] Error adding athlete ${athleteId} to booking ${bookingId}:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Try directly with the JavaScript client
        console.log(`[STORAGE] Attempting alternative insert approach...`);
        try {
          await supabaseAdmin.from('booking_athletes').insert([
            { booking_id: bookingId, athlete_id: athleteId, slot_order: slotOrder }
          ]);
          console.log(`[STORAGE] Alternative insert approach succeeded`);
        } catch (altError) {
          console.error(`[STORAGE] Alternative insert approach also failed:`, altError);
          throw new Error(`Failed to link athlete ${athleteId} to booking ${bookingId}: ${error.message}`);
        }
      }

      console.log(`[STORAGE] Successfully added athlete ${athleteId} to booking ${bookingId}`);
    } catch (error) {
      console.error(`[STORAGE] Exception in addAthleteSlot:`, error);
      throw error;
    }
  }

  // Add focus areas to a booking
  async addBookingFocusArea(bookingId: number, focusAreaId: number | number[]): Promise<void> {
    const focusAreaIds = Array.isArray(focusAreaId) ? focusAreaId : [focusAreaId];
    
    const focusAreaInserts = focusAreaIds.map((id: number) => ({
      booking_id: bookingId,
      focus_area_id: id
    }));
    
    const { error } = await supabaseAdmin
      .from('booking_focus_areas')
      .insert(focusAreaInserts);

    if (error) {
      console.error('Error adding focus areas to booking:', error);
      throw error;
    }
  }

  /**
   * Synchronizes booking payment status with Stripe
   * @param stripeClient - Initialized Stripe client instance
   * @param logger - Logger instance for recording results
   * @returns Object containing count of updated bookings and total processed
   */
  async syncPaymentStatus(stripeClient: Stripe, logger: { admin: (message: string) => void }): Promise<{ updatedCount: number, totalCount: number }> {
    // Get all bookings with stripe session IDs that are in "pending" or "reservation-paid" status
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .not('stripe_session_id', 'is', null)
      .in('payment_status', [
        PaymentStatusEnum.RESERVATION_PENDING,
        PaymentStatusEnum.RESERVATION_PAID,
      ]);

    if (error) {
      console.error('Error fetching bookings for payment sync:', error);
      throw error;
    }

    let updatedCount = 0;
    const totalCount = bookings.length;

    logger.admin(`Starting payment sync for ${totalCount} bookings with Stripe sessions`);

    for (const booking of bookings) {
      try {
        // Skip if no stripe session ID
        if (!booking.stripe_session_id) continue;

        // Retrieve the session from Stripe
        const session = await stripeClient.checkout.sessions.retrieve(booking.stripe_session_id);
        
        // Determine new payment and booking status based on Stripe session
        let newPaymentStatus = booking.payment_status;
        let newStatus = booking.status;
        
        switch (session.status) {
          case 'complete':
            // If session is paid, only set to reservation-paid (not session-paid)
            // session-paid will be set only after attendance is marked as completed
            if (session.payment_status === 'paid') {
              newPaymentStatus = PaymentStatusEnum.RESERVATION_PAID;
              newStatus = BookingStatusEnum.PENDING;
            } else if (session.payment_status === 'no_payment_required') {
              // Handle case where no payment was required
              newPaymentStatus = PaymentStatusEnum.RESERVATION_PAID;
              newStatus = BookingStatusEnum.PENDING;
            }
            break;
          case 'expired':
            // If session expired and still in unpaid or pending reservation, mark as failed
            if (booking.payment_status === PaymentStatusEnum.UNPAID || 
                booking.payment_status === PaymentStatusEnum.RESERVATION_PENDING) {
              newPaymentStatus = PaymentStatusEnum.RESERVATION_FAILED;
              newStatus = BookingStatusEnum.CANCELLED;
            }
            break;
          default:
            // Default case for pending sessions
            newPaymentStatus = PaymentStatusEnum.RESERVATION_PAID;
            newStatus = BookingStatusEnum.PENDING;
        }

        // Update booking if status changed
        if (newPaymentStatus !== booking.payment_status || newStatus !== booking.status) {
          const { error: updateError } = await supabaseAdmin
            .from('bookings')
            .update({
              payment_status: newPaymentStatus,
              status: newStatus
            })
            .eq('id', booking.id);

          if (updateError) {
            console.error(`Error updating booking ${booking.id}:`, updateError);
            continue;
          }

          updatedCount++;
          logger.admin(`Updated booking ${booking.id}: ${booking.payment_status} → ${newPaymentStatus}`);
        }
      } catch (stripeError) {
        console.warn(`Failed to check Stripe session ${booking.stripe_session_id}:`, stripeError);
      }
    }

    logger.admin(`✅ Synced ${updatedCount} bookings with Stripe`);
    return { updatedCount, totalCount };
  }

  // Site Content Management Methods
  async getSiteContent(): Promise<any> {
    try {
      // Get site content (there should only be one row)
      const { data: siteContentData, error: siteError } = await supabaseAdmin
        .from('site_content')
        .select('*')
        .single();

      if (siteError && siteError.code !== 'PGRST116') { // Not found is OK
        console.error('Error fetching site content:', siteError);
      }

      // Get all testimonials
      const { data: testimonialsData, error: testimonialsError } = await supabaseAdmin
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (testimonialsError) {
        console.error('Error fetching testimonials:', testimonialsError);
      }

      // Get all FAQs
      const { data: faqsData, error: faqsError } = await supabaseAdmin
        .from('site_faqs')
        .select('*')
        .order('display_order', { ascending: true });

      if (faqsError) {
        console.error('Error fetching FAQs:', faqsError);
      }

      // Return structured content
      return {
        bannerVideo: siteContentData?.banner_video || '',
        heroImages: siteContentData?.hero_images || [],
        equipmentImages: siteContentData?.equipment_images || [
          "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1540479859555-17af45c78602?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
        ],
        logo: siteContentData?.logo || { circle: "", text: "" },
        about: siteContentData?.about || {
          bio: 'Coach Will brings nearly 10 years of passionate gymnastics instruction to every lesson.',
          experience: 'Nearly 10 years of coaching experience with athletes of all levels',
          photo: '',
          certifications: [
            { title: 'USA Gymnastics Certified', body: 'Official certification from USA Gymnastics' },
            { title: 'CPR/First Aid Certified', body: 'Current safety and emergency response training' },
            { title: 'Background Checked', body: 'Comprehensive background verification completed' }
          ]
        },
        contact: siteContentData?.contact || {
          phone: '(585) 755-8122',
          email: 'Admin@coachwilltumbles.com',
          address: {
            name: 'Oceanside Gymnastics',
            street: '1935 Ave. del Oro #A',
            city: 'Oceanside',
            state: 'CA',
            zip: '92056'
          }
        },
        hours: siteContentData?.hours || {
          monday: { available: true, start: '9:00 AM', end: '4:00 PM' },
          tuesday: { available: true, start: '9:00 AM', end: '3:30 PM' },
          wednesday: { available: true, start: '9:00 AM', end: '4:00 PM' },
          thursday: { available: true, start: '9:00 AM', end: '3:30 PM' },
          friday: { available: true, start: '9:00 AM', end: '4:00 PM' },
          saturday: { available: true, start: '10:00 AM', end: '2:00 PM' },
          sunday: { available: false, start: '', end: '' }
        },
        testimonials: testimonialsData || [],
        faqs: faqsData || []
      };
    } catch (error) {
      console.error('Error in getSiteContent:', error);
      // Return default content if database fails
      return {
        bannerVideo: '',
        heroImages: [],
        equipmentImages: [
          "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1540479859555-17af45c78602?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
        ],
        logo: { circle: "", text: "" },
        about: {
          bio: 'Coach Will brings nearly 10 years of passionate gymnastics instruction to every lesson.',
          experience: 'Nearly 10 years of coaching experience with athletes of all levels',
          photo: '',
          certifications: [
            { title: 'USA Gymnastics Certified', body: 'Official certification from USA Gymnastics' },
            { title: 'CPR/First Aid Certified', body: 'Current safety and emergency response training' },
            { title: 'Background Checked', body: 'Comprehensive background verification completed' }
          ]
        },
        contact: {
          phone: '(585) 755-8122',
          email: 'Admin@coachwilltumbles.com',
          address: {
            name: 'Oceanside Gymnastics',
            street: '1935 Ave. del Oro #A',
            city: 'Oceanside',
            state: 'CA',
            zip: '92056'
          }
        },
        hours: {
          monday: { available: true, start: '9:00 AM', end: '4:00 PM' },
          tuesday: { available: true, start: '9:00 AM', end: '3:30 PM' },
          wednesday: { available: true, start: '9:00 AM', end: '4:00 PM' },
          thursday: { available: true, start: '9:00 AM', end: '3:30 PM' },
          friday: { available: true, start: '9:00 AM', end: '4:00 PM' },
          saturday: { available: true, start: '10:00 AM', end: '2:00 PM' },
          sunday: { available: false, start: '', end: '' }
        },
        testimonials: [],
        faqs: []
      };
    }
  }

  async updateSiteContent(content: any): Promise<any> {
    try {
      const updateData: any = {};
      
      if (content.bannerVideo !== undefined) updateData.banner_video = content.bannerVideo;
      if (content.heroImages !== undefined) updateData.hero_images = content.heroImages;
      if (content.equipmentImages !== undefined) updateData.equipment_images = content.equipmentImages;
      if (content.logo !== undefined) updateData.logo = content.logo;
      if (content.about !== undefined) {
        console.log("[DEBUG-STORAGE] About data being saved:", {
          hasPhoto: !!content.about.photo,
          photo: content.about.photo,
          keys: Object.keys(content.about)
        });
        updateData.about = content.about;
      }
      if (content.contact !== undefined) updateData.contact = content.contact;
      if (content.hours !== undefined) updateData.hours = content.hours;
      
      updateData.updated_at = new Date().toISOString();

      // Upsert the site content (there should only be one row with id=1)
      const { data, error } = await supabaseAdmin
        .from('site_content')
        .upsert({ id: 1, ...updateData }, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error updating site content:', error);
        throw new Error(`Failed to update site content: ${error.message}`);
      }

      console.log("[DEBUG-STORAGE] Content after database save:", {
        hasAbout: !!data.about,
        aboutPhoto: data.about?.photo,
        aboutKeys: data.about ? Object.keys(data.about) : []
      });

      return data;
    } catch (error) {
      console.error('Error in updateSiteContent:', error);
      throw error;
    }
  }

  async uploadMedia(file: Buffer, fileName: string, contentType: string): Promise<string> {
    try {
      // Generate a unique file name to avoid collisions
      const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const bucketName = 'site-media';
      const filePath = `athlete-skills/${uniqueFileName}`;

      // Upload file to Supabase Storage
      const { error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filePath, file, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading to Supabase storage:', error);
        throw new Error(`Failed to upload media: ${error.message}`);
      }

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadMedia:', error);
      throw error;
    }
  }

  async getAllTestimonials(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching testimonials:', error);
      return [];
    }

    return data || [];
  }

  async createTestimonial(testimonial: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .insert({
        name: testimonial.name,
        text: testimonial.text,
        rating: testimonial.rating || 5,
        featured: testimonial.featured || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating testimonial:', error);
      throw new Error(`Failed to create testimonial: ${error.message}`);
    }

    return data;
  }

  async updateTestimonial(id: number, testimonial: any): Promise<any> {
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (testimonial.name !== undefined) updateData.name = testimonial.name;
    if (testimonial.text !== undefined) updateData.text = testimonial.text;
    if (testimonial.rating !== undefined) updateData.rating = testimonial.rating;
    if (testimonial.featured !== undefined) updateData.featured = testimonial.featured;

    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating testimonial:', error);
      throw new Error(`Failed to update testimonial: ${error.message}`);
    }

    return data;
  }

  async deleteTestimonial(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting testimonial:', error);
      return false;
    }

    return true;
  }

  async setFeaturedTestimonial(id: number): Promise<any> {
    // The database trigger will automatically unset other featured testimonials
    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .update({ featured: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error setting featured testimonial:', error);
      throw new Error(`Failed to set featured testimonial: ${error.message}`);
    }

    return data;
  }

  async getAllSiteFaqs(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('site_faqs')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching FAQs:', error);
      return [];
    }

    return data || [];
  }

  async createSiteFaq(faq: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('site_faqs')
      .insert({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || 'General',
        display_order: faq.displayOrder || 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating FAQ:', error);
      throw new Error(`Failed to create FAQ: ${error.message}`);
    }

    return data;
  }

  async updateSiteFaq(id: number, faq: any): Promise<any> {
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (faq.question !== undefined) updateData.question = faq.question;
    if (faq.answer !== undefined) updateData.answer = faq.answer;
    if (faq.category !== undefined) updateData.category = faq.category;
    if (faq.displayOrder !== undefined) updateData.display_order = faq.displayOrder;

    const { data, error } = await supabaseAdmin
      .from('site_faqs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating FAQ:', error);
      throw new Error(`Failed to update FAQ: ${error.message}`);
    }

    return data;
  }

  async deleteSiteFaq(id: number): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('site_faqs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting FAQ:', error);
      return false;
    }

    return true;
  }

  async bulkUpsertSiteFaqs(faqs: any[]): Promise<any[]> {
    try {
      // First, delete all existing FAQs to do a complete replacement
      const { error: deleteError } = await supabaseAdmin
        .from('site_faqs')
        .delete()
        .neq('id', 0); // Delete all rows

      if (deleteError) {
        console.error('Error deleting existing FAQs:', deleteError);
        throw new Error(`Failed to delete existing FAQs: ${deleteError.message}`);
      }

      // Insert all new FAQs
      const insertData = faqs.map((faq, index) => ({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || 'General',
        display_order: index
      }));

      const { data, error } = await supabaseAdmin
        .from('site_faqs')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Error bulk inserting FAQs:', error);
        throw new Error(`Failed to bulk insert FAQs: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in bulkUpsertSiteFaqs:', error);
      throw error;
    }
  }
}

export const storage = new SupabaseStorage();