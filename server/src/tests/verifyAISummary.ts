import assert from 'node:assert';
import { formatSecondsToTime, formatTranscriptForPrompt, TranscriptItem } from '../services/transcriptService.js';
import { Video } from '../models/Video.js';
import { Course } from '../models/Course.js';
import mongoose from 'mongoose';
import { getOrGenerateVideoSummary } from '../services/videoSummaryService.js';

async function runTests() {
  console.log('--- Running AI Study Summary Unit Verifications ---');

  // 1. Test formatSecondsToTime
  console.log('1. Testing formatSecondsToTime helper...');
  assert.strictEqual(formatSecondsToTime(0), '00:00');
  assert.strictEqual(formatSecondsToTime(3), '00:03');
  assert.strictEqual(formatSecondsToTime(45), '00:45');
  assert.strictEqual(formatSecondsToTime(272), '04:32');
  assert.strictEqual(formatSecondsToTime(3599), '59:59');
  assert.strictEqual(formatSecondsToTime(3600), '01:00:00');
  assert.strictEqual(formatSecondsToTime(3730), '01:02:10');
  assert.strictEqual(formatSecondsToTime(36605), '10:10:05');
  console.log('✓ formatSecondsToTime passed all boundary checks!');

  // 2. Test formatTranscriptForPrompt
  console.log('2. Testing formatTranscriptForPrompt...');
  const sampleItems: TranscriptItem[] = [
    { start: 0, text: 'Welcome to this database lecture.' },
    { start: 272, text: 'Now we discuss functional dependencies.' },
    { start: 738, text: 'Next is Boyce-Codd Normal Form.' },
  ];
  const formatted = formatTranscriptForPrompt(sampleItems);
  assert.ok(formatted.includes('[00:00] (start: 0s) Welcome to this database lecture.'));
  assert.ok(formatted.includes('[04:32] (start: 272s) Now we discuss functional dependencies.'));
  assert.ok(formatted.includes('[12:18] (start: 738s) Next is Boyce-Codd Normal Form.'));
  console.log('✓ formatTranscriptForPrompt correctly formats lines with timestamps!');

  // 3. Test MongoDB Caching Logic (no external API calls when summary already exists)
  console.log('3. Testing MongoDB caching logic...');
  const fakeUserId = new mongoose.Types.ObjectId();
  const fakeCourseId = new mongoose.Types.ObjectId();
  const fakeVideoId = new mongoose.Types.ObjectId();

  const mockCourse = {
    _id: fakeCourseId,
    userId: fakeUserId,
    title: 'Test Course',
  };

  const existingSummary = {
    summary: 'A comprehensive lecture on database normalization and functional dependencies.',
    keyConcepts: ['Functional Dependency', '1NF', '2NF', '3NF', 'BCNF'],
    importantMoments: [
      {
        startTime: 272,
        time: '04:32',
        title: 'Functional Dependency',
        description: 'Definition and Armstrong axioms explanation.',
      },
      {
        startTime: 738,
        time: '12:18',
        title: 'BCNF Criteria',
        description: 'Understanding Boyce-Codd Normal Form requirements.',
      },
    ],
    quickRevision: [
      'A functional dependency is a constraint between two sets of attributes.',
      'BCNF is strictly stronger than 3NF.',
    ],
    generatedAt: new Date(),
  };

  const mockVideo = {
    _id: fakeVideoId,
    courseId: fakeCourseId,
    youtubeVideoId: 'test_yt_123',
    title: 'Lecture 5: Normalization',
    aiSummary: existingSummary,
  };

  // Mock Course.findOne and Video.findOne
  const origCourseFindOne = Course.findOne;
  const origVideoFindOne = Video.findOne;

  try {
    (Course as any).findOne = () => ({
      exec: async () => mockCourse,
      then: (resolve: any) => Promise.resolve(mockCourse).then(resolve),
    });

    (Video as any).findOne = () => ({
      exec: async () => mockVideo,
      then: (resolve: any) => Promise.resolve(mockVideo).then(resolve),
    });

    const result = await getOrGenerateVideoSummary(
      fakeUserId.toString(),
      fakeVideoId.toString(),
      fakeCourseId.toString()
    );

    assert.strictEqual(result.cached, true, 'Result should be marked cached');
    assert.strictEqual(result.summary.summary, existingSummary.summary);
    assert.strictEqual(result.summary.keyConcepts.length, 5);
    assert.strictEqual(result.summary.importantMoments.length, 2);
    assert.strictEqual(result.summary.importantMoments[0].startTime, 272);
    assert.strictEqual(result.summary.importantMoments[0].time, '04:32');
    console.log('✓ Cache hit confirmed: existing summary returned without external API calls!');
  } finally {
    (Course as any).findOne = origCourseFindOne;
    (Video as any).findOne = origVideoFindOne;
  }

  // 4. Test parseAndValidateSummaryJson resilience
  console.log('4. Testing parseAndValidateSummaryJson resilience...');
  const { parseAndValidateSummaryJson } = await import('../services/openRouterService.js');

  // 4a. Raw text with <think> reasoning and ```json markdown fences
  const complexResponse = `<think>
I need to summarize this video on TypeScript generics.
Let's make sure the JSON format is strictly respected.
</think>
\`\`\`json
{
  "summary": "This video covers TypeScript generic types and constraint interfaces.",
  "keyConcepts": ["Type variables", "Generic constraints", "Utility types"],
  "importantMoments": [
    {
      "startTime": 65,
      "time": "01:05",
      "title": "Generics Definition",
      "description": "Explains how <T> captures argument types dynamically."
    }
  ],
  "quickRevision": [
    "Generics enable type-safe reusable components across varied data types."
  ]
}
\`\`\``;

  const parsedOutput = parseAndValidateSummaryJson(complexResponse);
  assert.strictEqual(parsedOutput.summary, 'This video covers TypeScript generic types and constraint interfaces.');
  assert.strictEqual(parsedOutput.keyConcepts.length, 3);
  assert.strictEqual(parsedOutput.importantMoments.length, 1);
  assert.strictEqual(parsedOutput.importantMoments[0].startTime, 65);
  assert.strictEqual(parsedOutput.importantMoments[0].time, '01:05');
  assert.strictEqual(parsedOutput.quickRevision.length, 1);
  console.log('✓ parseAndValidateSummaryJson handles <think> tags and code fences cleanly!');

  console.log('--- All AI Study Summary Unit Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('AI Study Summary tests failed:', err);
  process.exit(1);
});
