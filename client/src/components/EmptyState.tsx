import { ReactNode } from 'react';
import { BookOpen, PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-app bg-surface/60 px-6 py-16 text-center backdrop-blur-xs ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-500 shadow-sm">
        {icon || <BookOpen className="h-6 w-6" />}
      </div>
      <h2 className="text-lg font-bold text-primary font-heading">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-secondary leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
