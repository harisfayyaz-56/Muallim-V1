import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Calendar, MessageSquare, BookOpen, Clock, Star, ExternalLink, ArrowRight, TrendingUp } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getProfile } from '../../api/profile';
import { getMyBookings } from '../../api/availability';
import { formatSlotTime, DEFAULT_TIMEZONE } from '../../utils/preferences';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userTimezone, setUserTimezone] = useState(DEFAULT_TIMEZONE);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [hoursLearned, setHoursLearned] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('muallim_access_token');
    if (!token) return;
    (async () => {
      try {
        const profile = await getProfile(token);
        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username;
        setUserName(name);
        const pic = (profile as any).profile_picture || (profile as any).profile_picture_url || null;
        if (pic) setUserAvatar(pic);
        const tz = profile.timezone || DEFAULT_TIMEZONE;
        setUserTimezone(tz);

        const bookings = await getMyBookings(token);
        const upcoming: any[] = [];
        const past: any[] = [];
        let completedCount = 0;
        let learnedMinutes = 0;
        const uniqueSubjects = new Set<string>();

        const now = new Date();
        bookings.forEach((b: any) => {
          const sDate = new Date(b.scheduled_date);
          const isUpcoming = sDate >= now;
          const session = {
            id: String(b.id),
            teacherId: String(b.teacher_id_read || b.teacher_id),
            teacherName: b.teacher_name,
            teacherAvatar: b.teacher_avatar,
            studentName: b.student_name,
            studentAvatar: b.student_avatar,
            subject: b.subject,
            date: b.scheduled_date,
            time: formatSlotTime(b.scheduled_date, tz),
            duration: b.duration_minutes,
            status: isUpcoming ? 'upcoming' : b.status,
            totalPaid: Number(b.amount),
            meetingLink: b.meeting_link,
          };

          if (isUpcoming && (b.status === 'confirmed' || b.status === 'pending')) {
            upcoming.push(session);
          } else {
            if (b.status === 'confirmed' || b.status === 'completed') {
              session.status = 'completed';
              completedCount += 1;
              learnedMinutes += b.duration_minutes;
            } else {
              session.status = 'cancelled';
            }
            past.push(session);
          }
          uniqueSubjects.add(b.subject);
        });

        setUpcomingSessions(upcoming);
        setPastSessions(past);
        setCompletedSessionsCount(completedCount);
        setHoursLearned(Math.round(learnedMinutes / 60));
        setSubjectsCount(uniqueSubjects.size);
      } catch (err) {
        console.error('StudentDashboard: failed to load profile or bookings', err);
      }
    })();
  }, []);

  const sessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions;

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar isLoggedIn />

      <div className="pt-16">
        {/* Header */}
        <div className="bg-[#0D1B2A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-4">
              {userAvatar ? (
                <img src={userAvatar} alt="Profile" className="w-14 h-14 rounded-xl object-cover border-2 border-[#C8962A]/30" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#C8962A] flex items-center justify-center border-2 border-[#C8962A]/30 text-white text-xl" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700 }}>
                  {userName ? userName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              <div>
                <p className="text-[#9CA3AF] text-sm">{getGreeting()},</p>
                <h1 className="text-white" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem' }}>
                  {userName || 'Student'}
                </h1>
              </div>
              <div className="ml-auto">
                <Link to="/search" className="inline-flex items-center gap-2 bg-[#C8962A] hover:bg-[#b8851f] text-white px-5 py-2.5 rounded-xl text-sm transition-colors" style={{ fontWeight: 600 }}>
                  Find a Teacher <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: BookOpen, label: 'Sessions Completed', value: String(completedSessionsCount), color: '#C8962A' },
              { icon: Clock, label: 'Hours Learned', value: `${hoursLearned}h`, color: '#0D1B2A' },
              { icon: Star, label: 'Avg. Session Rating', value: '4.9', color: '#C8962A' },
              { icon: TrendingUp, label: 'Subjects Studied', value: String(subjectsCount), color: '#0D1B2A' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-5 border border-[rgba(13,27,42,0.06)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                </div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem', color: '#0D1B2A' }}>
                  {stat.value}
                </div>
                <p className="text-[#9CA3AF] text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.1rem', color: '#0D1B2A' }}>
                    My Sessions
                  </h2>
                  <div className="flex bg-[#F8F6F1] rounded-xl p-1 gap-1">
                    {(['upcoming', 'past'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${activeTab === tab ? 'bg-white text-[#0D1B2A] shadow-sm' : 'text-[#9CA3AF]'}`}
                        style={{ fontWeight: activeTab === tab ? 600 : 400 }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {sessions.length === 0 ? (
                  <div className="py-12 text-center">
                    <Calendar className="w-10 h-10 text-[#E5E0D8] mx-auto mb-3" />
                    <p className="text-[#9CA3AF] text-sm">No {activeTab} sessions</p>
                    <Link to="/search" className="mt-3 inline-block text-[#C8962A] text-sm hover:underline">
                      Find a teacher to book with →
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-[rgba(13,27,42,0.06)]">
                    {sessions.map(session => (
                      <div key={session.id} className="px-5 py-4 hover:bg-[#F8F6F1]/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <img src={session.teacherAvatar} alt={session.teacherName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{session.subject}</p>
                                <p className="text-[#9CA3AF] text-xs mt-0.5">with {session.teacherName}</p>
                              </div>
                              <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs ${
                                session.status === 'upcoming' ? 'bg-emerald-100 text-emerald-700' :
                                session.status === 'completed' ? 'bg-[#F8F6F1] text-[#6B7280]' :
                                'bg-red-100 text-red-600'
                              }`} style={{ fontWeight: 500 }}>
                                {session.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <span className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(session.date).toLocaleDateString('en-AE', { timeZone: userTimezone, weekday: 'short', day: 'numeric', month: 'short' })} at {session.time}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                                <Clock className="w-3.5 h-3.5" />
                                {session.duration} min
                              </span>
                              <span className="text-xs text-[#C8962A]" style={{ fontWeight: 600 }}>
                                AED {session.totalPaid}
                              </span>
                            </div>
                            {session.status === 'upcoming' && session.meetingLink && (
                              <a
                                href={session.meetingLink}
                                className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#C8962A] hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Join Session Link
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Notifications */}
              <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] p-5">
                <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1rem', color: '#0D1B2A' }} className="mb-4">
                  Messages
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Mohammed Al-Rashidi', msg: 'Great session today! Review chapter 6 for next time.', time: '2h ago', unread: true },
                    { name: 'Sarah Chen', msg: 'Here\'s the GitHub repo for Wednesday\'s session.', time: '4h ago', unread: false },
                  ].map((n, i) => (
                    <Link key={i} to="/messages" className="flex items-start gap-3 hover:bg-[#F8F6F1] rounded-lg p-2 -mx-2 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#0D1B2A] flex items-center justify-center shrink-0 text-white text-xs" style={{ fontWeight: 700 }}>
                        {n.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[#0D1B2A] text-xs" style={{ fontWeight: 600 }}>{n.name}</p>
                          <span className="text-[#9CA3AF] text-xs">{n.time}</span>
                        </div>
                        <p className="text-[#9CA3AF] text-xs truncate mt-0.5">{n.msg}</p>
                      </div>
                      {n.unread && <div className="w-2 h-2 bg-[#C8962A] rounded-full shrink-0 mt-1.5" />}
                    </Link>
                  ))}
                </div>
                <Link to="/messages" className="block text-center text-xs text-[#C8962A] hover:underline mt-3">
                  View all messages →
                </Link>
              </div>

              {/* Suggested Teachers */}
              <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] p-5">
                <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1rem', color: '#0D1B2A' }} className="mb-4">
                  You might like
                </h3>
                <div className="space-y-3">
                  {[].slice(2, 4).map(t => (
                    <Link key={t.id} to={`/teacher/${t.id}`} className="flex items-center gap-3 hover:bg-[#F8F6F1] rounded-xl p-2.5 -mx-2.5 transition-colors group">
                      <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0D1B2A] text-sm group-hover:text-[#C8962A] transition-colors truncate" style={{ fontWeight: 600 }}>
                          {t.name}
                        </p>
                        <p className="text-[#9CA3AF] text-xs">{t.skills[0]} · AED {t.hourlyRate}/h</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Star className="w-3 h-3 fill-[#C8962A] text-[#C8962A]" />
                        <span className="text-xs text-[#0D1B2A]">{t.rating}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link to="/search" className="block text-center text-xs text-[#C8962A] hover:underline mt-3">
                  Browse all teachers →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
