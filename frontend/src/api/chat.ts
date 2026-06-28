import { apiRequest } from './client';

const API_BASE = '/api';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantRole: 'teacher' | 'student';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

/**
 * Fetch all threads for the logged-in user
 */
export async function getThreads(token: string): Promise<Conversation[]> {
  const response = await apiRequest(`${API_BASE}/chat/threads/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }, token);

  if (!response.ok) {
    throw new Error('Failed to fetch chat threads');
  }

  return response.json();
}

/**
 * Start or reopen a thread with a teacher
 */
export async function startThread(token: string, teacherId: string): Promise<Conversation> {
  const response = await apiRequest(`${API_BASE}/chat/threads/start/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ teacher_id: teacherId }),
  }, token);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to start conversation thread');
  }

  return response.json();
}

/**
 * Send a message within a thread
 */
export async function sendMessage(
  token: string,
  threadId: string,
  content: string
): Promise<Message> {
  const response = await apiRequest(`${API_BASE}/chat/threads/${threadId}/send_message/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  }, token);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to send message');
  }

  return response.json();
}

/**
 * Mark all messages in a thread as read
 */
export async function markThreadRead(token: string, threadId: string): Promise<{ status: string }> {
  const response = await apiRequest(`${API_BASE}/chat/threads/${threadId}/mark_read/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  }, token);

  if (!response.ok) {
    throw new Error('Failed to mark thread as read');
  }

  return response.json();
}
