import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from './supabase-client';

// Extended request interface for authenticated requests
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    tenant_id?: string;
    role?: string;
    tenant_memberships?: Record<string, { role: string; status: string }>;
  };
  tenant_id?: string; // Current tenant context
}

/**
 * Supabase Auth middleware - extracts user from JWT token
 */
export async function authenticateSupabaseUser(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void | Response> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT token using Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.log('🔒 Auth token verification failed:', error?.message || 'Invalid user');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Extract tenant information from JWT claims
    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: user.id,
      email: user.email!,
      tenant_id: user.app_metadata?.tenant_id,
      role: user.app_metadata?.role,
      tenant_memberships: user.app_metadata?.tenant_memberships || {}
    };

    // Set current tenant context (defaults to primary tenant)
    authReq.tenant_id = authReq.user.tenant_id;

    console.log(`✅ Authenticated user: ${user.email} (tenant: ${authReq.tenant_id})`);
    next();

  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Dual auth middleware - supports both Supabase JWT and legacy session auth
 * This allows gradual migration from the current system
 */
export async function dualAuth(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  // Try Supabase Auth first
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      await authenticateSupabaseUser(req, res, next);
      return; // Successfully authenticated with Supabase
    } catch (error) {
      console.log('🔄 Supabase auth failed, trying session auth:', error);
      // Fall through to session auth
    }
  }

  // Fall back to existing session auth
  const authReq = req as AuthenticatedRequest;
  
  if (req.session?.adminId) {
    // Map session admin to auth request format
    authReq.user = {
      id: `admin-${req.session.adminId}`, // Temporary mapping
      email: 'admin@legacy.local', // TODO: Get from storage
      tenant_id: process.env.LEGACY_TENANT_ID, // Default tenant for migration
      role: 'coach_admin'
    };
    authReq.tenant_id = authReq.user.tenant_id;
    console.log(`✅ Legacy admin authenticated: ${req.session.adminId}`);
    return next();
  }

  if (req.session?.parentId) {
    // Map session parent to auth request format  
    authReq.user = {
      id: `parent-${req.session.parentId}`, // Temporary mapping
      email: req.session.parentEmail || 'parent@legacy.local',
      tenant_id: process.env.LEGACY_TENANT_ID, // Default tenant for migration
      role: 'parent'
    };
    authReq.tenant_id = authReq.user.tenant_id;
    console.log(`✅ Legacy parent authenticated: ${req.session.parentId}`);
    return next();
  }

  // No authentication found
  res.status(401).json({ error: 'Authentication required' });
}

/**
 * Role-based authorization middleware
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = authReq.user.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        actual: userRole
      });
    }

    next();
  };
}

/**
 * Platform admin only middleware
 */
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole(['platform_admin'])(req, res, next);
}

/**
 * Coach admin or platform admin middleware
 */
export function requireCoachAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole(['platform_admin', 'coach_admin'])(req, res, next);
}

/**
 * Any coach staff role middleware
 */
export function requireCoachStaff(req: Request, res: Response, next: NextFunction) {
  return requireRole(['platform_admin', 'coach_admin', 'coach_staff'])(req, res, next);
}

/**
 * Parent role middleware
 */
export function requireParent(req: Request, res: Response, next: NextFunction) {
  return requireRole(['parent'])(req, res, next);
}

/**
 * Tenant isolation middleware - ensures user can only access their tenant's data
 */
export function enforceTenantIsolation(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user || !authReq.tenant_id) {
    return res.status(401).json({ error: 'Authentication and tenant context required' });
  }

  // Platform admins can access any tenant
  if (authReq.user.role === 'platform_admin') {
    return next();
  }

  // Check if user has access to the requested tenant
  const userTenantMemberships = authReq.user.tenant_memberships || {};
  const currentTenant = authReq.tenant_id;

  if (!userTenantMemberships[currentTenant]) {
    return res.status(403).json({ 
      error: 'Access denied to this tenant',
      tenant: currentTenant 
    });
  }

  next();
}
