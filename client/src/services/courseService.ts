import { request } from './api';
import {
  Course,
  VideoItem,
  ImportCourseResponse,
  CourseDetailResponse,
  WatchVideoResponse,
} from '../types';

export const courseService = {
  async importCourse(playlistUrl: string): Promise<ImportCourseResponse> {
    return request<ImportCourseResponse>('/courses/import', {
      method: 'POST',
      body: JSON.stringify({ playlistUrl }),
    });
  },

  async getCourses(): Promise<{ courses: Course[] }> {
    return request<{ courses: Course[] }>('/courses', {
      method: 'GET',
    });
  },

  async getCourseById(id: string): Promise<CourseDetailResponse> {
    return request<CourseDetailResponse>(`/courses/${id}`, {
      method: 'GET',
    });
  },

  async getCourseVideos(courseId: string): Promise<{ videos: VideoItem[] }> {
    return request<{ videos: VideoItem[] }>(`/courses/${courseId}/videos`, {
      method: 'GET',
    });
  },

  async getCourseVideoById(
    courseId: string,
    videoId: string
  ): Promise<WatchVideoResponse> {
    return request<WatchVideoResponse>(
      `/courses/${courseId}/videos/${videoId}`,
      {
        method: 'GET',
      }
    );
  },
};
