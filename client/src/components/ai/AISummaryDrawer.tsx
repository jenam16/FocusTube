import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Brain,
  Clock,
  Zap,
  Play,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { AISummaryData } from '../../types';

interface AISummaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  summaryData: AISummaryData | null;
  isLoading?: boolean;
  error?: string | null;
  onSeekTo?: (seconds: number) => void;
  onRetry?: () => void;
}

export const AISummaryDrawer: React.FC<AISummaryDrawerProps> = ({
  isOpen,
  onClose,
  videoTitle,
  summaryData,
  isLoading = false,
  error = null,
  onSeekTo,
  onRetry,
}) => {
  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          role="dialog"
          aria-label="AI Study Summary"
          className="w-screen max-w-lg bg-surface border-l border-app shadow-2xl flex flex-col transition-all"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-app p-4 bg-secondary">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-600/25 shrink-0">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-primary truncate font-heading flex items-center gap-1.5">
                  <span>AI Study Summary</span>
                </h3>
                <p className="text-xs text-secondary truncate">{videoTitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-secondary hover:bg-surface-elevated hover:text-primary transition-colors cursor-pointer"
              aria-label="Close summary drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 1. Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="relative flex items-center justify-center h-14 w-14">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h4 className="text-sm font-semibold text-primary font-heading">
                    Generating Study Summary...
                  </h4>
                  <p className="text-xs text-secondary leading-relaxed">
                    Analyzing the transcript, extracting core concepts, and pinpointing important lecture moments.
                  </p>
                </div>
              </div>
            )}

            {/* 2. Error State */}
            {!isLoading && error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500 dark:text-rose-400">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                    Unable to Generate Summary
                  </h4>
                  <p className="text-xs text-secondary leading-relaxed">{error}</p>
                </div>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Try Again</span>
                  </button>
                )}
              </div>
            )}

            {/* 3. Empty State (No summary yet and not loading) */}
            {!isLoading && !error && !summaryData && (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-primary font-heading">
                  No Summary Generated Yet
                </h4>
                <p className="text-xs text-secondary max-w-xs leading-relaxed">
                  Click the "AI Summary" button to analyze this video's transcript and generate study notes.
                </p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/25 hover:from-indigo-500 hover:to-indigo-400 transition-all cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate AI Summary</span>
                  </button>
                )}
              </div>
            )}

            {/* 4. Active Summary Content */}
            {!isLoading && summaryData && (
              <>
                {/* Section 1: Overview */}
                <div className="space-y-2.5 rounded-2xl border border-app bg-secondary p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-500 font-heading">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Overview</span>
                  </div>
                  <p className="text-xs sm:text-sm text-primary leading-relaxed whitespace-pre-line">
                    {summaryData.summary}
                  </p>
                </div>

                {/* Section 2: Key Concepts */}
                {Array.isArray(summaryData.keyConcepts) && summaryData.keyConcepts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-500 font-heading">
                      <Brain className="h-3.5 w-3.5" />
                      <span>Key Concepts</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {summaryData.keyConcepts.map((concept, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-300"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          <span>{concept}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Important Moments */}
                {Array.isArray(summaryData.importantMoments) && summaryData.importantMoments.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-500 font-heading">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Important Moments</span>
                      </div>
                      <span className="text-[11px] text-muted">
                        Click Watch to seek
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {summaryData.importantMoments.map((moment, idx) => (
                        <div
                          key={idx}
                          className="group flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 rounded-xl border border-app bg-secondary p-3.5 hover:border-indigo-500/40 transition-colors"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                                {moment.time}
                              </span>
                              <h5 className="text-xs sm:text-sm font-semibold text-primary truncate">
                                {moment.title}
                              </h5>
                            </div>
                            {moment.description && (
                              <p className="text-xs text-secondary leading-relaxed pl-0.5">
                                {moment.description}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => onSeekTo?.(moment.startTime)}
                            className="inline-flex items-center justify-center gap-1.5 self-start sm:self-center shrink-0 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:text-indigo-400 dark:hover:text-white border border-indigo-500/20 hover:border-indigo-600 px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                            title={`Jump to ${moment.time}`}
                          >
                            <Play className="h-3 w-3 fill-current" />
                            <span>Watch</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 4: Quick Revision */}
                {Array.isArray(summaryData.quickRevision) && summaryData.quickRevision.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-500 font-heading">
                      <Zap className="h-3.5 w-3.5" />
                      <span>Quick Revision</span>
                    </div>

                    <div className="rounded-2xl border border-app bg-secondary p-4 space-y-2">
                      {summaryData.quickRevision.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-primary">
                          <span className="text-indigo-500 font-bold mt-0.5">•</span>
                          <span className="leading-relaxed">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Drawer Footer */}
          {summaryData && (
            <div className="border-t border-app p-3 bg-secondary flex items-center justify-between text-[11px] text-muted">
              <span>Saved in your course syllabus</span>
              <span>FocusTube AI</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
