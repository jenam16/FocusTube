import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Play, AlertCircle, Mail, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import { ApiRequestError } from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    if (!email.trim() || isSubmitting || cooldownSeconds > 0) return;

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await authService.forgotPassword(email.trim());
      setSuccessMessage(
        res.message || "If an account exists for this email, we've sent a password reset link."
      );
      setCooldownSeconds(60);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send reset link. Please try again.');
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
            Reset your password
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0B101E] p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message Banner */}
          {successMessage && (
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 space-y-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                <div className="space-y-1">
                  <p className="font-semibold text-white">Reset link sent</p>
                  <p className="text-emerald-300/85 leading-relaxed">{successMessage}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                The link expires in 30 minutes. If you don't see it, check your spam folder.
              </p>
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

            <button
              type="submit"
              disabled={isSubmitting || cooldownSeconds > 0}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0B101E] disabled:opacity-50 cursor-pointer"
            >
              {cooldownSeconds > 0 ? (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Resend in {cooldownSeconds}s</span>
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  <span>{isSubmitting ? 'Sending link...' : 'Send Reset Link'}</span>
                </>
              )}
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
        </div>
      </div>
    </div>
  );
};
