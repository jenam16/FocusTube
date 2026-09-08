export interface Course {
  _id: string;
  userId: string;
  playlistId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  totalVideos: number;
  totalDurationSeconds: number;
  progressPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoItem {
  _id: string;
  courseId: string;
  youtubeVideoId: string;
  title: string;
  thumbnail: string;
  durationSeconds: number;
  position: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ImportCourseResponse {
  course: Course;
  videos: VideoItem[];
  message: string;
  isExisting: boolean;
}

export interface CourseDetailResponse {
  course: Course;
  videos: VideoItem[];
}

export interface WatchVideoResponse {
  course: Course;
  video: VideoItem;
  previousVideo: VideoItem | null;
  nextVideo: VideoItem | null;
  currentIndex: number;
  totalVideos: number;
}
