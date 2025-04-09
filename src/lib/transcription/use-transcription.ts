
import React from 'react';
import { toast } from "sonner";
import { TranscriptionService } from './transcription-service';
import { TranscriptionOptions, TranscriptionResult } from './types';

/**
 * Hook personalizado para usar el servicio de transcripción en componentes de React
 */
export function useTranscription(options?: Partial<TranscriptionOptions>) {
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [transcript, setTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);
  
  const transcriptionService = React.useMemo(() => {
    // Asegurarnos de que maxChunkDuration no exceda los 7 minutos
    const safeOptions = options ? {
      ...options,
      maxChunkDuration: options.maxChunkDuration && options.maxChunkDuration <= 420
        ? options.maxChunkDuration
        : 420
    } : { maxChunkDuration: 420 };
    
    return new TranscriptionService(safeOptions);
  }, [options]);
  
  /**
   * Transcribe un archivo de audio
   */
  const transcribeAudio = React.useCallback(async (audioBlob: Blob) => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    setProgress(0);
    setError(null);
    setErrors([]);
    
    try {
      // Notificar que comienza la transcripción
      const startEvent = new CustomEvent('audioRecorderMessage', {
        detail: {
          type: 'transcriptionStarted',
          data: { output: "Iniciando transcripción...", progress: 0 }
        }
      });
      window.dispatchEvent(startEvent);
      
      // Procesar el audio
      const result = await transcriptionService.processAudio(audioBlob, (progressData) => {
        setProgress(progressData.progress);
        setTranscript(progressData.output);
        
        // Emitir evento para actualizar otros componentes
        const updateEvent = new CustomEvent('audioRecorderMessage', {
          detail: {
            type: 'transcriptionUpdate',
            data: progressData
          }
        });
        window.dispatchEvent(updateEvent);
      });
      
      // Guardar errores si los hay
      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors);
        // Mostrar toast para cada error
        result.errors.forEach(err => {
          toast.error(err);
        });
      }
      
      // Notificar que terminó la transcripción
      const completeEvent = new CustomEvent('audioRecorderMessage', {
        detail: {
          type: 'transcriptionComplete',
          data: { 
            output: result.transcript, 
            progress: 100,
            webhookResponse: result.webhookResponse,
            errors: result.errors
          }
        }
      });
      window.dispatchEvent(completeEvent);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      
      // Notificar el error
      const errorEvent = new CustomEvent('audioRecorderMessage', {
        detail: {
          type: 'transcriptionError',
          data: { output: `Error: ${errorMessage}`, progress: 0 }
        }
      });
      window.dispatchEvent(errorEvent);
      
      throw err;
    } finally {
      setIsTranscribing(false);
    }
  }, [transcriptionService]);
  
  return {
    transcribeAudio,
    isTranscribing,
    progress,
    transcript,
    error,
    errors
  };
}
