import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Play,
  CheckCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Crown,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Trash2,
  LogOut,
  Send,
  HelpCircle,
  X,
  ListVideo,
} from 'lucide-react';
import { YouTubePlayer, YTPlayerInstance } from '../components/YouTubePlayer';
import {
  studyCircleService,
  subscribeToCircle,
  unsubscribeFromCircle,
  getSocket,
} from '../services';
import {
  StudyCircleDetails,
  StudyCircleMember,
  StudyCircleDiscussion,
  StudyCircleVideo,
} from '../types';
import { formatVideoTime } from '../utils';
import { useAuth } from '../hooks';

export const CircleWorkspacePage: React.FC = () => {
  const { circleId } = useParams<{ circleId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core Circle State
  const [circle, setCircle] = useState<StudyCircleDetails | null>(null);
  const [members, setMembers] = useState<StudyCircleMember[]>([]);
  const [discussions, setDiscussions] = useState<StudyCircleDiscussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Video State
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [completedVideoIds, setCompletedVideoIds] = useState<Set<string>>(new Set());
  const [initialSeconds, setInitialSeconds] = useState(0);

  // Player Ref & Current Time Tracker
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const currentTimeRef = useRef<number>(0);
  const lastSavedPositionRef = useRef<number>(0);

  // Tab State for Right Panel
  const [activeRightTab, setActiveRightTab] = useState<'playlist' | 'members'>('playlist');

  // Discussions State
  const [doubtContent, setDoubtContent] = useState('');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [isSubmittingDoubt, setIsSubmittingDoubt] = useState(false);
  const [replyingDoubtId, setReplyingDoubtId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [doubtFilter, setDoubtFilter] = useState<'all' | 'video' | 'open'>('all');

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [rawInviteCode, setRawInviteCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Delete / Leave confirmation modals
  const [isConfirmLeaveOpen, setIsConfirmLeaveOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!circleId) return;
    try {
      setIsLoading(true);
      setError(null);

      const [circleRes, membersRes, discussionsRes] = await Promise.all([
        studyCircleService.getCircleDetails(circleId),
        studyCircleService.getCircleMembers(circleId),
        studyCircleService.getDiscussions(circleId),
      ]);

      setCircle(circleRes.circle);
      setMembers(Array.isArray(membersRes) ? membersRes : []);
      setDiscussions(Array.isArray(discussionsRes) ? discussionsRes : []);

      // If membership returned, restore position and active video
      const myMembership = circleRes.myMembership;
      const videos = circleRes.circle?.playlistSnapshot?.videos || [];

      if (myMembership) {
        if (myMembership.completedVideoIds) {
          setCompletedVideoIds(new Set(myMembership.completedVideoIds));
        }
        if (myMembership.currentVideoId) {
          const idx = videos.findIndex((v) => v.videoId === myMembership.currentVideoId);
          if (idx !== -1) {
            setCurrentVideoIndex(idx);
          }
        }
        if (typeof myMembership.positionSeconds === 'number') {
          setInitialSeconds(myMembership.positionSeconds);
          currentTimeRef.current = myMembership.positionSeconds;
          lastSavedPositionRef.current = myMembership.positionSeconds;
        }
      }
    } catch (err: any) {
      console.error('Failed to load study circle workspace:', err);
      setError(err?.message || 'Failed to load study circle workspace');
    } finally {
      setIsLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup Socket.IO subscription and listeners
  useEffect(() => {
    if (!circleId) return;

    subscribeToCircle(circleId);
    const socket = getSocket();

    const handleMemberJoined = (data: any) => {
      if (data?.member) {
        setMembers((prev) => {
          const filtered = prev.filter(
            (m) => m._id !== data.member._id && m.userId !== data.member.userId
          );
          return [...filtered, data.member];
        });
      }
      if (typeof data?.memberCount === 'number') {
        setCircle((prev) => (prev ? { ...prev, memberCount: data.memberCount } : prev));
      }
    };

    const handleMemberLeft = (data: any) => {
      if (data?.userId) {
        setMembers((prev) => prev.filter((m) => m.userId !== data.userId && m.userId !== data.userId));
      }
      if (typeof data?.memberCount === 'number') {
        setCircle((prev) => (prev ? { ...prev, memberCount: data.memberCount } : prev));
      }
    };

    const handleProgressUpdated = (data: any) => {
      setMembers((prev) =>
        prev.map((m) => {
          if (m.userId === data.userId || (m as any).user?._id === data.userId) {
            return {
              ...m,
              currentVideoId: data.currentVideoId ?? m.currentVideoId,
              positionSeconds: data.positionSeconds ?? m.positionSeconds,
              completedVideosCount: data.completedVideosCount ?? m.completedVideosCount,
              progressPercentage: data.progressPercentage ?? m.progressPercentage,
              lastActiveAt: data.lastActiveAt ?? m.lastActiveAt,
            };
          }
          return m;
        })
      );
    };

    const handleDoubtCreated = (data: any) => {
      if (data?.discussion) {
        setDiscussions((prev) => {
          if (prev.some((d) => d._id === data.discussion._id)) return prev;
          return [data.discussion, ...prev];
        });
      }
    };

    const handleDoubtReplied = (data: any) => {
      const discussionId = data?.rootDoubtId || data?.discussionId;
      const reply = data?.reply;
      if (discussionId && reply) {
        setDiscussions((prev) =>
          prev.map((d) => {
            if (d._id === discussionId) {
              const replies = d.replies || [];
              if (replies.some((r) => r._id === reply._id)) return d;
              return { ...d, replies: [...replies, reply] };
            }
            return d;
          })
        );
      }
    };

    const handleDoubtResolved = (data: any) => {
      const doubtId = data?.doubtId || data?.discussionId;
      if (doubtId) {
        setDiscussions((prev) =>
          prev.map((d) =>
            d._id === doubtId
              ? {
                  ...d,
                  isResolved: data.isResolved,
                  resolvedBy: data.resolvedBy,
                  resolvedAt: data.resolvedAt,
                }
              : d
          )
        );
      }
    };

    // Support both event naming patterns for full backwards-compatibility
    socket.on('circle:member:joined', handleMemberJoined);
    socket.on('circle:member_joined', handleMemberJoined);
    socket.on('circle:member:left', handleMemberLeft);
    socket.on('circle:member_left', handleMemberLeft);
    socket.on('circle:progress:updated', handleProgressUpdated);
    socket.on('circle:progress_updated', handleProgressUpdated);
    socket.on('circle:doubt:created', handleDoubtCreated);
    socket.on('circle:doubt_created', handleDoubtCreated);
    socket.on('circle:doubt:replied', handleDoubtReplied);
    socket.on('circle:doubt_replied', handleDoubtReplied);
    socket.on('circle:doubt:resolved', handleDoubtResolved);
    socket.on('circle:doubt_resolved', handleDoubtResolved);

    return () => {
      unsubscribeFromCircle(circleId);
      socket.off('circle:member:joined', handleMemberJoined);
      socket.off('circle:member_joined', handleMemberJoined);
      socket.off('circle:member:left', handleMemberLeft);
      socket.off('circle:member_left', handleMemberLeft);
      socket.off('circle:progress:updated', handleProgressUpdated);
      socket.off('circle:progress_updated', handleProgressUpdated);
      socket.off('circle:doubt:created', handleDoubtCreated);
      socket.off('circle:doubt_created', handleDoubtCreated);
      socket.off('circle:doubt:replied', handleDoubtReplied);
      socket.off('circle:doubt_replied', handleDoubtReplied);
      socket.off('circle:doubt:resolved', handleDoubtResolved);
      socket.off('circle:doubt_resolved', handleDoubtResolved);
    };
  }, [circleId]);

  // Current video pointer
  const videos = circle?.playlistSnapshot?.videos || [];
  const activeVideo: StudyCircleVideo | undefined = videos[currentVideoIndex];

  // Helper to save current user progress to backend
  const saveProgress = useCallback(
    async (videoId: string, positionSec: number, completed?: boolean) => {
      if (!circleId) return;
      try {
        const res = await studyCircleService.updateProgress(circleId, {
          videoId,
          positionSeconds: Math.floor(positionSec),
          completed,
        });

        if (res.membership?.completedVideoIds) {
          setCompletedVideoIds(new Set(res.membership.completedVideoIds));
        }

        if (res.membership) {
          setMembers((prev) =>
            prev.map((m) =>
              m.userId === user?.id || (m as any).user?._id === user?.id
                ? {
                    ...m,
                    completedVideosCount: res.membership.completedVideosCount,
                    progressPercentage: res.membership.progressPercentage,
                    positionSeconds: res.membership.positionSeconds,
                    currentVideoId: res.membership.currentVideoId,
                  }
                : m
            )
          );
        }
      } catch (err) {
        console.warn('[StudyCircle] Progress save non-fatal error:', err);
      }
    },
    [circleId, user]
  );

  // Interval-based position save (throttled every 10 seconds while watching)
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeVideo && Math.abs(currentTimeRef.current - lastSavedPositionRef.current) > 5) {
        lastSavedPositionRef.current = currentTimeRef.current;
        saveProgress(activeVideo.videoId, currentTimeRef.current);
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [activeVideo, saveProgress]);

  // Select video from playlist
  const handleSelectVideo = (index: number) => {
    if (index === currentVideoIndex || index < 0 || index >= videos.length) return;
    if (activeVideo) {
      saveProgress(activeVideo.videoId, currentTimeRef.current);
    }
    setCurrentVideoIndex(index);
    setInitialSeconds(0);
    currentTimeRef.current = 0;
    lastSavedPositionRef.current = 0;
    saveProgress(videos[index].videoId, 0);
  };

  // Toggle lesson complete
  const handleToggleComplete = async () => {
    if (!activeVideo) return;
    const isCurrentlyDone = completedVideoIds.has(activeVideo.videoId);
    const willBeDone = !isCurrentlyDone;

    setCompletedVideoIds((prev) => {
      const next = new Set(prev);
      if (willBeDone) next.add(activeVideo.videoId);
      else next.delete(activeVideo.videoId);
      return next;
    });

    await saveProgress(activeVideo.videoId, currentTimeRef.current, willBeDone);
  };

  // Submit Doubt
  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleId || !doubtContent.trim()) return;

    try {
      setIsSubmittingDoubt(true);
      const timestamp = includeTimestamp ? Math.floor(currentTimeRef.current) : undefined;
      const doubt = await studyCircleService.createDoubt(circleId, {
        body: doubtContent.trim(),
        videoId: activeVideo?.videoId,
        videoTitle: activeVideo?.title,
        timestampSeconds: timestamp,
      });

      setDiscussions((prev) => [doubt, ...prev]);
      setDoubtContent('');
    } catch (err: any) {
      alert(err?.message || 'Failed to post doubt');
    } finally {
      setIsSubmittingDoubt(false);
    }
  };

  // Reply to Doubt
  const handleReplySubmit = async (e: React.FormEvent, doubtId: string) => {
    e.preventDefault();
    if (!circleId || !replyContent.trim()) return;

    try {
      setIsSubmittingReply(true);
      const reply = await studyCircleService.replyDoubt(
        circleId,
        doubtId,
        replyContent.trim()
      );

      setDiscussions((prev) =>
        prev.map((d) =>
          d._id === doubtId
            ? { ...d, replies: [...(d.replies || []), reply] }
            : d
        )
      );
      setReplyContent('');
      setReplyingDoubtId(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to post reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Toggle resolve doubt
  const handleToggleResolve = async (discussion: StudyCircleDiscussion) => {
    if (!circleId) return;
    try {
      const updated = await studyCircleService.resolveDoubt(
        circleId,
        discussion._id,
        !discussion.isResolved
      );

      setDiscussions((prev) =>
        prev.map((d) => (d._id === discussion._id ? updated : d))
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update doubt resolution status');
    }
  };

  // Seek to timestamp
  const handleSeekToTimestamp = (sec?: number) => {
    if (typeof sec !== 'number') return;
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(sec, true);
    }
  };

  // Regenerate Invite Code (Host only)
  const handleRegenerateCode = async () => {
    if (!circleId) return;
    try {
      setIsRegenerating(true);
      const res = await studyCircleService.regenerateInviteCode(circleId);
      setRawInviteCode(res.inviteCode);
      setInviteLink(res.inviteUrl);
    } catch (err: any) {
      alert(err?.message || 'Failed to regenerate invite code');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Open Invite Modal
  const handleOpenInvite = async () => {
    setIsInviteModalOpen(true);
    if (!rawInviteCode && circleId) {
      try {
        const res = await studyCircleService.regenerateInviteCode(circleId);
        setRawInviteCode(res.inviteCode);
        setInviteLink(res.inviteUrl);
      } catch {
        // Invite link fallback if already shared
        if (typeof window !== 'undefined') {
          setInviteLink(`${window.location.origin}/study-circles`);
        }
      }
    }
  };

  // Leave Circle
  const handleLeaveCircle = async () => {
    if (!circleId) return;
    try {
      await studyCircleService.leaveCircle(circleId);
      navigate('/study-circles');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to leave circle');
    }
  };

  // Delete Circle
  const handleDeleteCircle = async () => {
    if (!circleId) return;
    try {
      await studyCircleService.deleteCircle(circleId);
      navigate('/study-circles');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete circle');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center py-20 text-muted gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading Study Circle Workspace...</p>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="bg-card border border-app rounded-2xl p-8 max-w-md text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-primary">Unable to access Circle</h2>
          <p className="text-sm text-muted">{error || 'Circle not found or access denied.'}</p>
          <button
            onClick={() => navigate('/study-circles')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white"
          >
            Back to Study Circles
          </button>
        </div>
      </div>
    );
  }

  const isHost = circle.isHost ?? false;
  const isVideoCompleted = activeVideo ? completedVideoIds.has(activeVideo.videoId) : false;

  // Filtered discussions
  const filteredDiscussions = discussions.filter((d) => {
    if (doubtFilter === 'video') {
      return d.videoId === activeVideo?.videoId;
    }
    if (doubtFilter === 'open') {
      return !d.isResolved;
    }
    return true;
  });

  return (
    <div className="min-h-full flex flex-col space-y-4 p-4 lg:p-6 max-w-[1600px] mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              onClick={() => navigate('/study-circles')}
              className="text-xs text-muted hover:text-primary cursor-pointer transition-colors"
            >
              Study Circles
            </span>
            <span className="text-xs text-muted">/</span>
            <span className="text-xs font-semibold text-indigo-400">{circle.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-primary font-heading">
              {circle.name}
            </h1>
            {isHost ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Crown className="h-3 w-3" /> Host
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/20">
                Member
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="h-3 w-3" /> {circle.memberCount || 1} / 5 members
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenInvite}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-app bg-card hover:bg-hover text-xs font-semibold text-primary transition-all"
          >
            <Share2 className="h-3.5 w-3.5 text-indigo-400" />
            Invite Peers
          </button>

          {isHost ? (
            <button
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-400 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Circle
            </button>
          ) : (
            <button
              onClick={() => setIsConfirmLeaveOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-app bg-card hover:bg-hover text-xs font-semibold text-muted hover:text-red-400 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              Leave Circle
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Player & Discussions (Left) vs Playlist & Members (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Player & Doubts) */}
        <div className="lg:col-span-8 space-y-6">
          {/* YouTube Player */}
          {activeVideo ? (
            <div className="bg-card border border-app rounded-2xl overflow-hidden shadow-lg">
              <div className="aspect-video w-full bg-black">
                <YouTubePlayer
                  videoId={activeVideo.youtubeVideoId || activeVideo.videoId}
                  title={activeVideo.title}
                  initialSeconds={initialSeconds}
                  onReady={(player) => {
                    playerRef.current = player;
                  }}
                  onProgress={(curr) => {
                    currentTimeRef.current = curr;
                  }}
                />
              </div>

              {/* Video Controls & Info Bar */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-app">
                <div className="space-y-1 flex-1">
                  <div className="text-xs text-muted flex items-center gap-2">
                    <span>Lesson {currentVideoIndex + 1} of {videos.length}</span>
                    {activeVideo.duration ? (
                      <>
                        <span>•</span>
                        <span>{formatVideoTime(activeVideo.duration)}</span>
                      </>
                    ) : null}
                  </div>
                  <h2 className="text-base font-bold text-primary font-heading line-clamp-1">
                    {activeVideo.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSelectVideo(currentVideoIndex - 1)}
                    disabled={currentVideoIndex === 0}
                    className="p-2 rounded-xl border border-app bg-secondary hover:bg-hover text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Previous Lesson"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    onClick={handleToggleComplete}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isVideoCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25'
                        : 'border border-app bg-secondary hover:bg-hover text-muted hover:text-primary'
                    }`}
                  >
                    {isVideoCompleted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Mark as Complete
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSelectVideo(currentVideoIndex + 1)}
                    disabled={currentVideoIndex === videos.length - 1}
                    className="p-2 rounded-xl border border-app bg-secondary hover:bg-hover text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Next Lesson"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-app bg-card text-muted">
              No videos available in this circle snapshot.
            </div>
          )}

          {/* Doubts & Discussions Section */}
          <div className="bg-card border border-app rounded-2xl p-5 space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-app pb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-primary font-heading">
                  Circle Doubts & Discussions
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted">
                  {discussions.length}
                </span>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl border border-app text-xs font-medium">
                <button
                  onClick={() => setDoubtFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    doubtFilter === 'all'
                      ? 'bg-card text-primary shadow-sm font-semibold'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDoubtFilter('video')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    doubtFilter === 'video'
                      ? 'bg-card text-primary shadow-sm font-semibold'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  This Video
                </button>
                <button
                  onClick={() => setDoubtFilter('open')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    doubtFilter === 'open'
                      ? 'bg-card text-primary shadow-sm font-semibold'
                      : 'text-muted hover:text-primary'
                  }`}
                >
                  Unresolved
                </button>
              </div>
            </div>

            {/* Post Doubt Form */}
            <form onSubmit={handleCreateDoubt} className="space-y-3">
              <textarea
                rows={2}
                required
                placeholder="Ask a doubt or share an insight with your study circle..."
                value={doubtContent}
                onChange={(e) => setDoubtContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-secondary text-primary placeholder-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted hover:text-primary">
                  <input
                    type="checkbox"
                    checked={includeTimestamp}
                    onChange={(e) => setIncludeTimestamp(e.target.checked)}
                    className="rounded border-app text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    Link timestamp ({formatVideoTime(Math.floor(currentTimeRef.current || 0))})
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmittingDoubt || !doubtContent.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 disabled:opacity-50 transition-all"
                >
                  {isSubmittingDoubt ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Post Doubt
                </button>
              </div>
            </form>

            {/* Discussions Threads List */}
            <div className="space-y-4 pt-2">
              {filteredDiscussions.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted">
                  No questions or doubts found under this filter.
                </div>
              ) : (
                filteredDiscussions.map((d) => {
                  const authorId = d.authorId?._id || (d as any).author?._id;
                  const authorName = d.authorId?.name || (d as any).author?.name || 'Peer';
                  const isAuthor = authorId === user?.id;
                  const canResolve = isHost || isAuthor;

                  return (
                    <div
                      key={d._id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        d.isResolved
                          ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                          : 'border-app bg-secondary/50'
                      }`}
                    >
                      {/* Doubt Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                            {authorName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-primary">
                                {authorName}
                              </span>
                              {d.timestampSeconds !== undefined && (
                                <button
                                  type="button"
                                  onClick={() => handleSeekToTimestamp(d.timestampSeconds)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-colors"
                                >
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatVideoTime(d.timestampSeconds)}
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] text-muted">
                              {new Date(d.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Resolved Badge & Action */}
                        <div className="flex items-center gap-2">
                          {d.isResolved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <Check className="h-3 w-3" /> Resolved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Open
                            </span>
                          )}

                          {canResolve && (
                            <button
                              onClick={() => handleToggleResolve(d)}
                              className="text-[11px] font-medium text-muted hover:text-primary underline ml-1"
                            >
                              {d.isResolved ? 'Mark Open' : 'Mark Resolved'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
                        {d.body || (d as any).content}
                      </p>

                      {/* Replies List */}
                      {d.replies && d.replies.length > 0 && (
                        <div className="pl-4 border-l-2 border-indigo-500/30 space-y-2 pt-1">
                          {d.replies.map((r) => {
                            const rAuthorName = r.authorId?.name || (r as any).author?.name || 'Peer';
                            return (
                              <div key={r._id} className="text-xs space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-primary">
                                    {rAuthorName}
                                  </span>
                                  <span className="text-[10px] text-muted">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-muted leading-relaxed">{r.body || (r as any).content}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Reply Form or Toggle */}
                      {replyingDoubtId === d._id ? (
                        <form
                          onSubmit={(e) => handleReplySubmit(e, d._id)}
                          className="pt-2 space-y-2"
                        >
                          <textarea
                            rows={2}
                            required
                            placeholder="Write a helpful reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-app bg-secondary text-primary placeholder-muted/60 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingDoubtId(null);
                                setReplyContent('');
                              }}
                              className="px-3 py-1 rounded-lg text-xs text-muted hover:text-primary"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingReply || !replyContent.trim()}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              {isSubmittingReply ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="h-3 w-3" />
                              )}
                              Reply
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setReplyingDoubtId(d._id);
                            setReplyContent('');
                          }}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 pt-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Reply
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Tabs: Playlist Snapshot & Members Leaderboard) */}
        <div className="lg:col-span-4 bg-card border border-app rounded-2xl overflow-hidden shadow-lg sticky top-20">
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-app bg-secondary/50">
            <button
              onClick={() => setActiveRightTab('playlist')}
              className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeRightTab === 'playlist'
                  ? 'border-b-2 border-indigo-500 text-indigo-400 bg-card'
                  : 'text-muted hover:text-primary'
              }`}
            >
              <ListVideo className="h-4 w-4" />
              Playlist ({videos.length})
            </button>
            <button
              onClick={() => setActiveRightTab('members')}
              className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeRightTab === 'members'
                  ? 'border-b-2 border-indigo-500 text-indigo-400 bg-card'
                  : 'text-muted hover:text-primary'
              }`}
            >
              <Users className="h-4 w-4" />
              Members ({members.length})
            </button>
          </div>

          {/* Tab 1 Content: Playlist Snapshot */}
          {activeRightTab === 'playlist' && (
            <div className="divide-y divide-app max-h-[700px] overflow-y-auto">
              {videos.map((vid, idx) => {
                const isActive = idx === currentVideoIndex;
                const isCompleted = completedVideoIds.has(vid.videoId);

                return (
                  <div
                    key={vid.videoId}
                    onClick={() => handleSelectVideo(idx)}
                    className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-indigo-500/10 border-l-4 border-indigo-500'
                        : 'hover:bg-hover'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold text-muted w-5 pt-0.5 shrink-0">
                      {idx + 1}
                    </div>

                    <div className="relative aspect-video w-20 rounded-lg bg-secondary overflow-hidden shrink-0 border border-app">
                      {vid.thumbnailUrl ? (
                        <img
                          src={vid.thumbnailUrl}
                          alt={vid.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <Play className="h-4 w-4 opacity-40" />
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="h-4 w-4 text-indigo-400 fill-indigo-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <p
                        className={`text-xs font-medium line-clamp-2 ${
                          isActive ? 'text-indigo-400 font-bold' : 'text-primary'
                        }`}
                      >
                        {vid.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted">
                        {vid.duration ? (
                          <span>{formatVideoTime(vid.duration)}</span>
                        ) : null}
                      </div>
                    </div>

                    {isCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2 Content: Members Leaderboard */}
          {activeRightTab === 'members' && (
            <div className="p-4 space-y-4 max-h-[700px] overflow-y-auto">
              <div className="text-xs text-muted">
                Each member tracks their own progress independently within this circle.
              </div>

              <div className="space-y-3">
                {members.map((m) => {
                  const mUserId = m.userId || (m as any).user?._id;
                  const mName = m.name || (m as any).user?.name || 'Fellow Learner';
                  const isCurrent = mUserId === user?.id;
                  const pct = m.progressPercentage || 0;
                  const completed = m.completedVideosCount || 0;
                  const total = circle.playlistSnapshot?.totalVideos || 0;

                  return (
                    <div
                      key={m._id}
                      className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
                        isCurrent
                          ? 'border-indigo-500/40 bg-indigo-500/5'
                          : 'border-app bg-secondary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-secondary border border-app flex items-center justify-center text-xs font-bold text-primary">
                            {mName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-primary">
                                {mName}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted block">
                              {m.role === 'host' ? 'Host' : 'Member'}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-primary">
                          {pct}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted">
                          <span>
                            {completed} / {total} lessons completed
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SHARE / INVITE MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-app rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-app pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-primary font-heading">
                  Invite to Study Circle
                </h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-muted hover:text-primary p-1 rounded-lg hover:bg-hover transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted">
              Share the invite code or direct link with peers. Circles allow up to 5 members.
            </p>

            {rawInviteCode && (
              <div className="p-3 rounded-xl bg-secondary border border-app text-center space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Circle Invite Code
                </div>
                <div className="text-xl font-mono font-bold tracking-widest text-indigo-400 select-all">
                  {rawInviteCode}
                </div>
              </div>
            )}

            {inviteLink && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Direct Invitation Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-secondary border border-app text-muted select-all truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(inviteLink)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {isHost && (
              <div className="pt-2 border-t border-app">
                <button
                  onClick={handleRegenerateCode}
                  disabled={isRegenerating}
                  className="w-full py-2 rounded-xl border border-app bg-secondary hover:bg-hover text-xs font-medium text-muted hover:text-primary flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  Regenerate Code & Invalidate Old Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM LEAVE MODAL */}
      {isConfirmLeaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-app rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <LogOut className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-primary font-heading">
              Leave Study Circle?
            </h3>
            <p className="text-xs text-muted">
              Are you sure you want to leave this circle? Your progress in this circle will be preserved if you rejoin later.
            </p>
            {actionError && (
              <p className="text-xs text-red-400">{actionError}</p>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsConfirmLeaveOpen(false)}
                className="px-4 py-2 rounded-xl border border-app text-xs font-semibold text-muted hover:text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveCircle}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-md shadow-red-600/25"
              >
                Confirm Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-app rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-primary font-heading">
              Delete Study Circle?
            </h3>
            <p className="text-xs text-muted">
              As host, deleting this circle permanently removes all memberships and doubts. This action cannot be undone.
            </p>
            {actionError && (
              <p className="text-xs text-red-400">{actionError}</p>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 rounded-xl border border-app text-xs font-semibold text-muted hover:text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCircle}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-md shadow-red-600/25"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
