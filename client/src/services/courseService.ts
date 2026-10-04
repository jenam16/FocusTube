import { request } from './api';
import {
  Course,
  VideoItem,
  ImportCourseResponse,
  CourseDetailResponse,
  WatchVideoResponse,
  AISummaryData,
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

  async getVideoSummary(
    courseId: string,
    videoId: string
  ): Promise<{ summary: AISummaryData; cached: boolean }> {
    const res = await request<{
      success: boolean;
      data: {
        summary: AISummaryData;
        cached: boolean;
      };
    }>(`/courses/${courseId}/videos/${videoId}/summary`, {
      method: 'POST',
    });
    return res.data;
  },
};
