import { useState, type FormEvent } from 'react';
import { X, PlaySquare, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { courseService } from '../services';
import { Course } from '../types';

interface ImportCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (course: Course, isExisting: boolean) => void;
}

export const ImportCourseModal = ({
  isOpen,
  onClose,
  onSuccess,
}: ImportCourseModalProps) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  // Basic client-side URL validation mandated by Section 11
  const validateUrl = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed) return false;

    // Accept URLs containing youtube.com/playlist?list= and variations
    const hasPlaylistPattern =
      trimmed.includes('youtube.com/playlist?list=') ||
      trimmed.includes('youtu.be/') ||
      trimmed.includes('&list=') ||
      trimmed.includes('?list=') ||
      /^[a-zA-Z0-9_-]{12,64}$/.test(trimmed);

    return Boolean(hasPlaylistPattern);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent duplicate submissions

    setError(null);
    setSuccessInfo(null);

    const trimmed = playlistUrl.trim();
    if (!trimmed || !validateUrl(trimmed)) {
      setError('Please enter a valid YouTube playlist URL.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await courseService.importCourse(trimmed);

      if (res.isExisting) {
        setSuccessInfo('This playlist is already in your courses.');
      } else {
        setSuccessInfo(`Successfully imported "${res.course.title}"!`);
      }

      setTimeout(() => {
        setIsLoading(false);
        setPlaylistUrl('');
        setSuccessInfo(null);
        onSuccess(res.course, res.isExisting);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setIsLoading(false);
      const rawMessage = err instanceof Error ? err.message : '';

      // User-facing sanitized error messages according to Section 13
      if (rawMessage.includes('already exists') || rawMessage.includes('duplicate')) {
        setError('This playlist is already in your courses.');
      } else if (
        rawMessage.includes('not found') ||
        rawMessage.includes('404') ||
        rawMessage.includes('Invalid')
      ) {
        setError('Playlist not found. Please check the URL.');
      } else if (
        rawMessage.includes('private') ||
        rawMessage.includes('forbidden') ||
        rawMessage.includes('403')
      ) {
        setError('This playlist is private or unavailable.');
      } else if (rawMessage.includes('quota')) {
        setError('YouTube API quota exceeded. Please try again later.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] p-6 shadow-2xl transition-all sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
              <PlaySquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">Import YouTube Playlist</h3>
              <p className="text-xs text-slate-400">
                Transform any educational playlist into a structured course
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successInfo && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successInfo}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="playlistUrl"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              YouTube Playlist URL
            </label>
            <input
              id="playlistUrl"
              type="text"
              required
              disabled={isLoading}
              value={playlistUrl}
              onChange={(e) => {
                setPlaylistUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://www.youtube.com/playlist?list=..."
              className="mt-1.5 block w-full rounded-xl border border-white/[0.1] bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Provide a public or unlisted YouTube playlist link or playlist ID.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="rounded-xl border border-white/[0.08] bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-60 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <PlaySquare className="h-4 w-4" />
                  <span>Import Course</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Re-export as ImportPlaylistModal for backwards compatibility
export const ImportPlaylistModal = ImportCourseModal;
