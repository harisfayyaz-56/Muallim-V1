/**
 * Profile API Client
 * Handles user profile and timezone updates
 */

const API_BASE = 'http://localhost:8000/api';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  phone?: string;
  bio?: string;
  profile_picture?: string;
  location?: string;
  timezone: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Timezone {
  value: string;
  label: string;
}

/**
 * Get current user's profile
 */
export const getProfile = async (token: string): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE}/profile/me/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
};

/**
 * Update user's timezone
 */
export const updateTimezone = async (
  token: string,
  timezone: string
): Promise<{ timezone: string }> => {
  const response = await fetch(`${API_BASE}/profile/timezone/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ timezone }),
  });

  if (!response.ok) {
    throw new Error('Failed to update timezone');
  }

  return response.json();
};

/**
 * Get all available timezones
 */
export const getTimezones = async (token: string): Promise<Timezone[]> => {
  const response = await fetch(`${API_BASE}/profile/timezones/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch timezones');
  }

  return response.json();
};

/**
 * Update user profile
 */
export const updateProfile = async (
  token: string,
  data: Partial<UserProfile>
): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE}/profile/me/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  return response.json();
};

/**
 * Upload user's avatar
 */
export const uploadAvatar = async (
  token: string,
  file: File
): Promise<{ success: boolean; profile_picture_url: string }> => {
  const formData = new FormData();
  formData.append('profile_picture', file);

  const response = await fetch(`${API_BASE}/profile/avatar/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.profile_picture?.[0] || 'Failed to upload avatar');
  }

  return response.json();
};

/**
 * Set password for user (for Google sign-in users)
 */
export const setPassword = async (
  token: string,
  newPassword: string
): Promise<{ detail: string }> => {
  const response = await fetch(`${API_BASE}/profile/set-password/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ new_password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to set password');
  }

  return response.json();
};

/**
 * Change password for user
 */
export const changePassword = async (
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ detail: string }> => {
  const response = await fetch(`${API_BASE}/profile/change-password/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to change password');
  }

  return response.json();
};

export interface TeacherProfile {
  id: number;
  bio?: string;
  qualifications: string;
  hourly_rate: number;
  experience_level: string;
  subjects: string;
  languages: string;
  is_verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rating: number;
  total_reviews: number;
  students_count: number;
  lessons_completed: number;
}

/**
 * Get current user's teacher profile
 */
export const getTeacherProfile = async (token: string): Promise<TeacherProfile> => {
  const response = await fetch(`${API_BASE}/teacher/me/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch teacher profile');
  }

  return response.json();
};

/**
 * Create teacher profile (Onboarding)
 */
export const createTeacherProfile = async (
  token: string,
  data: Partial<TeacherProfile>
): Promise<TeacherProfile> => {
  const response = await fetch(`${API_BASE}/teacher/me/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create teacher profile');
  }

  return response.json();
};

/**
 * Update teacher profile
 */
export const updateTeacherProfile = async (
  token: string,
  data: Partial<TeacherProfile>
): Promise<TeacherProfile> => {
  const response = await fetch(`${API_BASE}/teacher/me/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update teacher profile');
  }

  return response.json();
};
