import React, { useState } from 'react';
import { Clock, Play, Edit2, Trash2, Check, X } from 'lucide-react';
import { NoteItem as NoteItemType } from '../../types';
import { formatVideoDuration } from '../../utils';

interface NoteItemProps {
  note: NoteItemType;
  onSeekTo?: (seconds: number) => void;
  onUpdate: (noteId: string, content: string, timestampSeconds: number | null) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}

export const NoteItem: React.FC<NoteItemProps> = ({
  note,
  onSeekTo,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!editContent.trim()) return;
    try {
      setIsSubmitting(true);
      await onUpdate(note._id, editContent.trim(), note.timestampSeconds);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await onDelete(note._id);
    } catch (err) {
      console.error('Failed to delete note:', err);
      setIsDeleting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="group rounded-2xl border border-white/[0.08] bg-[#0B1120] p-3.5 space-y-2.5 transition-all duration-200 hover:border-white/[0.15] hover:bg-[#0B1120]/90">
      {/* Top Bar: Timestamp and Actions */}
      <div className="flex items-center justify-between gap-2">
        {note.timestampSeconds !== null && note.timestampSeconds !== undefined ? (
          <button
            type="button"
            onClick={() => onSeekTo && onSeekTo(note.timestampSeconds!)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors font-mono"
            title={`Seek to ${formatVideoDuration(note.timestampSeconds)}`}
          >
            <Play className="h-3 w-3 fill-current" />
            <span>{formatVideoDuration(note.timestampSeconds)}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" />
            General Note
          </span>
        )}

        {/* Edit and Delete Actions */}
        {!isEditing && !isDeleting && (
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => {
                setEditContent(note.content);
                setIsEditing(true);
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Edit note"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsDeleting(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              aria-label="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {isDeleting && (
        <div className="flex items-center justify-between rounded-xl bg-rose-950/30 border border-rose-900/40 p-2.5 text-xs">
          <span className="text-rose-300 font-medium">Delete this note?</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDelete}
              className="rounded-lg bg-rose-600 px-2.5 py-1 font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
            >
              Delete
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsDeleting(false)}
              className="rounded-lg bg-[#111827] px-2 py-1 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content or Edit Field */}
      {isEditing ? (
        <div className="space-y-2 pt-1">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            maxLength={5000}
            className="w-full rounded-xl border border-white/[0.08] bg-[#111827] p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              disabled={!editContent.trim() || isSubmitting}
              onClick={handleSave}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              <span>Save</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#111827] px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              <X className="h-3 w-3" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed break-words">
          {note.content}
        </p>
      )}
    </div>
  );
};
