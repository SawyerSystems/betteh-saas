import { createClient } from '@supabase/supabase-js';
import type {
    Athlete,
    Booking,
    InsertAthlete,
    InsertBooking,
    InsertParent,
    Parent
} from '../shared/schema';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export class ModernSupabaseStorage {
  
  // ============================================================
  // BOOKINGS WITH NEW SCHEMA
  // ============================================================
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    // 1. Create the booking record (without athletes)
    const bookingData = {
      lesson_type: insertBooking.lessonType,
      preferred_date: (insertBooking.preferredDate as any)?.toISOString?.()?.split('T')[0] || String(insertBooking.preferredDate),
      preferred_time: insertBooking.preferredTime,
      parent_first_name: insertBooking.parentFirstName,
      parent_last_name: insertBooking.parentLastName,
      parent_email: insertBooking.parentEmail,
      parent_phone: insertBooking.parentPhone,
      emergency_contact_name: insertBooking.emergencyContactName,
      emergency_contact_phone: insertBooking.emergencyContactPhone,
      amount: insertBooking.paidAmount || '0',
      status: insertBooking.status || 'pending',
      payment_status: insertBooking.paymentStatus || 'unpaid',
      booking_method: insertBooking.bookingMethod || 'online'
    };

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) throw error;

    // 2. Link athletes to booking
    if (insertBooking.athletes && Array.isArray(insertBooking.athletes) && insertBooking.athletes.length > 0) {
      const athleteLinks = insertBooking.athletes.map((athlete: any) => ({
        booking_id: booking.id,
        athlete_id: athlete.athleteId,
        slot_order: athlete.slotOrder
      }));

      const { error: linkError } = await supabase
        .from('booking_athletes')
        .insert(athleteLinks);

      if (linkError) throw linkError;
    }

    // 3. Link focus areas
    if (insertBooking.focusAreaIds && Array.isArray(insertBooking.focusAreaIds) && insertBooking.focusAreaIds.length > 0) {
      const focusAreaLinks = insertBooking.focusAreaIds.map((focusAreaId: any) => ({
        booking_id: booking.id,
        focus_area_id: focusAreaId
      }));

      const { error: focusError } = await supabase
        .from('booking_focus_areas')
        .insert(focusAreaLinks);

      if (focusError) throw focusError;
    }

    const result = await this.getBookingWithRelations(booking.id);
    if (!result) {
      throw new Error('Failed to retrieve created booking');
    }
    return result;
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;

    return this.mapBookingFromDb(data);
  }

  async getBookingWithRelations(id: number): Promise<Booking | undefined> {
    // Get base booking
    const booking = await this.getBooking(id);
    if (!booking) return undefined;

    // Get linked athletes
    const { data: athleteLinks } = await supabase
      .from('booking_athletes')
      .select(`
        slot_order,
        athletes:athlete_id (
          id,
          name,
          first_name,
          last_name,
          date_of_birth,
          allergies,
          experience,
          photo
        )
      `)
      .eq('booking_id', id)
      .order('slot_order');

    // Get linked focus areas
    const { data: focusAreaLinks } = await supabase
      .from('booking_focus_areas')
      .select(`
        focus_areas:focus_area_id (
          id,
          name,
          apparatus_id
        )
      `)
      .eq('booking_id', id);

    // Format athletes array
    const athletes = athleteLinks?.map(link => {
      const athlete = link.athletes as any;
      return {
        athleteId: Number(athlete.id),
        slotOrder: Number(link.slot_order),
        name: String(athlete.name || `${athlete.first_name} ${athlete.last_name}`),
        dateOfBirth: String(athlete.date_of_birth),
        allergies: String(athlete.allergies || ''),
        experience: String(athlete.experience),
        photo: athlete.photo ? String(athlete.photo) : undefined
      };
    }) || [];

    return {
      ...booking,
      athletes,
      focusAreas: focusAreaLinks?.map(link => String((link.focus_areas as any).name)) || []
    };
  }

  async getAllBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];

    return data.map(booking => this.mapBookingFromDb(booking));
  }

  // ============================================================
  // ATHLETES
  // ============================================================
  
  async createAthlete(insertAthlete: InsertAthlete): Promise<Athlete> {
    const athleteData = {
      parent_id: insertAthlete.parentId,
      name: insertAthlete.name || `${insertAthlete.firstName} ${insertAthlete.lastName}`,
      first_name: insertAthlete.firstName,
      last_name: insertAthlete.lastName,
      date_of_birth: insertAthlete.dateOfBirth,
      allergies: insertAthlete.allergies,
      experience: insertAthlete.experience,
      photo: insertAthlete.photo
    };

    const { data, error } = await supabase
      .from('athletes')
      .insert(athleteData)
      .select()
      .single();

    if (error) throw error;

    return this.mapAthleteFromDb(data);
  }

  async getAllAthletes(): Promise<Athlete[]> {
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];

    return data.map(athlete => this.mapAthleteFromDb(athlete));
  }

  async getParentAthletes(parentId: number): Promise<Athlete[]> {
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .eq('parent_id', parentId)
      .order('first_name', { ascending: true });

    if (error) return [];

    return data.map(athlete => this.mapAthleteFromDb(athlete));
  }

  // ============================================================
  // PARENTS
  // ============================================================
  
  async createParent(insertParent: InsertParent): Promise<Parent> {
    const parentData = {
      first_name: insertParent.firstName,
      last_name: insertParent.lastName,
      email: insertParent.email,
      phone: insertParent.phone,
      emergency_contact_name: insertParent.emergencyContactName,
      emergency_contact_phone: insertParent.emergencyContactPhone,
      password_hash: insertParent.passwordHash,
    };

    const { data, error } = await supabase
      .from('parents')
      .insert(parentData)
      .select()
      .single();

    if (error) throw error;

    return this.mapParentFromDb(data);
  }

  async getAllParents(): Promise<Parent[]> {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];

    return data.map(parent => this.mapParentFromDb(parent));
  }

  async identifyParent(email: string, phone: string): Promise<Parent | undefined> {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('email', email)
      .eq('phone', phone)
      .single();

    if (error || !data) return undefined;

    return this.mapParentFromDb(data);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================
  
  private mapBookingFromDb(data: any): Booking {
    return {
      id: data.id,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      tenantId: data.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',
      parentId: data.parent_id || null,
      lessonTypeId: data.lesson_type_id || null,
      lessonType: data.lesson_type,
      preferredDate: data.preferred_date,
      preferredTime: data.preferred_time,
      focusAreas: data.focus_areas || [],
      focusAreaOther: data.focus_area_other || null,
  // Idempotent session confirmation email tracking
  sessionConfirmationEmailSent: Boolean(data.session_confirmation_email_sent),
  sessionConfirmationEmailSentAt: data.session_confirmation_email_sent_at ? new Date(data.session_confirmation_email_sent_at) : null,
      parentFirstName: data.parent_first_name,
      parentLastName: data.parent_last_name,
      parentEmail: data.parent_email,
      parentPhone: data.parent_phone,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactPhone: data.emergency_contact_phone,
      amount: data.amount,
      bookingMethod: data.booking_method || 'online',
      waiverSigned: data.waiver_signed || false,
      paymentStatus: data.payment_status || 'unpaid',
      attendanceStatus: data.attendance_status || 'pending',
      reservationFeePaid: data.reservation_fee_paid || false,
      paidAmount: data.paid_amount || '0.00',
      specialRequests: data.special_requests || null,
      adminNotes: data.admin_notes || null,
      dropoffPersonName: data.dropoff_person_name || null,
      dropoffPersonRelationship: data.dropoff_person_relationship || null,
      dropoffPersonPhone: data.dropoff_person_phone || null,
      pickupPersonName: data.pickup_person_name || null,
      pickupPersonRelationship: data.pickup_person_relationship || null,
      pickupPersonPhone: data.pickup_person_phone || null,
      altPickupPersonName: data.alt_pickup_person_name || null,
      altPickupPersonRelationship: data.alt_pickup_person_relationship || null,
      altPickupPersonPhone: data.alt_pickup_person_phone || null,
      safetyVerificationSigned: data.safety_verification_signed || false,
      safetyVerificationSignedAt: data.safety_verification_signed_at ? new Date(data.safety_verification_signed_at) : null,
      stripeSessionId: data.stripe_session_id || null,
      progressNote: data.progress_note || null,
      coachName: data.coach_name || 'Coach Will',
      // For backward compatibility during transition
      athlete1Name: data.athlete1_name,
      athlete1DateOfBirth: data.athlete1_date_of_birth,
      athlete1Allergies: data.athlete1_allergies,
      athlete1Experience: data.athlete1_experience,
      athlete2Name: data.athlete2_name,
      athlete2DateOfBirth: data.athlete2_date_of_birth,
      athlete2Allergies: data.athlete2_allergies,
      athlete2Experience: data.athlete2_experience,
      // Cancellation fields
      cancellationReason: data.cancellation_reason || null,
      cancellationRequestedAt: data.cancellation_requested_at ? new Date(data.cancellation_requested_at) : null,
      wantsReschedule: data.wants_reschedule || null,
      reschedulePreferences: data.reschedule_preferences || null
    };
  }

  private mapAthleteFromDb(row: any): Athlete {
    return {
      id: row.id,
      parentId: row.parent_id,
      name: row.name,
      firstName: row.first_name,
      lastName: row.last_name,
      allergies: row.allergies,
      experience: row.experience,
      photo: row.photo,
      createdAt: row.created_at ? new Date(row.created_at) : null,
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
	isGymMember: row.is_gym_member ?? false,
      latestWaiverId: row.latest_waiver_id,
      waiverStatus: row.waiver_status || 'pending',
      waiverSigned: row.waiver_signed || false,
      tenantId: row.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',
    };
  }

  private mapParentFromDb(data: any): Parent {
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
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      tenantId: data.tenant_id || process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001'
    };
  }
}
