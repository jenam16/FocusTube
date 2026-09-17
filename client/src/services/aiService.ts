import { request } from './api.js';
import { AIContextData, AIChatPayload } from '../types/ai.js';

export async function getAIContext(
  courseId?: string,
  videoId?: string
): Promise<AIContextData> {
  const params = new URLSearchParams();
  if (courseId) params.append('courseId', courseId);
  if (videoId) params.append('videoId', videoId);

  const query = params.toString();
  const endpoint = `/ai/context${query ? `?${query}` : ''}`;
  const response = await request<{ success: boolean; data: AIContextData }>(
    endpoint
  );
  return response.data;
}

export async function sendAIChat(
  payload: AIChatPayload
): Promise<{ reply: string }> {
  const response = await request<{
    success: boolean;
    data: { reply: string };
  }>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
}
