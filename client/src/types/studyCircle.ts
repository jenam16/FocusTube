export interface StudyCircleVideo {
  videoId: string;
  youtubeVideoId?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
  position: number;
}

export interface StudyCirclePlaylistSnapshot {
  title: string;
  description?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  totalVideos: number;
  videos: StudyCircleVideo[];
}

export interface StudyCircleHost {
  _id?: string;
  name: string;
  email?: string;
  avatar?: string;
  avatarUrl?: string;
}

export interface StudyCircleSummary {
  _id: string;
  name: string;
  description?: string;
  host?: StudyCircleHost;
  hostId?: StudyCircleHost;
  isHost: boolean;
  role?: 'host' | 'member';
  userRole?: 'host' | 'member';
  memberCount: number;
  maxMembers: number;
  courseTitle?: string;
  courseThumbnail?: string;
  totalVideos?: number;
  myProgressPercentage?: number;
  myCompletedVideosCount?: number;
  userProgressPercentage?: number;
  userCompletedVideosCount?: number;
  playlistSnapshot?: StudyCirclePlaylistSnapshot;
  isAddedToCourses?: boolean;
  personalCourseId?: string | null;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StudyCircleMembershipData {
  _id: string;
  circleId: string;
  userId: string;
  role: 'host' | 'member';
  currentVideoId?: string;
  positionSeconds: number;
  completedVideoIds: string[];
  completedVideosCount: number;
  progressPercentage: number;
  lastActiveAt: string;
}

export interface StudyCircleDetails {
  _id: string;
  name: string;
  description?: string;
  sourceCourseId: string;
  hostId: StudyCircleHost;
  playlistSnapshot: StudyCirclePlaylistSnapshot;
  memberCount: number;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
  isHost?: boolean;
  isAddedToCourses?: boolean;
  personalCourseId?: string | null;
}

export interface AddToCoursesResponse {
  success: boolean;
  alreadyAdded: boolean;
  isAddedToCourses: boolean;
  courseId: string;
  courseTitle: string;
  progressPercentage?: number;
  message: string;
}

export interface StudyCircleMember {
  _id: string;
  userId: string;
  name: string;
  avatar?: string | null;
  role: 'host' | 'member';
  currentVideoId?: string;
  positionSeconds: number;
  completedVideosCount: number;
  progressPercentage: number;
  lastActiveAt: string;
  joinedAt?: string;
}

export interface DoubtReply {
  _id: string;
  circleId: string;
  authorId: {
    _id: string;
    name: string;
    avatar?: string | null;
  };
  body: string;
  parentId: string;
  createdAt: string;
}

export interface StudyCircleDiscussion {
  _id: string;
  circleId: string;
  authorId: {
    _id: string;
    name: string;
    avatar?: string | null;
  };
  title?: string;
  body: string;
  videoId?: string;
  videoTitle?: string;
  timestampSeconds?: number;
  parentId?: string | null;
  isResolved: boolean;
  resolvedBy?: {
    _id: string;
    name: string;
  } | null;
  resolvedAt?: string | null;
  createdAt: string;
  replies?: DoubtReply[];
}

export interface CircleJoinInfo {
  _id: string;
  name: string;
  description?: string;
  hostName: string;
  hostAvatar?: string | null;
  courseTitle: string;
  courseThumbnail?: string;
  totalVideos: number;
  memberCount: number;
  maxMembers: number;
  isFull: boolean;
  isAlreadyMember: boolean;
}

export interface CreateCircleDto {
  name: string;
  description?: string;
  courseId?: string;
  sourceCourseId?: string;
}

export interface UpdateCircleProgressDto {
  videoId: string;
  positionSeconds?: number;
  completed?: boolean;
}

export interface CreateDoubtDto {
  body: string;
  title?: string;
  videoId?: string;
  videoTitle?: string;
  timestampSeconds?: number;
}
