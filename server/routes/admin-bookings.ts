import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Express, Request, Response } from 'express';
import { AttendanceStatusEnum, BookingMethodEnum, BookingStatusEnum, FocusArea, PaymentStatusEnum } from '../../shared/schema';
import { isAdminAuthenticated } from '../auth';
import { sendPasswordSetupEmail } from '../lib/email';
import { logger } from '../logger';
import { SupabaseStorage } from '../storage';

const storage = new SupabaseStorage();

export function initAdminBookingRoutes(app: Express) {
  // Admin booking creation endpoint
  app.post("/api/admin/bookings", isAdminAuthenticated, async (req: Request, res: Response) => {
    const perfTimer = logger.performance.api.request('POST', '/api/admin/bookings');
    
    try {
      console.log("Admin booking request body:", JSON.stringify(req.body, null, 2));
      
      const bookingData = req.body;
      
      // Resolve lesson type to ID
      let lessonTypeId: number | null = null;
      if (bookingData.lessonType) {
        const lessonTypeMapping: { [key: string]: number } = {
          'quick-journey': 1,
          'dual-quest': 2,  
          'deep-dive': 3,
          'partner-progression': 4
        };
        lessonTypeId = lessonTypeMapping[bookingData.lessonType] || null;
        
        if (!lessonTypeId) {
          return res.status(400).json({
            message: "Invalid lesson type",
            details: `Unknown lesson type: ${bookingData.lessonType}`
          });
        }
      }
      
      // Check if parent exists
      let parent = await storage.getParentById(bookingData.parentInfo?.id);
      
      if (!parent) {
        // Try to find parent by email
        parent = await storage.getParentByEmail(bookingData.parentInfo.email);
        
        if (!parent) {
          // Create parent account
          parent = await storage.createParent({
            firstName: bookingData.parentInfo.firstName,
            lastName: bookingData.parentInfo.lastName,
            email: bookingData.parentInfo.email,
            phone: bookingData.parentInfo.phone,
            emergencyContactName: bookingData.parentInfo.emergencyContactName,
            emergencyContactPhone: bookingData.parentInfo.emergencyContactPhone,
            passwordHash: await bcrypt.hash(Math.random().toString(36).slice(2), 10)
          });
          
          // Send password setup email to the new parent
          try {
            // Generate a reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
            
            // Store the reset token
            await storage.createPasswordResetToken({
              parentId: parent.id,
              token: resetToken,
              expiresAt,
            });

            // Send the password setup email
            await sendPasswordSetupEmail(
              parent.email,
              parent.firstName,
              resetToken
            );
            console.log(`[ADMIN-BOOKING] Password setup email sent to new parent ${parent.email}`);
          } catch (emailError) {
            console.error(`[ADMIN-BOOKING] Failed to send password setup email to ${parent.email}:`, emailError);
            // Continue with booking creation even if email fails
          }
          
          if (!parent) {
            return res.status(500).json({
              message: "Failed to create parent account",
              details: "Unable to create parent record"
            });
          }
        }
      }
      
      // Prepare the safety information
      const safetyInfo = bookingData.safetyContact || {};
      const dropoffInfo = {
        dropoffPersonName: safetyInfo.willDropOff 
          ? `${parent.firstName} ${parent.lastName}` 
          : safetyInfo.dropoffPersonName || '',
        dropoffPersonRelationship: safetyInfo.willDropOff 
          ? 'Parent' 
          : safetyInfo.dropoffPersonRelationship || '',
        dropoffPersonPhone: safetyInfo.willDropOff 
          ? parent.phone
          : safetyInfo.dropoffPersonPhone || ''
      };
      
      const pickupInfo = {
        pickupPersonName: safetyInfo.willPickUp 
          ? `${parent.firstName} ${parent.lastName}` 
          : safetyInfo.pickupPersonName || '',
        pickupPersonRelationship: safetyInfo.willPickUp 
          ? 'Parent' 
          : safetyInfo.pickupPersonRelationship || '',
        pickupPersonPhone: safetyInfo.willPickUp 
          ? parent.phone
          : safetyInfo.pickupPersonPhone || ''
      };

      // Create booking
      const booking = await storage.createBooking({
        parentId: parent.id,
        lessonTypeId: lessonTypeId as number,  // Type assertion since we've validated it's not null above
        preferredDate: new Date(bookingData.selectedTimeSlot?.date || new Date()),
        preferredTime: bookingData.selectedTimeSlot?.time || '09:00',
        bookingMethod: BookingMethodEnum.ADMIN,
        status: bookingData.status || BookingStatusEnum.CONFIRMED,
        paymentStatus: bookingData.paymentStatus || PaymentStatusEnum.UNPAID,
        adminNotes: bookingData.adminNotes || '',
        ...dropoffInfo,
        ...pickupInfo,
        safetyVerificationSignedAt: new Date(),
        // Add missing required fields with defaults
        attendanceStatus: AttendanceStatusEnum.PENDING,
        apparatusIds: [],
        focusAreaIds: [],
        sideQuestIds: []
      });

      // Debug log the booking object
      console.log('[DEBUG] Created admin booking:', booking);

      // Process athletes
      if (bookingData.athleteInfo && bookingData.athleteInfo.length > 0) {
        // For new athletes from form
        await Promise.all(bookingData.athleteInfo.map(async (athlete: {
          firstName: string;
          lastName: string;
          dateOfBirth: string;
          gender?: string;
          allergies?: string;
          experience?: string;
        }, index: number) => {
          const newAthlete = await storage.createAthlete({
            parentId: parent.id,
            firstName: athlete.firstName,
            lastName: athlete.lastName,
            dateOfBirth: athlete.dateOfBirth,
            gender: athlete.gender || '',
            allergies: athlete.allergies || '',
            experience: (athlete.experience || 'intermediate') as "beginner" | "intermediate" | "advanced",
          });
          
          if (newAthlete) {
            // Use addAthleteSlot instead of addAthleteToBooking
            await storage.addAthleteSlot(booking.id, newAthlete.id, index + 1);
          }
        }));
      } else if (bookingData.selectedAthletes && bookingData.selectedAthletes.length > 0) {
        // For existing athletes
        await Promise.all(bookingData.selectedAthletes.map(async (athleteId: number, index: number) => {
          // Use addAthleteSlot instead of addAthleteToBooking
          await storage.addAthleteSlot(booking.id, athleteId, index + 1);
        }));
      }
      
      // Process focus areas if provided
      if (bookingData.focusAreas && bookingData.focusAreas.length > 0) {
        const focusAreaNames = bookingData.focusAreas as string[];
        const allFocusAreas = await storage.getAllFocusAreas();
        
        // Map names to IDs
        const focusAreaIds = focusAreaNames
          .map((name: string) => allFocusAreas.find((fa: FocusArea) => fa.name === name)?.id)
          .filter((id): id is number => id !== undefined);
          
        if (focusAreaIds.length > 0) {
          // Use addBookingFocusArea instead of addFocusAreasToBooking
          await storage.addBookingFocusArea(booking.id, focusAreaIds);
        }
      }
      
      // Send email confirmation for cash/check payments
      if (bookingData.adminPaymentMethod && ["cash", "check"].includes(bookingData.adminPaymentMethod.toLowerCase())) {
        try {
          console.log(`[EMAIL] Preparing to send confirmation email for ${bookingData.adminPaymentMethod} payment`);
          console.log(`[EMAIL] Parent email: ${parent.email}, Parent name: ${parent.firstName || 'Parent'}`);
          
          const { sendManualBookingConfirmation } = await import('../lib/email');
          const { getBaseUrl } = await import('../utils');
          const confirmLink = `${getBaseUrl()}/parent/confirm-booking?bookingId=${booking.id}`;
          
          console.log(`[EMAIL] Confirmation link: ${confirmLink}`);
          
          await sendManualBookingConfirmation(
            parent.email,
            parent.firstName || 'Parent',
            confirmLink
          );
          console.log(`[EMAIL] ✅ Sent manual booking confirmation email to ${parent.email}`);
        } catch (emailError) {
          console.error("[EMAIL] ❌ Failed to send confirmation email:", emailError);
          // Don't fail the booking creation if email fails
        }
      } else {
        console.log(`[EMAIL] No confirmation email sent - Payment method: ${bookingData.adminPaymentMethod}`);
      }
      
      perfTimer.end();
      return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        booking
      });
    } catch (error) {
      perfTimer.end();
      console.error("Error creating admin booking:", error);
      return res.status(500).json({
        success: false, 
        message: "Error creating booking", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
