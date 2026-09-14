import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  isRefetching?: boolean;
  backLink?: string;
  backLabel?: string;
  className?: string;
}

export const ErrorState = ({
  title = 'Unable to load your courses',
  message = 'Please check your connection and try again.',
  onRetry,
  isRetrying = false,
  isRefetching = false,
  backLink,
  backLabel = 'Go back to Courses',
  className = '',
}: ErrorStateProps) => {
  const isSpinning = isRetrying || isRefetching;

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#111827]/70 p-10 text-center backdrop-blur-xs ${className}`}
    >
      <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-100 font-heading">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-slate-400 leading-relaxed">
        {message}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {backLink && (
          <Link
            to={backLink}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </Link>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isSpinning}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 disabled:opacity-50 active:scale-[0.98]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isSpinning ? 'animate-spin' : ''}`}
            />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
};
