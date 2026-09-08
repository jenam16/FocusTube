import { useState, type FormEvent } from 'react';
import { X, PlaySquare, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { courseService } from '../services';
import { Course } from '../types';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (course: Course, isExisting: boolean) => void;
}

export const ImportPlaylistModal = ({
  isOpen,
  onClose,
  onSuccess,
}: ImportPlaylistModalProps) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const trimmed = playlistUrl.trim();
    if (!trimmed) {
      setError('Please enter a YouTube playlist URL or ID.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await courseService.importCourse(trimmed);
      setSuccessInfo(
        res.isExisting
          ? 'Course already exists in your library! Opening...'
          : `Successfully imported "${res.course.title}" with ${res.course.totalVideos} videos!`
      );

      setTimeout(() => {
        setIsLoading(false);
        setPlaylistUrl('');
        setSuccessInfo(null);
        onSuccess(res.course, res.isExisting);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to import playlist. Please check the URL and try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl transition-all sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <PlaySquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Import YouTube Playlist</h3>
              <p className="text-xs text-gray-400">Convert an educational playlist into a course</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
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
              className="block text-xs font-semibold uppercase tracking-wider text-gray-300"
            >
              Playlist URL or ID
            </label>
            <input
              id="playlistUrl"
              type="text"
              required
              disabled={isLoading}
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="https://www.youtube.com/playlist?list=PL..."
              className="mt-1.5 block w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-60"
            />
            <p className="mt-1.5 text-[11px] text-gray-400">
              Supports public or unlisted YouTube playlist URLs or raw IDs.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-600/25 hover:bg-red-500 transition-colors disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Importing Playlist...</span>
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
