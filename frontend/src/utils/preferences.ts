/**
 * UAE Platform Preferences
 * Timezone and Currency utilities for the application
 */

// Default currency for UAE market
export const DEFAULT_CURRENCY = 'AED';

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Dubai', label: 'Dubai (GST, UTC+4)' },
  { value: 'Asia/Abu_Dhabi', label: 'Abu Dhabi (GST, UTC+4)' },
  { value: 'Asia/Sharjah', label: 'Sharjah (GST, UTC+4)' },
  { value: 'Asia/Kolkata', label: 'India (IST, UTC+5:30)' },
  { value: 'Asia/Karachi', label: 'Karachi (PKT, UTC+5)' },
  { value: 'Europe/London', label: 'London (GMT, UTC+0)' },
  { value: 'US/Eastern', label: 'Eastern (EST/EDT, UTC-5/-4)' },
  { value: 'US/Central', label: 'Central (CST/CDT, UTC-6/-5)' },
  { value: 'US/Mountain', label: 'Mountain (MST/MDT, UTC-7/-6)' },
  { value: 'US/Pacific', label: 'Pacific (PST/PDT, UTC-8/-7)' },
  { value: 'Europe/Paris', label: 'Central Europe (CET, UTC+1)' },
];

export const detectTimezone = (): string => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return 'Asia/Dubai';
    
    // Map common aliases/close timezones
    const mapping: Record<string, string> = {
      'Asia/Calcutta': 'Asia/Kolkata',
      'Europe/Bratislava': 'Europe/Paris',
      'Europe/Prague': 'Europe/Paris',
      'Europe/Rome': 'Europe/Paris',
      'Europe/Berlin': 'Europe/Paris',
      'Europe/Madrid': 'Europe/Paris',
      'Europe/Brussels': 'Europe/Paris',
      'Europe/Amsterdam': 'Europe/Paris',
      'America/New_York': 'US/Eastern',
      'America/Chicago': 'US/Central',
      'America/Denver': 'US/Mountain',
      'America/Los_Angeles': 'US/Pacific',
      'Asia/Muscat': 'Asia/Dubai',
      'Asia/Tbilisi': 'Asia/Dubai',
      'Asia/Yerevan': 'Asia/Dubai',
      'Asia/Baku': 'Asia/Dubai',
    };
    
    if (mapping[tz]) return mapping[tz];
    
    // Check if it's one of the options
    const match = TIMEZONE_OPTIONS.find(opt => opt.value.toLowerCase() === tz.toLowerCase());
    if (match) return match.value;
    
    // Check by offset or prefix if not exact match
    if (tz.startsWith('Europe/')) return 'Europe/Paris';
    if (tz.startsWith('US/') || tz.startsWith('America/')) {
      if (tz.includes('New_York') || tz.includes('Detroit') || tz.includes('Indiana') || tz.includes('Toronto')) return 'US/Eastern';
      if (tz.includes('Chicago') || tz.includes('Houston') || tz.includes('Winnipeg')) return 'US/Central';
      if (tz.includes('Denver') || tz.includes('Phoenix')) return 'US/Mountain';
      if (tz.includes('Los_Angeles') || tz.includes('Vancouver')) return 'US/Pacific';
      return 'US/Eastern';
    }
  } catch (e) {
    // ignore
  }
  return 'Asia/Dubai';
};

export const DEFAULT_TIMEZONE = detectTimezone();

/**
 * Format price in AED
 * @param amount - Price amount
 * @returns Formatted price string (e.g., "AED 150.00")
 */
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
  }).format(amount);
};

/**
 * Format time based on user timezone
 * @param date - Date to format
 * @param timezone - User's timezone
 * @returns Formatted time string
 */
export const formatTime = (date: Date | string, timezone: string = DEFAULT_TIMEZONE): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-AE', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(dateObj);
};

/**
 * Format date only in user timezone
 * @param date - Date to format
 * @param timezone - User's timezone
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, timezone: string = DEFAULT_TIMEZONE): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-AE', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Get timezone abbreviation
 * @param timezone - Timezone string
 * @returns Abbreviation (e.g., "GST", "IST")
 */
export const getTimezoneAbbr = (timezone: string): string => {
  const abbrs: Record<string, string> = {
    'Asia/Dubai': 'GST',
    'Asia/Abu_Dhabi': 'GST',
    'Asia/Sharjah': 'GST',
    'Asia/Kolkata': 'IST',
    'Asia/Karachi': 'PKT',
    'Europe/London': 'GMT',
    'US/Eastern': 'EST',
    'US/Central': 'CST',
    'US/Mountain': 'MST',
    'US/Pacific': 'PST',
    'Europe/Paris': 'CET',
  };
  return abbrs[timezone] || 'UTC';
};

/**
 * Format a time slot label in a given timezone (HH:MM)
 */
export const formatSlotTime = (utcIso: string, timezone: string = DEFAULT_TIMEZONE): string => {
  const date = new Date(utcIso);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};
