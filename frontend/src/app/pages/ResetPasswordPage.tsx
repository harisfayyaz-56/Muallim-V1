import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import * as authAPI from '../../api/auth';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!uid || !token) {
      setError('Invalid reset link');
      return;
    }

    setLoading(true);
    try {
      await authAPI.passwordResetConfirm({
        uid,
        token,
        new_password: newPassword,
        new_password2: confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-[rgba(13,27,42,0.08)] p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">✓</span>
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.5rem', color: '#0D1B2A' }}>
              Password reset successfully
            </h1>
            <p className="text-[#6B7280] mt-3 text-sm">
              Your password has been reset. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="mb-8">
            <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '1.75rem', color: '#0D1B2A' }}>
              Reset your password
            </h1>
            <p className="text-[#6B7280] mt-2 text-sm leading-relaxed">
              Enter your new password below.
            </p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">{error}</div>}

          {!uid || !token ? (
            <div className="bg-red-100 border border-red-300 p-4 rounded-lg text-sm text-red-800">
              Invalid reset link. Please request a new password reset.
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                    required
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

              <div>
                <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>
                  Confirm password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  disabled={loading}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C8962A] hover:bg-[#B07F1F] text-white px-4 py-3 rounded-xl transition-colors duration-150 font-semibold disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-[rgba(13,27,42,0.08)]">
            <Link to="/login" className="text-center block text-sm text-[#6B7280] hover:text-[#0D1B2A] transition-colors">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
