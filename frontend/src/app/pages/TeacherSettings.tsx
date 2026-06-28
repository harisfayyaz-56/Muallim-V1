import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Save, Plus, X, ChevronLeft, AlertCircle, CheckCircle, ArrowRight, ChevronDown, Check, Trash2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getTeacherProfile, createTeacherProfile, updateTeacherProfile, getProfile } from '../../api/profile';
import { getMyAvailability, updateMyAvailability } from '../../api/availability';
import { DAYS_SHORT, TIME_SLOTS, EMPTY_GRID } from '../utils/availability';
import { getTimezoneAbbr } from '../../utils/preferences';

const DAYS = DAYS_SHORT;

const INITIAL_AVAILABILITY: Record<string, string[]> = { ...EMPTY_GRID };

const SKILL_SUGGESTIONS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Arabic', 'Programming', 'Python', 'JavaScript', 'React', 'Business', 'Finance', 'IELTS', 'SAT', 'IGCSE', 'A-Level', 'IB', 'Guitar', 'Piano', 'Quran'];

export function TeacherSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'pricing' | 'availability'>('profile');
  const [availability, setAvailability] = useState<Record<string, { start: string; end: string }[]>>({
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newTag, setNewTag] = useState('');
  const [hourlyRate, setHourlyRate] = useState(100);
  const [form, setForm] = useState({ headline: '', bio: '' });
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [profileStatus, setProfileStatus] = useState<'approved' | 'pending' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [hasTeacherProfile, setHasTeacherProfile] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [sessionDurationSetting, setSessionDurationSetting] = useState<'30' | '60'>('60');
  const [sessionDuration, setSessionDuration] = useState<30 | 60>(60);
  const [teacherTimezone, setTeacherTimezone] = useState('Asia/Dubai');
  
  // Custom availability state variables
  const [selectedSettingsDay, setSelectedSettingsDay] = useState('Mon');
  const [newStartTime, setNewStartTime] = useState('07:00');
  const [availabilityError, setAvailabilityError] = useState('');
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);

  const getEndTime = (startStr: string, durationMin: number) => {
    if (!startStr) return '';
    const [h, m] = startStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    const endDate = new Date(date.getTime() + durationMin * 60 * 1000);
    const endH = String(endDate.getHours()).padStart(2, '0');
    const endM = String(endDate.getMinutes()).padStart(2, '0');
    return `${endH}:${endM}`;
  };

  const checkOverlap = (day: string, start: string, end: string) => {
    const slots = availability[day] || [];
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    const newStart = toMinutes(start);
    let newEnd = toMinutes(end);
    if (newEnd <= newStart) {
      newEnd += 24 * 60;
    }
    for (const slot of slots) {
      const sStart = toMinutes(slot.start);
      let sEnd = toMinutes(slot.end);
      if (sEnd <= sStart) {
        sEnd += 24 * 60;
      }
      if (newStart < sEnd && newEnd > sStart) {
        return true;
      }
    }
    return false;
  };

  const addSlot = () => {
    if (!newStartTime) return;
    const end = getEndTime(newStartTime, sessionDuration);
    if (checkOverlap(selectedSettingsDay, newStartTime, end)) {
      setAvailabilityError(`This slot overlaps with an existing slot on ${selectedSettingsDay}.`);
      return;
    }
    setAvailabilityError('');
    setAvailability(prev => {
      const daySlots = prev[selectedSettingsDay] || [];
      const newSlot = { start: newStartTime, end };
      const updated = [...daySlots, newSlot].sort((a, b) => a.start.localeCompare(b.start));
      return { ...prev, [selectedSettingsDay]: updated };
    });
  };

  const deleteSlot = (day: string, start: string) => {
    setAvailability(prev => {
      const daySlots = prev[day] || [];
      const updated = daySlots.filter(s => {
        const sStart = typeof s === 'string' ? s : s.start;
        return sStart !== start;
      });
      return { ...prev, [day]: updated };
    });
  };

  const getSlotDuration = (slot: any) => {
    const isString = typeof slot === 'string';
    const start = isString ? slot : slot.start;
    const end = isString ? getEndTime(slot, sessionDuration) : slot.end;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) {
      diff += 24 * 60;
    }
    return diff;
  };

  useEffect(() => {
    const token = localStorage.getItem('muallim_access_token');
    if (!token) return;
    (async () => {
      try {
        const [tProfile, userProfile] = await Promise.all([
          getTeacherProfile(token).catch(() => null),
          getProfile(token).catch(() => null),
        ]);
        if (userProfile?.timezone) setTeacherTimezone(userProfile.timezone);
        if (tProfile) {
          setHasTeacherProfile(true);
          setIsOnboarding(false);
          setForm({
            headline: tProfile.headline || tProfile.qualifications || '',
            bio: tProfile.bio || '',
          });
          const subjectsStr = tProfile.categories || tProfile.subjects || '';
          setSkills(subjectsStr ? subjectsStr.split(',').map(s => s.trim()).filter(Boolean) : []);
          const languagesStr = tProfile.tags || tProfile.languages || '';
          setTags(languagesStr ? languagesStr.split(',').map(t => t.trim()).filter(Boolean) : []);
          setHourlyRate(Number(tProfile.hourly_rate));
          setExperienceLevel(tProfile.experience_level || 'intermediate');
          setProfileStatus(tProfile.status || 'pending');
          setRejectionReason(tProfile.rejection_reason || '');
          if (tProfile.session_duration) {
            const sd = tProfile.session_duration;
            setSessionDurationSetting(sd);
            setSessionDuration(sd === '30' ? 30 : 60);
          }
        } else {
          setHasTeacherProfile(false);
          setIsOnboarding(true);
        }
        try {
          const avail = await getMyAvailability(token);
          if (avail.grid) {
            const mappedGrid: Record<string, { start: string; end: string }[]> = {
              Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
            };
            Object.entries(avail.grid).forEach(([day, slots]: [string, any]) => {
              if (Array.isArray(slots)) {
                mappedGrid[day] = slots.map((s: any) => {
                  if (typeof s === 'string') {
                    const parts = s.split(':');
                    const h = parseInt(parts[0], 10);
                    const m = parts[1] || '00';
                    const endH = h + 1;
                    const endHStr = String(endH).padStart(2, '0');
                    return { start: s, end: `${endHStr}:${m}` };
                  }
                  return s;
                });
              }
            });
            setAvailability(mappedGrid);
          }
          if (avail.timezone) setTeacherTimezone(avail.timezone);
          if (avail.session_duration) {
            const sd = avail.session_duration;
            setSessionDurationSetting(sd);
            setSessionDuration(sd === '30' ? 30 : 60);
          }
        } catch {
          // Inner catch
        }
      } catch {
        setHasTeacherProfile(false);
        setIsOnboarding(true);
      }
    })();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('muallim_access_token');
    if (!token) return;

    if (activeTab === 'availability') {
      if (!hasTeacherProfile) {
        setSaveError('Create your teacher profile first before saving availability');
        return;
      }
      try {
        setSaveError('');
        await updateMyAvailability(token, {
          grid: availability as any,
          session_duration: sessionDurationSetting,
        });
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          navigate('/teacher-dashboard');
        }, 1500);
      } catch (err: any) {
        setSaveError(err.message || 'Failed to save availability');
      }
      return;
    }

    if (skills.length === 0) {
      setSaveError('Please add at least one skill / subject under the Skills & Expertise section.');
      return;
    }
    if (tags.length === 0) {
      setSaveError('Please add at least one tag / language under the Skills & Expertise section.');
      return;
    }
    if (!form.bio.trim()) {
      setSaveError('Please write a brief bio describing your teaching experience.');
      return;
    }

    const payload = {
      bio: form.bio,
      headline: form.headline || 'Tutor',
      qualifications: form.headline || 'Tutor',
      hourly_rate: hourlyRate,
      experience_level: experienceLevel,
      categories: skills.join(', '),
      subjects: skills.join(', '),
      tags: tags.join(', '),
      languages: tags.join(', '),
    };

    try {
      setSaveError('');
      let updatedProfile;
      if (hasTeacherProfile) {
        updatedProfile = await updateTeacherProfile(token, payload);
      } else {
        updatedProfile = await createTeacherProfile(token, payload);
        setHasTeacherProfile(true);
      }
      if (updatedProfile) {
        setProfileStatus(updatedProfile.status || 'pending');
        setRejectionReason(updatedProfile.rejection_reason || '');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      
      // Auto transition to next tab
      if (activeTab === 'profile') {
        setTimeout(() => {
          setActiveTab('pricing');
        }, 800);
      } else if (activeTab === 'pricing') {
        setTimeout(() => {
          setActiveTab('availability');
        }, 800);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save teacher profile changes');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar isLoggedIn isTeacher />

      <div className="pt-16">
        <div className="bg-[#0D1B2A] py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link 
              to={isOnboarding ? "/settings" : "/teacher-dashboard"} 
              className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-sm transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" /> {isOnboarding ? "Back to Settings" : "Back to Dashboard"}
            </Link>
            <h1 className="text-white" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem' }}>
              {isOnboarding ? 'Teacher Onboarding' : 'Teacher Profile Settings'}
            </h1>

            <div className="flex items-center gap-2 mt-3">
              {isOnboarding ? (
                <div className="flex items-center gap-1.5 text-[#C8962A] text-xs bg-[#C8962A]/10 px-3 py-1.5 rounded-xl font-semibold border border-[#C8962A]/20">
                  <AlertCircle className="w-4 h-4" /> Onboarding — {
                    activeTab === 'profile' ? 'Step 1 of 3: Public Profile' :
                    activeTab === 'pricing' ? 'Step 2 of 3: Set Pricing' :
                    'Step 3 of 3: Configure Availability'
                  }
                </div>
              ) : profileStatus === 'approved' ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                  <CheckCircle className="w-4 h-4" /> Profile Approved — visible to students
                </div>
              ) : profileStatus === 'pending' ? (
                <div className="flex items-center gap-1.5 text-[#C8962A] text-xs">
                  <AlertCircle className="w-4 h-4" /> Pending Admin Review
                </div>
              ) : (
                <div className="flex flex-col gap-1 text-red-400 text-xs">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Profile Rejected — review feedback and resubmit
                  </div>
                  {rejectionReason && (
                    <div className="pl-5 text-red-300 italic">
                      Feedback: "{rejectionReason}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#0D1B2A] border-t border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1">
            {(['profile', 'pricing', 'availability'] as const).map(tab => {
              const isDisabled = isOnboarding && tab !== 'profile' && !hasTeacherProfile;
              return (
                <button
                  key={tab}
                  disabled={isDisabled}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm capitalize transition-colors border-b-2 -mb-px ${
                    activeTab === tab 
                      ? 'border-[#C8962A] text-white' 
                      : isDisabled 
                        ? 'border-transparent text-white/20 cursor-not-allowed'
                        : 'border-transparent text-white/50 hover:text-white/70'
                  }`}
                  style={{ fontWeight: activeTab === tab ? 600 : 400 }}
                  title={isDisabled ? "Please complete and save your profile details first" : ""}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
                <div className="px-6 py-5 border-b border-[rgba(13,27,42,0.06)]">
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.1rem', color: '#0D1B2A' }}>Public Profile</h2>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">This is what students see when they view your profile</p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Headline</label>
                    <input
                      value={form.headline}
                      onChange={e => setForm({...form, headline: e.target.value})}
                      placeholder="e.g. Senior Maths Tutor — 10 Years Experience"
                      className="w-full px-4 py-2.5 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all text-sm"
                    />
                    <p className="text-xs text-[#9CA3AF] mt-1">Short, compelling headline. Max 120 characters.</p>
                  </div>
                  <div>
                    <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Experience Level</label>
                    <select
                      value={experienceLevel}
                      onChange={e => setExperienceLevel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all text-sm"
                    >
                      <option value="beginner">Beginner (0-1 year)</option>
                      <option value="intermediate">Intermediate (1-3 years)</option>
                      <option value="advanced">Advanced (3-5 years)</option>
                      <option value="expert">Expert (5+ years)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={e => setForm({...form, bio: e.target.value})}
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all text-sm resize-none"
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-[#9CA3AF]">Describe your background, expertise, and teaching style</p>
                      <p className="text-xs text-[#9CA3AF]">{form.bio.length}/1000</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
                <div className="px-6 py-5 border-b border-[rgba(13,27,42,0.06)]">
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.1rem', color: '#0D1B2A' }}>Skills & Expertise</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm text-[#0D1B2A] mb-2" style={{ fontWeight: 500 }}>Main Skills</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {skills.map(skill => (
                        <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D1B2A] text-white text-xs rounded-full">
                          {skill}
                          <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="hover:text-red-300 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsSkillsOpen(!isSkillsOpen)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-sm text-[#0D1B2A] hover:border-[#C8962A] transition-colors"
                      >
                        <span className="text-[#9CA3AF]">Select skills...</span>
                        <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                      </button>
                      
                      {isSkillsOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsSkillsOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[rgba(13,27,42,0.08)] bg-white shadow-xl z-20 py-1.5">
                            {SKILL_SUGGESTIONS.map(s => {
                              const alreadyAdded = skills.includes(s);
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => {
                                    if (alreadyAdded) {
                                      setSkills(skills.filter(x => x !== s));
                                    } else {
                                      setSkills([...skills, s]);
                                    }
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                                    alreadyAdded ? 'bg-[#F8F6F1] text-[#C8962A] font-semibold' : 'text-[#0D1B2A] hover:bg-[#F8F6F1]'
                                  }`}
                                >
                                  <span>{s}</span>
                                  {alreadyAdded && <Check className="w-4 h-4 text-[#C8962A]" />}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#0D1B2A] mb-2" style={{ fontWeight: 500 }}>Tags (e.g. exam types, levels)</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F6F1] border border-[rgba(13,27,42,0.12)] text-[#6B7280] text-xs rounded-full">
                          {tag}
                          <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && newTag.trim()) { setTags([...tags, newTag.trim()]); setNewTag(''); }}}
                        placeholder="Add a tag (e.g. IGCSE, Beginner Friendly)..."
                        className="flex-1 px-4 py-2 rounded-xl border border-[rgba(13,27,42,0.15)] text-sm text-[#0D1B2A] focus:outline-none focus:border-[#C8962A] transition-colors"
                      />
                      <button
                        onClick={() => { if (newTag.trim()) { setTags([...tags, newTag.trim()]); setNewTag(''); }}}
                        className="p-2 bg-[#F8F6F1] border border-[rgba(13,27,42,0.15)] text-[#0D1B2A] rounded-xl hover:bg-[#F0ECE4] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {saveError && (
                <div className="p-3 text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm mb-3">
                  {saveError}
                </div>
              )}
              <div className="flex justify-end gap-3">
                {profileStatus === 'rejected' && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-200">
                    <AlertCircle className="w-4 h-4" /> Make your changes and click Resubmit
                  </div>
                )}
                <button onClick={handleSave} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-colors ${saved ? 'bg-emerald-500 text-white' : 'bg-[#0D1B2A] text-white hover:bg-[#1a2d45]'}`} style={{ fontWeight: 600 }}>
                  {saved ? '✓ Saved' : <>{profileStatus === 'rejected' ? <><Save className="w-4 h-4" /> Resubmit for Review</> : <><ArrowRight className="w-4 h-4" /> Next</>}</>}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
              <div className="px-6 py-5 border-b border-[rgba(13,27,42,0.06)]">
                <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.1rem', color: '#0D1B2A' }}>Pricing</h2>
                <p className="text-[#9CA3AF] text-xs mt-0.5">Set your hourly rate in AED. You can change this at any time.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Hourly Rate (AED)</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">AED</span>
                      <input
                        type="number"
                        value={hourlyRate}
                        onChange={e => setHourlyRate(Number(e.target.value))}
                        min={50}
                        max={1000}
                        className="w-full pl-14 pr-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all"
                        style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.25rem' }}
                      />
                    </div>
                    <span className="text-[#9CA3AF] text-sm">/ hour</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-2">Minimum AED 50/hour · Recommended range: AED 80–300/hour</p>
                </div>

                <div className="bg-[#F8F6F1] rounded-xl p-5 space-y-3">
                  <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>How students see your pricing</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">60-min session</span>
                      <span className="text-[#0D1B2A]">AED {hourlyRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Platform fee (12%)</span>
                      <span className="text-[#0D1B2A]">AED {Math.round(hourlyRate * 0.12)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[rgba(13,27,42,0.08)] pt-2">
                      <span className="text-[#0D1B2A]" style={{ fontWeight: 600 }}>Student pays</span>
                      <span className="text-[#0D1B2A]" style={{ fontWeight: 700 }}>AED {hourlyRate + Math.round(hourlyRate * 0.12)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[rgba(13,27,42,0.08)] pt-2">
                      <span className="text-emerald-700" style={{ fontWeight: 600 }}>You earn (88%)</span>
                      <span className="text-emerald-700" style={{ fontWeight: 700 }}>AED {Math.round(hourlyRate * 0.88)}</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleSave} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-colors ${saved ? 'bg-emerald-500 text-white' : 'bg-[#0D1B2A] text-white hover:bg-[#1a2d45]'}`} style={{ fontWeight: 600 }}>
                  {saved ? '✓ Saved' : <><ArrowRight className="w-4 h-4" /> Next</>}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
              <div className="px-6 py-5 border-b border-[rgba(13,27,42,0.06)] flex items-center justify-between">
                <div>
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.1rem', color: '#0D1B2A' }}>Weekly Availability</h2>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">Manage your recurring session availability slots.</p>
                </div>
                <div className="bg-[#0D1B2A]/5 text-[#0D1B2A] px-3 py-1.5 rounded-xl text-xs font-semibold">
                  {sessionDurationSetting}min sessions
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Allowed booking durations */}
                <div className="bg-[#F8F6F1] rounded-2xl p-5 border border-[rgba(13,27,42,0.05)]">
                  <h3 className="text-sm text-[#0D1B2A] font-semibold mb-1">Allowed booking durations</h3>
                  <p className="text-xs text-[#9CA3AF] mb-4">Choose which lesson lengths students can book with you.</p>
                  <div className="flex gap-2 max-w-md">
                    {(['30', '60'] as const).map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setSessionDurationSetting(d);
                          setSessionDuration(Number(d) as 30 | 60);
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs transition-all border ${sessionDurationSetting === d ? 'bg-[#0D1B2A] border-[#0D1B2A] text-white font-semibold' : 'border-[rgba(13,27,42,0.15)] bg-white text-[#6B7280] hover:border-[#0D1B2A]'}`}
                      >
                        {`${d} mins`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weekday Selector Row */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-[rgba(13,27,42,0.04)]">
                  {DAYS.map(day => {
                    const daySlots = availability[day] || [];
                    const activeCount = daySlots.filter(s => getSlotDuration(s) === sessionDuration).length;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedSettingsDay(day)}
                        className={`flex flex-col items-center min-w-[70px] px-3 py-2.5 rounded-xl transition-all ${
                          selectedSettingsDay === day
                            ? 'bg-[#0D1B2A] text-white shadow-sm'
                            : 'bg-[#F8F6F1] text-[#6B7280] hover:bg-[#F0ECE4] hover:text-[#0D1B2A]'
                        }`}
                      >
                        <span className="text-[10px] font-semibold tracking-wider uppercase">{day}</span>
                        <span className="text-sm font-bold mt-1" style={{ fontFamily: 'Fraunces, serif' }}>
                          {activeCount}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Add Slot Form */}
                  <div className="bg-[#F8F6F1] rounded-2xl p-5 border border-[rgba(13,27,42,0.05)]">
                    <h3 className="text-sm text-[#0D1B2A] font-semibold mb-4 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-[#C8962A]" /> Add {sessionDuration}min Slot for {selectedSettingsDay}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Start Time</label>
                        <input
                          type="time"
                          value={newStartTime}
                          onChange={e => setNewStartTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-sm text-[#0D1B2A] focus:outline-none focus:border-[#C8962A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>End Time (Auto-calculated)</label>
                        <input
                          type="text"
                          value={getEndTime(newStartTime, sessionDuration)}
                          disabled
                          className="w-full px-3 py-2 rounded-xl border border-[rgba(13,27,42,0.08)] bg-white/50 text-sm text-[#9CA3AF] cursor-not-allowed"
                        />
                      </div>

                      {availabilityError && (
                        <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                          {availabilityError}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={addSlot}
                        className="w-full py-2 bg-[#0D1B2A] hover:bg-[#1a2d45] text-white text-xs font-semibold rounded-xl transition-colors"
                      >
                        Add to Schedule
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Existing Slots List */}
                  <div>
                    <h3 className="text-sm text-[#0D1B2A] font-semibold mb-4">
                      Configured Slots ({selectedSettingsDay})
                    </h3>

                    {(() => {
                      const daySlots = availability[selectedSettingsDay] || [];
                      const filteredSlots = daySlots.filter(s => getSlotDuration(s) === sessionDuration);

                      if (filteredSlots.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-10 border border-dashed border-[rgba(13,27,42,0.12)] rounded-2xl text-[#9CA3AF]">
                            <p className="text-xs">No {sessionDuration}min slots defined for this day</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {filteredSlots.map((slot: any, idx: number) => {
                            const isString = typeof slot === 'string';
                            const start = isString ? slot : slot.start;
                            const end = isString ? getEndTime(slot, sessionDuration) : slot.end;
                            const [sh, sm] = start.split(':').map(Number);
                            const [eh, em] = end.split(':').map(Number);
                            const diff = (eh * 60 + em) - (sh * 60 + sm);

                             return (
                              <div
                                key={idx}
                                className="flex items-center justify-between px-4 py-2.5 bg-white border border-[rgba(13,27,42,0.06)] rounded-xl hover:shadow-sm transition-all"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-[#0D1B2A] tabular-nums">
                                    {start} – {end}
                                  </span>
                                  <span className="text-[10px] text-[#9CA3AF] mt-0.5">
                                    {diff} min session
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteSlot(selectedSettingsDay, start)}
                                  className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Delete Slot"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {saveError && activeTab === 'availability' && (
                <div className="px-6 py-3 text-red-600 bg-red-50 border-t border-red-200 text-sm">
                  {saveError}
                </div>
              )}
              <div className="px-6 py-4 bg-[#F8F6F1] border-t border-[rgba(13,27,42,0.06)] flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm transition-colors ${saved ? 'bg-emerald-500 text-white' : 'bg-[#0D1B2A] text-white hover:bg-[#1a2d45]'}`}
                  style={{ fontWeight: 600 }}
                >
                  {saved 
                    ? (isOnboarding ? '✓ Onboarding Complete!' : '✓ Saved') 
                    : (isOnboarding ? <><Check className="w-4 h-4" /> Complete Onboarding & Submit</> : <><Save className="w-4 h-4" /> Save Schedule</>)
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
