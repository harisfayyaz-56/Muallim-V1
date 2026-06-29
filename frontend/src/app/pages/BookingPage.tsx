import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Calendar, Clock, ChevronLeft, ChevronRight, CreditCard, Shield, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PLATFORM_FEE_PERCENT } from '../data/mockData';
import { getTeacher, getProfile } from '../../api/profile';
import { getTeacherAvailability, getTeacherSlotsForDate, createBooking } from '../../api/availability';
import { mapProfileToTeacher } from '../utils/mappers';
import { getTimezoneAbbr, DEFAULT_TIMEZONE } from '../../utils/preferences';
import type { BookableSlot } from '../../api/availability';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOT_DAY_MAP: Record<number, string> = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' };

function generateCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function BookingPage() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date();
  
  // Parse URL parameters synchronously
  const urlParamsInit = new URLSearchParams(window.location.search);
  const preDayInit = urlParamsInit.get('day');
  const preTimeInit = urlParamsInit.get('time');
  const preDurInit = urlParamsInit.get('duration');

  const initialDuration = preDurInit && (Number(preDurInit) === 30 || Number(preDurInit) === 60) ? Number(preDurInit) : 60;
  
  let initialSlot: BookableSlot | null = null;
  let initialStep: 'select' | 'confirm' | 'success' = 'select';
  let initialDay: number | null = null;
  let initialYear = today.getFullYear();
  let initialMonth = today.getMonth();

  if (preDayInit && preTimeInit) {
    try {
      const dayMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
      };
      const targetDayOfWeek = dayMap[preDayInit.toLowerCase()];
      if (targetDayOfWeek !== undefined) {
        const todayObj = new Date();
        const currentDayOfWeek = todayObj.getDay();
        let diff = targetDayOfWeek - currentDayOfWeek;
        if (diff <= 0) diff += 7;
        
        const targetDate = new Date();
        targetDate.setDate(todayObj.getDate() + diff);
        
        const [hours, minutes] = preTimeInit.split(':').map(Number);
        const localDt = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hours, minutes, 0, 0);
        
        initialSlot = {
          time: preTimeInit,
          utc: localDt.toISOString(),
          available: true
        };
        const preSubjectInit = urlParamsInit.get('subject') || '';
        const preNotesInit = urlParamsInit.get('notes') || '';
        if (preSubjectInit.trim() && preNotesInit.trim()) {
          initialStep = 'confirm';
        } else {
          initialStep = 'select';
        }
        initialDay = targetDate.getDate();
        initialYear = targetDate.getFullYear();
        initialMonth = targetDate.getMonth();
      }
    } catch (e) {
      console.error('Error computing initial slot:', e);
    }
  }

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(initialDay);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(initialSlot);
  const [duration, setDuration] = useState(initialDuration);
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>(initialStep);
  const [subject, setSubject] = useState(urlParamsInit.get('subject') || '');
  const [learningNote, setLearningNote] = useState(urlParamsInit.get('notes') || '');
  const [weeklySlots, setWeeklySlots] = useState<Record<string, string[]>>({});
  const [dateSlots30, setDateSlots30] = useState<BookableSlot[]>([]);
  const [dateSlots60, setDateSlots60] = useState<BookableSlot[]>([]);
  const [slotsLoading30, setSlotsLoading30] = useState(false);
  const [slotsLoading60, setSlotsLoading60] = useState(false);
  const [viewerTimezone, setViewerTimezone] = useState(DEFAULT_TIMEZONE);
  const [teacherTimezone, setTeacherTimezone] = useState(DEFAULT_TIMEZONE);
  const [bookingError, setBookingError] = useState('');
  const [paying, setPaying] = useState(false);
  const [sessionDurations, setSessionDurations] = useState<('30' | '60')[]>(['30', '60']);
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);

  useEffect(() => {
    if (!teacherId) return;
    (async () => {
      try {
        const token = localStorage.getItem('muallim_access_token') || undefined;
        const data = await getTeacher(teacherId, token);
        const mapped = mapProfileToTeacher(data);
        setTeacher(mapped);
        setSessionDurations(['30', '60']);
        setDuration(mapped.session_duration === '30' ? 30 : 60);
      } catch (err) {
        console.error('Error fetching teacher profile for booking:', err);
        setError('Failed to load teacher details');
      } finally {
        setLoading(false);
      }
    })();
  }, [teacherId]);

  useEffect(() => {
    if (!teacherId) return;
    (async () => {
      let tz = DEFAULT_TIMEZONE;
      const token = localStorage.getItem('muallim_access_token');
      if (token) {
        try {
          const profile = await getProfile(token);
          if (profile.timezone) tz = profile.timezone;
        } catch { /* default */ }
      }
      setViewerTimezone(tz);
      try {
        const avail = await getTeacherAvailability(teacherId, tz, token || undefined);
        setTeacherTimezone(avail.timezone);
        setWeeklySlots(avail.slots_by_day_viewer || avail.slots_by_day || {});
      } catch {
        setWeeklySlots({});
      }
    })();
  }, [teacherId]);

  // Handled on BookingPage itself
  useEffect(() => {
    // No redirect back to profile page so user can fill subject/notes
  }, [step, teacherId, navigate]);

  useEffect(() => {
    if (!teacherId || !selectedDay) {
      setDateSlots30([]);
      setDateSlots60([]);
      return;
    }
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    setSlotsLoading30(true);
    setSlotsLoading60(true);
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('time')) {
      setSelectedSlot(null);
    }
    const token = localStorage.getItem('muallim_access_token') || undefined;

    // Fetch 30 min slots
    (async () => {
      try {
        const res = await getTeacherSlotsForDate(teacherId, dateStr, 30, viewerTimezone, token);
        const slots = res.slots.filter(s => s.available);
        setDateSlots30(slots);
        
        const params = new URLSearchParams(window.location.search);
        const preTime = params.get('time');
        const preDur = params.get('duration');
        const preSubject = params.get('subject') || '';
        const preNotes = params.get('notes') || '';
        if (preTime && Number(preDur) === 30) {
          const matchingSlot = slots.find(s => s.time === preTime);
          if (matchingSlot) {
            setDuration(30);
            setSelectedSlot(matchingSlot);
            if (preSubject.trim() && preNotes.trim()) {
              setStep('confirm');
            }
          }
        }
      } catch {
        setDateSlots30([]);
      } finally {
        setSlotsLoading30(false);
      }
    })();

    // Fetch 60 min slots
    (async () => {
      try {
        const res = await getTeacherSlotsForDate(teacherId, dateStr, 60, viewerTimezone, token);
        const slots = res.slots.filter(s => s.available);
        setDateSlots60(slots);
        
        const params = new URLSearchParams(window.location.search);
        const preTime = params.get('time');
        const preDur = params.get('duration');
        const preSubject = params.get('subject') || '';
        const preNotes = params.get('notes') || '';
        if (preTime && (Number(preDur) === 60 || !preDur)) {
          const matchingSlot = slots.find(s => s.time === preTime);
          if (matchingSlot) {
            setDuration(60);
            setSelectedSlot(matchingSlot);
            if (preSubject.trim() && preNotes.trim()) {
              setStep('confirm');
            }
          }
        }
      } catch {
        setDateSlots60([]);
      } finally {
        setSlotsLoading60(false);
      }
    })();
  }, [teacherId, selectedDay, year, month, viewerTimezone]);

  const calendarDays = generateCalendar(year, month);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const getAvailableSlots = (day: number) => {
    const d = new Date(year, month, day).getDay();
    const dayKey = SLOT_DAY_MAP[d];
    const rawSlots = weeklySlots[dayKey] || [];
    return rawSlots.filter((slot: any) => {
      if (typeof slot === 'string') return true;
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      // A slot is relevant if it's large enough for at least one allowed session duration
      return sessionDurations.some(d => diff >= Number(d));
    });
  };

  const handlePayment = async () => {
    const token = localStorage.getItem('muallim_access_token');
    if (!token || !teacher || !selectedSlot) return;
    if (!subject.trim() || !learningNote.trim()) {
      setBookingError('Subject and Learning Note are required.');
      return;
    }
    setPaying(true);
    setBookingError('');
    try {
      const booking = await createBooking(token, {
        teacher_id: Number(teacher.id),
        subject: subject,
        scheduled_date: selectedSlot.utc,
        duration_minutes: duration,
        amount: total.toFixed(2),
        notes: learningNote,
        description: learningNote,
      });
      setCreatedBooking(booking);
      setStep('success');
    } catch (err: any) {
      setBookingError(err.message || 'Booking failed. The slot may have been taken.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navbar isLoggedIn />
        <div className="flex flex-col items-center justify-center min-h-[50vh] pt-32 text-[#C8962A]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm text-[#9CA3AF] mt-2">Loading booking details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navbar isLoggedIn />
        <div className="flex flex-col items-center justify-center min-h-[50vh] pt-32 text-red-500">
          <p className="text-lg font-semibold">{error || 'Teacher not found'}</p>
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

  const selectedDate = selectedDay ? new Date(year, month, selectedDay) : null;

  const urlParams = new URLSearchParams(window.location.search);
  const preTime = urlParams.get('time');
  const isPreselectedLoading = !!(preTime && (slotsLoading30 || slotsLoading60) && !selectedSlot);

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navbar isLoggedIn />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center mx-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem', color: '#0D1B2A' }} className="mb-3">
              Session Booked!
            </h2>
            <p className="text-[#6B7280] text-sm leading-relaxed mb-2">
              Your session with <strong className="text-[#0D1B2A]">{teacher.name}</strong> on{' '}
              <strong className="text-[#0D1B2A]">{selectedDate?.toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> at{' '}
              <strong className="text-[#0D1B2A]">{selectedSlot?.time}</strong> ({getTimezoneAbbr(viewerTimezone)}) is confirmed.
            </p>
            <p className="text-[#9CA3AF] text-xs mb-8">
              A meeting link has been generated and sent to your email. Check your dashboard for details.
            </p>
            <div className="bg-[#F8F6F1] rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Teacher</span>
                <span className="text-[#0D1B2A]" style={{ fontWeight: 600 }}>{teacher.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Subject</span>
                <span className="text-[#0D1B2A]">{subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Learning Note</span>
                <span className="text-[#0D1B2A] max-w-xs truncate">{learningNote}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Duration</span>
                <span className="text-[#0D1B2A]">{duration} minutes</span>
              </div>
              {createdBooking?.payment_status && (
                <div className="flex justify-between border-t border-[rgba(13,27,42,0.08)] pt-2">
                  <span className="text-[#9CA3AF]">Payment Status</span>
                  <span className="text-amber-800 font-semibold uppercase text-xs">{createdBooking.payment_status.replace('_', ' ')}</span>
                </div>
              )}
              {createdBooking?.meeting_link && (
                <div className="flex justify-between border-t border-[rgba(13,27,42,0.08)] pt-2">
                  <span className="text-[#9CA3AF]">Meeting Link</span>
                  <a
                    href={createdBooking.meeting_link}
                    className="text-[#C8962A] hover:underline flex items-center gap-1 text-xs"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Session <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
              <div className="flex justify-between border-t border-[rgba(13,27,42,0.08)] pt-2">
                <span className="text-[#9CA3AF]">Total Paid</span>
                <span className="text-[#C8962A]" style={{ fontWeight: 700 }}>AED {total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/dashboard" className="w-full py-3 bg-[#0D1B2A] text-white rounded-xl text-sm hover:bg-[#1a2d45] transition-colors" style={{ fontWeight: 600 }}>
                Go to My Dashboard
              </Link>
              <Link to="/messages" className="w-full py-3 border border-[rgba(13,27,42,0.15)] text-[#0D1B2A] rounded-xl text-sm hover:bg-[#F8F6F1] transition-colors">
                Message {teacher.name.split(' ')[0]}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar isLoggedIn />
      <div className="pt-16">
        <div className="bg-[#0D1B2A] py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link to={`/teacher/${teacher.id}`} className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-sm transition-colors mb-4">
              <ChevronLeft className="w-4 h-4" /> Back to Profile
            </Link>
            <h1 className="text-white" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem' }}>
              Book a Session
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <img src={teacher.avatar} alt={teacher.name} className="w-8 h-8 rounded-lg object-cover" />
              <span className="text-[#9CA3AF] text-sm">with {teacher.name}</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isPreselectedLoading && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-3xl border border-[rgba(13,27,42,0.06)] p-10 text-[#C8962A]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm text-[#9CA3AF] mt-2">Preparing your checkout details...</p>
            </div>
          )}

          {!isPreselectedLoading && step === 'select' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Calendar + Time */}
              <div className="lg:col-span-3 space-y-5">
                {/* Timezone Message */}
                <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] p-5">
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, color: '#0D1B2A' }} className="mb-2">Booking Info</h3>
                  <p className="text-xs text-[#9CA3AF]">
                    Times shown in your timezone ({getTimezoneAbbr(viewerTimezone)})
                  </p>
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, color: '#0D1B2A' }}>
                      {MONTH_NAMES[month]} {year}
                    </h3>
                    <div className="flex gap-1">
                      <button onClick={prevMonth} className="p-2 hover:bg-[#F8F6F1] rounded-lg transition-colors">
                        <ChevronLeft className="w-4 h-4 text-[#9CA3AF]" />
                      </button>
                      <button onClick={nextMonth} className="p-2 hover:bg-[#F8F6F1] rounded-lg transition-colors">
                        <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAYS_OF_WEEK.map(d => (
                      <div key={d} className="text-center text-xs text-[#9CA3AF] py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => {
                      if (!day) return <div key={i} />;
                      const dateObj = new Date(year, month, day);
                      const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                      const slots = getAvailableSlots(day);
                      const hasSlots = slots.length > 0 && !isPast;
                      const isSelected = day === selectedDay;

                      return (
                        <button
                          key={i}
                          onClick={() => hasSlots && (setSelectedDay(day), setSelectedSlot(null))}
                          disabled={!hasSlots}
                          className={`relative aspect-square flex items-center justify-center rounded-xl text-sm transition-all duration-150 ${
                            isSelected ? 'bg-[#C8962A] text-white shadow-md' :
                            isToday ? 'border-2 border-[#C8962A] text-[#0D1B2A]' :
                            hasSlots ? 'hover:bg-[#F8F6F1] text-[#0D1B2A] cursor-pointer' :
                            'text-[#C9B99A] cursor-default'
                          }`}
                          style={{ fontWeight: isSelected ? 700 : 400 }}
                        >
                          {day}
                          {hasSlots && !isSelected && (
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#C8962A] rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDay && (
                  <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] p-5 space-y-6">
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, color: '#0D1B2A' }} className="border-b border-[rgba(13,27,42,0.06)] pb-3">
                      Available Times — {selectedDate?.toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </h3>
                    
                    {/* 30 Minutes Slots */}
                    {sessionDurations.includes('30') && (
                      <div>
                        <h4 className="text-xs font-bold text-[#0D1B2A]/70 uppercase tracking-wider mb-3">30 Minutes Sessions</h4>
                        {slotsLoading30 ? (
                          <div className="flex items-center justify-center py-4 text-[#C8962A]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        ) : dateSlots30.length === 0 ? (
                          <p className="text-xs text-[#9CA3AF] italic">No 30-minute sessions available</p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {dateSlots30.map(slot => (
                              <button
                                key={`30-${slot.utc}`}
                                onClick={() => {
                                  setDuration(30);
                                  setSelectedSlot(selectedSlot?.utc === slot.utc && duration === 30 ? null : slot);
                                }}
                                className={`py-2 rounded-xl text-xs border transition-all ${
                                  selectedSlot?.utc === slot.utc && duration === 30
                                    ? 'bg-[#C8962A] border-[#C8962A] text-white font-semibold'
                                    : 'bg-[#F8F6F1] border-transparent text-[#0D1B2A] hover:border-[#C8962A]/30'
                                }`}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 60 Minutes Slots */}
                    {sessionDurations.includes('60') && (
                      <div className={sessionDurations.includes('30') ? "border-t border-[rgba(13,27,42,0.06)] pt-5" : ""}>
                        <h4 className="text-xs font-bold text-[#0D1B2A]/70 uppercase tracking-wider mb-3">60 Minutes Sessions</h4>
                        {slotsLoading60 ? (
                          <div className="flex items-center justify-center py-4 text-[#C8962A]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        ) : dateSlots60.length === 0 ? (
                          <p className="text-xs text-[#9CA3AF] italic">No 60-minute sessions available</p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {dateSlots60.map(slot => (
                              <button
                                key={`60-${slot.utc}`}
                                onClick={() => {
                                  setDuration(60);
                                  setSelectedSlot(selectedSlot?.utc === slot.utc && duration === 60 ? null : slot);
                                }}
                                className={`py-2 rounded-xl text-xs border transition-all ${
                                  selectedSlot?.utc === slot.utc && duration === 60
                                    ? 'bg-[#C8962A] border-[#C8962A] text-white font-semibold'
                                    : 'bg-[#F8F6F1] border-transparent text-[#0D1B2A] hover:border-[#C8962A]/30'
                                }`}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="lg:col-span-2">
                <div className="sticky top-24 bg-white rounded-2xl border border-[rgba(13,27,42,0.12)] shadow-lg overflow-hidden">
                  <div className="bg-[#0D1B2A] px-5 py-4">
                    <p className="text-[#9CA3AF] text-xs">Booking Summary</p>
                    <p className="text-white text-sm mt-0.5" style={{ fontWeight: 600 }}>{teacher.name}</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-[#9CA3AF]" />
                        <span className={selectedDay ? 'text-[#0D1B2A]' : 'text-[#C9B99A]'}>
                          {selectedDay ? selectedDate?.toLocaleDateString('en-AE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Select a date'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-[#9CA3AF]" />
                        <span className={selectedSlot ? 'text-[#0D1B2A]' : 'text-[#C9B99A]'}>
                          {selectedSlot ? `${selectedSlot.time} · ${duration} min (${getTimezoneAbbr(viewerTimezone)})` : 'Select a time'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#9CA3AF] mb-1.5" style={{ fontWeight: 600 }}>Subject / Focus Area *</label>
                      <input
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder={`e.g. ${teacher.skills[0] || 'General Quran Study'}`}
                        className="w-full px-3 py-2 rounded-xl border border-[rgba(13,27,42,0.15)] text-sm text-[#0D1B2A] focus:outline-none focus:border-[#C8962A] transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#9CA3AF] mb-1.5" style={{ fontWeight: 600 }}>Learning Note *</label>
                      <textarea
                        value={learningNote}
                        onChange={e => setLearningNote(e.target.value)}
                        placeholder="Explain briefly what you want to learn in this session... (Required)"
                        className="w-full px-3 py-2 rounded-xl border border-[rgba(13,27,42,0.15)] text-sm text-[#0D1B2A] focus:outline-none focus:border-[#C8962A] transition-colors min-h-[80px]"
                        required
                      />
                    </div>

                    <div className="bg-[#F8F6F1] rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Session ({duration} min)</span>
                        <span className="text-[#0D1B2A]">AED {sessionPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                        <span className="text-[#0D1B2A]">AED {platformFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">VAT</span>
                        <span className="text-[#9CA3AF] italic text-xs">calculated at checkout</span>
                      </div>
                      <div className="flex justify-between border-t border-[rgba(13,27,42,0.08)] pt-2">
                        <span style={{ fontWeight: 600 }} className="text-[#0D1B2A]">Total</span>
                        <span style={{ fontWeight: 700 }} className="text-[#0D1B2A]">AED {total.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => selectedDay && selectedSlot && subject.trim() && learningNote.trim() && setStep('confirm')}
                      disabled={!selectedDay || !selectedSlot || !subject.trim() || !learningNote.trim()}
                      className={`w-full py-3 rounded-xl text-sm transition-colors ${
                        selectedDay && selectedSlot && subject.trim() && learningNote.trim()
                          ? 'bg-[#C8962A] hover:bg-[#b8851f] text-white shadow-md'
                          : 'bg-[#F0ECE4] text-[#C9B99A] cursor-not-allowed'
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      Continue to Payment
                    </button>
                    <div className="flex items-center justify-center gap-1.5 text-[#9CA3AF] text-xs">
                      <Shield className="w-3 h-3" /> Secure payment · Free cancellation 24h before
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="max-w-lg mx-auto">
              <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
                <div className="px-6 py-5 border-b border-[rgba(13,27,42,0.06)]">
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.25rem', color: '#0D1B2A' }}>Confirm & Pay</h2>
                </div>
                <div className="p-6 space-y-5">
                  {/* Booking Details */}
                  <div className="bg-[#F8F6F1] rounded-xl p-4 space-y-2 text-sm">
                    {[
                      { label: 'Teacher', value: teacher.name },
                      { label: 'Date', value: selectedDate?.toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) || '' },
                      { label: 'Time', value: `${selectedSlot?.time} (${getTimezoneAbbr(viewerTimezone)})` },
                      { label: 'Duration', value: `${duration} minutes` },
                      { label: 'Subject', value: subject },
                      { label: 'Learning Note', value: learningNote },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between gap-4">
                        <span className="text-[#9CA3AF] shrink-0">{row.label}</span>
                        <span className="text-[#0D1B2A] text-right truncate max-w-[200px]" style={{ fontWeight: 500 }} title={row.value}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Payment */}
                  <div>
                    <label className="block text-sm text-[#0D1B2A] mb-3" style={{ fontWeight: 600 }}>Payment Details (AED)</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 border border-[rgba(13,27,42,0.15)] rounded-xl p-3">
                        <CreditCard className="w-5 h-5 text-[#9CA3AF]" />
                        <input placeholder="Card number" className="flex-1 text-sm text-[#0D1B2A] focus:outline-none bg-transparent" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="MM / YY" className="px-4 py-3 border border-[rgba(13,27,42,0.15)] rounded-xl text-sm text-[#0D1B2A] focus:outline-none focus:border-[#C8962A] transition-colors" />
                        <input placeholder="CVV" className="px-4 py-3 border border-[rgba(13,27,42,0.15)] rounded-xl text-sm text-[#0D1B2A] focus:outline-none focus:border-[#C8962A] transition-colors" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F8F6F1] rounded-xl p-4 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Session ({duration} min)</span>
                      <span className="text-[#0D1B2A]">AED {sessionPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
                      <span className="text-[#0D1B2A]">AED {platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">VAT</span>
                      <span className="text-[#9CA3AF] italic text-xs">calculated at checkout</span>
                    </div>
                    <div className="flex justify-between border-t border-[rgba(13,27,42,0.08)] pt-2">
                      <span style={{ fontWeight: 700 }} className="text-[#0D1B2A]">Total Charged</span>
                      <span style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Fraunces, serif' }} className="text-[#C8962A]">AED {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="p-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm">
                      {bookingError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(window.location.search);
                        if (params.get('subject') && params.get('notes')) {
                          navigate(`/teacher/${teacherId}?tab=availability`);
                        } else {
                          setStep('select');
                        }
                      }}
                      className="flex-1 py-3 border border-[rgba(13,27,42,0.15)] text-[#6B7280] rounded-xl text-sm hover:bg-[#F8F6F1] transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={paying}
                      className="flex-1 py-3 bg-[#C8962A] hover:bg-[#b8851f] text-white rounded-xl text-sm transition-colors disabled:opacity-60"
                      style={{ fontWeight: 600 }}
                    >
                      {paying ? 'Processing...' : `Pay AED ${total}`}
                    </button>
                  </div>

                  <p className="text-center text-xs text-[#9CA3AF] flex items-center justify-center gap-1.5">
                    <Shield className="w-3 h-3" /> Payments secured by Stripe · All prices in AED
                  </p>
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
