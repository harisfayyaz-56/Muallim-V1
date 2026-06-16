/**
 * UAE Platform Preferences
 * Timezone and Currency utilities for the application
 */

// Default currency for UAE market
export const DEFAULT_CURRENCY = 'AED';
export const DEFAULT_TIMEZONE = 'Asia/Dubai';

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Dubai', label: 'Dubai (GST, UTC+4)' },
  { value: 'Asia/Abu_Dhabi', label: 'Abu Dhabi (GST, UTC+4)' },
  { value: 'Asia/Sharjah', label: 'Sharjah (GST, UTC+4)' },
  { value: 'Asia/Kolkata', label: 'India (IST, UTC+5:30)' },
  { value: 'Europe/London', label: 'London (GMT, UTC+0)' },
  { value: 'US/Eastern', label: 'Eastern (EST/EDT, UTC-5/-4)' },
  { value: 'US/Central', label: 'Central (CST/CDT, UTC-6/-5)' },
  { value: 'US/Mountain', label: 'Mountain (MST/MDT, UTC-7/-6)' },
  { value: 'US/Pacific', label: 'Pacific (PST/PDT, UTC-8/-7)' },
  { value: 'Europe/Paris', label: 'Central Europe (CET, UTC+1)' },
];

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
    'Europe/London': 'GMT',
    'US/Eastern': 'EST',
    'US/Central': 'CST',
    'US/Mountain': 'MST',
    'US/Pacific': 'PST',
    'Europe/Paris': 'CET',
  };
  return abbrs[timezone] || 'UTC';
};
