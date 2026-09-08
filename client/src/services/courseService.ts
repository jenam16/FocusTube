import { request } from './api';
import {
  Course,
  ImportCourseResponse,
  CourseDetailResponse,
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
};
