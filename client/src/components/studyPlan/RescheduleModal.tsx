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
      const d = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
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
        className="w-full max-w-sm rounded-2xl border border-app bg-surface p-6 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 id="reschedule-modal-title" className="text-base font-bold text-primary font-heading">
                Reschedule Task
              </h3>
              <p className="text-[11px] text-muted">
                Pick a new target date for this task.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-surface-elevated hover:text-primary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Task Summary Card */}
        <div className="rounded-xl border border-app bg-secondary/50 p-3 space-y-1">
          <span className="text-xs font-semibold text-primary block truncate">
            {task.title}
          </span>
          <span className="text-[11px] text-muted block">
            Current date: {formatDate(task.date)}
          </span>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400">
            {errorMsg}
          </div>
        )}

        {/* Quick presets */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wider">
            Quick Reschedule
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleApply(todayStr)}
              className="rounded-xl border border-app bg-surface-elevated p-2 text-xs font-semibold text-secondary hover:border-indigo-500/40 hover:text-primary transition-all disabled:opacity-50 cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleApply(tomorrowStr)}
              className="rounded-xl border border-app bg-surface-elevated p-2 text-xs font-semibold text-secondary hover:border-indigo-500/40 hover:text-primary transition-all disabled:opacity-50 cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleApply(nextWeekStr)}
              className="rounded-xl border border-app bg-surface-elevated p-2 text-xs font-semibold text-secondary hover:border-indigo-500/40 hover:text-primary transition-all disabled:opacity-50 cursor-pointer"
            >
              Next Week
            </button>
          </div>
        </div>

        {/* Custom date picker */}
        <div className="space-y-1.5 pt-2 border-t border-app">
          <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wider">
            Or pick specific date
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-app bg-secondary pl-9 pr-3 py-2 text-xs text-primary focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-app bg-surface-elevated px-3.5 py-1.5 text-xs font-semibold text-secondary hover:text-primary cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || !selectedDate}
            onClick={() => handleApply(selectedDate)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
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
