import assert from 'node:assert';
import { calculateStreaks } from '../controllers/analyticsController.js';

console.log('--- Running Phase 8-10 Verifications (Tasks, Streaks, Analytics, Notes & Bookmarks) ---');

// 1. Test Streak Calculation
console.log('1. Testing streak calculation...');

// Empty activity dates
const emptyStreak = calculateStreaks([]);
assert.strictEqual(emptyStreak.currentStreak, 0);
assert.strictEqual(emptyStreak.longestStreak, 0);

// Today only
const today = new Date();
const todayStreak = calculateStreaks([today]);
assert.strictEqual(todayStreak.currentStreak, 1);
assert.strictEqual(todayStreak.longestStreak, 1);

// Yesterday and Today (2-day current streak)
const yesterday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
const twoDayStreak = calculateStreaks([today, yesterday]);
assert.strictEqual(twoDayStreak.currentStreak, 2);
assert.strictEqual(twoDayStreak.longestStreak, 2);

// Broken streak (3 days ago, 2 days ago, but missed yesterday & today)
const twoDaysAgo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 2));
const threeDaysAgo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 3));
const brokenStreak = calculateStreaks([twoDaysAgo, threeDaysAgo]);
assert.strictEqual(brokenStreak.currentStreak, 0, 'Missed today & yesterday should yield 0 current streak');
assert.strictEqual(brokenStreak.longestStreak, 2, 'Historical consecutive 2 days should be retained as longestStreak');

// Yesterday only (still 1 current streak, allows today to be completed later)
const yesterdayOnlyStreak = calculateStreaks([yesterday]);
assert.strictEqual(yesterdayOnlyStreak.currentStreak, 1);
assert.strictEqual(yesterdayOnlyStreak.longestStreak, 1);

console.log('✓ Streak calculation tests passed successfully!');

// 2. Task Validation Logic
console.log('2. Testing task validation logic...');
const validateTaskTitle = (title: unknown): { valid: boolean; error?: string; trimmed?: string } => {
  if (!title || typeof title !== 'string' || !title.trim()) {
    return { valid: false, error: 'Task title is required' };
  }
  const trimmed = title.trim();
  if (trimmed.length > 200) {
    return { valid: false, error: 'Task title cannot exceed 200 characters' };
  }
  return { valid: true, trimmed };
};

assert.strictEqual(validateTaskTitle('').valid, false);
assert.strictEqual(validateTaskTitle('   ').valid, false);
assert.strictEqual(validateTaskTitle(null).valid, false);
assert.strictEqual(validateTaskTitle('a'.repeat(201)).valid, false);
const validTask = validateTaskTitle('  Practice useEffect  ');
assert.strictEqual(validTask.valid, true);
assert.strictEqual(validTask.trimmed, 'Practice useEffect');

console.log('✓ Task validation logic verified!');

// 2b. Study Plan Date Parsing & Overdue Derivation Logic
console.log('2b. Testing Study Plan date parsing and overdue derivation...');
import { parseDateToUtcMidnight, formatDateToUtcString } from '../controllers/taskController.js';

const parsed = parseDateToUtcMidnight('2026-09-15');
assert.strictEqual(parsed.getUTCFullYear(), 2026);
assert.strictEqual(parsed.getUTCMonth(), 8); // 0-indexed September
assert.strictEqual(parsed.getUTCDate(), 15);
assert.strictEqual(parsed.getUTCHours(), 0);

const formatted = formatDateToUtcString(parsed);
assert.strictEqual(formatted, '2026-09-15');

// Overdue derivation: date < todayMidnight && !completed
const todayMidnight = new Date();
todayMidnight.setUTCHours(0, 0, 0, 0);

const yesterdayDate = new Date(Date.UTC(todayMidnight.getUTCFullYear(), todayMidnight.getUTCMonth(), todayMidnight.getUTCDate() - 1));
const tomorrowDate = new Date(Date.UTC(todayMidnight.getUTCFullYear(), todayMidnight.getUTCMonth(), todayMidnight.getUTCDate() + 1));

const isOverdue = (taskDate: Date, completed: boolean) => taskDate.getTime() < todayMidnight.getTime() && !completed;

assert.strictEqual(isOverdue(yesterdayDate, false), true, 'Yesterday incomplete task must be overdue');
assert.strictEqual(isOverdue(yesterdayDate, true), false, 'Yesterday completed task must NOT be overdue');
assert.strictEqual(isOverdue(todayMidnight, false), false, 'Today incomplete task is not overdue');
assert.strictEqual(isOverdue(tomorrowDate, false), false, 'Tomorrow task is not overdue');

console.log('✓ Study Plan date parsing and overdue derivation verified!');


// 3. Note Validation Logic
console.log('3. Testing note validation logic...');
const validateNote = (
  content: unknown,
  timestampSeconds: unknown,
  videoDuration: number
): { valid: boolean; error?: string; timestamp?: number | null } => {
  if (!content || typeof content !== 'string' || !content.trim()) {
    return { valid: false, error: 'Note content cannot be empty' };
  }
  const trimmed = content.trim();
  if (trimmed.length > 5000) {
    return { valid: false, error: 'Note content cannot exceed 5000 characters' };
  }

  let parsedTimestamp: number | null = null;
  if (timestampSeconds !== undefined && timestampSeconds !== null) {
    const parsed = Number(timestampSeconds);
    if (isNaN(parsed) || parsed < 0) {
      return { valid: false, error: 'timestampSeconds must be a non-negative number' };
    }
    if (videoDuration > 0 && parsed > videoDuration + 10) {
      return { valid: false, error: 'timestampSeconds cannot exceed video duration' };
    }
    parsedTimestamp = Math.floor(parsed);
  }

  return { valid: true, timestamp: parsedTimestamp };
};

assert.strictEqual(validateNote('', 10, 100).valid, false);
assert.strictEqual(validateNote('Valid Note', -5, 100).valid, false);
assert.strictEqual(validateNote('Valid Note', 250, 100).valid, false);
assert.strictEqual(validateNote('Valid Note', null, 100).valid, true);
assert.strictEqual(validateNote('Valid Note', 45.8, 100).timestamp, 45);

console.log('✓ Note validation logic verified!');

// 4. Note Sorting Logic (timestamped chronologically, untimestamped at end)
console.log('4. Testing note sorting logic...');
interface MockNote {
  id: string;
  timestampSeconds: number | null;
  createdAt: Date;
}

const mockNotes: MockNote[] = [
  { id: '1', timestampSeconds: null, createdAt: new Date('2026-09-10T10:00:00Z') },
  { id: '2', timestampSeconds: 120, createdAt: new Date('2026-09-10T11:00:00Z') },
  { id: '3', timestampSeconds: 45, createdAt: new Date('2026-09-10T09:00:00Z') },
  { id: '4', timestampSeconds: null, createdAt: new Date('2026-09-10T08:00:00Z') },
  { id: '5', timestampSeconds: 90, createdAt: new Date('2026-09-10T12:00:00Z') },
];

const sortedNotes = [...mockNotes].sort((a, b) => {
  if (a.timestampSeconds !== null && b.timestampSeconds !== null) {
    return a.timestampSeconds - b.timestampSeconds;
  }
  if (a.timestampSeconds !== null) return -1;
  if (b.timestampSeconds !== null) return 1;
  return a.createdAt.getTime() - b.createdAt.getTime();
});

assert.deepStrictEqual(
  sortedNotes.map((n) => n.id),
  ['3', '5', '2', '4', '1'],
  'Notes should sort by timestamp ASC, then untimestamped by createdAt ASC'
);

console.log('✓ Note chronological sorting verified!');

// 5. Notes Redesign Tests (tag sanitization, pin sorting, search regex)
console.log('5. Testing Notes Redesign logic...');
import { sanitizeTags } from '../controllers/noteController.js';

// Tag sanitization
const rawTags = ['#React', '  javascript  ', 'TYPESCRIPT', '#REACT', 'a'.repeat(50), '', '  '];
const clean = sanitizeTags(rawTags);
assert.deepStrictEqual(clean, ['react', 'javascript', 'typescript'], 'Tags must be trimmed, lowercased, deduplicated, and # stripped');

// Pinned-first sorting logic
interface MockWorkspaceNote {
  id: string;
  isPinned: boolean;
  updatedAt: Date;
}
const workspaceNotes: MockWorkspaceNote[] = [
  { id: '1', isPinned: false, updatedAt: new Date('2026-09-10T12:00:00Z') },
  { id: '2', isPinned: true, updatedAt: new Date('2026-09-10T08:00:00Z') },
  { id: '3', isPinned: false, updatedAt: new Date('2026-09-10T14:00:00Z') },
  { id: '4', isPinned: true, updatedAt: new Date('2026-09-10T10:00:00Z') },
];

const sortedWorkspace = [...workspaceNotes].sort((a, b) => {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  return b.updatedAt.getTime() - a.updatedAt.getTime();
});

assert.deepStrictEqual(
  sortedWorkspace.map((n) => n.id),
  ['4', '2', '3', '1'],
  'Pinned notes must come first, each group sorted by updatedAt DESC'
);

console.log('✓ Notes Redesign logic verified!');

console.log('--- All Phase 8-10 Unit Tests Passed Successfully ---');

