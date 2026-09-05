/**
 * Global Media Stream Registry & Cleanup Manager
 * Guarantees all microphone, camera, and screen sharing hardware streams
 * are strictly stopped and released from browser resources upon call end,
 * voice channel disconnect, user logout, or route transition.
 */

const activeStreams = new Set<MediaStream>();

/**
 * Registers a MediaStream to be tracked globally.
 */
export function registerMediaStream(stream: MediaStream | null | undefined): MediaStream | null {
  if (!stream) return null;
  activeStreams.add(stream);

  // Auto unregister when all tracks end
  stream.getTracks().forEach((track) => {
    track.addEventListener('ended', () => {
      if (stream.getTracks().every((t) => t.readyState === 'ended')) {
        activeStreams.delete(stream);
      }
    });
  });

  return stream;
}

/**
 * Immediately stops all tracks of a given MediaStream and unregisters it.
 */
export function unregisterMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    try {
      track.stop();
      track.enabled = false;
    } catch {}
  });
  activeStreams.delete(stream);
}

/**
 * Force-stops every single active MediaStream across the entire application.
 * Immediately turns off browser microphone/camera recording indicators.
 */
export function stopAllMediaStreams(): void {
  activeStreams.forEach((stream) => {
    try {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch {}
      });
    } catch {}
  });
  activeStreams.clear();
}

// Automatically cleanup hardware devices if browser tab or window closes
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stopAllMediaStreams();
  });
}
