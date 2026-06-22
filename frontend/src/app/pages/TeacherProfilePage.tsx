import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Star, MapPin, Clock, MessageSquare, CheckCircle, Globe, Calendar, ChevronLeft, Share2, Heart, Loader2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { REVIEWS, PLATFORM_FEE_PERCENT } from '../data/mockData';
import { getTeacher, getProfile } from '../../api/profile';
import { getTeacherAvailability, getTeacherSlotsForDate } from '../../api/availability';
import { mapProfileToTeacher } from '../utils/mappers';
import { DAYS_FULL, DAY_LABELS } from '../utils/availability';
import { getTimezoneAbbr, DEFAULT_TIMEZONE } from '../../utils/preferences';

const DAYS = DAYS_FULL;

export function TeacherProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('monday');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [sessionDurations, setSessionDurations] = useState<number[]>([30, 60]);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'availability'>('about');
  const [slotsByDay, setSlotsByDay] = useState<Record<string, any[]>>({});
  const [viewerTimezone, setViewerTimezone] = useState(DEFAULT_TIMEZONE);
  const [teacherTimezone, setTeacherTimezone] = useState(DEFAULT_TIMEZONE);
  const [profileSlots, setProfileSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [daySlotCounts, setDaySlotCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'availability' || tab === 'about' || tab === 'reviews') {
      setActiveTab(tab as any);
      setTimeout(() => {
        document.getElementById('profile-tabs')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const today = new Date();
        const dayMap: Record<string, number> = {
          sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
        };
        const token = localStorage.getItem('muallim_access_token') || undefined;
        
        const promises = DAYS.map(async (day) => {
          const targetDayOfWeek = dayMap[day.toLowerCase()];
          if (targetDayOfWeek !== undefined) {
            const currentDayOfWeek = today.getDay();
            let diff = targetDayOfWeek - currentDayOfWeek;
            if (diff < 0) diff += 7;
            
            const targetDate = new Date();
            targetDate.setDate(today.getDate() + diff);
            const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
            
            const res = await getTeacherSlotsForDate(id, dateStr, duration, viewerTimezone || undefined, token);
            const availableCount = res.slots.filter((s: any) => s.available).length;
            return { day, count: availableCount };
          }
          return { day, count: 0 };
        });

        const results = await Promise.all(promises);
        const counts: Record<string, number> = {};
        results.forEach(({ day, count }) => {
          counts[day] = count;
        });
        setDaySlotCounts(counts);
      } catch (err) {
        console.error('Error fetching weekday slot counts:', err);
      }
    })();
  }, [id, duration, viewerTimezone]);

  useEffect(() => {
    if (!id || !selectedDay) return;
    (async () => {
      setSlotsLoading(true);
      try {
        const today = new Date();
        const dayMap: Record<string, number> = {
          sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
        };
        const targetDayOfWeek = dayMap[selectedDay.toLowerCase()];
        if (targetDayOfWeek !== undefined) {
          const currentDayOfWeek = today.getDay();
          let diff = targetDayOfWeek - currentDayOfWeek;
          if (diff < 0) diff += 7;
          
          const targetDate = new Date();
          targetDate.setDate(today.getDate() + diff);
          const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
          
          const token = localStorage.getItem('muallim_access_token') || undefined;
          const res = await getTeacherSlotsForDate(id, dateStr, duration, viewerTimezone || undefined, token);
          const availableList = res.slots.filter((s: any) => s.available).map((s: any) => s.time);
          setProfileSlots(availableList);
          setDaySlotCounts(prev => ({ ...prev, [selectedDay]: availableList.length }));
        }
      } catch (err) {
        console.error('Error fetching profile slots:', err);
        setProfileSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [id, selectedDay, duration, viewerTimezone]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const token = localStorage.getItem('muallim_access_token') || undefined;
        const data = await getTeacher(id, token);
        const mapped = mapProfileToTeacher(data);
        setTeacher(mapped);
        
        setSessionDurations([30, 60]);
        setDuration(60);
      } catch (err) {
        console.error('Error fetching teacher profile:', err);
        setError('Failed to load teacher profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      let tz = DEFAULT_TIMEZONE;
      const token = localStorage.getItem('muallim_access_token');
      if (token) {
        try {
          const profile = await getProfile(token);
          if (profile.timezone) tz = profile.timezone;
        } catch { /* use default */ }
      }
      setViewerTimezone(tz);
      try {
        const avail = await getTeacherAvailability(id, tz, token || undefined);
        setTeacherTimezone(avail.timezone);
        setSlotsByDay(avail.slots_by_day_viewer || avail.slots_by_day || {});
      } catch {
        setSlotsByDay({});
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar isLoggedIn />
        <div className="flex flex-col items-center justify-center min-h-[50vh] pt-32 text-[#C8962A]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm text-[#9CA3AF] mt-2">Loading teacher profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar isLoggedIn />
        <div className="flex flex-col items-center justify-center min-h-[50vh] pt-32 text-red-500">
          <p className="text-lg font-semibold">{error || 'Teacher profile not found'}</p>
          <Link to="/search" className="mt-4 px-4 py-2 bg-[#0D1B2A] text-white rounded-lg text-sm">
            Back to Search
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const sessionPrice = teacher.hourlyRate * (duration / 60);
  const platformFee = Math.round(sessionPrice * (PLATFORM_FEE_PERCENT / 100));
  const total = sessionPrice + platformFee;

  const getSlotsForDay = (day: string) => {
    const rawSlots = slotsByDay[day] || [];
    return rawSlots.filter((slot: any) => {
      if (typeof slot === 'string') return true;
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      return diff === duration;
    });
  };

  const getDisplaySlots = () => {
    const rawSlots = slotsByDay[selectedDay] || [];
    return rawSlots.filter((slot: any) => {
      if (typeof slot === 'string') {
        return true;
      }
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      return diff === duration;
    }).map((slot: any) => typeof slot === 'string' ? slot : slot.start);
  };

  const availableSlots = profileSlots;

  return (
    <div className="min-h-screen bg-white">
      <Navbar isLoggedIn />

      {/* Back Nav */}
      <div className="pt-16 bg-[#F8F6F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/search" className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#0D1B2A] text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Search
          </Link>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-[#F8F6F1] border-b border-[rgba(13,27,42,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <img
                src={teacher.avatar}
                alt={teacher.name}
                className="w-24 h-24 rounded-2xl object-cover shadow-lg"
              />
              {teacher.status === 'approved' && (
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem', color: '#0D1B2A', lineHeight: 1.2 }}>
                    {teacher.name}
                  </h1>
                  <p className="text-[#6B7280] mt-1">{teacher.headline}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-[#C8962A] text-[#C8962A]" />
                      <span className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{teacher.rating.toFixed(1)}</span>
                      <span className="text-[#9CA3AF] text-sm">({teacher.reviewsCount} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#9CA3AF] text-sm">
                      <MapPin className="w-4 h-4" />
                      {teacher.location}
                    </div>
                    <div className="flex items-center gap-1.5 text-[#9CA3AF] text-sm">
                      <Globe className="w-4 h-4" />
                      {teacher.languages.join(' · ')}
                    </div>
                    <div className="flex items-center gap-1.5 text-[#9CA3AF] text-sm">
                      <Clock className="w-4 h-4" />
                      Responds {teacher.responseTime.toLowerCase()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setLiked(!liked)}
                    className={`p-2.5 rounded-xl border transition-colors ${liked ? 'border-red-200 bg-red-50 text-red-500' : 'border-[rgba(13,27,42,0.15)] text-[#9CA3AF] hover:text-[#6B7280]'}`}
                  >
                    <Heart className={`w-5 h-5 ${liked ? 'fill-red-500' : ''}`} />
                  </button>
                  <button className="p-2.5 rounded-xl border border-[rgba(13,27,42,0.15)] text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {teacher.skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-[#0D1B2A] text-white text-xs rounded-full">
                    {skill}
                  </span>
                ))}
                {teacher.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white border border-[rgba(13,27,42,0.12)] text-[#6B7280] text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-4 mt-6">
            {[
              { value: teacher.studentsCount, label: 'Students' },
              { value: teacher.sessionsCount, label: 'Sessions Taught' },
              { value: `${teacher.reviewsCount}`, label: 'Reviews' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 border border-[rgba(13,27,42,0.06)]">
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.5rem', color: '#0D1B2A' }}>
                  {s.value}
                </div>
                <div className="text-[#9CA3AF] text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div id="profile-tabs" className="flex border-b border-[rgba(13,27,42,0.1)] mb-8">
              {(['about', 'reviews', 'availability'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm capitalize transition-colors duration-150 border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-[#C8962A] text-[#0D1B2A]'
                      : 'border-transparent text-[#9CA3AF] hover:text-[#6B7280]'
                  }`}
                  style={{ fontWeight: activeTab === tab ? 600 : 400 }}
                >
                  {tab === 'reviews' ? `Reviews (${teacher.reviewsCount})` : tab === 'availability' ? 'Schedule' : 'About'}
                </button>
              ))}
            </div>

            {activeTab === 'about' && (
              <div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.2rem', color: '#0D1B2A' }} className="mb-4">
                  About {teacher.name.split(' ')[0]}
                </h3>
                <p className="text-[#6B7280] leading-relaxed mb-8">{teacher.bio}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#F8F6F1] rounded-xl p-4">
                    <p className="text-[#9CA3AF] text-xs mb-1">Member since</p>
                    <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>
                      {new Date(teacher.joinedDate).toLocaleDateString('en-AE', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="bg-[#F8F6F1] rounded-xl p-4">
                    <p className="text-[#9CA3AF] text-xs mb-1">Languages</p>
                    <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{teacher.languages.join(', ')}</p>
                  </div>
                  <div className="bg-[#F8F6F1] rounded-xl p-4">
                    <p className="text-[#9CA3AF] text-xs mb-1">Response time</p>
                    <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{teacher.responseTime}</p>
                  </div>
                  <div className="bg-[#F8F6F1] rounded-xl p-4">
                    <p className="text-[#9CA3AF] text-xs mb-1">Sessions completed</p>
                    <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{teacher.sessionsCount}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex items-center gap-6 mb-8 p-5 bg-[#F8F6F1] rounded-2xl">
                  <div className="text-center">
                    <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '3rem', color: '#0D1B2A', lineHeight: 1 }}>
                      {teacher.rating.toFixed(1)}
                    </div>
                    <div className="flex gap-0.5 justify-center my-2">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-4 h-4 fill-[#C8962A] text-[#C8962A]" />
                      ))}
                    </div>
                    <div className="text-[#9CA3AF] text-xs">{teacher.reviewsCount} reviews</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5,4,3,2,1].map(n => {
                      const pct = n === 5 ? 78 : n === 4 ? 16 : n === 3 ? 4 : 1;
                      return (
                        <div key={n} className="flex items-center gap-3">
                          <span className="text-xs text-[#9CA3AF] w-3">{n}</span>
                          <Star className="w-3 h-3 fill-[#C8962A] text-[#C8962A]" />
                          <div className="flex-1 h-1.5 bg-[#E5E0D8] rounded-full overflow-hidden">
                            <div className="h-full bg-[#C8962A] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-[#9CA3AF] w-8">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5">
                  {REVIEWS.map(review => (
                    <div key={review.id} className="border-b border-[rgba(13,27,42,0.08)] pb-5 last:border-0">
                      <div className="flex items-start gap-3 mb-3">
                        <img src={review.studentAvatar} alt={review.studentName} className="w-9 h-9 rounded-full object-cover" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>{review.studentName}</p>
                            <p className="text-[#9CA3AF] text-xs">{new Date(review.date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'fill-[#C8962A] text-[#C8962A]' : 'text-[#E5E0D8]'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-[#9CA3AF]">· {review.subject}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[#6B7280] text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'availability' && (
              <div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.2rem', color: '#0D1B2A' }} className="mb-2">
                  Weekly Schedule
                </h3>
                <p className="text-[#9CA3AF] text-sm mb-6">
                  Times shown in your timezone ({getTimezoneAbbr(viewerTimezone)})
                  {viewerTimezone !== teacherTimezone && (
                    <span> · Teacher is in {getTimezoneAbbr(teacherTimezone)}</span>
                  )}
                </p>

                {/* Day Selector */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {DAYS.map(day => {
                    const count = daySlotCounts[day] !== undefined ? daySlotCounts[day] : getSlotsForDay(day).length;
                    return (
                      <button
                        key={day}
                        onClick={() => { setSelectedDay(day); setSelectedSlot(null); }}
                        className={`flex flex-col items-center px-4 py-3 rounded-xl transition-colors shrink-0 ${
                          selectedDay === day
                            ? 'bg-[#0D1B2A] text-white'
                            : count === 0
                            ? 'bg-[#F0ECE4] text-[#C9B99A] cursor-default'
                            : 'bg-[#F8F6F1] text-[#6B7280] hover:bg-[#F0ECE4] hover:text-[#0D1B2A]'
                        }`}
                      >
                        <span className="text-xs">{DAY_LABELS[day]}</span>
                        <span className="text-lg" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700 }}>
                          {count}
                        </span>
                        <span className="text-xs mt-0.5">{count === 0 ? 'Off' : 'slots'}</span>
                      </button>
                    );
                  })}
                </div>
                {slotsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#C8962A]" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-[#9CA3AF]">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No availability on {selectedDay}s</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot === selectedSlot ? null : slot)}
                        className={`py-2.5 rounded-xl text-sm border transition-all duration-150 ${
                          selectedSlot === slot
                            ? 'bg-[#C8962A] border-[#C8962A] text-white'
                            : 'bg-[#F8F6F1] border-transparent text-[#0D1B2A] hover:border-[#C8962A]/30'
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-[rgba(13,27,42,0.12)] shadow-lg overflow-hidden">
              <div className="bg-[#0D1B2A] px-6 py-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[#C8962A]" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2rem' }}>
                    {teacher.hourlyRate}
                  </span>
                  <span className="text-white/60 text-sm">AED / hour</span>
                </div>
                <p className="text-white/50 text-xs mt-1">Platform fee included in total below</p>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs text-[#9CA3AF] mb-2" style={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Session Duration
                  </label>
                  <div className="flex gap-2">
                    {sessionDurations.map(d => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`flex-1 py-2 rounded-xl text-sm transition-colors border ${duration === d ? 'bg-[#0D1B2A] border-[#0D1B2A] text-white' : 'border-[rgba(13,27,42,0.15)] text-[#6B7280] hover:border-[#0D1B2A]'}`}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#F8F6F1] rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Session ({duration} min)</span>
                    <span className="text-[#0D1B2A]">AED {sessionPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                    <span className="text-[#0D1B2A]">AED {platformFee}</span>
                  </div>
                  <div className="border-t border-[rgba(13,27,42,0.08)] pt-2.5 flex justify-between">
                    <span className="text-[#0D1B2A]" style={{ fontWeight: 600 }}>Total</span>
                    <span className="text-[#0D1B2A]" style={{ fontWeight: 700 }}>AED {total}</span>
                  </div>
                </div>

                {selectedSlot ? (
                  <Link
                    to={`/book/${teacher.id}?day=${selectedDay}&time=${selectedSlot}&duration=${duration}`}
                    className="block w-full text-center bg-[#C8962A] hover:bg-[#b8851f] text-white px-4 py-3.5 rounded-xl transition-colors duration-150"
                    style={{ fontWeight: 600 }}
                  >
                    Book Selected Slot ({selectedSlot})
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('availability');
                      document.getElementById('profile-tabs')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="block w-full text-center bg-[#C8962A] hover:bg-[#b8851f] text-white px-4 py-3.5 rounded-xl transition-colors duration-150"
                    style={{ fontWeight: 600 }}
                  >
                    Book a Session
                  </button>
                )}

                <Link
                  to="/messages"
                  className="flex items-center justify-center gap-2 w-full border border-[rgba(13,27,42,0.15)] text-[#0D1B2A] hover:bg-[#F8F6F1] px-4 py-3 rounded-xl transition-colors text-sm"
                  style={{ fontWeight: 500 }}
                >
                  <MessageSquare className="w-4 h-4" /> Message First
                </Link>

                <p className="text-center text-xs text-[#9CA3AF]">
                  Free cancellation up to 24 hours before the session
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
