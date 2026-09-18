import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks';

import { authService } from '../services/authService';
import { ApiRequestError } from '../services/api';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email verification required state
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isExistingUnverified, setIsExistingUnverified] = useState(false);
  const [isDeliveryFailed, setIsDeliveryFailed] = useState(false);
  const [deliveryErrorMessage, setDeliveryErrorMessage] = useState<string | null>(null);

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
    setIsDeliveryFailed(false);
    setDeliveryErrorMessage(null);
    setIsExistingUnverified(false);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      // If already verified or immediate auto-login enabled
      if (response.emailVerified) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setRegisteredEmail(response.email || email.trim());
      setIsRegistered(true);

      if (response.emailSent === false) {
        setIsDeliveryFailed(true);
        setDeliveryErrorMessage(
          response.message ||
            "Your account was created, but we couldn't send the verification email."
        );
      }
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        const isUnverifiedAccount =
          err.data?.code === 'EMAIL_NOT_VERIFIED' ||
          err.status === 409 ||
          err.message.toLowerCase().includes('not yet verified') ||
          err.message.toLowerCase().includes("hasn't been verified");

        if (isUnverifiedAccount) {
          setRegisteredEmail(err.data?.email || email.trim());
          setIsExistingUnverified(true);
          setIsRegistered(true);
          setError(null);
          return;
        }

        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail || cooldownSeconds > 0 || isResending) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(null);

    try {
      const res = await authService.resendVerification(registeredEmail);
      setResendSuccess(
        res.message || 'Verification email sent! Please check your inbox.'
      );
      setCooldownSeconds(60);
      setIsDeliveryFailed(false);
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

          {!isRegistered && (
            <>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl font-heading">
                Create an account
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Start learning without distractions
              </p>
            </>
          )}
        </div>

        {/* 1. CHECK YOUR EMAIL VIEW (AFTER REGISTRATION OR EXISTING UNVERIFIED) */}
        {isRegistered ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0B101E] p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col items-center text-center py-2 space-y-4">
              <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10">
                <Mail className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white font-heading">
                  Check your email 📧
                </h2>

                {isExistingUnverified ? (
                  <p className="text-xs sm:text-sm text-amber-300 font-medium">
                    An account with this email already exists but hasn&apos;t been
                    verified yet.
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-300">
                    We&apos;ve sent a verification link to:
                  </p>
                )}

                <div className="inline-block rounded-lg bg-[#070B14] border border-white/[0.08] px-3.5 py-1.5 font-mono text-sm font-semibold text-indigo-300">
                  {registeredEmail}
                </div>

                {isDeliveryFailed ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-left space-y-1 mt-2">
                    <p className="text-xs font-semibold text-amber-300">
                      Your account was created, but we couldn&apos;t send the
                      verification email.
                    </p>
                    {deliveryErrorMessage && deliveryErrorMessage.includes('testing emails') && (
                      <p className="text-[11px] text-amber-200/80 leading-relaxed">
                        Sandbox restriction: <code>onboarding@resend.dev</code> only delivers to your Resend account owner email.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="pt-1 text-xs text-slate-400 max-w-sm">
                    {isExistingUnverified
                      ? "Didn't receive the email? Click below to request a new verification link."
                      : 'Click the link in your email to verify your account and start your focused learning journey.'}
                  </p>
                )}
              </div>

              {resendSuccess && (
                <div className="w-full flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{resendSuccess}</span>
                </div>
              )}

              {resendError && (
                <div className="w-full flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{resendError}</span>
                </div>
              )}

              <div className="w-full space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || cooldownSeconds > 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Mail className="h-4 w-4" />
                  <span>
                    {isResending
                      ? 'Sending...'
                      : cooldownSeconds > 0
                        ? `Resend available in ${cooldownSeconds}s`
                        : isDeliveryFailed
                          ? 'Try Again'
                          : 'Resend Verification Email'}
                  </span>
                </button>

                <p className="text-[11px] text-slate-500">
                  You can request another email after 60 seconds.
                </p>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <Link
                    to="/login"
                    className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 2. REGISTRATION FORM VIEW */
          <div className="rounded-2xl border border-white/[0.08] bg-[#0B101E] p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="block w-full rounded-xl border border-white/[0.08] bg-[#070B14] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                />
              </div>

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
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-white/[0.08] bg-[#070B14] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-white/[0.08] bg-[#070B14] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0B101E] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

