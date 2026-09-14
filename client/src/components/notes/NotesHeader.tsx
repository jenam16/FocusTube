import React from 'react';
import { FileText, Plus, Pin } from 'lucide-react';

interface NotesHeaderProps {
  totalNotes: number;
  totalPinned: number;
  onNewNote: () => void;
}

export const NotesHeader: React.FC<NotesHeaderProps> = ({
  totalNotes,
  totalPinned,
  onNewNote,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading">
              Notes Workspace
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] border border-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-slate-300">
              <span>
                {totalNotes} {totalNotes === 1 ? 'note' : 'notes'}
              </span>
              {totalPinned > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                    <Pin className="h-3 w-3 fill-current rotate-45" />
                    {totalPinned} pinned
                  </span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Search, filter, and organize notes across all courses and lessons.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNewNote}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 active:scale-[0.98] transition-all shrink-0"
      >
        <Plus className="h-4 w-4 stroke-[2.5]" />
        <span>New Note</span>
      </button>
    </div>
  );
};
