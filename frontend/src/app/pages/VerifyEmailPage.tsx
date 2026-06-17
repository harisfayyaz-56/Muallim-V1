import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { BookOpen, Mail } from 'lucide-react';
import * as authAPI from '../../api/auth';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'waiting' | 'error'>('waiting');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const navigate = useNavigate();

  useEffect(() => {
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');
    
    if (uid && token) {
      verifyEmail(uid, token);
    }
  }, [searchParams]);

  const verifyEmail = async (uid: string, token: string) => {
    try {
      await authAPI.verifyEmail({ uid, token });
      navigate('/login?verified=true');
    } catch (err) {
      setStatus('error');
      console.error(err);
    }
  };

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

          {status === 'waiting' ? (
            <>
              <div className="relative w-20 h-20 bg-[#F8F6F1] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-[#C8962A]" />
              </div>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem', color: '#0D1B2A' }}>
                Verify your email
              </h1>
              <p className="text-[#6B7280] mt-3 text-sm leading-relaxed max-w-sm mx-auto">
                We've sent a verification link to <strong className="text-[#0D1B2A]">{email}</strong>. Click the link in your email to verify.
              </p>

              <div className="mt-8 bg-[#F8F6F1] rounded-xl p-4 text-left space-y-3">
                <p className="text-sm text-[#0D1B2A]" style={{ fontWeight: 600 }}>What happens next?</p>
                {[
                  { step: '1', text: 'Click the verification link in your email' },
                  { step: '2', text: 'Your email will be verified instantly' },
                  { step: '3', text: 'You can now book sessions' },
                ].map(item => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#0D1B2A] text-white flex items-center justify-center text-xs shrink-0">
                      {item.step}
                    </div>
                    <p className="text-[#6B7280] text-sm">{item.text}</p>
                  </div>
                ))}
              </div>

              <Link
                to="/login"
                className="w-full mt-6 bg-[#C8962A] hover:bg-[#B07F1F] text-white px-4 py-3 rounded-xl transition-colors duration-150 font-semibold inline-block"
              >
                Go to Login
              </Link>

              <p className="text-[#9CA3AF] text-xs mt-6">
                Wrong email?{' '}
                <Link to="/register" className="text-[#C8962A] hover:underline">Sign up again</Link>
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⚠️</span>
              </div>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem', color: '#0D1B2A' }}>
                Verification failed
              </h1>
              <p className="text-[#6B7280] mt-3 text-sm leading-relaxed">
                The verification link may have expired or is invalid. Please try registering again.
              </p>
              <Link
                to="/register"
                className="w-full mt-6 bg-[#C8962A] hover:bg-[#B07F1F] text-white px-4 py-3 rounded-xl transition-colors duration-150 font-semibold inline-block"
              >
                Register Again
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
