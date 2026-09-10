export interface TaskItem {
  _id: string;
  user: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TasksSummary {
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
}

export interface TasksResponse {
  success: boolean;
  tasks: TaskItem[];
  summary: TasksSummary;
}

export interface CreateTaskPayload {
  title: string;
}

export interface UpdateTaskPayload {
  title?: string;
  completed?: boolean;
}
