import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface CompletedBadgeProps {
  size?: 'xs' | 'sm' | 'md';
  showText?: boolean;
  className?: string;
}

export const CompletedBadge: React.FC<CompletedBadgeProps> = ({
  size = 'sm',
  showText = true,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 transition-colors shadow-xs ${sizeClasses[size]} ${className}`}
      aria-label="Completed"
    >
      <CheckCircle2 className={`${iconSizes[size]} shrink-0 text-emerald-400`} />
      {showText && <span>Completed</span>}
    </span>
  );
};
