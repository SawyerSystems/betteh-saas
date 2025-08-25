/**
 * Pacific Timezone Utilities for CoachWillTumbles.com
 * Provides consistent Pacific Time (PST/PDT) handling across the platform
 */

const PACIFIC_TIMEZONE = 'America/Los_Angeles';

/**
 * Formats a Date object to Pacific Time string
 * @param date - Date object to format
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string in Pacific Time
 */
export function formatToPacificTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: PACIFIC_TIMEZONE,
    dateStyle: 'medium',
    timeStyle: 'short'
  };

  return date.toLocaleString('en-US', { ...defaultOptions, ...options });
}

/**
 * Formats a Date object to Pacific Time date string (no time)
 * @param date - Date object to format
 * @returns Date string in Pacific Time (e.g., "Jul 6, 2025")
 */
export function formatToPacificDate(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toLocaleDateString('en-US', {
    timeZone: PACIFIC_TIMEZONE,
    dateStyle: 'medium'
  });
}

/**
 * Formats a Date object to ISO date string in Pacific Time
 * @param date - Date object to format
 * @returns ISO date string (YYYY-MM-DD) in Pacific Time
 */
export function formatToPacificISO(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return '';
  }

  // Create a new date in Pacific timezone
  const pacificDate = new Date(date.toLocaleString('en-US', { timeZone: PACIFIC_TIMEZONE }));
  
  // Return YYYY-MM-DD format
  return pacificDate.toISOString().split('T')[0];
}

/**
 * Formats a time string to HH:MM format
 * @param timeString - Time string to format
 * @returns Formatted time string (HH:MM)
 */
export function formatTimeToHHMM(timeString: string): string {
  if (!timeString) return '';
  
  // If already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  
  // If in HH:MM:SS format, strip seconds
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
    return timeString.substring(0, 5);
  }
  
  return timeString;
}

/**
 * Parses a published_at timestamp from database to Pacific Time
 * @param publishedAt - Published timestamp from database
 * @returns Formatted Pacific Time string
 */
export function formatPublishedAtToPacific(publishedAt: string | Date): string {
  if (!publishedAt) return 'Invalid Date';
  
  try {
    const date = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
    console.log('formatPublishedAtToPacific debug:', {
      input: publishedAt,
      inputType: typeof publishedAt,
      parsedDate: date,
      isValid: !isNaN(date.getTime())
    });
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date detected in formatPublishedAtToPacific:', publishedAt);
      return 'Invalid Date';
    }
    
    return formatToPacificTime(date, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch (error) {
    console.error('Error formatting published_at:', error);
    return 'Invalid Date';
  }
}

/**
 * Creates a Date object in Pacific timezone for today
 * @returns Date object representing today in Pacific Time
 */
export function getTodayInPacific(): Date {
  // Get current date in Pacific time zone
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: PACIFIC_TIMEZONE, 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const pacificDateParts = formatter.formatToParts(new Date());
  
  // Extract year, month, day components
  const year = pacificDateParts.find(part => part.type === 'year')?.value;
  const month = pacificDateParts.find(part => part.type === 'month')?.value;
  const day = pacificDateParts.find(part => part.type === 'day')?.value;
  
  // Create date with Pacific time components
  if (year && month && day) {
    // Month is 0-indexed in Date constructor
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Fallback to original implementation if something goes wrong
  const now = new Date();
  const pacificTimeString = now.toLocaleString('en-US', { timeZone: PACIFIC_TIMEZONE });
  return new Date(pacificTimeString);
}

/**
 * Checks if a date is today in Pacific timezone
 * @param date - Date to check
 * @returns True if the date is today in Pacific Time
 */
export function isTodayInPacific(date: Date): boolean {
  const today = getTodayInPacific();
  const checkDate = new Date(date.toLocaleString('en-US', { timeZone: PACIFIC_TIMEZONE }));
  
  return today.toDateString() === checkDate.toDateString();
}

/**
 * Compare two dates in Pacific timezone, ignoring the time component
 * Gold standard for booking date comparisons
 * 
 * @param dateA ISO date string or Date object
 * @param dateB ISO date string or Date object
 * @returns -1 if dateA < dateB, 0 if equal, 1 if dateA > dateB
 */
export function compareDatesInPacific(
  dateA: string | Date, 
  dateB: string | Date
): number {
  // Convert to ISO date strings in Pacific timezone
  const isoDateA = typeof dateA === 'string' ? dateA : formatToPacificISO(dateA);
  const isoDateB = typeof dateB === 'string' ? dateB : formatToPacificISO(dateB);
  
  // Compare as strings (YYYY-MM-DD format)
  if (isoDateA < isoDateB) return -1;
  if (isoDateA > isoDateB) return 1;
  return 0;
}

/**
 * Checks if a session date is in the past (before today) in Pacific timezone
 * For same-day sessions, this function will return false (not in the past)
 * 
 * @param sessionDate ISO date string or Date object
 * @returns true if the session is strictly in the past (before today), false otherwise
 */
export function isSessionInPast(sessionDate: string | Date): boolean {
  // Get today's date in Pacific timezone as ISO string
  const pacificToday = getTodayInPacific();
  const todayIso = formatToPacificISO(pacificToday);
  
  // Get the session date as an ISO string
  const sessionIso = typeof sessionDate === 'string' ? sessionDate : formatToPacificISO(sessionDate);
  
  // A session should only be considered "past" if its date is strictly before today
  // If it's today or in the future, return false
  return sessionIso < todayIso;
}

/**
 * Checks if a session date and time is in the past in Pacific timezone
 * This function considers both date and time components
 * 
 * @param sessionDateStr ISO date string (YYYY-MM-DD)
 * @param sessionTimeStr Time string (HH:MM:SS or HH:MM) or null/undefined
 * @returns true if the session is in the past, false otherwise
 */
export function isSessionDateTimeInPast(sessionDateStr: string, sessionTimeStr: string | null | undefined): boolean {
  // Handle missing inputs
  if (!sessionDateStr) return false;
  
  const now = new Date();
  
  // Get current time in Pacific timezone
  const pacificNow = new Date(now.toLocaleString('en-US', { timeZone: PACIFIC_TIMEZONE }));
  
  // Create a Date object for the session in Pacific time
  // Start with the date portion
  const [year, month, day] = sessionDateStr.split('-').map(num => parseInt(num));
  
  // Default time components
  let hours = 0, minutes = 0;
  
  // Add time if available
  if (sessionTimeStr) {
    const timeParts = sessionTimeStr.split(':');
    hours = parseInt(timeParts[0]) || 0;
    minutes = parseInt(timeParts[1]) || 0;
  }
  
  // Create session date in Pacific timezone context
  // Month is 0-indexed in JS Date
  const sessionDate = new Date(year, month - 1, day, hours, minutes);
  
  // Since we created both dates in the same timezone context, 
  // we can compare them directly
  return sessionDate < pacificNow;
}

/**
 * Converts a database timestamp to Pacific timezone for API responses
 * @param timestamp - Database timestamp
 * @returns Object with formatted date and time in Pacific timezone
 */
export function convertDBTimestampToPacific(timestamp: string | Date) {
  if (!timestamp) return { date: '', time: '', full: 'Invalid Date' };
  
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    return {
      date: formatToPacificDate(date),
      time: formatToPacificTime(date, { timeStyle: 'short' }),
      full: formatToPacificTime(date),
      iso: formatToPacificISO(date)
    };
  } catch (error) {
    console.error('Error converting timestamp:', error);
    return { date: '', time: '', full: 'Invalid Date', iso: '' };
  }
}