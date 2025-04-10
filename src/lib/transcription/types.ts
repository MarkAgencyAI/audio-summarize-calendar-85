
/**
 * Tipos para el módulo de transcripción
 */

/**
 * Opciones para el servicio de transcripción
 */
export interface TranscriptionOptions {
  maxChunkDuration: number;
  speakerMode: 'single' | 'multiple';
  subject?: string;
  webhookUrl?: string;
}

/**
 * Información de progreso de la transcripción
 */
export interface TranscriptionProgress {
  output: string;
  progress: number;
}

/**
 * Resultado de la transcripción
 */
export interface TranscriptionResult {
  transcript: string;
  language?: string;
  webhookResponse?: any;
  errors?: string[];
}

/**
 * Segmento de audio
 */
export interface AudioChunk {
  blob: Blob;
  startTime: number;
  endTime: number;
  url: string; // URL para acceder al segmento
}
