import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, FileText, Plus, Loader2 } from 'lucide-react';
import { noteService } from '../../services';
import { NoteItem } from './NoteItem';
import { NoteEditor } from './NoteEditor';

interface FocusNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  videoId: string;
  videoTitle: string;
  currentPlaybackSeconds?: number;
  onSeekTo?: (seconds: number) => void;
}

export const FocusNotesDrawer: React.FC<FocusNotesDrawerProps> = ({
  isOpen,
  onClose,
  courseId,
  videoId,
  videoTitle,
  currentPlaybackSeconds = 0,
  onSeekTo,
}) => {
  const queryClient = useQueryClient();
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Close drawer on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { data, isLoading } = useQuery({
    queryKey: ['notes', videoId],
    queryFn: () => noteService.getVideoNotes(videoId),
    enabled: isOpen && Boolean(videoId),
  });

  const notes = data?.notes || [];

  const createMutation = useMutation({
    mutationFn: (payload: { content: string; timestampSeconds: number | null }) =>
      noteService.createNote({
        courseId,
        videoId,
        content: payload.content,
        timestampSeconds: payload.timestampSeconds,
      }),
    onSuccess: () => {
      setIsAddingNote(false);
      queryClient.invalidateQueries({ queryKey: ['notes', videoId] });
      queryClient.invalidateQueries({ queryKey: ['all-notes'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      noteId,
      content,
      timestampSeconds,
    }: {
      noteId: string;
      content: string;
      timestampSeconds: number | null;
    }) =>
      noteService.updateNote(noteId, {
        content,
        timestampSeconds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', videoId] });
      queryClient.invalidateQueries({ queryKey: ['all-notes'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => noteService.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', videoId] });
      queryClient.invalidateQueries({ queryKey: ['all-notes'] });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          role="dialog"
          aria-label="Focus Mode Lesson Notes"
          className="w-screen max-w-md bg-[#0B101E] border-l border-white/[0.07] shadow-2xl flex flex-col"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-white/[0.07] p-4 bg-[#070B14]/90">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate font-heading">
                  Notes ({notes.length})
                </h3>
                <p className="text-xs text-slate-400 truncate">{videoTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isAddingNote && (
                <button
                  type="button"
                  onClick={() => setIsAddingNote(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
                aria-label="Close notes drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isAddingNote && (
              <NoteEditor
                currentPlaybackSeconds={currentPlaybackSeconds}
                isSubmitting={createMutation.isPending}
                onSubmit={async (content, timestampSeconds) => {
                  await createMutation.mutateAsync({ content, timestampSeconds });
                }}
                onCancel={() => setIsAddingNote(false)}
              />
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-indigo-400" />
                Loading notes...
              </div>
            ) : notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.08] p-8 text-center space-y-2">
                <p className="text-xs text-slate-400">No notes for this lesson yet.</p>
                {!isAddingNote && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add your first note</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <NoteItem
                    key={note._id}
                    note={note}
                    onSeekTo={(seconds) => {
                      if (onSeekTo) {
                        onSeekTo(seconds);
                      }
                    }}
                    onUpdate={async (noteId, content, timestampSeconds) => {
                      await updateMutation.mutateAsync({
                        noteId,
                        content,
                        timestampSeconds,
                      });
                    }}
                    onDelete={async (noteId) => {
                      await deleteMutation.mutateAsync(noteId);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
