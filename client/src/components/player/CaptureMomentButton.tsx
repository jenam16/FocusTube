import React, { useState } from 'react';
import { Camera, Loader2, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { noteService } from '../../services';
import { capturePlayerScreen, formatVideoTime } from '../../utils';

interface CaptureMomentButtonProps {
  courseId: string;
  videoId: string;
  youtubeVideoId: string;
  videoTitle?: string;
  getCurrentTimestamp: () => number;
  playerElement?: HTMLElement | null;
  videoElement?: HTMLElement | null;
  hideElements?: Array<HTMLElement | null | undefined>;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'toolbar' | 'overlay';
  onSuccess?: (timestampSeconds: number) => void;
}

export const CaptureMomentButton: React.FC<CaptureMomentButtonProps> = ({
  courseId,
  videoId,
  youtubeVideoId,
  videoTitle,
  getCurrentTimestamp,
  playerElement,
  videoElement,
  hideElements = [],
  className = '',
  size = 'md',
  variant = 'toolbar',
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'idle' | 'capturing' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isBusy = status === 'capturing' || status === 'uploading';

  const handleCapture = async () => {
    if (isBusy) return;

    setStatus('capturing');
    setErrorMessage(null);

    try {
      const timestampSeconds = Math.max(0, Math.floor(getCurrentTimestamp()));

      // 1. Capture and crop video frame (stripping UI and letterbox bars)
      const base64Image = await capturePlayerScreen({
        playerElement,
        videoElement,
        hideElements,
      });

      if (!base64Image) {
        setStatus('idle');
        return;
      }

      setStatus('uploading');

      // 2. Format timestamp for title using centralized formatVideoTime
      const formattedTime = formatVideoTime(timestampSeconds);

      const title = videoTitle
        ? `${videoTitle} — ${formattedTime}`
        : `Snapshot at ${formattedTime}`;

      // 3. Upload to Cloudinary via backend API
      await noteService.createScreenshotNote({
        courseId,
        videoId,
        youtubeVideoId,
        timestampSeconds,
        imageBase64: base64Image,
        title,
        content: '',
      });

      // 4. Invalidate notes caches
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['all-notes'] });

      setStatus('success');
      onSuccess?.(timestampSeconds);

      setTimeout(() => {
        setStatus('idle');
      }, 2500);
    } catch (err: unknown) {
      console.error('Failed to capture screenshot moment:', err);
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to capture screenshot.'
      );
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage(null);
      }, 3500);
    }
  };

  const isSmall = size === 'sm';
  const isOverlay = variant === 'overlay';

  const getButtonStyles = () => {
    if (isOverlay) {
      if (status === 'success') {
        return 'border-emerald-500/50 bg-emerald-950/85 text-emerald-300 shadow-emerald-500/20';
      }
      if (status === 'error') {
        return 'border-rose-500/50 bg-rose-950/85 text-rose-300 shadow-rose-500/20';
      }
      if (isBusy) {
        return 'border-indigo-500/50 bg-gray-950/90 text-indigo-300 shadow-indigo-500/20';
      }
      return 'border-white/20 bg-black/75 text-white hover:bg-black/90 hover:border-white/35 backdrop-blur-md shadow-lg shadow-black/50';
    }

    // Default toolbar style
    if (status === 'success') {
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300';
    }
    if (status === 'error') {
      return 'border-rose-500/40 bg-rose-500/15 text-rose-300';
    }
    return 'border-white/[0.08] bg-[#111827] text-slate-200 hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300';
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleCapture}
        disabled={isBusy}
        aria-label="Capture video moment"
        title="Capture moment from video"
        className={`inline-flex items-center gap-1.5 rounded-xl border font-medium transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed ${getButtonStyles()} ${
          isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
        } ${className}`}
      >
        {status === 'capturing' && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            <span>Capturing...</span>
          </>
        )}

        {status === 'uploading' && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            <span>Saving...</span>
          </>
        )}

        {status === 'success' && (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Saved!</span>
          </>
        )}

        {status === 'error' && (
          <>
            <Camera className="h-3.5 w-3.5 text-rose-400" />
            <span>Failed</span>
          </>
        )}

        {status === 'idle' && (
          <>
            <Camera className={`h-3.5 w-3.5 ${isOverlay ? 'text-indigo-300' : 'text-indigo-400'}`} />
            <span>Capture Moment</span>
          </>
        )}
      </button>

      {/* Floating error tooltip */}
      {errorMessage && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-40 whitespace-nowrap rounded-lg border border-rose-500/30 bg-gray-900/95 backdrop-blur-sm px-2.5 py-1 text-[11px] text-rose-300 shadow-xl">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
