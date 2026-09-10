import { request } from './api';
import {
  TasksResponse,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskItem,
} from '../types';

export const taskService = {
  getTasks: async (): Promise<TasksResponse> => {
    return request<TasksResponse>('/tasks');
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

  deleteTask: async (taskId: string): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
};
