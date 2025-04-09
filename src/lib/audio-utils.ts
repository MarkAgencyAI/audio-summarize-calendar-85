
/**
 * Utility functions for audio processing
 */

/**
 * Get the duration of an audio file in seconds
 */
export async function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(audioBlob);
    
    audio.onloadedmetadata = () => {
      const duration = Math.floor(audio.duration);
      URL.revokeObjectURL(audio.src);
      resolve(duration);
    };
    
    audio.onerror = (error) => {
      URL.revokeObjectURL(audio.src);
      reject(error);
    };
  });
}

/**
 * Format time in seconds to MM:SS string
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
