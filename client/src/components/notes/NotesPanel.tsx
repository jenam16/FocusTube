import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { noteService } from '../../services';
import { NoteItem } from './NoteItem';
import { NoteEditor } from './NoteEditor';

interface NotesPanelProps {
  courseId: string;
  videoId: string;
  currentPlaybackSeconds?: number;
  onSeekTo?: (seconds: number) => void;
  defaultExpanded?: boolean;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  courseId,
  videoId,
  currentPlaybackSeconds = 0,
  onSeekTo,
  defaultExpanded = true,
}) => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notes', videoId],
    queryFn: () => noteService.getVideoNotes(videoId),
    enabled: Boolean(videoId),
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

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-left focus:outline-none"
        >
          <FileText className="h-4 w-4 text-red-400" />
          <h3 className="text-sm font-bold text-white">
            Lesson Notes ({notes.length})
          </h3>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {isExpanded && !isAddingNote && (
          <button
            type="button"
            onClick={() => setIsAddingNote(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/80 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Note</span>
          </button>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Note Editor Form */}
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

          {/* Notes List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-xs text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800/80 p-6 text-center space-y-2">
              <p className="text-xs text-gray-400">No notes for this lesson yet.</p>
              {!isAddingNote && (
                <button
                  type="button"
                  onClick={() => setIsAddingNote(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add your first note</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {notes.map((note) => (
                <NoteItem
                  key={note._id}
                  note={note}
                  onSeekTo={onSeekTo}
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
      )}
    </div>
  );
};
