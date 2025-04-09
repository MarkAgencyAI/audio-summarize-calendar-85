import React from 'react';
import { toast } from "sonner";
import { sendToWebhook } from "./webhook";

// Definimos las interfaces para nuestro servicio
interface TranscriptionOptions {
  maxChunkDuration: number; // en segundos
  speakerMode: 'single' | 'multiple';
  subject?: string;
  webhookUrl?: string;
}

interface TranscriptionProgress {
  output: string;
  progress: number;
}

interface TranscriptionResult {
  transcript: string;
  language?: string;
  webhookResponse?: any;
  errors?: string[]; // Nuevo campo para registrar errores
}

// URL constante del endpoint de GROQ
const GROQ_API_KEY = "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";
// URL del webhook por defecto
const DEFAULT_WEBHOOK_URL = "https://sswebhookss.maettiai.tech/webhook/8e34aca2-3111-488c-8ee8-a0a2c63fc9e4";

export class TranscriptionService {
  // Opciones por defecto con nuevo límite de 7 minutos
  private options: TranscriptionOptions = {
    maxChunkDuration: 420, // 7 minutos en segundos (antes 600)
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
      const audioDuration = await this.getAudioDuration(audioBlob);
      console.log(`Duración del audio: ${audioDuration} segundos`);
      
      if (audioDuration > this.options.maxChunkDuration) {
        // El audio es más largo de lo permitido, dividirlo
        return await this.processLongAudio(audioBlob, audioDuration, onProgress);
      } else {
        // El audio es corto, procesarlo directamente
        this.notifyProgress("Transcribiendo audio...", 20, onProgress);
        
        // Añadimos múltiples intentos para audio corto también
        let attempts = 0;
        const maxAttempts = 3;
        let lastError;
        
        while (attempts < maxAttempts) {
          try {
            const result = await this.transcribeAudioChunk(audioBlob);
            
            // Enviar al webhook
            let webhookResponse = null;
            if (result.transcript) {
              this.notifyProgress("Enviando transcripción al webhook...", 90, onProgress);
              try {
                webhookResponse = await this.sendToWebhook(result.transcript);
                this.notifyProgress(`Transcripción procesada: ${result.transcript}`, 100, onProgress);
              } catch (webhookError) {
                console.error("Error al enviar al webhook:", webhookError);
                this.notifyProgress(`Error al enviar al webhook, pero transcripción disponible: ${result.transcript}`, 100, onProgress);
              }
            } else {
              this.notifyProgress("Transcripción completada sin texto", 100, onProgress);
            }
            
            return {
              ...result,
              webhookResponse
            };
          } catch (error) {
            attempts++;
            lastError = error;
            console.warn(`Intento ${attempts}/${maxAttempts} fallido. Error:`, error);
            
            if (attempts < maxAttempts) {
              this.notifyProgress(`Error en intento ${attempts}. Reintentando...`, 20 + (attempts * 10), onProgress);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Espera entre intentos
            }
          }
        }
        
        // Si llegamos aquí, todos los intentos fallaron
        throw lastError || new Error("No se pudo transcribir el audio después de múltiples intentos");
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
    
    // Calcular el número de segmentos basado en la duración máxima
    const numChunks = Math.ceil(duration / this.options.maxChunkDuration);
    const chunks = await this.splitAudio(audioBlob, numChunks);
    
    this.notifyProgress(`Audio dividido en ${chunks.length} partes. Iniciando transcripción...`, 20, onProgress);
    
    // Transcribir cada parte secuencialmente
    let fullTranscript = "";
    let language = "es";
    let allChunksFailed = true;
    let errors: string[] = []; // Para registrar errores de transcripción
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkNumber = i + 1;
      
      // Calcular progreso basado en las partes procesadas (20-90%)
      const chunkProgress = Math.floor(20 + (70 * (i / chunks.length)));
      this.notifyProgress(`Transcribiendo parte ${chunkNumber} de ${chunks.length}...`, chunkProgress, onProgress);
      
      // Implementar sistema de reintentos para cada segmento
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      
      while (attempts < maxAttempts && !success) {
        try {
          if (attempts > 0) {
            this.notifyProgress(`Reintentando parte ${chunkNumber} (intento ${attempts+1}/${maxAttempts})...`, chunkProgress, onProgress);
            // Esperar un tiempo antes de reintentar (1s, 2s, 4s)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          }
          
          // Utilizamos directamente el blob para enviarlo como un archivo
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
          
          // Marcar como exitoso
          success = true;
          allChunksFailed = false;
        } catch (error) {
          console.error(`Error al transcribir parte ${chunkNumber} (intento ${attempts+1}):`, error);
          attempts++;
          
          if (attempts >= maxAttempts) {
            // Si se agotan los intentos para este segmento, registrar el error y continuar
            const errorMsg = `Error en parte ${chunkNumber}: No se pudo transcribir después de ${maxAttempts} intentos`;
            errors.push(errorMsg);
            
            // Mostrar mensaje de error en la transcripción
            fullTranscript += `\n\n[${errorMsg}]\n`;
            this.notifyProgress(fullTranscript, chunkProgress, onProgress);
            
            // Mostrar un toast con el error
            toast.error(`Falló la transcripción de la parte ${chunkNumber}`);
          }
        }
      }
    }
    
    // Verificar si al menos una parte se transcribió correctamente
    if (allChunksFailed) {
      throw new Error("No se pudo transcribir ninguna parte del audio después de múltiples intentos");
    }
    
    // Enviar la transcripción completa al webhook
    let webhookResponse = null;
    if (fullTranscript) {
      this.notifyProgress("Enviando transcripción completa al webhook...", 90, onProgress);
      try {
        webhookResponse = await this.sendToWebhook(fullTranscript);
      } catch (webhookError) {
        console.error("Error al enviar al webhook:", webhookError);
        errors.push("Error al enviar al webhook: " + (webhookError instanceof Error ? webhookError.message : String(webhookError)));
        // Continuamos a pesar del error en el webhook
      }
    }
    
    this.notifyProgress(fullTranscript, 100, onProgress);
    
    return {
      transcript: fullTranscript,
      language,
      webhookResponse,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Divide un blob de audio en múltiples partes
   */
  private async splitAudio(audioBlob: Blob, numChunks: number): Promise<Array<{blob: Blob, startTime: number, endTime: number}>> {
    try {
      // Convertir blob a ArrayBuffer para procesamiento
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const duration = audioBuffer.duration;
      const chunkDuration = this.options.maxChunkDuration; // Usamos la duración máxima configurada
      const chunks: Array<{blob: Blob, startTime: number, endTime: number}> = [];
      
      console.log(`Dividiendo audio de ${duration}s en segmentos de ${chunkDuration}s como máximo`);
      
      // Crear cada segmento basado en la duración máxima, no en número de segmentos
      let startTime = 0;
      while (startTime < duration) {
        const endTime = Math.min(startTime + chunkDuration, duration);
        const chunkSeconds = endTime - startTime;
        
        console.log(`Creando segmento: ${startTime}s a ${endTime}s (${chunkSeconds}s)`);
        
        // Crear un nuevo buffer para este segmento
        const sampleRate = audioBuffer.sampleRate;
        const frameCount = Math.ceil(chunkSeconds * sampleRate);
        const chunkBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          frameCount,
          sampleRate
        );
        
        // Copiar los datos para cada canal
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const channelData = new Float32Array(frameCount);
          const sourceOffset = Math.floor(startTime * sampleRate);
          const sourceData = audioBuffer.getChannelData(channel);
          
          // Copiar solo los datos que necesitamos para este segmento
          for (let i = 0; i < frameCount; i++) {
            const sourceIndex = sourceOffset + i;
            if (sourceIndex < sourceData.length) {
              channelData[i] = sourceData[sourceIndex];
            }
          }
          
          chunkBuffer.copyToChannel(channelData, channel);
        }
        
        // Convertir el buffer a blob (formato WAV)
        const chunkBlob = await this.audioBufferToWav(chunkBuffer, audioBlob.type || 'audio/wav');
        
        chunks.push({
          blob: chunkBlob,
          startTime: startTime,
          endTime: endTime
        });
        
        console.log(`Segmento creado correctamente (${chunkBlob.size} bytes)`);
        
        // Avanzar al siguiente segmento
        startTime = endTime;
      }
      
      console.log(`Se crearon ${chunks.length} segmentos de audio`);
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
   * Convierte un AudioBuffer a un Blob en formato WAV
   */
  private async audioBufferToWav(buffer: AudioBuffer, mimeType: string): Promise<Blob> {
    // Función para escribir una cadena UTF8 en un DataView
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // Obtener datos del buffer
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM format
    const bitDepth = 16; // 16-bit
    
    // Calcular el tamaño del archivo WAV
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const headerSize = 44;
    const fileSize = headerSize + dataSize;
    
    // Crear ArrayBuffer para el archivo WAV
    const arrayBuffer = new ArrayBuffer(fileSize);
    const view = new DataView(arrayBuffer);
    
    // Escribir cabecera RIFF
    writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    writeString(view, 8, 'WAVE');
    
    // Escribir cabecera fmt
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // tamaño del bloque fmt
    view.setUint16(20, format, true); // formato PCM
    view.setUint16(22, numChannels, true); // número de canales
    view.setUint32(24, sampleRate, true); // frecuencia de muestreo
    view.setUint32(28, byteRate, true); // byte rate
    view.setUint16(32, blockAlign, true); // block align
    view.setUint16(34, bitDepth, true); // bits por muestra
    
    // Escribir cabecera data
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true); // tamaño de los datos
    
    // Escribir datos de audio
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        const sample16bit = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample16bit, true);
        offset += 2;
      }
    }
    
    // Crear el Blob
    return new Blob([arrayBuffer], { type: mimeType });
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
    console.log("Datos a enviar:", data);
    
    try {
      return await sendToWebhook(webhookUrl, data);
    } catch (error) {
      console.error("Error enviando al webhook:", error);
      throw error;
    }
  }

  /**
   * Convierte un buffer a formato WAV usando un método alternativo
   * Este método es una alternativa más simple al anterior
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
    let offset = 44;
    
    // Interleave channels
    for (let i = start; i < end; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        // Scale to 16-bit signed int
        let sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
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
   * Convierte un AudioBuffer a Blob
   * @deprecated Usar audioBufferToWav en su lugar
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
   * Transcribe un segmento de audio usando la API de GROQ
   * Método actualizado para usar FormData y enviar del mismo modo que en grabaciones
   */
  private async transcribeAudioChunk(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log(`Transcribiendo chunk de audio de ${audioBlob.size} bytes...`);
      
      // Verificar que el blob tiene datos
      if (audioBlob.size === 0) {
        throw new Error("El segmento de audio está vacío");
      }
      
      // Crear un FormData para la API
      const formData = new FormData();
      
      // Determinar la extensión del archivo basada en el tipo MIME
      let filename = "audio";
      if (audioBlob.type.includes("wav")) {
        filename += ".wav";
      } else if (audioBlob.type.includes("mp3") || audioBlob.type.includes("mpeg")) {
        filename += ".mp3";
      } else if (audioBlob.type.includes("ogg")) {
        filename += ".ogg";
      } else {
        filename += ".wav"; // Default a WAV si no podemos determinar
      }
      
      // Añadir el blob como archivo
      formData.append("file", audioBlob, filename);
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("response_format", "verbose_json");
      formData.append("language", "es");
      
      console.log(`Enviando archivo ${filename} (${audioBlob.size} bytes) a la API de GROQ`);
      
      // Crear un prompt basado en el modo de oradores
      const prompt = this.options.speakerMode === 'single'
        ? `Esta es una grabación con un solo orador principal, enfócate en capturar claramente la voz predominante${this.options.subject ? ` sobre la materia ${this.options.subject}` : ''}.`
        : `Esta es una grabación con múltiples oradores, intenta distinguir entre las diferentes voces${this.options.subject ? ` que hablan sobre ${this.options.subject}` : ''}.`;
      
      formData.append("prompt", prompt);
      
      console.log(`Enviando solicitud a GROQ API para transcripción`);
      
      // Hacer la petición a la API de GROQ
      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: formData
      });
      
      // Verificar errores HTTP
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error de API (${response.status}): ${errorText}`);
        throw new Error(`Error de API: ${response.status} - ${errorText}`);
      }
      
      // Intentar parsear la respuesta como JSON
      try {
        const data = await response.json();
        
        if (!data.text) {
          console.error("Respuesta sin texto:", data);
          throw new Error("Respuesta inválida de la API de GROQ");
        }
        
        console.log("Transcripción exitosa:", data.text.slice(0, 50) + "...");
        
        return {
          transcript: data.text.trim(),
          language: data.language || "es"
        };
      } catch (jsonError) {
        // Si no es JSON, intentar obtener el texto
        console.error("Error al parsear respuesta JSON:", jsonError);
        const text = await response.text();
        console.error("Respuesta cruda:", text);
        throw new Error("Error al procesar la respuesta de la API");
      }
    } catch (error) {
      console.error("Error en transcripción:", error);
      // Mejorar el mensaje de error para mostrar más detalles
      let errorMessage = "Error desconocido";
      if (error instanceof Error) {
        errorMessage = error.message;
        // Agregar información específica según tipo de error
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
   * Obtiene la duración en segundos de un blob de audio
   */
  private async getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioBlob);
      
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        URL.revokeObjectURL(audio.src);
        resolve(isFinite(duration) ? duration : 0);
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audio.src);
        console.error("Error obteniendo duración del audio:", error);
        resolve(0); // Default a 0 en caso de error
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
    console.log("Datos a enviar:", data);
    
    try {
      return await sendToWebhook(webhookUrl, data);
    } catch (error) {
      console.error("Error enviando al webhook:", error);
      throw error;
    }
  }

  /**
   * Convierte un AudioBuffer a formato WAV usando un método alternativo
   * Este método es una alternativa más simple al anterior
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
    let offset = 44;
    
    // Interleave channels
    for (let i = start; i < end; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        // Scale to 16-bit signed int
        let sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
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
   * Convierte un AudioBuffer a Blob
   * @deprecated Usar audioBufferToWav en su lugar
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

// Hook personalizado para usar el servicio de transcripción en componentes de React
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
