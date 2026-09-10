export interface BookmarkItem {
  _id: string;
  user: string;
  course: {
    _id: string;
    title: string;
    thumbnail?: string;
  };
  video: {
    _id: string;
    title: string;
    position: number;
    durationSeconds: number;
    isAvailable: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BookmarksListResponse {
  success: boolean;
  bookmarks: BookmarkItem[];
}

export interface CourseBookmarksResponse {
  success: boolean;
  bookmarkedVideoIds: string[];
}

export interface AddBookmarkPayload {
  courseId: string;
  videoId: string;
}
