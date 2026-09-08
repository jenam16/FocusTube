import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { VideoItem } from '../../types';
import { LessonItem } from './LessonItem';

interface LessonListProps {
  courseId: string;
  videos: VideoItem[];
  activeVideoId?: string;
  onSelectVideo?: (video: VideoItem) => void;
  maxHeightClass?: string;
}

export const LessonList = ({
  courseId,
  videos,
  activeVideoId,
  onSelectVideo,
  maxHeightClass = '',
}: LessonListProps) => {
  // Sort strictly by position ASC
  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => a.position - b.position);
  }, [videos]);

  if (sortedVideos.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-10 text-center text-sm text-gray-400">
        No lessons found in this course syllabus.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-red-400" />
          <h3 className="text-base font-bold text-white">Course Syllabus</h3>
        </div>
        <span className="text-xs text-gray-400">
          {sortedVideos.length}{' '}
          {sortedVideos.length === 1 ? 'Lesson' : 'Lessons'}
        </span>
      </div>

      {/* Lesson List Container */}
      <div
        className={`space-y-1.5 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900/50 p-2 shadow-sm ${maxHeightClass}`}
      >
        {sortedVideos.map((video) => (
          <LessonItem
            key={video._id}
            courseId={courseId}
            video={video}
            isSelected={video._id === activeVideoId}
            onSelect={onSelectVideo}
          />
        ))}
      </div>
    </div>
  );
};
