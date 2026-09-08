import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Maximize,
  Minimize,
  Maximize2,
} from 'lucide-react';

export interface YTPlayerInstance {
  loadVideoById: (id: string) => void;
  cueVideoById: (id: string) => void;
  destroy: () => void;
  playVideo?: () => void;
  pauseVideo?: () => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
}

export interface YTPlayerEvent {
  target: YTPlayerInstance;
  data?: number;
}

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
  onReady?: (player: YTPlayerInstance) => void;
  onStateChange?: (event: YTPlayerEvent) => void;
  onError?: (event: YTPlayerEvent) => void;
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

export const YouTubePlayer = ({
  videoId,
  title,
  isTheaterMode = false,
  onToggleTheater,
  onReady,
  onStateChange,
  onError,
}: YouTubePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerElementRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<YTPlayerInstance | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Initialize or update player
  const initPlayer = useCallback(() => {
    if (!videoId || !playerElementRef.current) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    loadYouTubeIframeApi(() => {
      if (!playerElementRef.current) return;

      // If player instance exists, load the new video instead of recreating
      if (
        playerInstanceRef.current &&
        typeof playerInstanceRef.current.loadVideoById === 'function'
      ) {
        try {
          playerInstanceRef.current.loadVideoById(videoId);
          setIsLoading(false);
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
            },
            events: {
              onReady: (event: YTPlayerEvent) => {
                setIsLoading(false);
                setHasError(false);
                if (onReady) onReady(event.target);
              },
              onStateChange: (event: YTPlayerEvent) => {
                if (onStateChange) onStateChange(event);
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
                if (onError) onError(event);
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
  }, [videoId, onReady, onStateChange, onError]);

  // Trigger init / update when videoId changes
  useEffect(() => {
    initPlayer();
  }, [initPlayer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (e: unknown) {
          void e;
        }
        playerInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`group/player relative w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'rounded-none border-0' : ''
      }`}
    >
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-black">
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

        {/* Floating Quick Sizing Controls (Theater / Full Size) */}
        {!hasError && !isLoading && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 opacity-0 group-hover/player:opacity-100 transition-opacity duration-200">
            {onToggleTheater && (
              <button
                type="button"
                onClick={onToggleTheater}
                title={isTheaterMode ? 'Default View' : 'Theater Mode (Expand)'}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/75 text-gray-300 hover:text-white hover:bg-black/90 backdrop-blur-sm transition-colors"
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
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/75 text-gray-300 hover:text-white hover:bg-black/90 backdrop-blur-sm transition-colors"
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
