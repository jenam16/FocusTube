import { request } from './api';
import { AnalyticsResponse } from '../types';

export const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsResponse> => {
    return request<AnalyticsResponse>('/analytics');
  },
};
