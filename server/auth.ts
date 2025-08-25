import * as bcrypt from 'bcrypt';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { storage } from './storage';

// Extend Express session data
declare module 'express-session' {
  interface SessionData {
    adminId?: number;
    parentId?: number;
    parentEmail?: string;
    // Parent auth code system
    parentAuthCode?: string;
    parentAuthEmail?: string;
    parentAuthCodeExpires?: number;
  }
}

export const authRouter = Router();

// Login route
authRouter.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().trim()
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  
  console.log('🔐 Login attempt for email:', email);

  try {
    // Find admin by email
    const admin = await storage.getAdminByEmail(email);
    console.log('👤 Admin lookup result:', admin ? `Found admin ID ${admin.id}` : 'No admin found');
    
    if (!admin) {
      console.log('❌ Login failed: Admin not found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password (handle snake_case from Supabase)
    const passwordHash = admin.passwordHash || (admin as any).password_hash;
    console.log('🔑 Password hash exists:', !!passwordHash);
    
    const isValid = await bcrypt.compare(password, passwordHash);
    console.log('🔓 Password validation result:', isValid);
    
    if (!isValid) {
      console.log('❌ Login failed: Invalid password for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    req.session.adminId = admin.id;
    console.log('✅ Login successful for admin ID:', admin.id);
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      admin: {
        id: admin.id,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout route
authRouter.get('/logout', (req: Request, res: Response) => {
  req.session.destroy((err: any) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check auth status
authRouter.get('/status', (req: Request, res: Response) => {
  const loggedIn = !!req.session.adminId;
  res.json({ 
    loggedIn,
    adminId: req.session.adminId 
  });
});

// Middleware to protect admin routes
export const isAdminAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 Auth check - Session data:', {
    sessionID: req.sessionID,
    adminId: req.session.adminId,
    hasSession: !!req.session,
    path: req.path
  });
  
  if (!req.session.adminId) {
    console.log('❌ Admin authentication failed - no adminId in session');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  console.log('✅ Admin authentication successful');
  next();
};

// Create first admin account (run this once to seed the database)
export async function createFirstAdmin(email: string, password: string) {
  try {
    const existingAdmin = await storage.getAdminByEmail(email);
    if (existingAdmin) {
      console.log('Admin already exists');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await storage.createAdmin({
      email,
      passwordHash
    });

    console.log('Admin created successfully:', admin.email);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}