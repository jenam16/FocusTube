import React from 'react';
import { Pin, Play, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { NoteItem } from '../../types';
import { formatVideoDuration } from '../../utils';

interface NoteListItemProps {
  note: NoteItem;
  isSelected: boolean;
  onSelect: (note: NoteItem) => void;
  onTogglePin?: (noteId: string, e: React.MouseEvent) => void;
}

export const NoteListItem: React.FC<NoteListItemProps> = ({
  note,
  isSelected,
  onSelect,
  onTogglePin,
}) => {
  const courseTitle =
    typeof note.course === 'object' && note.course !== null
      ? note.course.title
      : 'Untitled Course';

  const videoPosition =
    typeof note.video === 'object' && note.video !== null && note.video.position
      ? note.video.position
      : null;


  // Title fallback
  const displayTitle =
    note.title && note.title.trim()
      ? note.title.trim()
      : note.content.slice(0, 48) + (note.content.length > 48 ? '...' : '');

  // Format relative or date string
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(note)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(note);
        }
      }}
      className={`group relative flex flex-col text-left rounded-xl p-3.5 transition-all cursor-pointer border ${
        isSelected
          ? 'border-red-500/60 bg-gray-900/90 shadow-md shadow-red-500/5 ring-1 ring-red-500/50'
          : 'border-gray-800/80 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-900/70'
      }`}
    >
      {/* Top Header: Course badge + Timestamp + Pin button */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <BookOpen className="h-3 w-3 text-red-400 shrink-0" />
          <span className="text-[11px] font-medium text-gray-400 truncate max-w-[140px] sm:max-w-[180px]">
            {courseTitle}
          </span>
          {videoPosition && (
            <span className="text-[10px] text-gray-500 shrink-0">
              • L{videoPosition}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Timestamp badge */}
          {note.timestampSeconds !== null && note.timestampSeconds !== undefined ? (
            <span className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
              <Play className="h-2.5 w-2.5 fill-current" />
              {formatVideoDuration(note.timestampSeconds)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
              <Clock className="h-2.5 w-2.5" />
            </span>
          )}

          {/* Pin toggle button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onTogglePin) {
                onTogglePin(note._id, e);
              }
            }}

            className={`rounded p-1 transition-all ${
              note.isPinned
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100'
            }`}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin className={`h-3 w-3 rotate-45 ${note.isPinned ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Note Title */}
      <h3 className="text-xs sm:text-sm font-semibold text-gray-100 line-clamp-1 group-hover:text-white transition-colors">
        {displayTitle}
      </h3>

      {/* Content Preview */}
      <p className="mt-1 text-xs text-gray-400 line-clamp-2 leading-relaxed whitespace-pre-wrap">
        {note.content}
      </p>

      {/* Footer: Tags + Lesson pill + Updated Time */}
      <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-gray-800/40 text-[11px] text-gray-500">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {note.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-gray-800/80 px-1.5 py-0.5 text-[10px] text-gray-400"
                >
                  #{tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="text-[10px] text-gray-500">
                  +{note.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span>{formatDate(note.updatedAt || note.createdAt)}</span>
          <ChevronRight className="h-3 w-3 text-gray-600 group-hover:text-gray-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};
