const API_URL = 'http://localhost:8000/api';

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  uid: string;
  token: string;
}

export interface PasswordResetPayload {
  email: string;
}

export interface PasswordResetConfirmPayload {
  uid: string;
  token: string;
  new_password: string;
  new_password2: string;
}

// Register a new user
export async function register(payload: RegisterPayload) {
  const res = await fetch(`${API_URL}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || data.email?.[0] || 'Registration failed');
  }
  return res.json();
}

// Verify email with uid and token
export async function verifyEmail(payload: VerifyEmailPayload) {
  const res = await fetch(`${API_URL}/auth/verify-email/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Email verification failed');
  }
  return res.json();
}

// Login with email and password
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || data.non_field_errors?.[0] || 'Login failed');
  }
  return res.json();
}

// Google sign-in with id_token
export async function googleAuth(idToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/google/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Google sign-in failed');
  }
  return res.json();
}

// Request password reset
export async function passwordResetRequest(payload: PasswordResetPayload) {
  const res = await fetch(`${API_URL}/auth/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || data.email?.[0] || 'Password reset request failed');
  }
  return res.json();
}

// Confirm password reset
export async function passwordResetConfirm(payload: PasswordResetConfirmPayload) {
  const res = await fetch(`${API_URL}/auth/password-reset-confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Password reset failed');
  }
  return res.json();
}

// Logout (blacklist refresh token)
export async function logout(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/logout/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Logout failed');
  }
  return res.json();
}

// Refresh access token
export async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Token refresh failed');
  }
  return res.json();
}
