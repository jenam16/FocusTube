import { config } from '../config/index.js';

interface GeminiMessage {
  role: 'user' | 'model';
  text: string;
}

interface GenerateOptions {
  systemInstruction?: string;
  history?: GeminiMessage[];
}

const DEFAULT_SYSTEM_INSTRUCTION = `You are Focus AI, the built-in intelligent study companion for FocusTube.
FocusTube is a modern learning platform that transforms YouTube playlists into focused, distraction-free courses.

Your core guidelines:
1. Tone: Calm, encouraging, educational, and focused. Never robotic or verbose.
2. Conciseness: Keep responses crisp and actionable. Use bullet points or short paragraphs where appropriate.
3. Educational Focus: Help users understand complex concepts, organize their study goals, provide study strategies, and stay motivated.
4. Scope: If the user asks about the course or lesson they are currently watching, tailor your explanation to that subject.
5. Format: Use clean markdown (bolding, lists, code blocks if explaining programming concepts). Avoid unnecessary greetings or filler.
6. Safety: Do not generate harmful, discriminatory, or inappropriate content.`;

// Try these in order. If the first 404s (deprecated/unavailable for this key),
// we automatically fall back to the next one instead of just failing.
const MODEL_CANDIDATES = ['gemini-3.6-flash'];
/**
 * Call Google Gemini REST API with automatic model fallback + real diagnostics.
 */
export async function generateGeminiContent(
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  const apiKey = config.geminiApiKey?.trim();

  if (!apiKey || apiKey === 'your_gemini_api_key') {
    return generateOfflineHelpfulResponse(prompt, options);
  }

  const systemInstructionText =
    options?.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  if (options?.history && options.history.length > 0) {
    for (const msg of options.history) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }
  }

  contents.push({ role: 'user', parts: [{ text: prompt }] });

  const requestBody = {
    system_instruction: { parts: [{ text: systemInstructionText }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    },
  };

  let lastError: string | null = null;

  for (const model of MODEL_CANDIDATES) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Gemini API Error] model=${model} status=${res.status}`, errText);
        lastError = `${res.status}: ${errText}`;

        // 404 = this model isn't available to this key -> try the next candidate.
        // Any other error (401/403/429/500) -> stop, it won't be fixed by switching models.
        if (res.status === 404) continue;
        throw new Error(lastError);
      }

      const data = (await res.json()) as any;
      const candidate = data.candidates?.[0];
      const textPart = candidate?.content?.parts?.[0]?.text;

      if (!textPart) {
        return 'I could not generate a response for that. Please try rephrasing your question.';
      }
      return textPart.trim();
    } catch (error: any) {
      clearTimeout(timeout);
      if (error?.name === 'AbortError') {
        return 'Focus AI is temporarily unable to connect to the model. The request timed out.';
      }
      lastError = error?.message || String(error);
      console.error(`[Gemini Service] Error with model ${model}:`, lastError);
    }
  }

  return `Focus AI is temporarily unable to connect to the model. Please verify your GEMINI_API_KEY in server/.env. Last error: ${lastError}`;
}

/**
 * Helpful educational fallback when GEMINI_API_KEY has not been provided yet.
 */
function generateOfflineHelpfulResponse(
  prompt: string,
  options?: GenerateOptions
): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('study') || lower.includes('plan') || lower.includes('how to') || lower.includes('next')) {
    return `### 💡 Study Strategy
To maximize your progress:
- **Active Recall**: After each 10-15 minute segment, pause the video and summarize key takeaways in your own words.
- **Timestamped Notes**: Capture moments or take quick notes on tricky concepts to review before exams or projects.
- **Small Daily Milestones**: Complete 1-2 lessons per day consistently rather than cramming all at once.

*(Tip: Add your \`GEMINI_API_KEY\` to \`server/.env\` for dynamic, live AI explanations!)*`;
  }

  if (lower.includes('summary') || lower.includes('summarize') || lower.includes('what is')) {
    return `### 🎯 Focused Learning Advice
When mastering this topic:
1. Focus on core mental models and foundations before tackling edge cases.
2. Build small experiments or test snippets hands-on as you watch.
3. Review your Captured Moments in the Notes tab.

*(Tip: Add your \`GEMINI_API_KEY\` to \`server/.env\` for live generative answers!)*`;
  }

  return `Focus AI is active and ready to support your learning!

To enable personalized generative AI answers to any question, please set your \`GEMINI_API_KEY\` in \`server/.env\`.

In the meantime, keep up the momentum! You can use Focus Mode (press F on player) to remove all distractions and stay in the flow.`;
}