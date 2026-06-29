import type { TeacherProfile } from '../../api/profile';
import defaultAvatar from '@/assets/def_avatar.avif';

export function mapProfileToTeacher(profile: TeacherProfile): any {
  return {
    id: String(profile.id),
    name: profile.name || 'Teacher',
    avatar: profile.avatar || defaultAvatar,
    status: profile.status,
    headline: profile.headline || profile.qualifications || '',
    bio: profile.bio || '',
    rating: profile.rating || 5.0,
    reviewsCount: profile.total_reviews || 0,
    location: profile.location || 'Dubai, UAE',
    languages: profile.tags ? profile.tags.split(',').map(t => t.trim()).filter(Boolean) : (profile.languages ? profile.languages.split(',').map(t => t.trim()).filter(Boolean) : ['English']),
    responseTime: 'Within an hour',
    skills: profile.categories ? profile.categories.split(',').map(s => s.trim()).filter(Boolean) : (profile.subjects ? profile.subjects.split(',').map(s => s.trim()).filter(Boolean) : []),
    tags: profile.tags ? profile.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    studentsCount: profile.students_count || 0,
    sessionsCount: profile.lessons_completed || 0,
    hourlyRate: Number(profile.hourly_rate),
    joinedDate: new Date().toISOString(),
    session_duration: profile.session_duration,
  };
}
