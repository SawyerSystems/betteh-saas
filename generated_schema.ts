import { relations } from "drizzle-orm";
import { boolean, date, decimal, integer, json, jsonb, pgEnum, pgTable, serial, text, time, timestamp, varchar, uuid, bigserial, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Custom PostgreSQL Enums
export const attendance_statusEnum = pgEnum("attendance_status", ["pending", "confirmed", "cancelled", "no-show", "completed", "manual"]);
export const booking_statusEnum = pgEnum("booking_status", ["pending", "paid", "confirmed", "completed", "cancelled", "failed"]);
export const payment_statusEnum = pgEnum("payment_status", ["unpaid", "reservation-pending", "reservation-paid", "reservation-failed", "session-paid", "reservation-refunded", "session-refunded"]);

export const activityLogs = pgTable("activity_logs", {
  id: integer("id").primaryKey().notNull(),
  actorType: text("actor_type").notNull(),
  actorId: integer("actor_id"),
  actorName: text("actor_name").notNull(),
  actionType: text("action_type").notNull(),
  actionCategory: text("action_category").notNull(),
  actionDescription: text("action_description").notNull(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id"),
  targetIdentifier: text("target_identifier"),
  fieldChanged: text("field_changed"),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp({{ withTimezone: true }})("deleted_at"),
  deletedBy: integer("deleted_by").references(() => admins.id),
  isReversed: boolean("is_reversed").notNull().default(false),
  reversedAt: timestamp({{ withTimezone: true }})("reversed_at"),
  reversedBy: integer("reversed_by").references(() => admins.id),
  reverseActionId: integer("reverse_action_id").references(() => activityLogs.id),
  originalActionId: integer("original_action_id").references(() => activityLogs.id),
  batchId: text("batch_id"),
  batchDescription: text("batch_description"),
});

export const admins = pgTable("admins", {
  id: integer("id").primaryKey().notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp({{ withTimezone: true }})("updated_at").defaultNow(),
});

export const apparatus = pgTable("apparatus", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").unique().notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
});

export const archivedBookings = pgTable("archived_bookings", {
  id: integer("id").primaryKey().notNull(),
  originalBookingId: integer("original_booking_id"),
  parentId: integer("parent_id"),
  athleteId: integer("athlete_id"),
  lessonTypeId: integer("lesson_type_id"),
  waiverId: integer("waiver_id"),
  preferredDate: date("preferred_date"),
  preferredTime: time("preferred_time"),
  focusAreas: text("focus_areas"),
  status: text("status"),
  paymentStatus: text("payment_status"),
  attendanceStatus: text("attendance_status"),
  bookingMethod: text("booking_method"),
  reservationFeePaid: boolean("reservation_fee_paid"),
  paidAmount: decimal({ precision: 10, scale: 2 })("paid_amount"),
  stripeSessionId: text("stripe_session_id"),
  specialRequests: text("special_requests"),
  adminNotes: text("admin_notes"),
  dropoffPersonName: text("dropoff_person_name"),
  dropoffPersonRelationship: text("dropoff_person_relationship"),
  dropoffPersonPhone: text("dropoff_person_phone"),
  pickupPersonName: text("pickup_person_name"),
  pickupPersonRelationship: text("pickup_person_relationship"),
  pickupPersonPhone: text("pickup_person_phone"),
  altPickupPersonName: text("alt_pickup_person_name"),
  altPickupPersonRelationship: text("alt_pickup_person_relationship"),
  altPickupPersonPhone: text("alt_pickup_person_phone"),
  safetyVerificationSigned: boolean("safety_verification_signed"),
  safetyVerificationSignedAt: timestamp("safety_verification_signed_at"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  archivedAt: timestamp("archived_at").defaultNow(),
  archiveReason: text("archive_reason").notNull(),
});

export const archivedWaivers = pgTable("archived_waivers", {
  id: integer("id").primaryKey().notNull(),
  originalWaiverId: integer("original_waiver_id"),
  athleteName: text("athlete_name").notNull(),
  signerName: text("signer_name").notNull(),
  relationshipToAthlete: text("relationship_to_athlete").notNull(),
  signature: text("signature").notNull(),
  emergencyContactNumber: text("emergency_contact_number").notNull(),
  understandsRisks: boolean("understands_risks").notNull(),
  agreesToPolicies: boolean("agrees_to_policies").notNull(),
  authorizesEmergencyCare: boolean("authorizes_emergency_care").notNull(),
  allowsPhotoVideo: boolean("allows_photo_video").notNull(),
  confirmsAuthority: boolean("confirms_authority").notNull(),
  pdfPath: text("pdf_path"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  signedAt: timestamp("signed_at").notNull(),
  emailSentAt: timestamp("email_sent_at"),
  archivedAt: timestamp("archived_at").notNull().defaultNow(),
  archiveReason: text("archive_reason").notNull(),
  legalRetentionPeriod: text("legal_retention_period"),
  originalParentId: integer("original_parent_id"),
  originalAthleteId: integer("original_athlete_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const athleteSkillVideos = pgTable("athlete_skill_videos", {
  id: integer("id").primaryKey().notNull(),
  athleteSkillId: integer("athlete_skill_id").references(() => athleteSkills.id).notNull(),
  url: text("url").notNull(),
  title: text("title"),
  recordedAt: timestamp({{ withTimezone: true }})("recorded_at"),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
  updatedAt: timestamp({{ withTimezone: true }})("updated_at").notNull().defaultNow(),
  caption: text("caption"),
  isVisible: boolean("is_visible").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  displayDate: date("display_date"),
  sortIndex: integer("sort_index").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  optimizedUrl: text("optimized_url"),
  processingStatus: text("processing_status").notNull().default("pending"),
  processingError: text("processing_error"),
});

export const athleteSkills = pgTable("athlete_skills", {
  id: integer("id").primaryKey().notNull(),
  athleteId: integer("athlete_id").references(() => athletes.id).unique().notNull(),
  skillId: integer("skill_id").references(() => skills.id).unique().notNull(),
  status: varchar({ length: 20 })("status").notNull(),
  notes: text("notes"),
  unlockDate: date("unlock_date"),
  firstTestedAt: timestamp({{ withTimezone: true }})("first_tested_at"),
  lastTestedAt: timestamp({{ withTimezone: true }})("last_tested_at"),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
  updatedAt: timestamp({{ withTimezone: true }})("updated_at").notNull().defaultNow(),
});

export const athletes = pgTable("athletes", {
  id: integer("id").primaryKey().notNull(),
  parentId: integer("parent_id").references(() => parents.id),
  name: text("name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  allergies: text("allergies"),
  experience: text("experience").notNull(),
  photo: text("photo"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender").references(() => genders.name),
  latestWaiverId: integer("latest_waiver_id").references(() => waivers.id),
  waiverSigned: boolean("waiver_signed").notNull().default(false),
  waiverStatus: varchar({ length: 20 })("waiver_status"),
  isGymMember: boolean("is_gym_member").notNull().default(false),
});

export const availability = pgTable("availability", {
  id: integer("id").primaryKey().notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  isRecurring: boolean("is_recurring").default(true),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at"),
  startTime: time("start_time"),
  endTime: time("end_time"),
});

export const availabilityExceptions = pgTable("availability_exceptions", {
  id: integer("id").primaryKey().notNull(),
  isAvailable: boolean("is_available").default(false),
  reason: text("reason"),
  createdAt: timestamp("created_at"),
  date: date("date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("United States"),
  category: text("category"),
  title: text("title"),
  notes: text("notes"),
  allDay: boolean("all_day").default(false),
});

export const blogEmailSignups = pgTable("blog_email_signups", {
  id: integer("id").primaryKey().notNull(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: integer("id").primaryKey().notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at"),
  sections: jsonb("sections"),
});

export const bookingApparatus = pgTable("booking_apparatus", {
  id: integer("id").primaryKey().notNull(),
  bookingId: integer("booking_id").references(() => bookings.id).unique().notNull(),
  apparatusId: integer("apparatus_id").references(() => apparatus.id).unique().notNull(),
});

export const bookingAthletes = pgTable("booking_athletes", {
  id: integer("id").primaryKey().notNull(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  athleteId: integer("athlete_id").references(() => athletes.id).notNull(),
  slotOrder: integer("slot_order").notNull(),
  gymMemberAtBooking: boolean("gym_member_at_booking").notNull().default(false),
  durationMinutes: integer("duration_minutes"),
  gymRateAppliedCents: integer("gym_rate_applied_cents"),
  gymPayoutOwedCents: integer("gym_payout_owed_cents"),
  gymPayoutComputedAt: timestamp({{ withTimezone: true }})("gym_payout_computed_at"),
  gymPayoutOverrideCents: integer("gym_payout_override_cents"),
  gymPayoutOverrideReason: text("gym_payout_override_reason"),
});

export const bookingFocusAreas = pgTable("booking_focus_areas", {
  id: integer("id").primaryKey().notNull(),
  bookingId: integer("booking_id").references(() => bookings.id).unique().notNull(),
  focusAreaId: integer("focus_area_id").references(() => focusAreas.id).unique().notNull(),
});

export const bookingSideQuests = pgTable("booking_side_quests", {
  id: integer("id").primaryKey().notNull(),
  bookingId: integer("booking_id").references(() => bookings.id).unique().notNull(),
  sideQuestId: integer("side_quest_id").references(() => sideQuests.id).unique().notNull(),
});

export const bookings = pgTable("bookings", {
  id: integer("id").primaryKey().notNull(),
  bookingMethod: text("booking_method").default("Website"),
  reservationFeePaid: boolean("reservation_fee_paid").default(false),
  paidAmount: decimal({ precision: 10, scale: 2 })("paid_amount"),
  specialRequests: text("special_requests"),
  adminNotes: text("admin_notes"),
  dropoffPersonName: text("dropoff_person_name"),
  dropoffPersonRelationship: text("dropoff_person_relationship"),
  dropoffPersonPhone: text("dropoff_person_phone"),
  pickupPersonName: text("pickup_person_name"),
  pickupPersonRelationship: text("pickup_person_relationship"),
  pickupPersonPhone: text("pickup_person_phone"),
  altPickupPersonName: text("alt_pickup_person_name"),
  altPickupPersonRelationship: text("alt_pickup_person_relationship"),
  altPickupPersonPhone: text("alt_pickup_person_phone"),
  safetyVerificationSigned: boolean("safety_verification_signed").notNull().default(false),
  safetyVerificationSignedAt: timestamp("safety_verification_signed_at"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  status: booking_statusEnum("status")("status").notNull(),
  paymentStatus: payment_statusEnum("payment_status")("payment_status").notNull(),
  attendanceStatus: attendance_statusEnum("attendance_status")("attendance_status").notNull(),
  preferredDate: date("preferred_date"),
  preferredTime: time("preferred_time"),
  parentId: integer("parent_id").references(() => parents.id).notNull(),
  lessonTypeId: integer("lesson_type_id").references(() => lessonTypes.id).notNull(),
  focusAreas: text("focus_areas"),
  progressNote: text("progress_note"),
  coachName: text("coach_name").default("Coach Will"),
  focusAreaOther: text("focus_area_other"),
  sessionConfirmationEmailSent: boolean("session_confirmation_email_sent").notNull().default(false),
  sessionConfirmationEmailSentAt: timestamp({{ withTimezone: true }})("session_confirmation_email_sent_at"),
  cancellationReason: text("cancellation_reason"),
  cancellationRequestedAt: timestamp({{ withTimezone: true }})("cancellation_requested_at"),
  wantsReschedule: boolean("wants_reschedule").default(false),
  reschedulePreferences: text("reschedule_preferences"),
});

export const cookieConsent = pgTable("cookie_consent", {
  id: integer("id").primaryKey().notNull(),
  userId: integer("user_id"),
  necessary: boolean("necessary").notNull().default(true),
  analytics: boolean("analytics").notNull().default(false),
  marketing: boolean("marketing").notNull().default(false),
  region: text("region"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  seriesId: uuid("series_id").notNull(),
  parentEventId: uuid("parent_event_id").references(() => events.id),
  title: text("title").notNull().default(""),
  notes: text("notes"),
  location: text("location"),
  isAllDay: boolean("is_all_day").notNull().default(false),
  timezone: text("timezone").notNull().default("America/Los_Angeles"),
  startAt: timestamp({{ withTimezone: true }})("start_at").notNull(),
  endAt: timestamp({{ withTimezone: true }})("end_at").notNull(),
  recurrenceRule: text("recurrence_rule"),
  recurrenceEndAt: timestamp({{ withTimezone: true }})("recurrence_end_at"),
  recurrenceExceptions: jsonb("recurrence_exceptions").notNull(),
  createdBy: integer("created_by").references(() => admins.id),
  updatedBy: integer("updated_by").references(() => admins.id),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
  updatedAt: timestamp({{ withTimezone: true }})("updated_at").notNull().defaultNow(),
  isAvailabilityBlock: boolean("is_availability_block").notNull().default(false),
  blockingReason: text("blocking_reason"),
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("United States"),
  category: text("category"),
});

export const focusAreas = pgTable("focus_areas", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").unique().notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
  level: varchar({ length: 20 })("level"),
  apparatusId: integer("apparatus_id").references(() => apparatus.id),
});

export const genders = pgTable("genders", {
  id: integer("id").primaryKey().notNull(),
  name: varchar({ length: 50 })("name").unique().notNull(),
  displayName: varchar({ length: 50 })("display_name").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const gymPayoutRates = pgTable("gym_payout_rates", {
  id: bigserial("id").primaryKey().notNull(),
  durationMinutes: integer("duration_minutes").unique().notNull(),
  isMember: boolean("is_member").unique().notNull(),
  rateCents: integer("rate_cents").notNull(),
  effectiveFrom: timestamp({{ withTimezone: true }})("effective_from").unique().notNull().defaultNow(),
  effectiveTo: timestamp({{ withTimezone: true }})("effective_to"),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
  updatedAt: timestamp({{ withTimezone: true }})("updated_at").notNull().defaultNow(),
});

export const gymPayoutRuns = pgTable("gym_payout_runs", {
  id: bigserial("id").primaryKey().notNull(),
  periodStart: date("period_start").unique().notNull(),
  periodEnd: date("period_end").unique().notNull(),
  status: text("status").notNull(),
  totalSessions: integer("total_sessions").notNull(),
  totalOwedCents: integer("total_owed_cents").notNull(),
  generatedAt: timestamp({{ withTimezone: true }})("generated_at").notNull().defaultNow(),
  updatedAt: timestamp({{ withTimezone: true }})("updated_at").notNull().defaultNow(),
});

export const lessonTypes = pgTable("lesson_types", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").unique().notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  isPrivate: boolean("is_private").default(true),
  totalPrice: decimal("total_price").notNull(),
  reservationFee: decimal("reservation_fee").notNull(),
  description: text("description"),
  maxAthletes: integer("max_athletes").notNull(),
  minAthletes: integer("min_athletes").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  keyPoints: jsonb("key_points"),
});

export const parentPasswordResetTokens = pgTable("parent_password_reset_tokens", {
  id: integer("id").primaryKey().notNull(),
  parentId: integer("parent_id").references(() => parents.id).notNull(),
  token: text("token").unique().notNull(),
  expiresAt: timestamp({{ withTimezone: true }})("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
});

export const parentVerificationTokens = pgTable("parent_verification_tokens", {
  id: integer("id").primaryKey().notNull(),
  parentId: integer("parent_id").references(() => parents.id).notNull(),
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const parents = pgTable("parents", {
  id: integer("id").primaryKey().notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  emergencyContactName: text("emergency_contact_name").notNull(),
  emergencyContactPhone: text("emergency_contact_phone").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  passwordHash: text("password_hash").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  blogEmails: boolean("blog_emails").notNull().default(false),
  lastLoginAt: timestamp({{ withTimezone: true }})("last_login_at"),
});

export const privacyRequests = pgTable("privacy_requests", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  requestType: text("request_type").notNull(),
  details: text("details"),
  status: text("status").notNull().default("new"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const progressShareLinks = pgTable("progress_share_links", {
  id: integer("id").primaryKey().notNull(),
  athleteId: integer("athlete_id").references(() => athletes.id).notNull(),
  token: text("token").unique().notNull(),
  expiresAt: timestamp({{ withTimezone: true }})("expires_at"),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  sid: varchar("sid").primaryKey().notNull(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const sideQuests = pgTable("side_quests", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").unique().notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
});

export const siteContent = pgTable("site_content", {
  id: integer("id").primaryKey().notNull(),
  bannerVideo: text("banner_video").default(""),
  heroImages: jsonb("hero_images"),
  about: jsonb("about"),
  contact: jsonb("contact"),
  hours: jsonb("hours"),
  createdAt: timestamp({{ withTimezone: true }})("created_at").defaultNow(),
  updatedAt: timestamp({{ withTimezone: true }})("updated_at").defaultNow(),
  equipmentImages: jsonb("equipment_images"),
  logo: jsonb("logo"),
});

export const siteFaqs = pgTable("site_faqs", {
  id: integer("id").primaryKey().notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar({ length: 100 })("category"),
  displayOrder: integer("display_order"),
  createdAt: timestamp({{ withTimezone: true }})("created_at").defaultNow(),
  updatedAt: timestamp({{ withTimezone: true }})("updated_at").defaultNow(),
});

export const siteInquiries = pgTable("site_inquiries", {
  id: bigserial("id").primaryKey().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  athleteInfo: text("athlete_info"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  source: text("source").default("contact_form"),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
  updatedAt: timestamp({{ withTimezone: true }})("updated_at").notNull().defaultNow(),
});

export const skillComponents = pgTable("skill_components", {
  id: integer("id").primaryKey().notNull(),
  parentSkillId: integer("parent_skill_id").references(() => skills.id).unique().notNull(),
  componentSkillId: integer("component_skill_id").references(() => skills.id).unique().notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
});

export const skills = pgTable("skills", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").unique().notNull(),
  category: text("category").unique().notNull(),
  level: varchar({ length: 20 })("level").notNull(),
  description: text("description").notNull(),
  displayOrder: integer("display_order"),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
  updatedAt: timestamp({{ withTimezone: true }})("updated_at").notNull().defaultNow(),
  apparatusId: integer("apparatus_id").references(() => apparatus.id),
  isConnectedCombo: boolean("is_connected_combo").default(false),
  referenceVideos: jsonb("reference_videos"),
});

export const skillsPrerequisites = pgTable("skills_prerequisites", {
  id: integer("id").primaryKey().notNull(),
  skillId: integer("skill_id").references(() => skills.id).unique().notNull(),
  prerequisiteSkillId: integer("prerequisite_skill_id").references(() => skills.id).unique().notNull(),
  createdAt: timestamp({{ withTimezone: true }})("created_at").notNull().defaultNow(),
});

export const slotReservations = pgTable("slot_reservations", {
  id: integer("id").primaryKey().notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  lessonType: text("lesson_type").notNull(),
  sessionId: text("session_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const testimonials = pgTable("testimonials", {
  id: integer("id").primaryKey().notNull(),
  name: varchar({ length: 255 })("name").notNull(),
  text: text("text").notNull(),
  rating: integer("rating"),
  featured: boolean("featured").default(false),
  createdAt: timestamp({{ withTimezone: true }})("created_at").defaultNow(),
  updatedAt: timestamp({{ withTimezone: true }})("updated_at").defaultNow(),
});

export const tips = pgTable("tips", {
  id: integer("id").primaryKey().notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sections: jsonb("sections"),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  videoUrl: text("video_url"),
  publishedAt: timestamp("published_at"),
});

export const waivers = pgTable("waivers", {
  id: integer("id").primaryKey().notNull(),
  bookingId: integer("booking_id").references(() => bookings.id),
  athleteId: integer("athlete_id").references(() => athletes.id).notNull(),
  parentId: integer("parent_id").references(() => parents.id).notNull(),
  relationshipToAthlete: text("relationship_to_athlete").default("Parent/Guardian"),
  signature: text("signature").notNull(),
  emergencyContactNumber: text("emergency_contact_number").notNull(),
  understandsRisks: boolean("understands_risks").default(false),
  agreesToPolicies: boolean("agrees_to_policies").default(false),
  authorizesEmergencyCare: boolean("authorizes_emergency_care").default(false),
  allowsPhotoVideo: boolean("allows_photo_video").default(true),
  confirmsAuthority: boolean("confirms_authority").default(false),
  pdfPath: text("pdf_path"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  signedAt: timestamp("signed_at"),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
