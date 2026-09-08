interface ProgressBarProps {
  progress?: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar = ({
  progress = 0,
  size = 'sm',
  showLabel = false,
  className = '',
}: ProgressBarProps) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
          <span>Progress</span>
          <span className="font-semibold text-gray-300">
            {clampedProgress}% complete
          </span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-gray-800 ${heightClass}`}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-red-600 transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
