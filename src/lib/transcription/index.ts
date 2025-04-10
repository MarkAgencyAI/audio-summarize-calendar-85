
/**
 * Exportaciones principales del módulo de transcripción
 */

// Exportar tipos
export type {
  TranscriptionOptions,
  TranscriptionProgress,
  TranscriptionResult,
  AudioChunk,
  TranscriptionApiResponse,
  WordTiming,
  Segment
} from './types';

// Exportar componentes y servicios
export { TranscriptionService } from './transcription-service';
export { useTranscription } from './use-transcription';

// Exportar utilitarios de audio específicamente
export { 
  getAudioDuration, 
  splitAudioIntoChunks, 
  compressAudioBlob 
} from './audio-buffer-utils';

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
    maxChunkDuration: options?.maxChunkDuration || 60, // 1 minuto por defecto
    speakerMode: options?.speakerMode || 'single',
    subject: options?.subject,
    webhookUrl: options?.webhookUrl,
    optimizeForVoice: true,
    compressAudio: true,
    useTimeMarkers: true
  });
  
  return service.processAudio(audioBlob, options?.onProgress);
}
