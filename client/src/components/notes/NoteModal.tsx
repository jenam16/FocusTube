import React, { useEffect, useState } from 'react';
import { X, Loader2, Pin, Tag, Clock } from 'lucide-react';
import { Course, VideoItem, NoteItem, CreateNotePayload, UpdateNotePayload } from '../../types';
import { courseService } from '../../services';
import { formatVideoDuration } from '../../utils';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: NoteItem | null;
  courses: Course[];
  onSubmitCreate: (payload: CreateNotePayload) => Promise<void>;
  onSubmitUpdate: (noteId: string, payload: UpdateNotePayload) => Promise<void>;
  isSubmitting?: boolean;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  courses,
  onSubmitCreate,
  onSubmitUpdate,
  isSubmitting = false,
}) => {
  const isEditMode = Boolean(noteToEdit);

  // Form state
  const [courseId, setCourseId] = useState('');
  const [videoId, setVideoId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [timestampStr, setTimestampStr] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available videos for selected course in create mode
  const [availableVideos, setAvailableVideos] = useState<VideoItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  // Reset or initialize on open
  useEffect(() => {
    if (!isOpen) return;

    if (noteToEdit) {
      const cId =
        typeof noteToEdit.course === 'object' && noteToEdit.course !== null
          ? noteToEdit.course._id
          : (noteToEdit.course as string) || '';
      const vId =
        typeof noteToEdit.video === 'object' && noteToEdit.video !== null
          ? noteToEdit.video._id
          : (noteToEdit.video as string) || '';

      setCourseId(cId);
      setVideoId(vId);
      setTitle(noteToEdit.title || '');
      setContent(noteToEdit.content || '');
      setTimestampStr(
        noteToEdit.timestampSeconds !== null && noteToEdit.timestampSeconds !== undefined
          ? String(noteToEdit.timestampSeconds)
          : ''
      );
      setIsPinned(Boolean(noteToEdit.isPinned));
      setTags(noteToEdit.tags || []);
      setTagInput('');
      setErrorMsg(null);
    } else {
      const defaultCourse = courses[0]?._id || '';
      setCourseId(defaultCourse);
      setVideoId('');
      setTitle('');
      setContent('');
      setTimestampStr('');
      setIsPinned(false);
      setTags([]);
      setTagInput('');
      setErrorMsg(null);
    }
  }, [isOpen, noteToEdit, courses]);

  // Load videos when course changes in create mode
  useEffect(() => {
    if (!isOpen || isEditMode || !courseId) return;

    let isMounted = true;
    setIsLoadingVideos(true);
    courseService
      .getCourseVideos(courseId)
      .then((res) => {
        if (!isMounted) return;
        setAvailableVideos(res.videos || []);
        if (res.videos && res.videos.length > 0) {
          setVideoId((prev) => (prev ? prev : res.videos[0]._id));
        }
      })
      .catch((err) => {
        console.error('Failed to load course videos:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingVideos(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, isEditMode, courseId]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Tag helper
  const handleAddTag = () => {
    const cleaned = tagInput.trim().toLowerCase().replace(/^#+/, '');
    if (cleaned && !tags.includes(cleaned) && tags.length < 10) {
      setTags([...tags, cleaned]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!content.trim()) {
      setErrorMsg('Note content cannot be empty');
      return;
    }

    if (!isEditMode && (!courseId || !videoId)) {
      setErrorMsg('Please select a course and lesson for this note');
      return;
    }

    let parsedTimestamp: number | null = null;
    if (timestampStr.trim()) {
      const num = Number(timestampStr.trim());
      if (isNaN(num) || num < 0) {
        setErrorMsg('Timestamp must be a valid positive number in seconds');
        return;
      }
      parsedTimestamp = Math.floor(num);
    }

    try {
      if (isEditMode && noteToEdit) {
        await onSubmitUpdate(noteToEdit._id, {
          title: title.trim(),
          content: content.trim(),
          timestampSeconds: parsedTimestamp,
          isPinned,
          tags,
        });
      } else {
        await onSubmitCreate({
          courseId,
          videoId,
          title: title.trim(),
          content: content.trim(),
          timestampSeconds: parsedTimestamp,
          isPinned,
          tags,
        });
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save note';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-modal-title"
        className="w-full max-w-xl rounded-3xl border border-white/[0.08] bg-[#111827] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] p-4 sm:px-6 bg-[#0B1120]">
          <h3 id="note-modal-title" className="text-base sm:text-lg font-bold text-white font-heading">
            {isEditMode ? 'Edit Note' : 'Create New Note'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400">
              {errorMsg}
            </div>
          )}

          {/* Course & Lesson Selector (Only in Create Mode) */}
          {!isEditMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Course <span className="text-rose-400">*</span>
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0B1120] p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lesson <span className="text-rose-400">*</span>
                </label>
                <select
                  value={videoId}
                  disabled={isLoadingVideos || availableVideos.length === 0}
                  onChange={(e) => setVideoId(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0B1120] p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  required
                >
                  {isLoadingVideos ? (
                    <option>Loading lessons...</option>
                  ) : availableVideos.length === 0 ? (
                    <option>No lessons found</option>
                  ) : (
                    availableVideos.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.position}. {v.title}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Note Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Title <span className="text-slate-500 text-[11px]">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Key takeaway on useEffect cleanup"
              maxLength={200}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0B1120] p-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Note Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Content <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {content.length} / 5000
              </span>
            </div>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write detailed notes, formulas, questions, or code snippets..."
              maxLength={5000}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0B1120] p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-y"
              required
            />
          </div>

          {/* Timestamp & Pin row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Timestamp <span className="text-slate-500 text-[11px]">(seconds, optional)</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="number"
                  min={0}
                  value={timestampStr}
                  onChange={(e) => setTimestampStr(e.target.value)}
                  placeholder="e.g., 145"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0B1120] pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
              {timestampStr && !isNaN(Number(timestampStr)) && Number(timestampStr) >= 0 && (
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Previews as: {formatVideoDuration(Number(timestampStr))}
                </span>
              )}
            </div>

            <div className="pt-2 sm:pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                <Pin className={`h-3.5 w-3.5 rotate-45 ${isPinned ? 'text-amber-400 fill-current' : 'text-slate-400'}`} />
                <span className="text-xs font-medium text-slate-300">
                  Pin to top of list
                </span>
              </label>
            </div>
          </div>

          {/* Tags section */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tags <span className="text-slate-500 text-[11px]">(press Enter or Add)</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g., hooks, review, formula"
                  maxLength={30}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#0B1120] pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 10}
                className="rounded-xl bg-[#0B1120] border border-white/[0.08] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/[0.15] disabled:opacity-50"
              >
                Add Tag
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-xs text-indigo-300"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-white/[0.08] bg-[#0B1120] px-4 py-2 text-xs font-semibold text-slate-300 hover:border-white/[0.15] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEditMode ? 'Save Changes' : 'Create Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
