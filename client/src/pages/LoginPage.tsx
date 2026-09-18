import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, AlertCircle, Mail, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks';
import { authService } from '../services/authService';
import { ApiRequestError } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unverified email handling
  const [isUnverified, setIsUnverified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);
    setResendSuccess(null);
    setResendError(null);

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: email.trim(), password });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        const msg = err.message.toLowerCase();
        if (err.status === 403 || msg.includes('verify your email')) {
          setIsUnverified(true);
          setUnverifiedEmail(email.trim());
          setError(null);
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid email or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    const targetEmail = unverifiedEmail || email.trim();
    if (!targetEmail || cooldownSeconds > 0 || isResending) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(null);

    try {
      const res = await authService.resendVerification(targetEmail);
      setResendSuccess(
        res.message || 'Verification email sent. Please check your inbox.'
      );
      setCooldownSeconds(60);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setResendError(err.message);
      } else if (err instanceof Error) {
        setResendError(err.message);
      } else {
        setResendError('Failed to resend verification email.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#060913] px-4 py-12 text-slate-100 sm:px-6 lg:px-8 relative selection:bg-indigo-500/30 selection:text-white">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2.5 mb-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Play className="h-5 w-5 fill-current" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-heading">
              Focus<span className="text-indigo-400">Tube</span>
            </span>
          </Link>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl font-heading">
            Welcome back
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Sign in to continue your distraction-free learning
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0B101E] p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Normal Error Alert */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Unverified Email Warning & Action Card */}
          {isUnverified && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 space-y-3">
              <div className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                <div className="space-y-1">
                  <p className="font-semibold text-white">
                    Your email hasn&apos;t been verified yet.
                  </p>
                  <p className="text-amber-300/80 leading-relaxed">
                    Please check your inbox to verify your account before signing in.
                  </p>
                </div>
              </div>

              {resendSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 p-2 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{resendSuccess}</span>
                </div>
              )}

              {resendError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-500/15 border border-rose-500/25 p-2 text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{resendError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || cooldownSeconds > 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 px-3 py-2 font-semibold text-amber-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {cooldownSeconds > 0 ? (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    <span>Resend available in {cooldownSeconds}s</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-3.5 w-3.5" />
                    <span>
                      {isResending ? 'Sending...' : 'Resend Verification Email'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full rounded-xl border border-white/[0.08] bg-[#070B14] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-white/[0.08] bg-[#070B14] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0B101E] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};


