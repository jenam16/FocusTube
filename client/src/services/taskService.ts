import { request } from './api';
import {
  TasksResponse,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskItem,
  OverdueTasksResponse,
  DateSummariesResponse,
} from '../types';

export const taskService = {
  getTasks: async (params?: {
    date?: string;
    from?: string;
    to?: string;
    status?: 'completed' | 'pending';
  }): Promise<TasksResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.set('date', params.date);
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);
    if (params?.status) searchParams.set('status', params.status);

    const qs = searchParams.toString();
    return request<TasksResponse>(`/tasks${qs ? `?${qs}` : ''}`);
  },

  getOverdueTasks: async (): Promise<OverdueTasksResponse> => {
    return request<OverdueTasksResponse>('/tasks/overdue');
  },

  getUpcomingSummary: async (): Promise<DateSummariesResponse> => {
    return request<DateSummariesResponse>('/tasks/upcoming-summary');
  },

  getHistorySummary: async (page = 1): Promise<DateSummariesResponse> => {
    return request<DateSummariesResponse>(`/tasks/history-summary?page=${page}`);
  },

  createTask: async (payload: CreateTaskPayload): Promise<{ success: boolean; task: TaskItem }> => {
    return request<{ success: boolean; task: TaskItem }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTask: async (
    taskId: string,
    payload: UpdateTaskPayload
  ): Promise<{ success: boolean; task: TaskItem }> => {
    return request<{ success: boolean; task: TaskItem }>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  rescheduleTask: async (
    taskId: string,
    date: string
  ): Promise<{ success: boolean; task: TaskItem }> => {
    return request<{ success: boolean; task: TaskItem }>(`/tasks/${taskId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ date }),
    });
  },

  deleteTask: async (taskId: string): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
};

