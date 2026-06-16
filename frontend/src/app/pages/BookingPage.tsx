import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Calendar, Clock, ChevronLeft, ChevronRight, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { TEACHERS, AVAILABILITY, PLATFORM_FEE_PERCENT } from '../data/mockData';

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
  const teacher = TEACHERS.find(t => t.id === teacherId) || TEACHERS[0];

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [subject, setSubject] = useState('');

  const calendarDays = generateCalendar(year, month);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const getAvailableSlots = (day: number) => {
    const d = new Date(year, month, day).getDay();
    const dayKey = SLOT_DAY_MAP[d];
    return (AVAILABILITY as Record<string, string[]>)[dayKey] || [];
  };

  const sessionPrice = teacher.hourlyRate * (duration / 60);
  const platformFee = Math.round(sessionPrice * (PLATFORM_FEE_PERCENT / 100));
  const total = sessionPrice + platformFee;

  const selectedDate = selectedDay ? new Date(year, month, selectedDay) : null;

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
              <strong className="text-[#0D1B2A]">{selectedSlot}</strong> is confirmed.
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
                <span className="text-[#0D1B2A]">{subject || teacher.skills[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Duration</span>
                <span className="text-[#0D1B2A]">{duration} minutes</span>
              </div>
              <div className="flex justify-between border-t border-[rgba(13,27,42,0.08)] pt-2">
                <span className="text-[#9CA3AF]">Total Paid</span>
                <span className="text-[#C8962A]" style={{ fontWeight: 700 }}>AED {total}</span>
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
          {step === 'select' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Calendar + Time */}
              <div className="lg:col-span-3 space-y-5">
                {/* Duration */}
                <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] p-5">
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, color: '#0D1B2A' }} className="mb-4">Session Duration</h3>
                  <div className="flex gap-3">
                    {[30, 60, 90].map(d => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`flex-1 py-3 rounded-xl text-sm border transition-all ${duration === d ? 'bg-[#0D1B2A] border-[#0D1B2A] text-white' : 'border-[rgba(13,27,42,0.15)] text-[#6B7280] hover:border-[#0D1B2A]'}`}
                        style={{ fontWeight: duration === d ? 600 : 400 }}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
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
                  <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] p-5">
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, color: '#0D1B2A' }} className="mb-4">
                      Available Times — {selectedDate?.toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {getAvailableSlots(selectedDay).map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot === selectedSlot ? null : slot)}
                          className={`py-2.5 rounded-xl text-sm border transition-all ${
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
                          {selectedSlot ? `${selectedSlot} · ${duration} min` : 'Select a time'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#9CA3AF] mb-1.5">Subject / Focus Area</label>
                      <input
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder={`e.g. ${teacher.skills[0]}`}
                        className="w-full px-3 py-2 rounded-xl border border-[rgba(13,27,42,0.15)] text-sm text-[#0D1B2A] focus:outline-none focus:border-[#C8962A] transition-colors"
                      />
                    </div>

                    <div className="bg-[#F8F6F1] rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Session ({duration} min)</span>
                        <span className="text-[#0D1B2A]">AED {sessionPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Platform fee</span>
                        <span className="text-[#0D1B2A]">AED {platformFee}</span>
                      </div>
                      <div className="flex justify-between border-t border-[rgba(13,27,42,0.08)] pt-2">
                        <span style={{ fontWeight: 600 }} className="text-[#0D1B2A]">Total</span>
                        <span style={{ fontWeight: 700 }} className="text-[#0D1B2A]">AED {total}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => selectedDay && selectedSlot && setStep('confirm')}
                      disabled={!selectedDay || !selectedSlot}
                      className={`w-full py-3 rounded-xl text-sm transition-colors ${
                        selectedDay && selectedSlot
                          ? 'bg-[#C8962A] hover:bg-[#b8851f] text-white'
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
                      { label: 'Time', value: `${selectedSlot} GST (Dubai)` },
                      { label: 'Duration', value: `${duration} minutes` },
                      { label: 'Subject', value: subject || teacher.skills[0] },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between">
                        <span className="text-[#9CA3AF]">{row.label}</span>
                        <span className="text-[#0D1B2A]" style={{ fontWeight: 500 }}>{row.value}</span>
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
                      <span className="text-[#0D1B2A]">AED {sessionPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Platform fee (12%)</span>
                      <span className="text-[#0D1B2A]">AED {platformFee}</span>
                    </div>
                    <div className="flex justify-between border-t border-[rgba(13,27,42,0.08)] pt-2">
                      <span style={{ fontWeight: 700 }} className="text-[#0D1B2A]">Total Charged</span>
                      <span style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Fraunces, serif' }} className="text-[#C8962A]">AED {total}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep('select')} className="flex-1 py-3 border border-[rgba(13,27,42,0.15)] text-[#6B7280] rounded-xl text-sm hover:bg-[#F8F6F1] transition-colors">
                      Back
                    </button>
                    <button
                      onClick={() => setStep('success')}
                      className="flex-1 py-3 bg-[#C8962A] hover:bg-[#b8851f] text-white rounded-xl text-sm transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      Pay AED {total}
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
