export interface NoteCourseInfo {
  _id: string;
  title: string;
  thumbnail?: string;
  playlistId?: string;
}

export interface NoteVideoInfo {
  _id: string;
  title: string;
  position: number;
  durationSeconds: number;
  isAvailable: boolean;
  youtubeVideoId?: string;
}

export interface NoteItem {
  _id: string;
  user: string;
  course: string | NoteCourseInfo;
  video: string | NoteVideoInfo;
  noteType?: 'text' | 'screenshot';
  screenshotUrl?: string;
  cloudinaryPublicId?: string;
  youtubeVideoId?: string;
  title?: string;
  content: string;
  timestampSeconds: number | null;
  isPinned?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoNotesResponse {
  success: boolean;
  notes: NoteItem[];
}

export interface GroupedVideoNotes {
  videoId: string;
  videoTitle: string;
  position: number;
  durationSeconds: number;
  isAvailable: boolean;
  notesCount: number;
  notes: NoteItem[];
}

export interface GroupedCourseNotes {
  courseId: string;
  courseTitle: string;
  courseThumbnail?: string;
  totalNotes: number;
  videos: GroupedVideoNotes[];
}

export interface AllNotesResponse {
  success: boolean;
  totalNotes: number;
  courses: GroupedCourseNotes[];
}

export interface NotesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  courseId?: string;
  videoId?: string;
  noteType?: 'text' | 'screenshot';
  pinned?: boolean;
  tag?: string;
  sortBy?: 'updated' | 'created' | 'oldest' | 'title' | 'pinnedFirst';
}

export interface PaginatedNotesResponse {
  success: boolean;
  notes: NoteItem[];
  total: number;
  page: number;
  totalPages: number;
  totalPinned: number;
  tags: string[];
}

export interface CreateNotePayload {
  courseId: string;
  videoId: string;
  title?: string;
  content: string;
  timestampSeconds?: number | null;
  isPinned?: boolean;
  tags?: string[];
}

export interface CreateScreenshotNotePayload {
  courseId: string;
  videoId: string;
  youtubeVideoId?: string;
  imageBase64: string;
  timestampSeconds: number;
  title?: string;
  content?: string;
  isPinned?: boolean;
  tags?: string[];
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  timestampSeconds?: number | null;
  isPinned?: boolean;
  tags?: string[];
}
