import { useState } from 'react';
import { Link } from 'react-router';
import { BookOpen, ArrowRight, ArrowLeft, Mail } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-[rgba(13,27,42,0.08)] p-8">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#0D1B2A] rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.25rem', color: '#0D1B2A' }}>
              muallim
            </span>
          </Link>

          {!submitted ? (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-[#F8F6F1] rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-[#C8962A]" />
                </div>
                <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem', color: '#0D1B2A' }}>
                  Reset your password
                </h1>
                <p className="text-[#6B7280] mt-2 text-sm leading-relaxed">
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#0D1B2A] hover:bg-[#1a2d45] text-white px-4 py-3 rounded-xl transition-colors duration-150"
                >
                  Send Reset Link <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.5rem', color: '#0D1B2A' }}>
                Check your inbox
              </h2>
              <p className="text-[#6B7280] mt-2 text-sm leading-relaxed">
                We've sent a password reset link to <strong className="text-[#0D1B2A]">{email}</strong>. The link will expire in 30 minutes.
              </p>
              <p className="text-[#9CA3AF] text-xs mt-4">
                Didn't receive it?{' '}
                <button onClick={() => setSubmitted(false)} className="text-[#C8962A] hover:underline">
                  Try again
                </button>
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-[rgba(13,27,42,0.08)]">
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-[#6B7280] hover:text-[#0D1B2A] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
