import { request } from './api';
import {
  BookmarksListResponse,
  CourseBookmarksResponse,
  AddBookmarkPayload,
  BookmarkItem,
} from '../types';

export const bookmarkService = {
  getBookmarks: async (): Promise<BookmarksListResponse> => {
    return request<BookmarksListResponse>('/bookmarks');
  },

  getCourseBookmarks: async (courseId: string): Promise<CourseBookmarksResponse> => {
    return request<CourseBookmarksResponse>(`/bookmarks/course/${courseId}`);
  },

  addBookmark: async (
    payload: AddBookmarkPayload
  ): Promise<{ success: boolean; bookmark: BookmarkItem }> => {
    return request<{ success: boolean; bookmark: BookmarkItem }>('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  removeBookmark: async (videoId: string): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/bookmarks/video/${videoId}`, {
      method: 'DELETE',
    });
  },
};
