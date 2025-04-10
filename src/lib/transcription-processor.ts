
// Este archivo está obsoleto y ahora lo reemplazamos con la nueva arquitectura
// Re-exporta desde la estructura modularizada
import { processAudio } from './transcription';

export async function processAudioForTranscription(
  audioBlob: Blob,
  subject?: string,
  onTranscriptionProgress?: (data: any) => void,
  speakerMode: 'single' | 'multiple' = 'single'
) {
  // Utiliza la nueva implementación
  const { TranscriptionService } = await import('./transcription/transcription-service');
  
  const service = new TranscriptionService({
    maxChunkDuration: 420, // 7 minutos
    speakerMode,
    subject,
    webhookUrl: "https://sswebhookss.maettiai.tech/webhook/8e34aca2-3111-488c-8ee8-a0a2c63fc9e4"
  });
  
  return service.processAudio(audioBlob, onTranscriptionProgress);
}
