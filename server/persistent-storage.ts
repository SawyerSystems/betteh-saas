import { promises as fs } from 'fs';
import { join } from 'path';
import type {
    Admin,
    Athlete,
    Availability,
    AvailabilityException,
    BlogPost,
    Booking,
    InsertAdmin,
    InsertAthlete,
    InsertAvailability,
    InsertAvailabilityException,
    InsertBlogPost,
    InsertBooking,
    InsertParent,
    InsertParentAuthCode,
    InsertTip,
    Parent,
    ParentAuthCode,
    Tip
} from "../shared/schema";
import { IStorage } from "./storage";

const DATA_DIR = join(process.cwd(), 'data');
const AVAILABILITY_FILE = join(DATA_DIR, 'availability.json');
const EXCEPTIONS_FILE = join(DATA_DIR, 'exceptions.json');
const BOOKINGS_FILE = join(DATA_DIR, 'bookings.json');
const CUSTOMERS_FILE = join(DATA_DIR, 'parents.json');
const ATHLETES_FILE = join(DATA_DIR, 'athletes.json');
const ADMINS_FILE = join(DATA_DIR, 'admins.json');
const AUTH_CODES_FILE = join(DATA_DIR, 'auth-codes.json');

export class PersistentMemStorage implements IStorage {
  // private users: Map<number, User> = new Map(); // User type not available
  private parents: Map<number, Parent> = new Map();
  private athletes: Map<number, Athlete> = new Map();
  private bookings: Map<number, Booking> = new Map();
  private blogPosts: Map<number, BlogPost> = new Map();
  private tips: Map<number, Tip> = new Map();
  private availability: Map<number, Availability> = new Map();
  private availabilityExceptions: Map<number, AvailabilityException> = new Map();
  private admins: Map<number, Admin> = new Map();
  private parentAuthCodes: Map<number, ParentAuthCode> = new Map();
  
  private currentUserId: number = 1;
  private currentParentId: number = 1;
  private currentAthleteId: number = 1;
  private currentBookingId: number = 1;
  private currentBlogPostId: number = 1;
  private currentTipId: number = 1;
  private currentAvailabilityId: number = 1;
  private currentAvailabilityExceptionId: number = 1;
  private currentAdminId: number = 1;
  private currentAuthCodeId: number = 1;

  constructor() {
    this.initializeData();
  }

  private async ensureDataDir() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      // Directory already exists or creation failed - continue
    }
  }

  private async loadData<T>(file: string): Promise<T[]> {
    try {
      const data = await fs.readFile(file, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  private async saveData<T>(file: string, data: T[]): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
  }

  private async initializeData() {
    // Load persistent data
    const availabilityData = await this.loadData<Availability>(AVAILABILITY_FILE);
    const exceptionsData = await this.loadData<AvailabilityException>(EXCEPTIONS_FILE);
    const bookingsData = await this.loadData<Booking>(BOOKINGS_FILE);
    const parentsData = await this.loadData<Parent>(CUSTOMERS_FILE);
    const athletesData = await this.loadData<Athlete>(ATHLETES_FILE);

    // If no availability data exists, create default schedule
    if (availabilityData.length === 0) {
      const defaultAvailability = [
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isRecurring: true, isAvailable: true },
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isRecurring: true, isAvailable: true },
        { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isRecurring: true, isAvailable: true },
        { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isRecurring: true, isAvailable: true },
        { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isRecurring: true, isAvailable: true },
        { dayOfWeek: 6, startTime: "08:00", endTime: "16:00", isRecurring: true, isAvailable: true },
      ];

      for (const avail of defaultAvailability) {
        const id = this.currentAvailabilityId++;
        const availability: Availability = { ...avail, id, createdAt: new Date() };
        this.availability.set(id, availability);
      }
      await this.saveAvailability();
    } else {
      // Load existing availability
      availabilityData.forEach(avail => {
        this.availability.set(avail.id, { ...avail, createdAt: new Date(avail.createdAt) });
        this.currentAvailabilityId = Math.max(this.currentAvailabilityId, avail.id + 1);
      });
    }

    // Load exceptions
    exceptionsData.forEach(exception => {
      this.availabilityExceptions.set(exception.id, { ...exception, createdAt: new Date(exception.createdAt) });
      this.currentAvailabilityExceptionId = Math.max(this.currentAvailabilityExceptionId, exception.id + 1);
    });

    // Load bookings
    bookingsData.forEach(booking => {
      this.bookings.set(booking.id, { ...booking, createdAt: new Date(booking.createdAt) });
      this.currentBookingId = Math.max(this.currentBookingId, booking.id + 1);
    });

    // Load parents
    parentsData.forEach(parent => {
      this.parents.set(parent.id, { 
        ...parent, 
        createdAt: new Date(parent.createdAt),
        updatedAt: new Date(parent.updatedAt),
        waiverSignedAt: parent.waiverSignedAt ? new Date(parent.waiverSignedAt) : null
      });
      this.currentParentId = Math.max(this.currentParentId, parent.id + 1);
    });

    // Load athletes
    athletesData.forEach(athlete => {
      this.athletes.set(athlete.id, { 
        ...athlete, 
        createdAt: new Date(athlete.createdAt),
        updatedAt: new Date(athlete.updatedAt)
      });
      this.currentAthleteId = Math.max(this.currentAthleteId, athlete.id + 1);
    });

    // Load admins
    const adminsData = await this.loadData<Admin>(ADMINS_FILE);
    adminsData.forEach(admin => {
      this.admins.set(admin.id, admin);
      this.currentAdminId = Math.max(this.currentAdminId, admin.id + 1);
    });

    // Initialize sample content (blog posts and tips)
    this.initializeSampleContent();
  }

  private async saveAvailability() {
    const data = Array.from(this.availability.values());
    await this.saveData(AVAILABILITY_FILE, data);
  }

  private async saveExceptions() {
    const data = Array.from(this.availabilityExceptions.values());
    await this.saveData(EXCEPTIONS_FILE, data);
  }

  private async saveAdmins() {
    const data = Array.from(this.admins.values());
    await this.saveData(ADMINS_FILE, data);
  }

  private async saveBookings() {
    const data = Array.from(this.bookings.values());
    await this.saveData(BOOKINGS_FILE, data);
  }

  private async saveParents() {
    const data = Array.from(this.parents.values());
    await this.saveData(CUSTOMERS_FILE, data);
  }

  private async saveAthletes() {
    const data = Array.from(this.athletes.values());
    await this.saveData(ATHLETES_FILE, data);
  }

  private initializeSampleContent() {
    // Initialize sample blog posts and tips (non-persistent sample data)
    const sampleBlogPosts = [
      {
        title: "5 Essential Stretches for Young Gymnasts",
        content: "Flexibility is crucial for gymnastics success and injury prevention.",
        excerpt: "Learn the most important stretches every young gymnast should do daily.",
        category: "Training",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3",
        publishedAt: new Date('2024-12-01')
      }
    ];

    const sampleTips = [
      {
        title: "Perfect Your Cartwheel",
        content: "The cartwheel is a fundamental gymnastics skill that builds strength, coordination, and confidence.",
        category: "Floor",
        difficulty: "Beginner" as const,
        videoUrl: null,
        sections: null,
        publishedAt: new Date('2024-11-20')
      }
    ];

    sampleBlogPosts.forEach(post => {
      const id = this.currentBlogPostId++;
      this.blogPosts.set(id, { ...post, id });
    });

    sampleTips.forEach(tip => {
      const id = this.currentTipId++;
      this.tips.set(id, { ...tip, id });
    });
  }

  //   // Users
  //   async getUser(id: number): Promise<User | undefined> {
  //     return this.users.get(id);
  //   }
  // 
  //   async getUserByUsername(username: string): Promise<User | undefined> {
  //     return Array.from(this.users.values()).find(user => user.username === username);
  //   }
  // 
  //   async createUser(insertUser: InsertUser): Promise<User> {
  //     const id = this.currentUserId++;
  //     const user: User = { 
  //       ...insertUser, 
  //       id, 
  //       createdAt: new Date(),
  //       passwordHash: insertUser.passwordHash ?? null,
  //       role: insertUser.role ?? "user"
  //     };
  //     this.users.set(id, user);
  //     return user;
  //   }
  // 
  //   // Parents
  async identifyParent(email: string, phone: string): Promise<Parent | undefined> {
    return Array.from(this.parents.values()).find(parent => 
      parent.email.toLowerCase() === email.toLowerCase() || 
      parent.phone === phone
    );
  }

  async createParent(insertParent: InsertParent): Promise<Parent> {
    const id = this.currentParentId++;
    const parent: Parent = { 
      ...insertParent, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      waiverSigned: insertParent.waiverSigned ?? false,
      waiverSignedAt: insertParent.waiverSignedAt ?? null,
      waiverSignatureName: insertParent.waiverSignatureName ?? null
    };
    this.parents.set(id, parent);
    await this.saveParents();
    return parent;
  }

  async updateParent(id: number, updateData: Partial<InsertParent>): Promise<Parent | undefined> {
    const existing = this.parents.get(id);
    if (!existing) return undefined;
    
    const updated: Parent = { 
      ...existing, 
      ...updateData, 
      id, 
      updatedAt: new Date() 
    };
    this.parents.set(id, updated);
    await this.saveParents();
    return updated;
  }

  async deleteParent(id: number): Promise<boolean> {
    // Cascade delete all athletes for this parent
    const athletesToDelete = Array.from(this.athletes.values()).filter(a => a.parentId === id);
    for (const athlete of athletesToDelete) {
      await this.deleteAthlete(athlete.id);
    }
    const deleted = this.parents.delete(id);
    if (deleted) {
      await this.saveParents();
    }
    return deleted;
  }

  async getParentAthletes(parentId: number): Promise<Athlete[]> {
    return Array.from(this.athletes.values()).filter(athlete => athlete.parentId === parentId);
  }

  async getParentById(id: number): Promise<Parent | undefined> {
    return this.parents.get(id);
  }

  // Athletes
  async createAthlete(insertAthlete: InsertAthlete): Promise<Athlete> {
    const id = this.currentAthleteId++;
    const athlete: Athlete = { 
      ...insertAthlete, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      allergies: insertAthlete.allergies ?? null,
      photo: insertAthlete.photo ?? null,
      firstName: insertAthlete.firstName ?? null,
      lastName: insertAthlete.lastName ?? null,
      gender: insertAthlete.gender ?? null
    };
    this.athletes.set(id, athlete);
    await this.saveAthletes();
    return athlete;
  }

  async getAllAthletes(): Promise<Athlete[]> {
    return Array.from(this.athletes.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAthlete(id: number): Promise<Athlete | undefined> {
    return this.athletes.get(id);
  }

  async updateAthlete(id: number, updateData: Partial<InsertAthlete>): Promise<Athlete | undefined> {
    const existing = this.athletes.get(id);
    if (!existing) return undefined;
    
    const updated: Athlete = { 
      ...existing, 
      ...updateData, 
      id, 
      updatedAt: new Date(),
      firstName: updateData.firstName !== undefined ? (updateData.firstName ?? null) : existing.firstName,
      lastName: updateData.lastName !== undefined ? (updateData.lastName ?? null) : existing.lastName
    };
    this.athletes.set(id, updated);
    await this.saveAthletes();
    return updated;
  }

  async deleteAthlete(id: number): Promise<boolean> {
    const deleted = this.athletes.delete(id);
    if (deleted) {
      await this.saveAthletes();
    }
    return deleted;
  }

  async getAthleteBookingHistory(athleteId: number): Promise<Booking[]> {
    const athlete = this.athletes.get(athleteId);
    if (!athlete) return [];
    
    return Array.from(this.bookings.values()).filter(booking =>
      booking.athlete1Name === athlete.name || booking.athlete2Name === athlete.name
    );
  }

  // Bookings
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
      paymentStatus: "unpaid",
      attendanceStatus: "pending",
      focusAreas: (insertBooking.focusAreaIds || []).map(id => String(id)),
      preferredDate: typeof insertBooking.preferredDate === 'string' ? insertBooking.preferredDate : insertBooking.preferredDate.toISOString().split('T')[0],
      waiverSigned: insertBooking.waiverSigned ?? false,
      waiverSignedAt: insertBooking.waiverSignedAt ?? null,
      waiverSignatureName: insertBooking.waiverSignatureName ?? null,
      reservationFeePaid: insertBooking.reservationFeePaid ?? false,
      paidAmount: insertBooking.paidAmount ?? "0",
      specialRequests: insertBooking.specialRequests ?? null,
      adminNotes: insertBooking.adminNotes ?? null,
      // Safety verification fields
      dropoffPersonName: insertBooking.dropoffPersonName ?? null,
      dropoffPersonRelationship: insertBooking.dropoffPersonRelationship ?? null,
      dropoffPersonPhone: insertBooking.dropoffPersonPhone ?? null,
      pickupPersonName: insertBooking.pickupPersonName ?? null,
      pickupPersonRelationship: insertBooking.pickupPersonRelationship ?? null,
      pickupPersonPhone: insertBooking.pickupPersonPhone ?? null,
      altPickupPersonName: insertBooking.altPickupPersonName ?? null,
      altPickupPersonRelationship: insertBooking.altPickupPersonRelationship ?? null,
      altPickupPersonPhone: insertBooking.altPickupPersonPhone ?? null,
      safetyVerificationSigned: insertBooking.safetyVerificationSigned ?? false,
      safetyVerificationSignedAt: insertBooking.safetyVerificationSignedAt ?? null,
      stripeSessionId: insertBooking.stripeSessionId ?? null
    };
    this.bookings.set(id, booking);
    await this.saveBookings();
    return booking;
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateBooking(id: number, data: Partial<Booking>): Promise<Booking | undefined> {
    const existing = this.bookings.get(id);
    if (!existing) return undefined;
    
    const updated: Booking = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date()
    };
    
    this.bookings.set(id, updated);
    await this.saveBookings();
    return updated;
  }

  async updateBookingStatus(id: number, status: "pending" | "paid" | "confirmed" | "manual" | "manual-paid" | "completed" | "no-show" | "failed" | "cancelled"): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    booking.status = status;
    await this.saveBookings();
    return booking;
  }

  async updateBookingPaymentStatus(id: number, paymentStatus: "unpaid" | "paid" | "failed" | "refunded"): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    booking.paymentStatus = paymentStatus;
    await this.saveBookings();
    return booking;
  }

  async updateBookingAttendanceStatus(id: number, attendanceStatus: "pending" | "confirmed" | "completed" | "cancelled" | "no-show" | "manual"): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    booking.attendanceStatus = attendanceStatus;
    await this.saveBookings();
    return booking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    const deleted = this.bookings.delete(id);
    if (deleted) await this.saveBookings();
    return deleted;
  }

  // Payment Logs
  async createPaymentLog(log: { bookingId: number | null; stripeEvent: string | null; errorMessage: string | null }): Promise<void> {
    // Log to console for now - could be persisted to file in the future
    console.log('Payment log:', {
      ...log,
      timestamp: new Date().toISOString()
    });
  }

  // Blog Posts (sample data only)
  async getAllBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
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
      imageUrl: insertPost.imageUrl || null
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async updateBlogPost(id: number, insertPost: InsertBlogPost): Promise<BlogPost | undefined> {
    const existing = this.blogPosts.get(id);
    if (!existing) return undefined;
    const updatedPost: BlogPost = { ...existing, ...insertPost, id };
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  // Tips (sample data only)
  async getAllTips(): Promise<Tip[]> {
    return Array.from(this.tips.values()).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
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
      sections: insertTip.sections || null,
      videoUrl: insertTip.videoUrl || null
    };
    this.tips.set(id, tip);
    return tip;
  }

  async updateTip(id: number, insertTip: InsertTip): Promise<Tip | undefined> {
    const existing = this.tips.get(id);
    if (!existing) return undefined;
    const updatedTip: Tip = { ...existing, ...insertTip, id };
    this.tips.set(id, updatedTip);
    return updatedTip;
  }

  async deleteTip(id: number): Promise<boolean> {
    return this.tips.delete(id);
  }

  // Availability (persistent)
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
    await this.saveAvailability();
    return availability;
  }

  async updateAvailability(id: number, insertAvailability: InsertAvailability): Promise<Availability | undefined> {
    const existing = this.availability.get(id);
    if (!existing) return undefined;
    
    const updated: Availability = {
      ...existing,
      ...insertAvailability,
      id,
    };
    this.availability.set(id, updated);
    await this.saveAvailability();
    return updated;
  }

  async deleteAvailability(id: number): Promise<boolean> {
    const deleted = this.availability.delete(id);
    if (deleted) await this.saveAvailability();
    return deleted;
  }

  // Availability Exceptions (persistent)
  async getAllAvailabilityExceptions(): Promise<AvailabilityException[]> {
    return Array.from(this.availabilityExceptions.values()).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
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
      reason: insertException.reason ?? null,
      isAvailable: insertException.isAvailable ?? false,
      date: typeof insertException.date === 'string' ? insertException.date : insertException.date.toISOString().split('T')[0]
    };
    this.availabilityExceptions.set(id, exception);
    await this.saveExceptions();
    return exception;
  }

  async updateAvailabilityException(id: number, insertException: InsertAvailabilityException): Promise<AvailabilityException | undefined> {
    const existing = this.availabilityExceptions.get(id);
    if (!existing) return undefined;
    
    const updated: AvailabilityException = {
      ...existing,
      ...insertException,
      id,
      reason: insertException.reason ?? null,
      date: typeof insertException.date === 'string' ? insertException.date : insertException.date.toISOString().split('T')[0]
    };
    this.availabilityExceptions.set(id, updated);
    await this.saveExceptions();
    return updated;
  }

  async deleteAvailabilityException(id: number): Promise<boolean> {
    const deleted = this.availabilityExceptions.delete(id);
    if (deleted) await this.saveExceptions();
    return deleted;
  }

  async getAvailabilityExceptionsByDateRange(startDate: string, endDate: string): Promise<AvailabilityException[]> {
    return Array.from(this.availabilityExceptions.values())
      .filter(exception => exception.date >= startDate && exception.date <= endDate)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
  }

  // Admin methods
  async getAllAdmins(): Promise<Admin[]> {
    return Array.from(this.admins.values());
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(admin => admin.email === email);
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const id = this.currentAdminId++;
    const newAdmin: Admin = {
      ...admin,
      id,
      createdAt: new Date()
    };
    this.admins.set(id, newAdmin);
    await this.saveAdmins();
    return newAdmin;
  }

  async getAdmin(id: number): Promise<Admin | undefined> {
    return this.admins.get(id);
  }

  // Parent Authentication methods
  async createParentAuthCode(insertAuthCode: InsertParentAuthCode): Promise<ParentAuthCode> {
    const id = this.currentAuthCodeId++;
    const authCode: ParentAuthCode = {
      ...insertAuthCode,
      id,
      used: false,
      createdAt: new Date()
    };
    this.parentAuthCodes.set(id, authCode);
    await this.saveAuthCodes();
    return authCode;
  }

  async getParentAuthCode(email: string, code: string): Promise<ParentAuthCode | undefined> {
    return Array.from(this.parentAuthCodes.values()).find(
      authCode => authCode.email === email && authCode.code === code
    );
  }

  async markAuthCodeAsUsed(id: number): Promise<void> {
    const authCode = this.parentAuthCodes.get(id);
    if (authCode) {
      authCode.used = true;
      await this.saveAuthCodes();
    }
  }

  async cleanupExpiredAuthCodes(): Promise<void> {
    const now = new Date();
    const before = this.parentAuthCodes.size;
    
    for (const [id, authCode] of this.parentAuthCodes) {
      if (now > authCode.expiresAt || authCode.used) {
        this.parentAuthCodes.delete(id);
      }
    }
    
    if (this.parentAuthCodes.size !== before) {
      await this.saveAuthCodes();
    }
  }

  private async saveAuthCodes() {
    await this.saveData(AUTH_CODES_FILE, Array.from(this.parentAuthCodes.values()));
  }

  // Slot Reservations - simplified implementation
  async getActiveReservations(date: string): Promise<{ startTime: string; lessonType: string }[]> {
    // For now, return empty array - will implement full database version later
    return [];
  }

  async reserveSlot(date: string, startTime: string, lessonType: string, sessionId: string): Promise<boolean> {
    // For now, always return true - will implement full database version later
    return true;
  }

  async releaseSlot(date: string, startTime: string): Promise<boolean> {
    // For now, always return true - will implement full database version later
    return true;
  }

  async cleanupExpiredReservations(): Promise<void> {
    // For now, do nothing - will implement full database version later
  }

  // Missing method stubs for IStorage interface compliance
  async getAllParents(): Promise<Parent[]> {
    return Array.from(this.parents.values());
  }

  async createWaiver(waiver: any): Promise<any> {
    throw new Error("Waiver functionality not implemented in legacy storage");
  }

  async getWaiver(id: number): Promise<any> {
    throw new Error("Waiver functionality not implemented in legacy storage");
  }

  async getWaiverByAthleteId(athleteId: number): Promise<any> {
    throw new Error("Waiver functionality not implemented in legacy storage");
  }

  async getWaiverByBookingId(bookingId: number): Promise<any> {
    throw new Error("Waiver functionality not implemented in legacy storage");
  }

  async getAllWaivers(): Promise<any[]> {
    return [];
  }

  async updateWaiver(id: number, waiver: any): Promise<any> {
    throw new Error("Waiver functionality not implemented in legacy storage");
  }

  async updateWaiverPdfPath(id: number, pdfPath: string): Promise<any> {
    throw new Error("Waiver functionality not implemented in legacy storage");
  }

  async updateWaiverEmailSent(id: number): Promise<any> {
    throw new Error("Waiver functionality not implemented in legacy storage");
  }

  async getAllArchivedWaivers(): Promise<any[]> {
    return [];
  }

  async getArchivedWaiver(id: number): Promise<any> {
    throw new Error("Archived waiver functionality not implemented in legacy storage");
  }

  async createArchivedWaiver(waiver: any): Promise<any> {
    throw new Error("Archived waiver functionality not implemented in legacy storage");
  }

  async deleteArchivedWaiver(id: number): Promise<boolean> {
    return false;
  }

  async getBookingLogs(bookingId: number): Promise<any[]> {
    return [];
  }

  async createBookingLog(log: any): Promise<any> {
    throw new Error("Booking log functionality not implemented in legacy storage");
  }

  async getPaymentLogs(bookingId: number): Promise<any[]> {
    return [];
  }

  async getParentBookingLogs(parentId: number): Promise<any[]> {
    return [];
  }

  async getParentPaymentLogs(parentId: number): Promise<any[]> {
    return [];
  }

  // Session-authorized progress by athlete (legacy storage)
  async getProgressByAthleteId(athleteId: number): Promise<{
    athlete: Athlete | null;
    skills: Array<{ athleteSkill: AthleteSkill; skill?: Skill | null; videos: AthleteSkillVideo[] }>;
    link: any;
  } | null> {
    const athlete = this.athletes.get(athleteId) || null;
    // We don't persist skills/videos here; return empty arrays for legacy path
    return { athlete, skills: [], link: null };
  }

  async getParentArchivedWaivers(parentId: number): Promise<any[]> {
    return [];
  }

  async getAllFocusAreas(): Promise<any[]> {
    return [];
  }

  async createFocusArea(focusArea: any): Promise<any> {
    throw new Error("Focus area functionality not implemented in legacy storage");
  }

  async updateFocusArea(id: number, focusArea: any): Promise<any> {
    throw new Error("Focus area functionality not implemented in legacy storage");
  }

  async deleteFocusArea(id: number): Promise<boolean> {
    return false;
  }

  async getAllApparatus(): Promise<any[]> {
    return [];
  }

  async createApparatus(apparatus: any): Promise<any> {
    throw new Error("Apparatus functionality not implemented in legacy storage");
  }

  async updateApparatus(id: number, apparatus: any): Promise<any> {
    throw new Error("Apparatus functionality not implemented in legacy storage");
  }

  async deleteApparatus(id: number): Promise<boolean> {
    return false;
  }

  async getAllSideQuests(): Promise<any[]> {
    return [];
  }

  async createSideQuest(sideQuest: any): Promise<any> {
    throw new Error("Side quest functionality not implemented in legacy storage");
  }

  async updateSideQuest(id: number, sideQuest: any): Promise<any> {
    throw new Error("Side quest functionality not implemented in legacy storage");
  }

  async deleteSideQuest(id: number): Promise<boolean> {
    return false;
  }

  async getBookingWithRelations(id: number): Promise<any> {
    return this.getBooking(id);
  }

  async getAllBookingsWithRelations(): Promise<any[]> {
    return this.getAllBookings();
  }

  async createBookingWithAthletes(booking: any): Promise<any> {
    return this.createBooking(booking);
  }

  async updateBookingWithAthletes(id: number, booking: any): Promise<any> {
    return this.updateBooking(id, booking);
  }

  async deleteParentAuthCode(email: string): Promise<boolean> {
    return false; // Not implemented in persistent storage
  }

  async archiveWaiver(waiverId: number): Promise<boolean> {
    return false; // Not implemented in persistent storage
  }

  async getFocusAreasByApparatus(apparatusId: number): Promise<any[]> {
    return []; // Not implemented in persistent storage
  }

  async createBookingWithRelations(bookingData: any): Promise<any> {
    return this.createBooking(bookingData);
  }

  async updateBookingRelations(bookingId: number, relationData: any): Promise<boolean> {
    return false; // Not implemented in persistent storage
  }
}