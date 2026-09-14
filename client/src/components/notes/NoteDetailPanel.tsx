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
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#111827]/50 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-500 mb-3 border border-white/[0.06]">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-300">
          Select a note
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-[260px]">
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
    <div className="flex flex-col h-full rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden backdrop-blur-sm">
      {/* Top action toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] p-4 bg-[#0B1120]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-200 truncate">{courseTitle}</h4>
            <p className="text-[11px] text-slate-500 truncate">
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
            className={`rounded-xl border p-2 text-xs font-medium transition-all ${
              note.isPinned
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                : 'border-white/[0.08] bg-[#111827] text-slate-400 hover:text-white hover:border-white/[0.15]'
            }`}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin className={`h-4 w-4 rotate-45 ${note.isPinned ? 'fill-current text-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onEdit(note)}
            className="rounded-xl border border-white/[0.08] bg-[#111827] p-2 text-slate-400 hover:border-white/[0.15] hover:text-white transition-all"
            title="Edit note"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(note)}
            className="rounded-xl border border-white/[0.08] bg-[#111827] p-2 text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
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
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-[#0B1120] p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              {note.timestampSeconds !== null && note.timestampSeconds !== undefined ? (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0 font-mono text-xs font-bold">
                  <Play className="h-4 w-4 fill-current" />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-slate-400 border border-white/[0.06] shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-200 block truncate">
                  {note.timestampSeconds !== null && note.timestampSeconds !== undefined
                    ? `Timestamp: ${formatVideoDuration(note.timestampSeconds)}`
                    : 'General Video Note'}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {videoTitle}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleWatchLesson}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all shrink-0"
            >
              <span>Watch</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Note Title */}
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white font-heading">
            {displayTitle}
          </h2>
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#0B1120] border border-white/[0.08] px-2.5 py-0.5 text-xs text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Note Content */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0B1120] p-4">
          <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3 text-[11px] text-slate-500 bg-[#0B1120]">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>Created: {formatDate(note.createdAt)}</span>
        </div>
        {note.updatedAt && note.updatedAt !== note.createdAt && (
          <span>Updated: {formatDate(note.updatedAt)}</span>
        )}
      </div>
    </div>
  );
};
