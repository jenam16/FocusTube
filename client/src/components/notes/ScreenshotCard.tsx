import React from 'react';
import { Play, Trash2, Pin, Calendar, Tag, ExternalLink } from 'lucide-react';
import { NoteItem } from '../../types';
import { formatVideoTime } from '../../utils';

interface ScreenshotCardProps {
  note: NoteItem;
  onWatch: (note: NoteItem) => void;
  onViewImage: (note: NoteItem) => void;
  onEdit: (note: NoteItem) => void;
  onDelete: (note: NoteItem) => void;
  onTogglePin?: (noteId: string) => void;
}

export const ScreenshotCard: React.FC<ScreenshotCardProps> = ({
  note,
  onWatch,
  onViewImage,
  onEdit,
  onDelete,
  onTogglePin,
}) => {
  const formattedDate = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const courseTitle =
    typeof note.course === 'object' && note.course?.title
      ? note.course.title
      : 'Course';

  const videoTitle =
    typeof note.video === 'object' && note.video?.title
      ? note.video.title
      : 'Lesson';

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl hover:shadow-indigo-950/40 ${
        note.isPinned
          ? 'border-amber-500/40 bg-[#0E1528] shadow-sm shadow-amber-500/5'
          : 'border-white/[0.07] bg-[#0B101E] hover:border-indigo-500/40'
      }`}
    >
      {/* Screenshot Image Preview Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/60 cursor-pointer" onClick={() => onViewImage(note)}>
        {note.screenshotUrl ? (
          <img
            src={note.screenshotUrl}
            alt={note.title || 'Screenshot moment'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
            No image available
          </div>
        )}

        {/* Timestamp Pill Badge */}
        {typeof note.timestampSeconds === 'number' && (
          <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 rounded-lg bg-black/80 backdrop-blur-md px-2 py-0.5 text-xs font-mono font-semibold text-white shadow">
            <span>⏱</span>
            <span>{formatVideoTime(note.timestampSeconds)}</span>
          </div>
        )}

        {/* Pin Indicator */}
        {note.isPinned && (
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-md bg-amber-500/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-gray-950 uppercase tracking-wider shadow">
            <Pin className="h-3 w-3 fill-current rotate-45" />
            <span>Pinned</span>
          </div>
        )}

        {/* Hover overlay with zoom hint */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="rounded-xl bg-black/70 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white flex items-center gap-1.5 shadow">
            <ExternalLink className="h-3.5 w-3.5" />
            View Full Image
          </span>
        </div>
      </div>

      {/* Card Content & Details */}
      <div className="flex flex-1 flex-col p-4 space-y-3">
        {/* Course & Lesson context */}
        <div className="space-y-0.5">
          <p className="line-clamp-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
            {courseTitle}
          </p>
          <p className="line-clamp-1 text-xs font-medium text-slate-400">
            {videoTitle}
          </p>
        </div>

        {/* Title */}
        <h3
          className="line-clamp-2 text-sm sm:text-base font-bold text-white group-hover:text-indigo-200 transition-colors cursor-pointer"
          onClick={() => onViewImage(note)}
        >
          {note.title || 'Untitled Moment'}
        </h3>

        {/* Optional text content / commentary */}
        {note.content && (
          <p className="line-clamp-2 text-xs text-slate-300">
            {note.content}
          </p>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {note.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-white/[0.06]"
              >
                <Tag className="h-2.5 w-2.5 text-indigo-400" />
                <span>{tag}</span>
              </span>
            ))}
            {note.tags.length > 4 && (
              <span className="text-[10px] text-slate-500 self-center">
                +{note.tags.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Footer meta & actions */}
        <div className="mt-auto pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(note._id)}
                aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
                className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition-colors ${
                  note.isPinned
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                    : 'border-white/[0.08] bg-[#0B1120] text-slate-400 hover:border-white/[0.15] hover:text-white'
                }`}
              >
                <Pin className={`h-3 w-3 rotate-45 ${note.isPinned ? 'fill-current' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(note)}
              aria-label="Edit note"
              title="Edit Note Details"
              className="flex h-7 px-2 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0B1120] text-[11px] font-medium text-slate-300 hover:border-white/[0.15] hover:text-white transition-colors"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => onDelete(note)}
              aria-label="Delete note"
              title="Delete Note"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0B1120] text-slate-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>

            {/* Primary CTA: Watch Moment */}
            <button
              type="button"
              onClick={() => onWatch(note)}
              aria-label="Watch moment in player"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Watch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
