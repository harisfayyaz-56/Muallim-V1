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

export const TEACHERS: Teacher[] = [
  {
    id: 't1',
    name: 'Mohammed Al-Rashidi',
    headline: 'Senior Mathematics & Physics Tutor — 12 Years Experience',
    bio: 'I hold a Masters degree in Applied Mathematics from the University of Dubai and have been tutoring students across the UAE for over 12 years. My approach focuses on building genuine conceptual understanding rather than rote memorization. I have helped over 300 students achieve top scores in IGCSE, A-Levels, and university entrance exams.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format',
    location: 'Dubai, UAE',
    timezone: 'Asia/Dubai',
    skills: ['Mathematics', 'Physics', 'Statistics'],
    tags: ['IGCSE', 'A-Level', 'University', 'SAT Math'],
    hourlyRate: 180,
    rating: 4.9,
    reviewsCount: 127,
    studentsCount: 89,
    sessionsCount: 312,
    status: 'approved',
    languages: ['English', 'Arabic'],
    joinedDate: '2022-03-15',
    responseTime: 'Within 2 hours',
  },
  {
    id: 't2',
    name: 'Sarah Chen',
    headline: 'Full-Stack Developer & Programming Mentor',
    bio: 'Software engineer with 8 years at leading Dubai tech firms. I specialize in Python, JavaScript, and web development. Whether you\'re a complete beginner or looking to advance your career, I tailor every session to your goals and learning style. I\'ve mentored over 150 developers, many of whom now work at top tech companies in the UAE.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&auto=format',
    location: 'Dubai, UAE',
    timezone: 'Asia/Dubai',
    skills: ['Python', 'JavaScript', 'React', 'Node.js'],
    tags: ['Web Development', 'Beginner Friendly', 'Career Prep', 'Data Science'],
    hourlyRate: 220,
    rating: 4.8,
    reviewsCount: 94,
    studentsCount: 67,
    sessionsCount: 241,
    status: 'approved',
    languages: ['English', 'Mandarin'],
    joinedDate: '2022-06-20',
    responseTime: 'Within 1 hour',
  },
  {
    id: 't3',
    name: 'Fatima Al-Zaabi',
    headline: 'Arabic Language & Literature Specialist',
    bio: 'Native Arabic speaker and certified language instructor with a degree in Arabic Literature from UAE University. I teach Modern Standard Arabic, Gulf dialect, and Arabic for academic purposes. My students include expats learning Arabic for work, children of Arab families maintaining their heritage, and professionals preparing for Arabic language certifications.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&auto=format',
    location: 'Abu Dhabi, UAE',
    timezone: 'Asia/Dubai',
    skills: ['Arabic Language', 'Arabic Literature', 'Quran Reading'],
    tags: ['MSA', 'Gulf Dialect', 'Beginners', 'Business Arabic'],
    hourlyRate: 120,
    rating: 5.0,
    reviewsCount: 83,
    studentsCount: 56,
    sessionsCount: 198,
    status: 'approved',
    languages: ['Arabic', 'English'],
    joinedDate: '2023-01-10',
    responseTime: 'Within 3 hours',
  },
  {
    id: 't4',
    name: 'James Wilson',
    headline: 'IELTS & Business English Coach — Former British Council',
    bio: 'Former British Council examiner and certified CELTA instructor. I specialize in IELTS preparation (Band 7+ guarantee for committed students), Business English for professionals, and academic writing. Having lived in Dubai for 9 years, I understand the specific English challenges faced by professionals in the UAE market.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format',
    location: 'Dubai, UAE',
    timezone: 'Asia/Dubai',
    skills: ['English', 'IELTS', 'Business English', 'Academic Writing'],
    tags: ['IELTS', 'Business English', 'Exam Prep', 'Professional'],
    hourlyRate: 200,
    rating: 4.9,
    reviewsCount: 156,
    studentsCount: 112,
    sessionsCount: 389,
    status: 'approved',
    languages: ['English'],
    joinedDate: '2021-11-05',
    responseTime: 'Same day',
  },
  {
    id: 't5',
    name: 'Priya Sharma',
    headline: 'MBA Tutor & Business Strategy Coach — INSEAD Alumni',
    bio: 'INSEAD MBA graduate with 10 years in management consulting at McKinsey Dubai. I coach students preparing for MBA programs, CFA exams, and professionals looking to strengthen their business acumen. My sessions are highly structured, practical, and focused on real business scenarios from the MENA region.',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&auto=format',
    location: 'Dubai, UAE',
    timezone: 'Asia/Dubai',
    skills: ['Business Strategy', 'Finance', 'MBA Preparation', 'CFA'],
    tags: ['MBA', 'CFA', 'Consulting', 'GMAT'],
    hourlyRate: 280,
    rating: 4.8,
    reviewsCount: 72,
    studentsCount: 48,
    sessionsCount: 165,
    status: 'approved',
    languages: ['English', 'Hindi'],
    joinedDate: '2022-09-15',
    responseTime: 'Within 4 hours',
  },
  {
    id: 't6',
    name: 'Ahmed Al-Mansoori',
    headline: 'Quran & Islamic Studies Teacher — Al-Azhar Certified',
    bio: 'Al-Azhar University certified instructor with ijaza (chain of transmission) in Quran recitation. I teach Tajweed rules, Quran memorization (Hifz), and foundational Islamic studies. I welcome students of all ages and backgrounds, from young children beginning their journey to adults seeking to improve their recitation.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&auto=format',
    location: 'Sharjah, UAE',
    timezone: 'Asia/Dubai',
    skills: ['Quran', 'Tajweed', 'Islamic Studies', 'Arabic'],
    tags: ['Hifz', 'Tajweed', 'All Ages', 'Beginner Friendly'],
    hourlyRate: 90,
    rating: 5.0,
    reviewsCount: 211,
    studentsCount: 143,
    sessionsCount: 521,
    status: 'approved',
    languages: ['Arabic', 'English'],
    joinedDate: '2021-08-20',
    responseTime: 'Within 2 hours',
  },
];

export const REVIEWS: Review[] = [
  {
    id: 'r1',
    studentName: 'Omar Hassan',
    studentAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&auto=format',
    rating: 5,
    comment: 'Mohammed is exceptional. He breaks down complex calculus concepts in a way that finally made everything click for me. I went from a C to an A in my A-Level Maths thanks to his patient, methodical approach.',
    date: '2024-11-12',
    subject: 'Mathematics',
  },
  {
    id: 'r2',
    studentName: 'Aisha Khalil',
    studentAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&auto=format',
    rating: 5,
    comment: 'Best tutoring experience I\'ve had. Sarah\'s industry experience really shows — she doesn\'t just teach syntax, she teaches you to think like a developer. Landed my first dev job after 6 months of sessions.',
    date: '2024-12-03',
    subject: 'Programming',
  },
  {
    id: 'r3',
    studentName: 'Thomas Reed',
    studentAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop&auto=format',
    rating: 5,
    comment: 'Fatima is incredibly patient and talented. As an expat learning Arabic from zero, I was nervous, but she made every session enjoyable. Three months in and I can hold basic conversations in Gulf dialect.',
    date: '2024-12-15',
    subject: 'Arabic Language',
  },
  {
    id: 'r4',
    studentName: 'Nour Al-Farsi',
    studentAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=100&h=100&fit=crop&auto=format',
    rating: 5,
    comment: 'James helped me achieve Band 7.5 in IELTS on my second attempt. His targeted feedback on my writing and speaking was exactly what I needed. Highly recommend for anyone serious about their English goals.',
    date: '2025-01-08',
    subject: 'IELTS',
  },
];

export const UPCOMING_SESSIONS: Session[] = [
  {
    id: 's1',
    teacherId: 't1',
    teacherName: 'Mohammed Al-Rashidi',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format',
    studentName: 'You',
    studentAvatar: '',
    subject: 'Calculus — Integration by Parts',
    date: '2025-01-20',
    time: '18:00',
    duration: 60,
    status: 'upcoming',
    totalPaid: 180,
    meetingLink: 'https://meet.muallim.app/session/abc123',
  },
  {
    id: 's2',
    teacherId: 't2',
    teacherName: 'Sarah Chen',
    teacherAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format',
    studentName: 'You',
    studentAvatar: '',
    subject: 'React Hooks — useEffect & Custom Hooks',
    date: '2025-01-22',
    time: '15:30',
    duration: 90,
    status: 'upcoming',
    totalPaid: 330,
    meetingLink: 'https://meet.muallim.app/session/def456',
  },
];

export const PAST_SESSIONS: Session[] = [
  {
    id: 's3',
    teacherId: 't1',
    teacherName: 'Mohammed Al-Rashidi',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format',
    studentName: 'You',
    studentAvatar: '',
    subject: 'Differentiation & Chain Rule',
    date: '2025-01-14',
    time: '18:00',
    duration: 60,
    status: 'completed',
    totalPaid: 180,
  },
  {
    id: 's4',
    teacherId: 't4',
    teacherName: 'James Wilson',
    teacherAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&auto=format',
    studentName: 'You',
    studentAvatar: '',
    subject: 'IELTS Writing Task 2 — Practice Essays',
    date: '2025-01-11',
    time: '10:00',
    duration: 60,
    status: 'completed',
    totalPaid: 200,
  },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participantId: 't1',
    participantName: 'Mohammed Al-Rashidi',
    participantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format',
    participantRole: 'teacher',
    lastMessage: 'Great session today! For next time, please review Chapter 6 on integration techniques.',
    lastMessageTime: '2025-01-14T19:30:00',
    unreadCount: 1,
    messages: [
      {
        id: 'm1',
        senderId: 't1',
        senderName: 'Mohammed Al-Rashidi',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format',
        content: 'Assalamu alaikum! Looking forward to our session on Monday. Do you have any specific topics you\'d like to focus on?',
        timestamp: '2025-01-13T14:00:00',
        isRead: true,
      },
      {
        id: 'm2',
        senderId: 'me',
        senderName: 'You',
        senderAvatar: '',
        content: 'Wa alaikum assalam! I\'d really like to work through integration by parts — I keep getting confused with the LIATE rule.',
        timestamp: '2025-01-13T14:25:00',
        isRead: true,
      },
      {
        id: 'm3',
        senderId: 't1',
        senderName: 'Mohammed Al-Rashidi',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format',
        content: 'Perfect choice! I\'ll prepare some excellent practice problems. We\'ll go from first principles so the rule becomes intuitive rather than memorized.',
        timestamp: '2025-01-13T14:40:00',
        isRead: true,
      },
      {
        id: 'm4',
        senderId: 't1',
        senderName: 'Mohammed Al-Rashidi',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format',
        content: 'Great session today! For next time, please review Chapter 6 on integration techniques.',
        timestamp: '2025-01-14T19:30:00',
        isRead: false,
      },
    ],
  },
  {
    id: 'c2',
    participantId: 't2',
    participantName: 'Sarah Chen',
    participantAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format',
    participantRole: 'teacher',
    lastMessage: 'Here\'s the GitHub repo with the exercise files for Wednesday\'s session.',
    lastMessageTime: '2025-01-15T11:00:00',
    unreadCount: 0,
    messages: [
      {
        id: 'm5',
        senderId: 't2',
        senderName: 'Sarah Chen',
        senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format',
        content: 'Hi! I\'ve put together a comprehensive React Hooks curriculum for you. We\'ll start with useState/useEffect, then move to custom hooks and performance optimization.',
        timestamp: '2025-01-15T10:00:00',
        isRead: true,
      },
      {
        id: 'm6',
        senderId: 't2',
        senderName: 'Sarah Chen',
        senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format',
        content: 'Here\'s the GitHub repo with the exercise files for Wednesday\'s session.',
        timestamp: '2025-01-15T11:00:00',
        isRead: true,
      },
    ],
  },
];

export const AVAILABILITY = {
  monday: ['09:00', '10:00', '14:00', '15:00', '16:00', '18:00', '19:00'],
  tuesday: ['09:00', '10:00', '14:00', '15:00', '18:00', '19:00'],
  wednesday: ['09:00', '10:00', '14:00', '15:00', '16:00'],
  thursday: ['14:00', '15:00', '16:00', '18:00', '19:00', '20:00'],
  friday: [],
  saturday: ['10:00', '11:00', '14:00', '15:00'],
  sunday: ['10:00', '11:00', '14:00', '15:00', '16:00'],
};

export const PLATFORM_FEE_PERCENT = 12;

export const ADMIN_TEACHER_APPLICATIONS = [
  {
    id: 'app1',
    teacherId: 't7',
    name: 'Khalid Al-Hammadi',
    email: 'khalid@example.com',
    headline: 'Chemical Engineering Tutor — PhD Candidate',
    skills: ['Chemistry', 'Chemical Engineering', 'Thermodynamics'],
    location: 'Abu Dhabi, UAE',
    hourlyRate: 160,
    submittedDate: '2025-01-14',
    status: 'pending',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&auto=format',
  },
  {
    id: 'app2',
    teacherId: 't8',
    name: 'Elena Petrov',
    email: 'elena@example.com',
    headline: 'Piano & Music Theory — 15 Years Teaching',
    skills: ['Piano', 'Music Theory', 'Classical Music'],
    location: 'Dubai, UAE',
    hourlyRate: 150,
    submittedDate: '2025-01-13',
    status: 'pending',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=100&h=100&fit=crop&auto=format',
  },
  {
    id: 'app3',
    teacherId: 't9',
    name: 'Rania Mansour',
    email: 'rania@example.com',
    headline: 'Biology & Chemistry — IB & IGCSE Specialist',
    skills: ['Biology', 'Chemistry', 'IB Diploma'],
    location: 'Dubai, UAE',
    hourlyRate: 170,
    submittedDate: '2025-01-12',
    status: 'rejected',
    rejectionReason: 'Profile bio is too brief. Please provide more details about your teaching methodology and qualifications.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&auto=format',
  },
];
