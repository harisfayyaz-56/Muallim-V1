import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Save, Plus, X, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'availability' | 'pricing'>('profile');
  const [availability, setAvailability] = useState(INITIAL_AVAILABILITY);
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
  const [sessionDuration, setSessionDuration] = useState<30 | 60 | 'both'>(60);
  const [teacherTimezone, setTeacherTimezone] = useState('Asia/Dubai');

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
            setSessionDuration(sd === '30' ? 30 : sd === '60' ? 60 : 'both');
          }
        }
        try {
          const avail = await getMyAvailability(token);
          if (avail.grid) setAvailability(avail.grid);
          if (avail.timezone) setTeacherTimezone(avail.timezone);
          if (avail.session_duration) {
            const sd = avail.session_duration;
            setSessionDuration(sd === '30' ? 30 : sd === '60' ? 60 : 'both');
          }
        } catch {
          // Teacher may not have availability yet
        }
      } catch {
        setHasTeacherProfile(false);
      }
    })();
  }, []);

  const toggleSlot = (day: string, time: string) => {
    setAvailability(prev => {
      const slots = prev[day] || [];
      const exists = slots.includes(time);
      return { ...prev, [day]: exists ? slots.filter(s => s !== time) : [...slots, time].sort() };
    });
  };

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
        const sd = sessionDuration === 30 ? '30' : sessionDuration === 60 ? '60' : 'both';
        await updateMyAvailability(token, {
          grid: availability as any,
          session_duration: sd as '30' | '60' | 'both',
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err: any) {
        setSaveError(err.message || 'Failed to save availability');
      }
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
            <Link to="/teacher-dashboard" className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white text-sm transition-colors mb-4">
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-white" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem' }}>
              Teacher Profile Settings
            </h1>

            <div className="flex items-center gap-2 mt-3">
              {profileStatus === 'approved' ? (
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
            {(['profile', 'availability', 'pricing'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-[#C8962A] text-white' : 'border-transparent text-white/50 hover:text-white/70'}`}
                style={{ fontWeight: activeTab === tab ? 600 : 400 }}
              >
                {tab}
              </button>
            ))}
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
                    <div className="flex gap-2">
                      <input
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && newSkill.trim()) { setSkills([...skills, newSkill.trim()]); setNewSkill(''); }}}
                        placeholder="Add a skill..."
                        list="skills-list"
                        className="flex-1 px-4 py-2 rounded-xl border border-[rgba(13,27,42,0.15)] text-sm text-[#0D1B2A] focus:outline-none focus:border-[#C8962A] transition-colors"
                      />
                      <datalist id="skills-list">
                        {SKILL_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                      </datalist>
                      <button
                        onClick={() => { if (newSkill.trim()) { setSkills([...skills, newSkill.trim()]); setNewSkill(''); }}}
                        className="p-2 bg-[#0D1B2A] text-white rounded-xl hover:bg-[#1a2d45] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
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
                  {saved ? '✓ Saved' : <><Save className="w-4 h-4" /> {profileStatus === 'rejected' ? 'Resubmit for Review' : 'Save Profile'}</>}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
              <div className="px-6 py-5 border-b border-[rgba(13,27,42,0.06)] flex items-center justify-between">
                <div>
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.1rem', color: '#0D1B2A' }}>Weekly Availability</h2>
                  <p className="text-[#9CA3AF] text-xs mt-0.5">Click any slot to toggle it. Students will see and book from these slots.</p>
                </div>
                <div className="flex gap-2 bg-[#F8F6F1] rounded-xl p-1">
                  {[30, 60, 'both'].map(d => (
                    <button
                      key={d}
                      onClick={() => setSessionDuration(d as 30 | 60 | 'both')}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${sessionDuration === d ? 'bg-white text-[#0D1B2A] shadow-sm' : 'text-[#9CA3AF]'}`}
                      style={{ fontWeight: sessionDuration === d ? 600 : 400 }}
                    >
                      {d === 'both' ? 'Both' : `${d}min`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-[#F8F6F1]">
                    <tr>
                      <th className="w-20 px-4 py-3 text-left text-xs text-[#9CA3AF]">Time ({getTimezoneAbbr(teacherTimezone)})</th>
                      {DAYS.map(d => (
                        <th key={d} className="px-2 py-3 text-center text-xs text-[#0D1B2A]" style={{ fontWeight: 600 }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((time, i) => (
                      <tr key={time} className={`border-t border-[rgba(13,27,42,0.04)] ${i % 2 === 0 ? '' : 'bg-[#FAFAF8]'}`}>
                        <td className="px-4 py-2 text-xs text-[#9CA3AF]">{time}</td>
                        {DAYS.map(day => {
                          const active = (availability[day] || []).includes(time);
                          return (
                            <td key={day} className="px-2 py-1.5 text-center">
                              <button
                                onClick={() => toggleSlot(day, time)}
                                className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center transition-all duration-150 ${
                                  active
                                    ? 'bg-[#C8962A] hover:bg-[#b8851f] shadow-sm'
                                    : 'bg-[#F8F6F1] hover:bg-[#F0ECE4] border border-transparent hover:border-[rgba(13,27,42,0.1)]'
                                }`}
                              >
                                {active && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {saveError && activeTab === 'availability' && (
                <div className="px-6 py-3 text-red-600 bg-red-50 border-t border-red-200 text-sm">
                  {saveError}
                </div>
              )}
              <div className="px-6 py-4 bg-[#F8F6F1] border-t border-[rgba(13,27,42,0.06)] flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-[#9CA3AF]">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#C8962A]" /> Available</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-[#F8F6F1] border border-[rgba(13,27,42,0.1)]" /> Unavailable</div>
                </div>
                <button onClick={handleSave} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm transition-colors ${saved ? 'bg-emerald-500 text-white' : 'bg-[#0D1B2A] text-white hover:bg-[#1a2d45]'}`} style={{ fontWeight: 600 }}>
                  {saved ? '✓ Saved' : <><Save className="w-4 h-4" /> Save Schedule</>}
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
                  {saved ? '✓ Saved' : <><Save className="w-4 h-4" /> Save Pricing</>}
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
