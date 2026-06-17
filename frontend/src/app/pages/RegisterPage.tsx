import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, BookOpen } from 'lucide-react';
import * as authAPI from '../../api/auth';

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', password2: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (form.password !== form.password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(form);
      navigate('/verify-email?email=' + encodeURIComponent(form.email));
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-[#0D1B2A] flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1581726690015-c9861fa5057f?w=900&h=1200&fit=crop&auto=format"
            alt="Teaching"
            className="w-full h-full object-cover opacity-15"
          />
        </div>
        <div className="relative z-10 text-center max-w-lg">
          <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '2rem', color: 'white' }}>
            Join thousands of learners
          </h2>
          <p className="text-[#9CA3AF] mt-4">Get access to verified teachers and flexible booking</p>
        </div>
      </div>

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
            <p className="text-[#6B7280] mt-2">Start learning in minutes</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">{error}</div>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>First name</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={e => setForm({...form, first_name: e.target.value})}
                  placeholder="Omar"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Last name</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={e => setForm({...form, last_name: e.target.value})}
                  placeholder="Hassan"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all disabled:opacity-50"
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
                disabled={loading}
                required
                className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all disabled:opacity-50"
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
              <label className="block text-sm text-[#0D1B2A] mb-1.5" style={{ fontWeight: 500 }}>Confirm password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password2}
                onChange={e => setForm({...form, password2: e.target.value})}
                placeholder="Confirm password"
                disabled={loading}
                required
                className="w-full px-4 py-3 rounded-xl border border-[rgba(13,27,42,0.15)] bg-white text-[#0D1B2A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C8962A]/30 focus:border-[#C8962A] transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C8962A] text-white rounded-xl font-semibold hover:bg-[#B07F1F] transition-colors duration-150 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <p className="text-xs text-[#9CA3AF] text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#C8962A] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
