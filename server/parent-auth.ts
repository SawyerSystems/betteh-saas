import { Request, Response, Router } from 'express';
import { sendEmailVerificationLink, sendParentWelcomeEmail } from './lib/email';
import { getBaseUrl } from './lib/url';

import * as crypto from 'crypto';
import { NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { storage } from './storage';
import { supabaseAdmin } from './supabase-client';

export const parentAuthRouter = Router();

// Middleware to check if parent is authenticated
export const isParentAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("🔍 Parent Auth Check - Session Info:", {
    sessionID: req.sessionID,
    hasSession: !!req.session,
    parentId: req.session?.parentId,
    parentEmail: req.session?.parentEmail,
    cookies: req.headers.cookie
  });
  
  if (!req.session.parentId) {
    console.log("❌ Parent authentication failed - No parentId in session");
    return res.status(401).json({ error: 'Parent authentication required' });
  }
  console.log("✅ Parent authenticated successfully:", req.session.parentId);
  next();
};

import * as bcrypt from 'bcryptjs';

// Email verification utilities
const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const sendVerificationEmail = async (email: string, firstName: string, token: string): Promise<void> => {
  try {
    await sendEmailVerificationLink(email, firstName, token);
    console.log(`Verification email sent to ${email}`);
    // Log the token in development mode for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 DEV: Verification token for ${email}: ${token}`);
      console.log(`🔍 DEV: Verification URL: ${getBaseUrl()}/verify-email?token=${token}`);
    }
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    // Log the token in development mode only
    if (process.env.NODE_ENV === 'development') {
      console.log(`Verification token for ${email}: ${token}`);
      console.log(`Verification URL: ${getBaseUrl()}/verify-email?token=${token}`);
    }
  }
};

// POST /api/parent-auth/register
parentAuthRouter.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8 }),
  body('firstName').isString().notEmpty(),
  body('lastName').isString().notEmpty(),
  body('phone').isString().notEmpty(),
  body('emergencyContactName').isString().notEmpty(),
  body('emergencyContactPhone').isString().notEmpty(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password, firstName, lastName, phone, emergencyContactName, emergencyContactPhone } = req.body;
    const existing = await storage.getParentByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Parent with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const parent = await storage.createParent({
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      emergencyContactName,
      emergencyContactPhone,
      isVerified: false,
    });

    // Generate verification token and send email
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    await storage.createVerificationToken({
      parentId: parent.id,
      token,
      expiresAt,
    });

    await sendVerificationEmail(email, firstName, token);

    // Send welcome email to new parent
    const loginLink = `${getBaseUrl()}/parent/login`;
    try {
      await sendParentWelcomeEmail(email, firstName, loginLink);
      console.log(`Welcome email sent to ${email}`);
    } catch (emailError) {
      console.error(`Failed to send welcome email to ${email}:`, emailError);
      // Continue with registration even if email fails
    }

    res.status(201).json({ 
      success: true, 
      parentId: parent.id, 
      message: 'Registration successful. Please check your email to verify your account.' 
    });
  } catch (error) {
    console.error('Parent registration error:', error);
    res.status(500).json({ error: 'Failed to register parent' });
  }
});

// POST /api/parent-auth/login
parentAuthRouter.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password } = req.body;
    console.log(`[PARENT-LOGIN] Attempting login for email: ${email}`);
    const parent = await storage.getParentByEmail(email);
    if (!parent) {
      console.log(`[PARENT-LOGIN] No parent found with email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    console.log(`[PARENT-LOGIN] Parent found - ID: ${parent.id}, Name: ${parent.firstName} ${parent.lastName}`);
    const passwordHash = parent.passwordHash || (parent as any).password_hash;
    console.log(`[PARENT-LOGIN] Password hash exists: ${!!passwordHash}`);
    
    if (!passwordHash) {
      console.log(`[PARENT-LOGIN] No password hash found for parent ${parent.id}. Password setup may not be complete.`);
      return res.status(401).json({ 
        error: 'Please complete your password setup. Check your email for the password setup link.' 
      });
    }
    
    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    const isVerified = parent.isVerified || (parent as any).is_verified;
    if (!isVerified) {
      return res.status(403).json({ 
        error: 'Email not verified. Please check your email and click the verification link.' 
      });
    }

    // Set session data
    req.session.parentId = parent.id;
    req.session.parentEmail = parent.email;
    
    // Update lastLoginAt timestamp
    try {
      // Update directly through supabaseAdmin to avoid storage layer abstraction issues
      const { error } = await supabaseAdmin
        .from('parents')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', parent.id);
        
      if (error) {
        console.warn('Failed to update parent last login timestamp:', error);
        // Continue login process anyway
      } else {
        console.log(`Updated lastLoginAt for parent ${parent.id}`);
      }
    } catch (updateError) {
      console.error('Error updating lastLoginAt:', updateError);
      // Continue login process even if timestamp update fails
    }

    res.json({ success: true, parentId: parent.id, parentEmail: parent.email });
  } catch (error) {
    console.error('Parent login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET /api/parent-auth/status
parentAuthRouter.get('/status', (req: Request, res: Response) => {
  if (req.session.parentId) {
    res.json({
      loggedIn: true,
      parentId: req.session.parentId,
      email: req.session.parentEmail
    });
  } else {
    res.json({
      loggedIn: false
    });
  }
});

// POST /api/parent-auth/logout
parentAuthRouter.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// GET /api/parent-auth/verify-email
parentAuthRouter.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find the verification token and check if it's valid and not expired
    const verificationToken = await storage.getVerificationToken(token);
    
    if (!verificationToken) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    if (new Date() > new Date(verificationToken.expires_at)) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }

    // Mark the parent as verified
    const parentId = verificationToken.parent_id;
    await storage.markParentAsVerified(parentId);
    
    // Delete the used verification token
    await storage.deleteVerificationToken(token);

    res.json({ 
      success: true, 
      message: 'Email verified successfully. You can now log in.' 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// POST /api/parent-auth/resend-verification
parentAuthRouter.post('/resend-verification', [
  body('email').isEmail().normalizeEmail(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;
    const parent = await storage.getParentByEmail(email);
    
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const isVerified = parent.isVerified || (parent as any).is_verified;
    if (isVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Delete any existing tokens for this parent
    await storage.deleteVerificationTokensByParentId(parent.id);
    
    // Create new token
    await storage.createVerificationToken({
      parentId: parent.id,
      token,
      expiresAt,
    });

    await sendVerificationEmail(email, parent.firstName || 'Gymnastics Parent', token);

    res.json({ 
      success: true, 
      message: 'Verification email sent successfully' 
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// POST /api/parent-auth/send-code
parentAuthRouter.post('/send-code', [
  body('email').isEmail().normalizeEmail(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;
    
    // Check if parent exists
    const parent = await storage.getParentByEmail(email);
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found with this email address' });
    }

    // Generate a 6-digit verification code
    const authCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code in session with expiration (10 minutes)
    req.session.parentAuthCode = authCode;
    req.session.parentAuthEmail = email;
    req.session.parentAuthCodeExpires = Date.now() + (10 * 60 * 1000); // 10 minutes
    
    // Send the code via email
    const { sendParentAuthCode } = await import('./lib/email');
    await sendParentAuthCode(email, parent.firstName || 'Parent', authCode);
    
    // Log the code in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 DEV: Auth code for ${email}: ${authCode}`);
    }

    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// POST /api/parent-auth/verify-code
parentAuthRouter.post('/verify-code', [
  body('email').isEmail().normalizeEmail(),
  body('code').isString().isLength({ min: 6, max: 6 }),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, code } = req.body;
    
    // Check if code matches and hasn't expired
    if (!req.session.parentAuthCode || 
        !req.session.parentAuthEmail || 
        !req.session.parentAuthCodeExpires) {
      return res.status(400).json({ error: 'No verification code found. Please request a new code.' });
    }

    if (req.session.parentAuthEmail !== email) {
      return res.status(400).json({ error: 'Email mismatch. Please request a new code.' });
    }

    if (Date.now() > req.session.parentAuthCodeExpires) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    if (req.session.parentAuthCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Get parent info
    const parent = await storage.getParentByEmail(email);
    if (!parent) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    // Clear the verification code from session
    delete req.session.parentAuthCode;
    delete req.session.parentAuthEmail;
    delete req.session.parentAuthCodeExpires;

    // Set parent session data (log them in)
    req.session.parentId = parent.id;
    req.session.parentEmail = parent.email;
    
    // Update lastLoginAt timestamp
    try {
      const { error } = await supabaseAdmin
        .from('parents')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', parent.id);
        
      if (error) {
        console.warn('Failed to update parent last login timestamp:', error);
      } else {
        console.log(`Updated lastLoginAt for parent ${parent.id}`);
      }
    } catch (updateError) {
      console.error('Error updating lastLoginAt:', updateError);
    }

    res.json({ success: true, parentId: parent.id, parentEmail: parent.email });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});
