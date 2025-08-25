# Environment-Aware Session & CORS Configuration

This project uses an environment-aware session and CORS middleware that automatically configures different settings for development and production environments.

## Environment Variables

### Required Session Secrets

The application uses different session secrets for different environments to prevent session collisions when running dev and production concurrently:

| Environment | Cookie Name | Environment Variable | Purpose |
|-------------|-------------|---------------------|---------|
| Development | `cwt.sid.dev` | `SESSION_SECRET_DEV` | Development sessions |
| Production | `cwt.sid` | `SESSION_SECRET_PROD` | Production sessions |

### Fallback Behavior

**No Fallbacks**: Each environment requires its own specific session secret:

- **Development**: Requires `SESSION_SECRET_DEV` (no fallback)
- **Production**: Requires `SESSION_SECRET_PROD` (no fallback)

This ensures complete separation between development and production sessions.

### Example .env Configuration

```bash
# Session Configuration (Environment-Aware)
# REQUIRED: Environment-specific session secrets (no fallbacks)
SESSION_SECRET_DEV="your-dev-session-secret-here"
SESSION_SECRET_PROD="your-production-session-secret-here"
```

## Cookie Configuration

The middleware automatically configures cookies based on the environment:

### Development Settings
- **Cookie Name**: `cwt.sid.dev`
- **Secure**: `false` (allows HTTP)
- **SameSite**: `lax` (relaxed cross-origin)
- **Domain**: `localhost` (for cross-port communication)

### Production Settings
- **Cookie Name**: `cwt.sid`
- **Secure**: `true` (HTTPS only)
- **SameSite**: `none` (strict cross-origin)
- **Domain**: Auto-detected from request

## CORS Configuration

CORS origins are automatically configured based on environment:

- **Development**: `http://localhost:5173`, `http://localhost:3000`, `http://localhost:5001`
- **Production**: `https://coachwilltumbles.com`

## Usage

The middleware is automatically configured in `server/index.ts`:

```typescript
import { configureSessionAndCors } from './config/session';

// Configure CORS and session middleware
configureSessionAndCors(app);
```

## Client-Side Requirements

All frontend fetch calls must include credentials:

```typescript
fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
  credentials: 'include' // Required for session cookies
});
```

## Validation

### Manual Testing

1. **Development**: Open browser DevTools → Application → Cookies
   - Should show `cwt.sid.dev` with `Secure=false`, `SameSite=Lax`

2. **Production**: Open browser DevTools → Application → Cookies
   - Should show `cwt.sid` with `Secure=true`, `SameSite=None`

### API Testing

Test authentication status:

```bash
curl -b cookies.txt -c cookies.txt http://localhost:5001/api/auth/status
```

The response should include session information if authenticated.
