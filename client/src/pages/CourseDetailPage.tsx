import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { courseService } from '../services';
import {
  CourseHeader,
  CourseStats,
  LessonList,
  LoadingState,
  ErrorState,
} from '../components';

export const CourseDetailPage = () => {
  const params = useParams<{ courseId?: string; id?: string }>();
  const courseId = params.courseId || params.id;

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId!),
    enabled: !!courseId,
  });

  if (isLoading) {
    return <LoadingState type="details" />;
  }

  if (error || !data?.course) {
    return (
      <ErrorState
        title="Course not found"
        message="The requested course does not exist or you do not have permission to view it."
        backLink="/courses"
        backLabel="Go back to Courses"
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  const { course, videos } = data;
  const sortedVideos = [...videos].sort((a, b) => a.position - b.position);
  const firstVideo = sortedVideos.find((v) => v.isAvailable !== false) || sortedVideos[0];

  return (
    <div className="space-y-8">
      {/* Course Header Banner with Progress Bar & Details */}
      <CourseHeader course={course} firstVideo={firstVideo} />

      {/* Course Statistics */}
      <CourseStats course={course} />

      {/* Course Syllabus / Ordered Video List */}
      <LessonList courseId={course._id} videos={sortedVideos} />
    </div>
  );
};
