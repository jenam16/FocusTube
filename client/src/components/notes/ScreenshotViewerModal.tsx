import React from 'react';
import { X, Play, Clock, Tag, Calendar, ExternalLink } from 'lucide-react';
import { NoteItem } from '../../types';
import { formatDuration } from '../../utils';

interface ScreenshotViewerModalProps {
  note: NoteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onWatch: (note: NoteItem) => void;
}

export const ScreenshotViewerModal: React.FC<ScreenshotViewerModalProps> = ({
  note,
  isOpen,
  onClose,
  onWatch,
}) => {
  if (!isOpen || !note) return null;

  const courseTitle =
    typeof note.course === 'object' && note.course?.title
      ? note.course.title
      : 'Course';

  const videoTitle =
    typeof note.video === 'object' && note.video?.title
      ? note.video.title
      : 'Lesson';

  const formattedDate = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0F172A] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-[#111827]">
          <div className="min-w-0 flex-1 pr-4">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {courseTitle} • {videoTitle}
            </p>
            <h3 className="truncate text-base sm:text-lg font-bold text-white font-heading mt-0.5">
              {note.title || 'Captured Moment'}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {note.screenshotUrl && (
              <a
                href={note.screenshotUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#1E293B] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title="Open original image in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Open Original</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body - Image display */}
        <div className="relative flex-1 overflow-y-auto bg-black flex items-center justify-center min-h-[300px] max-h-[60vh]">
          {note.screenshotUrl ? (
            <img
              src={note.screenshotUrl}
              alt={note.title || 'Screenshot'}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-slate-500 text-sm">Image not available</div>
          )}

          {typeof note.timestampSeconds === 'number' && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/85 backdrop-blur-md px-2.5 py-1 text-xs font-mono font-semibold text-white shadow-lg border border-white/10">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>{formatDuration(note.timestampSeconds)}</span>
            </div>
          )}
        </div>

        {/* Modal Footer / Notes info */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-white/[0.08] p-4 bg-[#111827]">
          <div className="space-y-1.5 min-w-0 flex-1">
            {note.content && (
              <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap">
                {note.content}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              {formattedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formattedDate}
                </span>
              )}

              {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-300"
                    >
                      <Tag className="h-2.5 w-2.5 text-indigo-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onWatch(note);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all shrink-0"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Watch Moment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
