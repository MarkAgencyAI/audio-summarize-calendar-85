import { sendToWebhook } from "../webhook";
import { 
  TranscriptionOptions, 
  TranscriptionProgress, 
  TranscriptionResult,
  AudioChunk,
  TranscriptionApiResponse
} from "./types";
import { 
  getAudioDuration, 
  splitAudioIntoChunks,
  compressAudioBlob
} from "./audio-buffer-utils";
import { toast } from "sonner";

// URL constante del endpoint de GROQ
const GROQ_API_KEY = "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";
// URL del webhook por defecto
const DEFAULT_WEBHOOK_URL = "https://sswebhookss.maettiai.tech/webhook/8e34aca2-3111-488c-8ee8-a0a2c63fc9e4";

export class TranscriptionService {
  // Opciones por defecto
  private options: TranscriptionOptions = {
    maxChunkDuration: 60,      // 1 minuto en segundos (chunks más pequeños)
    speakerMode: 'single',
    optimizeForVoice: true,
    compressAudio: true,
    useTimeMarkers: true,
    retryAttempts: 3
  };

  constructor(options?: Partial<TranscriptionOptions>) {
    if (options) {
      // Mezclamos las opciones del usuario con los valores por defecto
      this.options = { 
        ...this.options, 
        ...options,
        // Aseguramos que maxChunkDuration no sea demasiado grande
        maxChunkDuration: options.maxChunkDuration && options.maxChunkDuration <= 300 
          ? options.maxChunkDuration 
          : 60
      };
    }
    
    console.log("TranscriptionService inicializado con opciones:", this.options);
  }

  /**
   * Procesa un archivo de audio para transcripción
   */
  async processAudio(
    audioBlob: Blob,
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<TranscriptionResult> {
    // Registrar tiempo de inicio para medir rendimiento
    const startTime = performance.now();
    
    try {
      // Notificar inicio
      this.notifyProgress("Iniciando procesamiento de audio...", 5, onProgress);
      
      // Validar que el audio existe y tiene contenido
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("El archivo de audio está vacío o no es válido");
      }
      
      console.log(`Procesando audio de ${(audioBlob.size / (1024 * 1024)).toFixed(2)} MB`);
      
      // Obtener duración del audio
      const audioDuration = await getAudioDuration(audioBlob);
      console.log(`Duración del audio: ${audioDuration.toFixed(2)} segundos`);
      
      // Umbral para considerar audio largo
      const LONG_AUDIO_THRESHOLD = 30; // 30 segundos
      
      if (audioDuration > LONG_AUDIO_THRESHOLD) {
        // Procesar audio largo por partes
        return await this.processLongAudio(audioBlob, audioDuration, onProgress);
      } else {
        // Para audio corto, procesarlo directamente
        this.notifyProgress("Transcribiendo audio...", 20, onProgress);
        
        // Optimizar el audio si está habilitado
        let processedAudio = audioBlob;
        if (this.options.compressAudio) {
          this.notifyProgress("Optimizando audio para transcripción...", 15, onProgress);
          processedAudio = await compressAudioBlob(audioBlob);
        }
        
        // Transcribir con sistema de reintentos
        const result = await this.transcribeWithRetry(processedAudio, onProgress);
        
        // Enviar al webhook
        if (result.transcript) {
          this.notifyProgress("Enviando transcripción al webhook...", 90, onProgress);
          try {
            const webhookResponse = await this.sendToWebhook(result.transcript);
            result.webhookResponse = webhookResponse;
          } catch (webhookError) {
            console.error("Error al enviar al webhook:", webhookError);
          }
        }
        
        // Agregar métricas de rendimiento
        const endTime = performance.now();
        result.duration = audioDuration;
        result.segmentCount = 1;
        result.processingTime = endTime - startTime;
        
        this.notifyProgress(result.transcript, 100, onProgress);
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error al procesar audio:", errorMessage);
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
    this.notifyProgress("Audio largo detectado. Preparando segmentación...", 10, onProgress);
    
    try {
      // Comprimir el audio completo antes de segmentar si está habilitado
      let processedAudio = audioBlob;
      if (this.options.compressAudio && this.options.optimizeForVoice) {
        this.notifyProgress("Optimizando audio para voz...", 12, onProgress);
        processedAudio = await compressAudioBlob(audioBlob, {
          targetSampleRate: 16000,  // 16kHz es óptimo para reconocimiento de voz
          targetChannels: 1         // Mono es suficiente para voz
        });
      }
      
      // Dividir el audio en chunks
      this.notifyProgress("Dividiendo audio en segmentos...", 15, onProgress);
      const chunks = await splitAudioIntoChunks(processedAudio, this.options.maxChunkDuration);
      
      this.notifyProgress(`Audio dividido en ${chunks.length} partes. Iniciando transcripción...`, 20, onProgress);
      
      // Variables para la transcripción completa
      let fullTranscript = "";
      let language = "es";
      let errors: string[] = [];
      
      // Transcribir cada parte secuencialmente para mejor control
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkNumber = i + 1;
        
        // Calcular progreso basado en las partes procesadas (20-90%)
        const progressBase = 20;
        const progressRange = 70;
        const chunkProgress = Math.floor(progressBase + (progressRange * (i / chunks.length)));
        
        this.notifyProgress(`Transcribiendo parte ${chunkNumber} de ${chunks.length}...`, chunkProgress, onProgress);
        
        try {
          console.log(`Iniciando transcripción de la parte ${chunkNumber}/${chunks.length}`);
          console.log(`- Tamaño: ${(chunk.blob.size / 1024).toFixed(2)} KB`);
          console.log(`- Tiempo: ${chunk.startTime.toFixed(2)}s - ${chunk.endTime.toFixed(2)}s`);
          
          // Verificar que el chunk es válido
          if (chunk.blob.size === 0) {
            throw new Error(`La parte ${chunkNumber} está vacía`);
          }
          
          // Agregar un pequeño retraso entre llamadas para evitar sobrecargar la API
          if (i > 0) {
            await new Promise(r => setTimeout(r, 500));
          }
          
          // Transcribir el segmento
          const segmentResult = await this.transcribeWithRetry(
            chunk.blob, 
            onProgress, 
            this.options.retryAttempts || 3,
            chunkNumber
          );
          
          // Guardar la transcripción en el chunk para referencia
          chunk.transcript = segmentResult.transcript;
          chunk.isProcessed = true;
          
          // Verificar resultados
          if (!segmentResult.transcript || segmentResult.transcript.trim() === "") {
            console.warn(`La parte ${chunkNumber} no generó texto`);
            chunk.error = "No se generó texto en esta parte";
            errors.push(`Parte ${chunkNumber}: No se generó texto`);
            continue;
          }
          
          // Añadir marca de tiempo si está habilitado
          if (this.options.useTimeMarkers) {
            const startMinutes = Math.floor(chunk.startTime / 60);
            const startSeconds = Math.floor(chunk.startTime % 60);
            const timeMarker = `${startMinutes}:${startSeconds.toString().padStart(2, '0')}`;
            
            // Añadir separador entre segmentos
            if (i > 0) {
              fullTranscript += `\n\n[${timeMarker}]\n`;
            }
          } else if (i > 0) {
            // Sin marcadores de tiempo, usar separador simple
            fullTranscript += '\n\n';
          }
          
          // Agregar la transcripción al texto completo
          fullTranscript += segmentResult.transcript;
          
          // Actualizar idioma si es necesario
          if (segmentResult.language) {
            language = segmentResult.language;
          }
          
          // Actualizar progreso con el texto acumulado
          this.notifyProgress(fullTranscript, chunkProgress, onProgress);
          
        } catch (error) {
          console.error(`Error al transcribir parte ${chunkNumber}:`, error);
          
          // Marcar el chunk como fallido
          chunk.isProcessed = false;
          chunk.error = error instanceof Error ? error.message : String(error);
          
          // Registrar el error pero continuar con el siguiente chunk
          const errorMsg = `Error en parte ${chunkNumber}: ${chunk.error}`;
          errors.push(errorMsg);
          
          // Añadir indicador de error en la transcripción
          if (this.options.useTimeMarkers) {
            const startMinutes = Math.floor(chunk.startTime / 60);
            const startSeconds = Math.floor(chunk.startTime % 60);
            const timeMarker = `${startMinutes}:${startSeconds.toString().padStart(2, '0')}`;
            
            fullTranscript += `\n\n[${timeMarker} - Error de transcripción]\n`;
          } else {
            fullTranscript += `\n\n[Error de transcripción en segmento ${chunkNumber}]\n`;
          }
          
          // Notificar error
          toast.error(`Error al transcribir parte ${chunkNumber}`);
          
          // Continuar con el siguiente chunk
          continue;
        }
      }
      
      // Verificar que tenemos alguna transcripción
      if (!fullTranscript.trim()) {
        throw new Error("No se pudo transcribir ninguna parte del audio");
      }
      
      // Limpiar y normalizar el texto final
      fullTranscript = this.normalizeTranscription(fullTranscript);
      
      // Enviar la transcripción completa al webhook
      let webhookResponse = null;
      this.notifyProgress("Enviando transcripción al webhook...", 90, onProgress);
      
      try {
        webhookResponse = await this.sendToWebhook(fullTranscript);
      } catch (webhookError) {
        console.error("Error al enviar al webhook:", webhookError);
        errors.push("Error al enviar al webhook: " + 
          (webhookError instanceof Error ? webhookError.message : String(webhookError)));
      }
      
      // Actualizar progreso final
      this.notifyProgress(fullTranscript, 100, onProgress);
      
      // Liberar URLs para evitar fugas de memoria
      chunks.forEach(chunk => {
        if (chunk.url) {
          URL.revokeObjectURL(chunk.url);
        }
      });
      
      // Calcular métricas finales
      const endTime = performance.now();
      
      return {
        transcript: fullTranscript,
        language,
        webhookResponse,
        errors: errors.length > 0 ? errors : undefined,
        duration,
        segmentCount: chunks.length,
        processingTime: endTime - performance.now()
      };
    } catch (error) {
      console.error("Error al procesar audio largo:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.notifyProgress(`Error en procesamiento: ${errorMessage}`, 0, onProgress);
      throw error;
    }
  }

  /**
   * Limpia y normaliza la transcripción
   */
  private normalizeTranscription(text: string): string {
    // Eliminar espacios y saltos de línea múltiples
    let normalized = text.replace(/\s+/g, ' ');
    
    // Normalizar marcadores de tiempo
    normalized = normalized.replace(/\[\s*(\d+):(\d+)\s*\]/g, '[$1:$2]');
    
    // Asegurar que hay espacio después de puntuación
    normalized = normalized.replace(/([.,:;!?])([^\s])/g, '$1 $2');
    
    // Capitalizar después de punto
    normalized = normalized.replace(/\.\s+([a-z])/g, (match, char) => '. ' + char.toUpperCase());
    
    // Eliminar espacios al inicio y final
    return normalized.trim();
  }

  /**
   * Método para transcribir con reintentos y backoff exponencial
   */
  private async transcribeWithRetry(
    audioBlob: Blob, 
    onProgress?: (progress: TranscriptionProgress) => void,
    maxAttempts: number = 3,
    chunkNumber?: number
  ): Promise<TranscriptionResult> {
    let attempts = 0;
    let lastError: Error | null = null;
    
    // Implementar backoff exponencial
    while (attempts < maxAttempts) {
      try {
        if (attempts > 0) {
          // Backoff exponencial: 2s, 4s, 8s...
          const backoffTime = Math.pow(2, attempts) * 1000; 
          console.log(`Reintento ${attempts + 1}/${maxAttempts} después de ${backoffTime/1000}s...`);
          
          const retryMessage = chunkNumber 
            ? `Reintentando parte ${chunkNumber} (intento ${attempts + 1}/${maxAttempts})...`
            : `Reintentando transcripción (intento ${attempts + 1}/${maxAttempts})...`;
            
          this.notifyProgress(retryMessage, 20 + (attempts * 10), onProgress);
          
          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
        
        // Intentar transcribir usando la API externa
        return await this.transcribeAudioChunk(audioBlob);
        
      } catch (error) {
        attempts++;
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Intento ${attempts}/${maxAttempts} fallido:`, error);
        
        // Si es el último intento, propagar el error
        if (attempts >= maxAttempts) {
          console.error("Se agotaron los reintentos:", lastError);
          throw lastError;
        }
      }
    }
    
    // No deberíamos llegar aquí por la lógica anterior, pero TypeScript lo requiere
    throw lastError || new Error("Error desconocido durante la transcripción");
  }

  /**
   * Transcribe un segmento de audio usando la API de GROQ
   */
  private async transcribeAudioChunk(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log(`Transcribiendo chunk de audio de ${(audioBlob.size / 1024).toFixed(2)} KB...`);
      
      // Verificar que el blob tiene datos
      if (audioBlob.size === 0) {
        throw new Error("El segmento de audio está vacío");
      }
      
      // Crear FormData para la API
      const formData = new FormData();
      
      // Determinar extensión y nombre de archivo
      const fileName = `audio_${Date.now()}.wav`;
      
      // Añadir el blob como archivo
      formData.append("file", audioBlob, fileName);
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("response_format", "verbose_json");
      formData.append("language", "es");
      
      // Crear prompt según el modo de oradores
      const prompt = this.options.speakerMode === 'single'
        ? `Esta es una grabación con un solo orador principal, enfócate en capturar claramente la voz predominante${this.options.subject ? ` sobre la materia ${this.options.subject}` : ''}.`
        : `Esta es una grabación con múltiples oradores, intenta distinguir entre las diferentes voces${this.options.subject ? ` que hablan sobre ${this.options.subject}` : ''}.`;
      
      formData.append("prompt", prompt);
      
      console.log(`Enviando solicitud a GROQ API para transcripción`);
      console.log(`- Modelo: whisper-large-v3-turbo`);
      console.log(`- Prompt: ${prompt}`);
      
      // Implementar timeout para evitar esperas infinitas
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 segundos timeout
      
      try {
        // Petición a la API con timeout
        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`
          },
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Verificar errores HTTP
        if (!response.ok) {
          let errorText: string;
          try {
            const errorJson = await response.json();
            errorText = JSON.stringify(errorJson);
          } catch {
            errorText = await response.text();
          }
          
          console.error(`Error de API (${response.status}): ${errorText}`);
          
          if (response.status === 413) {
            throw new Error("El archivo de audio es demasiado grande");
          } else if (response.status === 429) {
            throw new Error("Límite de tasa excedido en la API");
          } else if (response.status >= 500) {
            throw new Error(`Error del servidor (${response.status})`);
          } else {
            throw new Error(`Error: ${response.status} - ${errorText}`);
          }
        }
        
        // Parsear respuesta
        const data: TranscriptionApiResponse = await response.json();
        
        if (!data.text) {
          console.error("Respuesta sin texto:", data);
          throw new Error("Respuesta inválida de la API");
        }
        
        console.log("Transcripción exitosa:", data.text.slice(0, 50) + "...");
        
        return {
          transcript: data.text.trim(),
          language: data.language || "es"
        };
      } catch (fetchError) {
        // Manejar error de timeout específicamente
        if (fetchError.name === 'AbortError') {
          throw new Error("La solicitud excedió el tiempo límite (90 segundos)");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error en transcripción:", error);
      
      // Crear mensaje de error amigable
      let errorMessage = "Error desconocido";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          errorMessage = "Error de red al conectar con la API. Verifica tu conexión a Internet.";
        } else if (error.message.includes("API")) {
          errorMessage = `Error en la API: ${error.message}`;
        }
      }
      
      throw new Error(`Error de transcripción: ${errorMessage}`);
    }
  }

  /**
   * Envía la transcripción al webhook
   */
  private async sendToWebhook(transcript: string): Promise<any> {
    const webhookUrl = this.options.webhookUrl || DEFAULT_WEBHOOK_URL;
    const data = {
      transcript,
      subject: this.options.subject,
      speakerMode: this.options.speakerMode,
      timestamp: new Date().toISOString()
    };
    
    console.log("Enviando al webhook:", webhookUrl);
    
    try {
      return await sendToWebhook(webhookUrl, data);
    } catch (error) {
      console.error("Error enviando al webhook:", error);
      throw error;
    }
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
    
    // Emitir evento para que otros componentes puedan escucharlo
    const event = new CustomEvent('transcriptionProgress', {
      detail: { output, progress }
    });
    window.dispatchEvent(event);
  }
}
