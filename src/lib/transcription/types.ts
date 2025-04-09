
// Shared type definitions for transcription service
export interface TranscriptionOptions {
  maxChunkDuration: number; // en segundos
  speakerMode: 'single' | 'multiple';
  subject?: string;
  webhookUrl?: string;
}

export interface TranscriptionProgress {
  output: string;
  progress: number;
}

export interface TranscriptionResult {
  transcript: string;
  language?: string;
  webhookResponse?: any;
  errors?: string[];
}

export interface AudioChunk {
  blob: Blob;
  startTime: number;
  endTime: number;
}
