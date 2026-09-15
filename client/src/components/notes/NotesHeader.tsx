import React from 'react';
import { FileText, Plus, Pin, Camera } from 'lucide-react';

interface NotesHeaderProps {
  totalNotes: number;
  totalPinned: number;
  activeTab?: 'all' | 'screenshots';
  onTabChange?: (tab: 'all' | 'screenshots') => void;
  onNewNote: () => void;
}

export const NotesHeader: React.FC<NotesHeaderProps> = ({
  totalNotes,
  totalPinned,
  activeTab = 'all',
  onTabChange,
  onNewNote,
}) => {
  return (
    <div className="flex flex-col gap-3 pb-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              Search, filter, and organize notes and captured video moments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onNewNote}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 active:scale-[0.98] transition-all shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      {onTabChange && (
        <div className="flex items-center gap-2 border-b border-white/[0.06] pt-1 pb-2">
          <button
            type="button"
            onClick={() => onTabChange('all')}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>All Notes</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('screenshots')}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'screenshots'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Captured Moments</span>
          </button>
        </div>
      )}
    </div>
  );
};
