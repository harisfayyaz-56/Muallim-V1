import { Link } from 'react-router';
import { BookOpen, Mail, ArrowRight, RefreshCw } from 'lucide-react';

export function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-[rgba(13,27,42,0.08)] p-8 text-center">
          <Link to="/" className="flex items-center gap-2 justify-center mb-8">
            <div className="w-8 h-8 bg-[#0D1B2A] rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.25rem', color: '#0D1B2A' }}>
              muallim
            </span>
          </Link>

          {/* Icon */}
          <div className="relative w-20 h-20 bg-[#F8F6F1] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-[#C8962A]" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>

          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem', color: '#0D1B2A' }}>
            Verify your email
          </h1>
          <p className="text-[#6B7280] mt-3 text-sm leading-relaxed max-w-sm mx-auto">
            We've sent a verification link to <strong className="text-[#0D1B2A]">omar.hassan@example.com</strong>. Click the link in the email to activate your account.
          </p>

          <div className="mt-8 bg-[#F8F6F1] rounded-xl p-4 text-left space-y-3">
            <p className="text-sm text-[#0D1B2A]" style={{ fontWeight: 600 }}>What happens next?</p>
            {[
              { step: '1', text: 'Click the verification link in your email' },
              { step: '2', text: 'Your account will be activated instantly' },
              { step: '3', text: 'Start browsing and booking sessions' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0D1B2A] text-white flex items-center justify-center text-xs shrink-0">
                  {item.step}
                </div>
                <p className="text-[#6B7280] text-sm">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <Link
              to="/dashboard"
              className="w-full flex items-center justify-center gap-2 bg-[#0D1B2A] hover:bg-[#1a2d45] text-white px-4 py-3 rounded-xl transition-colors duration-150"
            >
              Continue to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[rgba(13,27,42,0.15)] rounded-xl text-[#6B7280] hover:bg-[#F8F6F1] transition-colors text-sm">
              <RefreshCw className="w-4 h-4" /> Resend verification email
            </button>
          </div>

          <p className="text-[#9CA3AF] text-xs mt-6">
            Wrong email?{' '}
            <Link to="/register" className="text-[#C8962A] hover:underline">Go back and change it</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
