import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, BookOpen, Bell, ChevronDown, LogOut, Settings, User, LayoutDashboard, GraduationCap } from 'lucide-react';
import { getProfile } from '../../api/profile';

const NAV_LINKS = [
  { label: 'Find Teachers', href: '/search' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Become a Teacher', href: '/settings/teacher' },
];

export function Navbar({ isLoggedIn = false, isTeacher = false }: { isLoggedIn?: boolean; isTeacher?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('muallim_access_token');
    if (!token || !isLoggedIn) return;
    (async () => {
      try {
        const data = await getProfile(token);
        setProfile(data);
      } catch (err) {
        console.error('Navbar failed to load profile:', err);
      }
    })();
  }, [isLoggedIn]);

  const isActive = (href: string) => location.pathname === href;

  const displayName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username : 'User';
  const avatarUrl = profile?.profile_picture || profile?.profile_picture_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&auto=format';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[rgba(13,27,42,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#0D1B2A] rounded-lg flex items-center justify-center group-hover:bg-[#C8962A] transition-colors duration-200">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-[#0D1B2A] tracking-tight" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.25rem' }}>
              muallim
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => {
              if (link.label === 'How It Works') {
                return (
                  <button
                    key={link.href}
                    onClick={() => setHowItWorksOpen(true)}
                    className="px-4 py-2 rounded-lg text-sm text-[#6B7280] hover:text-[#0D1B2A] hover:bg-[#F8F6F1] transition-colors duration-150"
                  >
                    {link.label}
                  </button>
                );
              }
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors duration-150 ${
                    isActive(link.href)
                      ? 'text-[#0D1B2A] bg-[#F8F6F1]'
                      : 'text-[#6B7280] hover:text-[#0D1B2A] hover:bg-[#F8F6F1]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button className="relative p-2 text-[#6B7280] hover:text-[#0D1B2A] hover:bg-[#F8F6F1] rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C8962A] rounded-full" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F8F6F1] transition-colors"
                  >
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-sm text-[#0D1B2A]">{displayName}</span>
                    <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-[rgba(13,27,42,0.08)] overflow-hidden py-1">
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0D1B2A] hover:bg-[#F8F6F1] transition-colors" onClick={() => setProfileOpen(false)}>
                        <LayoutDashboard className="w-4 h-4 text-[#6B7280]" /> My Dashboard
                      </Link>
                      {(isTeacher || profile?.user_type === 'both' || profile?.user_type === 'teacher') && (
                        <Link to="/teacher-dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0D1B2A] hover:bg-[#F8F6F1] transition-colors" onClick={() => setProfileOpen(false)}>
                          <GraduationCap className="w-4 h-4 text-[#6B7280]" /> Teacher Dashboard
                        </Link>
                      )}
                      {(profile?.is_staff || profile?.is_superuser) && (
                        <Link to="/admin-dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0D1B2A] hover:bg-[#F8F6F1] transition-colors" onClick={() => setProfileOpen(false)}>
                          <User className="w-4 h-4 text-[#6B7280]" /> Admin Panel
                        </Link>
                      )}
                      <Link to="/messages" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0D1B2A] hover:bg-[#F8F6F1] transition-colors" onClick={() => setProfileOpen(false)}>
                        <Bell className="w-4 h-4 text-[#6B7280]" /> Messages <span className="ml-auto bg-[#C8962A] text-white text-xs px-1.5 py-0.5 rounded-full">2</span>
                      </Link>
                      <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0D1B2A] hover:bg-[#F8F6F1] transition-colors" onClick={() => setProfileOpen(false)}>
                        <Settings className="w-4 h-4 text-[#6B7280]" /> Settings
                      </Link>
                      <div className="border-t border-[rgba(13,27,42,0.06)] my-1" />
                      <Link to="/login" className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors" onClick={() => setProfileOpen(false)}>
                        <LogOut className="w-4 h-4" /> Sign Out
                      </Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm text-[#0D1B2A] hover:bg-[#F8F6F1] rounded-lg transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm bg-[#0D1B2A] text-white rounded-lg hover:bg-[#1a2d45] transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[#0D1B2A] hover:bg-[#F8F6F1] rounded-lg transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[rgba(13,27,42,0.08)] px-4 py-4 space-y-1">
          {NAV_LINKS.map(link => {
            if (link.label === 'How It Works') {
              return (
                <button
                  key={link.href}
                  onClick={() => {
                    setHowItWorksOpen(true);
                    setMobileOpen(false);
                  }}
                  className="w-full text-left block px-4 py-2.5 text-sm text-[#0D1B2A] hover:bg-[#F8F6F1] rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              );
            }
            return (
              <Link
                key={link.href}
                to={link.href}
                className="block px-4 py-2.5 text-sm text-[#0D1B2A] hover:bg-[#F8F6F1] rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-[rgba(13,27,42,0.08)] mt-3 flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="px-4 py-2.5 text-sm text-[#0D1B2A] hover:bg-[#F8F6F1] rounded-lg flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <Link to="/settings" className="px-4 py-2.5 text-sm text-[#0D1B2A] hover:bg-[#F8F6F1] rounded-lg flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="w-full px-4 py-2.5 text-sm text-center text-[#0D1B2A] border border-[rgba(13,27,42,0.15)] rounded-lg" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className="w-full px-4 py-2.5 text-sm text-center bg-[#0D1B2A] text-white rounded-lg" onClick={() => setMobileOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* How It Works Modal */}
      {howItWorksOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[rgba(13,27,42,0.08)] relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setHowItWorksOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-[#0D1B2A] hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h2 className="text-xl text-[#0D1B2A] mb-5" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700 }}>
              How Muallim Works
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#C8962A]/10 text-[#C8962A] flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                <div>
                  <p className="font-semibold text-[#0D1B2A] text-sm">Find a Teacher</p>
                  <p className="text-xs text-gray-500 mt-0.5">Search and select a qualified teacher matching your learning goals.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0D1B2A]/10 text-[#0D1B2A] flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                <div>
                  <p className="font-semibold text-[#0D1B2A] text-sm">Book a Slot</p>
                  <p className="text-xs text-gray-500 mt-0.5">Pick a convenient date and time slot, then pay to confirm your booking.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#C8962A]/10 text-[#C8962A] flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                <div>
                  <p className="font-semibold text-[#0D1B2A] text-sm">Start Learning</p>
                  <p className="text-xs text-gray-500 mt-0.5">Join the session via the Google Meet link generated on your dashboard.</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setHowItWorksOpen(false)}
              className="w-full mt-6 bg-[#0D1B2A] hover:bg-[#1a2d45] text-white py-2.5 rounded-xl text-sm transition-colors font-semibold"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
