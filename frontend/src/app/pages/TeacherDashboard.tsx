import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Calendar, DollarSign, Users, Clock, Star, Settings, ExternalLink, CheckCircle, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getProfile, getTeacherProfile } from '../../api/profile';
import { getMyAvailability, getMyBookings } from '../../api/availability';
import { DAYS_SHORT, TIME_SLOTS, EMPTY_GRID, countWeeklySlots } from '../utils/availability';
import { getTimezoneAbbr, formatSlotTime, DEFAULT_TIMEZONE } from '../../utils/preferences';

const DAYS = DAYS_SHORT;

export function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'availability'>('overview');
  const [teacherName, setTeacherName] = useState('Teacher');
  const [teacherAvatar, setTeacherAvatar] = useState('https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&auto=format');
  const [profileStatus, setProfileStatus] = useState<'approved' | 'pending' | 'rejected'>('pending');
  const [availabilityGrid, setAvailabilityGrid] = useState<Record<string, string[]>>({ ...EMPTY_GRID });
  const [teacherTimezone, setTeacherTimezone] = useState(DEFAULT_TIMEZONE);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [earningsThisMonth, setEarningsThisMonth] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('muallim_access_token');
    if (!token) return;
    (async () => {
      let tz = DEFAULT_TIMEZONE;
      try {
        const profile = await getProfile(token);
        if (profile) {
          setTeacherName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username);
          const pic = (profile as any).profile_picture || (profile as any).profile_picture_url || null;
          if (pic) setTeacherAvatar(pic);
          if (profile.timezone) {
            tz = profile.timezone;
            setTeacherTimezone(profile.timezone);
          }
        }
      } catch (err) {
        console.error('TeacherDashboard failed to load profile:', err);
      }

      try {
        const tProfile = await getTeacherProfile(token);
        if (tProfile) {
          setProfileStatus(tProfile.status || 'pending');
        }
      } catch (err) {
        setProfileStatus('pending');
      }

      try {
        const avail = await getMyAvailability(token);
        if (avail.grid) setAvailabilityGrid(avail.grid);
        if (avail.timezone) {
          tz = avail.timezone;
          setTeacherTimezone(avail.timezone);
        }
      } catch {
        // No availability set yet
      }

      try {
        const bookings = await getMyBookings(token, 'teacher');
        const upcoming: any[] = [];
        const past: any[] = [];
        let totalEarnings = 0;
        const activeStudents = new Set<string>();

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
            date: new Date(b.scheduled_date).toLocaleDateString('en-AE', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }),
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
              totalEarnings += Number(b.amount);
              activeStudents.add(b.student_name);
            } else {
              session.status = 'cancelled';
            }
            past.push(session);
          }
        });

        setUpcomingSessions(upcoming);
        setPastSessions(past);
        setEarningsThisMonth(totalEarnings);
        setStudentCount(activeStudents.size);
      } catch (err) {
        console.error('TeacherDashboard failed to load bookings:', err);
      }
    })();
  }, []);

  const earningsData = [
    { month: 'Sep', amount: 2400 },
    { month: 'Oct', amount: 3100 },
    { month: 'Nov', amount: 2800 },
    { month: 'Dec', amount: 3600 },
    { month: 'Jan', amount: 1800 },
  ];
  const maxEarnings = Math.max(...earningsData.map(d => d.amount));

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar isLoggedIn isTeacher />

      <div className="pt-16">
        {/* Header */}
        <div className="bg-[#0D1B2A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <img src={teacherAvatar} alt={teacherName} className="w-14 h-14 rounded-xl object-cover border-2 border-[#C8962A]/30" />
                <div>
                  <p className="text-[#9CA3AF] text-sm">Teacher Dashboard</p>
                  <h1 className="text-white" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem' }}>
                    {teacherName}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {profileStatus === 'approved' ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/15 border border-emerald-500/20 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>Profile Approved</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#C8962A]/15 border border-[#C8962A]/20 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-[#C8962A]" />
                    <span className="text-[#C8962A] text-xs" style={{ fontWeight: 600 }}>Pending Review</span>
                  </div>
                )}
                <Link to="/settings/teacher" className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white rounded-xl text-xs hover:bg-white/20 transition-colors">
                  <Settings className="w-4 h-4" /> Edit Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 border-b border-white/10">
              {(['overview', 'sessions', 'availability'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm capitalize transition-colors duration-150 border-b-2 -mb-px ${
                    activeTab === tab ? 'border-[#C8962A] text-white' : 'border-transparent text-white/50 hover:text-white/80'
                  }`}
                  style={{ fontWeight: activeTab === tab ? 600 : 400 }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: DollarSign, label: 'Earnings', value: `AED ${earningsThisMonth}`, sub: 'All-time earnings', color: '#C8962A' },
                  { icon: Users, label: 'Active Students', value: String(studentCount), sub: 'Unique students', color: '#0D1B2A' },
                  { icon: Calendar, label: 'Upcoming Sessions', value: String(upcomingSessions.length), sub: upcomingSessions.length > 0 ? `Next: ${upcomingSessions[0].date}` : 'No upcoming sessions', color: '#C8962A' },
                  { icon: Star, label: 'Rating', value: '5.0', sub: 'Based on your sessions', color: '#0D1B2A' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl p-5 border border-[rgba(13,27,42,0.06)]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                        <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.5rem', color: '#0D1B2A' }}>
                      {stat.value}
                    </div>
                    <p className="text-[#9CA3AF] text-xs mt-0.5">{stat.label}</p>
                    <p className="text-emerald-600 text-xs mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Earnings Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1rem', color: '#0D1B2A' }}>
                      Monthly Earnings
                    </h3>
                    <div className="flex items-center gap-1 text-emerald-600 text-xs">
                      <TrendingUp className="w-3.5 h-3.5" /> AED 13,700 total
                    </div>
                  </div>
                  <div className="flex items-end gap-4 h-36">
                    {earningsData.map(d => (
                      <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                        <div className="text-[#9CA3AF] text-xs">AED {(d.amount/1000).toFixed(1)}k</div>
                        <div
                          className="w-full rounded-t-lg transition-all"
                          style={{
                            height: `${(d.amount / maxEarnings) * 80}%`,
                            background: d.month === 'Jan' ? '#C8962A' : '#E5E0D8',
                          }}
                        />
                        <div className="text-[#9CA3AF] text-xs">{d.month}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Sessions */}
                <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] p-5">
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1rem', color: '#0D1B2A' }} className="mb-4">
                    Next Sessions
                  </h3>
                  <div className="space-y-3">
                    {upcomingSessions.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF]">No upcoming sessions</p>
                    ) : (
                      upcomingSessions.slice(0, 3).map(s => (
                        <div key={s.id} className="bg-[#F8F6F1] rounded-xl p-3">
                          <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{s.subject}</p>
                          <p className="text-[#9CA3AF] text-xs mt-0.5">Student: {s.studentName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[#C8962A] text-xs">{s.date} · {s.time}</span>
                            {s.meetingLink && (
                              <a href={s.meetingLink} className="text-[#9CA3AF] hover:text-[#C8962A] transition-colors" target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button onClick={() => setActiveTab('sessions')} className="block w-full text-center text-xs text-[#C8962A] hover:underline mt-3">
                    View all sessions →
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[rgba(13,27,42,0.06)]">
                <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.1rem', color: '#0D1B2A' }}>All Sessions</h3>
              </div>
              <div className="divide-y divide-[rgba(13,27,42,0.06)]">
                {[...upcomingSessions, ...pastSessions].length === 0 ? (
                  <div className="px-5 py-8 text-center text-[#9CA3AF] text-sm">
                    No sessions found
                  </div>
                ) : (
                  [...upcomingSessions, ...pastSessions].map(session => (
                    <div key={session.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#F8F6F1]/50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-[#F8F6F1] flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-[#C8962A]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{session.subject}</p>
                        <p className="text-[#9CA3AF] text-xs mt-0.5">{session.date} · {session.time} · {session.duration}min · Student: {session.studentName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#C8962A] text-sm" style={{ fontWeight: 600 }}>AED {session.totalPaid}</p>
                        <span className={`text-xs ${session.status === 'upcoming' ? 'text-emerald-600' : 'text-[#9CA3AF]'}`}>
                          {session.status}
                        </span>
                      </div>
                      {session.status === 'upcoming' && session.meetingLink && (
                        <a href={session.meetingLink} className="p-2 hover:bg-[#F8F6F1] rounded-lg transition-colors" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 text-[#9CA3AF]" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[rgba(13,27,42,0.06)] flex items-center justify-between">
                <div>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.1rem', color: '#0D1B2A' }}>Weekly Availability</h3>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">
                    All times in {getTimezoneAbbr(teacherTimezone)} · {countWeeklySlots(availabilityGrid)} open slots
                  </p>
                </div>
                <Link to="/settings/teacher" className="flex items-center gap-1.5 text-xs text-[#C8962A] hover:underline">
                  <Settings className="w-3.5 h-3.5" /> Manage in Settings
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr>
                      <th className="w-20 px-4 py-3 text-left text-xs text-[#9CA3AF]">Time ({getTimezoneAbbr(teacherTimezone)})</th>
                      {DAYS.map(d => (
                        <th key={d} className="px-2 py-3 text-center text-xs text-[#0D1B2A]" style={{ fontWeight: 600 }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map(time => (
                      <tr key={time} className="border-t border-[rgba(13,27,42,0.04)]">
                        <td className="px-4 py-2 text-xs text-[#9CA3AF]">{time}</td>
                        {DAYS.map(day => {
                          const available = (availabilityGrid[day] || []).includes(time);
                          return (
                            <td key={day} className="px-2 py-2 text-center">
                              <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center cursor-pointer transition-colors ${
                                available ? 'bg-[#C8962A]/15 border border-[#C8962A]/30 hover:bg-[#C8962A]/25' : 'bg-[#F8F6F1] hover:bg-[#F0ECE4]'
                              }`}>
                                {available && <div className="w-2.5 h-2.5 bg-[#C8962A] rounded-full" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-[#F8F6F1] border-t border-[rgba(13,27,42,0.06)] flex items-center gap-4 text-xs text-[#9CA3AF]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#C8962A]/15 border border-[#C8962A]/30" />
                  Available
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#F8F6F1]" />
                  Unavailable
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
