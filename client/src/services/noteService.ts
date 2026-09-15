import { request } from './api';
import {
  VideoNotesResponse,
  AllNotesResponse,
  PaginatedNotesResponse,
  NotesQueryParams,
  CreateNotePayload,
  CreateScreenshotNotePayload,
  UpdateNotePayload,
  NoteItem,
} from '../types';

export const noteService = {
  getVideoNotes: async (videoId: string): Promise<VideoNotesResponse> => {
    return request<VideoNotesResponse>(`/notes/video/${videoId}`);
  },

  getNotes: async (params?: NotesQueryParams): Promise<PaginatedNotesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.courseId) searchParams.set('courseId', params.courseId);
    if (params?.videoId) searchParams.set('videoId', params.videoId);
    if (params?.noteType) searchParams.set('noteType', params.noteType);
    if (params?.pinned !== undefined) searchParams.set('pinned', String(params.pinned));
    if (params?.tag) searchParams.set('tag', params.tag);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);

    const qs = searchParams.toString();
    return request<PaginatedNotesResponse>(`/notes${qs ? `?${qs}` : ''}`);
  },

  getAllNotes: async (): Promise<AllNotesResponse> => {
    return request<AllNotesResponse>('/notes/grouped');
  },

  createNote: async (payload: CreateNotePayload): Promise<{ success: boolean; note: NoteItem }> => {
    return request<{ success: boolean; note: NoteItem }>('/notes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createScreenshotNote: async (
    payload: CreateScreenshotNotePayload
  ): Promise<{ success: boolean; note: NoteItem }> => {
    return request<{ success: boolean; note: NoteItem }>('/notes/screenshot', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateNote: async (
    noteId: string,
    payload: UpdateNotePayload
  ): Promise<{ success: boolean; note: NoteItem }> => {
    return request<{ success: boolean; note: NoteItem }>(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  togglePin: async (noteId: string): Promise<{ success: boolean; note: NoteItem; isPinned: boolean }> => {
    return request<{ success: boolean; note: NoteItem; isPinned: boolean }>(`/notes/${noteId}/pin`, {
      method: 'PATCH',
    });
  },

  deleteNote: async (noteId: string): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  },
};
