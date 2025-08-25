import { Resend } from 'resend';
import { PaymentStatusEnum } from '../../shared/schema';
import { getBaseUrl } from './url';

// Email type mapping
export const emailTemplates = {
  'parent-auth': {
    subject: '🗝️ Access Code to Begin Your Journey',
    loader: async () => (await import('../../emails/ParentAuthorization')).ParentAuthorization,
  },
  'parent-welcome': {
    subject: '🤸‍♀️ Welcome to Coach Will Tumbles!',
    loader: async () => (await import('../../emails/ParentWelcome')).ParentWelcome,
  },
  'email-verification': {
    subject: '✉️ Verify Your Email — Coach Will Tumbles',
    loader: async () => (await import('../../emails/EmailVerification')).EmailVerification,
  },
  'password-setup': {
    subject: '🔐 Set Up Your Password — Coach Will Tumbles',
    loader: async () => (await import('../../emails/PasswordSetupEmail')).PasswordSetupEmail,
  },
  'password-reset': {
    subject: '🔒 Reset Your Password — Coach Will Tumbles',
    loader: async () => (await import('../../emails/PasswordResetEmail')).PasswordResetEmail,
  },
  'session-confirmation': {
    subject: '✅ Session Confirmed! — Coach Will Tumbles',
    loader: async () => (await import('../../emails/SessionConfirmation')).SessionConfirmation,
  },
  'manual-booking': {
    subject: '⚠️ Confirm Your Session Booking',
    loader: async () => (await import('../../emails/ManualBookingConfirmation')).ManualBookingConfirmation,
  },
  'waiver-reminder': {
    subject: '📜 Complete Your Training Scroll',
    loader: async () => (await import('../../emails/WaiverReminder')).WaiverReminder,
  },
  'session-reminder': {
    subject: '⏰ Adventure Incoming!',
    loader: async () => (await import('../../emails/SessionReminder')).SessionReminder,
  },
  'session-cancelled': {
    subject: '❌ Session Cancelled — Let\'s Reschedule!',
    loader: async () => (await import('../../emails/SessionCancellation')).SessionCancellation,
  },
  'admin-booking-cancellation': {
    subject: '🚨 Booking Cancellation Notice',
    loader: async () => (await import('../../emails/AdminBookingCancellation')).default,
  },
  'admin-booking-reschedule': {
    subject: '🔄 Booking Reschedule Notice',
    loader: async () => (await import('../../emails/AdminBookingReschedule')).default,
  },
  'admin-new-booking': {
    subject: '🎉 New Booking Received',
    loader: async () => (await import('../../emails/AdminNewBooking')).default,
  },
  'admin-new-parent': {
    subject: '👋 New Parent Registration',
    loader: async () => (await import('../../emails/AdminNewParent')).default,
  },
  'admin-new-athlete': {
    subject: '🤸‍♀️ New Athlete Registration',
    loader: async () => (await import('../../emails/AdminNewAthlete')).default,
  },
  'admin-waiver-signed': {
    subject: '✅ Waiver Completed',
    loader: async () => (await import('../../emails/AdminWaiverSigned')).default,
  },
  'session-no-show': {
    subject: '🤸 We Missed You — Let\'s Reschedule!',
    loader: async () => (await import('../../emails/SessionNoShow')).SessionNoShow,
  },
  'reschedule-confirmation': {
    subject: '🔄 New Adventure Scheduled!',
    loader: async () => (await import('../../emails/RescheduleConfirmation')).RescheduleConfirmation,
  },
  'session-follow-up': {
    subject: '🏆 Training with Coach Will!',
    loader: async () => (await import('../../emails/SessionFollowUp')).SessionFollowUp,
  },
  'birthday': {
    subject: '🎉 Happy Birthday from Coach Will!',
    loader: async () => (await import('../../emails/BirthdayEmail')).BirthdayEmail,
  },
  'new-tip': {
    subject: '✨ New Tip Unlocked on Your Journey!',
    loader: async () => (await import('../../emails/NewTipOrBlog')).NewTipOrBlog,
  },
  'new-blog': {
    subject: '📝 New Blog Post from Coach Will!',
    loader: async () => (await import('../../emails/NewTipOrBlog')).NewTipOrBlog,
  },
  'reservation-payment': {
    subject: '💳 Complete Your Reservation Payment',
    loader: async () => (await import('../../emails/ReservationPaymentLink')).ReservationPaymentLink,
  },
  'waiver-completion': {
    subject: '📋 Complete Your Waiver Form',
    loader: async () => (await import('../../emails/WaiverCompletionLink')).WaiverCompletionLink,
  },
  'safety-information': {
    subject: '🛡️ Important Safety Information',
    loader: async () => (await import('../../emails/SafetyInformationLink')).SafetyInformationLink,
  },
  'contact-message': {
    subject: '📬 New Contact Form Message',
    loader: async () => (await import('../../emails/ContactMessage')).ContactMessage,
  },
} as const;

export type EmailType = keyof typeof emailTemplates;

interface SendEmailOptions<T extends EmailType> {
  type: T;
  to: string;
  // Use a broad type here to avoid importing React types at module load time
  data: any;
  logoUrl?: string; // Optional logo URL to use in email
}

export async function sendEmail<T extends EmailType>({ type, to, data, logoUrl }: SendEmailOptions<T>) {
  // Lazy-load heavy/SSR-oriented deps only when actually sending a templated email
  const [{ render }, React] = await Promise.all([
    import('@react-email/render'),
    import('react')
  ]);
  // Get Resend API key from environment
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!to) {
    console.error(`[EMAIL][${type}] Aborting send: empty 'to' address`, { dataPreview: Object.keys(data || {}) });
    return;
  }
  
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not found in environment variables');
    throw new Error('RESEND_API_KEY is required for sending emails');
  }

  const resend = new Resend(resendApiKey);
  const template = emailTemplates[type];
  
  if (!template) {
    throw new Error(`Invalid email type: ${type}`);
  }

  // If no logoUrl was provided, try to get it from site content
  let finalLogoUrl = logoUrl;
  if (!finalLogoUrl) {
    try {
      // Import at function level to avoid circular dependencies and maintain ESM
      const mod = await import('../storage');
      const siteContent = await mod.storage.getSiteContent();
      // Use the text logo if available, otherwise use default
      finalLogoUrl = siteContent?.logo?.text || undefined;
    } catch (error) {
      console.warn('Could not fetch logo URL from site content:', error);
    }
  }

  // Add the logo URL to the component props if the property exists on the component
  const componentData = {
    ...data,
    // Best-effort pass-through of logoUrl; many components accept it
    ...(finalLogoUrl ? { logoUrl: finalLogoUrl } : {})
  };

  try {
  // Make React available globally for email components (react-email requirement)
  (global as any).React = React as any;
    
    // Render the email component to HTML
  const EmailComponent = await template.loader();
  const html = await render((React as any).createElement(EmailComponent as any, componentData));
    
    // Send the email
    const result = await resend.emails.send({
      from: 'Coach Will Tumbles <noreply@coachwilltumbles.com>',
      to,
      subject: template.subject,
      html,
    });

    console.log(`Email sent successfully: ${type} to ${to}`, result);
    return result;
  } catch (error) {
    console.error(`Failed to send email: ${type} to ${to}`, error);
    throw error;
  }
}

// Generic send email function for custom HTML content
export async function sendGenericEmail(to: string, subject: string, htmlContent: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not found in environment variables');
    throw new Error('RESEND_API_KEY is required for sending emails');
  }

  const resend = new Resend(resendApiKey);
  
  try {
    // Send the email
    const result = await resend.emails.send({
      from: 'Coach Will Tumbles <noreply@coachwilltumbles.com>',
      to,
      subject,
      html: htmlContent,
    });

    console.log(`Generic email sent successfully to ${to}`, result);
    return result;
  } catch (error) {
    console.error(`Failed to send generic email to ${to}`, error);
    throw error;
  }
}

// Helper function to send parent auth code
export async function sendParentAuthCode(to: string, parentName: string, authCode: string) {
  return sendEmail({
    type: 'parent-auth',
    to,
    data: { parentName, authCode }
  });
}

// Helper function to send session confirmation
export async function sendSessionConfirmation(
  to: string,
  parentName: string,
  athleteName: string,
  sessionDate: string,
  sessionTime: string
) {
  return sendEmail({
    type: 'session-confirmation',
    to,
    data: { parentName, athleteName, sessionDate, sessionTime }
  });
}

// Idempotent wrapper: ensures session confirmation email is sent exactly once per booking
// Relies on new boolean/timestamp columns: session_confirmation_email_sent / session_confirmation_email_sent_at
type EmailStorage = {
  getBookingWithRelations: (id: number) => Promise<any | undefined>;
  updateBooking: (id: number, data: any) => Promise<any | undefined>;
  getBooking: (id: number) => Promise<any | undefined>;
};

export async function sendSessionConfirmationIfNeeded(bookingId: number, storage: EmailStorage & { markSessionConfirmationEmailSent: (bookingId: number, sentAt: string) => Promise<boolean> }) {
  try {
    const booking = await storage.getBookingWithRelations(bookingId);
    if (!booking) {
      console.warn(`[SESSION-CONFIRMATION][IDEMPOTENT] Booking ${bookingId} not found`);
      return false;
    }
    // Only send if payment indicates success AND not already sent
    if (booking.sessionConfirmationEmailSent) {
      console.log(`[SESSION-CONFIRMATION][IDEMPOTENT] Already sent for booking ${bookingId}, skipping.`);
      return false;
    }
    const paid = booking.paymentStatus === PaymentStatusEnum.RESERVATION_PAID || booking.paymentStatus === PaymentStatusEnum.SESSION_PAID;
    if (!paid) {
      console.log(`[SESSION-CONFIRMATION][IDEMPOTENT] Booking ${bookingId} paymentStatus=${booking.paymentStatus} not paid yet, skipping.`);
      return false;
    }
    // Attempt atomic flag set (only if not already true)
    const sentAt = new Date().toISOString();
    const marked = await storage.markSessionConfirmationEmailSent(bookingId, sentAt);
    if (!marked) {
      console.log(`[SESSION-CONFIRMATION][IDEMPOTENT] Another process already sent booking ${bookingId}.`);
      return false;
    }
    const parentEmail = booking.parent?.email || booking.parentEmail;
    const parentName = `${booking.parent?.firstName || booking.parentFirstName || ''} ${booking.parent?.lastName || booking.parentLastName || ''}`.trim() || 'Parent';
    const athleteName = booking.athletes?.[0]?.name || booking.athlete1Name || 'Athlete';
    let sessionDate = 'Unknown Date';
    if (booking.preferredDate) {
      try { sessionDate = new Date(booking.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); } catch {}
    }
    const sessionTime = booking.preferredTime || 'TBD';
    if (!parentEmail) {
      console.warn(`[SESSION-CONFIRMATION][IDEMPOTENT] No parent email for booking ${bookingId}; reverting sent flag.`);
      // Revert flag so we can retry later
      await storage.updateBooking(bookingId, {
        // @ts-ignore
        sessionConfirmationEmailSent: false,
        // @ts-ignore
        sessionConfirmationEmailSentAt: null,
      });
      return false;
    }
    console.log(`[SESSION-CONFIRMATION][IDEMPOTENT] Sending confirmation email for booking ${bookingId} to ${parentEmail}`);
    try {
      await sendSessionConfirmation(parentEmail, parentName, athleteName, sessionDate, sessionTime);
      console.log(`[SESSION-CONFIRMATION][IDEMPOTENT] ✅ Sent confirmation email for booking ${bookingId}`);
      return true;
    } catch (sendErr) {
      console.error(`[SESSION-CONFIRMATION][IDEMPOTENT] Failed to send email for booking ${bookingId}, reverting flag`, sendErr);
      // Revert flag for retry on next trigger
      await storage.updateBooking(bookingId, {
        // best-effort revert
        sessionConfirmationEmailSent: false as any,
        sessionConfirmationEmailSentAt: null as any,
      });
      return false;
    }
  } catch (err) {
    console.error(`[SESSION-CONFIRMATION][IDEMPOTENT] Unexpected error booking ${bookingId}`, err);
    return false;
  }
}

// Helper function to send session cancellation email (idempotent, fetches all needed data)
export async function sendSessionCancellationIfNeeded(bookingId: number, storage: EmailStorage, rescheduleLink?: string) {
  console.log(`🚨 [SESSION-CANCELLATION-DEBUG] Function called for booking ${bookingId}`);
  try {
    const booking = await storage.getBookingWithRelations(bookingId);
    if (!booking) {
      console.warn(`[SESSION-CANCELLATION] Booking ${bookingId} not found`);
      return false;
    }

    console.log(`🔍 [SESSION-CANCELLATION-DEBUG] Full booking object:`, JSON.stringify(booking, null, 2));

    // Get parent info (from relations or fallback to booking fields)
    const parentEmail = booking.parent?.email || booking.parentEmail;
    const parentName = `${booking.parent?.firstName || booking.parentFirstName || ''} ${booking.parent?.lastName || booking.parentLastName || ''}`.trim() || 'Parent';
    
    console.log(`📧 [SESSION-CANCELLATION-DEBUG] Email resolution:`, {
      parentEmail,
      parentName,
      parentRelation: booking.parent,
      bookingParentEmail: booking.parentEmail,
      bookingParentId: booking.parentId
    });
    
    if (!parentEmail) {
      console.error(`[SESSION-CANCELLATION] No parent email found for booking ${bookingId}`, {
        parentRelation: booking.parent,
        bookingParentEmail: booking.parentEmail,
        parentId: booking.parentId
      });
      return false;
    }

    // Use provided reschedule link or build default one
    const finalRescheduleLink = rescheduleLink || '/booking';
    
    // Extract session information
    const sessionData = {
      sessionDate: booking.preferredDate,
      sessionTime: booking.preferredTime,
      athleteNames: booking.athletes?.map((athlete: any) => athlete.firstName || athlete.name) || [],
      lessonType: booking.lessonType?.name
    };
    
    console.log(`📧 [SESSION-CANCELLATION-DEBUG] Session data being sent:`, JSON.stringify(sessionData, null, 2));
    console.log(`[SESSION-CANCELLATION] Sending cancellation email for booking ${bookingId} to ${parentEmail}`);
    try {
      await sendSessionCancellation(parentEmail, parentName, finalRescheduleLink, sessionData);
      console.log(`[SESSION-CANCELLATION] ✅ Sent cancellation email for booking ${bookingId}`);
      return true;
    } catch (sendErr) {
      console.error(`[SESSION-CANCELLATION] Failed to send email for booking ${bookingId}`, sendErr);
      return false;
    }
  } catch (err) {
    console.error(`[SESSION-CANCELLATION] Unexpected error booking ${bookingId}`, err);
    return false;
  }
}

// Helper function to send manual booking confirmation
export async function sendManualBookingConfirmation(
  to: string,
  parentName: string,
  confirmLink: string
) {
  return sendEmail({
    type: 'manual-booking',
    to,
    data: { parentName, confirmLink }
  });
}

// Helper function to send waiver reminder
export async function sendWaiverReminder(
  to: string,
  parentName: string,
  waiverLink: string
) {
  return sendEmail({
    type: 'waiver-reminder',
    to,
    data: { parentName, waiverLink }
  });
}

// Helper function to send session reminder
export async function sendSessionReminder(
  to: string,
  athleteName: string,
  sessionDate: string,
  sessionTime: string
) {
  return sendEmail({
    type: 'session-reminder',
    to,
    data: { athleteName, sessionDate, sessionTime }
  });
}

// Helper function to send session cancellation
export async function sendSessionCancellation(
  to: string,
  parentName: string,
  rescheduleLink: string,
  sessionData?: {
    sessionDate?: string;
    sessionTime?: string;
    athleteNames?: string[];
    lessonType?: string;
  }
) {
  console.log(`[sendSessionCancellation] Called with: to="${to}", parentName="${parentName}", rescheduleLink="${rescheduleLink}"`);
  console.log(`[sendSessionCancellation] Parameter types: to=${typeof to}, parentName=${typeof parentName}`);
  console.log(`[sendSessionCancellation] sessionData:`, JSON.stringify(sessionData, null, 2));
  
  const result = sendEmail({
    type: 'session-cancelled',
    to,
    data: { 
      parentName, 
      rescheduleLink,
      ...sessionData
    }
  });
  
  console.log(`[sendSessionCancellation] sendEmail result:`, result);
  return result;
}

// Helper function to send admin booking cancellation notification
export async function sendAdminBookingCancellation(
  to: string,
  data: {
    bookingId: string;
    parentName: string;
    parentEmail: string;
    sessionDate: string;
    sessionTime: string;
    lessonType: string;
    athleteNames: string[];
    cancellationReason: string;
    wantsReschedule: boolean;
    preferredRescheduleDate?: string;
    preferredRescheduleTime?: string;
    adminPanelLink: string;
  }
) {
  console.log(`[sendAdminBookingCancellation] Sending to: ${to}`);
  console.log(`[sendAdminBookingCancellation] Data:`, JSON.stringify(data, null, 2));
  
  return sendEmail({
    type: 'admin-booking-cancellation',
    to,
    data
  });
}

// Helper function to send admin booking reschedule notification
export async function sendAdminBookingReschedule(
  to: string,
  data: {
    bookingId: string;
    parentName: string;
    parentEmail: string;
    athleteNames: string[];
    lessonType: string;
    oldSessionDate: string;
    oldSessionTime: string;
    newSessionDate: string;
    newSessionTime: string;
    rescheduleReason?: string;
    adminPanelLink: string;
  }
) {
  console.log(`[sendAdminBookingReschedule] Sending to: ${to}`);
  console.log(`[sendAdminBookingReschedule] Data:`, JSON.stringify(data, null, 2));
  
  return sendEmail({
    type: 'admin-booking-reschedule',
    to,
    data
  });
}

// Helper function to send admin new booking notification
export async function sendAdminNewBooking(
  to: string,
  data: {
    bookingId: string;
    parentName: string;
    parentEmail: string;
    parentPhone?: string;
    athleteNames: string[];
    sessionDate: string;
    sessionTime: string;
    lessonType: string;
    paymentStatus: string;
    totalAmount: string;
    specialRequests?: string;
    adminPanelLink: string;
  }
) {
  console.log(`[sendAdminNewBooking] Sending to: ${to}`);
  console.log(`[sendAdminNewBooking] Data:`, JSON.stringify(data, null, 2));
  
  return sendEmail({
    type: 'admin-new-booking',
    to,
    data
  });
}

// Helper function to send admin new parent notification
export async function sendAdminNewParent(
  to: string,
  data: {
    parentId: string;
    parentName: string;
    parentEmail: string;
    parentPhone?: string;
    registrationDate: string;
    athletes: Array<{
      id: string;
      name: string;
      age?: number;
    }>;
    adminPanelLink: string;
  }
) {
  console.log(`[sendAdminNewParent] Sending to: ${to}`);
  console.log(`[sendAdminNewParent] Data:`, JSON.stringify(data, null, 2));
  
  return sendEmail({
    type: 'admin-new-parent',
    to,
    data
  });
}

// Helper function to send admin new athlete notification
export async function sendAdminNewAthlete(
  to: string,
  data: {
    athleteId: string;
    athleteName: string;
    athleteAge?: number;
    athleteGender?: string;
    athleteExperience?: string;
    parentName: string;
    parentEmail: string;
    parentPhone?: string;
    registrationDate: string;
    waiverStatus?: string;
    adminPanelLink: string;
  }
) {
  console.log(`[sendAdminNewAthlete] Sending to: ${to}`);
  console.log(`[sendAdminNewAthlete] Data:`, JSON.stringify(data, null, 2));
  
  return sendEmail({
    type: 'admin-new-athlete',
    to,
    data
  });
}

// Helper function to send admin waiver signed notification
export async function sendAdminWaiverSigned(
  to: string,
  data: {
    waiverId: string;
    athleteName: string;
    athleteId: string;
    athleteAge?: number;
    parentName: string;
    parentEmail: string;
    signedDate: string;
    ipAddress?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    medicalConditions?: string;
    adminPanelLink: string;
    waiverPdfLink?: string;
  }
) {
  console.log(`[sendAdminWaiverSigned] Sending to: ${to}`);
  console.log(`[sendAdminWaiverSigned] Data:`, JSON.stringify(data, null, 2));
  
  return sendEmail({
    type: 'admin-waiver-signed',
    to,
    data
  });
}

// Helper function to send session no-show
export async function sendSessionNoShow(
  to: string,
  parentName: string,
  rescheduleLink: string,
  sessionData?: {
    sessionDate?: string;
    sessionTime?: string;
    athleteNames?: string[];
    lessonType?: string;
  }
) {
  return sendEmail({
    type: 'session-no-show',
    to,
    data: { 
      parentName, 
      rescheduleLink,
      ...sessionData
    }
  });
}

// Helper function to send reschedule confirmation
export async function sendRescheduleConfirmation(
  to: string,
  newSessionDate: string,
  newSessionTime: string,
  athleteNames?: string[]
) {
  return sendEmail({
    type: 'reschedule-confirmation',
    to,
    data: { newSessionDate, newSessionTime, athleteNames }
  });
}

// Helper function to send session follow-up
export async function sendSessionFollowUp(
  to: string,
  athleteName: string,
  bookingLink: string
) {
  return sendEmail({
    type: 'session-follow-up',
    to,
    data: { athleteName, bookingLink }
  });
}

// Helper function to send birthday email
export async function sendBirthdayEmail(
  to: string,
  athleteName: string
) {
  return sendEmail({
    type: 'birthday',
    to,
    data: { athleteName }
  });
}

// Helper function to send new tip/blog notification
export async function sendNewTipOrBlogNotification(
  to: string,
  contentTitle: string,
  contentLink: string,
  type: 'tip' | 'blog' = 'tip'
) {
  const emailType = type === 'blog' ? 'new-blog' : 'new-tip';
  return sendEmail({
    type: emailType,
    to,
    data: { blogTitle: contentTitle, blogLink: contentLink }
  });
}

// Helper function to send reservation payment link
export async function sendReservationPaymentLink(
  to: string,
  parentName: string,
  athleteName: string,
  lessonType: string,
  lessonDate: string,
  lessonTime: string,
  amount: string,
  paymentLink: string
) {
  return sendEmail({
    type: 'reservation-payment',
    to,
    data: { 
      parentName, 
      athleteName, 
      lessonType, 
      lessonDate, 
      lessonTime, 
      amount, 
      paymentLink 
    }
  });
}

// Helper function to send waiver completion link
export async function sendWaiverCompletionLink(
  to: string,
  parentName: string,
  athleteName: string,
  loginLink: string
) {
  return sendEmail({
    type: 'waiver-completion',
    to,
    data: { parentName, athleteName, loginLink }
  });
}

// Helper function to send safety information link
export async function sendSafetyInformationLink(
  to: string,
  parentName: string,
  athleteName: string,
  loginLink: string
) {
  return sendEmail({
    type: 'safety-information',
    to,
    data: { parentName, athleteName, loginLink }
  });
}

// Helper function to send safety information reminder
export async function sendSafetyInformationReminder(
  to: string,
  parentName: string,
  athleteName: string,
  loginLink: string
) {
  return sendEmail({
    type: 'safety-information',
    to,
    data: { parentName, athleteName, loginLink }
  });
}

// Helper function to send signed waiver confirmation
export async function sendSignedWaiverConfirmation(
  to: string,
  parentName: string,
  athleteName: string,
  pdfBuffer?: Buffer
) {
  // Get Resend API key from environment
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not found in environment variables');
    // In development, just log the email that would be sent
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode - Signed waiver confirmation email that would be sent:', {
        to,
        parentName,
        athleteName,
        hasPdfAttachment: !!pdfBuffer
      });
      return;
    }
    throw new Error('RESEND_API_KEY is required for sending emails');
  }

  const resend = new Resend(resendApiKey);
  
  try {
    // Import the component here to avoid circular imports
    const { SignedWaiverConfirmation } = await import('../../emails/SignedWaiverConfirmation');
    const { render } = await import('@react-email/render');
  // Ensure React is available in this scope for createElement
  const React = await import('react');
    
    // Render the email component to HTML
  const html = await render((React as any).createElement(SignedWaiverConfirmation as any, { 
      parentName, 
      athleteName 
    }));
    
    // Prepare email data
    const emailData: any = {
      from: 'Coach Will Tumbles <noreply@coachwilltumbles.com>',
      to,
      subject: `CoachWillTumbles - Signed Waiver for ${athleteName}`,
      html,
    };

    // Attach PDF if provided
    if (pdfBuffer) {
      emailData.attachments = [{
        filename: `${athleteName}_waiver.pdf`,
        content: pdfBuffer,
      }];
    }
    
    // Send the email
    const result = await resend.emails.send(emailData);

    console.log(`Signed waiver confirmation email sent successfully to ${to}`, result);
    return result;
  } catch (error) {
    console.error(`Failed to send signed waiver confirmation email to ${to}`, error);
    throw error;
  }
}

// Helper function to send welcome email to new parents
export async function sendParentWelcomeEmail(
  to: string,
  parentName: string,
  loginLink: string
) {
  return sendEmail({
    type: 'parent-welcome',
    to,
    data: {
      parentName,
      loginLink,
    },
  });
}

// Helper function to send email verification link
export async function sendEmailVerificationLink(
  to: string,
  firstName: string,
  verificationToken: string
) {
  const baseUrl = getBaseUrl();
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  
  return sendEmail({
    type: 'email-verification',
    to,
    data: {
      firstName,
      verificationUrl,
    },
  });
}

// Helper function to send password setup email to new parents
export async function sendPasswordSetupEmail(
  to: string,
  firstName: string,
  resetToken: string,
) {
  const baseUrl = getBaseUrl();
  const resetUrl = `${baseUrl}/parent/set-password?token=${resetToken}`;
  
  return sendEmail({
    type: 'password-setup',
    to,
    data: {
      firstName,
      resetToken,
      resetUrl,
    },
  });
}

// Helper function to send password reset email to existing parents
export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetToken: string,
) {
  const baseUrl = getBaseUrl();
  const resetUrl = `${baseUrl}/parent/set-password?token=${resetToken}`;
  
  return sendEmail({
    type: 'password-reset',
    to,
    data: {
      firstName,
      resetToken,
      resetUrl,
    },
  });
}

// Delayed Email System for Attendance Status Changes
interface DelayedStatusEmail {
  bookingId: number;
  originalStatus: string;
  targetStatus: string;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
}

// In-memory store for delayed emails (in production, you'd use Redis or similar)
const delayedStatusEmails = new Map<number, DelayedStatusEmail>();

export async function scheduleStatusChangeEmail(
  bookingId: number,
  originalStatus: string,
  newStatus: string,
  storage: EmailStorage,
  rescheduleLink?: string
) {
  console.log(`[STATUS-EMAIL-DELAY] Scheduling email for booking ${bookingId}: ${originalStatus} -> ${newStatus}`);
  
  // Clear any existing delayed email for this booking
  const existing = delayedStatusEmails.get(bookingId);
  if (existing) {
    console.log(`[STATUS-EMAIL-DELAY] Clearing existing timer for booking ${bookingId}`);
    clearTimeout(existing.timeoutId);
    delayedStatusEmails.delete(bookingId);
  }

  // Only schedule emails for status changes that require notification
  const emailableStatuses = ['completed', 'cancelled', 'no-show'];
  if (!emailableStatuses.includes(newStatus)) {
    console.log(`[STATUS-EMAIL-DELAY] Status ${newStatus} doesn't require email notification`);
    return;
  }

  // Schedule the email to be sent after 30 seconds
  const timeoutId = setTimeout(async () => {
    try {
      console.log(`[STATUS-EMAIL-DELAY] 30 seconds elapsed, checking final status for booking ${bookingId}`);
      
      // Get current booking status
      const booking = await storage.getBookingWithRelations(bookingId);
      if (!booking) {
        console.warn(`[STATUS-EMAIL-DELAY] Booking ${bookingId} not found`);
        delayedStatusEmails.delete(bookingId);
        return;
      }

      const currentStatus = booking.attendanceStatus;
      console.log(`[STATUS-EMAIL-DELAY] Final status for booking ${bookingId}: ${currentStatus}`);

      // Send email based on final status
      if (currentStatus === 'completed') {
        await sendCompletedSessionEmail(bookingId, storage);
      } else if (currentStatus === 'cancelled') {
        console.log(`[STATUS-EMAIL-DELAY] Skipping delayed cancellation email for booking ${bookingId} - immediate email already sent`);
        // Skip delayed cancellation email since immediate email is sent in routes.ts
        // await sendSessionCancellationIfNeeded(bookingId, storage, rescheduleLink);
      } else if (currentStatus === 'no-show') {
        await sendNoShowSessionEmail(bookingId, storage, rescheduleLink);
      }

      // Clean up
      delayedStatusEmails.delete(bookingId);
      
    } catch (error) {
      console.error(`[STATUS-EMAIL-DELAY] Error sending delayed email for booking ${bookingId}:`, error);
      delayedStatusEmails.delete(bookingId);
    }
  }, 30000); // 30 seconds

  // Store the delayed email info
  delayedStatusEmails.set(bookingId, {
    bookingId,
    originalStatus,
    targetStatus: newStatus,
    timestamp: Date.now(),
    timeoutId
  });

  console.log(`[STATUS-EMAIL-DELAY] Scheduled ${newStatus} email for booking ${bookingId} in 30 seconds`);
}

async function sendCompletedSessionEmail(bookingId: number, storage: EmailStorage) {
  console.log(`[STATUS-EMAIL] Sending completed session follow-up for booking ${bookingId}`);
  
  try {
    // Get booking with full relations to access parent and athlete data
    const booking = await storage.getBookingWithRelations(bookingId);
    if (!booking) {
      console.warn(`[STATUS-EMAIL] Booking ${bookingId} not found for completed email`);
      return;
    }

    // Get parent info
    const parentEmail = booking.parent?.email || booking.parentEmail;
    const parentName = `${booking.parent?.firstName || booking.parentFirstName || ''} ${booking.parent?.lastName || booking.parentLastName || ''}`.trim() || 'Parent';
    
    if (!parentEmail) {
      console.warn(`[STATUS-EMAIL] No parent email found for booking ${bookingId}`);
      return;
    }

    // Get athlete name
    let athleteName = 'Athlete';
    if (booking.athletes && booking.athletes.length > 0) {
      athleteName = booking.athletes[0].firstName || booking.athletes[0].name || 'Athlete';
    } else if (booking.athlete1Name) {
      athleteName = booking.athlete1Name;
    }
    
    // Create booking link for next session
    const baseUrl = getBaseUrl();
    const bookingLink = `${baseUrl}/parent/dashboard`;
    
    console.log(`[STATUS-EMAIL] Sending completed session follow-up for booking ${bookingId} to ${parentEmail}`);
    
    await sendSessionFollowUp(parentEmail, athleteName, bookingLink);
    console.log(`[STATUS-EMAIL] ✅ Sent completed session follow-up for booking ${bookingId}`);
    
  } catch (error) {
    console.error(`[STATUS-EMAIL] Error sending completed session follow-up for booking ${bookingId}:`, error);
  }
}

async function sendNoShowSessionEmail(bookingId: number, storage: EmailStorage, rescheduleLink?: string) {
  try {
    const booking = await storage.getBookingWithRelations(bookingId);
    if (!booking) {
      console.warn(`[STATUS-EMAIL] Booking ${bookingId} not found for no-show email`);
      return;
    }

    // Get parent info
    const parentEmail = booking.parent?.email || booking.parentEmail;
    const parentName = `${booking.parent?.firstName || booking.parentFirstName || ''} ${booking.parent?.lastName || booking.parentLastName || ''}`.trim() || 'Parent';
    
    if (!parentEmail) {
      console.warn(`[STATUS-EMAIL] No parent email found for booking ${bookingId}`);
      return;
    }

    // Use provided reschedule link or build default one
    const finalRescheduleLink = rescheduleLink || '/booking';
    
    // Extract session information
    const sessionData = {
      sessionDate: booking.preferredDate,
      sessionTime: booking.preferredTime,
      athleteNames: booking.athletes?.map((athlete: any) => athlete.firstName || athlete.name) || [],
      lessonType: booking.lessonType?.name
    };
    
    console.log(`[STATUS-EMAIL] Sending no-show email for booking ${bookingId} to ${parentEmail}`);
    
    await sendSessionNoShow(parentEmail, parentName, finalRescheduleLink, sessionData);
    console.log(`[STATUS-EMAIL] ✅ Sent no-show email for booking ${bookingId}`);
    
  } catch (error) {
    console.error(`[STATUS-EMAIL] Error sending no-show email for booking ${bookingId}:`, error);
  }
}

