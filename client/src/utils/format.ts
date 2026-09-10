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
 * Formats a video duration into standard digital clock notation (e.g. "12:34" or "1:02:15").
 */
export const formatVideoDuration = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '00:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

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

