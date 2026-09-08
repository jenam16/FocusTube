import { VideoItem } from '../types';

/**
 * Returns only videos that are available and have a valid youtubeVideoId,
 * strictly sorted by position ASC.
 */
export const getPlayableVideos = (videos: VideoItem[]): VideoItem[] => {
  return [...videos]
    .filter((v) => v.isAvailable !== false && Boolean(v.youtubeVideoId))
    .sort((a, b) => a.position - b.position);
};

/**
 * Returns the first playable video in the course according to position ASC,
 * or null if no videos are playable.
 */
export const getFirstPlayableVideo = (videos: VideoItem[]): VideoItem | null => {
  const playable = getPlayableVideos(videos);
  return playable.length > 0 ? playable[0] : null;
};

/**
 * Returns the next playable video, skipping any unavailable videos.
 * Returns null if current video is the last playable video or not found.
 */
export const getNextPlayableVideo = (
  videos: VideoItem[],
  currentVideoId?: string
): VideoItem | null => {
  if (!currentVideoId) return null;
  const playable = getPlayableVideos(videos);
  const currentIndex = playable.findIndex(
    (v) => v._id === currentVideoId || v.youtubeVideoId === currentVideoId
  );

  if (currentIndex === -1 || currentIndex >= playable.length - 1) {
    return null;
  }

  return playable[currentIndex + 1];
};

/**
 * Returns the previous playable video, skipping any unavailable videos.
 * Returns null if current video is the first playable video or not found.
 */
export const getPreviousPlayableVideo = (
  videos: VideoItem[],
  currentVideoId?: string
): VideoItem | null => {
  if (!currentVideoId) return null;
  const playable = getPlayableVideos(videos);
  const currentIndex = playable.findIndex(
    (v) => v._id === currentVideoId || v.youtubeVideoId === currentVideoId
  );

  if (currentIndex <= 0) {
    return null;
  }

  return playable[currentIndex - 1];
};
