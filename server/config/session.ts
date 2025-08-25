import cors from 'cors';
import type { Application, RequestHandler } from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';

/**
 * Environment-aware session and CORS middleware configuration
 * 
 * This module provides a unified middleware solution that:
 * - Configures different session cookies for dev/prod environments
 * - Sets up appropriate CORS policies for each environment
 * - Ensures secure cookie handling based on environment
 * 
 * Environment Variables Required:
 * - SESSION_SECRET_PROD: Production session secret (required in production)
 * - SESSION_SECRET_DEV: Development session secret (required in development)
 * - NODE_ENV: Environment indicator ('production' or 'development')
 * - DATABASE_URL: PostgreSQL connection string for session storage
 */

// Detect environment
const isProd = process.env.NODE_ENV === 'production';

// Get environment-specific session secrets - NO FALLBACKS
const getSessionSecret = (): string => {
  if (isProd) {
    const secret = process.env.SESSION_SECRET_PROD;
    if (!secret) {
      throw new Error('SESSION_SECRET_PROD environment variable is required in production');
    }
    return secret;
  } else {
    const secret = process.env.SESSION_SECRET_DEV;
    if (!secret) {
      throw new Error('SESSION_SECRET_DEV environment variable is required in development');
    }
    return secret;
  }
};

// Configure session store based on availability of DATABASE_URL
let sessionStore: any;
try {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const PgSession = pgSession(session);
    sessionStore = new PgSession({
      conString: databaseUrl,
      tableName: 'session',
      createTableIfMissing: true, // Auto-create the session table if it doesn't exist
      pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
    });
    console.log('✅ Using PostgreSQL session store with DATABASE_URL');
  } else {
    console.log('⚠️ DATABASE_URL not found, using in-memory session store (not recommended for production)');
    sessionStore = undefined; // Default to MemoryStore
  }
} catch (error) {
  console.error('❌ Error setting up PostgreSQL session store:', error);
  console.log('⚠️ Falling back to in-memory session store');
  sessionStore = undefined; // Default to MemoryStore
}

/**
 * Session middleware with environment-specific configuration
 */
export const sessionMiddleware = session({
  // Environment-specific cookie names to prevent collisions
  name: isProd ? 'cwt.sid' : 'cwt.sid.dev',
  
  // Environment-specific secrets
  secret: getSessionSecret(),
  
  // Use Postgres store if available, otherwise MemoryStore
  store: sessionStore,
  
  // Standard session options
  resave: false,
  saveUninitialized: false,
  
  // Environment-aware cookie configuration
  cookie: {
    httpOnly: true,                              // Security: prevent XSS
    secure: isProd,                              // HTTPS only in production
    sameSite: isProd ? 'none' : 'lax',          // Cross-origin support
    maxAge: 24 * 60 * 60 * 1000,                // 1 day session lifetime
  }
});

/**
 * CORS middleware configured for environment-specific origins
 */
export const corsMiddleware = cors({
  origin: function(origin, callback) {
    const allowedOrigins = isProd
      ? ['https://coachwilltumbles.com']
      : ['http://localhost:6173', 'http://localhost:3000', 'http://localhost:6001'];
    
    // For null origins (like Postman) or allowed origins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS blocked request from:', origin);
      callback(null, false);
    }
  },
  credentials: true, // Enable cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
});

/**
 * Development debugging middleware (optional)
 * Logs session and cookie information for troubleshooting
 */
export const sessionDebugMiddleware: RequestHandler = (req, _res, next) => {
  if (!isProd) {
    console.log(`[SESSION-DEBUG] ${req.method} ${req.originalUrl}`, {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      cookieName: isProd ? 'cwt.sid' : 'cwt.sid.dev',
      adminId: req.session?.adminId,
      parentId: req.session?.parentId,
      cookies: req.headers.cookie
    });
  }
  next();
};

/**
 * Environment information for debugging and validation
 */
export const sessionConfig = {
  environment: isProd ? 'production' : 'development',
  cookieName: isProd ? 'cwt.sid' : 'cwt.sid.dev',
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  corsOrigins: isProd 
    ? ['https://coachwilltumbles.com']
    : ['http://localhost:6173', 'http://localhost:3000', 'http://localhost:6001']
};

/**
 * Configure both CORS and session middleware on the Express app
 * Usage: configureSessionAndCors(app)
 */
export function configureSessionAndCors(app: Application): void {
  // CORS must come before session middleware
  app.use(corsMiddleware);
  app.use(sessionMiddleware);
  
  // Add debug middleware in development
  if (!isProd) {
    app.use(sessionDebugMiddleware);
  }
}

// Export individual components for flexibility
export { corsMiddleware as cors, sessionMiddleware as session };
