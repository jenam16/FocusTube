import { request } from './api';
import {
  StudyMaterialsResponse,
  StudyMaterialResponse,
  CreateStudyMaterialPayload,
  UpdateStudyMaterialPayload,
} from '../types';

export const studyMaterialService = {
  getStudyMaterials: async (search?: string, fileType?: string): Promise<StudyMaterialsResponse> => {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (fileType && fileType !== 'all') params.append('fileType', fileType);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<StudyMaterialsResponse>(`/study-materials${queryString}`);
  },

  getStudyMaterialById: async (id: string): Promise<StudyMaterialResponse> => {
    return request<StudyMaterialResponse>(`/study-materials/${id}`);
  },

  createStudyMaterial: async (
    payload: CreateStudyMaterialPayload
  ): Promise<StudyMaterialResponse> => {
    return request<StudyMaterialResponse>('/study-materials', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateStudyMaterial: async (
    id: string,
    payload: UpdateStudyMaterialPayload
  ): Promise<StudyMaterialResponse> => {
    return request<StudyMaterialResponse>(`/study-materials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteStudyMaterial: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/study-materials/${id}`, {
      method: 'DELETE',
    });
  },
};
