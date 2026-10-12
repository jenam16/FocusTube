import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';
import { VideoProgress } from '../models/VideoProgress.js';
import { IStudyCircle } from '../models/StudyCircle.js';
import { IStudyCircleMembership } from '../models/StudyCircleMembership.js';
import { calculateCircleProgress } from './studyCircle.js';

/**
 * Helper to reconcile a single member's Study Circle progress with their
 * FocusTube Course progress (VideoProgress records), keeping each member's
 * progress completely independent and strictly scoped to their own account.
 */
export const syncMemberProgressWithCourse = async (
  userId: string | mongoose.Types.ObjectId,
  circle: IStudyCircle,
  membership: IStudyCircleMembership
): Promise<IStudyCircleMembership> => {
  try {
    const snapshotVideos = circle.playlistSnapshot?.videos || [];
    if (snapshotVideos.length === 0) {
      return membership;
    }

    // 1. Find all relevant course IDs for this user (source course or user's copy of the playlist)
    const sourceCourse = circle.sourceCourseId
      ? await Course.findById(circle.sourceCourseId)
      : null;

    const playlistId =
      circle.playlistSnapshot?.playlistId || sourceCourse?.playlistId;

    const courseIds: mongoose.Types.ObjectId[] = [];
    if (circle.sourceCourseId) {
      courseIds.push(new mongoose.Types.ObjectId(circle.sourceCourseId.toString()));
    }

    if (playlistId) {
      const userCourses = await Course.find({
        userId,
        playlistId,
      }).select('_id');

      for (const uc of userCourses) {
        if (!courseIds.some((id) => id.toString() === uc._id.toString())) {
          courseIds.push(uc._id);
        }
      }
    }

    // 2. Query completed VideoProgress records for this specific user only
    const completedProgressRecords = await VideoProgress.find({
      user: userId,
      course: { $in: courseIds },
      completed: true,
    }).select('video');

    const completedVideoObjectIds = completedProgressRecords.map((p) => p.video);

    // Fetch video details to support matching by youtubeVideoId as well as Mongo _id
    const completedVideos = await Video.find({
      _id: { $in: completedVideoObjectIds },
    }).select('_id youtubeVideoId');

    const completedMongoIdSet = new Set<string>();
    const completedYoutubeIdSet = new Set<string>();

    for (const cv of completedVideos) {
      completedMongoIdSet.add(cv._id.toString());
      if (cv.youtubeVideoId) {
        completedYoutubeIdSet.add(cv.youtubeVideoId);
      }
    }
    for (const cp of completedProgressRecords) {
      completedMongoIdSet.add(cp.video.toString());
    }

    // 3. Reconcile completed video IDs for this snapshot
    const validSnapshotVideoIdSet = new Set<string>();
    const snapshotVideoIdByYoutubeId = new Map<string, string>();
    for (const sv of snapshotVideos) {
      validSnapshotVideoIdSet.add(sv.videoId);
      if (sv.youtubeVideoId) {
        snapshotVideoIdByYoutubeId.set(sv.youtubeVideoId, sv.videoId);
      }
    }

    const completedVideoIdsSet = new Set<string>();
    for (const id of membership.completedVideoIds || []) {
      if (validSnapshotVideoIdSet.has(id)) {
        completedVideoIdsSet.add(id);
      } else if (snapshotVideoIdByYoutubeId.has(id)) {
        completedVideoIdsSet.add(snapshotVideoIdByYoutubeId.get(id)!);
      }
    }

    for (const sv of snapshotVideos) {
      const isCompletedInFocusTube =
        completedMongoIdSet.has(sv.videoId) ||
        (sv.youtubeVideoId && completedYoutubeIdSet.has(sv.youtubeVideoId));

      if (isCompletedInFocusTube) {
        completedVideoIdsSet.add(sv.videoId);
      }
    }

    // Filter to only valid videos present in the snapshot
    const finalCompletedVideoIds = Array.from(completedVideoIdsSet).filter((id) =>
      validSnapshotVideoIdSet.has(id)
    );

    const completedCount = finalCompletedVideoIds.length;
    const progressPercentage = calculateCircleProgress(
      completedCount,
      snapshotVideos.length
    );

    // 4. Fallback for active video pointer if current is missing or invalid
    let currentVideoId = membership.currentVideoId;
    let positionSeconds = membership.positionSeconds;

    if (!currentVideoId || !validSnapshotVideoIdSet.has(currentVideoId)) {
      currentVideoId = snapshotVideos[0]?.videoId || '';
    }

    // If member position is 0 and has never watched in circle, check if they have recent progress
    if (
      positionSeconds === 0 &&
      (!membership.completedVideoIds || membership.completedVideoIds.length === 0)
    ) {
      const recentProgress = await VideoProgress.findOne({
        user: userId,
        course: { $in: courseIds },
      })
        .sort({ lastWatchedAt: -1 })
        .populate('video', 'youtubeVideoId');

      if (recentProgress && recentProgress.video) {
        const recentVidId = (recentProgress.video as any)._id?.toString();
        const recentYtId = (recentProgress.video as any).youtubeVideoId;
        const matched = snapshotVideos.find(
          (v) => v.videoId === recentVidId || (recentYtId && v.youtubeVideoId === recentYtId)
        );
        if (matched) {
          currentVideoId = matched.videoId;
          if (typeof recentProgress.watchedSeconds === 'number' && !recentProgress.completed) {
            positionSeconds = Math.round(recentProgress.watchedSeconds);
          }
        }
      }
    }

    // 5. Save membership if state changed
    const hasChanged =
      membership.completedVideosCount !== completedCount ||
      membership.progressPercentage !== progressPercentage ||
      membership.completedVideoIds.length !== finalCompletedVideoIds.length ||
      membership.currentVideoId !== currentVideoId ||
      membership.positionSeconds !== positionSeconds ||
      finalCompletedVideoIds.some((id) => !membership.completedVideoIds.includes(id));

    if (hasChanged) {
      membership.completedVideoIds = finalCompletedVideoIds;
      membership.completedVideosCount = completedCount;
      membership.progressPercentage = progressPercentage;
      membership.currentVideoId = currentVideoId;
      membership.positionSeconds = positionSeconds;
      await membership.save();
    }

    return membership;
  } catch (err) {
    console.error(`[StudyCircle] Error syncing progress for user ${userId}:`, err);
    return membership;
  }
};
