// Shared utility for getting the correct base URL across the application
export function getBaseUrl(): string {
  // In production, use the environment variable or default to production domain
  if (process.env.NODE_ENV === 'production') {
    return process.env.BASE_URL || process.env.FRONTEND_URL || 'https://app.betteh.com';
  }
  // In development, use localhost
  return process.env.BASE_URL || process.env.FRONTEND_URL || 'http://localhost:6173';
}

// Helper to determine if we're in production
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
