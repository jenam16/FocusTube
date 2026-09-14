import React, { useEffect, useState } from 'react';
import { X, Calendar as CalendarIcon, Loader2, ArrowRight } from 'lucide-react';
import { TaskItem } from '../../types';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onReschedule: (taskId: string, newDateStr: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  task,
  onReschedule,
  isSubmitting = false,
}) => {
  const todayStr = (() => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  const tomorrowStr = (() => {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() + 1);
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  const nextWeekStr = (() => {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() + 7);
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDate(todayStr);
    setErrorMsg(null);
  }, [isOpen, todayStr]);

  if (!isOpen || !task) return null;

  const handleApply = async (dateToUse: string) => {
    try {
      setErrorMsg(null);
      await onReschedule(task._id, dateToUse);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reschedule task';
      setErrorMsg(msg);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-modal-title"
        className="w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 id="reschedule-modal-title" className="text-base font-bold text-white">
                Reschedule Task
              </h3>
              <p className="text-[11px] text-gray-400">
                Pick a new target date for this task.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Task Summary Card */}
        <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-3 space-y-1">
          <span className="text-xs font-semibold text-gray-200 block truncate">
            {task.title}
          </span>
          <span className="text-[11px] text-gray-500 block">
            Current date: {formatDate(task.date)}
          </span>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Quick presets */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Quick Reschedule
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleApply(todayStr)}
              className="rounded-xl border border-gray-800 bg-gray-950/60 p-2 text-xs font-semibold text-gray-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-white transition-all disabled:opacity-50"
            >
              Today
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleApply(tomorrowStr)}
              className="rounded-xl border border-gray-800 bg-gray-950/60 p-2 text-xs font-semibold text-gray-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-white transition-all disabled:opacity-50"
            >
              Tomorrow
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleApply(nextWeekStr)}
              className="rounded-xl border border-gray-800 bg-gray-950/60 p-2 text-xs font-semibold text-gray-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-white transition-all disabled:opacity-50"
            >
              Next Week
            </button>
          </div>
        </div>

        {/* Custom date picker */}
        <div className="space-y-1.5 pt-2 border-t border-gray-800/80">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Or pick specific date
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 pl-9 pr-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-800 bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || !selectedDate}
            onClick={() => handleApply(selectedDate)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-600/20 hover:bg-red-500 disabled:opacity-50 transition-all"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Reschedule</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
