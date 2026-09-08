import { config } from '../config/index.js';

export class YouTubeError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'YouTubeError';
  }
}

export interface ParsedVideoItem {
  youtubeVideoId: string;
  title: string;
  thumbnail: string;
  durationSeconds: number;
  position: number;
  isAvailable: boolean;
}

export interface ParsedPlaylistData {
  playlistId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  totalVideos: number;
  totalDurationSeconds: number;
  videos: ParsedVideoItem[];
}

/**
 * Extracts a YouTube playlist ID from various URL formats or returns the raw ID if valid.
 */
export const extractPlaylistId = (input: string): string | null => {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // If raw playlist ID (starts with PL, UU, FL, RD, etc. typically 10 to 64 chars)
  if (
    /^[a-zA-Z0-9_-]{10,64}$/.test(trimmed) &&
    !trimmed.includes('http') &&
    !trimmed.includes('/') &&
    !trimmed.includes('.')
  ) {
    return trimmed;
  }

  try {
    const url = new URL(
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`
    );
    const listParam = url.searchParams.get('list');
    if (listParam && /^[a-zA-Z0-9_-]{10,64}$/.test(listParam)) {
      return listParam;
    }
  } catch {
    // Regex fallback
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]{10,64})/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Parses an ISO 8601 duration string (e.g. PT1H2M10S, PT15M33S, PT45S) into total seconds.
 */
export const parseISO8601Duration = (duration?: string): number => {
  if (!duration || typeof duration !== 'string') return 0;

  const regex = /P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/;
  const matches = duration.match(regex);

  if (!matches) return 0;

  const days = parseInt(matches[1] || '0', 10);
  const hours = parseInt(matches[2] || '0', 10);
  const minutes = parseInt(matches[3] || '0', 10);
  const seconds = parseInt(matches[4] || '0', 10);

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
};

interface ThumbnailResource {
  url: string;
  width?: number;
  height?: number;
}

const getBestThumbnail = (
  thumbnails?: Record<string, ThumbnailResource | undefined>
): string => {
  if (!thumbnails) return '';
  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    ''
  );
};

interface YouTubeApiErrorResponse {
  error?: {
    code?: number;
    message?: string;
    errors?: Array<{ reason?: string; message?: string }>;
  };
}

/**
 * Service to interact with the YouTube Data API v3.
 * Handles playlists, playlistItems, and video duration lookups with pagination.
 */
export const youtubeService = {
  /**
   * Fetches full playlist metadata and all constituent videos.
   */
  async fetchPlaylistData(playlistId: string): Promise<ParsedPlaylistData> {
    const apiKey = config.youtubeApiKey;

    if (!apiKey) {
      throw new YouTubeError(
        'YouTube API key is not configured on the server. Please set YOUTUBE_API_KEY in server/.env.',
        500
      );
    }

    // 1. Fetch Playlist Details (playlists.list)
    const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlists');
    playlistUrl.searchParams.set('part', 'snippet,contentDetails');
    playlistUrl.searchParams.set('id', playlistId);
    playlistUrl.searchParams.set('key', apiKey);

    let playlistRes: Response;
    try {
      playlistRes = await fetch(playlistUrl.toString());
    } catch (err) {
      throw new YouTubeError(
        `Network error communicating with YouTube: ${err instanceof Error ? err.message : 'Unknown error'}`,
        502
      );
    }

    if (!playlistRes.ok) {
      const errorData = (await playlistRes.json().catch(() => ({}))) as YouTubeApiErrorResponse;
      const reason = errorData.error?.errors?.[0]?.reason;

      if (playlistRes.status === 403) {
        if (reason === 'quotaExceeded') {
          throw new YouTubeError(
            'YouTube API quota exceeded. Please try again later or check your Google Cloud quota.',
            429
          );
        }
        throw new YouTubeError(
          'YouTube API access forbidden. Check API key restrictions or permissions.',
          403
        );
      }

      if (playlistRes.status === 404) {
        throw new YouTubeError('Playlist not found.', 404);
      }

      throw new YouTubeError(
        errorData.error?.message || 'Failed to fetch playlist details from YouTube.',
        playlistRes.status >= 500 ? 502 : 400
      );
    }

    interface YouTubePlaylistsResponse {
      items?: Array<{
        id: string;
        snippet?: {
          title?: string;
          description?: string;
          channelTitle?: string;
          thumbnails?: Record<string, ThumbnailResource>;
        };
        contentDetails?: {
          itemCount?: number;
        };
      }>;
    }

    const playlistData = (await playlistRes.json()) as YouTubePlaylistsResponse;
    if (!playlistData.items || playlistData.items.length === 0) {
      throw new YouTubeError(
        'Playlist not found or is set to private. Make sure the playlist is public or unlisted.',
        404
      );
    }

    const playlistItem = playlistData.items[0];
    const playlistSnippet = playlistItem.snippet || {};

    // 2. Fetch Playlist Items with pagination (playlistItems.list)
    interface RawPlaylistItem {
      videoId: string;
      title: string;
      thumbnail: string;
      position: number;
      isAvailable: boolean;
    }

    const rawItems: RawPlaylistItem[] = [];
    let nextPageToken: string | undefined = undefined;
    let positionCounter = 0;

    interface YouTubePlaylistItemsResponse {
      nextPageToken?: string;
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          position?: number;
          resourceId?: {
            videoId?: string;
          };
          thumbnails?: Record<string, ThumbnailResource>;
        };
        contentDetails?: {
          videoId?: string;
        };
        status?: {
          privacyStatus?: string;
        };
      }>;
    }

    do {
      const itemsUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      itemsUrl.searchParams.set('part', 'snippet,contentDetails,status');
      itemsUrl.searchParams.set('playlistId', playlistId);
      itemsUrl.searchParams.set('maxResults', '50');
      itemsUrl.searchParams.set('key', apiKey);
      if (nextPageToken) {
        itemsUrl.searchParams.set('pageToken', nextPageToken);
      }

      let itemsRes: Response;
      try {
        itemsRes = await fetch(itemsUrl.toString());
      } catch (err) {
        throw new YouTubeError(
          `Network error fetching playlist items: ${err instanceof Error ? err.message : 'Unknown error'}`,
          502
        );
      }

      if (!itemsRes.ok) {
        const errorData = (await itemsRes.json().catch(() => ({}))) as YouTubeApiErrorResponse;
        const reason = errorData.error?.errors?.[0]?.reason;
        if (reason === 'quotaExceeded') {
          throw new YouTubeError(
            'YouTube API quota exceeded while fetching playlist items.',
            429
          );
        }
        throw new YouTubeError(
          errorData.error?.message || 'Failed to fetch items for this playlist.',
          itemsRes.status >= 500 ? 502 : 400
        );
      }

      const itemsData = (await itemsRes.json()) as YouTubePlaylistItemsResponse;
      const pageItems = itemsData.items || [];

      for (const item of pageItems) {
        const videoId =
          item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || '';
        const title = item.snippet?.title || '';
        const isUnavailable =
          !videoId ||
          title === 'Private video' ||
          title === 'Deleted video' ||
          item.status?.privacyStatus === 'private';

        rawItems.push({
          videoId,
          title: isUnavailable ? 'Unavailable Video' : title,
          thumbnail: getBestThumbnail(item.snippet?.thumbnails),
          position: positionCounter++,
          isAvailable: !isUnavailable,
        });
      }

      nextPageToken = itemsData.nextPageToken;
    } while (nextPageToken);

    // 3. Batch Fetch Video Details for Durations (videos.list in batches of 50)
    const validVideoIds = rawItems
      .filter((item) => item.isAvailable && item.videoId)
      .map((item) => item.videoId);

    interface VideoDetail {
      durationSeconds: number;
      isAvailable: boolean;
      thumbnail?: string;
    }

    const videoDetailsMap = new Map<string, VideoDetail>();

    interface YouTubeVideosResponse {
      items?: Array<{
        id: string;
        snippet?: {
          title?: string;
          thumbnails?: Record<string, ThumbnailResource>;
        };
        contentDetails?: {
          duration?: string;
        };
        status?: {
          uploadStatus?: string;
          privacyStatus?: string;
          embeddable?: boolean;
        };
      }>;
    }

    const batchSize = 50;
    for (let i = 0; i < validVideoIds.length; i += batchSize) {
      const batchIds = validVideoIds.slice(i, i + batchSize);
      const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      videosUrl.searchParams.set('part', 'contentDetails,snippet,status');
      videosUrl.searchParams.set('id', batchIds.join(','));
      videosUrl.searchParams.set('key', apiKey);

      try {
        const videosRes = await fetch(videosUrl.toString());
        if (videosRes.ok) {
          const videosData = (await videosRes.json()) as YouTubeVideosResponse;
          for (const video of videosData.items || []) {
            const durationSeconds = parseISO8601Duration(
              video.contentDetails?.duration
            );
            const isEmbeddable =
              video.status?.embeddable !== false &&
              video.status?.privacyStatus !== 'private';

            videoDetailsMap.set(video.id, {
              durationSeconds,
              isAvailable: isEmbeddable,
              thumbnail: getBestThumbnail(video.snippet?.thumbnails),
            });
          }
        }
      } catch (err) {
        console.warn('Non-blocking warning fetching video batch durations:', err);
      }
    }

    // 4. Combine Playlist Items with Video Details
    let totalDurationSeconds = 0;
    const finalVideos: ParsedVideoItem[] = rawItems.map((raw) => {
      const detail = raw.videoId ? videoDetailsMap.get(raw.videoId) : undefined;
      const isAvailable = raw.isAvailable && detail !== undefined ? detail.isAvailable : raw.isAvailable && !!raw.videoId;
      const durationSeconds = detail ? detail.durationSeconds : 0;
      const thumbnail = raw.thumbnail || detail?.thumbnail || '';

      if (isAvailable) {
        totalDurationSeconds += durationSeconds;
      }

      return {
        youtubeVideoId: raw.videoId,
        title: raw.title,
        thumbnail,
        durationSeconds,
        position: raw.position,
        isAvailable,
      };
    });

    return {
      playlistId,
      title: playlistSnippet.title || 'Untitled Playlist',
      description: playlistSnippet.description || '',
      thumbnail: getBestThumbnail(playlistSnippet.thumbnails),
      channelName: playlistSnippet.channelTitle || '',
      totalVideos: finalVideos.length,
      totalDurationSeconds,
      videos: finalVideos,
    };
  },
};
