import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { noteService, courseService } from '../services';
import {
  NoteItem as NoteItemType,
  CreateNotePayload,
  UpdateNotePayload,
  VideoItem,
} from '../types';
import {
  NotesHeader,
  NotesFilterBar,
  NoteListItem,
  NoteDetailPanel,
  NoteModal,
} from '../components/notes';
import { LoadingState, EmptyState, ErrorState } from '../components';

export const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState<
    'pinnedFirst' | 'updated' | 'created' | 'oldest' | 'title'
  >('pinnedFirst');

  // Selected note for detail view
  const [selectedNote, setSelectedNote] = useState<NoteItemType | null>(null);

  // Modals state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<NoteItemType | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<NoteItemType | null>(null);

  // Available lessons for current filter course
  const [filterVideos, setFilterVideos] = useState<VideoItem[]>([]);

  // 1. Fetch user courses for dropdown filters and note creation
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getCourses,
  });
  const courses = coursesData?.courses || [];

  // When selectedCourseId changes in filter, load its videos for the lesson dropdown
  React.useEffect(() => {
    if (!selectedCourseId) {
      setFilterVideos([]);
      setSelectedVideoId('');
      return;
    }
    courseService
      .getCourseVideos(selectedCourseId)
      .then((res) => {
        setFilterVideos(res.videos || []);
      })
      .catch((err) => {
        console.error('Failed to load course videos:', err);
      });
  }, [selectedCourseId]);

  // 2. Fetch paginated notes
  const queryParams = useMemo(
    () => ({
      page,
      limit: 25,
      search: search.trim() || undefined,
      courseId: selectedCourseId || undefined,
      videoId: selectedVideoId || undefined,
      pinned: pinnedOnly ? true : undefined,
      tag: selectedTag || undefined,
      sortBy,
    }),
    [page, search, selectedCourseId, selectedVideoId, pinnedOnly, selectedTag, sortBy]
  );

  const {
    data: notesData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['notes-paginated', queryParams],
    queryFn: () => noteService.getNotes(queryParams),
  });

  const notes = useMemo(() => notesData?.notes || [], [notesData?.notes]);
  const total = notesData?.total || 0;
  const totalPages = notesData?.totalPages || 1;
  const totalPinned = notesData?.totalPinned || 0;
  const availableTags = notesData?.tags || [];

  // Active selected note (preserves current selection if present in list, otherwise defaults to first)
  const activeSelectedNote = useMemo(() => {
    if (notes.length === 0) return null;
    if (selectedNote) {
      const matched = notes.find((n) => n._id === selectedNote._id);
      if (matched) return matched;
    }
    return notes[0];
  }, [notes, selectedNote]);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedVideoId('');
    setPage(1);
  };

  const handleVideoChange = (videoId: string) => {
    setSelectedVideoId(videoId);
    setPage(1);
  };

  const handlePinnedChange = (pinned: boolean) => {
    setPinnedOnly(pinned);
    setPage(1);
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    setPage(1);
  };

  const handleSortChange = (
    newSort: 'pinnedFirst' | 'updated' | 'created' | 'oldest' | 'title'
  ) => {
    setSortBy(newSort);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCourseId('');
    setSelectedVideoId('');
    setPinnedOnly(false);
    setSelectedTag('');
    setSortBy('pinnedFirst');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || selectedCourseId || selectedVideoId || pinnedOnly || selectedTag
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateNotePayload) => noteService.createNote(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['all-notes'] });
      if (res?.note) {
        setSelectedNote(res.note);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      noteId,
      payload,
    }: {
      noteId: string;
      payload: UpdateNotePayload;
    }) => noteService.updateNote(noteId, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['all-notes'] });
      if (res?.note) {
        setSelectedNote(res.note);
      }
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: (noteId: string) => noteService.togglePin(noteId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['all-notes'] });
      if (res?.note && selectedNote?._id === res.note._id) {
        setSelectedNote(res.note);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => noteService.deleteNote(noteId),
    onSuccess: () => {
      setNoteToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['notes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['all-notes'] });
    },
  });

  // Modal Handlers
  const handleOpenCreate = () => {
    setNoteToEdit(null);
    setIsNoteModalOpen(true);
  };

  const handleOpenEdit = (note: NoteItemType) => {
    setNoteToEdit(note);
    setIsNoteModalOpen(true);
  };

  const handleDeletePrompt = (note: NoteItemType) => {
    setNoteToDelete(note);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <NotesHeader
        totalNotes={total}
        totalPinned={totalPinned}
        onNewNote={handleOpenCreate}
      />

      {/* Filter & Search Bar */}
      <NotesFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        courses={courses}
        selectedCourseId={selectedCourseId}
        onCourseChange={handleCourseChange}
        videos={filterVideos}
        selectedVideoId={selectedVideoId}
        onVideoChange={handleVideoChange}
        pinnedOnly={pinnedOnly}
        onPinnedChange={handlePinnedChange}
        tags={availableTags}
        selectedTag={selectedTag}
        onTagChange={handleTagChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Loading state */}
      {isLoading && <LoadingState count={4} />}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          title="Unable to load your notes"
          message="Could not retrieve your notes at this time. Please check your connection."
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      )}

      {/* Empty states */}
      {!isLoading && !error && total === 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827]/50 p-8">
          {hasActiveFilters ? (
            <EmptyState
              title="No notes match your filters"
              description="Try adjusting your search terms, removing course or lesson filters, or clearing tag filters."
              actionLabel="Reset All Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <EmptyState
              title="No notes yet"
              description="Take notes while watching course lessons or create your first note directly with the button above."
              actionLabel="Explore Courses"
              onAction={() => navigate('/courses')}
            />
          )}
        </div>
      )}

      {/* Master-Detail Workspace Grid */}
      {!isLoading && !error && total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Master Notes List */}
          <div
            className={`space-y-3 lg:col-span-5 ${
              selectedNote ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="space-y-2.5">
              {notes.map((note) => (
                <NoteListItem
                  key={note._id}
                  note={note}
                  isSelected={activeSelectedNote?._id === note._id}
                  onSelect={(item) => setSelectedNote(item)}
                  onTogglePin={(noteId) => togglePinMutation.mutate(noteId)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#111827] px-4 py-3 text-xs text-slate-400">
                <span>
                  Page {page} of {totalPages}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#0B1120] px-3 py-1.5 text-xs text-slate-300 hover:border-white/[0.15] hover:text-white disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#0B1120] px-3 py-1.5 text-xs text-slate-300 hover:border-white/[0.15] hover:text-white disabled:opacity-40 transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Detail View (Desktop sticky, Mobile full) */}
          <div
            className={`lg:col-span-7 lg:sticky lg:top-4 ${
              activeSelectedNote ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Mobile Back Button */}
            {activeSelectedNote && (
              <div className="mb-3 lg:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedNote(null)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#111827] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to notes list</span>
                </button>
              </div>
            )}

            <NoteDetailPanel
              note={activeSelectedNote}
              onEdit={handleOpenEdit}
              onDelete={handleDeletePrompt}
              onTogglePin={(noteId) => togglePinMutation.mutate(noteId)}
              isPinning={togglePinMutation.isPending}
            />
          </div>
        </div>
      )}

      {/* Create / Edit Note Modal */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        noteToEdit={noteToEdit}
        courses={courses}
        onSubmitCreate={async (payload) => {
          await createMutation.mutateAsync(payload);
        }}
        onSubmitUpdate={async (noteId, payload) => {
          await updateMutation.mutateAsync({ noteId, payload });
        }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-note-title"
            className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#111827] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 id="delete-note-title" className="text-base font-bold text-white font-heading">
                  Delete Note?
                </h4>
                <p className="text-xs text-slate-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 line-clamp-3 bg-[#0B1120] p-3.5 rounded-2xl border border-white/[0.06]">
              "{noteToDelete.content}"
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setNoteToDelete(null)}
                className="rounded-xl border border-white/[0.08] bg-[#0B1120] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-white/[0.15] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(noteToDelete._id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
