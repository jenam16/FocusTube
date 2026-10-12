import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  ArrowRight,
  Crown,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  Link as LinkIcon,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { studyCircleService, courseService } from '../services';
import { StudyCircleSummary, Course } from '../types';

export const StudyCirclesPage: React.FC = () => {
  const navigate = useNavigate();
  const [circles, setCircles] = useState<StudyCircleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [circleDescription, setCircleDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Post-create success modal state
  const [createdCircleData, setCreatedCircleData] = useState<{
    circleId: string;
    inviteLink: string;
    rawInviteCode: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Join Modal State
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const fetchCircles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await studyCircleService.getMyCircles();
      setCircles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load study circles:', err);
      setError(err?.message || 'Failed to load study circles');
      setCircles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, []);

  const handleOpenCreate = async () => {
    setIsCreateOpen(true);
    setCreateError(null);
    setCircleName('');
    setCircleDescription('');
    setSelectedCourseId('');
    try {
      setIsLoadingCourses(true);
      const res = await courseService.getCourses();
      const courseList = res?.courses || [];
      setAvailableCourses(courseList);
      if (courseList.length > 0) {
        setSelectedCourseId(courseList[0]._id);
      }
    } catch (err: any) {
      console.error('Failed to fetch courses:', err);
      setCreateError('Failed to load your courses for circle creation.');
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleName.trim()) {
      setCreateError('Please enter a circle name.');
      return;
    }
    if (!selectedCourseId) {
      setCreateError('Please select a course for the playlist snapshot.');
      return;
    }

    try {
      setIsSubmittingCreate(true);
      setCreateError(null);
      const res = await studyCircleService.createCircle({
        name: circleName.trim(),
        description: circleDescription.trim() || undefined,
        courseId: selectedCourseId,
        sourceCourseId: selectedCourseId,
      });

      setCreatedCircleData({
        circleId: res.circle._id,
        inviteLink: res.inviteUrl,
        rawInviteCode: res.inviteCode,
      });
      setIsCreateOpen(false);
      fetchCircles();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create study circle');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = joinCodeInput.trim();
    if (!rawInput) {
      setJoinError('Please enter an invite code or link');
      return;
    }

    // Extract code if user pasted a full URL
    let code = rawInput;
    if (rawInput.includes('/study-circles/join/')) {
      const parts = rawInput.split('/study-circles/join/');
      code = parts[parts.length - 1].split('?')[0].split('#')[0];
    } else if (rawInput.includes('/join/')) {
      const parts = rawInput.split('/join/');
      code = parts[parts.length - 1].split('?')[0].split('#')[0];
    }

    try {
      setIsSubmittingJoin(true);
      setJoinError(null);
      const res = await studyCircleService.joinCircle(code);
      setIsJoinOpen(false);
      setJoinCodeInput('');
      navigate(`/study-circles/${res.circleId}`);
    } catch (err: any) {
      setJoinError(err?.message || 'Invalid or expired invite code');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const safeCircles = Array.isArray(circles) ? circles : [];

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-app pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
              Study Circles
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Collaborative, small-group learning circles (up to 5 members). Share progress and discuss doubts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsJoinOpen(true);
              setJoinError(null);
              setJoinCodeInput('');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-app bg-card hover:bg-hover text-sm font-medium text-primary shadow-sm transition-all"
          >
            <LinkIcon className="h-4 w-4 text-muted" />
            Join with Code
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Circle
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm">Loading your Study Circles...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchCircles}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-medium"
          >
            Retry
          </button>
        </div>
      ) : safeCircles.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-app bg-card/40 max-w-2xl mx-auto">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4 border border-indigo-500/20">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold text-primary font-heading">
            No Study Circles yet
          </h2>
          <p className="mt-2 text-sm text-muted max-w-md mx-auto">
            Study Circles let you learn alongside up to 4 peers with a shared course snapshot, mutual progress visibility, and video timestamp doubt discussions.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white shadow-md shadow-indigo-600/25 transition-all"
            >
              <Plus className="h-4 w-4" />
              Create your first Circle
            </button>
            <button
              onClick={() => setIsJoinOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-app bg-card hover:bg-hover text-sm font-medium text-primary transition-all"
            >
              <LinkIcon className="h-4 w-4 text-muted" />
              Join with Code
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safeCircles.map((circle) => {
            const isHost = circle.isHost ?? circle.role === 'host';
            const completedCount = circle.myCompletedVideosCount ?? circle.userCompletedVideosCount ?? 0;
            const totalCount = circle.totalVideos ?? circle.playlistSnapshot?.totalVideos ?? 0;
            const progressPct = circle.myProgressPercentage ?? circle.userProgressPercentage ?? 0;
            const thumbnail = circle.courseThumbnail || circle.playlistSnapshot?.thumbnail || circle.playlistSnapshot?.thumbnailUrl;
            const courseTitle = circle.courseTitle || circle.playlistSnapshot?.title || 'Playlist Snapshot';

            return (
              <div
                key={circle._id}
                onClick={() => navigate(`/study-circles/${circle._id}`)}
                className="group cursor-pointer flex flex-col justify-between rounded-2xl border border-app bg-card hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 overflow-hidden"
              >
                {/* Card Thumbnail / Header */}
                <div className="relative aspect-video w-full bg-secondary overflow-hidden">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={circle.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">
                      <BookOpen className="h-10 w-10 opacity-40" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {isHost ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                        <Crown className="h-3 w-3" /> Host
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/90 backdrop-blur-md border border-white/20">
                        Member
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white border border-white/10 backdrop-blur-md">
                      <Users className="h-3 w-3 text-indigo-400" />
                      {circle.memberCount || 1} / 5
                    </span>
                  </div>

                  {/* Bottom title in thumbnail */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-xs font-medium text-white/70 line-clamp-1">
                      {courseTitle}
                    </p>
                    <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      {circle.name}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  {circle.description && (
                    <p className="text-xs text-muted line-clamp-2">
                      {circle.description}
                    </p>
                  )}

                  {/* Progress Section */}
                  <div className="space-y-2 pt-2 border-t border-app">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Your Progress</span>
                      <span className="font-semibold text-primary">
                        {completedCount} / {totalCount} ({progressPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="flex items-center justify-between text-xs font-medium text-muted pt-2 group-hover:text-indigo-400 transition-colors">
                    <span>Open Circle Workspace</span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE CIRCLE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-app rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-app">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-primary font-heading">
                  Create Study Circle
                </h2>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-muted hover:text-primary p-1 rounded-lg hover:bg-hover transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Circle Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DSA & Algorithms Cohort"
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-secondary text-primary placeholder-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Focus goals, learning schedule, or topics to cover..."
                  value={circleDescription}
                  onChange={(e) => setCircleDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-secondary text-primary placeholder-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Select Course for Playlist Snapshot *
                </label>
                {isLoadingCourses ? (
                  <div className="py-4 text-center text-xs text-muted flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    Loading your courses...
                  </div>
                ) : availableCourses.length === 0 ? (
                  <div className="p-3 rounded-xl bg-secondary border border-app text-xs text-muted">
                    No imported courses found. Please import a course first under &quot;My Courses&quot;.
                  </div>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-secondary text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {availableCourses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} ({c.totalVideos} videos)
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-1.5 text-[11px] text-muted">
                  A snapshot of this course will be cloned into the circle. Up to 5 members (including you) can join.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-app">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-app text-sm font-medium text-muted hover:text-primary hover:bg-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate || availableCourses.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 disabled:opacity-50 transition-all"
                >
                  {isSubmittingCreate ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Circle'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATED CIRCLE INVITE SHARE MODAL */}
      {createdCircleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-app rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-primary font-heading">
                Study Circle Ready!
              </h3>
              <p className="text-xs text-muted mt-1">
                Share this secure invite code or link with up to 4 peers.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary border border-app space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Invite Code
              </div>
              <div className="text-2xl font-mono font-bold tracking-widest text-indigo-400 select-all">
                {createdCircleData.rawInviteCode}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdCircleData.inviteLink}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-secondary border border-app text-muted select-all truncate"
              />
              <button
                onClick={() => copyToClipboard(createdCircleData.inviteLink)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Link
                  </>
                )}
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  const id = createdCircleData.circleId;
                  setCreatedCircleData(null);
                  navigate(`/study-circles/${id}`);
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all"
              >
                Go to Circle Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOIN CIRCLE MODAL */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-app rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-app">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-primary font-heading">
                  Join a Study Circle
                </h2>
              </div>
              <button
                onClick={() => setIsJoinOpen(false)}
                className="text-muted hover:text-primary p-1 rounded-lg hover:bg-hover transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="p-6 space-y-4">
              {joinError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{joinError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Invite Code or Link
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste invite link or enter 8-character code"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-app bg-secondary text-primary placeholder-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-app">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="px-4 py-2 rounded-xl border border-app text-sm font-medium text-muted hover:text-primary hover:bg-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJoin || !joinCodeInput.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 disabled:opacity-50 transition-all"
                >
                  {isSubmittingJoin ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Circle'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
