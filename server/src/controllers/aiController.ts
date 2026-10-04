import { Request, Response } from 'express';
import { getLearningContext, chatWithFocusAI } from '../services/aiService.js';

export const getAIContext = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { courseId, videoId } = req.query;

    const context = await getLearningContext(
      userId,
      typeof courseId === 'string' ? courseId : undefined,
      typeof videoId === 'string' ? videoId : undefined
    );

    res.status(200).json({
      success: true,
      data: context,
    });
  } catch (error: any) {
    console.error('[AI Controller] Error in getAIContext:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI learning context',
    });
  }
};

export const sendChatMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { message, courseId, videoId, timestampSeconds, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
      return;
    }

    if (message.length > 2000) {
      res.status(400).json({
        success: false,
        message: 'Message exceeds maximum allowed length of 2000 characters',
      });
      return;
    }

    const sanitizedHistory = Array.isArray(history)
      ? history.slice(-6).map((item: any) => ({
          role: item.role === 'model' ? ('model' as const) : ('user' as const),
          text: typeof item.text === 'string' ? item.text.slice(0, 1000) : '',
        }))
      : undefined;

    const result = await chatWithFocusAI(userId, message.trim(), {
      courseId: typeof courseId === 'string' ? courseId : undefined,
      videoId: typeof videoId === 'string' ? videoId : undefined,
      timestampSeconds: typeof timestampSeconds === 'number' ? timestampSeconds : undefined,
      history: sanitizedHistory,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[AI Controller] Error in sendChatMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI response. Please try again.',
    });
  }
};

export const getVideoSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { videoId, courseId } = req.params;
    const resolvedCourseId =
      courseId ||
      (typeof req.query.courseId === 'string' ? req.query.courseId : undefined) ||
      (typeof req.body?.courseId === 'string' ? req.body.courseId : undefined);

    if (!videoId) {
      res.status(400).json({ success: false, message: 'Video ID is required' });
      return;
    }

    const { getOrGenerateVideoSummary } = await import('../services/videoSummaryService.js');
    const result = await getOrGenerateVideoSummary(userId, videoId, resolvedCourseId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[AI Controller] Error in getVideoSummary:', error?.message || error);
    const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
    res.status(statusCode).json({
      success: false,
      code: error.code || 'SUMMARY_ERROR',
      message: error.message || 'Failed to generate summary for this video.',
    });
  }
};

