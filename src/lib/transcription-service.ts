import { toast } from "sonner";
import React from 'react';

// Definimos las interfaces para nuestro servicio
interface TranscriptionOptions {
  maxChunkDuration: number; // en segundos
  speakerMode: 'single' | 'multiple';
  subject?: string;
}

interface TranscriptionProgress {
  output: string;
  progress: number;
}

interface TranscriptionResult {
  transcript: string;
  language?: string;
}

// URL constante del endpoint de GROQ
const GROQ_API_KEY = "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";

export class TranscriptionService {
  // Opciones por defecto
  private options: TranscriptionOptions = {
    maxChunkDuration: 600, // 10 minutos en segundos
    speakerMode: 'single'
  };

  constructor(options?: Partial<TranscriptionOptions>) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  /**
   * Procesa un archivo de audio para transcripción
   */
  async processAudio(
    audioBlob: Blob,
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<TranscriptionResult> {
    try {
      // Notificar inicio
      this.notifyProgress("Iniciando procesamiento de audio...", 5, onProgress);
      
      // Obtener duración del audio
      const audioDuration = await this.getAudioDuration(audioBlob);
      console.log(`Duración del audio: ${audioDuration} segundos`);
      
      if (audioDuration > this.options.maxChunkDuration) {
        // El audio es más largo de lo permitido, dividirlo
        return await this.processLongAudio(audioBlob, audioDuration, onProgress);
      } else {
        // El audio es corto, procesarlo directamente
        this.notifyProgress("Transcribiendo audio...", 20, onProgress);
        const result = await this.transcribeAudioChunk(audioBlob);
        this.notifyProgress(result.transcript, 100, onProgress);
        return result;
      }
    } catch (error) {
      console.error("Error al procesar audio:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.notifyProgress(`Error: ${errorMessage}`, 0, onProgress);
      throw error;
    }
  }

  /**
   * Procesa un audio largo dividiéndolo en partes
   */
  private async processLongAudio(
    audioBlob: Blob,
    duration: number,
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<TranscriptionResult> {
    this.notifyProgress("Audio largo detectado. Dividiendo en segmentos...", 10, onProgress);
    
    // Calcular el número de segmentos
    const numChunks = Math.ceil(duration / this.options.maxChunkDuration);
    const chunks = await this.splitAudio(audioBlob, numChunks);
    
    this.notifyProgress(`Audio dividido en ${chunks.length} partes. Iniciando transcripción...`, 20, onProgress);
    
    // Transcribir cada parte secuencialmente
    let fullTranscript = "";
    let language = "es";
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkNumber = i + 1;
      
      // Calcular progreso basado en las partes procesadas (20-90%)
      const chunkProgress = Math.floor(20 + (70 * (i / chunks.length)));
      this.notifyProgress(`Transcribiendo parte ${chunkNumber} de ${chunks.length}...`, chunkProgress, onProgress);
      
      try {
        const result = await this.transcribeAudioChunk(chunk.blob);
        
        // Añadir marca de tiempo y agregar a la transcripción completa
        const startMinutes = Math.floor(chunk.startTime / 60);
        const startSeconds = Math.floor(chunk.startTime % 60);
        const timeMarker = `${startMinutes}:${startSeconds.toString().padStart(2, '0')}`;
        
        if (i > 0) {
          fullTranscript += `\n\n[Continuación - ${timeMarker}]\n`;
        }
        
        fullTranscript += result.transcript;
        language = result.language || language;
        
        // Actualizar progreso con la transcripción acumulada
        this.notifyProgress(fullTranscript, chunkProgress, onProgress);
      } catch (error) {
        console.error(`Error al transcribir parte ${chunkNumber}:`, error);
        fullTranscript += `\n\n[Error en parte ${chunkNumber} - No se pudo transcribir]\n`;
        this.notifyProgress(fullTranscript, chunkProgress, onProgress);
      }
    }
    
    this.notifyProgress(fullTranscript, 100, onProgress);
    
    return {
      transcript: fullTranscript,
      language
    };
  }

  /**
   * Divide un blob de audio en múltiples partes
   */
  private async splitAudio(audioBlob: Blob, numChunks: number): Promise<Array<{blob: Blob, startTime: number, endTime: number}>> {
    try {
      // Convertir blob a AudioBuffer para procesamiento
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const duration = audioBuffer.duration;
      const chunkDuration = duration / numChunks;
      const chunks: Array<{blob: Blob, startTime: number, endTime: number}> = [];
      
      // Crear cada segmento
      for (let i = 0; i < numChunks; i++) {
        const startTime = i * chunkDuration;
        const endTime = Math.min((i + 1) * chunkDuration, duration);
        const chunkSeconds = endTime - startTime;
        
        // Crear un nuevo buffer para este segmento
        const chunkBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          Math.ceil(chunkSeconds * audioBuffer.sampleRate),
          audioBuffer.sampleRate
        );
        
        // Copiar los datos para cada canal
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const channelData = new Float32Array(chunkBuffer.length);
          audioBuffer.copyFromChannel(channelData, channel, Math.floor(startTime * audioBuffer.sampleRate));
          chunkBuffer.copyToChannel(channelData, channel, 0);
        }
        
        // Convertir el buffer a blob
        const chunkBlob = await this.audioBufferToBlob(chunkBuffer, audioBlob.type);
        
        chunks.push({
          blob: chunkBlob,
          startTime: startTime,
          endTime: endTime
        });
      }
      
      return chunks;
    } catch (error) {
      console.error("Error al dividir el audio:", error);
      // Si falla la división, devolver un solo chunk con el audio original
      return [{
        blob: audioBlob,
        startTime: 0,
        endTime: await this.getAudioDuration(audioBlob)
      }];
    }
  }
  
  /**
   * Convierte un AudioBuffer a Blob
   */
  private async audioBufferToBlob(buffer: AudioBuffer, mimeType: string): Promise<Blob> {
    return new Promise((resolve) => {
      // Crear un offline context para renderizar el audio
      const offlineContext = new OfflineAudioContext(
        buffer.numberOfChannels,
        buffer.length,
        buffer.sampleRate
      );
      
      // Crear una fuente desde el buffer
      const source = offlineContext.createBufferSource();
      source.buffer = buffer;
      source.connect(offlineContext.destination);
      source.start(0);
      
      // Renderizar el audio
      offlineContext.startRendering().then(renderedBuffer => {
        // Convertir el buffer renderizado a WAV
        const wavBlob = this.bufferToWave(renderedBuffer, 0, renderedBuffer.length);
        resolve(new Blob([wavBlob], { type: mimeType || 'audio/wav' }));
      });
    });
  }
  
  /**
   * Convierte un buffer a formato WAV
   */
  private bufferToWave(buffer: AudioBuffer, start: number, end: number): ArrayBuffer {
    const numOfChan = buffer.numberOfChannels;
    const length = (end - start) * numOfChan * 2 + 44;
    const result = new ArrayBuffer(length);
    const view = new DataView(result);
    
    // RIFF chunk descriptor
    this.writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true);
    this.writeUTFBytes(view, 8, 'WAVE');
    
    // FMT sub-chunk
    this.writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // subchunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numOfChan, true); // # channels
    view.setUint32(24, buffer.sampleRate, true); // sample rate
    view.setUint32(28, buffer.sampleRate * numOfChan * 2, true); // byte rate
    view.setUint16(32, numOfChan * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    
    // Data sub-chunk
    this.writeUTFBytes(view, 36, 'data');
    view.setUint32(40, length - 44, true);
    
    // Write the PCM samples
    const data = new Float32Array(buffer.length * numOfChan);
    let offset = 44;
    
    // Interleave channels
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const channelData = buffer.getChannelData(i);
      for (let j = 0; j < channelData.length; j++) {
        // Scale to 16-bit signed int
        let sample = Math.max(-1, Math.min(1, channelData[j]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }
    
    return result;
  }
  
  private writeUTFBytes(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Transcribe un segmento de audio usando la API de GROQ
   */
  private async transcribeAudioChunk(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      // Crear un FormData para la API
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("response_format", "verbose_json");
      formData.append("language", "es");
      
      // Crear un prompt basado en el modo de oradores
      const prompt = this.options.speakerMode === 'single'
        ? `Esta es una grabación con un solo orador principal, enfócate en capturar claramente la voz predominante${this.options.subject ? ` sobre la materia ${this.options.subject}` : ''}.`
        : `Esta es una grabación con múltiples oradores, intenta distinguir entre las diferentes voces${this.options.subject ? ` que hablan sobre ${this.options.subject}` : ''}.`;
      
      formData.append("prompt", prompt);
      
      // Hacer la petición a la API de GROQ
      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error de API: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.text) {
        throw new Error("Respuesta inválida de la API de GROQ");
      }
      
      return {
        transcript: data.text.trim(),
        language: data.language || "es"
      };
    } catch (error) {
      console.error("Error en transcripción:", error);
      throw error;
    }
  }

  /**
   * Obtiene la duración en segundos de un blob de audio
   */
  private async getAudioDuration(audioBlob: Blob): Promise<number> {
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
   * Notifica el progreso de la transcripción
   */
  private notifyProgress(
    output: string,
    progress: number,
    callback?: (progress: TranscriptionProgress) => void
  ): void {
    if (callback) {
      callback({ output, progress });
    }
    
    // También emitir un evento para que otros componentes puedan escucharlo
    const event = new CustomEvent('transcriptionProgress', {
      detail: { output, progress }
    });
    window.dispatchEvent(event);
  }
}

// Hook personalizado para usar el servicio de transcripción en componentes de React
export function useTranscription(options?: Partial<TranscriptionOptions>) {
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [transcript, setTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  
  const transcriptionService = React.useMemo(() => {
    return new TranscriptionService(options);
  }, [options]);
  
  /**
   * Transcribe un archivo de audio
   */
  const transcribeAudio = React.useCallback(async (audioBlob: Blob) => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    setProgress(0);
    setError(null);
    
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
      
      // Notificar que terminó la transcripción
      const completeEvent = new CustomEvent('audioRecorderMessage', {
        detail: {
          type: 'transcriptionComplete',
          data: { output: result.transcript, progress: 100 }
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
    error
  };
}
