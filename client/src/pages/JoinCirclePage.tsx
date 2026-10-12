import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { studyCircleService } from '../services';
import { CircleJoinInfo } from '../types';

export const JoinCirclePage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();

  const [joinInfo, setJoinInfo] = useState<CircleJoinInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteCode) {
      setError('Invalid invite code');
      setIsLoading(false);
      return;
    }

    const fetchInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await studyCircleService.getJoinInfo(inviteCode);
        setJoinInfo(data);
      } catch (err: any) {
        setError(err?.message || 'Invalid or expired invite code');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInfo();
  }, [inviteCode]);

  const handleJoin = async () => {
    if (!inviteCode) return;
    try {
      setIsJoining(true);
      setJoinError(null);
      const res = await studyCircleService.joinCircle(inviteCode);
      navigate(`/study-circles/${res.circleId}`);
    } catch (err: any) {
      setJoinError(err?.message || 'Failed to join circle');
    } finally {
      setIsJoining(false);
    }
  };

  const circleId = joinInfo?._id || (joinInfo as any)?.circleId;
  const hostName = joinInfo?.hostName || (joinInfo as any)?.host?.name || 'Study Circle Host';
  const courseThumbnail = joinInfo?.courseThumbnail || (joinInfo as any)?.playlistThumbnail;
  const courseTitle = joinInfo?.courseTitle || (joinInfo as any)?.playlistTitle || 'Playlist Snapshot';

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-card border border-app rounded-2xl shadow-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-muted">Retrieving Study Circle invitation details...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-primary font-heading">
              Invitation Unavailable
            </h2>
            <p className="text-sm text-muted">{error}</p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/study-circles')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all"
              >
                Go to Study Circles
              </button>
            </div>
          </div>
        ) : joinInfo ? (
          <div>
            {/* Header Image */}
            <div className="relative aspect-video w-full bg-secondary overflow-hidden">
              {courseThumbnail ? (
                <img
                  src={courseThumbnail}
                  alt={courseTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">
                  <BookOpen className="h-12 w-12 opacity-30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/40 border border-indigo-400/30 backdrop-blur-md inline-block mb-1.5">
                  Study Circle Invitation
                </span>
                <h1 className="text-xl font-bold line-clamp-1">{joinInfo.name}</h1>
                <p className="text-xs text-white/80 line-clamp-1">
                  Snapshot: {courseTitle}
                </p>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-6">
              {joinInfo.description && (
                <p className="text-sm text-muted">{joinInfo.description}</p>
              )}

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-secondary border border-app">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                    Host
                  </div>
                  <div className="text-xs font-bold text-primary truncate">
                    {hostName}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary border border-app">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                    Videos
                  </div>
                  <div className="text-xs font-bold text-primary flex items-center justify-center gap-1">
                    <Video className="h-3.5 w-3.5 text-indigo-400" />
                    {joinInfo.totalVideos || 0}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-secondary border border-app">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                    Members
                  </div>
                  <div className="text-xs font-bold text-primary flex items-center justify-center gap-1">
                    <Users className="h-3.5 w-3.5 text-indigo-400" />
                    {joinInfo.memberCount || 1} / {joinInfo.maxMembers || 5}
                  </div>
                </div>
              </div>

              {joinError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{joinError}</span>
                </div>
              )}

              {/* Status & CTA */}
              {joinInfo.isAlreadyMember ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>You are already a member of this Study Circle.</span>
                  </div>
                  <button
                    onClick={() => navigate(`/study-circles/${circleId}`)}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
                  >
                    Open Workspace <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : joinInfo.isFull ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>This Study Circle is full (maximum 5 members reached).</span>
                  </div>
                  <button
                    onClick={() => navigate('/study-circles')}
                    className="w-full py-2.5 rounded-xl border border-app bg-secondary hover:bg-hover text-sm font-medium text-primary transition-all"
                  >
                    Explore Other Circles
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-muted flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Your video progress will remain independent and saved securely.</span>
                  </div>
                  <button
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Joining Study Circle...
                      </>
                    ) : (
                      <>
                        Join Study Circle <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
