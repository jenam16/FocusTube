/**
 * Safe Browser Screen Capture utility for FocusTube.
 * Uses navigator.mediaDevices.getDisplayMedia to capture a single still frame,
 * crops strictly to the actual 16:9 video frame area (excluding all FocusTube
 * sidebars, headers, browser chrome, taskbars, and letterbox bars),
 * resizes to max width 1280px (preserving aspect ratio), compresses to WebP (or JPEG fallback),
 * and immediately stops all MediaStream tracks.
 */

export interface CaptureOptions {
  playerElement?: HTMLElement | null;
  videoElement?: HTMLElement | null;
  hideElements?: Array<HTMLElement | null | undefined>;
  maxWidth?: number;
  quality?: number;
}

export interface CropRegion {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
}

export class ScreenCaptureError extends Error {
  isCancelled: boolean;
  constructor(message: string, isCancelled = false) {
    super(message);
    this.name = 'ScreenCaptureError';
    this.isCancelled = isCancelled;
  }
}

const TARGET_ASPECT = 16 / 9; // YouTube standard 16:9 ratio (~1.77778)

/**
 * Calculates the exact source coordinates to crop only the 16:9 YouTube video frame.
 */
export function calculateVideoCropRegion(
  streamWidth: number,
  streamHeight: number,
  targetElement?: HTMLElement | null
): CropRegion {
  const isFullscreen = Boolean(document.fullscreenElement);
  const streamAspect = streamWidth / streamHeight;

  // 1. If currently in Fullscreen mode:
  // The stream represents the fullscreen display.
  // We compute the exact 16:9 video frame, stripping any letterbox/pillarbox bars.
  if (isFullscreen) {
    if (targetElement && typeof targetElement.getBoundingClientRect === 'function') {
      const rect = targetElement.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      if (rect.width > 50 && rect.height > 50 && winW > 0 && winH > 0) {
        const scaleX = streamWidth / winW;
        const scaleY = streamHeight / winH;

        const cropX = Math.max(0, Math.round(rect.left * scaleX));
        const cropY = Math.max(0, Math.round(rect.top * scaleY));
        const cropW = Math.min(streamWidth - cropX, Math.round(rect.width * scaleX));
        const cropH = Math.min(streamHeight - cropY, Math.round(rect.height * scaleY));

        const rectAspect = cropW / cropH;
        // If element aspect ratio is close to 16:9, use its exact position
        if (rectAspect >= 1.7 && rectAspect <= 1.85 && cropW > 100 && cropH > 100) {
          return {
            sourceX: cropX,
            sourceY: cropY,
            sourceWidth: cropW,
            sourceHeight: cropH,
          };
        }
      }
    }

    // Geometry calculation for letterboxing/pillarboxing in fullscreen
    if (streamAspect > TARGET_ASPECT + 0.01) {
      // Screen is wider than 16:9 (e.g. 21:9 ultrawide) -> pillarbox bars on left/right
      const actualWidth = Math.round(streamHeight * TARGET_ASPECT);
      const actualX = Math.round((streamWidth - actualWidth) / 2);
      return {
        sourceX: Math.max(0, actualX),
        sourceY: 0,
        sourceWidth: Math.min(streamWidth, actualWidth),
        sourceHeight: streamHeight,
      };
    } else if (streamAspect < TARGET_ASPECT - 0.01) {
      // Screen is taller than 16:9 (e.g. 16:10 laptop screen or 3:2) -> letterbox bars on top/bottom
      const actualHeight = Math.round(streamWidth / TARGET_ASPECT);
      const actualY = Math.round((streamHeight - actualHeight) / 2);
      return {
        sourceX: 0,
        sourceY: Math.max(0, actualY),
        sourceWidth: streamWidth,
        sourceHeight: Math.min(streamHeight, actualHeight),
      };
    }

    // Stream is already 16:9 (e.g. 1920x1080, 2560x1440, 3840x2160)
    return {
      sourceX: 0,
      sourceY: 0,
      sourceWidth: streamWidth,
      sourceHeight: streamHeight,
    };
  }

  // 2. If NOT in fullscreen (e.g. standard page view):
  if (targetElement && typeof targetElement.getBoundingClientRect === 'function') {
    const rect = targetElement.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (
      rect.width > 50 &&
      rect.height > 50 &&
      windowWidth > 0 &&
      windowHeight > 0
    ) {
      const scaleX = streamWidth / windowWidth;
      const scaleY = streamHeight / windowHeight;

      // Check if scales match plausible tab or window capture
      if (Math.abs(scaleX - scaleY) < 0.35 && scaleX >= 0.6 && scaleX <= 4) {
        let cropX = Math.round(rect.left * scaleX);
        let cropY = Math.round(rect.top * scaleY);
        let cropW = Math.round(rect.width * scaleX);
        let cropH = Math.round(rect.height * scaleY);

        // Enforce 16:9 ratio to ensure no outside UI gets included
        const intendedH = Math.round(cropW / TARGET_ASPECT);
        if (Math.abs(cropH - intendedH) > 4 && intendedH > 50) {
          cropY += Math.round((cropH - intendedH) / 2);
          cropH = intendedH;
        }

        cropX = Math.max(0, Math.min(cropX, streamWidth - 50));
        cropY = Math.max(0, Math.min(cropY, streamHeight - 50));
        cropW = Math.min(cropW, streamWidth - cropX);
        cropH = Math.min(cropH, streamHeight - cropY);

        if (cropW > 100 && cropH > 50) {
          return {
            sourceX: cropX,
            sourceY: cropY,
            sourceWidth: cropW,
            sourceHeight: cropH,
          };
        }
      }
    }
  }

  // 3. Fallback: Center 16:9 region of the stream to guarantee zero browser/taskbar chrome
  if (streamAspect > TARGET_ASPECT) {
    const cropW = Math.round(streamHeight * TARGET_ASPECT);
    const cropX = Math.round((streamWidth - cropW) / 2);
    return {
      sourceX: Math.max(0, cropX),
      sourceY: 0,
      sourceWidth: Math.min(cropW, streamWidth),
      sourceHeight: streamHeight,
    };
  } else {
    const cropH = Math.round(streamWidth / TARGET_ASPECT);
    const cropY = Math.round((streamHeight - cropH) / 2);
    return {
      sourceX: 0,
      sourceY: Math.max(0, cropY),
      sourceWidth: streamWidth,
      sourceHeight: Math.min(cropH, streamHeight),
    };
  }
}

export const capturePlayerScreen = async (
  options: CaptureOptions = {}
): Promise<string> => {
  const {
    playerElement,
    videoElement,
    hideElements = [],
    maxWidth = 1280,
    quality = 0.80,
  } = options;

  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new ScreenCaptureError(
      'Screenshot capture is not supported in this browser.',
      false
    );
  }

  // Temporarily hide elements (e.g. capture buttons or overlay controls)
  // so they do not appear in the saved screenshot
  const elementsToRestore: Array<{ el: HTMLElement; prevOpacity: string; prevVisibility: string }> = [];
  const hideOverlays = () => {
    hideElements.forEach((el) => {
      if (el && el instanceof HTMLElement) {
        elementsToRestore.push({
          el,
          prevOpacity: el.style.opacity,
          prevVisibility: el.style.visibility,
        });
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
      }
    });
  };

  const restoreOverlays = () => {
    elementsToRestore.forEach(({ el, prevOpacity, prevVisibility }) => {
      try {
        el.style.opacity = prevOpacity;
        el.style.visibility = prevVisibility;
      } catch {
        // ignore
      }
    });
    elementsToRestore.length = 0;
  };

  let stream: MediaStream | null = null;
  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;

  try {
    // Hide overlay controls during screen capture dialog & capture
    hideOverlays();

    // Request screen/tab capture
    // Prefer current tab in Chromium browsers when supported
    const displayMediaOptions = {
      video: {
        displaySurface: 'browser',
      },
      audio: false,
      preferCurrentTab: true,
    } as DisplayMediaStreamOptions;

    stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
  } catch (err: unknown) {
    restoreOverlays();
    if (
      err instanceof DOMException &&
      (err.name === 'NotAllowedError' || err.name === 'AbortError')
    ) {
      throw new ScreenCaptureError('Screenshot capture cancelled.', true);
    }
    throw new ScreenCaptureError(
      err instanceof Error ? err.message : 'Failed to start screen capture',
      false
    );
  }

  try {
    video.srcObject = stream;

    // Wait until video has loaded metadata and is ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Screen capture stream timed out'));
      }, 8000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        video.play().then(resolve).catch(reject);
      };
      video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to play capture video stream'));
      };
    });

    // Brief settling delay for single frame stabilization
    await new Promise((r) => setTimeout(r, 100));

    const streamWidth = video.videoWidth;
    const streamHeight = video.videoHeight;

    if (!streamWidth || !streamHeight) {
      throw new ScreenCaptureError('Invalid video stream frame dimensions', false);
    }

    // Determine precise 16:9 video-only cropping area
    const targetEl = videoElement || playerElement;
    const { sourceX, sourceY, sourceWidth, sourceHeight } = calculateVideoCropRegion(
      streamWidth,
      streamHeight,
      targetEl
    );

    // Calculate final canvas dimensions (max 1280px width, preserving aspect ratio)
    let destWidth = sourceWidth;
    let destHeight = sourceHeight;

    if (destWidth > maxWidth) {
      destHeight = Math.round((destHeight * maxWidth) / destWidth);
      destWidth = maxWidth;
    }

    const canvas = document.createElement('canvas');
    canvas.width = destWidth;
    canvas.height = destHeight;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new ScreenCaptureError('Failed to initialize 2D rendering canvas', false);
    }

    // Draw the cropped video frame
    ctx.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      destWidth,
      destHeight
    );

    // Compress to WebP with JPEG fallback
    let dataUrl = canvas.toDataURL('image/webp', quality);
    if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    return dataUrl;
  } finally {
    // Restore any hidden overlay elements
    restoreOverlays();

    // Immediate and mandatory cleanup of all MediaStream tracks and video element
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
    }
    video.srcObject = null;
    video.remove();
  }
};
