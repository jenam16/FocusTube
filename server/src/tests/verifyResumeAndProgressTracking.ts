import assert from 'node:assert';

console.log('--- Running Resume Playback & Progress Tracking Verifications ---');

interface MockVideo {
  _id: string;
  position: number;
  durationSeconds: number;
  isAvailable: boolean;
}

interface MockVideoProgress {
  videoId: string;
  watchedSeconds: number;
  durationSeconds: number;
  progressPercentage: number;
  completed: boolean;
  lastWatchedAt: Date;
}

// 1. Test Course Completion Percentage Calculation
const calculateCourseCompletion = (
  videos: MockVideo[],
  progressRecords: MockVideoProgress[]
) => {
  const availableVideos = videos.filter((v) => v.isAvailable !== false);
  const totalAvailable = availableVideos.length;

  if (totalAvailable === 0) {
    return { courseProgressPercentage: 0, completedVideos: 0, totalAvailableVideos: 0, courseCompleted: false };
  }

  const progressMap = new Map<string, MockVideoProgress>();
  for (const p of progressRecords) {
    progressMap.set(p.videoId, p);
  }

  let completedVideos = 0;
  for (const v of availableVideos) {
    if (progressMap.get(v._id)?.completed) {
      completedVideos++;
    }
  }

  const courseCompleted = totalAvailable > 0 && completedVideos === totalAvailable;
  let courseProgressPercentage = 0;
  if (courseCompleted) {
    courseProgressPercentage = 100;
  } else if (totalAvailable > 0 && completedVideos > 0) {
    courseProgressPercentage = Math.min(
      99,
      Math.max(1, Math.round((completedVideos / totalAvailable) * 100))
    );
  }

  return {
    courseProgressPercentage,
    completedVideos,
    totalAvailableVideos: totalAvailable,
    courseCompleted,
  };
};

// 2. Test Resume Target Resolution
const resolveResumeTarget = (
  videos: MockVideo[],
  progressRecords: MockVideoProgress[]
) => {
  const availableVideos = videos.filter((v) => v.isAvailable !== false).sort((a, b) => a.position - b.position);
  if (availableVideos.length === 0) return null;

  // Sort by lastWatchedAt desc
  const sortedProgress = [...progressRecords].sort(
    (a, b) => b.lastWatchedAt.getTime() - a.lastWatchedAt.getTime()
  );

  const progressByVideoId = new Map<string, MockVideoProgress>();
  for (const r of progressRecords) {
    progressByVideoId.set(r.videoId, r);
  }

  if (sortedProgress.length === 0) {
    // No progress -> Video 1 @ 0
    return {
      videoId: availableVideos[0]._id,
      watchedSeconds: 0,
      durationSeconds: availableVideos[0].durationSeconds,
      completed: false,
    };
  }

  const mostRecent = sortedProgress[0];
  const mostRecentVideo = availableVideos.find((v) => v._id === mostRecent.videoId);

  if (!mostRecent.completed) {
    return {
      videoId: mostRecent.videoId,
      watchedSeconds: mostRecent.watchedSeconds,
      durationSeconds: mostRecent.durationSeconds || (mostRecentVideo?.durationSeconds || 0),
      completed: false,
    };
  }

  // Most recent is completed
  const stats = calculateCourseCompletion(videos, progressRecords);
  if (stats.courseCompleted) {
    const lastVid = availableVideos[availableVideos.length - 1];
    return {
      videoId: lastVid._id,
      watchedSeconds: 0,
      durationSeconds: lastVid.durationSeconds,
      completed: true,
    };
  }

  const currentPos = mostRecentVideo ? mostRecentVideo.position : -1;
  const subsequentIncomplete = availableVideos.find(
    (v) => v.position > currentPos && !progressByVideoId.get(v._id)?.completed
  );
  const nextIncomplete =
    subsequentIncomplete ||
    availableVideos.find((v) => !progressByVideoId.get(v._id)?.completed);

  if (nextIncomplete) {
    const existingProg = progressByVideoId.get(nextIncomplete._id);
    return {
      videoId: nextIncomplete._id,
      watchedSeconds: existingProg?.watchedSeconds || 0,
      durationSeconds: existingProg?.durationSeconds || nextIncomplete.durationSeconds,
      completed: false,
    };
  }

  return {
    videoId: availableVideos[0]._id,
    watchedSeconds: 0,
    durationSeconds: availableVideos[0].durationSeconds,
    completed: false,
  };
};

// Scenario: 10 videos in a playlist
const sampleVideos: MockVideo[] = Array.from({ length: 10 }, (_, i) => ({
  _id: `vid-${i + 1}`,
  position: i,
  durationSeconds: 1200, // 20 mins each
  isAvailable: true,
}));

console.log('1. Testing 0% progress on newly imported playlist...');
const res0 = calculateCourseCompletion(sampleVideos, []);
assert.strictEqual(res0.courseProgressPercentage, 0);
assert.strictEqual(res0.completedVideos, 0);
assert.strictEqual(res0.courseCompleted, false);
const target0 = resolveResumeTarget(sampleVideos, []);
assert.strictEqual(target0?.videoId, 'vid-1');
assert.strictEqual(target0?.watchedSeconds, 0);
console.log('✓ Initial 0% progress and Video 1 @ 0:00 resolution verified!');

console.log('2. Testing Video 1 completed (10%)...');
const prog1: MockVideoProgress[] = [
  {
    videoId: 'vid-1',
    watchedSeconds: 1200,
    durationSeconds: 1200,
    progressPercentage: 100,
    completed: true,
    lastWatchedAt: new Date(Date.now() - 5000),
  },
];
const res1 = calculateCourseCompletion(sampleVideos, prog1);
assert.strictEqual(res1.courseProgressPercentage, 10);
assert.strictEqual(res1.completedVideos, 1);
assert.strictEqual(res1.courseCompleted, false);
const target1 = resolveResumeTarget(sampleVideos, prog1);
assert.strictEqual(target1?.videoId, 'vid-2'); // Advanced to Video 2!
assert.strictEqual(target1?.watchedSeconds, 0);
console.log('✓ Video 1 completion -> 10% and advance to Video 2 verified!');

console.log('3. Testing Video 2 watched to midway 11:04 (664s)...');
const prog2: MockVideoProgress[] = [
  ...prog1,
  {
    videoId: 'vid-2',
    watchedSeconds: 664,
    durationSeconds: 1200,
    progressPercentage: 55,
    completed: false,
    lastWatchedAt: new Date(Date.now()), // latest
  },
];
const res2 = calculateCourseCompletion(sampleVideos, prog2);
// Course progress MUST remain 10% because Video 2 is NOT completed!
assert.strictEqual(res2.courseProgressPercentage, 10, 'Partially watched video must not increment course completion');
assert.strictEqual(res2.completedVideos, 1);
// True Resume target MUST be Video 2 @ 664s!
const target2 = resolveResumeTarget(sampleVideos, prog2);
assert.strictEqual(target2?.videoId, 'vid-2');
assert.strictEqual(target2?.watchedSeconds, 664);
console.log('✓ Midway playback keeps 10% progress and resumes Video 2 at exact 11:04 (664s)!');

console.log('4. Testing Video 2 completed (20%)...');
const prog3: MockVideoProgress[] = [
  prog1[0],
  {
    videoId: 'vid-2',
    watchedSeconds: 1200,
    durationSeconds: 1200,
    progressPercentage: 100,
    completed: true,
    lastWatchedAt: new Date(Date.now()),
  },
];
const res3 = calculateCourseCompletion(sampleVideos, prog3);
assert.strictEqual(res3.courseProgressPercentage, 20);
assert.strictEqual(res3.completedVideos, 2);
const target3 = resolveResumeTarget(sampleVideos, prog3);
assert.strictEqual(target3?.videoId, 'vid-3'); // Advanced to Video 3!
assert.strictEqual(target3?.watchedSeconds, 0);
console.log('✓ Video 2 completed -> 20% and advance to Video 3 verified!');

console.log('5. Testing course with 1 unavailable video excluded from completion denominator...');
const videosWithUnavailable: MockVideo[] = [
  { _id: 'v1', position: 0, durationSeconds: 600, isAvailable: true },
  { _id: 'v2', position: 1, durationSeconds: 600, isAvailable: false }, // unavailable!
  { _id: 'v3', position: 2, durationSeconds: 600, isAvailable: true },
];
const progUnavailable: MockVideoProgress[] = [
  {
    videoId: 'v1',
    watchedSeconds: 600,
    durationSeconds: 600,
    progressPercentage: 100,
    completed: true,
    lastWatchedAt: new Date(),
  },
];
const resUnavail = calculateCourseCompletion(videosWithUnavailable, progUnavailable);
// Total available is 2 (v1 and v3). 1 / 2 = 50%!
assert.strictEqual(resUnavail.totalAvailableVideos, 2);
assert.strictEqual(resUnavail.completedVideos, 1);
assert.strictEqual(resUnavail.courseProgressPercentage, 50);
console.log('✓ Unavailable videos correctly excluded from denominator!');

console.log('6. Testing all videos completed (100%)...');
const allCompletedProg: MockVideoProgress[] = sampleVideos.map((v, idx) => ({
  videoId: v._id,
  watchedSeconds: v.durationSeconds,
  durationSeconds: v.durationSeconds,
  progressPercentage: 100,
  completed: true,
  lastWatchedAt: new Date(Date.now() + idx * 1000),
}));
const resAll = calculateCourseCompletion(sampleVideos, allCompletedProg);
assert.strictEqual(resAll.courseProgressPercentage, 100);
assert.strictEqual(resAll.completedVideos, 10);
assert.strictEqual(resAll.courseCompleted, true);
const targetAll = resolveResumeTarget(sampleVideos, allCompletedProg);
assert.strictEqual(targetAll?.videoId, 'vid-10');
assert.strictEqual(targetAll?.completed, true);
console.log('✓ 100% course completion and review state verified!');

console.log('--- All Resume Playback & Progress Tracking Tests Passed Successfully! ---');
