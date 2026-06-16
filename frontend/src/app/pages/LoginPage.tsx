import { useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, BookOpen, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex">
      {/* Left: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
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
              Welcome back
            </h1>
            <p className="text-[#6B7280] mt-2">Sign in to continue your learning journey</p>
          </div>

          {/* Google Sign In */}
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
              <span className="px-3 bg-white text-[#9CA3AF] text-sm">or sign in with email</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={e => e.preventDefault()}>
            <div>
              <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm text-[#0D1B2A]" style={{ fontWeight: 500 }}>
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-[#C8962A] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Link
              to="/dashboard"
              className="w-full flex items-center justify-center gap-2 bg-[#0D1B2A] hover:bg-[#1a2d45] text-white px-4 py-3 rounded-xl transition-colors duration-150 mt-2"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#C8962A] hover:underline" style={{ fontWeight: 600 }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Visual */}
      <div className="hidden lg:flex flex-1 flex-col justify-center relative overflow-hidden bg-[#0D1B2A]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=1200&fit=crop&auto=format"
            alt="Learning"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B2A]/60 via-[#0D1B2A]/40 to-[#C8962A]/20" />
        </div>
        <div className="relative z-10 px-12 xl:px-16">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8962A]/20 rounded-full border border-[#C8962A]/30 mb-6">
              <span className="w-2 h-2 bg-[#C8962A] rounded-full" />
              <span className="text-[#C8962A] text-sm">Trusted by 5,000+ learners in UAE</span>
            </div>
            <h2 className="text-white mb-4" style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.2 }}>
              Learn from the best teachers in the UAE
            </h2>
            <p className="text-[#9CA3AF] leading-relaxed">
              Expert-vetted teachers, flexible scheduling, and sessions tailored to your goals — all in AED.
            </p>
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-start gap-3 mb-3">
              <img
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&auto=format"
                alt="Student"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-white text-sm" style={{ fontWeight: 600 }}>Aisha Khalil</p>
                <p className="text-[#9CA3AF] text-xs">Software Developer, Dubai</p>
              </div>
            </div>
            <p className="text-white/80 text-sm leading-relaxed italic">
              "Muallim helped me find the perfect programming mentor. I landed my first dev job within 6 months of starting sessions."
            </p>
            <div className="flex gap-0.5 mt-3">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="w-4 h-4 fill-[#C8962A] text-[#C8962A]" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
