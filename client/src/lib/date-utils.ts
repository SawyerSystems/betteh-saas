/**
 * Utility to safely parse dates from API responses that may use different field naming conventions
 */
export function getDateField(obj: any, fields: string[]): Date {
  for (const field of fields) {
    if (obj[field]) {
      const date = new Date(obj[field]);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  // Fallback to current date if no valid date found
  return new Date();
}

/**
 * Format a date safely, handling both snake_case and camelCase field names
 */
export function formatPublishedDate(obj: any, options?: Intl.DateTimeFormatOptions): string {
  const date = getDateField(obj, ['published_at', 'publishedAt']);
  return date.toLocaleDateString('en-US', options || { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
}