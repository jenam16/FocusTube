import { request } from './api';
import {
  StudyCircleSummary,
  StudyCircleDetails,
  StudyCircleMember,
  StudyCircleDiscussion,
  StudyCircleMembershipData,
  CircleJoinInfo,
  CreateCircleDto,
  UpdateCircleProgressDto,
  CreateDoubtDto,
  DoubtReply,
} from '../types';

export const studyCircleService = {
  // Get all circles user is part of (as host or member)
  async getMyCircles(): Promise<StudyCircleSummary[]> {
    const res = await request<{
      success: boolean;
      circles?: StudyCircleSummary[];
      data?: StudyCircleSummary[];
    }>('/study-circles');
    return res.circles || res.data || [];
  },

  // Create a new study circle
  async createCircle(dto: CreateCircleDto): Promise<{
    circle: StudyCircleDetails;
    inviteCode: string;
    inviteUrl: string;
  }> {
    const effectiveCourseId = (dto.courseId || dto.sourceCourseId || '').trim();
    const res = await request<{
      success: boolean;
      circle: StudyCircleDetails;
      inviteCode: string;
      inviteUrl: string;
      myMembership?: StudyCircleMembershipData;
    }>('/study-circles', {
      method: 'POST',
      body: JSON.stringify({
        name: dto.name,
        description: dto.description,
        courseId: effectiveCourseId,
        sourceCourseId: effectiveCourseId,
      }),
    });
    return {
      circle: res.circle,
      inviteCode: res.inviteCode,
      inviteUrl: res.inviteUrl,
    };
  },

  // Get preview info for join link
  async getJoinInfo(inviteCode: string): Promise<CircleJoinInfo> {
    const res = await request<{
      success: boolean;
      circle?: CircleJoinInfo;
      data?: CircleJoinInfo;
    }>(`/study-circles/join-info/${encodeURIComponent(inviteCode)}`);
    const data = res.circle || res.data;
    if (!data) {
      throw new Error('Circle invitation details not found');
    }
    return data;
  },

  // Join a circle using code
  async joinCircle(inviteCode: string): Promise<{ circleId: string }> {
    const res = await request<{
      success: boolean;
      circleId: string;
      membership?: any;
    }>('/study-circles/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
    return { circleId: res.circleId };
  },

  // Get circle details by ID
  async getCircleDetails(circleId: string): Promise<{
    circle: StudyCircleDetails;
    myMembership?: StudyCircleMembershipData;
    isHost: boolean;
  }> {
    const res = await request<{
      success: boolean;
      circle: StudyCircleDetails;
      myMembership?: StudyCircleMembershipData;
      isHost?: boolean;
    }>(`/study-circles/${circleId}`);
    return {
      circle: {
        ...res.circle,
        isHost: res.isHost ?? (res.myMembership?.role === 'host'),
      },
      myMembership: res.myMembership,
      isHost: res.isHost ?? (res.myMembership?.role === 'host'),
    };
  },

  // Get circle members & their individual progress
  async getCircleMembers(circleId: string): Promise<StudyCircleMember[]> {
    const res = await request<{
      success: boolean;
      members?: StudyCircleMember[];
      data?: StudyCircleMember[];
    }>(`/study-circles/${circleId}/members`);
    return res.members || res.data || [];
  },

  // Update caller's independent progress
  async updateProgress(
    circleId: string,
    dto: UpdateCircleProgressDto
  ): Promise<{
    membership: StudyCircleMembershipData;
  }> {
    const res = await request<{
      success: boolean;
      membership: StudyCircleMembershipData;
    }>(`/study-circles/${circleId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    return { membership: res.membership };
  },

  // Get discussion threads
  async getDiscussions(circleId: string): Promise<StudyCircleDiscussion[]> {
    const res = await request<{
      success: boolean;
      discussions?: StudyCircleDiscussion[];
      data?: StudyCircleDiscussion[];
    }>(`/study-circles/${circleId}/discussions`);
    return res.discussions || res.data || [];
  },

  // Post doubt
  async createDoubt(
    circleId: string,
    dto: CreateDoubtDto
  ): Promise<StudyCircleDiscussion> {
    const res = await request<{
      success: boolean;
      discussion: StudyCircleDiscussion;
    }>(`/study-circles/${circleId}/discussions`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return res.discussion;
  },

  // Reply to doubt
  async replyDoubt(
    circleId: string,
    doubtId: string,
    body: string
  ): Promise<DoubtReply> {
    const res = await request<{
      success: boolean;
      reply: DoubtReply;
    }>(`/study-circles/${circleId}/discussions/${doubtId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
    return res.reply;
  },

  // Toggle resolve status
  async resolveDoubt(
    circleId: string,
    doubtId: string,
    isResolved: boolean
  ): Promise<StudyCircleDiscussion> {
    const res = await request<{
      success: boolean;
      discussion: StudyCircleDiscussion;
    }>(`/study-circles/${circleId}/discussions/${doubtId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ isResolved }),
    });
    return res.discussion;
  },

  // Regenerate invite code (host only)
  async regenerateInviteCode(circleId: string): Promise<{
    inviteCode: string;
    inviteUrl: string;
  }> {
    const res = await request<{
      success: boolean;
      inviteCode: string;
      inviteUrl: string;
    }>(`/study-circles/${circleId}/regenerate-invite`, {
      method: 'POST',
    });
    return {
      inviteCode: res.inviteCode,
      inviteUrl: res.inviteUrl,
    };
  },

  // Leave circle
  async leaveCircle(circleId: string): Promise<void> {
    await request(`/study-circles/${circleId}/leave`, {
      method: 'POST',
    });
  },

  // Delete circle (host only)
  async deleteCircle(circleId: string): Promise<void> {
    await request(`/study-circles/${circleId}`, {
      method: 'DELETE',
    });
  },
};
