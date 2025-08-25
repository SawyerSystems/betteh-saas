import { relations, sql } from "drizzle-orm";
import { boolean, check, date, decimal, integer, json, jsonb, pgEnum, pgTable, serial, text, time, timestamp, varchar, uuid, bigserial, bigint, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define PostgreSQL enum types for booking statuses
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "paid", 
  "confirmed", 
  "completed", 
  "failed", 
  "cancelled"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "reservation-pending",
  "reservation-paid",
  "reservation-failed",
  "session-paid",
  "reservation-refunded",
  "session-refunded"
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "pending", 
  "confirmed", 
  "completed", 
  "cancelled", 
  "no-show", 
  "manual"
]);

// Multi-tenant enums
export const tenantUserRoleEnum = pgEnum("tenant_user_role", [
  "platform_admin",
  "coach_admin", 
  "coach_staff",
  "parent",
  "athlete",
  // Enhanced organizational roles
  "gym_owner",
  "head_coach", 
  "assistant_coach",
  "front_desk"
]);

export const tenantStatusEnum = pgEnum("tenant_status", [
  "active",
  "inactive",
  "suspended"
]);

export const tenantTypeEnum = pgEnum("tenant_type", [
  "individual",
  "organization"
]);

// Create TypeScript enums from the PostgreSQL enums for type safety
export enum BookingStatusEnum {
  PENDING = "pending",
  PAID = "paid", 
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
  
  // Legacy values - preserved in TypeScript for backward compatibility
  // but no longer used in new code or stored in the database
  // MANUAL = "manual",
  // MANUAL_PAID = "manual-paid",
  // NO_SHOW = "no-show", 
  // RESERVATION_PENDING = "reservation-pending",
  // RESERVATION_PAID = "reservation-paid",
  // RESERVATION_FAILED = "reservation-failed"
}

export enum PaymentStatusEnum {
  UNPAID = "unpaid",
  RESERVATION_PENDING = "reservation-pending",
  RESERVATION_PAID = "reservation-paid",
  RESERVATION_FAILED = "reservation-failed",
  SESSION_PAID = "session-paid",
  RESERVATION_REFUNDED = "reservation-refunded",
  SESSION_REFUNDED = "session-refunded"
}

export enum AttendanceStatusEnum {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no-show",
  MANUAL = "manual"
}

// TypeScript enum for booking methods
export enum BookingMethodEnum {
  WEBSITE = "Website",
  ADMIN = "Admin", 
  TEXT = "Text",
  CALL = "Call",
  IN_PERSON = "In-Person",
  EMAIL = "Email"
}

// TypeScript enum for tenant user roles
export enum TenantUserRoleEnum {
  PLATFORM_ADMIN = "platform_admin",
  COACH_ADMIN = "coach_admin",
  COACH_STAFF = "coach_staff", 
  PARENT = "parent",
  ATHLETE = "athlete",
  // Enhanced organizational roles
  GYM_OWNER = "gym_owner",
  HEAD_COACH = "head_coach",
  ASSISTANT_COACH = "assistant_coach",
  FRONT_DESK = "front_desk"
}

// TypeScript enum for tenant types
export enum TenantTypeEnum {
  INDIVIDUAL = "individual",
  ORGANIZATION = "organization"
}

// Enhanced permission system types
export interface FeatureLimits {
  maxAthletes: number; // -1 = unlimited
  maxMonthlyBookings: number;
  maxStaff: number;
  maxLocations: number;
  features: {
    videoAnalysis: boolean;
    advancedReporting: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    multiLocation: boolean;
    whiteLabel: boolean;
    customIntegrations: boolean;
  };
}

export interface PlanPricing {
  individual: {
    solo: { price: number; limits: FeatureLimits };
    pro: { price: number; limits: FeatureLimits };
  };
  organization: {
    starter: { price: number; limits: FeatureLimits };
    professional: { price: number; limits: FeatureLimits };
    enterprise: { price: number; limits: FeatureLimits };
  };
}

// Permission matrix type
export type Permission = 
  // Tenant management
  | 'tenants:create' | 'tenants:read' | 'tenants:update' | 'tenants:delete' | 'tenants:*'
  // User management  
  | 'users:read' | 'users:*'
  // Staff management
  | 'staff:invite' | 'staff:manage' | 'staff:manage:coaches' | 'staff:*'
  // Location management
  | 'locations:read' | 'locations:create' | 'locations:update' | 'locations:delete' | 'locations:*'
  // Athlete management
  | 'athletes:read' | 'athletes:create' | 'athletes:update' | 'athletes:delete' | 'athletes:*'
  | 'athletes:read:own' | 'athletes:update:assigned'
  // Booking management
  | 'bookings:read' | 'bookings:create' | 'bookings:update' | 'bookings:delete' | 'bookings:*'
  | 'bookings:read:own' | 'bookings:create:own' | 'bookings:update:assigned'
  // Program management
  | 'programs:read' | 'programs:create' | 'programs:update' | 'programs:delete' | 'programs:*'
  // Schedule management
  | 'schedules:read' | 'schedules:create' | 'schedules:update' | 'schedules:delete' | 'schedules:*'
  // Waiver management
  | 'waivers:read' | 'waivers:sign' | 'waivers:manage' | 'waivers:sign:own'
  // Payment management
  | 'payments:view' | 'payments:process' | 'payments:view:own'
  // Reporting
  | 'reports:read' | 'reports:*'
  // System/platform - Fixed billing permissions
  | 'system:*' | 'billing:read' | 'billing:manage' | 'billing:*' | 'analytics:read' | 'analytics:*'
  // Settings
  | 'settings:update'
  // Profile management
  | 'profile:read:own' | 'progress:read:own' | 'bookings:view:own';

export const ROLE_PERMISSIONS: Record<TenantUserRoleEnum, Permission[]> = {
  // Platform Level
  [TenantUserRoleEnum.PLATFORM_ADMIN]: [
    'tenants:*', 'users:*', 'billing:*', 'analytics:*', 'system:*'
  ],
  
  // Organizational Tenant Roles
  [TenantUserRoleEnum.GYM_OWNER]: [
    'tenants:read', 'tenants:update', 'staff:*', 'locations:*', 'billing:read',
    'athletes:*', 'bookings:*', 'programs:*', 'reports:*', 'settings:update'
  ],
  
  [TenantUserRoleEnum.HEAD_COACH]: [
    'staff:invite', 'staff:manage:coaches', 'programs:*', 'schedules:*',
    'athletes:*', 'bookings:*', 'reports:read', 'locations:read'
  ],
  
  [TenantUserRoleEnum.ASSISTANT_COACH]: [
    'athletes:read', 'athletes:update:assigned', 'bookings:read', 
    'bookings:update:assigned', 'schedules:read', 'programs:read'
  ],
  
  [TenantUserRoleEnum.FRONT_DESK]: [
    'athletes:read', 'athletes:create', 'bookings:*', 'schedules:read',
    'payments:process', 'waivers:manage'
  ],
  
  // Individual Tenant Roles  
  [TenantUserRoleEnum.COACH_ADMIN]: [
    'athletes:*', 'bookings:*', 'schedules:*', 'programs:*',
    'billing:read', 'settings:update', 'reports:*'
  ],
  
  [TenantUserRoleEnum.COACH_STAFF]: [
    'athletes:read', 'athletes:update', 'bookings:read', 'bookings:update',
    'schedules:read', 'programs:read'
  ],
  
  // Client Roles (shared across tenant types)
  [TenantUserRoleEnum.PARENT]: [
    'athletes:read:own', 'bookings:read:own', 'bookings:create:own',
    'waivers:sign:own', 'payments:view:own'
  ],
  
  [TenantUserRoleEnum.ATHLETE]: [
    'profile:read:own', 'progress:read:own', 'bookings:view:own'
  ]
};

export function hasPermission(
  userRole: TenantUserRoleEnum, 
  resource: string, 
  action: string,
  ownership?: 'own' | 'assigned' | 'any'
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Check wildcard permissions
  if (rolePermissions.includes(`${resource}:*` as Permission)) return true;
  
  // Check specific permission
  const permission = ownership 
    ? `${resource}:${action}:${ownership}` as Permission
    : `${resource}:${action}` as Permission;
  return rolePermissions.includes(permission);
}


// ---------------------------------------------------------------------------
// Multi-tenant core infrastructure tables (added before tenant-scoped tables)
// ---------------------------------------------------------------------------
export const featurePlans = pgTable("feature_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  limits: jsonb("limits").notNull().default({}),
  priceLookupKey: text("price_lookup_key"),
  // Enhanced feature plan fields
  tenantType: tenantTypeEnum("tenant_type").notNull().default("individual"),
  isPerSeat: boolean("is_per_seat").default(false),
  maxCoaches: integer("max_coaches").default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  featurePlansCodeKey: unique("feature_plans_code_key").on(table.code),
}));

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  status: tenantStatusEnum("status").notNull().default("active"),
  planId: uuid("plan_id").references(() => featurePlans.id),
  timezone: text("timezone").notNull().default("UTC"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeAccountId: text("stripe_account_id"),
  // Enhanced tenant fields
  tenantType: tenantTypeEnum("tenant_type").notNull().default("individual"),
  parentTenantId: uuid("parent_tenant_id"), // Remove self-reference for now
  coachCount: integer("coach_count").default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantsSlugKey: unique("tenants_slug_key").on(table.slug),
  tenantTypeCheck: check("tenants_tenant_type_check", sql`tenant_type IN ('individual', 'organization')`),
  coachCountCheck: check("tenants_coach_count_check", sql`coach_count > 0`)
}));

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authProviderId: text("auth_provider_id"),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  usersEmailKey: unique("users_email_key").on(table.email),
  usersAuthProviderKey: unique("users_auth_provider_id_key").on(table.authProviderId),
}));

export const tenantUsers = pgTable("tenant_users", {
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: tenantUserRoleEnum("role").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantUsersPk: unique("tenant_users_pk").on(table.tenantId, table.userId),
  tenantUsersRoleIdx: unique("tenant_users_role_dedupe").on(table.tenantId, table.userId, table.role),
}));

export const tenantSettings = pgTable("tenant_settings", {
  tenantId: uuid("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
  branding: jsonb("branding").notNull().default({}),
  featureFlags: jsonb("feature_flags").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: tenantUserRoleEnum("role").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  invitationsTokenKey: unique("invitations_token_key").on(table.token),
  invitationsEmailPerTenant: unique("invitations_email_per_tenant").on(table.tenantId, table.email)
}));

// Enhanced multi-tenant tables for organizational structure
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: jsonb("address"),
  timezone: text("timezone").notNull().default("UTC"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const staffLocations = pgTable("staff_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  locationId: uuid("location_id").notNull().references(() => locations.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  staffLocationUnique: unique("staff_locations_unique").on(table.tenantId, table.userId, table.locationId)
}));

export const organizationHierarchy = pgTable("organization_hierarchy", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentTenantId: uuid("parent_tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  childTenantId: uuid("child_tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  relationshipType: text("relationship_type").notNull().default("location"), // 'location', 'franchise', 'division'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgHierarchyUnique: unique("organization_hierarchy_unique").on(table.parentTenantId, table.childTenantId),
  parentChildCheck: check("organization_hierarchy_parent_child_check", sql`parent_tenant_id != child_tenant_id`)
}));

// ---------------------------------------------------------------------------
// Tenant-scoped domain tables (augment existing ones with tenantId)
// ---------------------------------------------------------------------------
export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone").notNull(),
  emergencyContactName: text("emergency_contact_name").notNull(),
  emergencyContactPhone: text("emergency_contact_phone").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  blogEmails: boolean("blog_emails").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  parentsEmailPerTenant: unique("parents_email_per_tenant").on(table.tenantId, table.email)
}));

export const blogEmailSignups = pgTable("blog_email_signups", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const parentVerificationTokens = pgTable("parent_verification_tokens", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => parents.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(), // WITHOUT timezone in DB
  createdAt: timestamp("created_at").defaultNow().notNull(), // WITHOUT timezone in DB
});

export const parentPasswordResetTokens = pgTable("parent_password_reset_tokens", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => parents.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // with timezone in DB
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // with timezone in DB
}, (table) => ({
  parentPasswordResetTokensTokenKey: unique("parent_password_reset_tokens_token_key").on(table.token),
}));

export const athletes = pgTable('athletes', {
  id: serial('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id').references(() => parents.id),
  name: text('name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  allergies: text('allergies'),
  experience: text('experience').notNull(),
  photo: text('photo'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  dateOfBirth: date('date_of_birth'),
  gender: text('gender'),
  isGymMember: boolean('is_gym_member').notNull().default(false),
  latestWaiverId: integer('latest_waiver_id').references((): any => waivers.id, { onDelete: 'set null' }),
  waiverStatus: varchar('waiver_status', { length: 20 }).default('pending'),
  waiverSigned: boolean('waiver_signed').default(false).notNull(),
});

// Lesson types table
export const lessonTypes = pgTable("lesson_types", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  isPrivate: boolean("is_private").default(true),
  totalPrice: decimal("total_price").notNull(),
  reservationFee: decimal("reservation_fee").notNull(),
  maxAthletes: integer("max_athletes").notNull().default(1),
  minAthletes: integer("min_athletes").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  keyPoints: jsonb("key_points").default([]),
}, (table) => ({
  lessonTypesNamePerTenant: unique("lesson_types_name_per_tenant").on(table.tenantId, table.name),
}));

// Booking method enum for the new dropdown requirements
export const bookingMethodEnum = pgEnum("booking_method", [
  "Website", "Admin", "Text", "Call", "In-Person", "Email"
]);

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  parentId: integer("parent_id").references(() => parents.id),
  lessonTypeId: integer("lesson_type_id").references(() => lessonTypes.id),
  preferredDate: date("preferred_date"),
  preferredTime: time("preferred_time"),
  status: bookingStatusEnum("status").notNull().default("pending"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
  attendanceStatus: attendanceStatusEnum("attendance_status").notNull().default("pending"),
  bookingMethod: text("booking_method").notNull().default("Website"),
  reservationFeePaid: boolean("reservation_fee_paid").notNull().default(false),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  stripeSessionId: text("stripe_session_id"),
  sessionConfirmationEmailSent: boolean("session_confirmation_email_sent").notNull().default(false),
  sessionConfirmationEmailSentAt: timestamp("session_confirmation_email_sent_at", { withTimezone: true }),
  specialRequests: text("special_requests"),
  adminNotes: text("admin_notes"),
  focusAreas: text("focus_areas").array(),
  focusAreaOther: text("focus_area_other"),
  progressNote: text("progress_note"),
  coachName: text("coach_name").default("Betteh Coach"),
  dropoffPersonName: text("dropoff_person_name").notNull(),
  dropoffPersonRelationship: text("dropoff_person_relationship").notNull(),
  dropoffPersonPhone: text("dropoff_person_phone").notNull(),
  pickupPersonName: text("pickup_person_name").notNull(),
  pickupPersonRelationship: text("pickup_person_relationship").notNull(),
  pickupPersonPhone: text("pickup_person_phone").notNull(),
  altPickupPersonName: text("alt_pickup_person_name"),
  altPickupPersonRelationship: text("alt_pickup_person_relationship"),
  altPickupPersonPhone: text("alt_pickup_person_phone"),
  safetyVerificationSigned: boolean("safety_verification_signed").notNull().default(false),
  safetyVerificationSignedAt: timestamp("safety_verification_signed_at"),
  cancellationReason: text("cancellation_reason"),
  cancellationRequestedAt: timestamp("cancellation_requested_at", { withTimezone: true }),
  wantsReschedule: boolean("wants_reschedule").default(false),
  reschedulePreferences: text("reschedule_preferences"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookingAthletes = pgTable("booking_athletes", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  athleteId: integer("athlete_id").notNull().references(() => athletes.id, { onDelete: "cascade" }),
  slotOrder: integer("slot_order").notNull(), // 1 = first slot, 2 = second, etc.
  // Snapshot + payout computation fields
  gymMemberAtBooking: boolean('gym_member_at_booking').notNull().default(false),
  durationMinutes: integer('duration_minutes'),
  gymRateAppliedCents: integer('gym_rate_applied_cents'),
  gymPayoutOwedCents: integer('gym_payout_owed_cents'),
  gymPayoutComputedAt: timestamp('gym_payout_computed_at', { withTimezone: true }), // with timezone in DB
  gymPayoutOverrideCents: integer('gym_payout_override_cents'),
  gymPayoutOverrideReason: text('gym_payout_override_reason'),
});

export const bookingLogs = pgTable("booking_logs", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  actionType: text("action_type").notNull(), // "created", "confirmed", "cancelled", "completed", "no-show", "payment_received", "waiver_signed", "rescheduled"
  actionDescription: text("action_description").notNull(),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  performedBy: text("performed_by").notNull(), // "system", "admin", "parent"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentLogs = pgTable("payment_logs", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  stripeEvent: text("stripe_event"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Comprehensive Activity/Audit Log System
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  
  // Who performed the action
  actorType: text("actor_type").notNull(), // "admin", "parent", "system"
  actorId: integer("actor_id"), // admin.id, parent.id, or null for system
  actorName: text("actor_name").notNull(), // Display name for the actor
  
  // What was the action
  actionType: text("action_type").notNull(), // "created", "updated", "deleted", "status_changed", etc.
  actionCategory: text("action_category").notNull(), // "booking", "athlete", "payment", "waiver", "schedule", etc.
  actionDescription: text("action_description").notNull(), // Human-readable description
  
  // What was affected
  targetType: text("target_type").notNull(), // "booking", "athlete", "parent", "payment", etc.
  targetId: integer("target_id"), // ID of the affected record
  targetIdentifier: text("target_identifier"), // Human-readable identifier (e.g., "Booking #123", "Bailey S.")
  
  // Change details
  fieldChanged: text("field_changed"), // Specific field that changed (optional)
  previousValue: text("previous_value"), // JSON string of old values
  newValue: text("new_value"), // JSON string of new values
  
  // Additional context
  notes: text("notes"), // Optional admin note explaining the change
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional context data
  
  // Technical details
  ipAddress: text("ip_address"), // For security auditing
  userAgent: text("user_agent"), // Browser/device info
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // with timezone in DB
  
  // Soft delete and undo functionality
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // with timezone in DB
  deletedBy: integer("deleted_by"), // admin.id who soft-deleted this entry
  
  // Undo/reversal tracking
  isReversed: boolean("is_reversed").default(false).notNull(),
  reversedAt: timestamp("reversed_at", { withTimezone: true }), // with timezone in DB
  reversedBy: integer("reversed_by"), // admin.id who reversed this action
  reverseActionId: integer("reverse_action_id"), // Reference to the activity log entry that reversed this
  originalActionId: integer("original_action_id"), // Reference to the original action if this is a reverse
  
  // Grouping for bulk operations
  batchId: text("batch_id"), // UUID for grouping related actions
  batchDescription: text("batch_description"), // Description of the batch operation
});

export const waivers = pgTable("waivers", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id, { onDelete: "set null" }), // nullable, FK SET NULL on delete
  athleteId: integer("athlete_id").references(() => athletes.id).notNull(),
  parentId: integer("parent_id").references(() => parents.id).notNull(),
  relationshipToAthlete: text("relationship_to_athlete").default("Parent/Guardian"), // nullable in actual DB
  signature: text("signature").notNull(),
  emergencyContactNumber: text("emergency_contact_number").notNull(),
  understandsRisks: boolean("understands_risks").default(false), // nullable in actual DB
  agreesToPolicies: boolean("agrees_to_policies").default(false), // nullable in actual DB
  authorizesEmergencyCare: boolean("authorizes_emergency_care").default(false), // nullable in actual DB
  allowsPhotoVideo: boolean("allows_photo_video").default(true), // nullable in actual DB
  confirmsAuthority: boolean("confirms_authority").default(false), // nullable in actual DB
  pdfPath: text("pdf_path"), // nullable
  ipAddress: text("ip_address"), // nullable
  userAgent: text("user_agent"), // nullable
  signedAt: timestamp("signed_at").defaultNow(), // nullable in actual DB
  emailSentAt: timestamp("email_sent_at"), // nullable
  createdAt: timestamp("created_at").defaultNow(), // nullable in actual DB
  updatedAt: timestamp("updated_at").defaultNow(), // nullable in actual DB
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  sections: jsonb("sections"),
});

export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sections: jsonb("sections").$type<Array<{
    title: string;
    content: string;
    imageUrl?: string;
  }>>(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  videoUrl: text("video_url"),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
});

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: time("start_time").notNull(), // Native TIME type
  endTime: time("end_time").notNull(), // Native TIME type
  isRecurring: boolean("is_recurring").default(true).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
});

// Define enum for availability exception categories
export const availabilityExceptionCategoryEnum = pgEnum("availability_exception_category", [
  "Coaching: Team Meet/Competition",
  "Coaching: Practice", 
  "Own: Team Meet/Competition",
  "Own: Practice",
  "Medical Appointment",
  "Dental Appointment",
  "Other Appointment",
  "Meeting",
  "Busy: Work",
  "Busy: Personal"
]);

export const availabilityExceptions = pgTable("availability_exceptions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(), // Native DATE type
  startTime: time("start_time"), // Made optional for all-day events
  endTime: time("end_time"), // Made optional for all-day events
  isAvailable: boolean("is_available").default(false).notNull(), // Usually false for exceptions (blocked times)
  reason: text("reason"), // Optional reason for the exception
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // New fields for personal reminder functionality
  title: text("title"), // Optional title for better event naming
  category: text("category"), // Category selector with predefined options
  notes: text("notes"), // Additional details
  allDay: boolean("all_day").default(false).notNull(), // Full day events
  
  // Address fields (all nullable)
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("United States"),
});

// Normalized lookup tables for apparatus, focus areas, side quests, and genders
export const apparatus = pgTable("apparatus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // with timezone in DB
}, (table) => ({
  apparatusNameKey: unique("apparatus_name_key").on(table.name),
}));

export const focusAreas = pgTable("focus_areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  apparatusId: integer("apparatus_id").references(() => apparatus.id),
  level: varchar("level", { length: 20 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // with timezone in DB
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
}, (table) => ({
  focusAreasNameKey: unique("focus_areas_name_key").on(table.name),
}));

export const sideQuests = pgTable("side_quests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // with timezone in DB
}, (table) => ({
  sideQuestsNameKey: unique("side_quests_name_key").on(table.name),
}));

// Skills master list and athlete progress tracking (must match Supabase schema)
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  level: varchar("level", { length: 20 }).notNull(), // varchar(20) in DB
  description: text("description").notNull(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  apparatusId: integer("apparatus_id").references(() => apparatus.id),
  isConnectedCombo: boolean("is_connected_combo").default(false), // Missing field from DB
  referenceVideos: jsonb("reference_videos").$type<VideoReference[]>().default([]),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
});

// Events (recurring series + overrides). Must match Supabase schema in attached_assets/complete_current_schema.txt after SQL is applied.
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  seriesId: uuid("series_id").notNull().defaultRandom(),
  parentEventId: uuid("parent_event_id"),
  title: text("title").notNull().default(""),
  notes: text("notes"),
  location: text("location"), // Simple location text (kept for backward compatibility)
  
  // Full address fields (matching availability_exceptions schema)
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"), 
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("United States"),
  
  isAllDay: boolean("is_all_day").notNull().default(false),
  timezone: text("timezone").notNull().default("America/Los_Angeles"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  recurrenceRule: text("recurrence_rule"),
  recurrenceEndAt: timestamp("recurrence_end_at", { withTimezone: true }),
  recurrenceExceptions: jsonb("recurrence_exceptions").$type<string[]>().notNull().default([] as unknown as any),
  
  // Availability blocking fields (replaces availability_exceptions functionality)
  isAvailabilityBlock: boolean("is_availability_block").notNull().default(false),
  blockingReason: text("blocking_reason"), // Maps to availability_exceptions.reason
  
  // Category field for event classification and color coding
  category: text("category"), // Category selector with predefined options
  
  createdBy: integer("created_by").references((): any => admins.id),
  updatedBy: integer("updated_by").references((): any => admins.id),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export const athleteSkills = pgTable("athlete_skills", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").references(() => athletes.id),
  skillId: integer("skill_id").references(() => skills.id),
  status: varchar("status", { length: 20 }).notNull().default("learning"), // varchar(20) in DB
  notes: text("notes"),
  unlockDate: date("unlock_date"),
  firstTestedAt: timestamp("first_tested_at", { withTimezone: true }),
  lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const athleteSkillVideos = pgTable("athlete_skill_videos", {
  id: serial("id").primaryKey(),
  athleteSkillId: integer("athlete_skill_id").references(() => athleteSkills.id).notNull(),
  url: text("url").notNull(),
  title: text("title"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  caption: text("caption"),
  isVisible: boolean("is_visible").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  displayDate: date("display_date"),
  sortIndex: integer("sort_index").notNull().default(0),
  thumbnailUrl: text("thumbnail_url"),
  optimizedUrl: text("optimized_url"),
  processingStatus: text("processing_status").notNull().default("pending"),
  processingError: text("processing_error"), // Missing field from DB
});

export const progressShareLinks = pgTable("progress_share_links", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").references(() => athletes.id),
  token: text("token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }),
});

export const genders = pgTable("genders", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // varchar(50) in DB
  displayName: varchar("display_name", { length: 50 }).notNull(), // varchar(50) in DB
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  gendersNameKey: unique("genders_name_key").on(table.name),
}));

// Join tables for booking relationships
export const bookingApparatus = pgTable("booking_apparatus", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  apparatusId: integer("apparatus_id").notNull().references(() => apparatus.id, { onDelete: "cascade" }),
});

export const bookingFocusAreas = pgTable("booking_focus_areas", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  focusAreaId: integer("focus_area_id").notNull().references(() => focusAreas.id, { onDelete: "cascade" }),
});

export const bookingSideQuests = pgTable("booking_side_quests", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  sideQuestId: integer("side_quest_id").notNull().references(() => sideQuests.id, { onDelete: "cascade" }),
});

// Admin authentication table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(), // WITHOUT timezone in DB
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // WITH timezone in DB
}, (table) => ({
  adminsEmailKey: unique("admins_email_key").on(table.email),
}));


export const insertParentSchema = createInsertSchema(parents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  passwordHash: z.string().min(1), // required on signup
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
  // Transitional: make tenantId optional during migration; storage layer will inject default tenant
  tenantId: z.string().uuid().optional(),
});

export const insertBlogEmailSignupSchema = createInsertSchema(blogEmailSignups).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
});

export const insertAthleteSchema = createInsertSchema(athletes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  experience: z.enum(["beginner", "intermediate", "advanced", "elite"]),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  gender: z.string().optional(), // Will be validated against genders table
  isGymMember: z.boolean().optional(),
  // Transitional: tenantId optional; storage will supply default
  tenantId: z.string().uuid().optional(),
});

// Gym payout rates (effective-dated)
export const gymPayoutRates = pgTable('gym_payout_rates', {
  id: bigserial('id', { mode: 'number' }).primaryKey(), // bigserial matches DB bigint with sequence
  durationMinutes: integer('duration_minutes').notNull(), // e.g., 30 or 60
  isMember: boolean('is_member').notNull(),
  rateCents: integer('rate_cents').notNull(),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(), // with timezone in DB
  effectiveTo: timestamp('effective_to', { withTimezone: true }), // with timezone in DB
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), // with timezone in DB
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(), // with timezone in DB
});

// Gym payout runs (monthly/period summaries)
export const gymPayoutRuns = pgTable('gym_payout_runs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(), // bigserial matches DB bigint with sequence
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  status: text('status').notNull(), // text in DB, not default value
  totalSessions: integer('total_sessions').notNull().default(0),
  totalOwedCents: integer('total_owed_cents').notNull().default(0),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(), // with timezone in DB
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(), // with timezone in DB
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Transitional: tenantId optional at call sites; storage layer ensures a tenant id is set
  tenantId: z.string().uuid().optional(),
  // Foreign key IDs (required)
  parentId: z.number().positive("Parent ID is required"),
  lessonTypeId: z.number().positive("Lesson type ID is required"),
  
  // Core booking details
  preferredDate: z.coerce.date(),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  
  // Status enums
  status: z.nativeEnum(BookingStatusEnum).default(BookingStatusEnum.PENDING),
  bookingMethod: z.nativeEnum(BookingMethodEnum).default(BookingMethodEnum.WEBSITE),
  paymentStatus: z.nativeEnum(PaymentStatusEnum).default(PaymentStatusEnum.UNPAID),
  attendanceStatus: z.nativeEnum(AttendanceStatusEnum).default(AttendanceStatusEnum.PENDING),
  
  // Arrays for junction table relationships
  apparatusIds: z.array(z.number()).max(4).default([]),
  focusAreaIds: z.array(z.number()).max(8).default([]),
  focusAreaOther: z.string().optional(), // Custom focus area text when "Other" is selected
  sideQuestIds: z.array(z.number()).max(4).default([]),
  
  // Legacy support for parent info (will be used to find/create parentId)
  parentFirstName: z.string().optional(),
  parentLastName: z.string().optional(), 
  parentEmail: z.string().email().optional(),
  parentPhone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  
  // Legacy support for lesson type (will be used to find lessonTypeId)
  lessonType: z.string().optional(),
  
  safetyVerificationSignedAt: z.union([z.date(), z.string().transform(str => new Date(str))]).nullable().optional(),
  // Safety verification fields
  dropoffPersonName: z.string().min(1, "Dropoff person name is required"),
  dropoffPersonRelationship: z.enum(["Parent", "Guardian", "Grandparent", "Aunt/Uncle", "Sibling", "Family Friend", "Other"]),
  dropoffPersonPhone: z.string().min(1, "Dropoff person phone is required"),
  pickupPersonName: z.string().min(1, "Pickup person name is required"),
  pickupPersonRelationship: z.enum(["Parent", "Guardian", "Grandparent", "Aunt/Uncle", "Sibling", "Family Friend", "Other"]),
  pickupPersonPhone: z.string().min(1, "Pickup person phone is required"),
  altPickupPersonRelationship: z.enum(["Parent", "Guardian", "Grandparent", "Aunt/Uncle", "Sibling", "Family Friend", "Other"]).nullable().optional(),
  // Athletes array for booking creation
  athletes: z.array(z.object({
    athleteId: z.number().nullable().optional(), // Optional for new athletes, can be null
    slotOrder: z.number(),
    name: z.string(),
    dateOfBirth: z.string(),
    gender: z.string().optional(), // Will be validated against genders table
    allergies: z.string().optional(),
    experience: z.string(),
    photo: z.string().optional(),
  })).optional(),
});

export const insertBookingAthleteSchema = createInsertSchema(bookingAthletes).omit({
  id: true,
});

export const insertBookingLogSchema = createInsertSchema(bookingLogs).omit({
  id: true,
  createdAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  publishedAt: true,
});

export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
  publishedAt: true,
}).extend({
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
    imageUrl: z.string().optional(),
  })).optional(),
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
  createdAt: true,
}).extend({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export const insertAvailabilityExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format").optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format").optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format").optional(),
  isAvailable: z.boolean().default(false),
  reason: z.string().optional(),
  
  // New fields for personal reminder functionality
  title: z.string().optional(),
  category: z.enum([
    "Coaching: Team Meet/Competition",
    "Coaching: Practice", 
    "Own: Team Meet/Competition",
    "Own: Practice",
    "Medical Appointment",
    "Dental Appointment",
    "Other Appointment",
    "Meeting",
    "Busy: Work",
    "Busy: Personal"
  ]).optional(),
  notes: z.string().optional(),
  allDay: z.boolean().default(false),
  
  // Address fields (all optional)
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default("United States").optional(),
}).transform((data) => {
  // Handle both camelCase and snake_case
  return {
    date: data.date,
    startTime: data.startTime || data.start_time,
    endTime: data.endTime || data.end_time,
    isAvailable: data.isAvailable,
    reason: data.reason,
    title: data.title,
    category: data.category,
    notes: data.notes,
    allDay: data.allDay,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    country: data.country,
  };
}).refine((data) => {
  // If not an all-day event, require start and end times
  if (!data.allDay) {
    return data.startTime && data.endTime;
  }
  return true;
}, {
  message: "Start time and end time are required for timed events",
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email(),
});

// Insert schemas for normalized lookup tables
export const insertApparatusSchema = createInsertSchema(apparatus).omit({
  id: true,
  createdAt: true,
});

export const insertFocusAreaSchema = createInsertSchema(focusAreas).omit({
  id: true,
  createdAt: true,
});

export const insertSideQuestSchema = createInsertSchema(sideQuests).omit({
  id: true,
  createdAt: true,
});

export const insertGenderSchema = createInsertSchema(genders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas for skills-related tables
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true });
export const insertAthleteSkillSchema = createInsertSchema(athleteSkills).omit({ id: true });
export const insertAthleteSkillVideoSchema = createInsertSchema(athleteSkillVideos).omit({ id: true });
export const insertProgressShareLinkSchema = createInsertSchema(progressShareLinks).omit({ id: true });

// Missing tables from database that need to be added to match schema

// Express session table
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey().notNull(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(), // timestamp(6) in DB
});

// Skills prerequisite relationships
export const skillsPrerequisites = pgTable("skills_prerequisites", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  prerequisiteSkillId: integer("prerequisite_skill_id").notNull().references(() => skills.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Skill components (composite skills)
export const skillComponents = pgTable("skill_components", {
  id: serial("id").primaryKey(),
  parentSkillId: integer("parent_skill_id").notNull().references(() => skills.id),
  componentSkillId: integer("component_skill_id").notNull().references(() => skills.id),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Archived bookings table
export const archivedBookings = pgTable("archived_bookings", {
  id: serial("id").primaryKey(),
  originalBookingId: integer("original_booking_id"),
  parentId: integer("parent_id"),
  athleteId: integer("athlete_id"),
  lessonTypeId: integer("lesson_type_id"),
  waiverId: integer("waiver_id"),
  preferredDate: date("preferred_date"),
  preferredTime: time("preferred_time"),
  focusAreas: text("focus_areas").array(), // ARRAY type in DB
  status: bookingStatusEnum("status"),
  paymentStatus: paymentStatusEnum("payment_status"),
  attendanceStatus: attendanceStatusEnum("attendance_status"),
  bookingMethod: text("booking_method"),
  reservationFeePaid: boolean("reservation_fee_paid"),
  paidAmount: decimal("paid_amount"),
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

// Insert schemas for join tables
export const insertBookingApparatusSchema = createInsertSchema(bookingApparatus).omit({
  id: true,
});

export const insertBookingFocusAreaSchema = createInsertSchema(bookingFocusAreas).omit({
  id: true,
});

export const insertBookingSideQuestSchema = createInsertSchema(bookingSideQuests).omit({
  id: true,
});

// TypeScript types for normalized lookup tables and their relationships
export type Apparatus = typeof apparatus.$inferSelect;
export type FocusArea = typeof focusAreas.$inferSelect;
export type SideQuest = typeof sideQuests.$inferSelect;
export type Gender = typeof genders.$inferSelect;

export type InsertApparatus = z.infer<typeof insertApparatusSchema>;
export type InsertFocusArea = z.infer<typeof insertFocusAreaSchema>;
export type InsertSideQuest = z.infer<typeof insertSideQuestSchema>;
export type InsertGender = z.infer<typeof insertGenderSchema>;

export type BookingApparatus = typeof bookingApparatus.$inferSelect;
export type BookingFocusArea = typeof bookingFocusAreas.$inferSelect;
export type BookingSideQuest = typeof bookingSideQuests.$inferSelect;

export type InsertBookingApparatus = z.infer<typeof insertBookingApparatusSchema>;
export type InsertBookingFocusArea = z.infer<typeof insertBookingFocusAreaSchema>;
export type InsertBookingSideQuest = z.infer<typeof insertBookingSideQuestSchema>;

// Enhanced booking type with normalized relationships
// Enhanced booking type with normalized relationships
export type BookingWithRelations = Booking & {
  // Related entities via foreign keys
  parent?: Parent;
  lessonType?: LessonType;
  waiver?: Waiver;
  
  // Junction table relationships
  apparatus: Array<{ id: number; name: string }>;
  focusAreas: string[]; // Array of focus area names/skills
  sideQuests: Array<{ id: number; name: string }>;
  athletes?: Array<Athlete>;
  
  // Legacy fields for backward compatibility
  parentFirstName?: string;
  parentLastName?: string;
  parentEmail?: string;
  parentPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  lessonTypeName?: string;
  amount?: number;
  waiverSigned?: boolean;
  waiverSignedAt?: Date | null;
  waiverSignatureName?: string;
};

export const insertWaiverSchema = createInsertSchema(waivers).omit({
  id: true,
  emailSentAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  relationshipToAthlete: z.string().min(1),
  signature: z.string().min(1),
  emergencyContactNumber: z.string().min(1),
  signedAt: z.union([z.date(), z.string().transform(str => new Date(str))]).optional(),
});

export type Parent = typeof parents.$inferSelect;
export type InsertParent = z.infer<typeof insertParentSchema>;
// Input variant allowing tenantId to be omitted at call sites during migration
export type InsertParentInput = Omit<InsertParent, 'tenantId'> & { tenantId?: string };
export type BlogEmailSignup = typeof blogEmailSignups.$inferSelect;
export type InsertBlogEmailSignup = typeof blogEmailSignups.$inferInsert;
// Legacy aliases for backward compatibility
export type Customer = Parent;
export type InsertCustomer = InsertParent;
export const insertCustomerSchema = insertParentSchema;
export const customers = parents; // Table alias for backward compatibility
export type Athlete = typeof athletes.$inferSelect;
export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type InsertAthleteInput = Omit<InsertAthlete, 'tenantId'> & { tenantId?: string };
export type GymPayoutRate = typeof gymPayoutRates.$inferSelect;
export type InsertGymPayoutRate = typeof gymPayoutRates.$inferInsert;
export type GymPayoutRun = typeof gymPayoutRuns.$inferSelect;
export type InsertGymPayoutRun = typeof gymPayoutRuns.$inferInsert;
export type Booking = typeof bookings.$inferSelect & {
  // Legacy athlete properties for backward compatibility (still used by storage)
  athlete1Name?: string;
  athlete1DateOfBirth?: string;
  athlete1Allergies?: string | null;
  athlete1Experience?: string;
  athlete2Name?: string | null;
  athlete2DateOfBirth?: string | null;
  athlete2Allergies?: string | null;
  athlete2Experience?: string | null;
  // Emergency contact fields from bookings_with_details view
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  // Parent email field from bookings_with_details view  
  parentEmail?: string;
  // Legacy parent fields for backward compatibility
  parentFirstName?: string;
  parentLastName?: string;
  parentPhone?: string;
  // Legacy lesson type fields for backward compatibility
  lessonType?: string;
  lessonTypeName?: string;
  // Legacy amount field for backward compatibility
  amount?: string;
  // Legacy waiver field for backward compatibility
  waiverSigned?: boolean;
  // Parent object for compatibility
  parent?: Parent;
  // Display properties added by backend transformations
  displayPaymentStatus?: string;
  athletes?: Array<{
    athleteId?: number | null; // Optional for new athletes, can be null
    slotOrder: number;
    name: string;
    dateOfBirth: string;
    allergies?: string;
    experience: string;
    photo?: string;
  }>;
  // Track when attendance status was last manually changed
  lastStatusChangeTime?: Date | string | null;
};
export type InsertBookingInput = Omit<InsertBooking, 'tenantId'> & { tenantId?: string };
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type BookingAthlete = typeof bookingAthletes.$inferSelect;
export type InsertBookingAthlete = z.infer<typeof insertBookingAthleteSchema>;
export type BookingLog = typeof bookingLogs.$inferSelect;
export type InsertBookingLog = z.infer<typeof insertBookingLogSchema>;
export type Waiver = typeof waivers.$inferSelect & {
  // Fields added by storage layer joins/transformations
  athleteName?: string;
  signerName?: string;
};
export type InsertWaiver = z.infer<typeof insertWaiverSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type Tip = typeof tips.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type AvailabilityException = typeof availabilityExceptions.$inferSelect;
export type InsertAvailabilityException = z.infer<typeof insertAvailabilityExceptionSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type ParentVerificationToken = typeof parentVerificationTokens.$inferSelect;
export type InsertParentVerificationToken = typeof parentVerificationTokens.$inferInsert;
export type ParentPasswordResetToken = typeof parentPasswordResetTokens.$inferSelect;
export type InsertParentPasswordResetToken = typeof parentPasswordResetTokens.$inferInsert;

// Enhanced multi-tenant types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type InsertTenantUser = typeof tenantUsers.$inferInsert;
export type FeaturePlan = typeof featurePlans.$inferSelect;
export type InsertFeaturePlan = typeof featurePlans.$inferInsert;
export type TenantSettings = typeof tenantSettings.$inferSelect;
export type InsertTenantSettings = typeof tenantSettings.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// New enhanced tables
export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;
export type StaffLocation = typeof staffLocations.$inferSelect;
export type InsertStaffLocation = typeof staffLocations.$inferInsert;
export type OrganizationHierarchy = typeof organizationHierarchy.$inferSelect;
export type InsertOrganizationHierarchy = typeof organizationHierarchy.$inferInsert;

// Lesson types
export type LessonType = typeof lessonTypes.$inferSelect;
export type InsertLessonType = typeof lessonTypes.$inferInsert;

// Video reference type for skills
export type VideoReference = {
  id?: string;
  type: 'url' | 'upload';
  url: string;
  title: string;
  description?: string;
  uploadedAt?: string;
  fileSize?: number;
  mimeType?: string;
};

// Skills-related types
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type AthleteSkill = typeof athleteSkills.$inferSelect;
export type InsertAthleteSkill = z.infer<typeof insertAthleteSkillSchema>;
export type AthleteSkillVideo = typeof athleteSkillVideos.$inferSelect;
export type InsertAthleteSkillVideo = z.infer<typeof insertAthleteSkillVideoSchema>;
export type ProgressShareLink = typeof progressShareLinks.$inferSelect;
export type InsertProgressShareLink = z.infer<typeof insertProgressShareLinkSchema>;

// NOTE: parent_auth_codes table is not implemented - the application uses 
// magic code authentication via Resend API instead of database storage
// 
// Parent authentication codes table (COMMENTED OUT - not in use)
// export const parentAuthCodes = pgTable("parent_auth_codes", {
//   id: serial("id").primaryKey(),
//   email: varchar("email", { length: 255 }).notNull(),
//   code: varchar("code", { length: 6 }).notNull(),
//   expiresAt: timestamp("expires_at").notNull(),
//   used: boolean("used").default(false).notNull(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });

// export const insertParentAuthCodeSchema = createInsertSchema(parentAuthCodes).omit({
//   id: true,
//   createdAt: true,
// });

// export type ParentAuthCode = typeof parentAuthCodes.$inferSelect;
// export type InsertParentAuthCode = z.infer<typeof insertParentAuthCodeSchema>;

// Slot reservations table for temporary slot holding during booking flow
export const slotReservations = pgTable("slot_reservations", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  startTime: varchar("start_time", { length: 8 }).notNull(), // HH:MM format
  lessonType: varchar("lesson_type", { length: 50 }).notNull(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSlotReservationSchema = createInsertSchema(slotReservations).omit({
  id: true,
  createdAt: true,
});

export type SlotReservation = typeof slotReservations.$inferSelect;
export type InsertSlotReservation = z.infer<typeof insertSlotReservationSchema>;

// Archived waivers table for legal record keeping
export const archivedWaivers = pgTable("archived_waivers", {
  id: serial("id").primaryKey(),
  originalWaiverId: integer("original_waiver_id"), // Reference to original waiver before archiving
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
  archivedAt: timestamp("archived_at").defaultNow().notNull(),
  archiveReason: text("archive_reason").notNull(),
  legalRetentionPeriod: text("legal_retention_period"), // Date until which record must be kept
  originalParentId: integer("original_parent_id"), // Original parent ID before deletion
  originalAthleteId: integer("original_athlete_id"), // Original athlete ID before deletion
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations - defined after all tables to avoid circular references
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  parent: one(parents, {
    fields: [bookings.parentId],
    references: [parents.id],
  }),
  lessonType: one(lessonTypes, {
    fields: [bookings.lessonTypeId],
    references: [lessonTypes.id],
  }),
  athletes: many(bookingAthletes),
  apparatus: many(bookingApparatus),
  sideQuests: many(bookingSideQuests),
  logs: many(bookingLogs),
}));

export const parentsRelations = relations(parents, ({ many }) => ({
  bookings: many(bookings),
  athletes: many(athletes),
  waivers: many(waivers),
}));

export const lessonTypesRelations = relations(lessonTypes, ({ many }) => ({
  bookings: many(bookings),
}));

export const waiversRelations = relations(waivers, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [waivers.bookingId],
    references: [bookings.id],
  }),
  athlete: one(athletes, {
    fields: [waivers.athleteId],
    references: [athletes.id],
  }),
  parent: one(parents, {
    fields: [waivers.parentId],
    references: [parents.id],
  }),
  bookingsUsingThisWaiver: many(bookings, {
    relationName: "waiverReference"
  }),
}));

export const athletesRelations = relations(athletes, ({ one, many }) => ({
  parent: one(parents, {
    fields: [athletes.parentId],
    references: [parents.id],
  }),
  latestWaiver: one(waivers, {
    fields: [athletes.latestWaiverId],
    references: [waivers.id],
  }),
  waivers: many(waivers),
  bookingAthletes: many(bookingAthletes),
}));

export const bookingAthletesRelations = relations(bookingAthletes, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingAthletes.bookingId],
    references: [bookings.id],
  }),
  athlete: one(athletes, {
    fields: [bookingAthletes.athleteId],
    references: [athletes.id],
  }),
}));

export const athleteWaiverRelations = relations(athletes, ({ one }) => ({
  latestWaiver: one(waivers, {
    fields: [athletes.latestWaiverId],
    references: [waivers.id],
  }),
}));

// Enhanced multi-tenant relations
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  parent: one(tenants, {
    fields: [tenants.parentTenantId],
    references: [tenants.id],
  }),
  children: many(tenants, {
    relationName: "parent"
  }),
  plan: one(featurePlans, {
    fields: [tenants.planId],
    references: [featurePlans.id],
  }),
  users: many(tenantUsers),
  locations: many(locations),
  staffLocations: many(staffLocations),
  parentHierarchy: many(organizationHierarchy, {
    relationName: "parent"
  }),
  childHierarchy: many(organizationHierarchy, {
    relationName: "child" 
  }),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [locations.tenantId],
    references: [tenants.id],
  }),
  staff: many(staffLocations),
}));

export const staffLocationsRelations = relations(staffLocations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [staffLocations.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [staffLocations.userId], 
    references: [users.id],
  }),
  location: one(locations, {
    fields: [staffLocations.locationId],
    references: [locations.id],
  }),
}));

export const organizationHierarchyRelations = relations(organizationHierarchy, ({ one }) => ({
  parentTenant: one(tenants, {
    fields: [organizationHierarchy.parentTenantId],
    references: [tenants.id],
    relationName: "parent"
  }),
  childTenant: one(tenants, {
    fields: [organizationHierarchy.childTenantId],
    references: [tenants.id],
    relationName: "child"
  }),
}));

export const featurePlansRelations = relations(featurePlans, ({ many }) => ({
  tenants: many(tenants),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantUsers.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  tenantMemberships: many(tenantUsers),
  staffLocations: many(staffLocations),
}));

export const insertArchivedWaiverSchema = createInsertSchema(archivedWaivers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ArchivedWaiver = typeof archivedWaivers.$inferSelect;
export type InsertArchivedWaiver = z.infer<typeof insertArchivedWaiverSchema>;

// Athlete with waiver status view type - matches the SQL view created in migration
export type AthleteWithWaiverStatus = Athlete & {
  waiverSignedAt?: string | null;
  waiverSignatureId?: number | null; // The parent_id who signed
  waiverSignatureData?: string | null; // The actual digital signature
  waiverSignerName?: string | null; // The name of the person who signed the waiver
  waiverCreatedAt?: string | null;
  computedWaiverStatus?: 'signed' | 'pending' | 'none';
};

// Parent with athletes waiver status summary
export type ParentWithAthletesWaiverStatus = {
  parent_id: number;
  parent_first_name: string;
  parent_last_name: string;
  parent_email: string;
  parent_phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  parent_created_at: Date;
  total_athletes: number;
  athletes_with_waivers: number;
  athletes_without_waivers: number;
  athletes_waiver_info: Array<{
    athlete_id: number;
    athlete_name: string;
    waiver_signed: boolean;
    waiver_signed_at: Date | null;
    latest_waiver_id: number | null;
  }>;
};

// Helper functions for focus area mapping
export function mapFocusAreaNamesToIds(focusAreaNames: string[]): number[] {
  // This is a placeholder - in a real app, you would need to query the database
  // to get the actual IDs for the given names. For now, return empty array.
  console.warn('mapFocusAreaNamesToIds is a placeholder function - implement with actual database lookup');
  return [];
}

export function mapFocusAreaIdsToNames(focusAreaIds: number[]): string[] {
  // This is a placeholder - in a real app, you would need to query the database
  // to get the actual names for the given IDs. For now, return empty array.
  console.warn('mapFocusAreaIdsToNames is a placeholder function - implement with actual database lookup');
  return [];
}

// Site Content Management Tables
export const siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  bannerVideo: text("banner_video").default(""),
  heroImages: jsonb("hero_images").default([]),
  logo: jsonb("logo").default({ circle: "", text: "" }),
  about: jsonb("about").default({
    bio: "Coach Will brings nearly 10 years of passionate gymnastics instruction to every lesson.",
    experience: "Nearly 10 years of coaching experience with athletes of all levels",
    photo: "",
    certifications: [
      { title: "USA Gymnastics Certified", body: "Official certification from USA Gymnastics" },
      { title: "CPR/First Aid Certified", body: "Current safety and emergency response training" },
      { title: "Background Checked", body: "Comprehensive background verification completed" }
    ]
  }),
  contact: jsonb("contact").default({
    phone: "(585) 755-8122",
    email: "Admin@coachwilltumbles.com",
    address: {
      name: "Oceanside Gymnastics",
      street: "1935 Ave. del Oro #A",
      city: "Oceanside",
      state: "CA",
      zip: "92056"
    }
  }),
  hours: jsonb("hours").default({
    monday: { available: true, start: "9:00 AM", end: "4:00 PM" },
    tuesday: { available: true, start: "9:00 AM", end: "3:30 PM" },
    wednesday: { available: true, start: "9:00 AM", end: "4:00 PM" },
    thursday: { available: true, start: "9:00 AM", end: "3:30 PM" },
    friday: { available: true, start: "9:00 AM", end: "4:00 PM" },
    saturday: { available: true, start: "10:00 AM", end: "2:00 PM" },
    sunday: { available: false, start: "", end: "" }
  }),
  equipmentImages: jsonb("equipment_images").default([]), // Missing field from DB
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  text: text("text").notNull(),
  rating: integer("rating").default(5),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(), // WITH timezone in DB
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(), // WITH timezone in DB
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
});

export const siteFaqs = pgTable("site_faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 100 }).default("General"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(), // WITH timezone in DB
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(), // WITH timezone in DB
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
});

// Site Inquiries (Contact submissions routed to Admin > Messages > Site Inquiries)
export const siteInquiries = pgTable("site_inquiries", {
  id: bigserial("id", { mode: 'number' }).primaryKey(), // bigserial matches DB bigint with sequence
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  athleteInfo: text("athlete_info"),
  message: text("message").notNull(),
  status: text("status").notNull().default('new'), // text in DB, not varchar(20)
  source: text("source").default('contact_form'), // text in DB, not varchar(50)  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // with timezone in DB
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // with timezone in DB
});

// Validation schemas for site content
export const insertSiteContentSchema = createInsertSchema(siteContent);
export const insertTestimonialSchema = createInsertSchema(testimonials);
export const insertSiteFaqSchema = createInsertSchema(siteFaqs);

// Types for site content
export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type SiteFaq = typeof siteFaqs.$inferSelect;
export type InsertSiteFaq = z.infer<typeof insertSiteFaqSchema>;

// Insert schema and types for Site Inquiries
export const insertSiteInquirySchema = createInsertSchema(siteInquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type SiteInquiry = typeof siteInquiries.$inferSelect;
export type InsertSiteInquiry = z.infer<typeof insertSiteInquirySchema>;

// Site content API response type
export type SiteContentResponse = {
  bannerVideo: string;
  heroImages: string[];
  about: {
    bio: string;
    experience: string;
    photo: string;
    certifications: Array<{ title: string; body: string }>;
  };
  contact: {
    phone: string;
    email: string;
    address: {
      name: string;
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  hours: {
    [key: string]: { start: string; end: string; available: boolean };
  };
  testimonials: Array<{
    id: number;
    name: string;
    text: string;
    rating: number;
    featured: boolean;
  }>;
  faqs: Array<{
    id: number;
    question: string;
    answer: string;
    category: string;
    displayOrder: number;
  }>;
};

// Privacy Requests (dedicated table)
export const privacyRequests = pgTable("privacy_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  requestType: text("request_type").notNull(),
  details: text("details"),
  status: text("status").default("new").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPrivacyRequestSchema = createInsertSchema(privacyRequests).omit({ id: true, createdAt: true, updatedAt: true });
export type PrivacyRequest = typeof privacyRequests.$inferSelect;
export type InsertPrivacyRequest = z.infer<typeof insertPrivacyRequestSchema>;

// Cookie Consent log (optional)
export const cookieConsent = pgTable("cookie_consent", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  necessary: boolean("necessary").default(true).notNull(),
  analytics: boolean("analytics").default(false).notNull(),
  marketing: boolean("marketing").default(false).notNull(),
  region: text("region"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCookieConsentSchema = createInsertSchema(cookieConsent).omit({ id: true, createdAt: true });
export type CookieConsent = typeof cookieConsent.$inferSelect;
export type InsertCookieConsent = z.infer<typeof insertCookieConsentSchema>;

// Activity Log types and schemas
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Enums for activity log standardization
export enum ActivityActorType {
  ADMIN = "admin",
  PARENT = "parent", 
  SYSTEM = "system"
}

export enum ActivityActionType {
  CREATED = "created",
  UPDATED = "updated", 
  DELETED = "deleted",
  STATUS_CHANGED = "status_changed",
  PAYMENT_CAPTURED = "payment_captured",
  PAYMENT_REFUNDED = "payment_refunded",
  PAYMENT_FAILED = "payment_failed",
  EMAIL_SENT = "email_sent",
  SMS_SENT = "sms_sent",
  LOGIN = "login",
  LOGOUT = "logout",
  PASSWORD_CHANGED = "password_changed",
  PERMISSIONS_CHANGED = "permissions_changed",
  WAIVER_REQUESTED = "waiver_requested",
  WAIVER_SUBMITTED = "waiver_submitted",
  WAIVER_REPLACED = "waiver_replaced",
  SKILL_ADDED = "skill_added",
  SKILL_UPDATED = "skill_updated",
  VIDEO_UPLOADED = "video_uploaded",
  VIDEO_REMOVED = "video_removed",
  AVAILABILITY_ADDED = "availability_added",
  AVAILABILITY_REMOVED = "availability_removed",
  REMINDER_SENT = "reminder_sent",
  NO_SHOW_MARKED = "no_show_marked",
  NO_SHOW_CLEARED = "no_show_cleared",
  RESCHEDULED = "rescheduled",
  BULK_OPERATION = "bulk_operation"
}

export enum ActivityCategory {
  BOOKING = "booking",
  ATHLETE = "athlete", 
  PARENT = "parent",
  PAYMENT = "payment",
  WAIVER = "waiver",
  SCHEDULE = "schedule",
  COMMUNICATION = "communication",
  PROGRESS = "progress",
  ADMIN = "admin",
  AUTH = "auth",
  SKILL = "skill",
  VIDEO = "video"
}

export enum ActivityTargetType {
  BOOKING = "booking",
  ATHLETE = "athlete",
  PARENT = "parent", 
  PAYMENT = "payment",
  WAIVER = "waiver",
  AVAILABILITY = "availability",
  SKILL = "skill",
  VIDEO = "video",
  EMAIL = "email",
  SMS = "sms",
  ADMIN_SETTING = "admin_setting"
}

// Helper type for activity log with human-readable information
export type ActivityLogWithDetails = ActivityLog & {
  actorDisplayName: string;
  targetDisplayName: string;
  formattedTimestamp: string;
  changesSummary?: string;
  isUndoable: boolean;
};
