import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  Play,
  ArrowRight,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { useAuth } from '../hooks';
import { authService } from '../services/authService';
import { ApiRequestError } from '../services/api';

type VerificationStatus =
  | 'loading'
  | 'success'
  | 'expired'
  | 'invalid'
  | 'already_verified'
  | 'error';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuthenticatedUser } = useAuth();

  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const verificationAttempted = useRef(false);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Redirect countdown effect on success
  useEffect(() => {
    if (status !== 'success' && status !== 'already_verified') return;
    if (redirectCountdown <= 0) {
      navigate('/dashboard', { replace: true });
      return;
    }

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, redirectCountdown, navigate]);

  const executeVerification = async (verifyToken: string) => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const response = await authService.verifyEmail(verifyToken);
      // Automatically establish session in auth context
      setAuthenticatedUser(response.user);
      setStatus('success');
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        const message = err.message.toLowerCase();
        if (message.includes('expired')) {
          setStatus('expired');
          setErrorMessage(err.message);
        } else if (message.includes('already verified')) {
          setStatus('already_verified');
        } else if (
          message.includes('invalid') ||
          message.includes('already been used') ||
          message.includes('missing')
        ) {
          setStatus('invalid');
          setErrorMessage(err.message);
        } else {
          setStatus('error');
          setErrorMessage(err.message);
        }
      } else if (err instanceof Error) {
        setStatus('error');
        setErrorMessage(err.message);
      } else {
        setStatus('error');
        setErrorMessage('Failed to verify email. Please try again.');
      }
    }
  };

  useEffect(() => {
    // If the logged-in user is already verified and landed here
    if (isAuthenticated && user?.emailVerified) {
      setStatus('already_verified');
      return;
    }

    if (!token || !token.trim()) {
      setStatus('invalid');
      setErrorMessage('No verification token was provided in the link.');
      return;
    }

    if (!verificationAttempted.current) {
      verificationAttempted.current = true;
      executeVerification(token.trim());
    }
  }, [token, isAuthenticated, user]);

  const handleResend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resendEmail.trim() || cooldownSeconds > 0 || isResending) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(null);

    try {
      const result = await authService.resendVerification(resendEmail.trim());
      setResendSuccess(
        result.message || 'Verification email sent. Please check your inbox.'
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
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
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
        </div>

        {/* Verification Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0B101E] p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* 1. LOADING STATE */}
          {status === 'loading' && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="relative flex items-center justify-center h-16 w-16">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                <div className="h-12 w-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-white font-heading">
                  Verifying your email...
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Please wait while we confirm your email and set up your session.
                </p>
              </div>
            </div>
          )}

          {/* 2. SUCCESS STATE */}
          {status === 'success' && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-white font-heading">
                  Email verified successfully!
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  You&apos;re all set. Redirecting to your dashboard in{' '}
                  <span className="text-indigo-400 font-semibold font-mono">
                    {redirectCountdown}s
                  </span>
                  ...
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard', { replace: true })}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 3. ALREADY VERIFIED STATE */}
          {status === 'already_verified' && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-white font-heading">
                  Already Verified
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Your email is already verified. Redirecting to your dashboard in{' '}
                  <span className="text-indigo-400 font-semibold font-mono">
                    {redirectCountdown}s
                  </span>
                  ...
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard', { replace: true })}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 4. EXPIRED STATE */}
          {status === 'expired' && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/10">
                <Clock className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-white font-heading">
                  Verification Link Expired
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  This verification link has expired. Verification links are valid
                  for 30 minutes. Please request a new verification email below.
                </p>
              </div>

              {resendSuccess && (
                <div className="w-full text-left rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-medium">
                  {resendSuccess}
                </div>
              )}

              {resendError && (
                <div className="w-full text-left rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-medium">
                  {resendError}
                </div>
              )}

              <form onSubmit={handleResend} className="w-full space-y-3 mt-2">
                <div className="text-left">
                  <label
                    htmlFor="resend-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1"
                  >
                    Your Account Email
                  </label>
                  <input
                    id="resend-email"
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full rounded-xl border border-white/[0.08] bg-[#070B14] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isResending || cooldownSeconds > 0 || !resendEmail.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Mail className="h-4 w-4" />
                  <span>
                    {isResending
                      ? 'Sending...'
                      : cooldownSeconds > 0
                        ? `Resend in ${cooldownSeconds}s`
                        : 'Resend Verification Email'}
                  </span>
                </button>
              </form>

              <div className="pt-2 text-center text-xs text-slate-400">
                <Link
                  to="/login"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* 5. INVALID OR ALREADY USED STATE */}
          {status === 'invalid' && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-lg shadow-rose-500/10">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-white font-heading">
                  Invalid or Used Link
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  {errorMessage ||
                    'This verification link is invalid or has already been used.'}
                </p>
              </div>

              {resendSuccess && (
                <div className="w-full text-left rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-medium">
                  {resendSuccess}
                </div>
              )}

              {resendError && (
                <div className="w-full text-left rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-medium">
                  {resendError}
                </div>
              )}

              <div className="w-full space-y-3 pt-2">
                <Link
                  to="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0B101E] px-2 text-slate-500">
                      Need a new link?
                    </span>
                  </div>
                </div>

                <form onSubmit={handleResend} className="space-y-2.5 text-left">
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="block w-full rounded-xl border border-white/[0.08] bg-[#070B14] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                  />
                  <button
                    type="submit"
                    disabled={isResending || cooldownSeconds > 0 || !resendEmail.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#0D1527] px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-[#111c34] hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>
                      {isResending
                        ? 'Sending...'
                        : cooldownSeconds > 0
                          ? `Resend in ${cooldownSeconds}s`
                          : 'Send New Verification Link'}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 6. SERVER / NETWORK ERROR STATE */}
          {status === 'error' && (
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-lg shadow-rose-500/10">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-white font-heading">
                  Verification Failed
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  {errorMessage ||
                    "We couldn't verify your email right now. Please check your connection and try again."}
                </p>
              </div>

              <div className="flex flex-col w-full gap-2.5 pt-2">
                {token && (
                  <button
                    onClick={() => executeVerification(token)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Try Again</span>
                  </button>
                )}
                <Link
                  to="/login"
                  className="flex w-full items-center justify-center rounded-xl border border-white/[0.08] bg-[#0D1527] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-[#111c34] hover:text-white transition-all"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
