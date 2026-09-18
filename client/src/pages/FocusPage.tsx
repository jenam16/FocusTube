import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Focus,
  Play,
  Sparkles,
  VolumeX,
  Clock,
  ShieldCheck,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { courseService } from '../services';
import { LoadingState } from '../components';

export const FocusPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. Fetch courses with videos & progress
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getCourses,
  });

  const courses = coursesData?.courses || [];

  // 2. Determine Continue Learning target (first course with progress or first course)
  const activeCourse = courses.find((c) => (c.progressPercentage || 0) < 100) || courses[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0D1527] via-[#0B101E] to-[#070B14] p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Dedicated Distraction-Free Player</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight font-heading">
            Enter Deep <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-teal-300 to-indigo-200">Focus Mode</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Eliminate all YouTube sidebars, comments, and algorithmic rabbit holes. Watch high-impact lessons in an uncluttered, cinematic workspace designed purely for retention and flow.
          </p>

          {activeCourse && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate(`/courses/${activeCourse._id}`)}
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] transition-all"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Launch in {activeCourse.title}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0B101E] p-5 space-y-2.5 shadow-lg shadow-black/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <VolumeX className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white font-heading">Zero Distractions</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No related videos, comments, or promotional popups. Only the current lesson video player and your syllabus.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0B101E] p-5 space-y-2.5 shadow-lg shadow-black/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white font-heading">Timestamped Notes</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Take notes directly alongside playback. Click timestamps anytime to jump back to exact explanations.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0B101E] p-5 space-y-2.5 shadow-lg shadow-black/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white font-heading">Progress Preservation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Continuous second-by-second checkpoint tracking with automatic lesson completion and streak verification.
          </p>
        </div>
      </div>

      {/* Course Selection Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white font-heading">Choose a Course to Focus</h2>
            <p className="text-xs text-slate-400">Select any enrolled course to begin a distraction-free study session.</p>
          </div>
          <Link
            to="/courses"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
          >
            <span>View All Courses</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading && <LoadingState type="grid" count={3} />}

        {!isLoading && courses.length === 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0B101E] p-8 text-center space-y-3 shadow-lg shadow-black/20">
            <BookOpen className="h-8 w-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-semibold text-white font-heading">No courses in your library yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Import a YouTube playlist or create your first course to launch Focus Mode sessions.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-indigo-400 transition-all"
            >
              <span>Explore Courses</span>
            </Link>
          </div>
        )}

        {!isLoading && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const progressPct = course.progressPercentage || 0;

              return (
                <div
                  key={course._id}
                  className="group flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#0B101E] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-950/30"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#070B14]">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-600">
                          <BookOpen className="h-8 w-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-medium text-slate-300">
                        <span>{course.totalVideos || 0} lessons</span>
                        <span>{progressPct}% done</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 font-heading tracking-tight">
                        {course.title}
                      </h3>
                      {course.channelName && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {course.channelName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <Link
                      to={`/courses/${course._id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
                    >
                      <Focus className="h-3.5 w-3.5" />
                      <span>Start Focus</span>
                    </Link>

                    <span className="text-[11px] text-slate-500">
                      {progressPct}% completed
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
