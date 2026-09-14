import React, { useEffect, useState } from 'react';
import { X, Loader2, Calendar as CalendarIcon, BookOpen } from 'lucide-react';
import { Course, VideoItem, TaskItem, TaskPriority, CreateTaskPayload, UpdateTaskPayload } from '../../types';
import { courseService } from '../../services';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TaskItem | null;
  courses: Course[];
  defaultDateStr: string;
  onSubmitCreate: (payload: CreateTaskPayload) => Promise<void>;
  onSubmitUpdate: (taskId: string, payload: UpdateTaskPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  courses,
  defaultDateStr,
  onSubmitCreate,
  onSubmitUpdate,
  isSubmitting = false,
}) => {
  const isEditMode = Boolean(taskToEdit);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDateStr);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [courseId, setCourseId] = useState('');
  const [videoId, setVideoId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [courseVideos, setCourseVideos] = useState<VideoItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      const taskDate = taskToEdit.date ? taskToEdit.date.slice(0, 10) : defaultDateStr;
      setDate(taskDate);
      setPriority(taskToEdit.priority || 'medium');

      const cId =
        typeof taskToEdit.course === 'object' && taskToEdit.course !== null
          ? taskToEdit.course._id
          : (taskToEdit.course as string) || '';
      const vId =
        typeof taskToEdit.video === 'object' && taskToEdit.video !== null
          ? taskToEdit.video._id
          : (taskToEdit.video as string) || '';

      setCourseId(cId);
      setVideoId(vId);
      setErrorMsg(null);
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultDateStr);
      setPriority('medium');
      setCourseId('');
      setVideoId('');
      setErrorMsg(null);
    }
  }, [isOpen, taskToEdit, defaultDateStr]);

  // Fetch videos whenever selected course changes
  useEffect(() => {
    if (!courseId) {
      setCourseVideos([]);
      setVideoId('');
      return;
    }

    let isMounted = true;
    setIsLoadingVideos(true);
    courseService
      .getCourseVideos(courseId)
      .then((res) => {
        if (!isMounted) return;
        setCourseVideos(res.videos || []);
      })
      .catch((err) => {
        console.error('Failed to load course lessons:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingVideos(false);
      });

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Task title is required');
      return;
    }

    try {
      if (isEditMode && taskToEdit) {
        await onSubmitUpdate(taskToEdit._id, {
          title: title.trim(),
          description: description.trim(),
          date,
          priority,
          courseId: courseId || null,
          videoId: videoId || null,
        });
      } else {
        await onSubmitCreate({
          title: title.trim(),
          description: description.trim(),
          date,
          priority,
          courseId: courseId || undefined,
          videoId: videoId || undefined,
        });
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save task';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 p-4 sm:px-6">
          <h3 id="task-modal-title" className="text-base sm:text-lg font-bold text-white">
            {isEditMode ? 'Edit Task' : 'Add Study Task'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Watch Binary Search lecture, Solve 3 trees problems..."
              maxLength={200}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 p-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
              required
            />
          </div>

          {/* Date & Priority row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Target Date <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-800 bg-gray-950 pl-8 pr-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 p-2 text-xs text-white focus:border-red-500 focus:outline-none cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Optional Course & Lesson Linking */}
          <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
              <BookOpen className="h-4 w-4 text-red-400" />
              <span>Link with Course / Lesson (Optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                  Course
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 p-2 text-xs text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="">None (General Task)</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 mb-1">
                  Lesson
                </label>
                <select
                  value={videoId}
                  disabled={!courseId || isLoadingVideos}
                  onChange={(e) => setVideoId(e.target.value)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 p-2 text-xs text-white focus:border-red-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="">
                    {isLoadingVideos ? 'Loading lessons...' : 'None (Course level)'}
                  </option>
                  {courseVideos.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.position}. {v.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Description / Notes <span className="text-gray-500 text-[11px]">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key goals, problem links, or reminders..."
              maxLength={1000}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 p-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-500 disabled:opacity-50 transition-all"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEditMode ? 'Save Changes' : 'Add Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
