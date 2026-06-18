export interface Teacher {
  id: string;
  name: string;
  headline: string;
  bio: string;
  avatar: string;
  location: string;
  timezone: string;
  skills: string[];
  tags: string[];
  hourlyRate: number;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  sessionsCount: number;
  status: 'pending' | 'approved' | 'rejected';
  languages: string[];
  joinedDate: string;
  responseTime: string;
}

export interface Review {
  id: string;
  studentName: string;
  studentAvatar: string;
  rating: number;
  comment: string;
  date: string;
  subject: string;
}

export interface Session {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string;
  studentName: string;
  studentAvatar: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  totalPaid: number;
  meetingLink?: string;
}

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

export const CATEGORIES = [
  { id: 'mathematics', label: 'Mathematics', icon: '∑', count: 48 },
  { id: 'programming', label: 'Programming', icon: '</>', count: 62 },
  { id: 'arabic', label: 'Arabic Language', icon: 'ع', count: 35 },
  { id: 'english', label: 'English', icon: 'Aa', count: 54 },
  { id: 'business', label: 'Business & Finance', icon: '📊', count: 29 },
  { id: 'physics', label: 'Physics', icon: '⚛', count: 31 },
  { id: 'quran', label: 'Quran & Islamic Studies', icon: '☽', count: 22 },
  { id: 'music', label: 'Music', icon: '♪', count: 18 },
];

export const PLATFORM_FEE_PERCENT = 12;

export const REVIEWS: Review[] = [
  {
    id: '1',
    studentName: 'Ahmed Ali',
    studentAvatar: 'https://i.pravatar.cc/150?u=ahmed',
    rating: 5,
    comment: 'Excellent teacher! Very patient and knowledgeable.',
    date: '2023-10-15',
    subject: 'Mathematics'
  },
  {
    id: '2',
    studentName: 'Sarah Smith',
    studentAvatar: 'https://i.pravatar.cc/150?u=sarah',
    rating: 4,
    comment: 'Great sessions, helped me understand complex topics easily.',
    date: '2023-11-02',
    subject: 'Physics'
  }
];

export const UPCOMING_SESSIONS: Session[] = [];
export const PAST_SESSIONS: Session[] = [];
export const CONVERSATIONS: Conversation[] = [];
