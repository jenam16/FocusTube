import { generateGeminiContent } from '../services/geminiService.js';
import { config } from '../config/index.js';

async function runAITests() {
  console.log('--- Running Focus AI Unit & Fallback Verifications ---');

  const originalKey = config.geminiApiKey;
  // 1. Test offline educational fallback when GEMINI_API_KEY is unset or empty
  console.log('1. Testing offline fallback responses...');
  config.geminiApiKey = '';
  try {
    const studyResponse = await generateGeminiContent('How should I study this topic?');
    if (!studyResponse.includes('Active Recall') && !studyResponse.includes('Study Strategy')) {
      throw new Error('Study strategy fallback did not match expected structure');
    }
    console.log('✓ Study strategy fallback verified!');

    const summaryResponse = await generateGeminiContent('Can you summarize what is this lesson about?');
    if (!summaryResponse.includes('Focused Learning Advice') && !summaryResponse.includes('core mental models')) {
      throw new Error('Summarization advice fallback did not match expected structure');
    }
    console.log('✓ Summarization advice fallback verified!');

    const generalResponse = await generateGeminiContent('Hello there');
    if (!generalResponse.includes('Focus AI is active and ready')) {
      throw new Error('General greeting fallback did not match expected structure');
    }
    console.log('✓ General fallback verified!');
  } finally {
    config.geminiApiKey = originalKey;
  }

  console.log('--- All Focus AI Tests Passed Successfully! ---');
}

runAITests().catch((err) => {
  console.error('Focus AI tests failed:', err);
  process.exit(1);
});
