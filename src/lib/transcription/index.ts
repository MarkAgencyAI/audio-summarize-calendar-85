
// Main export file for the transcription module
export * from './types';
export * from './transcription-service';
export * from './use-transcription';
// Export audio-buffer-utils selectively to avoid the duplicate AudioChunk export
export { getAudioDuration, splitAudioIntoChunks, bufferToWav } from './audio-buffer-utils';

// Función conveniente para procesar audio directamente
export async function processAudio(
  audioBlob: Blob,
  options?: {
    subject?: string;
    speakerMode?: 'single' | 'multiple';
    maxChunkDuration?: number;
    webhookUrl?: string;
    onProgress?: (data: any) => void;
  }
) {
  const { TranscriptionService } = await import('./transcription-service');
  
  const service = new TranscriptionService({
    maxChunkDuration: options?.maxChunkDuration || 420, // 7 minutos por defecto
    speakerMode: options?.speakerMode || 'single',
    subject: options?.subject,
    webhookUrl: options?.webhookUrl
  });
  
  return service.processAudio(audioBlob, options?.onProgress);
}
