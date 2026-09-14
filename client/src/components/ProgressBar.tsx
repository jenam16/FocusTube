interface ProgressBarProps {
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  color?: 'indigo' | 'emerald' | 'amber';
  className?: string;
}

export const ProgressBar = ({
  progress = 0,
  size = 'sm',
  showLabel = false,
  color,
  className = '',
}: ProgressBarProps) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const isCompleted = clampedProgress >= 100;

  const heightClass =
    size === 'sm' ? 'h-2' : size === 'lg' ? 'h-3.5' : 'h-2.5';

  const fillGradient =
    color === 'emerald' || (isCompleted && !color)
      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
      : color === 'amber'
      ? 'bg-gradient-to-r from-amber-500 to-orange-400'
      : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-teal-400';

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
          <span>Progress</span>
          <span
            className={`font-semibold ${
              isCompleted ? 'text-emerald-400' : 'text-slate-300'
            }`}
          >
            {clampedProgress}% complete
          </span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-800/80 border border-white/[0.04] ${heightClass}`}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${fillGradient}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
