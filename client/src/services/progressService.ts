import { request } from './api';
import {
  CourseProgressResponse,
  RecentProgressResponse,
  UpdateVideoProgressPayload,
  VideoProgress,
  VideoProgressResponse,
} from '../types';

export const progressService = {
  async getCourseProgress(courseId: string): Promise<CourseProgressResponse> {
    return request<CourseProgressResponse>(`/progress/course/${courseId}`, {
      method: 'GET',
    });
  },

  async getVideoProgress(videoId: string): Promise<VideoProgressResponse> {
    return request<VideoProgressResponse>(`/progress/video/${videoId}`, {
      method: 'GET',
    });
  },

  async updateVideoProgress(
    videoId: string,
    payload: UpdateVideoProgressPayload
  ): Promise<{ progress: VideoProgress; courseProgressPercentage: number }> {
    return request<{
      progress: VideoProgress;
      courseProgressPercentage: number;
    }>(`/progress/video/${videoId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async getRecentProgress(): Promise<RecentProgressResponse> {
    return request<RecentProgressResponse>('/progress/recent', {
      method: 'GET',
    });
  },
};
