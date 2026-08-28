import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import client from '../api/client';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Already logged in → go straight to dashboard
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      // Register the user
      await client.post('/auth/register', { displayName, email, password });
      // Auto-login immediately after registration
      const loginRes = await client.post('/auth/login', { email, password });
      await login(loginRes.data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>

      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', animationDelay: '1.5s' }} />

        <div className="relative z-10 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              ⚡
            </div>
            <span className="text-3xl font-black text-white tracking-tight">HabitFlow</span>
          </div>

          <h1 className="text-5xl font-black text-white mb-4 leading-tight">
            Start your<br />
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              transformation.
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm mx-auto mb-12">
            Join thousands building better habits every day. Free forever. No credit card needed.
          </p>

          {/* Social proof */}
          <div className="flex flex-col gap-3">
            {[
              { emoji: '🏆', stat: '1,000+', label: 'Habits tracked daily' },
              { emoji: '🔥', stat: '94%', label: 'Users hit their goals' },
              { emoji: '🤖', stat: 'AI-first', label: 'Personalized coaching' },
            ].map(({ emoji, stat, label }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-3 rounded-xl text-left"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-xl">{emoji}</span>
                <div>
                  <div className="text-white font-black text-sm">{stat}</div>
                  <div className="text-slate-400 text-xs">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>⚡</div>
            <span className="text-2xl font-black text-white">HabitFlow</span>
          </div>

          <div className="rounded-2xl p-8" style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
            <p className="text-slate-400 text-sm mb-8">Free forever. No credit card required.</p>

            {error && (
              <div className="mb-5 rounded-xl px-4 py-3 text-sm font-medium text-red-300 flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Name</label>
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)'}
                  onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'}
                  placeholder="Alex Johnson"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)'}
                  onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all pr-12"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={e => e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)'}
                    onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition text-sm">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
                <input
                  id="register-confirm-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)'}
                  onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {/* Submit */}
              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 text-white font-bold text-sm transition-all duration-200 mt-2"
                style={{
                  background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(99,102,241,0.6)'; }}
                onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'; }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    Creating account...
                  </span>
                ) : 'Create Free Account'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5 text-center">
              <p className="text-slate-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition">
                  Sign in →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
