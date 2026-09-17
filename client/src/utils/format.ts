/**
 * Formats course duration in seconds into human-readable format:
 * - 45m
 * - 1h 20m
 * - 3h 45m
 * - 12h 05m
 */
export const formatDuration = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '0m';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const padMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

  if (hours > 0) {
    return `${hours}h ${padMinutes}m`;
  }

  return `${Math.max(1, minutes)}m`;
};

/**
 * Formats a video duration / playback time in seconds into standard clock notation:
 * - Total duration < 1 hour: MM:SS (e.g. "00:00", "00:03", "05:42", "42:17", "59:59")
 * - Total duration >= 1 hour: HH:MM:SS (e.g. "01:00:00", "01:31:07", "02:15:42")
 *
 * Rules:
 * 1. Never display decimal seconds or floating-point artifacts.
 * 2. Always zero-pad minutes and seconds.
 * 3. Use HH:MM:SS when duration >= 1 hour (3600 seconds), MM:SS when < 1 hour.
 * 4. Current time and total duration follow identical formatting rules.
 * 5. Safely handles null, undefined, NaN, Infinity, and negative values.
 * 6. Integer rounding avoids invalid values such as 60 seconds.
 */
export const formatVideoTime = (
  totalSeconds?: number | string | null
): string => {
  if (totalSeconds == null) return '00:00';
  const num =
    typeof totalSeconds === 'string' ? parseFloat(totalSeconds) : totalSeconds;
  if (isNaN(num) || !isFinite(num) || num <= 0) {
    return '00:00';
  }

  const total = Math.round(num);
  if (total <= 0) return '00:00';

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Backwards-compatible alias for formatVideoTime.
 */
export const formatVideoDuration = formatVideoTime;

/**
 * Formats 0-based lesson position into 2-digit representation (e.g. 0 -> "01", 9 -> "10").
 */
export const formatLessonNumber = (position: number): string => {
  const num = position + 1;
  return num < 10 ? `0${num}` : `${num}`;
};

/**
 * Formats ISO date string into human-friendly relative time (e.g. "Just now", "15m ago", "2h ago").
 */
export const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return '';
  const now = Date.now();
  const past = new Date(dateString).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateString).toLocaleDateString();
};

