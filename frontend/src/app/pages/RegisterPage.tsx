import { useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, BookOpen, ArrowRight, Check } from 'lucide-react';

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });

  const passwordStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-emerald-400'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

  return (
    <div className="min-h-screen flex">
      {/* Left: Visual */}
      <div className="hidden lg:flex flex-1 flex-col justify-center relative overflow-hidden bg-[#0D1B2A]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1581726690015-c9861fa5057f?w=900&h=1200&fit=crop&auto=format"
            alt="Teaching"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B2A]/70 to-[#0D1B2A]/40" />
        </div>
        <div className="relative z-10 px-12 xl:px-16">
          <div className="mb-10">
            <h2 className="text-white mb-4" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.2 }}>
              Join 5,000+ learners across the UAE
            </h2>
            <p className="text-[#9CA3AF] leading-relaxed max-w-sm">
              Get access to verified teachers, flexible booking, and personalized sessions — all priced in AED.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '✓', title: 'Verified Teachers', desc: 'Every teacher is reviewed and approved by our team.' },
              { icon: '✓', title: 'Flexible Scheduling', desc: 'Book sessions at times that work for you in your timezone.' },
              { icon: '✓', title: 'Secure Payments', desc: 'All payments in AED with full purchase protection.' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="w-8 h-8 bg-[#C8962A] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm" style={{ fontWeight: 600 }}>{item.title}</p>
                  <p className="text-[#9CA3AF] text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-[#0D1B2A] rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.25rem', color: '#0D1B2A' }}>
              muallim
            </span>
          </Link>

          <div className="mb-8">
            <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2rem', color: '#0D1B2A', lineHeight: 1.2 }}>
              Create your account
            </h1>
            <p className="text-[#6B7280] mt-2">Start learning or teaching in minutes</p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-[#F8F6F1] rounded-xl p-1 mb-6">
            <button
              onClick={() => setRole('student')}
              className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-150 ${role === 'student' ? 'bg-white text-[#0D1B2A] shadow-sm' : 'text-[#6B7280]'}`}
              style={{ fontWeight: role === 'student' ? 600 : 400 }}
            >
              I'm a Student
            </button>
            <button
              onClick={() => setRole('teacher')}
              className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-150 ${role === 'teacher' ? 'bg-white text-[#0D1B2A] shadow-sm' : 'text-[#6B7280]'}`}
              style={{ fontWeight: role === 'teacher' ? 600 : 400 }}
            >
              I'm a Teacher
            </button>
          </div>

          {/* Google */}
          <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[rgba(13,27,42,0.15)] rounded-xl hover:bg-[#F8F6F1] transition-colors duration-150 mb-6">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm text-[#0D1B2A]">Continue with Google</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(13,27,42,0.1)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-[#9CA3AF] text-sm">or with email</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={e => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>First name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => setForm({...form, firstName: e.target.value})}
                  placeholder="Omar"
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Last name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => setForm({...form, lastName: e.target.value})}
                  placeholder="Hassan"
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-[#F0ECE4]'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-[#9CA3AF]">{strengthLabels[passwordStrength]}</span>
                </div>
              )}
            </div>

            <Link
              to="/verify-email"
              className="w-full flex items-center justify-center gap-2 bg-[#0D1B2A] hover:bg-[#1a2d45] text-white px-4 py-3 rounded-xl transition-colors duration-150"
            >
              Create Account <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-xs text-[#9CA3AF] text-center">
              By signing up, you agree to our{' '}
              <a href="#" className="text-[#C8962A] hover:underline">Terms of Service</a> and{' '}
              <a href="#" className="text-[#C8962A] hover:underline">Privacy Policy</a>
            </p>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#C8962A] hover:underline" style={{ fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
