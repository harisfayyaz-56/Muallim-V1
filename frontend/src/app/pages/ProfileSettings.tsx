import { useState } from 'react';
import { Link } from 'react-router';
import { Camera, Save, User, Bell, Shield, GraduationCap, Globe, ChevronRight, AlertTriangle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const TIMEZONES = [
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Kuwait',
  'Europe/London',
  'America/New_York',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Manila',
];

const NAV_ITEMS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'teacher', label: 'Teacher Mode', icon: GraduationCap },
];

export function ProfileSettings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [teacherMode, setTeacherMode] = useState(true);
  const [form, setForm] = useState({
    firstName: 'Omar',
    lastName: 'Hassan',
    email: 'omar.hassan@example.com',
    bio: 'Passionate learner based in Dubai, UAE. Currently studying Mathematics and improving my Python skills.',
    location: 'Dubai, UAE',
    timezone: 'Asia/Dubai',
  });
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop&auto=format');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Navbar isLoggedIn />

      <div className="pt-16">
        <div className="bg-[#0D1B2A] py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-white" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem' }}>
              Account Settings
            </h1>
            <p className="text-[#9CA3AF] mt-1 text-sm">Manage your profile, preferences, and account</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Nav */}
            <aside className="w-full md:w-52 shrink-0">
              <nav className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
                {NAV_ITEMS.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors ${
                      i > 0 ? 'border-t border-[rgba(13,27,42,0.05)]' : ''
                    } ${activeSection === item.id ? 'bg-[#F8F6F1] text-[#0D1B2A]' : 'text-[#6B7280] hover:bg-[#F8F6F1] hover:text-[#0D1B2A]'}`}
                    style={{ fontWeight: activeSection === item.id ? 600 : 400 }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {item.id === 'teacher' && teacherMode && (
                      <span className="ml-auto w-2 h-2 bg-emerald-500 rounded-full" />
                    )}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {activeSection === 'profile' && (
                <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
                  <div className="px-6 py-5 border-b border-[rgba(13,27,42,0.06)]">
                    <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.1rem', color: '#0D1B2A' }}>
                      Personal Information
                    </h2>
                    <p className="text-[#9CA3AF] text-xs mt-0.5">Your public profile information</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <img src={avatarPreview} alt="Profile" className="w-20 h-20 rounded-2xl object-cover" />
                        <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="w-6 h-6 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                setAvatarPreview(url);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div>
                        <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>Profile Photo</p>
                        <p className="text-[#9CA3AF] text-xs mt-0.5">JPG or PNG. Max 5MB. Min 200×200px.</p>
                        <label className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#C8962A] cursor-pointer hover:underline">
                          <Camera className="w-3.5 h-3.5" /> Upload new photo
                          <input type="file" accept="image/*" className="hidden" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file && file.size <= 5 * 1024 * 1024) {
                              setAvatarPreview(URL.createObjectURL(file));
                            }
                          }} />
                        </label>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>First Name</label>
                        <input
                          value={form.firstName}
                          onChange={e => setForm({...form, firstName: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Last Name</label>
                        <input
                          value={form.lastName}
                          onChange={e => setForm({...form, lastName: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all text-sm"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Email Address</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all text-sm"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Bio</label>
                      <textarea
                        value={form.bio}
                        onChange={e => setForm({...form, bio: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all text-sm resize-none"
                      />
                      <p className="text-right text-xs text-[#9CA3AF] mt-1">{form.bio.length}/500</p>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Location</label>
                      <input
                        value={form.location}
                        onChange={e => setForm({...form, location: e.target.value})}
                        placeholder="e.g. Dubai, UAE"
                        className="w-full px-4 py-2.5 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all text-sm"
                      />
                    </div>

                    {/* Timezone */}
                    <div>
                      <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>
                        <Globe className="inline w-4 h-4 mr-1 text-[#9CA3AF]" />
                        Timezone
                      </label>
                      <select
                        value={form.timezone}
                        onChange={e => setForm({...form, timezone: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all text-sm"
                      >
                        {TIMEZONES.map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                      <p className="text-xs text-[#9CA3AF] mt-1">Session times will be displayed in this timezone</p>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-[#F8F6F1] border-t border-[rgba(13,27,42,0.06)] flex items-center justify-between">
                    <p className="text-[#9CA3AF] text-xs">Changes are saved immediately</p>
                    <button
                      onClick={handleSave}
                      className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm transition-all duration-150 ${
                        saved ? 'bg-emerald-500 text-white' : 'bg-[#0D1B2A] hover:bg-[#1a2d45] text-white'
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {saved ? '✓ Saved' : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
                  <div className="px-6 py-5 border-b border-[rgba(13,27,42,0.06)]">
                    <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.1rem', color: '#0D1B2A' }}>Notifications</h2>
                  </div>
                  <div className="divide-y divide-[rgba(13,27,42,0.06)]">
                    {[
                      { label: 'Session reminders', desc: 'Reminder 24h and 1h before each session', defaultOn: true },
                      { label: 'New messages', desc: 'When a teacher sends you a message', defaultOn: true },
                      { label: 'Booking confirmations', desc: 'When a session is confirmed or cancelled', defaultOn: true },
                      { label: 'New teacher reviews', desc: 'When teachers you follow get new reviews', defaultOn: false },
                      { label: 'Platform updates', desc: 'New features and platform news', defaultOn: false },
                    ].map(notif => (
                      <NotifRow key={notif.label} {...notif} />
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
                    <div className="px-6 py-5 border-b border-[rgba(13,27,42,0.06)]">
                      <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.1rem', color: '#0D1B2A' }}>Change Password</h2>
                    </div>
                    <div className="p-6 space-y-4">
                      {['Current Password', 'New Password', 'Confirm New Password'].map(label => (
                        <div key={label}>
                          <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>{label}</label>
                          <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all text-sm" />
                        </div>
                      ))}
                      <button className="bg-[#0D1B2A] text-white px-5 py-2 rounded-xl text-sm hover:bg-[#1a2d45] transition-colors" style={{ fontWeight: 600 }}>
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                    <h3 className="text-red-800 flex items-center gap-2 mb-2" style={{ fontWeight: 600 }}>
                      <AlertTriangle className="w-4 h-4" /> Delete Account
                    </h3>
                    <p className="text-red-700 text-sm mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
                    <button className="px-4 py-2 border border-red-300 text-red-700 rounded-xl text-sm hover:bg-red-100 transition-colors">
                      Delete My Account
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'teacher' && (
                <div className="bg-white rounded-2xl border border-[rgba(13,27,42,0.06)] overflow-hidden">
                  <div className="px-6 py-5 border-b border-[rgba(13,27,42,0.06)]">
                    <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.1rem', color: '#0D1B2A' }}>Teacher Mode</h2>
                    <p className="text-[#9CA3AF] text-xs mt-0.5">Enable to create a teacher profile and accept bookings</p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between p-4 bg-[#F8F6F1] rounded-xl mb-6">
                      <div>
                        <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>Teacher Mode</p>
                        <p className="text-[#9CA3AF] text-xs mt-0.5">
                          {teacherMode ? 'Active — your profile is visible to students' : 'Disabled — your teacher profile is hidden'}
                        </p>
                      </div>
                      <button
                        onClick={() => setTeacherMode(!teacherMode)}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${teacherMode ? 'bg-[#C8962A]' : 'bg-[#E5E0D8]'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${teacherMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>

                    {teacherMode ? (
                      <Link to="/settings/teacher" className="flex items-center justify-between p-4 border border-[rgba(13,27,42,0.1)] rounded-xl hover:border-[#C8962A]/30 hover:bg-[#F8F6F1] transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#C8962A]/15 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-[#C8962A]" />
                          </div>
                          <div>
                            <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 600 }}>Edit Teacher Profile</p>
                            <p className="text-[#9CA3AF] text-xs">Headline, bio, skills, pricing, availability</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#C8962A] transition-colors" />
                      </Link>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-[#9CA3AF] text-sm">Enable teacher mode to start accepting student bookings and earning from your expertise.</p>
                        <button
                          onClick={() => setTeacherMode(true)}
                          className="mt-4 px-5 py-2 bg-[#0D1B2A] text-white rounded-xl text-sm hover:bg-[#1a2d45] transition-colors"
                          style={{ fontWeight: 600 }}
                        >
                          Enable Teacher Mode
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function NotifRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <div>
        <p className="text-[#0D1B2A] text-sm" style={{ fontWeight: 500 }}>{label}</p>
        <p className="text-[#9CA3AF] text-xs mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4 ${on ? 'bg-[#C8962A]' : 'bg-[#E5E0D8]'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
