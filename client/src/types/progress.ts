import { Course, VideoItem } from './course';

export interface VideoProgress {
  _id: string;
  user: string;
  course: string;
  video: string;
  watchedSeconds: number;
  durationSeconds: number;
  progressPercentage: number;
  completed: boolean;
  completedAt: string | null;
  lastWatchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseResumeTarget {
  videoId: string;
  watchedSeconds: number;
  durationSeconds: number;
  completed: boolean;
}

export interface CourseProgressResponse {
  courseId: string;
  progress: VideoProgress[];
  courseProgressPercentage: number;
  completedVideos: number;
  totalAvailableVideos: number;
  courseCompleted: boolean;
  resumeTarget?: CourseResumeTarget | null;
}

export interface VideoProgressResponse {
  progress?: VideoProgress;
  videoId?: string;
  courseId?: string;
  watchedSeconds?: number;
  durationSeconds?: number;
  progressPercentage?: number;
  completed?: boolean;
  completedAt?: string | null;
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
    completed: boolean;
    completedAt: string | null;
    lastWatchedAt: string;
  } | null;
  targetVideo?: VideoItem | null;
  nextVideo?: VideoItem | null;
  targetProgress?: VideoProgress | null;
  courseCompleted?: boolean;
  completedVideos?: number;
  totalAvailableVideos?: number;
}

export interface UpdateVideoProgressPayload {
  courseId: string;
  watchedSeconds: number;
  durationSeconds: number;
  isEnded?: boolean;
}

