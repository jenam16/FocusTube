import mongoose from 'mongoose';
import { Video, IVideo, IAISummary } from '../models/Video.js';
import { Course } from '../models/Course.js';
import { fetchVideoTranscript, formatTranscriptForPrompt, TranscriptError } from './transcriptService.js';
import { generateStudySummaryFromTranscript, OpenRouterError } from './openRouterService.js';

export interface VideoSummaryResult {
  summary: IAISummary;
  cached: boolean;
  video: {
    _id: string;
    courseId: string;
    youtubeVideoId: string;
    title: string;
  };
}

// In-memory registry to deduplicate simultaneous requests for the same video
const activeGenerations = new Map<string, Promise<VideoSummaryResult>>();

export class VideoSummaryError extends Error {
  statusCode: number;
  code: string;
  constructor(message: string, statusCode = 500, code = 'SUMMARY_ERROR') {
    super(message);
    this.name = 'VideoSummaryError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Get or generate an AI study summary for a specific video.
 * If a summary is already saved in MongoDB, returns it immediately without calling OpenRouter.
 */
export async function getOrGenerateVideoSummary(
  userId: string,
  videoId: string,
  courseId?: string
): Promise<VideoSummaryResult> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Locate video by _id or youtubeVideoId
  const videoQuery: any = mongoose.Types.ObjectId.isValid(videoId)
    ? { $or: [{ _id: videoId }, { youtubeVideoId: videoId }] }
    : { youtubeVideoId: videoId };

  if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
    videoQuery.courseId = new mongoose.Types.ObjectId(courseId);
  }

  const video = await Video.findOne(videoQuery);
  if (!video) {
    throw new VideoSummaryError('Video not found', 404, 'VIDEO_NOT_FOUND');
  }

  // 2. Validate course access
  const course = await Course.findOne({
    _id: video.courseId,
    userId: userObjectId,
  });

  if (!course) {
    throw new VideoSummaryError(
      'You do not have access to this course or video',
      403,
      'ACCESS_DENIED'
    );
  }

  // 3. Return existing summary if already saved in MongoDB
  if (video.aiSummary && video.aiSummary.summary) {
    return {
      summary: video.aiSummary,
      cached: true,
      video: {
        _id: video._id.toString(),
        courseId: video.courseId.toString(),
        youtubeVideoId: video.youtubeVideoId,
        title: video.title,
      },
    };
  }

  // 4. Duplicate request protection: If already generating for this video, await existing task
  const videoKey = video._id.toString();
  if (activeGenerations.has(videoKey)) {
    return await activeGenerations.get(videoKey)!;
  }

  // 5. Generate summary with deduplication
  const generationPromise = (async (): Promise<VideoSummaryResult> => {
    try {
      // Step A: Fetch real YouTube transcript
      const transcriptItems = await fetchVideoTranscript(video.youtubeVideoId);
      const formattedTranscript = formatTranscriptForPrompt(transcriptItems);

      // Step B: Call OpenRouter for structured study summary
      const aiResult = await generateStudySummaryFromTranscript(
        video.title,
        formattedTranscript
      );

      // Step C: Save generated summary to MongoDB
      const aiSummaryData: IAISummary = {
        summary: aiResult.summary,
        keyConcepts: aiResult.keyConcepts,
        importantMoments: aiResult.importantMoments,
        quickRevision: aiResult.quickRevision,
        generatedAt: new Date(),
      };

      video.aiSummary = aiSummaryData;
      await video.save();

      return {
        summary: video.aiSummary,
        cached: false,
        video: {
          _id: video._id.toString(),
          courseId: video.courseId.toString(),
          youtubeVideoId: video.youtubeVideoId,
          title: video.title,
        },
      };
    } catch (err: any) {
      if (err instanceof TranscriptError) {
        throw new VideoSummaryError(err.message, 400, err.code);
      }
      if (err instanceof OpenRouterError) {
        throw new VideoSummaryError(err.message, err.statusCode, 'OPENROUTER_ERROR');
      }
      throw new VideoSummaryError(
        err?.message || 'Failed to generate study summary. Please try again.',
        500,
        'GENERATION_FAILED'
      );
    } finally {
      activeGenerations.delete(videoKey);
    }
  })();

  activeGenerations.set(videoKey, generationPromise);
  return await generationPromise;
}
