export interface DayActivity {
  date: string;
  label: string;
  videosCompleted: number;
  tasksCompleted: number;
}

export interface CourseAnalyticsStat {
  courseId: string;
  title: string;
  completedVideos: number;
  totalAvailableVideos: number;
  completionPercentage: number;
  completed: boolean;
}

export interface AnalyticsData {
  completedVideos: number;
  completedCourses: number;
  totalCourses: number;
  currentStreak: number;
  longestStreak: number;
  tasks: {
    total: number;
    completed: number;
    completionRate: number;
  };
  weeklyActivity: DayActivity[];
  courseStats: CourseAnalyticsStat[];
  insights: string[];
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
}
