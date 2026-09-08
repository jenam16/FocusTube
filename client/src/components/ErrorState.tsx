import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  backLink?: string;
  backLabel?: string;
  className?: string;
}

export const ErrorState = ({
  title = 'Unable to load your courses',
  message = 'Please check your connection and try again.',
  onRetry,
  isRetrying = false,
  backLink,
  backLabel = 'Go back to Courses',
  className = '',
}: ErrorStateProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-12 text-center ${className}`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-gray-400 leading-relaxed">
        {message}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {backLink && (
          <Link
            to={backLink}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </Link>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`}
            />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
};
