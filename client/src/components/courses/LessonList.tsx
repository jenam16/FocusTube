import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { VideoItem } from '../../types';
import { LessonItem } from './LessonItem';

interface LessonListProps {
  courseId: string;
  videos: VideoItem[];
  activeVideoId?: string;
}

export const LessonList = ({
  courseId,
  videos,
  activeVideoId,
}: LessonListProps) => {
  // Sort strictly by position ASC as mandated
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-bold text-white">Course Syllabus</h2>
        </div>
        <span className="text-xs text-gray-400">
          {sortedVideos.length}{' '}
          {sortedVideos.length === 1 ? 'Lesson' : 'Lessons'}
        </span>
      </div>

      {/* Lesson List Container */}
      <div className="divide-y divide-gray-800/80 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 shadow-sm">
        {sortedVideos.map((video) => (
          <LessonItem
            key={video._id}
            courseId={courseId}
            video={video}
            isSelected={video._id === activeVideoId}
          />
        ))}
      </div>
    </div>
  );
};
