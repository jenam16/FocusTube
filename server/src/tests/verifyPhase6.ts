import assert from 'node:assert';

console.log('--- Running Phase 6 Automatic Video Completion Verifications ---');

interface MockProgress {
  watchedSeconds: number;
  durationSeconds: number;
  progressPercentage: number;
  completed: boolean;
  completedAt: Date | null;
}

// Emulate backend updateVideoProgress completion logic
const calculateCompletion = (
  existing: MockProgress | null,
  watchedSeconds: number,
  durationSeconds: number,
  isEnded = false
): MockProgress => {
  const parsedWatched = Math.max(0, watchedSeconds);
  const parsedDuration = Math.max(0, durationSeconds);
  const clampedWatched =
    parsedDuration > 0 ? Math.min(parsedWatched, parsedDuration) : parsedWatched;

  const progressPercentage =
    parsedDuration > 0
      ? Math.min(100, Math.max(0, Math.round((clampedWatched / parsedDuration) * 100)))
      : 0;

  // Completion logic:
  // 1. If previously completed, remain completed
  // 2. If isEnded
  // 3. If watched / duration >= 0.90
  const isNowCompleted =
    Boolean(existing?.completed) ||
    Boolean(isEnded) ||
    (parsedDuration > 0 && clampedWatched / parsedDuration >= 0.90);

  let completedAt = existing?.completedAt || null;
  if (isNowCompleted && !completedAt) {
    completedAt = new Date('2026-09-10T12:00:00Z');
  }

  return {
    watchedSeconds: Math.round(clampedWatched * 10) / 10,
    durationSeconds: Math.round(parsedDuration * 10) / 10,
    progressPercentage,
    completed: isNowCompleted,
    completedAt,
  };
};

interface MockVideo {
  _id: string;
  position: number;
  isAvailable: boolean;
}

// Emulate backend getCourseCompletionStats
const calculateCourseStats = (
  videos: MockVideo[],
  progressMap: Map<string, { progressPercentage: number; completed: boolean }>
) => {
  if (videos.length === 0) {
    return {
      courseProgressPercentage: 0,
      completedVideos: 0,
      totalAvailableVideos: 0,
      courseCompleted: false,
    };
  }

  const availableVideos = videos.filter((v) => v.isAvailable !== false);
  const totalAvailableVideos = availableVideos.length;

  const totalSum = videos.reduce((acc, v) => {
    return acc + (progressMap.get(v._id)?.progressPercentage || 0);
  }, 0);

  const courseProgressPercentage = Math.min(
    100,
    Math.max(0, Math.round(totalSum / videos.length))
  );

  let completedVideos = 0;
  for (const v of availableVideos) {
    if (progressMap.get(v._id)?.completed) {
      completedVideos++;
    }
  }

  const courseCompleted =
    totalAvailableVideos > 0 && completedVideos === totalAvailableVideos;

  return {
    courseProgressPercentage,
    completedVideos,
    totalAvailableVideos,
    courseCompleted,
  };
};

// Emulate Continue Learning resolution
const resolveContinueLearningTarget = (
  recentVideoId: string,
  videos: MockVideo[],
  progressMap: Map<string, { progressPercentage: number; completed: boolean }>
) => {
  const availableVideos = videos.filter((v) => v.isAvailable !== false);
  const totalAvailable = availableVideos.length;

  let completedCount = 0;
  for (const v of availableVideos) {
    if (progressMap.get(v._id)?.completed) {
      completedCount++;
    }
  }

  const courseCompleted =
    totalAvailable > 0 && completedCount === totalAvailable;

  const recentVideo = videos.find((v) => v._id === recentVideoId);
  const isRecentCompleted = Boolean(progressMap.get(recentVideoId)?.completed);

  if (!isRecentCompleted || courseCompleted || !recentVideo) {
    return {
      targetVideoId: recentVideoId,
      courseCompleted,
    };
  }

  // Find next incomplete available video
  const subsequent = availableVideos.find(
    (v) => v.position > recentVideo.position && !progressMap.get(v._id)?.completed
  );

  const anyIncomplete =
    subsequent || availableVideos.find((v) => !progressMap.get(v._id)?.completed);

  return {
    targetVideoId: anyIncomplete ? anyIncomplete._id : recentVideoId,
    courseCompleted,
  };
};

console.log('1. Testing 90% completion threshold rule...');
// Below 90% (899s / 1000s = 89.9%)
const p1 = calculateCompletion(null, 899, 1000);
assert.strictEqual(p1.completed, false, '89.9% should not be marked completed');
assert.strictEqual(p1.completedAt, null);

// Exactly 90% (900s / 1000s)
const p2 = calculateCompletion(null, 900, 1000);
assert.strictEqual(p2.completed, true, '90% must trigger completed = true');
assert.notStrictEqual(p2.completedAt, null);
const initialCompletedAt = p2.completedAt;

// Above 90% (950s / 1000s)
const p3 = calculateCompletion(null, 950, 1000);
assert.strictEqual(p3.completed, true);
console.log('✓ 90% threshold correctly marks videos completed!');

console.log('2. Testing onEnded completion rule...');
// 85% watched, but onEnded is true
const pEnded = calculateCompletion(null, 850, 1000, true);
assert.strictEqual(pEnded.completed, true, 'onEnded must mark video completed even if < 90%');
assert.notStrictEqual(pEnded.completedAt, null);
console.log('✓ onEnded event correctly triggers completion!');

console.log('3. Testing completion immutability & completedAt preservation...');
// User previously completed video, then later watches from 100s (10%)
const pRewound = calculateCompletion(p2, 100, 1000, false);
assert.strictEqual(pRewound.completed, true, 'Completed state must never revert to false');
assert.strictEqual(
  pRewound.completedAt?.getTime(),
  initialCompletedAt?.getTime(),
  'completedAt timestamp must remain unchanged on subsequent watches'
);
assert.strictEqual(pRewound.watchedSeconds, 100, 'watchedSeconds updates to current position');
console.log('✓ Completion immutability and completedAt preservation verified!');

console.log('4. Testing course completion derivation with unavailable videos...');
const mockVideos: MockVideo[] = [
  { _id: 'v1', position: 0, isAvailable: true },
  { _id: 'v2', position: 1, isAvailable: false }, // unavailable video!
  { _id: 'v3', position: 2, isAvailable: true },
];

const mockProgress = new Map<string, { progressPercentage: number; completed: boolean }>();
mockProgress.set('v1', { progressPercentage: 100, completed: true });
mockProgress.set('v2', { progressPercentage: 0, completed: false }); // unavailable & incomplete
mockProgress.set('v3', { progressPercentage: 50, completed: false });

// Only v1 completed out of 2 available videos
const stats1 = calculateCourseStats(mockVideos, mockProgress);
assert.strictEqual(stats1.totalAvailableVideos, 2, 'Unavailable videos must not count in available total');
assert.strictEqual(stats1.completedVideos, 1);
assert.strictEqual(stats1.courseCompleted, false);

// Complete v3 as well
mockProgress.set('v3', { progressPercentage: 100, completed: true });
const stats2 = calculateCourseStats(mockVideos, mockProgress);
assert.strictEqual(stats2.completedVideos, 2);
assert.strictEqual(stats2.totalAvailableVideos, 2);
assert.strictEqual(stats2.courseCompleted, true, 'Course is complete when all AVAILABLE videos are complete');
console.log('✓ Course completion derivation properly excludes unavailable videos!');

console.log('5. Testing Continue Learning resolution...');
const clVideos: MockVideo[] = [
  { _id: 'v1', position: 0, isAvailable: true },
  { _id: 'v2', position: 1, isAvailable: true },
  { _id: 'v3', position: 2, isAvailable: true },
];

const clProgress = new Map<string, { progressPercentage: number; completed: boolean }>();

// Case A: Recent video (v1) is incomplete (50%) -> Stay on v1
clProgress.set('v1', { progressPercentage: 50, completed: false });
const targetA = resolveContinueLearningTarget('v1', clVideos, clProgress);
assert.strictEqual(targetA.targetVideoId, 'v1');
assert.strictEqual(targetA.courseCompleted, false);

// Case B: Recent video (v1) is completed -> Advance to next incomplete available (v2)
clProgress.set('v1', { progressPercentage: 100, completed: true });
clProgress.set('v2', { progressPercentage: 0, completed: false });
const targetB = resolveContinueLearningTarget('v1', clVideos, clProgress);
assert.strictEqual(targetB.targetVideoId, 'v2', 'Should advance to next incomplete lesson');

// Case C: All videos completed -> Course completed
clProgress.set('v2', { progressPercentage: 100, completed: true });
clProgress.set('v3', { progressPercentage: 100, completed: true });
const targetC = resolveContinueLearningTarget('v3', clVideos, clProgress);
assert.strictEqual(targetC.courseCompleted, true);
console.log('✓ Continue Learning resolution correctly advances to next incomplete video!');

console.log('--- All Phase 6 Unit Verifications Passed Successfully ---');
