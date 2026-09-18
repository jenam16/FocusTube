import { useState, useEffect, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Play, AlertCircle, CheckCircle2, Lock, ArrowLeft, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';
import { ApiRequestError } from '../services/api';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExpiredOrInvalid, setIsExpiredOrInvalid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Countdown timer for automatic redirect on success
  useEffect(() => {
    if (!isSuccess) return;
    if (countdown <= 0) {
      navigate('/login', { replace: true });
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Password reset token is missing.');
      setIsExpiredOrInvalid(true);
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.resetPassword({ token, password });
      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        const msg = err.message.toLowerCase();
        if (msg.includes('expired') || msg.includes('invalid') || err.status === 400) {
          setIsExpiredOrInvalid(true);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
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
            Set new password
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Create a strong, secure password for your account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0B101E] p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Missing Token State */}
          {!token && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Invalid Reset Link</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  The password reset link is missing a valid token or has been malformed. Please request a new link.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Request New Reset Link
              </Link>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          )}

          {/* Success State */}
          {token && isSuccess && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Password Reset Complete</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Your password has been successfully updated. You can now sign in with your new credentials.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Redirecting to sign in page in {countdown}s...
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Sign In Now
              </Link>
            </div>
          )}

          {/* Form State */}
          {token && !isSuccess && (
            <>
              {error && (
                <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400 space-y-2">
                  <div className="flex items-center gap-2.5 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  {isExpiredOrInvalid && (
                    <div className="pt-1">
                      <Link
                        to="/forgot-password"
                        className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                      >
                        Request a new reset link &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-xl border border-white/[0.08] bg-[#070B14] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                    />
                    <Lock className="absolute right-3.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-xl border border-white/[0.08] bg-[#070B14] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                    />
                    <KeyRound className="absolute right-3.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !password || !confirmPassword}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0B101E] disabled:opacity-50 cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  <span>{isSubmitting ? 'Resetting password...' : 'Reset Password'}</span>
                </button>
              </form>

              <div className="mt-6 border-t border-white/[0.06] pt-5 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
