import assert from 'node:assert';

console.log('--- Running Phase 5 Progress Tracking & Resume Learning Verifications ---');

// Helper to calculate progress percentage accurately
const calculateVideoProgress = (watchedSeconds: number, durationSeconds: number) => {
  const watched = Math.max(0, watchedSeconds);
  const duration = Math.max(0, durationSeconds);
  const clampedWatched = duration > 0 ? Math.min(watched, duration) : watched;
  const progressPercentage =
    duration > 0
      ? Math.min(100, Math.max(0, Math.round((clampedWatched / duration) * 100)))
      : 0;

  return {
    watchedSeconds: Math.round(clampedWatched * 10) / 10,
    durationSeconds: Math.round(duration * 10) / 10,
    progressPercentage,
  };
};

// Helper to aggregate course progress across all videos
const aggregateCourseProgress = (
  allVideoIds: string[],
  progressList: { videoId: string; progressPercentage: number }[]
): number => {
  if (allVideoIds.length === 0) return 0;
  const map = new Map<string, number>();
  for (const p of progressList) {
    map.set(p.videoId, p.progressPercentage || 0);
  }
  const sum = allVideoIds.reduce((acc, id) => acc + (map.get(id) || 0), 0);
  return Math.min(100, Math.max(0, Math.round(sum / allVideoIds.length)));
};

// Resume threshold helper: determine if playback should resume at watchedSeconds
const getResumePosition = (watchedSeconds: number, durationSeconds: number): number => {
  if (watchedSeconds <= 2) return 0; // Trivial start, start from beginning
  if (durationSeconds > 0 && watchedSeconds >= durationSeconds - 5) return 0; // Near the end, replay from beginning
  return Math.floor(watchedSeconds);
};

console.log('1. Testing video progress calculation & duration clamping...');
const p1 = calculateVideoProgress(0, 300);
assert.strictEqual(p1.progressPercentage, 0);
assert.strictEqual(p1.watchedSeconds, 0);

const p2 = calculateVideoProgress(150, 300);
assert.strictEqual(p2.progressPercentage, 50);
assert.strictEqual(p2.watchedSeconds, 150);

const p3 = calculateVideoProgress(350, 300); // Exceeds duration
assert.strictEqual(p3.progressPercentage, 100);
assert.strictEqual(p3.watchedSeconds, 300, 'Watched seconds must be clamped to duration');

const p4 = calculateVideoProgress(-50, 300); // Negative
assert.strictEqual(p4.progressPercentage, 0);
assert.strictEqual(p4.watchedSeconds, 0);

const p5 = calculateVideoProgress(10, 0); // 0 duration
assert.strictEqual(p5.progressPercentage, 0);
console.log('✓ Video progress calculation and clamping verified!');

console.log('2. Testing course-level progress aggregation across videos...');
const videoIds = ['v1', 'v2', 'v3', 'v4'];
const courseProgress = aggregateCourseProgress(videoIds, [
  { videoId: 'v1', progressPercentage: 100 },
  { videoId: 'v2', progressPercentage: 50 },
  { videoId: 'v3', progressPercentage: 25 },
  // v4 has 0 progress (not watched yet)
]);
// (100 + 50 + 25 + 0) / 4 = 175 / 4 = 43.75 -> 44%
assert.strictEqual(courseProgress, 44);

const emptyCourseProgress = aggregateCourseProgress([], []);
assert.strictEqual(emptyCourseProgress, 0);

const fullCourseProgress = aggregateCourseProgress(['v1', 'v2'], [
  { videoId: 'v1', progressPercentage: 100 },
  { videoId: 'v2', progressPercentage: 100 },
]);
assert.strictEqual(fullCourseProgress, 100);
console.log('✓ Course-level progress aggregation across video list verified!');

console.log('3. Testing resume playback position threshold logic...');
// Within normal range
assert.strictEqual(getResumePosition(45.6, 300), 45);

// Below start threshold (<= 2 seconds)
assert.strictEqual(getResumePosition(1.5, 300), 0);

// Near end threshold (within 5 seconds of end)
assert.strictEqual(getResumePosition(296, 300), 0);
assert.strictEqual(getResumePosition(300, 300), 0);

// Exactly on boundary
assert.strictEqual(getResumePosition(3, 300), 3);
assert.strictEqual(getResumePosition(294, 300), 294);
console.log('✓ Resume playback threshold logic verified!');

console.log('--- All Phase 5 Unit Verifications Passed Successfully ---');
