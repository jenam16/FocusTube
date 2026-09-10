import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Play,
  Clock,
  Pin,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { NoteItem } from '../../types';
import { formatVideoDuration } from '../../utils';

interface NoteDetailPanelProps {
  note: NoteItem | null;
  onEdit: (note: NoteItem) => void;
  onDelete: (note: NoteItem) => void;
  onTogglePin: (noteId: string) => void;
  isPinning?: boolean;
}

export const NoteDetailPanel: React.FC<NoteDetailPanelProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  isPinning = false,
}) => {
  const navigate = useNavigate();

  if (!note) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-800/80 bg-gray-900/30 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-800/60 text-gray-500 mb-3">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-300">
          Select a note
        </h3>
        <p className="mt-1 text-xs text-gray-500 max-w-[260px]">
          Choose a note from the list to view its full details, jump to its video lesson, or make edits.
        </p>
      </div>
    );
  }

  const courseObj = typeof note.course === 'object' && note.course !== null ? note.course : null;
  const videoObj = typeof note.video === 'object' && note.video !== null ? note.video : null;

  const courseId = courseObj?._id || (typeof note.course === 'string' ? note.course : '');
  const videoId = videoObj?._id || (typeof note.video === 'string' ? note.video : '');
  const courseTitle = courseObj?.title || 'Course';
  const videoTitle = videoObj?.title || 'Lesson';

  const handleWatchLesson = () => {
    if (!courseId || !videoId) return;
    if (note.timestampSeconds !== null && note.timestampSeconds !== undefined) {
      navigate(`/watch/${courseId}/${videoId}?t=${note.timestampSeconds}`);
    } else {
      navigate(`/watch/${courseId}/${videoId}`);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const displayTitle = note.title && note.title.trim() ? note.title.trim() : 'Untitled Note';

  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-800/90 bg-gray-900/50 overflow-hidden backdrop-blur-sm">
      {/* Top action toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-800/80 p-4 bg-gray-950/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-gray-200 truncate">{courseTitle}</h4>
            <p className="text-[11px] text-gray-500 truncate">
              {videoObj?.position ? `Lesson ${videoObj.position}: ` : ''}
              {videoTitle}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={isPinning}
            onClick={() => onTogglePin(note._id)}
            className={`rounded-lg border p-1.5 text-xs font-medium transition-all ${
              note.isPinned
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                : 'border-gray-800 bg-gray-900 text-gray-400 hover:text-white hover:border-gray-700'
            }`}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin className={`h-4 w-4 rotate-45 ${note.isPinned ? 'fill-current text-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onEdit(note)}
            className="rounded-lg border border-gray-800 bg-gray-900 p-1.5 text-gray-400 hover:border-gray-700 hover:text-white transition-all"
            title="Edit note"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(note)}
            className="rounded-lg border border-gray-800 bg-gray-900 p-1.5 text-gray-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-all"
            title="Delete note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Watch lesson button / timestamp jump */}
        {courseId && videoId && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-800/80 bg-gray-950/60 p-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {note.timestampSeconds !== null && note.timestampSeconds !== undefined ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 shrink-0 font-mono text-xs font-bold">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 text-gray-400 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-semibold text-gray-200 block truncate">
                  {note.timestampSeconds !== null && note.timestampSeconds !== undefined
                    ? `Timestamp: ${formatVideoDuration(note.timestampSeconds)}`
                    : 'General Video Note'}
                </span>
                <span className="text-[11px] text-gray-400 block truncate">
                  {videoTitle}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleWatchLesson}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-600/20 hover:bg-red-500 transition-all shrink-0"
            >
              <span>Watch</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Note Title */}
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            {displayTitle}
          </h2>
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="h-3 w-3 text-gray-500 shrink-0" />
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-800/90 border border-gray-700/60 px-2.5 py-0.5 text-xs text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Note Content */}
        <div className="rounded-xl border border-gray-800/60 bg-gray-950/40 p-4">
          <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="flex items-center justify-between gap-3 border-t border-gray-800/80 px-5 py-3 text-[11px] text-gray-500 bg-gray-950/30">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Created: {formatDate(note.createdAt)}</span>
        </div>
        {note.updatedAt && note.updatedAt !== note.createdAt && (
          <span>Updated: {formatDate(note.updatedAt)}</span>
        )}
      </div>
    </div>
  );
};
