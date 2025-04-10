
import { toast } from "sonner";
import { sendToWebhook } from "../webhook";
import { 
  TranscriptionOptions, 
  TranscriptionProgress, 
  TranscriptionResult,
  AudioChunk
} from "./types";
import { 
  getAudioDuration, 
  splitAudioIntoChunks 
} from "./audio-buffer-utils";

// URL constante del endpoint de GROQ
const GROQ_API_KEY = "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";
// URL del webhook por defecto
const DEFAULT_WEBHOOK_URL = "https://sswebhookss.maettiai.tech/webhook/8e34aca2-3111-488c-8ee8-a0a2c63fc9e4";

export class TranscriptionService {
  // Opciones por defecto con límite de 7 minutos
  private options: TranscriptionOptions = {
    maxChunkDuration: 420, // 7 minutos en segundos
    speakerMode: 'single'
  };

  constructor(options?: Partial<TranscriptionOptions>) {
    if (options) {
      // Aseguramos que si se pasa maxChunkDuration, no exceda los 7 minutos
      const maxDuration = options.maxChunkDuration && options.maxChunkDuration <= 420 
        ? options.maxChunkDuration 
        : 420;
      
      this.options = { 
        ...this.options, 
        ...options,
        maxChunkDuration: maxDuration
      };
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
      const audioDuration = await getAudioDuration(audioBlob);
      console.log(`Duración del audio: ${audioDuration.toFixed(2)} segundos`);
      
      // Comprobar si el audio es demasiado largo
      const MAX_DURATION_THRESHOLD = 600; // 10 minutos
      
      if (audioDuration > MAX_DURATION_THRESHOLD) {
        // Audio largo, procesarlo por partes
        return await this.processLongAudio(audioBlob, audioDuration, onProgress);
      } else {
        // Audio corto, procesarlo directamente
        this.notifyProgress("Transcribiendo audio...", 20, onProgress);
        
        // Sistema de reintentos
        return await this.transcribeWithRetry(audioBlob, onProgress);
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
    
    try {
      // Dividir el audio en chunks
      const chunks = await splitAudioIntoChunks(audioBlob, this.options.maxChunkDuration);
      
      this.notifyProgress(`Audio dividido en ${chunks.length} partes. Iniciando transcripción...`, 20, onProgress);
      
      // Transcribir cada parte secuencialmente
      let fullTranscript = "";
      let language = "es";
      let errors: string[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkNumber = i + 1;
        
        // Calcular progreso basado en las partes procesadas (20-90%)
        const chunkProgress = Math.floor(20 + (70 * (i / chunks.length)));
        this.notifyProgress(`Transcribiendo parte ${chunkNumber} de ${chunks.length}...`, chunkProgress, onProgress);
        
        try {
          console.log(`Iniciando transcripción de la parte ${chunkNumber}/${chunks.length}`);
          console.log(`- URL de la parte: ${chunk.url}`);
          console.log(`- Tamaño: ${(chunk.blob.size / 1024).toFixed(2)} KB`);
          console.log(`- Inicio: ${chunk.startTime.toFixed(2)}s, Fin: ${chunk.endTime.toFixed(2)}s`);
          
          // Verificar que el chunk es válido
          if (chunk.blob.size === 0) {
            throw new Error(`La parte ${chunkNumber} tiene tamaño 0, no se puede transcribir`);
          }
          
          // Transcribir el chunk con sistema de reintentos
          const result = await this.transcribeWithRetry(chunk.blob, onProgress, 3, chunkNumber);
          
          // Verificar que obtuvimos una transcripción
          if (!result.transcript || result.transcript.trim() === "") {
            console.warn(`La parte ${chunkNumber} no generó texto en la transcripción`);
          } else {
            console.log(`Transcripción de parte ${chunkNumber} completada: ${result.transcript.substring(0, 50)}...`);
          }
          
          // Añadir marca de tiempo y agregar a la transcripción completa
          const startMinutes = Math.floor(chunk.startTime / 60);
          const startSeconds = Math.floor(chunk.startTime % 60);
          const timeMarker = `${startMinutes}:${startSeconds.toString().padStart(2, '0')}`;
          
          if (i > 0) {
            fullTranscript += `\n\n[Continuación - ${timeMarker}]\n`;
          }
          
          fullTranscript += result.transcript;
          language = result.language || language;
          
          // Actualizar progreso con el texto acumulado
          this.notifyProgress(fullTranscript, chunkProgress, onProgress);
          
          // Pausa entre chunks para no sobrecargar la API
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error al transcribir parte ${chunkNumber}:`, error);
          
          // Registrar el error y continuar con el siguiente chunk
          const errorMsg = `Error en parte ${chunkNumber}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          
          // Añadir mensaje de error en la transcripción
          fullTranscript += `\n\n[${errorMsg}]\n`;
          this.notifyProgress(fullTranscript, chunkProgress, onProgress);
          
          // Mostrar toast
          toast.error(`Falló la transcripción de la parte ${chunkNumber}`);
          
          // Continuar con el siguiente chunk
          continue;
        }
      }
      
      // Comprobar si tenemos algo de transcripción
      if (!fullTranscript.trim()) {
        throw new Error("No se pudo transcribir ninguna parte del audio");
      }
      
      // Enviar la transcripción completa al webhook
      let webhookResponse = null;
      this.notifyProgress("Enviando transcripción completa al webhook...", 90, onProgress);
      
      try {
        webhookResponse = await this.sendToWebhook(fullTranscript);
      } catch (webhookError) {
        console.error("Error al enviar al webhook:", webhookError);
        errors.push("Error al enviar al webhook: " + (webhookError instanceof Error ? webhookError.message : String(webhookError)));
      }
      
      this.notifyProgress(fullTranscript, 100, onProgress);
      
      // Liberar URLs
      chunks.forEach(chunk => {
        if (chunk.url) {
          URL.revokeObjectURL(chunk.url);
        }
      });
      
      return {
        transcript: fullTranscript,
        language,
        webhookResponse,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error("Error al procesar audio largo:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.notifyProgress(`Error en audio largo: ${errorMessage}`, 0, onProgress);
      throw error;
    }
  }

  /**
   * Método que implementa reintentos con backoff exponencial
   */
  private async transcribeWithRetry(
    audioBlob: Blob, 
    onProgress?: (progress: TranscriptionProgress) => void,
    maxAttempts: number = 3,
    chunkNumber?: number
  ): Promise<TranscriptionResult> {
    let attempts = 0;
    let lastError: Error | null = null;
    
    while (attempts < maxAttempts) {
      try {
        if (attempts > 0) {
          const backoffTime = Math.pow(2, attempts) * 1000; // Backoff exponencial: 2s, 4s, 8s...
          console.log(`Reintento ${attempts + 1}/${maxAttempts} después de ${backoffTime/1000}s...`);
          
          const retryMessage = chunkNumber 
            ? `Reintentando parte ${chunkNumber} (intento ${attempts + 1}/${maxAttempts})...`
            : `Reintentando transcripción (intento ${attempts + 1}/${maxAttempts})...`;
            
          this.notifyProgress(retryMessage, 20 + (attempts * 10), onProgress);
          
          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
        
        // Intentar transcribir
        const result = await this.transcribeAudioChunk(audioBlob);
        
        // Si llegamos aquí, la transcripción fue exitosa
        
        // Enviar al webhook si no estamos en un chunk (si es audio completo)
        let webhookResponse = null;
        if (result.transcript && !chunkNumber) {
          this.notifyProgress("Enviando transcripción al webhook...", 90, onProgress);
          try {
            webhookResponse = await this.sendToWebhook(result.transcript);
            this.notifyProgress(`Transcripción procesada: ${result.transcript}`, 100, onProgress);
          } catch (webhookError) {
            console.error("Error al enviar al webhook:", webhookError);
            this.notifyProgress(`Error al enviar al webhook, pero transcripción disponible: ${result.transcript}`, 100, onProgress);
          }
        } else if (!chunkNumber) {
          this.notifyProgress("Transcripción completada sin texto", 100, onProgress);
        }
        
        return {
          ...result,
          webhookResponse
        };
      } catch (error) {
        attempts++;
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Intento ${attempts}/${maxAttempts} fallido. Error:`, error);
        
        if (attempts >= maxAttempts) {
          console.error("Se agotaron los reintentos:", lastError);
          break;
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    throw lastError || new Error("No se pudo transcribir el audio después de múltiples intentos");
  }

  /**
   * Transcribe un segmento de audio usando la API de GROQ
   */
  private async transcribeAudioChunk(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log(`Transcribiendo chunk de audio de ${audioBlob.size} bytes...`);
      
      // Verificar que el blob tiene datos
      if (audioBlob.size === 0) {
        throw new Error("El segmento de audio está vacío");
      }
      
      // Crear una URL del blob para acceder al audio
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log(`URL creada para el audio: ${audioUrl}`);
      
      // Crear FormData para la API
      const formData = new FormData();
      
      // Determinar extensión del archivo
      let filename = "audio";
      if (audioBlob.type.includes("wav")) {
        filename += ".wav";
      } else if (audioBlob.type.includes("mp3") || audioBlob.type.includes("mpeg")) {
        filename += ".mp3";
      } else if (audioBlob.type.includes("ogg")) {
        filename += ".ogg";
      } else {
        filename += ".wav";
      }
      
      // Añadir el blob como archivo
      formData.append("file", audioBlob, filename);
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
      console.log(`- Tamaño: ${(audioBlob.size / 1024).toFixed(2)} KB`);
      console.log(`- Tipo: ${audioBlob.type}`);
      console.log(`- Nombre: ${filename}`);
      
      // Implementar timeout para evitar esperas infinitas
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout
      
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
          const errorText = await response.text();
          console.error(`Error de API (${response.status}): ${errorText}`);
          
          // Liberar la URL del blob
          URL.revokeObjectURL(audioUrl);
          
          if (response.status === 413) {
            throw new Error("El archivo de audio es demasiado grande para la API de GROQ");
          } else if (response.status === 429) {
            throw new Error("Límite de tasa excedido en la API de GROQ. Espera unos segundos e intenta de nuevo.");
          } else if (response.status >= 500) {
            throw new Error(`Error del servidor GROQ (${response.status}). Intenta de nuevo más tarde.`);
          } else {
            throw new Error(`Error de API: ${response.status} - ${errorText}`);
          }
        }
        
        // Parsear respuesta
        const data = await response.json();
        
        // Liberar la URL del blob después de usarla
        URL.revokeObjectURL(audioUrl);
        
        if (!data.text) {
          console.error("Respuesta sin texto:", data);
          throw new Error("Respuesta inválida de la API de GROQ");
        }
        
        console.log("Transcripción exitosa:", data.text.slice(0, 50) + "...");
        
        return {
          transcript: data.text.trim(),
          language: data.language || "es"
        };
      } catch (fetchError) {
        // Liberar la URL del blob en caso de error
        URL.revokeObjectURL(audioUrl);
        
        if (fetchError.name === 'AbortError') {
          throw new Error("La solicitud a la API de GROQ excedió el tiempo límite (60 segundos)");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error en transcripción:", error);
      let errorMessage = "Error desconocido";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          errorMessage = "Error de red al conectar con la API de GROQ. Verifica tu conexión a Internet.";
        } else if (error.message.includes("API")) {
          errorMessage = `Error en la API de GROQ: ${error.message}`;
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
