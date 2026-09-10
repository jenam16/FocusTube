import { Course, VideoItem } from './course';

export interface VideoProgress {
  _id: string;
  user: string;
  course: string;
  video: string;
  watchedSeconds: number;
  durationSeconds: number;
  progressPercentage: number;
  lastWatchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgressResponse {
  courseId: string;
  progress: VideoProgress[];
  courseProgressPercentage: number;
}

export interface VideoProgressResponse {
  progress?: VideoProgress;
  videoId?: string;
  courseId?: string;
  watchedSeconds?: number;
  durationSeconds?: number;
  progressPercentage?: number;
  lastWatchedAt?: string | null;
}

export interface RecentProgressResponse {
  recent: {
    _id: string;
    user: string;
    course: Course;
    video: VideoItem;
    watchedSeconds: number;
    durationSeconds: number;
    progressPercentage: number;
    lastWatchedAt: string;
  } | null;
}

export interface UpdateVideoProgressPayload {
  courseId: string;
  watchedSeconds: number;
  durationSeconds: number;
}
