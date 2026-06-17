import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, BookOpen } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
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
              Welcome back
            </h1>
            <p className="text-[#6B7280] mt-2">Sign in to continue your learning journey</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">{error}</div>}

          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed. Please try again.')}
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(13,27,42,0.1)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-[#9CA3AF] text-sm">Sign in with email</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>
                Email or username
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com or harisfayyaz"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all disabled:opacity-50"
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
                  disabled={loading}
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#0D1B2A]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C8962A] text-white rounded-xl font-semibold hover:bg-[#B07F1F] transition-colors duration-150 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-[#6B7280] text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#C8962A] font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-[#F8F6F1] flex-col justify-center items-center p-12">
        <div className="text-center max-w-lg">
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2rem', color: '#0D1B2A' }}>
            Connect with expert tutors
          </h2>
          <p className="text-[#6B7280] mt-4">
            Learn from experienced educators and expand your knowledge
          </p>
        </div>
      </div>
    </div>
  );
}
