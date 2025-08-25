import { format as formatDateFns } from 'date-fns';

/**
 * Calculate age from date of birth string in YYYY-MM-DD format
 * Handles timezone issues by parsing the date components directly
 */
export function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month; // getMonth() is 0-based
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }
  
  return age;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-based in Date constructor
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Parse a date string (YYYY-MM-DD) into a JavaScript Date object
 * This ensures consistent date handling across the application and avoids timezone issues
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  // For ISO format with time component already included
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  
  // For YYYY-MM-DD format, add a noon UTC time to avoid timezone issues
  return new Date(`${dateString}T12:00:00Z`);
}

/**
 * Format a date string for display in the booking flow
 * @param dateString Date string in YYYY-MM-DD format
 * @param formatPattern Format pattern for date-fns (default: 'EEEE, MMMM d, yyyy')
 */
export function formatBookingDate(dateString: string | null | undefined, formatPattern = 'EEEE, MMMM d, yyyy'): string {
  if (!dateString) return 'Not selected';
  
  // Use the safe parseDate function and then format with date-fns
  const date = parseDate(dateString);
  if (!date) return 'Invalid date';
  
  return formatDateFns(date, formatPattern);
}