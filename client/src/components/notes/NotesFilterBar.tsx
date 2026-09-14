import React, { useEffect, useState } from 'react';
import { Search, X, Pin, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Course, VideoItem } from '../../types';

interface NotesFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  courses: Course[];
  selectedCourseId: string;
  onCourseChange: (courseId: string) => void;
  videos: VideoItem[];
  selectedVideoId: string;
  onVideoChange: (videoId: string) => void;
  pinnedOnly: boolean;
  onPinnedChange: (pinned: boolean) => void;
  tags: string[];
  selectedTag: string;
  onTagChange: (tag: string) => void;
  sortBy: 'pinnedFirst' | 'updated' | 'created' | 'oldest' | 'title';
  onSortChange: (sort: 'pinnedFirst' | 'updated' | 'created' | 'oldest' | 'title') => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const NotesFilterBar: React.FC<NotesFilterBarProps> = ({
  search,
  onSearchChange,
  courses,
  selectedCourseId,
  onCourseChange,
  videos,
  selectedVideoId,
  onVideoChange,
  pinnedOnly,
  onPinnedChange,
  tags,
  selectedTag,
  onTagChange,
  sortBy,
  onSortChange,
  onResetFilters,
  hasActiveFilters,
}) => {
  // Local state for debounced search input
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#111827] p-3.5 backdrop-blur-sm">
      {/* Top row: Search input + Pinned Toggle + Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search notes by title, content, or tags..."
            className="w-full rounded-xl border border-white/[0.08] bg-[#0B1120] pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 transition-all"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Pinned filter toggle button */}
        <button
          type="button"
          onClick={() => onPinnedChange(!pinnedOnly)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
            pinnedOnly
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-sm shadow-amber-500/10'
              : 'border-white/[0.08] bg-[#0B1120] text-slate-400 hover:border-white/[0.15] hover:text-slate-200'
          }`}
          title="Filter by pinned notes"
        >
          <Pin className={`h-3.5 w-3.5 rotate-45 ${pinnedOnly ? 'fill-current text-amber-400' : ''}`} />
          <span>Pinned</span>
        </button>

        {/* Sort Select */}
        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={(e) =>
              onSortChange(
                e.target.value as 'pinnedFirst' | 'updated' | 'created' | 'oldest' | 'title'
              )
            }
            aria-label="Sort notes"
            className="appearance-none rounded-xl border border-white/[0.08] bg-[#0B1120] pl-3 pr-8 py-2 text-xs font-medium text-slate-300 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/60 transition-all cursor-pointer"
          >
            <option value="pinnedFirst">Pinned First</option>
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title (A-Z)</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Second row: Course & Lesson filters + Reset */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
          <span>Filter:</span>
        </div>

        {/* Course Dropdown */}
        <select
          value={selectedCourseId}
          onChange={(e) => onCourseChange(e.target.value)}
          aria-label="Filter by course"
          className="max-w-[200px] sm:max-w-[260px] truncate rounded-xl border border-white/[0.08] bg-[#0B1120] px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500/50 focus:outline-none cursor-pointer"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>

        {/* Lesson Dropdown (visible when course is chosen) */}
        {selectedCourseId && videos.length > 0 && (
          <select
            value={selectedVideoId}
            onChange={(e) => onVideoChange(e.target.value)}
            aria-label="Filter by lesson"
            className="max-w-[200px] sm:max-w-[240px] truncate rounded-xl border border-white/[0.08] bg-[#0B1120] px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500/50 focus:outline-none cursor-pointer"
          >
            <option value="">All Lessons</option>
            {videos.map((v) => (
              <option key={v._id} value={v._id}>
                {v.position}. {v.title}
              </option>
            ))}
          </select>
        )}

        {/* Tag pills */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto py-0.5">
            {tags.slice(0, 8).map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagChange(isSelected ? '' : tag)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'bg-[#0B1120] border border-white/[0.08] text-slate-400 hover:border-white/[0.15] hover:text-slate-200'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
