
import { transcribeAudio } from "@/lib/groq";
import { splitAudioFile } from "@/lib/audio-splitter";
import { sendToWebhook } from "@/lib/webhook";
import { getAudioDuration } from "@/lib/audio-utils";

interface TranscriptionProgressCallback {
  (data: any): void;
}

// URL fija del webhook
const WEBHOOK_URL = "https://sswebhookss.maettiai.tech/webhook/8e34aca2-3111-488c-8ee8-a0a2c63fc9e4";

/**
 * Process an audio file for transcription, handling chunking for long audio files
 */
export async function processAudioForTranscription(
  audioBlob: Blob,
  subject?: string,
  onTranscriptionProgress?: TranscriptionProgressCallback,
  speakerMode: 'single' | 'multiple' = 'single'
) {
  try {
    // Get audio duration to check if we need to split
    const audioDuration = await getAudioDuration(audioBlob);
    const MAX_CHUNK_DURATION = 420; // 7 minutos en segundos (antes 300)
    
    let transcriptionResult;
    let fullTranscript = "";
    let chunkErrors: string[] = []; // Para registrar errores en cada parte
    
    // Notify about processing start
    if (onTranscriptionProgress) {
      onTranscriptionProgress({
        output: "Iniciando procesamiento de audio...",
        progress: 5
      });
    }
    
    if (audioDuration > MAX_CHUNK_DURATION) {
      // Audio is longer than 7 minutes, split it
      if (onTranscriptionProgress) {
        onTranscriptionProgress({
          output: "El audio es largo, dividiendo en partes para procesarlo...",
          progress: 10
        });
      }
      
      try {
        // Intenta dividir el audio en partes
        const audioChunks = await splitAudioFile(audioBlob, MAX_CHUNK_DURATION);
        let totalChunks = audioChunks.length;
        
        if (onTranscriptionProgress) {
          onTranscriptionProgress({
            output: `Dividido en ${totalChunks} partes. Procesando cada parte...`,
            progress: 15
          });
        }
        
        // Process each chunk separately and in sequence
        for (let i = 0; i < audioChunks.length; i++) {
          const chunk = audioChunks[i];
          const chunkNumber = i + 1;
          
          // Calcular el progreso basado en cuántos chunks hemos procesado
          // Reservamos 15% para la división, 70% para la transcripción de todas las partes, 15% para el webhook
          const baseProgress = 15;
          const chunkProgress = Math.floor(baseProgress + ((chunkNumber / totalChunks) * 70));
          
          if (onTranscriptionProgress) {
            onTranscriptionProgress({
              output: `Transcribiendo parte ${chunkNumber} de ${totalChunks}...`,
              progress: chunkProgress
            });
          }
          
          let chunkResult;
          let retryCount = 0;
          const MAX_RETRIES = 2;
          let chunkError = null;
          
          // Implementar sistema de reintentos para cada parte
          while (retryCount <= MAX_RETRIES) {
            try {
              // Transcribe the current chunk
              chunkResult = await transcribeAudio(chunk.blob, subject, speakerMode);
              break; // Si la transcripción fue exitosa, salimos del bucle
            } catch (chunkError) {
              retryCount++;
              if (retryCount > MAX_RETRIES) {
                console.error(`Error al transcribir parte ${chunkNumber} (intento ${retryCount}):`, chunkError);
                const errorMsg = `Error en parte ${chunkNumber}: No se pudo transcribir después de ${MAX_RETRIES + 1} intentos`;
                chunkErrors.push(errorMsg);
                throw chunkError; // Si superamos los reintentos, propagamos el error
              }
              
              if (onTranscriptionProgress) {
                onTranscriptionProgress({
                  output: `Error al procesar parte ${chunkNumber}. Reintentando (${retryCount}/${MAX_RETRIES})...`,
                  progress: chunkProgress
                });
              }
              
              // Breve pausa antes de reintentar
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          if (!chunkResult) {
            const errorMsg = `No se pudo transcribir la parte ${chunkNumber} después de varios intentos`;
            chunkErrors.push(errorMsg);
            throw new Error(errorMsg);
          }
          
          // Add timestamp marker and append to full transcript
          const startMinutes = Math.floor(chunk.startTime / 60);
          const startSeconds = Math.floor(chunk.startTime % 60);
          const formattedTime = `${startMinutes}:${startSeconds.toString().padStart(2, '0')}`;
          
          if (i > 0) {
            fullTranscript += `\n\n[Continuación - ${formattedTime}]\n`;
          }
          
          fullTranscript += chunkResult.transcript;
          
          // Actualizar con el texto acumulado hasta ahora
          if (onTranscriptionProgress) {
            onTranscriptionProgress({
              output: fullTranscript,
              progress: chunkProgress
            });
          }
        }
        
        // Create a combined result object
        transcriptionResult = {
          transcript: fullTranscript,
          language: "es",
          errors: chunkErrors.length > 0 ? chunkErrors : undefined
        };
        
      } catch (splitError) {
        console.error("Error splitting audio:", splitError);
        
        // Si falla al dividir el audio, intentamos dividirlo de manera diferente
        if (onTranscriptionProgress) {
          onTranscriptionProgress({
            output: "Error al procesar el audio. Intentando con otro método de división...",
            progress: 20
          });
        }
        
        // Intentar una segunda estrategia de división del audio
        try {
          // Dividir el audio manualmente en partes más pequeñas (2 minutos)
          const smallerChunkDuration = 120; // 2 minutos en segundos
          const audioChunks = await splitAudioFile(audioBlob, smallerChunkDuration);
          let totalChunks = audioChunks.length;
          
          if (onTranscriptionProgress) {
            onTranscriptionProgress({
              output: `Redividido en ${totalChunks} partes más pequeñas. Procesando...`,
              progress: 25
            });
          }
          
          // Procesar cada parte secuencialmente
          for (let i = 0; i < audioChunks.length; i++) {
            const chunk = audioChunks[i];
            const chunkNumber = i + 1;
            
            // Calcular el progreso para chunks más pequeños
            const baseProgress = 25;
            const chunkProgress = Math.floor(baseProgress + ((chunkNumber / totalChunks) * 60));
            
            if (onTranscriptionProgress) {
              onTranscriptionProgress({
                output: `Transcribiendo parte ${chunkNumber} de ${totalChunks}...`,
                progress: chunkProgress
              });
            }
            
            // Transcribir la parte actual
            try {
              const chunkResult = await transcribeAudio(chunk.blob, subject, speakerMode);
              
              // Agregar marcador de tiempo y adjuntar a la transcripción completa
              const startMinutes = Math.floor(chunk.startTime / 60);
              const startSeconds = Math.floor(chunk.startTime % 60);
              const formattedTime = `${startMinutes}:${startSeconds.toString().padStart(2, '0')}`;
              
              if (i > 0) {
                fullTranscript += `\n\n[Continuación - ${formattedTime}]\n`;
              }
              
              fullTranscript += chunkResult.transcript;
              
              // Actualizar con el texto acumulado hasta ahora
              if (onTranscriptionProgress) {
                onTranscriptionProgress({
                  output: fullTranscript,
                  progress: chunkProgress
                });
              }
              
            } catch (chunkError) {
              console.error(`Error al transcribir parte ${chunkNumber}:`, chunkError);
              const errorMsg = `Error en parte ${chunkNumber} - No se pudo transcribir`;
              chunkErrors.push(errorMsg);
              fullTranscript += `\n\n[${errorMsg}]\n`;
              
              // Actualizar con el texto acumulado hasta ahora, incluyendo el error
              if (onTranscriptionProgress) {
                onTranscriptionProgress({
                  output: fullTranscript,
                  progress: chunkProgress
                });
              }
            }
          }
          
          // Crear objeto de resultado combinado
          transcriptionResult = {
            transcript: fullTranscript || "No se pudo transcribir completamente el audio",
            language: "es",
            errors: chunkErrors.length > 0 ? chunkErrors : undefined
          };
        } catch (secondSplitError) {
          console.error("Error en el segundo intento de división:", secondSplitError);
          throw new Error("No se pudo procesar el audio después de múltiples intentos");
        }
      }
    } else {
      // Audio is short enough, process normally
      if (onTranscriptionProgress) {
        onTranscriptionProgress({
          output: "Transcribiendo audio...",
          progress: 30
        });
      }
      
      transcriptionResult = await transcribeAudio(audioBlob, subject, speakerMode);
      fullTranscript = transcriptionResult.transcript;
      
      if (onTranscriptionProgress) {
        onTranscriptionProgress({
          output: fullTranscript,
          progress: 85
        });
      }
    }
    
    // Prepare data for webhook
    const webhookData = {
      transcript: transcriptionResult.transcript,
      language: transcriptionResult.language || "es",
      subject: subject || "Sin materia",
      speakerMode: speakerMode,
      processed: true,
      errors: transcriptionResult.errors
    };
    
    // Notify that we're waiting for webhook
    if (onTranscriptionProgress) {
      onTranscriptionProgress({
        output: "Esperando respuesta del webhook...",
        progress: 90
      });
    }
    
    try {
      // Send data to webhook - use the constant URL
      console.log("Iniciando envío a webhook");
      await sendToWebhook(WEBHOOK_URL, webhookData);
      console.log("Webhook completado correctamente");
      
      if (onTranscriptionProgress) {
        onTranscriptionProgress({
          output: fullTranscript,
          progress: 100
        });
      }
    } catch (webhookError) {
      console.error("Error con el webhook pero continuando con el proceso:", webhookError);
      
      // If webhook fails, we'll still return the transcription
      if (onTranscriptionProgress) {
        onTranscriptionProgress({
          output: transcriptionResult.transcript + "\n\n(Error al procesar con el webhook)",
          progress: 100
        });
      }
    }
    
    // Signal completion with the final transcript
    const transcriptionCompleteEvent = new CustomEvent('audioRecorderMessage', {
      detail: {
        type: 'transcriptionComplete',
        data: {
          output: fullTranscript,
          progress: 100,
          errors: transcriptionResult.errors
        }
      }
    });
    window.dispatchEvent(transcriptionCompleteEvent);
    
    // Return the Groq transcription result
    return transcriptionResult;
  } catch (error) {
    console.error("Error processing audio:", error);
    
    // Signal error
    if (onTranscriptionProgress) {
      onTranscriptionProgress({
        output: `Error al procesar el audio: ${error instanceof Error ? error.message : "Error desconocido"}`,
        progress: 0
      });
    }
    
    throw error;
  }
}
