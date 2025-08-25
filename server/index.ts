import 'dotenv/config';
import { BookingStatusEnum, PaymentStatusEnum } from "@shared/schema";
import express, { NextFunction, type Request, Response } from "express";
import fs from "fs";
import path from "path";
import Stripe from "stripe";
import { isAdminAuthenticated } from "./auth";
import { configureSessionAndCors, sessionConfig } from "./config/session";
import { ensureAdmin } from "./ensure-admin";
import { logger } from "./logger";
import { registerRoutes } from "./routes";
import { startDigestScheduler } from './lib/notifications';
import { storage } from "./storage";
import { serveStatic, setupVite } from "./vite";

// Set Pacific timezone for the server
process.env.TZ = 'America/Los_Angeles';

// Global error handlers to prevent application crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

const app = express();

// Explicitly set Express environment based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
app.set('env', nodeEnv);

console.log(`🚀 Server starting in ${sessionConfig.environment} mode`);
console.log(`🍪 Session cookie: ${sessionConfig.cookieName} (secure: ${sessionConfig.secure}, sameSite: ${sessionConfig.sameSite})`);
console.log(`🌐 CORS origins: ${sessionConfig.corsOrigins.join(', ')}`);

// Critical environment validation for admin functionality
console.log('🔑 Validating critical environment variables...');
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SESSION_SECRET_DEV',
  'RESEND_API_KEY'
];

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!serviceRoleKey) {
  console.error('❌ CRITICAL: Missing Supabase service role key!');
  console.error('   Set either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY');
  console.error('   Without this key, admin dashboard will show empty booking lists due to RLS restrictions');
  console.error('   Continuing startup, but admin functionality will be limited');
}

console.log('✅ Service role key configured for admin operations');

// Initialize Stripe client
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('❌ CRITICAL: Missing Stripe secret key!');
  console.error('   Set STRIPE_SECRET_KEY environment variable');
  console.error('   Without this key, payment processing and syncing will fail');
  console.error('   Continuing startup, but payment functionality will be limited');
}

const stripe = new Stripe(stripeKey || 'dummy_key_for_startup', {
  apiVersion: '2025-07-30.basil',
});
console.log('✅ Stripe client initialized');

// Validate other required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn(`⚠️  Warning: Missing environment variables: ${missingVars.join(', ')}`);
  console.warn('   Some features may not work correctly');
}

// Add raw body parsing for Stripe webhook
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes - optimized for Codespace
app.use(express.json({ 
  limit: process.env.NODE_ENV === 'development' ? '5mb' : '10mb' // Smaller limit in dev
})); 
app.use(express.urlencoded({ 
  extended: false, 
  limit: process.env.NODE_ENV === 'development' ? '5mb' : '10mb' 
}));

// Configure CORS and session middleware using our environment-aware module
configureSessionAndCors(app);

// Enhanced diagnostic middleware for development
if (nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log('[REQ]', req.method, req.originalUrl);
    const send = res.send;
    res.send = function(body) {
      console.log('[RES]', res.statusCode, req.originalUrl);
      return send.call(this, body);
    };
    next();
  });
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize Supabase tables on startup
  try {
    const { createSupabaseTablesViaAPI } = await import("./supabase-migration");
    await createSupabaseTablesViaAPI();
    console.log("✅ Supabase tables initialized successfully");
  } catch (error) {
    console.log("⚠️ Supabase table initialization failed, continuing with startup...");
    console.error(error);
  }

  // Note: Admin account check moved to run after server startup to avoid blocking

  // Site content management endpoints
  let siteContentData: any = {
    bannerVideo: '',
    heroImages: [],
    about: {
      bio: 'Coach Will brings nearly 10 years of passionate gymnastics instruction to every lesson. With USA Gymnastics certification and extensive experience working with athletes of all skill levels, he creates a supportive environment where confidence grows alongside physical abilities.',
      certifications: [
        'USA Gymnastics Certified',
        'CPR/First Aid Certified',
        'Background Checked'
      ],
      experience: 'Nearly 10 years of coaching experience with athletes of all levels'
    },
    contact: {
      phone: '(585) 755-8122',
      email: 'admin@coachwilltumbles.com',
      address: {
        name: 'Oceanside Gymnastics',
        street: '1935 Ave. del Oro #A',
        city: 'Oceanside',
        state: 'CA',
        zip: '92056'
      }
    },
    hours: {
      Monday: { start: '09:00', end: '17:00', available: true },
      Tuesday: { start: '09:00', end: '17:00', available: true },
      Wednesday: { start: '09:00', end: '17:00', available: true },
      Thursday: { start: '09:00', end: '17:00', available: true },
      Friday: { start: '09:00', end: '17:00', available: true },
      Saturday: { start: '08:00', end: '16:00', available: true },
      Sunday: { start: '10:00', end: '15:00', available: false }
    },
    apparatus: [
      'Floor Exercise',
      'Balance Beam',
      'Uneven Bars',
      'Vault',
      'Trampoline',
      'Tumble Track'
    ],
    skills: {
      'Floor Exercise': ['Forward Roll', 'Backward Roll', 'Cartwheel', 'Round Off', 'Handstand'],
      'Balance Beam': ['Straight Line Walk', 'Heel-to-Toe Walk', 'Straight Leg Kick', 'Scale', 'Cartwheel'],
      'Uneven Bars': ['Support Hold', 'Pull-ups', 'Cast', 'Back Hip Circle', 'Glide Swing'],
      'Vault': ['Straight Jump', 'Squat On', 'Straddle On', 'Handstand Flat Back', 'Cartwheel'],
      'Trampoline': ['Seat Drop', 'Knee Drop', 'Front Drop', 'Back Drop', 'Swivel Hips'],
      'Tumble Track': ['Forward Roll', 'Backward Roll', 'Handstand Forward Roll', 'Back Walkover', 'Front Walkover']
    },
    sideQuests: [
      'Flexibility Training',
      'Strength Building',
      'Agility Drills',
      'Mental Focus',
      'Confidence Building'
    ],
    testimonials: [
      {
        name: 'Sarah M.',
        text: "Coach Will transformed my daughter's confidence! She went from shy to performing amazing routines.",
        rating: 5
      },
      {
        name: 'Mike & Lisa P.',
        text: "Best investment we've made in our son's athletic development. Will is patient and encouraging.",
        rating: 5
      }
    ],
    faqs: [
      {
        question: 'What age groups do you work with?',
        answer: 'I work with athletes ages 6 and up, from complete beginners to advanced gymnasts preparing for competitive levels.',
        category: 'General'
      },
      {
        question: 'Do you provide equipment?',
        answer: 'Yes! All lessons are conducted at Oceanside Gymnastics with professional-grade equipment including floor, beam, bars, vault, and trampoline.',
        category: 'Equipment'
      },
      {
        question: 'What should my child wear?',
        answer: 'Athletes should wear comfortable athletic clothing they can move freely in. Avoid loose clothing with strings or zippers. Bare feet or gymnastics shoes are recommended.',
        category: 'Preparation'
      },
      {
        question: 'How long are the lessons?',
        answer: 'Lessons are typically 60 minutes for individual sessions and 90 minutes for semi-private sessions. This allows enough time for warm-up, skill development, and cool-down.',
        category: 'General'
      },
      {
        question: 'What if my child has never done gymnastics before?',
        answer: 'Perfect! I specialize in working with beginners and making gymnastics fun and accessible. We start with basic movements and build confidence gradually.',
        category: 'Beginners'
      }
    ]
  };

  app.post('/api/admin/site-content', isAdminAuthenticated, (req: Request, res: Response) => {
    try {
      siteContentData = { ...siteContentData, ...req.body };
      logger.admin('Site content updated');
      res.json({ success: true, message: 'Site content saved successfully' });
    } catch (error) {
      logger.error('Error saving site content:', error);
      res.status(500).json({ error: 'Failed to save site content' });
    }
  });

  // This route is now managed in routes.ts to use the database
  // app.get('/api/site-content', (req: Request, res: Response) => {
  //   try {
  //     res.json(siteContentData);
  //   } catch (error) {
  //     console.error('Error fetching site content:', error);
  //     res.status(500).json({ error: 'Failed to fetch site content' });
  //   }
  // });

  // DIAGNOSTIC: Session tracing middleware
  app.use((req, _res, next) => {
    console.log('[SESSION]', req.originalUrl, {
      sessionID: req.sessionID,
      adminId: req.session.adminId,
      parentId: req.session.parentId,
      loggedIn: !!(req.session.adminId || req.session.parentId)
    });
    next();
  });

  // REGISTER ROUTES FIRST (before developer routes)
  const server = await registerRoutes(app);
  try { startDigestScheduler(storage); } catch {}

  // Developer Settings Admin Routes
  // Admin function to clear all test data
  app.post('/api/admin/clear-test-data', isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const BASE_URL = process.env.SUPABASE_URL;
      const API_KEY = process.env.SUPABASE_ANON_KEY;
      
      if (!BASE_URL || !API_KEY) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      logger.admin('Clearing all test data...');
      

      // Only delete test data: emails containing 'test' or ending with '@example.com'
      // Bookings
      const bookingsResponse = await fetch(`${BASE_URL}/rest/v1/bookings?or=(parent_email.ilike.*test*,parent_email.ilike.*@example.com)`, {
        method: 'DELETE',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });
      let bookingsCleared = 0;
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        bookingsCleared = Array.isArray(bookingsData) ? bookingsData.length : 0;
        logger.admin(`✅ Cleared ${bookingsCleared} test bookings`);
      }

      // Athletes (linked to test parents)
      const athletesResponse = await fetch(`${BASE_URL}/rest/v1/athletes?or=(parent_email.ilike.*test*,parent_email.ilike.*@example.com)`, {
        method: 'DELETE',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });
      let athletesCleared = 0;
      if (athletesResponse.ok) {
        const athletesData = await athletesResponse.json();
        athletesCleared = Array.isArray(athletesData) ? athletesData.length : 0;
        logger.admin(`✅ Cleared ${athletesCleared} test athletes`);
      }

      // Parents (test emails)
      const parentsResponse = await fetch(`${BASE_URL}/rest/v1/parents?or=(email.ilike.*test*,email.ilike.*@example.com)`, {
        method: 'DELETE',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });
      let parentsCleared = 0;
      if (parentsResponse.ok) {
        const parentsData = await parentsResponse.json();
        parentsCleared = Array.isArray(parentsData) ? parentsData.length : 0;
        logger.admin(`✅ Cleared ${parentsCleared} test parents`);
      }

      // Parent auth codes (test emails)
      const authCodesResponse = await fetch(`${BASE_URL}/rest/v1/parent_auth_codes?or=(email.ilike.*test*,email.ilike.*@example.com)`, {
        method: 'DELETE',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });
      let authCodesCleared = 0;
      if (authCodesResponse.ok) {
        const authCodesData = await authCodesResponse.json();
        authCodesCleared = Array.isArray(authCodesData) ? authCodesData.length : 0;
        logger.admin(`✅ Cleared ${authCodesCleared} test auth codes`);
      }

      // Clear test waiver files
      let waiversArchived = 0;
      try {
        // Use service role key for privileged operations
        const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');

        // Fetch test parent emails
        const testParentsRes = await fetch(`${BASE_URL}/rest/v1/parents?select=id,email&or=(email.ilike.*test*,email.ilike.*@example.com)`, {
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        const testParents = testParentsRes.ok ? await testParentsRes.json() : [];
        const testParentIds = testParents.map((p: any) => p.id);

        // Fetch waivers for test parents
        const testWaiversRes = await fetch(`${BASE_URL}/rest/v1/waivers?select=id,pdf_path,parent_id&parent_id=in.(${testParentIds.join(',')})`, {
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        const testWaivers = testWaiversRes.ok ? await testWaiversRes.json() : [];
        const waiverPdfPaths = testWaivers.map((w: any) => w.pdf_path).filter(Boolean);

        // Archive each waiver using storage.archiveWaiver
        for (const waiver of testWaivers) {
          try {
            // Archive with reason 'test data cleanup'
            const archived = await storage.archiveWaiver(waiver.id, 'test data cleanup');
            if (archived) waiversArchived++;
          } catch (archiveError) {
            console.warn(`⚠️  Could not archive waiver ${waiver.id}:`, archiveError);
          }
        }

        // Remove PDF files for test waivers
        const waiversDir = path.join(process.cwd(), 'data', 'waivers');
        if (fs.existsSync(waiversDir)) {
          for (const pdfPath of waiverPdfPaths) {
            const filePath = path.join(waiversDir, path.basename(pdfPath));
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
              } catch (fileError) {
                console.warn(`⚠️  Could not delete waiver file ${filePath}:`, fileError);
              }
            }
          }
          logger.admin(`✅ Archived ${waiversArchived} test waivers and removed PDF files`);
        } else {
          logger.admin('📁 No waivers directory found');
        }
      } catch (waiverError) {
        console.warn('⚠️  Could not archive waivers:', waiverError);
      }

      const summary = {
        success: true,
        message: 'All test data cleared successfully',
        cleared: {
          bookings: bookingsCleared,
          athletes: athletesCleared,
          parents: parentsCleared,
          authCodes: authCodesCleared,
          waivers: waiversArchived
        }
      };

      logger.admin('🎉 All test data cleared:', summary);
      res.json(summary);
    } catch (error) {
      console.error('Error clearing test data:', error);
      res.status(500).json({ error: 'Failed to clear test data' });
    }
  });

  // Admin function to generate test bookings
  app.post('/api/admin/generate-test-bookings', isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const BASE_URL = process.env.SUPABASE_URL;
      const API_KEY = process.env.SUPABASE_ANON_KEY;
      
      if (!BASE_URL || !API_KEY) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      logger.admin('Generating test bookings...');
      
      const sampleBookings = [
        {
          lesson_type: 'quick-journey',
          athlete1_name: 'Emma Johnson',
          athlete1_date_of_birth: '2012-05-15',
          athlete1_allergies: 'None',
          athlete1_experience: 'beginner',
          parent_first_name: 'Sarah',
          parent_last_name: 'Johnson',
          parent_email: 'sarah.j@example.com',
          parent_phone: '555-0101',
          emergency_contact_name: 'Mike Johnson',
          emergency_contact_phone: '555-0102',
          preferred_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          preferred_time: '10:00',
          focus_areas: ['Tumbling: Forward Roll', 'Beam: Straight Walk'],
          amount: 40,
          status: BookingStatusEnum.PENDING,
          payment_status: PaymentStatusEnum.RESERVATION_PAID,
          booking_method: 'online'
        },
        {
          lesson_type: 'deep-dive',
          athlete1_name: 'Lucas Brown',
          athlete1_date_of_birth: '2010-08-22',
          athlete1_allergies: 'Latex',
          athlete1_experience: 'intermediate',
          parent_first_name: 'David',
          parent_last_name: 'Brown',
          parent_email: 'david.brown@example.com',
          parent_phone: '555-0201',
          emergency_contact_name: 'Jennifer Brown',
          emergency_contact_phone: '555-0202',
          preferred_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          preferred_time: '14:00',
          focus_areas: ['Vault: Handstand Flat Back', 'Bars: Pull-ups'],
          amount: 60,
          status: BookingStatusEnum.CONFIRMED,
          payment_status: PaymentStatusEnum.SESSION_PAID,
          booking_method: 'online'
        },
        {
          lesson_type: 'dual-quest',
          athlete1_name: 'Sophia Martinez',
          athlete1_date_of_birth: '2013-03-10',
          athlete1_allergies: 'None',
          athlete1_experience: 'beginner',
          athlete2_name: 'Isabella Martinez',
          athlete2_date_of_birth: '2015-07-18',
          athlete2_allergies: 'Peanuts',
          athlete2_experience: 'beginner',
          parent_first_name: 'Maria',
          parent_last_name: 'Martinez',
          parent_email: 'maria.martinez@example.com',
          parent_phone: '555-0301',
          emergency_contact_name: 'Carlos Martinez',
          emergency_contact_phone: '555-0302',
          preferred_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          preferred_time: '11:00',
          focus_areas: ['Tumbling: Cartwheel', 'Floor: Bridge'],
          amount: 50,
          status: BookingStatusEnum.PENDING,
          payment_status: PaymentStatusEnum.RESERVATION_PAID,
          booking_method: 'online'
        },
        {
          lesson_type: 'partner-progression',
          athlete1_name: 'Aiden Wilson',
          athlete1_date_of_birth: '2011-12-05',
          athlete1_allergies: 'None',
          athlete1_experience: 'advanced',
          athlete2_name: 'Ethan Wilson',
          athlete2_date_of_birth: '2009-09-30',
          athlete2_allergies: 'None',
          athlete2_experience: 'advanced',
          parent_first_name: 'Lisa',
          parent_last_name: 'Wilson',
          parent_email: 'lisa.wilson@example.com',
          parent_phone: '555-0401',
          emergency_contact_name: 'Robert Wilson',
          emergency_contact_phone: '555-0402',
          preferred_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          preferred_time: '16:00',
          focus_areas: ['Bars: Back Hip Circle', 'Vault: Cartwheel'],
          amount: 80,
          status: BookingStatusEnum.CONFIRMED,
          payment_status: PaymentStatusEnum.SESSION_PAID,
          booking_method: 'admin'
        },
        {
          lesson_type: 'deep-dive',
          athlete1_name: 'Chloe Davis',
          athlete1_date_of_birth: '2012-11-20',
          athlete1_allergies: 'Dust',
          athlete1_experience: 'intermediate',
          parent_first_name: 'Jessica',
          parent_last_name: 'Davis',
          parent_email: 'jessica.davis@example.com',
          parent_phone: '555-0501',
          emergency_contact_name: 'Mark Davis',
          emergency_contact_phone: '555-0502',
          preferred_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          preferred_time: '13:00',
          focus_areas: ['Beam: Cartwheel', 'Floor: Round Off'],
          amount: 60,
          status: BookingStatusEnum.PENDING,
          payment_status: PaymentStatusEnum.RESERVATION_PAID,
          booking_method: 'online'
        }
      ];

      let createdCount = 0;
      for (const booking of sampleBookings) {
        // Create parent first
        const parent = {
          first_name: booking.parent_first_name,
          last_name: booking.parent_last_name,
          email: booking.parent_email,
          phone: booking.parent_phone,
          emergency_contact_name: booking.emergency_contact_name,
          emergency_contact_phone: booking.emergency_contact_phone,
          waiver_signed: false
        };

        const parentResponse = await fetch(`${BASE_URL}/rest/v1/parents`, {
          method: 'POST',
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(parent)
        });

        if (!parentResponse.ok) {
          console.error('Failed to create parent:', await parentResponse.text());
          continue;
        }

        const createdParent = await parentResponse.json();
        const parentId = Array.isArray(createdParent) ? createdParent[0]?.id : createdParent?.id;

        // Create athlete(s)
        const athlete1 = {
          parent_id: parentId,
          name: booking.athlete1_name,
          first_name: booking.athlete1_name.split(' ')[0],
          last_name: booking.athlete1_name.split(' ')[1] || '',
          date_of_birth: booking.athlete1_date_of_birth,
          allergies: booking.athlete1_allergies,
          experience: booking.athlete1_experience
        };

        await fetch(`${BASE_URL}/rest/v1/athletes`, {
          method: 'POST',
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(athlete1)
        });

        // Create second athlete if it exists
        if (booking.athlete2_name) {
          const athlete2 = {
            parent_id: parentId,
            name: booking.athlete2_name,
            first_name: booking.athlete2_name.split(' ')[0],
            last_name: booking.athlete2_name.split(' ')[1] || '',
            date_of_birth: booking.athlete2_date_of_birth,
            allergies: booking.athlete2_allergies,
            experience: booking.athlete2_experience
          };

          await fetch(`${BASE_URL}/rest/v1/athletes`, {
            method: 'POST',
            headers: {
              'apikey': API_KEY,
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(athlete2)
          });
        }

        // Create booking
        const response = await fetch(`${BASE_URL}/rest/v1/bookings`, {
          method: 'POST',
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(booking)
        });

        if (response.ok) {
          createdCount++;
        }
      }

      logger.admin(`✅ Generated ${createdCount} test bookings`);
      res.json({ success: true, count: createdCount, message: 'Test bookings generated successfully' });
    } catch (error) {
      console.error('Error generating test bookings:', error);
      res.status(500).json({ error: 'Failed to generate test bookings' });
    }
  });

  // Admin function to simulate payment success
  app.post('/api/admin/simulate-payment-success', isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const BASE_URL = process.env.SUPABASE_URL;
      const API_KEY = process.env.SUPABASE_ANON_KEY;
      
      if (!BASE_URL || !API_KEY) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      logger.admin('Simulating payment success...');
      
      const updateResponse = await fetch(`${BASE_URL}/rest/v1/bookings?payment_status=eq.reservation-paid`, {
        method: 'PATCH',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          payment_status: PaymentStatusEnum.SESSION_PAID,
          status: BookingStatusEnum.CONFIRMED
        })
      });

      let updatedCount = 0;
      if (updateResponse.ok) {
        const updatedBookings = await updateResponse.json();
        updatedCount = Array.isArray(updatedBookings) ? updatedBookings.length : 0;
      }

      logger.admin(`✅ Updated ${updatedCount} bookings to session-paid`);
      res.json({ success: true, updated: updatedCount, message: 'Payment simulation completed' });
    } catch (error) {
      console.error('Error simulating payment success:', error);
      res.status(500).json({ error: 'Failed to simulate payment success' });
    }
  });

  // Admin function to reset payment status
  app.post('/api/admin/reset-payment-status', isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const BASE_URL = process.env.SUPABASE_URL;
      const API_KEY = process.env.SUPABASE_ANON_KEY;
      const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
      
      if (!BASE_URL || !API_KEY || !STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Configuration missing' });
      }

      logger.admin('Syncing payment status with Stripe...');
      
      // Get all bookings with Stripe session IDs
      const bookingsResponse = await fetch(`${BASE_URL}/rest/v1/bookings?stripe_session_id=not.is.null&select=*`, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!bookingsResponse.ok) {
        return res.status(500).json({ error: 'Failed to fetch bookings' });
      }

      const bookings = await bookingsResponse.json();
      let updatedCount = 0;

      // Check each booking's payment status with Stripe
      for (const booking of bookings) {
        if (!booking.stripe_session_id) continue;

        try {
          // Check Stripe session status
          const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${booking.stripe_session_id}`, {
            headers: {
              'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });

          if (stripeResponse.ok) {
            const stripeSession = await stripeResponse.json();
            let newPaymentStatus = booking.payment_status;
            let newStatus = booking.status;

            // Map Stripe payment status to our system
            switch (stripeSession.payment_status) {
              case 'paid':
                // Only set reservation-paid for completed payments
                // session-paid will be set when attendance is marked complete
                newPaymentStatus = PaymentStatusEnum.RESERVATION_PAID;
                newStatus = BookingStatusEnum.PENDING;
                break;
              case 'unpaid':
                newPaymentStatus = PaymentStatusEnum.RESERVATION_PAID;
                newStatus = BookingStatusEnum.PENDING;
                break;
              case 'no_payment_required':
                // Only set reservation-paid for no-payment-required
                // session-paid will be set when attendance is marked complete
                newPaymentStatus = PaymentStatusEnum.RESERVATION_PAID;
                newStatus = BookingStatusEnum.PENDING;
                break;
              default:
                newPaymentStatus = PaymentStatusEnum.RESERVATION_PAID;
                newStatus = BookingStatusEnum.PENDING;
            }

            // Update booking if status changed
            if (newPaymentStatus !== booking.payment_status || newStatus !== booking.status) {
              const updateResponse = await fetch(`${BASE_URL}/rest/v1/bookings?id=eq.${booking.id}`, {
                method: 'PATCH',
                headers: {
                  'apikey': API_KEY,
                  'Authorization': `Bearer ${API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  payment_status: newPaymentStatus,
                  status: newStatus
                })
              });

              if (updateResponse.ok) {
                updatedCount++;
                logger.admin(`Updated booking ${booking.id}: ${booking.payment_status} → ${newPaymentStatus}`);
              }
            }
          }
        } catch (stripeError) {
          console.warn(`Failed to check Stripe session ${booking.stripe_session_id}:`, stripeError);
        }
      }

      logger.admin(`✅ Synced ${updatedCount} bookings with Stripe`);
      res.json({ 
        success: true, 
        updated: updatedCount, 
        total: bookings.length,
        message: `Synced ${updatedCount} of ${bookings.length} bookings with Stripe webhook data` 
      });
    } catch (error) {
      console.error('Error syncing payment status:', error);
      res.status(500).json({ error: 'Failed to sync payment status with Stripe' });
    }
  });

  // Admin function for system health check
  app.post('/api/admin/health-check', isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const BASE_URL = process.env.SUPABASE_URL;
      const API_KEY = process.env.SUPABASE_ANON_KEY;
      
      if (!BASE_URL || !API_KEY) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      logger.admin('Running system health check...');
      
      const checks = [];
      let passed = 0;

      // Test database connectivity
      try {
        const dbResponse = await fetch(`${BASE_URL}/rest/v1/bookings?select=count`, {
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`
          }
        });
        checks.push({ test: 'Database Connection', passed: dbResponse.ok });
        if (dbResponse.ok) passed++;
      } catch {
        checks.push({ test: 'Database Connection', passed: false });
      }

      // Test Stripe integration
      try {
        const stripeResponse = await fetch('http://localhost:6001/api/stripe/products');
        const stripeData = await stripeResponse.json();
        checks.push({ test: 'Stripe Integration', passed: stripeResponse.ok && stripeData.data });
        if (stripeResponse.ok && stripeData.data) passed++;
      } catch {
        checks.push({ test: 'Stripe Integration', passed: false });
      }

      // Test email service
      checks.push({ test: 'Email Service (Resend)', passed: !!process.env.RESEND_API_KEY });
      if (process.env.RESEND_API_KEY) passed++;

      // Test content APIs
      try {
        const contentResponse = await fetch('http://localhost:6001/api/site-content');
        checks.push({ test: 'Content API', passed: contentResponse.ok });
        if (contentResponse.ok) passed++;
      } catch {
        checks.push({ test: 'Content API', passed: false });
      }

      logger.admin(`✅ Health check completed: ${passed}/${checks.length} tests passed`);
      res.json({ 
        success: true, 
        passed, 
        total: checks.length, 
        checks,
        message: `System health check completed: ${passed}/${checks.length} tests passed`
      });
    } catch (error) {
      console.error('Error running health check:', error);
      res.status(500).json({ error: 'Failed to run health check' });
    }
  });

  // Admin function to delete user accounts
  app.post('/api/admin/delete-user-accounts', isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const BASE_URL = process.env.SUPABASE_URL;
      const API_KEY = process.env.SUPABASE_ANON_KEY;
      
      if (!BASE_URL || !API_KEY) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      logger.admin('Deleting user accounts created during booking...');
      
      // Delete users with role 'user' (not admins)
      const usersResponse = await fetch(`${BASE_URL}/rest/v1/users?role=eq.user&id=neq.0`, {
        method: 'DELETE',
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      let usersDeleted = 0;
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        usersDeleted = Array.isArray(usersData) ? usersData.length : 0;
      }

      logger.admin(`✅ Deleted ${usersDeleted} user accounts`);
      res.json({ 
        success: true, 
        deleted: usersDeleted, 
        message: `Deleted ${usersDeleted} user accounts created during booking`
      });
    } catch (error) {
      console.error('Error deleting user accounts:', error);
      res.status(500).json({ error: 'Failed to delete user accounts' });
    }
  });

  // Admin function for database test
  app.post('/api/admin/database-test', isAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const BASE_URL = process.env.SUPABASE_URL;
      const API_KEY = process.env.SUPABASE_ANON_KEY;
      
      if (!BASE_URL || !API_KEY) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      logger.admin('Testing database connection...');
      
      // Test multiple table access
      const tests = [
        { table: 'users', description: 'Users Table' },
        { table: 'bookings', description: 'Bookings Table' },
        { table: 'athletes', description: 'Athletes Table' },
        { table: 'parents', description: 'Parents Table' },
        { table: 'blog_posts', description: 'Blog Posts Table' },
        { table: 'tips', description: 'Tips Table' }
      ];

      const results = [];
      for (const test of tests) {
        try {
          const response = await fetch(`${BASE_URL}/rest/v1/${test.table}?select=count`, {
            headers: {
              'apikey': API_KEY,
              'Authorization': `Bearer ${API_KEY}`
            }
          });
          results.push({
            table: test.table,
            description: test.description,
            success: response.ok,
            status: response.status
          });
        } catch (error) {
          results.push({
            table: test.table,
            description: test.description,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      logger.admin(`✅ Database test completed: ${successCount}/${results.length} tables accessible`);
      
      res.json({ 
        success: true, 
        results,
        summary: `${successCount}/${results.length} tables accessible`,
        message: 'Database connectivity test completed successfully'
      });
    } catch (error) {
      console.error('Error testing database:', error);
      res.status(500).json({ error: 'Failed to test database connection' });
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Simple health check for Render
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const nodeEnv = process.env.NODE_ENV || 'development';
  const expressEnv = app.get("env");
  console.log(`Environment check: NODE_ENV=${nodeEnv}, Express env=${expressEnv}`);
  
  if (nodeEnv === "production") {
    console.log("Setting up static file serving for production");
    serveStatic(app);
  } else {
    console.log("Setting up Vite development server");
    await setupVite(app, server);
  }

  // Use PORT from environment variable, default to 6001 for local dev
  // Render automatically provides PORT environment variable
  const port = parseInt(process.env.PORT || '6001', 10);
  const host = process.env.NODE_ENV === 'production' ? "0.0.0.0" : "127.0.0.1";
  console.log(`🚀 Starting server on port ${port} (host: ${host})`);
  
  // Trust first proxy for secure cookies with Render
  app.set('trust proxy', 1);
  
  server.listen({
    port,
    host: process.env.NODE_ENV === 'production' ? "0.0.0.0" : "127.0.0.1",
  }, () => {
    const host = process.env.NODE_ENV === 'production' ? "0.0.0.0" : "127.0.0.1";
    console.log(`✅ Server successfully started on port ${port}`);
    console.log(`🌐 Health check available at: http://${host}:${port}/api/health`);
    
    // Check admin accounts in the background (non-blocking)
    // Only run admin bootstrap if enabled by environment variable
    const shouldRunAdminBootstrap = process.env.RUN_ADMIN_BOOTSTRAP === 'true';
    if (shouldRunAdminBootstrap) {
      console.log('🔄 Admin bootstrap enabled by RUN_ADMIN_BOOTSTRAP env var');
      import('./ensure-admin.js').then(module => {
        const ensureAdmin = module.ensureAdmin;
        ensureAdmin().catch(error => {
          console.error('Admin check failed:', error);
          // Log but don't exit process
        });
      }).catch(err => {
        console.error('Failed to import ensureAdmin:', err);
        // Log but don't exit process
      });
    } else {
      console.log('ℹ️ Admin bootstrap skipped (RUN_ADMIN_BOOTSTRAP not set to true)');
    }
    
    // Set up scheduled payment sync job - run every 30 minutes
    const PAYMENT_SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes
    
    setInterval(async () => {
      try {
        console.log('Running scheduled payment status sync');
        const result = await storage.syncPaymentStatus(stripe, logger);
        console.log(`Scheduled payment sync complete: updated ${result.updatedCount}/${result.totalCount} bookings`);
      } catch (error) {
        console.error('Failed to run scheduled payment sync:', error);
      }
    }, PAYMENT_SYNC_INTERVAL);
  });

  // Add error handling for server startup
  server.on('error', (error: any) => {
    console.error('❌ Server startup error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Will retry with a different port.`);
      // Try a different port instead of exiting
      const newPort = port + 1;
      console.log(`Attempting to start on port ${newPort}...`);
      server.listen({
        port: newPort,
        host: host, // Use the same host as main startup
      });
    } else if (error.code === 'EACCES') {
      console.error(`Permission denied to bind to port ${port}. Will try a higher port.`);
      // Try a port above 1024 which doesn't require elevated privileges
      const newPort = Math.max(port, 1025);
      console.log(`Attempting to start on port ${newPort}...`);
      server.listen({
        port: newPort,
        host: host, // Use the same host as main startup
      });
    } else {
      console.error('Server will continue attempting to start despite error');
    }
  });
})();