import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptItem {
  start: number; // in integer seconds
  text: string;
}

/**
 * Format raw seconds to MM:SS or HH:MM:SS
 */
export function formatSecondsToTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    const hh = hours.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Normalize raw offset from youtube-transcript.
 * Depending on the XML format returned (srv3 in ms vs classic in seconds),
 * determine the second offset accurately.
 */
function normalizeOffsetSeconds(offset: number, duration: number): number {
  if (duration > 50 || offset > 10000) {
    return Math.max(0, Math.floor(offset / 1000));
  }
  return Math.max(0, Math.floor(offset));
}

export class TranscriptError extends Error {
  code: string;
  constructor(message: string, code = 'TRANSCRIPT_UNAVAILABLE') {
    super(message);
    this.name = 'TranscriptError';
    this.code = code;
  }
}

/**
 * Fetch and normalize YouTube transcript for a video ID.
 */
export async function fetchVideoTranscript(
  youtubeVideoId: string
): Promise<TranscriptItem[]> {
  if (!youtubeVideoId || typeof youtubeVideoId !== 'string') {
    throw new TranscriptError('A valid YouTube video ID is required.', 'INVALID_VIDEO_ID');
  }

  try {
    const rawItems = await YoutubeTranscript.fetchTranscript(youtubeVideoId);

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      throw new TranscriptError(
        'No captions or transcript track available for this YouTube video.',
        'TRANSCRIPT_EMPTY'
      );
    }

    const items: TranscriptItem[] = rawItems
      .map((item) => ({
        start: normalizeOffsetSeconds(item.offset, item.duration),
        text: (item.text || '').replace(/\s+/g, ' ').trim(),
      }))
      .filter((item) => item.text.length > 0);

    if (items.length === 0) {
      throw new TranscriptError(
        'Transcript content was empty for this YouTube video.',
        'TRANSCRIPT_EMPTY'
      );
    }

    return items;
  } catch (error: any) {
    if (error instanceof TranscriptError) {
      throw error;
    }

    const errorMsg = error?.message || String(error);
    console.error(`[TranscriptService] Failed to fetch transcript for ${youtubeVideoId}:`, errorMsg);

    if (
      errorMsg.includes('disabled') ||
      errorMsg.includes('unavailable') ||
      errorMsg.includes('NotAvailable') ||
      errorMsg.includes('Could not find')
    ) {
      throw new TranscriptError(
        'Subtitles/captions are disabled or unavailable for this YouTube video.',
        'TRANSCRIPT_DISABLED'
      );
    }

    if (errorMsg.includes('TooManyRequest') || errorMsg.includes('429')) {
      throw new TranscriptError(
        'YouTube rate limited the transcript request. Please try again in a few moments.',
        'TRANSCRIPT_RATE_LIMITED'
      );
    }

    throw new TranscriptError(
      'Unable to retrieve transcript for this YouTube video.',
      'TRANSCRIPT_FETCH_FAILED'
    );
  }
}

/**
 * Converts a list of transcript items into a formatted text string with timestamps,
 * e.g.:
 * [00:02] Welcome to the lecture...
 * [04:32] Here is the core definition...
 */
export function formatTranscriptForPrompt(items: TranscriptItem[], maxChars = 80000): string {
  let output = '';

  for (const item of items) {
    const timeStr = formatSecondsToTime(item.start);
    const line = `[${timeStr}] (start: ${item.start}s) ${item.text}\n`;
    if (output.length + line.length > maxChars) {
      output += '\n... [Transcript truncated to fit LLM context window] ...';
      break;
    }
    output += line;
  }

  return output.trim();
}
