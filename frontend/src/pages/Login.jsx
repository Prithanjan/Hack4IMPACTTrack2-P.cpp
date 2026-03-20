import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn({ email: form.email, password: form.password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-[var(--color-primary)] rounded-2xl flex items-center justify-center shadow-xl shadow-[var(--color-primary)]/30 mb-4">
            <span className="material-symbols-outlined text-[var(--color-on-primary)] text-3xl">psychology</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)] tracking-tight">MediScan AI</h1>
          <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest mt-1">Clinical Engine</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/30 p-8 shadow-xl shadow-black/10">
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-1">Sign in</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mb-8">Access your clinical dashboard</p>

          {error && (
            <div className="mb-6 px-4 py-3 bg-[var(--color-error-container)]/20 border border-[var(--color-error)]/30 rounded-xl text-sm text-[var(--color-error)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="doctor@hospital.com"
                className="w-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[var(--color-primary)] transition-all placeholder:text-[var(--color-outline)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[var(--color-primary)] transition-all pr-12 placeholder:text-[var(--color-outline)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] shadow-lg shadow-[var(--color-primary-container)]/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              ) : (
                <LogIn size={18} />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--color-on-surface-variant)] mt-8">
            New to MediScan?{' '}
            <Link to="/signup" className="text-[var(--color-primary)] font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-[var(--color-outline)] mt-6 uppercase tracking-widest">
          HIPAA Compliant · AES-256 Encrypted
        </p>
      </div>
    </div>
  );
}
