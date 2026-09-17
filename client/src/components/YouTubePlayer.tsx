import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Maximize,
  Minimize,
  Maximize2,
  Check,
  Gauge,
} from 'lucide-react';
import { CaptureMomentButton } from './player/CaptureMomentButton';
import { formatVideoTime } from '../utils';

export interface YTPlayerInstance {
  loadVideoById: (
    args: string | { videoId: string; startSeconds?: number }
  ) => void;
  cueVideoById: (
    args: string | { videoId: string; startSeconds?: number }
  ) => void;
  destroy: () => void;
  playVideo?: () => void;
  pauseVideo?: () => void;
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
  getPlayerState?: () => number;
  getPlaybackRate?: () => number;
  setPlaybackRate?: (rate: number) => void;
  getAvailablePlaybackRates?: () => number[];
}

export interface YTPlayerEvent {
  target: YTPlayerInstance;
  data?: number;
}

interface YouTubePlayerProps {
  videoId: string;
  dbVideoId?: string;
  courseId?: string;
  title?: string;
  initialSeconds?: number;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
  onReady?: (player: YTPlayerInstance) => void;
  onStateChange?: (event: YTPlayerEvent) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onError?: (event: YTPlayerEvent) => void;
  getCurrentTimestamp?: () => number;
}


interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, unknown>;
      events?: {
        onReady?: (event: YTPlayerEvent) => void;
        onStateChange?: (event: YTPlayerEvent) => void;
        onPlaybackRateChange?: (event: YTPlayerEvent) => void;
        onError?: (event: YTPlayerEvent) => void;
      };
    }
  ) => YTPlayerInstance;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Global subscription list for when YouTube IFrame API script is ready
let isScriptLoading = false;
const readyCallbacks: Array<() => void> = [];

const loadYouTubeIframeApi = (callback: () => void) => {
  if (window.YT && window.YT.Player) {
    callback();
    return;
  }

  readyCallbacks.push(callback);

  if (!isScriptLoading) {
    isScriptLoading = true;

    // Check if script element already exists in document
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousReady) previousReady();
      while (readyCallbacks.length > 0) {
        const cb = readyCallbacks.shift();
        if (cb) cb();
      }
    };
  }
};

const PLAYBACK_SPEED_STORAGE_KEY = 'focustube_preferred_playback_rate';

const getStoredPlaybackRate = (): number => {
  try {
    const val = sessionStorage.getItem(PLAYBACK_SPEED_STORAGE_KEY);
    if (val) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch {
    // Ignore storage exceptions
  }
  return 1;
};

const setStoredPlaybackRate = (rate: number) => {
  try {
    sessionStorage.setItem(PLAYBACK_SPEED_STORAGE_KEY, String(rate));
  } catch {
    // Ignore storage exceptions
  }
};

export const YouTubePlayer = ({
  videoId,
  dbVideoId,
  courseId,
  title,
  initialSeconds = 0,
  isTheaterMode = false,
  onToggleTheater,
  onReady,
  onStateChange,
  onProgress,
  onError,
  getCurrentTimestamp,
}: YouTubePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerElementRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<YTPlayerInstance | null>(null);
  const overlayControlsRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [capturedToast, setCapturedToast] = useState<{ visible: boolean; timeText: string } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const [playbackRate, setPlaybackRate] = useState<number>(getStoredPlaybackRate);
  const [availableRates, setAvailableRates] = useState<number[]>([
    0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
  ]);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const speedButtonRef = useRef<HTMLButtonElement>(null);

  const progressTimerRef = useRef<number | null>(null);
  const hasResumedRef = useRef(false);

  const onProgressRef = useRef(onProgress);
  const onStateChangeRef = useRef(onStateChange);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onStateChangeRef.current = onStateChange;
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  }, [onProgress, onStateChange, onReady, onError]);


  // Reset resume guard whenever videoId changes
  useEffect(() => {
    hasResumedRef.current = false;
  }, [videoId]);

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const reportProgress = useCallback(() => {
    if (!playerInstanceRef.current || !onProgressRef.current) return;
    try {
      const currentTime = playerInstanceRef.current.getCurrentTime
        ? playerInstanceRef.current.getCurrentTime()
        : 0;
      const duration = playerInstanceRef.current.getDuration
        ? playerInstanceRef.current.getDuration()
        : 0;
      if (
        typeof currentTime === 'number' &&
        !isNaN(currentTime) &&
        typeof duration === 'number' &&
        !isNaN(duration)
      ) {
        onProgressRef.current(currentTime, duration);
      }
    } catch {
      // Player might be unready or destroying
    }
  }, []);

  const startProgressTimer = useCallback(() => {
    clearProgressTimer();
    reportProgress();
    // Report progress periodically every 2.5 seconds while playing
    progressTimerRef.current = window.setInterval(() => {
      reportProgress();
    }, 2500);
  }, [clearProgressTimer, reportProgress]);

  // Monitor browser fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleBrowserFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((e: unknown) => {
        void e;
      });
    } else {
      document.exitFullscreen().catch((e: unknown) => {
        void e;
      });
    }
  }, []);

  const syncPlaybackRate = useCallback((player: YTPlayerInstance) => {
    try {
      if (typeof player.getAvailablePlaybackRates === 'function') {
        const rates = player.getAvailablePlaybackRates();
        if (Array.isArray(rates) && rates.length > 0) {
          setAvailableRates(rates);
        }
      }

      let currentRate = 1;
      if (typeof player.getPlaybackRate === 'function') {
        currentRate = player.getPlaybackRate() || 1;
      }

      const preferred = getStoredPlaybackRate();
      if (preferred !== 1 && typeof player.setPlaybackRate === 'function') {
        const rates =
          typeof player.getAvailablePlaybackRates === 'function'
            ? player.getAvailablePlaybackRates()
            : [];
        if (!rates || rates.length === 0 || rates.includes(preferred)) {
          player.setPlaybackRate(preferred);
          currentRate = preferred;
        }
      }

      setPlaybackRate(currentRate);
    } catch {
      // Ignore if player not ready
    }
  }, []);

  const handleSelectPlaybackRate = useCallback((rate: number) => {
    setIsSpeedMenuOpen(false);
    setStoredPlaybackRate(rate);
    if (
      playerInstanceRef.current &&
      typeof playerInstanceRef.current.setPlaybackRate === 'function'
    ) {
      playerInstanceRef.current.setPlaybackRate(rate);
    }
  }, []);

  // Close speed dropdown on outside click or Escape
  useEffect(() => {
    if (!isSpeedMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        speedMenuRef.current &&
        !speedMenuRef.current.contains(e.target as Node) &&
        speedButtonRef.current &&
        !speedButtonRef.current.contains(e.target as Node)
      ) {
        setIsSpeedMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSpeedMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSpeedMenuOpen]);

  const handlePlayerStateChange = useCallback(
    (event: YTPlayerEvent) => {
      const state = event.data;
      const YT = window.YT;

      // Check if resume seek is needed when video starts playing or buffering
      if (
        YT &&
        (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) &&
        !hasResumedRef.current &&
        initialSeconds > 2
      ) {
        hasResumedRef.current = true;
        try {
          if (typeof event.target.seekTo === 'function') {
            event.target.seekTo(initialSeconds, true);
          }
        } catch {
          // ignore
        }
      }

      if (YT && state === YT.PlayerState.PLAYING) {
        startProgressTimer();
      } else if (
        YT &&
        (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED)
      ) {
        clearProgressTimer();
        reportProgress();
      } else {
        clearProgressTimer();
      }

      if (onStateChangeRef.current) {
        onStateChangeRef.current(event);
      }
    },
    [initialSeconds, startProgressTimer, clearProgressTimer, reportProgress]
  );

  // Initialize or update player
  const initPlayer = useCallback(() => {
    if (!videoId || !playerElementRef.current) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    loadYouTubeIframeApi(() => {
      if (!playerElementRef.current) return;

      const startSec = initialSeconds > 2 ? Math.floor(initialSeconds) : 0;

      // If player instance exists, load the new video instead of recreating
      if (
        playerInstanceRef.current &&
        typeof playerInstanceRef.current.loadVideoById === 'function'
      ) {
        try {
          playerInstanceRef.current.loadVideoById({
            videoId,
            startSeconds: startSec,
          });
          hasResumedRef.current = startSec > 0;
          setIsLoading(false);
          setTimeout(() => {
            if (playerInstanceRef.current) {
              syncPlaybackRate(playerInstanceRef.current);
            }
          }, 300);
          return;
        } catch (e: unknown) {
          void e;
          // If loadVideoById fails, destroy and re-create below
          try {
            playerInstanceRef.current.destroy();
          } catch (destroyErr: unknown) {
            void destroyErr;
          }
          playerInstanceRef.current = null;
        }
      }

      try {
        playerInstanceRef.current = new window.YT!.Player(
          playerElementRef.current,
          {
            videoId,
            playerVars: {
              autoplay: 0,
              enablejsapi: 1,
              modestbranding: 1,
              rel: 0,
              origin: window.location.origin,
              fs: 1,
              playsinline: 1,
              start: startSec,
            },
            events: {
              onReady: (event: YTPlayerEvent) => {
                setIsLoading(false);
                setHasError(false);
                syncPlaybackRate(event.target);
                if (startSec > 0 && !hasResumedRef.current) {
                  hasResumedRef.current = true;
                  try {
                    if (typeof event.target.seekTo === 'function') {
                      event.target.seekTo(startSec, true);
                    }
                  } catch {
                    // ignore
                  }
                }
                if (onReadyRef.current) onReadyRef.current(event.target);
              },
              onStateChange: (event: YTPlayerEvent) => {
                if (typeof event.target.getAvailablePlaybackRates === 'function') {
                  const rates = event.target.getAvailablePlaybackRates();
                  if (Array.isArray(rates) && rates.length > 0) {
                    setAvailableRates(rates);
                  }
                }
                handlePlayerStateChange(event);
              },
              onPlaybackRateChange: (event: YTPlayerEvent) => {
                const newRate = typeof event.data === 'number' ? event.data : 1;
                setPlaybackRate(newRate);
                if (typeof event.target.getAvailablePlaybackRates === 'function') {
                  const rates = event.target.getAvailablePlaybackRates();
                  if (Array.isArray(rates) && rates.length > 0) {
                    setAvailableRates(rates);
                  }
                }
              },
              onError: (event: YTPlayerEvent) => {
                setIsLoading(false);
                setHasError(true);
                const code = event?.data;
                let msg = 'Unable to play this video.';
                if (code === 101 || code === 150) {
                  msg =
                    'Playback is restricted on external sites by the video owner.';
                } else if (code === 100) {
                  msg =
                    'Video was not found or has been removed from YouTube.';
                } else if (code === 2) {
                  msg = 'Invalid video parameters.';
                }
                setErrorMessage(msg);
                if (onErrorRef.current) onErrorRef.current(event);
              },
            },
          }
        );
      } catch (err: unknown) {
        console.error('YouTube Player initialization error:', err);
        setIsLoading(false);
        setHasError(true);
        setErrorMessage('Failed to initialize video player.');
      }
    });
  }, [videoId, initialSeconds, handlePlayerStateChange, syncPlaybackRate]);

  // Trigger init / update when videoId changes
  useEffect(() => {
    initPlayer();
  }, [initPlayer]);

  // Helper to get active playback timestamp
  const getPlayerTimestamp = useCallback(() => {
    if (getCurrentTimestamp) return getCurrentTimestamp();
    if (playerInstanceRef.current?.getCurrentTime) {
      try {
        return playerInstanceRef.current.getCurrentTime();
      } catch {
        return 0;
      }
    }
    return 0;
  }, [getCurrentTimestamp]);

  // Handle successful moment capture
  const handleCaptureSuccess = useCallback((timestampSeconds: number) => {
    const timeText = formatVideoTime(timestampSeconds);
    setCapturedToast({ visible: true, timeText });
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setCapturedToast(null);
      toastTimeoutRef.current = null;
    }, 3200);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearProgressTimer();
      reportProgress();
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (e: unknown) {
          void e;
        }
        playerInstanceRef.current = null;
      }
    };
  }, [clearProgressTimer, reportProgress]);


  return (
    <div
      ref={containerRef}
      className={`group/player relative w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'rounded-none border-0 h-screen w-screen flex items-center justify-center bg-black' : ''
      }`}
    >
      {/* 16:9 Aspect Ratio Container */}
      <div
        className={`relative aspect-video w-full overflow-hidden bg-black ${
          isFullscreen ? 'max-h-screen max-w-[177.78vh] mx-auto shadow-none' : ''
        }`}
      >
        {/* Actual IFrame target div */}
        <div ref={playerElementRef} className="h-full w-full" />

        {/* Loading Overlay */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-red-600 mb-3" />
            <p className="text-sm font-semibold text-white">Loading video...</p>
            {title && (
              <p className="mt-1 max-w-sm truncate text-xs text-gray-400 px-4 text-center">
                {title}
              </p>
            )}
          </div>
        )}

        {/* Error Overlay */}
        {hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950/95 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-white">
              Unable to play this video
            </h4>
            <p className="mt-1 max-w-md text-xs text-gray-400">
              {errorMessage ||
                'This video may be unavailable or restricted by its creator.'}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={initPlayer}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gray-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Try Again</span>
              </button>
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-transparent px-3.5 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <span>Watch on YouTube</span>
              </a>
            </div>
          </div>
        )}

        {/* Floating Quick Sizing & Capture Controls */}
        {!hasError && !isLoading && (
          <div
            ref={overlayControlsRef}
            className={`absolute top-3 right-3 z-30 flex items-center gap-2 transition-opacity duration-200 ${
              isFullscreen
                ? 'opacity-90 hover:opacity-100 group-hover/player:opacity-100'
                : 'opacity-0 group-hover/player:opacity-100'
            }`}
          >
            {/* Capture Moment Button - prominently accessible in Fullscreen & Player Hover */}
            {courseId && (
              <CaptureMomentButton
                courseId={courseId}
                videoId={dbVideoId || videoId}
                youtubeVideoId={videoId}
                videoTitle={title}
                getCurrentTimestamp={getPlayerTimestamp}
                videoElement={playerElementRef.current}
                playerElement={containerRef.current}
                hideElements={[overlayControlsRef.current]}
                variant="overlay"
                size="sm"
                onSuccess={handleCaptureSuccess}
              />
            )}

            {/* Playback Speed Control */}
            <div className="relative">
              <button
                ref={speedButtonRef}
                type="button"
                onClick={() => {
                  if (!isSpeedMenuOpen && playerInstanceRef.current?.getAvailablePlaybackRates) {
                    const rates = playerInstanceRef.current.getAvailablePlaybackRates();
                    if (Array.isArray(rates) && rates.length > 0) {
                      setAvailableRates(rates);
                    }
                  }
                  setIsSpeedMenuOpen((prev) => !prev);
                }}
                title="Playback speed"
                aria-label={`Playback speed: ${playbackRate}x`}
                aria-expanded={isSpeedMenuOpen}
                aria-haspopup="true"
                className={`flex h-8 items-center gap-1.5 rounded-xl border px-2.5 backdrop-blur-sm transition-all shadow-md text-xs font-semibold font-mono ${
                  isSpeedMenuOpen
                    ? 'border-indigo-500 bg-indigo-950/90 text-white ring-1 ring-indigo-500'
                    : 'border-white/20 bg-black/75 text-gray-200 hover:text-white hover:bg-black/90'
                }`}
              >
                <Gauge className="h-3.5 w-3.5 text-indigo-400" />
                <span>{playbackRate}x</span>
              </button>

              {/* Speed Options Dropdown */}
              {isSpeedMenuOpen && (
                <div
                  ref={speedMenuRef}
                  role="menu"
                  aria-label="Playback speed options"
                  className="absolute right-0 top-10 z-50 w-36 overflow-hidden rounded-xl border border-white/[0.12] bg-[#0B1120]/95 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-white/[0.08] mb-1">
                    Playback speed
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
                    {availableRates.map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        role="menuitem"
                        onClick={() => handleSelectPlaybackRate(rate)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                          playbackRate === rate
                            ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/30'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{rate}x</span>
                        {playbackRate === rate && (
                          <Check className="h-3.5 w-3.5 text-indigo-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {onToggleTheater && !isFullscreen && (
              <button
                type="button"
                onClick={onToggleTheater}
                title={isTheaterMode ? 'Default View' : 'Theater Mode (Expand)'}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-black/75 text-gray-300 hover:text-white hover:bg-black/90 backdrop-blur-sm transition-all shadow-md"
                aria-label={isTheaterMode ? 'Default View' : 'Theater Mode'}
              >
                {isTheaterMode ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-black/75 text-gray-300 hover:text-white hover:bg-black/90 backdrop-blur-sm transition-all shadow-md"
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Floating Capture Moment Toast Notification */}
        {capturedToast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-gray-950/90 px-4 py-2.5 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md pointer-events-none transition-all">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>✓ Moment captured — {capturedToast.timeText}</span>
          </div>
        )}
      </div>
    </div>
  );
};
