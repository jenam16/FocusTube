export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface AIContextData {
  insight: string;
  courseId?: string;
  courseTitle?: string;
  progressPercentage?: number;
  nextVideoId?: string;
  nextVideoTitle?: string;
  todayTasksRemaining?: number;
}

export interface AIChatPayload {
  message: string;
  courseId?: string;
  videoId?: string;
  timestampSeconds?: number;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
}
