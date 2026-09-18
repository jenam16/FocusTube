import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { VideoItem, VideoProgress } from '../../types';
import { LessonItem } from './LessonItem';

interface LessonListProps {
  courseId: string;
  videos: VideoItem[];
  progressMap?: Record<string, VideoProgress>;
  bookmarkedVideoIds?: string[];
  activeVideoId?: string;
  onSelectVideo?: (video: VideoItem) => void;
  maxHeightClass?: string;
}

export const LessonList = ({
  courseId,
  videos,
  progressMap,
  bookmarkedVideoIds,
  activeVideoId,
  onSelectVideo,
  maxHeightClass = '',
}: LessonListProps) => {

  // Sort strictly by position ASC
  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => a.position - b.position);
  }, [videos]);

  const { completedCount, availableCount } = useMemo(() => {
    let completed = 0;
    let available = 0;
    for (const v of sortedVideos) {
      if (v.isAvailable !== false) {
        available++;
        const p = progressMap
          ? progressMap[v._id] || progressMap[v.youtubeVideoId]
          : undefined;
        if (p?.completed) {
          completed++;
        }
      }
    }
    return { completedCount: completed, availableCount: available };
  }, [sortedVideos, progressMap]);

  if (sortedVideos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#111827]/40 p-10 text-center text-sm text-slate-400">
        No lessons found in this course syllabus.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-400" />
          <h3 className="text-base font-bold text-white font-heading">Course Syllabus</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {completedCount > 0 && (
            <span className="text-emerald-400 font-semibold">
              {completedCount}/{availableCount} completed
            </span>
          )}
          {completedCount > 0 && <span>•</span>}
          <span>
            {sortedVideos.length}{' '}
            {sortedVideos.length === 1 ? 'Lesson' : 'Lessons'}
          </span>
        </div>
      </div>

      {/* Lesson List Container */}
      <div
        className={`space-y-1.5 overflow-y-auto rounded-2xl border border-white/[0.07] bg-[#0B101E] p-2 shadow-lg shadow-black/20 ${maxHeightClass}`}
      >
        {sortedVideos.map((video) => (
          <LessonItem
            key={video._id}
            courseId={courseId}
            video={video}
            progress={
              progressMap
                ? progressMap[video._id] || progressMap[video.youtubeVideoId]
                : undefined
            }
            isSelected={video._id === activeVideoId}
            isBookmarked={bookmarkedVideoIds?.includes(video._id)}
            onSelect={onSelectVideo}
          />
        ))}
      </div>
    </div>
  );
};
