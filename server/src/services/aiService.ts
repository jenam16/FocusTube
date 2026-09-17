import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';
import { VideoProgress } from '../models/VideoProgress.js';
import { Task } from '../models/Task.js';
import { generateGeminiContent } from './geminiService.js';

export interface AIContextResult {
  insight: string;
  courseId?: string;
  courseTitle?: string;
  progressPercentage?: number;
  nextVideoId?: string;
  nextVideoTitle?: string;
  todayTasksRemaining?: number;
}

/**
 * Gather user learning context and generate a short personalized insight.
 */
export async function getLearningContext(
  userId: string,
  courseId?: string,
  videoId?: string
): Promise<AIContextResult> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Resolve course
  let targetCourse = null;
  if (courseId && mongoose.isValidObjectId(courseId)) {
    targetCourse = await Course.findOne({
      _id: new mongoose.Types.ObjectId(courseId),
      userId: userObjectId,
    });
  }

  // If no specific course requested, find the most recently watched or updated course
  if (!targetCourse) {
    const recentProgress = await VideoProgress.findOne({ user: userObjectId })
      .sort({ lastWatchedAt: -1 })
      .populate('course');

    if (recentProgress && recentProgress.course) {
      targetCourse = recentProgress.course as any;
    } else {
      // Fallback to most recently updated course
      targetCourse = await Course.findOne({ userId: userObjectId }).sort({
        updatedAt: -1,
      });
    }
  }

  // 2. Count today's pending tasks
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  const pendingTasksCount = await Task.countDocuments({
    user: userObjectId,
    completed: false,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (!targetCourse) {
    return {
      insight: pendingTasksCount > 0
        ? `You have ${pendingTasksCount} study task${pendingTasksCount > 1 ? 's' : ''} planned for today. Import a course or start studying!`
        : "Welcome to FocusTube! Import a YouTube playlist to begin your distraction-free study journey.",
      todayTasksRemaining: pendingTasksCount,
    };
  }

  // 3. Find next unfinished video for this course
  const courseVideos = await Video.find({ courseId: targetCourse._id })
    .sort({ position: 1 })
    .select('_id title position');

  const completedProgress = await VideoProgress.find({
    user: userObjectId,
    course: targetCourse._id,
    completed: true,
  }).select('video');

  const completedVideoIds = new Set(
    completedProgress.map((p) => p.video.toString())
  );

  let nextUnfinishedVideo = courseVideos.find(
    (v) => !completedVideoIds.has(v._id.toString())
  );

  const progressPercent = Math.round(targetCourse.progressPercentage || 0);

  // 4. Formulate contextual insight string
  let insightText = '';

  if (progressPercent >= 100) {
    insightText = `🎉 Congratulations! You've completed "${targetCourse.title}". Ready for your next challenge?`;
  } else if (nextUnfinishedVideo) {
    insightText = `You're ${progressPercent}% through "${targetCourse.title}". Your next unfinished topic is "${nextUnfinishedVideo.title}".`;
  } else {
    insightText = `You're ${progressPercent}% through "${targetCourse.title}". Keep up the great focus!`;
  }

  return {
    insight: insightText,
    courseId: targetCourse._id.toString(),
    courseTitle: targetCourse.title,
    progressPercentage: progressPercent,
    nextVideoId: nextUnfinishedVideo ? nextUnfinishedVideo._id.toString() : undefined,
    nextVideoTitle: nextUnfinishedVideo ? nextUnfinishedVideo.title : undefined,
    todayTasksRemaining: pendingTasksCount,
  };
}

/**
 * Handle AI chat question with context-aware system instructions.
 */
export async function chatWithFocusAI(
  userId: string,
  userMessage: string,
  contextParam?: {
    courseId?: string;
    videoId?: string;
    timestampSeconds?: number;
    history?: Array<{ role: 'user' | 'model'; text: string }>;
  }
): Promise<{ reply: string }> {
  // Fetch learning context for user
  const context = await getLearningContext(
    userId,
    contextParam?.courseId,
    contextParam?.videoId
  );

  let activeVideoTitle = '';
  if (contextParam?.videoId && mongoose.isValidObjectId(contextParam.videoId)) {
    const activeVideo = await Video.findById(contextParam.videoId).select('title');
    if (activeVideo) {
      activeVideoTitle = activeVideo.title;
    }
  }

  // Construct context-enriched system prompt
  const systemInstruction = `You are Focus AI, the built-in intelligent study companion inside FocusTube.
FocusTube is a minimalist, distraction-free learning environment for YouTube courses.

CURRENT STUDENT CONTEXT:
- Active Course: ${context.courseTitle ? `"${context.courseTitle}"` : 'None currently selected'}
- Course Progress: ${context.progressPercentage !== undefined ? `${context.progressPercentage}%` : 'N/A'}
- Current Video / Lesson: ${activeVideoTitle ? `"${activeVideoTitle}"` : 'General study'}
${contextParam?.timestampSeconds ? `- Current Playback Timestamp: ${Math.floor(contextParam.timestampSeconds / 60)}m ${Math.floor(contextParam.timestampSeconds % 60)}s` : ''}
${context.nextVideoTitle ? `- Next Unfinished Lesson: "${context.nextVideoTitle}"` : ''}
${context.todayTasksRemaining !== undefined ? `- Daily Study Tasks Remaining: ${context.todayTasksRemaining}` : ''}

INSTRUCTIONS:
- Tone: Calm, encouraging, educational, direct, and concise.
- Tailor explanations directly to what the student is studying if relevant.
- Keep responses compact (1-3 paragraphs or brief bullet points). Never give unnecessarily long essays unless specifically requested.
- Use clean markdown for formatting, key concepts, or code snippets.
- READ-ONLY: You cannot mutate, delete, or create user database records directly, but you can give great advice, study tips, and clear answers.`;

  const reply = await generateGeminiContent(userMessage, {
    systemInstruction,
    history: contextParam?.history,
  });

  return { reply };
}
