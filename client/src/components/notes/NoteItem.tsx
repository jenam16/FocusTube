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
    <div className="group rounded-xl border border-gray-800/80 bg-gray-900/40 p-3.5 space-y-2.5 transition-colors hover:border-gray-700/80 hover:bg-gray-900/60">
      {/* Top Bar: Timestamp and Actions */}
      <div className="flex items-center justify-between gap-2">
        {note.timestampSeconds !== null && note.timestampSeconds !== undefined ? (
          <button
            type="button"
            onClick={() => onSeekTo && onSeekTo(note.timestampSeconds!)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
            title={`Seek to ${formatVideoDuration(note.timestampSeconds)}`}
          >
            <Play className="h-3 w-3 fill-current" />
            <span>{formatVideoDuration(note.timestampSeconds)}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
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
              className="rounded p-1 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Edit note"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsDeleting(true)}
              className="rounded p-1 text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
              aria-label="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {isDeleting && (
        <div className="flex items-center justify-between rounded-lg bg-red-950/30 border border-red-900/40 p-2 text-xs">
          <span className="text-red-300 font-medium">Delete this note?</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDelete}
              className="rounded bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              Delete
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsDeleting(false)}
              className="rounded bg-gray-800 px-2 py-1 text-gray-300 hover:bg-gray-700"
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
            className="w-full rounded-lg border border-gray-700 bg-gray-950 p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              disabled={!editContent.trim() || isSubmitting}
              onClick={handleSave}
              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              <span>Save</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-800 px-2.5 py-1 text-xs text-gray-300 hover:bg-gray-700"
            >
              <X className="h-3 w-3" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed break-words">
          {note.content}
        </p>
      )}
    </div>
  );
};
