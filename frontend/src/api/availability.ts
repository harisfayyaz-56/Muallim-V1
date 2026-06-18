const API_BASE = 'http://localhost:8000/api';

export interface AvailabilityGrid {
  Mon: string[];
  Tue: string[];
  Wed: string[];
  Thu: string[];
  Fri: string[];
  Sat: string[];
  Sun: string[];
}

export interface TeacherAvailabilityData {
  timezone: string;
  session_duration: '30' | '60' | 'both';
  grid: AvailabilityGrid;
  slots_by_day?: Record<string, string[]>;
  slots_by_day_viewer?: Record<string, string[]>;
  viewer_timezone?: string;
}

export interface BookableSlot {
  time: string;
  utc: string;
  available: boolean;
}

export interface DateSlotsResponse {
  date: string;
  duration: number;
  teacher_timezone: string;
  viewer_timezone: string;
  slots: BookableSlot[];
}

export interface BookingPayload {
  teacher_id: number;
  subject: string;
  scheduled_date: string;
  duration_minutes: number;
  amount: string;
  description?: string;
}

export interface Booking {
  id: number;
  subject: string;
  scheduled_date: string;
  duration_minutes: number;
  status: string;
  amount: string;
  created_at: string;
}

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export const getMyAvailability = async (token: string): Promise<TeacherAvailabilityData> => {
  const response = await fetch(`${API_BASE}/teacher/me/availability/`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch availability');
  return response.json();
};

export const updateMyAvailability = async (
  token: string,
  data: { grid: AvailabilityGrid; session_duration: '30' | '60' | 'both' }
): Promise<TeacherAvailabilityData> => {
  const response = await fetch(`${API_BASE}/teacher/me/availability/`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save availability');
  }
  return response.json();
};

export const getTeacherAvailability = async (
  teacherId: string,
  viewerTimezone?: string
): Promise<TeacherAvailabilityData> => {
  const params = viewerTimezone ? `?timezone=${encodeURIComponent(viewerTimezone)}` : '';
  const response = await fetch(`${API_BASE}/teacher/${teacherId}/availability/${params}`);
  if (!response.ok) throw new Error('Failed to fetch teacher availability');
  return response.json();
};

export const getTeacherSlotsForDate = async (
  teacherId: string,
  date: string,
  duration: number,
  viewerTimezone?: string
): Promise<DateSlotsResponse> => {
  const params = new URLSearchParams({ date, duration: String(duration) });
  if (viewerTimezone) params.set('timezone', viewerTimezone);
  const response = await fetch(`${API_BASE}/teacher/${teacherId}/slots/?${params}`);
  if (!response.ok) throw new Error('Failed to fetch available slots');
  return response.json();
};

export const createBooking = async (token: string, data: BookingPayload): Promise<Booking> => {
  const response = await fetch(`${API_BASE}/bookings/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.scheduled_date?.[0] || err.detail || 'Failed to create booking';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return response.json();
};

export const getMyBookings = async (token: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/bookings/`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch bookings');
  return response.json();
};
