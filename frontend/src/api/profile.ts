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
  has_password?: boolean;
  has_teacher_profile?: boolean;
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
  headline?: string;
  hourly_rate: number;
  experience_level: string;
  subjects: string;
  categories?: string;
  languages: string;
  tags?: string;
  is_verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  rating: number;
  total_reviews: number;
  students_count: number;
  lessons_completed: number;
  name?: string;
  email?: string;
  avatar?: string;
  location?: string;
  session_duration?: '30' | '60' | 'both';
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
    const error = await response.json().catch(() => ({}));
    if (error.detail) {
      throw new Error(error.detail);
    }
    const messages = Object.entries(error)
      .map(([field, msgs]) => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        const fieldMsgs = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
        return `${fieldName}: ${fieldMsgs}`;
      })
      .join(' | ');
    throw new Error(messages || 'Failed to create teacher profile');
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
    const error = await response.json().catch(() => ({}));
    if (error.detail) {
      throw new Error(error.detail);
    }
    const messages = Object.entries(error)
      .map(([field, msgs]) => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        const fieldMsgs = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
        return `${fieldName}: ${fieldMsgs}`;
      })
      .join(' | ');
    throw new Error(messages || 'Failed to update teacher profile');
  }

  return response.json();
};

/**
 * Get public list of approved teachers
 */
export const getTeachers = async (token?: string): Promise<TeacherProfile[]> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}/teacher/`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch teachers');
  }

  return response.json();
};

/**
 * Get a specific teacher's profile
 */
export const getTeacher = async (id: string, token?: string): Promise<TeacherProfile> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}/teacher/${id}/`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch teacher');
  }

  return response.json();
};

/**
 * Admin: Get all teacher applications
 */
export const getTeacherApplications = async (token: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/teacher/applications/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch teacher applications');
  }

  return response.json();
};

/**
 * Admin: Approve teacher
 */
export const approveTeacher = async (token: string, teacherId: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/teacher/${teacherId}/approve/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to approve teacher');
  }

  return response.json();
};

/**
 * Admin: Reject teacher
 */
export const rejectTeacher = async (
  token: string,
  teacherId: string,
  reason: string
): Promise<any> => {
  const response = await fetch(`${API_BASE}/teacher/${teacherId}/reject/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to reject teacher');
  }

  return response.json();
};

/**
 * Admin: Get all users
 */
export const getAdminUsers = async (token: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/profile/admin/users/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json();
};

/**
 * Admin: Suspend a user
 */
export const suspendUser = async (token: string, userId: number): Promise<any> => {
  const response = await fetch(`${API_BASE}/profile/admin/suspend/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to suspend user');
  }

  return response.json();
};

/**
 * Admin: Unsuspend a user
 */
export const unsuspendUser = async (token: string, userId: number): Promise<any> => {
  const response = await fetch(`${API_BASE}/profile/admin/unsuspend/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to unsuspend user');
  }

  return response.json();
};

/**
 * Delete current user account permanently
 */
export const deleteAccount = async (token: string): Promise<{ detail: string }> => {
  const response = await fetch(`${API_BASE}/profile/delete-account/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete account');
  }

  return response.json();
};
