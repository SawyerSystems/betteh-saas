import type { Express } from 'express';

export function setupApiDocs(app: Express) {
  // API Documentation endpoint
  app.get('/api/docs', (req, res) => {
    const apiEndpoints = {
      "API Documentation": "Betteh Platform API",
      "Authentication": {
        "POST /api/auth/login": "Admin login with email/password",
        "GET /api/auth/status": "Check authentication status", 
        "GET /api/auth/logout": "Logout current session",
        "GET /api/auth/test": "Test Supabase auth middleware (NEW)"
      },
      "Parent Authentication": {
        "POST /api/parent-auth/send-code": "Send magic code to parent email",
        "POST /api/parent-auth/verify-code": "Verify magic code and login",
        "GET /api/parent-auth/status": "Check parent auth status"
      },
      "Multi-Tenant": {
        "GET /api/test/service-role": "Test service role database access",
        "GET /api/tenants": "List all tenants with plans and statistics",
        "POST /api/tenants": "Create new tenant (individual or organization)",
        "PUT /api/tenants/:id": "Update tenant information and settings",
        "GET /api/tenants/:tenantId/users": "List all users assigned to a tenant with roles",
        "POST /api/tenants/:tenantId/users": "Assign user to tenant with specific role",
        "GET /api/tenants/:tenantId/locations": "List all locations for a tenant",
        "POST /api/tenants/:tenantId/locations": "Create new location for tenant",
        "GET /api/tenants/:tenantId/staff-locations": "List staff-location assignments",
        "GET /api/organizations/:parentId/children": "Get organization hierarchy children",
        "POST /api/organizations/hierarchy": "Create organization hierarchy relationship",
        "GET /api/feature-plans": "List available feature plans",
        "GET /api/roles/permissions": "Get role permissions and capabilities",
        "GET /api/admin/tenant-analytics": "Get comprehensive tenant analytics"
      },
      "Bookings": {
        "GET /api/admin/bookings": "Get all bookings (Admin)",
        "POST /api/bookings": "Create new booking",
        "GET /api/parent/bookings": "Get parent's bookings",
        "PUT /api/bookings/:id": "Update booking",
        "DELETE /api/bookings/:id": "Cancel booking"
      },
      "Athletes": {
        "GET /api/athletes": "Get all athletes (Admin)",
        "POST /api/athletes": "Create new athlete",
        "GET /api/athletes/:id": "Get athlete details",
        "PUT /api/athletes/:id": "Update athlete",
        "GET /api/athletes/missing-waivers": "Athletes without signed waivers"
      },
      "Parents": {
        "GET /api/parents": "Get all parents (Admin)",
        "POST /api/parents": "Create new parent",
        "GET /api/parents/:id": "Get parent details",
        "PUT /api/parents/:id": "Update parent",
        "DELETE /api/parents/:id": "Delete parent",
        "GET /api/parents/:id/athletes": "Get parent's athletes"
      },
      "Skills & Progress": {
        "GET /api/admin/skills": "Get all skills",
        "POST /api/admin/skills": "Create new skill",
        "GET /api/admin/athletes/:athleteId/skills": "Get athlete's skills",
        "POST /api/admin/athlete-skills": "Add skill to athlete",
        "POST /api/admin/athlete-skill-videos": "Upload skill video",
        "GET /api/progress/:token": "Public progress sharing"
      },
      "Availability": {
        "GET /api/available-times/:date/:lessonType": "Get available time slots",
        "GET /api/availability": "Get all availability windows",
        "POST /api/availability": "Create availability window",
        "GET /api/availability-exceptions": "Get availability exceptions"
      },
      "Content Management": {
        "GET /api/site-content": "Get site content (home page)",
        "POST /api/admin/site-content": "Update site content",
        "GET /api/testimonials": "Get testimonials",
        "GET /api/faqs": "Get FAQ items",
        "GET /api/blog-posts": "Get blog posts",
        "GET /api/tips": "Get tips"
      },
      "Payments": {
        "POST /api/stripe/create-checkout-session": "Create Stripe checkout",
        "POST /api/stripe/webhook": "Stripe webhook handler",
        "GET /api/stripe/products": "Get Stripe products",
        "GET /api/admin/payouts/summary": "Payout summary",
        "GET /api/admin/payouts/list": "Payout history"
      },
      "Waivers": {
        "GET /api/athletes/:id/waiver": "Get athlete waiver status",
        "POST /api/waivers": "Submit signed waiver",
        "GET /api/waivers/:id/pdf": "Download waiver PDF"
      },
      "System": {
        "GET /api/health": "Health check endpoint",
        "POST /api/admin/clear-test-data": "Clear test data (Admin)",
        "POST /api/admin/generate-test-bookings": "Generate test data (Admin)",
        "POST /api/admin/health-check": "System health check (Admin)"
      }
    };

    const authInfo = {
      "Authentication Types": {
        "Admin": "Session-based auth with email/password",
        "Parent": "Magic code authentication via email",
        "Supabase (NEW)": "JWT-based auth with tenant isolation"
      },
      "Protected Routes": {
        "isAdminAuthenticated": "Requires admin session",
        "isParentAuthenticated": "Requires parent session", 
        "dualAuth (NEW)": "Supports both Supabase JWT and legacy sessions",
        "requireRole (NEW)": "Role-based authorization"
      }
    };

    const migrationStatus = {
      "SaaS Migration Progress": "15% Complete",
      "Database Foundation": "✅ 100% Complete - RLS, JWT claims, tenant isolation",
      "Authentication": "✅ 100% Complete - Supabase Auth + dual middleware",
      "Backend Infrastructure": "✅ 100% Complete - Service role, policies, triggers",
      "Frontend Integration": "🚧 Pending - Supabase Auth client setup",
      "Branding System": "🚧 Pending - Replace hardcoded references",
      "Tenant Routing": "🚧 Pending - Subdomain resolution",
      "Next Phase": "Frontend Supabase Auth Integration"
    };

    res.json({
      title: "Betteh Platform API Documentation",
      version: "1.0.0",
      description: "Gymnastics booking platform API - transitioning to multi-tenant SaaS",
      baseUrl: req.get('host')?.includes('localhost') ? 
        `http://localhost:6001` : 
        `https://${req.get('host')}`,
      endpoints: apiEndpoints,
      authentication: authInfo,
      migration: migrationStatus,
      notes: [
        "🔄 Platform is actively migrating from single-tenant to multi-tenant SaaS",
        "🔒 All new auth endpoints use Supabase Auth with JWT claims",
        "🏢 Tenant isolation enforced via Row Level Security (RLS)",
        "📊 Legacy endpoints maintain backward compatibility during migration",
        "🧪 Use /api/test/* endpoints to verify new multi-tenant features"
      ]
    });
  });

  // Simple HTML version for browser viewing
  app.get('/api/docs/html', (req, res) => {
    const baseUrl = req.get('host')?.includes('localhost') ? 
      `http://localhost:6001` : 
      `https://${req.get('host')}`;
    
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Betteh Platform API Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #9333ea; }
        h2 { color: #7c3aed; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        h3 { color: #6d28d9; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
        .endpoint { margin: 10px 0; }
        .method { font-weight: bold; color: #059669; }
        .note { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 10px 0; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .complete { background: #d1fae5; color: #065f46; }
        .pending { background: #fef3c7; color: #92400e; }
    </style>
</head>
<body>
    <h1>🏋️ Betteh Platform API Documentation</h1>
    <p><strong>Base URL:</strong> <code>${baseUrl}</code></p>
    
    <div class="note">
        <strong>🔄 Migration in Progress:</strong> This platform is actively transitioning from legacy single-tenant system to multi-tenant "Betteh" SaaS platform. 
        All new endpoints use Supabase Auth with JWT-based tenant isolation.
    </div>

    <h2>🔑 Authentication</h2>
    <div class="endpoint">
        <span class="method">POST</span> <code>/api/auth/login</code> - Admin login with email/password<br>
        <span class="method">GET</span> <code>/api/auth/status</code> - Check authentication status<br>
        <span class="method">GET</span> <code>/api/auth/test</code> - <span class="status complete">NEW</span> Test Supabase auth middleware
    </div>

    <h2>🏢 Multi-Tenant</h2>
    <div class="endpoint">
        <span class="method">GET</span> <code>/api/test/service-role</code> - <span class="status complete">ACTIVE</span> Test service role database access<br>
        <span class="method">GET</span> <code>/api/tenants</code> - <span class="status complete">NEW</span> List all tenants with plans and statistics<br>
        <span class="method">POST</span> <code>/api/tenants</code> - <span class="status complete">NEW</span> Create new tenant (individual or organization)<br>
        <span class="method">PUT</span> <code>/api/tenants/:id</code> - <span class="status complete">NEW</span> Update tenant information and settings<br>
        <span class="method">GET</span> <code>/api/tenants/:tenantId/users</code> - <span class="status complete">NEW</span> List all users assigned to a tenant with roles<br>
        <span class="method">POST</span> <code>/api/tenants/:tenantId/users</code> - <span class="status complete">NEW</span> Assign user to tenant with specific role<br>
        <span class="method">GET</span> <code>/api/tenants/:tenantId/locations</code> - <span class="status complete">NEW</span> List all locations for a tenant<br>
        <span class="method">POST</span> <code>/api/tenants/:tenantId/locations</code> - <span class="status complete">NEW</span> Create new location for tenant<br>
        <span class="method">GET</span> <code>/api/tenants/:tenantId/staff-locations</code> - <span class="status complete">NEW</span> List staff-location assignments<br>
        <span class="method">GET</span> <code>/api/organizations/:parentId/children</code> - <span class="status complete">NEW</span> Get organization hierarchy children<br>
        <span class="method">POST</span> <code>/api/organizations/hierarchy</code> - <span class="status complete">NEW</span> Create organization hierarchy relationship<br>
        <span class="method">GET</span> <code>/api/feature-plans</code> - <span class="status complete">NEW</span> List available feature plans<br>
        <span class="method">GET</span> <code>/api/roles/permissions</code> - <span class="status complete">NEW</span> Get role permissions and capabilities<br>
        <span class="method">GET</span> <code>/api/admin/tenant-analytics</code> - <span class="status complete">NEW</span> Get comprehensive tenant analytics
    </div>

    <h2>📅 Bookings</h2>
    <div class="endpoint">
        <span class="method">GET</span> <code>/api/admin/bookings</code> - Get all bookings (Admin)<br>
        <span class="method">POST</span> <code>/api/bookings</code> - Create new booking<br>
        <span class="method">GET</span> <code>/api/parent/bookings</code> - Get parent's bookings
    </div>

    <h2>👥 Athletes & Parents</h2>
    <div class="endpoint">
        <span class="method">GET</span> <code>/api/athletes</code> - Get all athletes (Admin)<br>
        <span class="method">GET</span> <code>/api/parents</code> - Get all parents (Admin)<br>
        <span class="method">GET</span> <code>/api/athletes/missing-waivers</code> - Athletes without signed waivers
    </div>

    <h2>🎯 Skills & Progress</h2>
    <div class="endpoint">
        <span class="method">GET</span> <code>/api/admin/skills</code> - Get all skills<br>
        <span class="method">GET</span> <code>/api/admin/athletes/:athleteId/skills</code> - Get athlete's skills<br>
        <span class="method">GET</span> <code>/api/progress/:token</code> - Public progress sharing
    </div>

    <h2>💳 Payments</h2>
    <div class="endpoint">
        <span class="method">POST</span> <code>/api/stripe/create-checkout-session</code> - Create Stripe checkout<br>
        <span class="method">GET</span> <code>/api/admin/payouts/summary</code> - Payout summary
    </div>

    <h2>🏥 System Health</h2>
    <div class="endpoint">
        <span class="method">GET</span> <code>/api/health</code> - Health check endpoint<br>
        <span class="method">GET</span> <code>/api/docs</code> - This API documentation (JSON)<br>
        <span class="method">GET</span> <code>/api/docs/html</code> - This page
    </div>

    <h2>📊 Migration Status</h2>
    <p><span class="status complete">✅ Database Foundation (100%)</span> - RLS, JWT claims, tenant isolation</p>
    <p><span class="status complete">✅ Authentication (100%)</span> - Supabase Auth + dual middleware</p>
    <p><span class="status complete">✅ Backend Infrastructure (100%)</span> - Service role, policies, triggers</p>
    <p><span class="status complete">✅ Multi-Tenant API (100%)</span> - 14 new endpoints for Phase 1.5 features</p>
    <p><span class="status pending">🚧 Frontend Integration</span> - Supabase Auth client setup</p>
    <p><span class="status pending">🚧 Branding System</span> - Replace hardcoded references</p>

    <p><em>For detailed JSON documentation, visit <a href="/api/docs">/api/docs</a></em></p>
</body>
</html>
    `);
  });
}
