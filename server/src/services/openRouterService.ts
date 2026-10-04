import { config } from '../config/index.js';
import { formatSecondsToTime } from './transcriptService.js';

export interface AISummaryOutput {
  summary: string;
  keyConcepts: string[];
  importantMoments: Array<{
    startTime: number;
    time: string;
    title: string;
    description: string;
  }>;
  quickRevision: string[];
}

export class OpenRouterError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'OpenRouterError';
    this.statusCode = statusCode;
  }
}

/**
 * Safely parse and sanitize LLM response JSON into AISummaryOutput.
 */
export function parseAndValidateSummaryJson(rawText: string): AISummaryOutput {
  let cleaned = rawText.trim();

  // Strip <think>...</think> reasoning tags if present
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip markdown code fences if present (```json ... ``` or ``` ...)
  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1').trim();
  }

  // Find the outermost JSON object bounds if there is stray conversational text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    // Try relaxing trailing commas: e.g. , } or , ]
    try {
      const relaxed = cleaned.replace(/,\s*([}\]])/g, '$1');
      parsed = JSON.parse(relaxed);
    } catch {
      console.error('[OpenRouter Service] Failed to parse JSON response. Preview:', cleaned.slice(0, 500));
      throw new OpenRouterError('AI service returned an invalid JSON response structure.', 502);
    }
  }

  // Validate and sanitize required fields
  const summary = typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
    ? parsed.summary.trim()
    : 'Summary unavailable for this video.';

  const keyConcepts: string[] = Array.isArray(parsed.keyConcepts)
    ? parsed.keyConcepts
        .filter((c: any) => typeof c === 'string' && c.trim().length > 0)
        .map((c: string) => c.trim())
    : [];

  const rawMoments = Array.isArray(parsed.importantMoments) ? parsed.importantMoments : [];
  const importantMoments = rawMoments
    .map((m: any) => {
      let startTime = typeof m.startTime === 'number' ? Math.floor(m.startTime) : NaN;
      if (isNaN(startTime) && typeof m.start === 'number') {
        startTime = Math.floor(m.start);
      }
      if (isNaN(startTime) && typeof m.time === 'string') {
        // Attempt parsing "MM:SS" or "HH:MM:SS"
        const parts = m.time.split(':').map((p: string) => parseInt(p, 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          startTime = parts[0] * 60 + parts[1];
        } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          startTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }

      if (isNaN(startTime) || startTime < 0) {
        return null;
      }

      const time = typeof m.time === 'string' && m.time.includes(':')
        ? m.time.trim()
        : formatSecondsToTime(startTime);

      const title = typeof m.title === 'string' && m.title.trim().length > 0
        ? m.title.trim()
        : 'Key Topic';

      const description = typeof m.description === 'string' ? m.description.trim() : '';

      return {
        startTime,
        time,
        title,
        description,
      };
    })
    .filter((m: any): m is NonNullable<typeof m> => m !== null)
    .sort((a: any, b: any) => a.startTime - b.startTime);

  const quickRevision: string[] = Array.isArray(parsed.quickRevision)
    ? parsed.quickRevision
        .filter((r: any) => typeof r === 'string' && r.trim().length > 0)
        .map((r: string) => r.trim())
    : [];

  return {
    summary,
    keyConcepts,
    importantMoments,
    quickRevision,
  };
}

/**
 * Call OpenRouter API to generate a structured study summary from video transcript.
 */
export async function generateStudySummaryFromTranscript(
  videoTitle: string,
  formattedTranscript: string
): Promise<AISummaryOutput> {
  const apiKey = config.openRouterApiKey?.trim();
  if (!apiKey) {
    throw new OpenRouterError(
      'OPENROUTER_API_KEY is not configured in server/.env. Please provide your OpenRouter API key.',
      503
    );
  }

  const model = config.openRouterModel?.trim() || 'inclusionai/ling-3.0-flash-sante:free';

  const systemPrompt = `You are a high-performance educational AI study assistant for FocusTube.
Your task is to analyze the provided timestamped transcript of a video lecture and produce a concise, high-yield study summary in valid JSON format.

CRITICAL INSTRUCTIONS:
1. Conciseness: Keep all explanations concise and to the point so the entire JSON fits comfortably within the response token limit.
2. Ground truth: Summarize ONLY the provided transcript. Do NOT invent facts or outside topics.
3. Timestamps: The transcript contains timestamps like [04:32] (start: 272s). When selecting "importantMoments", you MUST use the exact timestamps from the transcript. Do NOT invent fake timestamps.
4. Structure:
   - "summary": A concise, high-yield overview of what the video covers, main ideas, and takeaways (1-2 brief paragraphs, under 150 words total).
   - "keyConcepts": An array of 3-5 core mental models, definitions, or principles taught (each concept 1 concise sentence).
   - "importantMoments": An array of 3-6 genuine lecture milestones or transitions. Each entry must have:
     - "startTime": integer seconds (e.g. 272)
     - "time": string formatted as "MM:SS" (e.g. "04:32") or "HH:MM:SS"
     - "title": concise 2-5 word label for the milestone
     - "description": 1 concise sentence explaining what is taught at this point
   - "quickRevision": An array of 3-5 rapid bullet points for quick review (each under 20 words).
5. Output format: You MUST return ONLY valid JSON matching this exact structure:
{
  "summary": "string",
  "keyConcepts": ["string"],
  "importantMoments": [
    {
      "startTime": 0,
      "time": "00:00",
      "title": "string",
      "description": "string"
    }
  ],
  "quickRevision": ["string"]
}
Do NOT wrap the response in markdown code blocks. Output plain JSON only. Ensure the closing bracket } is complete and not cut off.`;

  const userPrompt = `Video Title: "${videoTitle}"

Transcript with Timestamps:
${formattedTranscript}

Generate the structured JSON study summary based strictly on this transcript.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    console.log(`[OpenRouter API] Calling OpenRouter (requested model: ${model})...`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.clientUrl || 'http://localhost:5173',
        'X-Title': 'FocusTube',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 5000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // 1. Handle non-2xx HTTP responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[OpenRouter API] HTTP ${response.status} (${response.statusText}) on model ${model}:`,
        errorText
      );
      throw new OpenRouterError(
        `OpenRouter request failed (${response.status}): ${response.statusText}`,
        response.status
      );
    }

    // 2. Parse response JSON safely
    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error(`[OpenRouter API] Non-JSON payload received from model ${model}:`, rawText.slice(0, 300));
      throw new OpenRouterError('OpenRouter returned an unparseable response.', 502);
    }

    // 3. Extract and safely log details (NO API KEY)
    const returnedModel = data?.model || model;
    const responseError = data?.error;
    const choices = data?.choices;
    const firstChoice = Array.isArray(choices) && choices.length > 0 ? choices[0] : null;
    const message = firstChoice?.message;
    const finishReason = firstChoice?.finish_reason || null;
    let content = message?.content;
    const refusal = message?.refusal || null;

    console.log('[OpenRouter API] Response details:', {
      httpStatus: response.status,
      httpStatusText: response.statusText,
      requestedModel: model,
      returnedModel,
      hasError: Boolean(responseError),
      error: responseError || null,
      choicesLength: Array.isArray(choices) ? choices.length : 0,
      firstChoiceFinishReason: finishReason,
      hasMessage: Boolean(message),
      messageRole: message?.role || null,
      hasContent: typeof content === 'string' && content.length > 0,
      contentLength: typeof content === 'string' ? content.length : 0,
      contentPreview: typeof content === 'string' ? content.slice(0, 200) : null,
      refusal,
    });

    // 4. Check for API-level error object inside response
    if (responseError) {
      const errorMsg = responseError.message || JSON.stringify(responseError);
      console.error(`[OpenRouter API] Error response from ${returnedModel}:`, errorMsg);
      throw new OpenRouterError(`OpenRouter error (${returnedModel}): ${errorMsg}`, 502);
    }

    // 5. Check for empty choices array
    if (!firstChoice) {
      console.error(`[OpenRouter API] Empty choices array returned by model ${returnedModel}`);
      throw new OpenRouterError(`OpenRouter returned no choices (${returnedModel}).`, 502);
    }

    // 6. Check for model refusal
    if (refusal) {
      console.error(`[OpenRouter API] Model ${returnedModel} refused the request:`, refusal);
      throw new OpenRouterError(`The AI model refused the request: ${refusal}`, 502);
    }

    // 7. Check if model truncated output due to token limits
    if (finishReason === 'length') {
      console.error(
        `[OpenRouter API] Model output truncated by token limit on ${returnedModel} (finish_reason: length). Content length: ${content?.length || 0}`
      );
      throw new OpenRouterError(
        `The AI model response was truncated before completing the summary (finish_reason: length). Please try again.`,
        502
      );
    }

    // 8. Handle empty content (fallback to message.reasoning if content is blank)
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      if (typeof message?.reasoning === 'string' && message.reasoning.includes('{')) {
        console.log(`[OpenRouter API] Content is empty, extracting JSON from reasoning field on ${returnedModel}`);
        content = message.reasoning;
      }
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      const reasonDetail = finishReason === 'content_filter'
        ? 'filtered by safety system (finish_reason: content_filter)'
        : `finish_reason: ${finishReason || 'unknown'}`;

      console.error(`[OpenRouter API] Empty content returned by model ${returnedModel} (${reasonDetail})`);
      throw new OpenRouterError(
        `The AI model returned an empty response (${reasonDetail}).`,
        502
      );
    }

    // 9. Parse and validate JSON structure defensively
    try {
      const validatedSummary = parseAndValidateSummaryJson(content);
      console.log(`[OpenRouter API] Successfully generated summary with model ${returnedModel}:`, {
        summaryLength: validatedSummary.summary.length,
        keyConceptsCount: validatedSummary.keyConcepts.length,
        momentsCount: validatedSummary.importantMoments.length,
        quickRevisionCount: validatedSummary.quickRevision.length,
      });
      return validatedSummary;
    } catch (parseErr: any) {
      console.error(`[OpenRouter API] Failed to parse/validate summary JSON from model ${returnedModel}:`, parseErr.message);
      throw new OpenRouterError(
        `The AI model returned an invalid or incomplete summary structure. Please try again.`,
        502
      );
    }
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') {
      console.warn(`[OpenRouter Service] Request timed out on model ${model} after 60 seconds.`);
      throw new OpenRouterError('The AI summary request timed out after 60 seconds. Please try again.', 504);
    }
    if (err instanceof OpenRouterError) {
      throw err;
    }
    console.error(`[OpenRouter Service] Unexpected error:`, err?.message || err);
    throw new OpenRouterError(
      `Unable to generate summary with OpenRouter: ${err?.message || 'Unexpected error occurred.'}`,
      502
    );
  }
}
