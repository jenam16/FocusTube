export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskCourseInfo {
  _id: string;
  title: string;
  thumbnail?: string;
}

export interface TaskVideoInfo {
  _id: string;
  title: string;
  position: number;
  durationSeconds: number;
  isAvailable: boolean;
  youtubeVideoId?: string;
}

export interface TaskItem {
  _id: string;
  user: string;
  title: string;
  description?: string;
  course?: string | TaskCourseInfo | null;
  video?: string | TaskVideoInfo | null;
  priority: TaskPriority;
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

export interface DateSummaryItem {
  date: string; // YYYY-MM-DD
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
}

export interface DateSummariesResponse {
  success: boolean;
  summaries: DateSummaryItem[];
  totalDates?: number;
  page?: number;
  totalPages?: number;
}

export interface OverdueTasksResponse {
  success: boolean;
  count: number;
  tasks: TaskItem[];
}

export interface CreateTaskPayload {
  title: string;
  date?: string; // YYYY-MM-DD
  courseId?: string;
  videoId?: string;
  priority?: TaskPriority;
  description?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  completed?: boolean;
  date?: string; // YYYY-MM-DD
  courseId?: string | null;
  videoId?: string | null;
  priority?: TaskPriority;
  description?: string;
}

