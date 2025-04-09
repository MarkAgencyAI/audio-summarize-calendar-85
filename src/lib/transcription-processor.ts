
import { transcribeAudio } from "@/lib/groq";
import { splitAudioFile } from "@/lib/audio-splitter";
import { sendToWebhook } from "@/lib/webhook";
import { getAudioDuration } from "@/lib/audio-utils";

interface TranscriptionProgressCallback {
  (data: any): void;
}

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
    const MAX_CHUNK_DURATION = 600; // 10 minutes in seconds
    
    let transcriptionResult;
    let fullTranscript = "";
    
    if (audioDuration > MAX_CHUNK_DURATION) {
      // Audio is longer than 10 minutes, split it
      if (onTranscriptionProgress) {
        onTranscriptionProgress({
          output: "El audio es largo, dividiendo en partes para procesarlo..."
        });
      }
      
      try {
        // Intenta dividir el audio en partes
        const audioChunks = await splitAudioFile(audioBlob);
        let totalChunks = audioChunks.length;
        
        if (onTranscriptionProgress) {
          onTranscriptionProgress({
            output: `Dividido en ${totalChunks} partes. Procesando cada parte...`
          });
        }
        
        // Process each chunk separately and in sequence
        for (let i = 0; i < audioChunks.length; i++) {
          const chunk = audioChunks[i];
          
          if (onTranscriptionProgress) {
            onTranscriptionProgress({
              output: `Transcribiendo parte ${i + 1} de ${totalChunks}...`
            });
          }
          
          let chunkResult;
          let retryCount = 0;
          const MAX_RETRIES = 2;
          
          // Implementar sistema de reintentos para cada parte
          while (retryCount <= MAX_RETRIES) {
            try {
              // Transcribe the current chunk
              chunkResult = await transcribeAudio(chunk.blob, subject, speakerMode);
              break; // Si la transcripción fue exitosa, salimos del bucle
            } catch (chunkError) {
              retryCount++;
              if (retryCount > MAX_RETRIES) {
                throw chunkError; // Si superamos los reintentos, propagamos el error
              }
              
              if (onTranscriptionProgress) {
                onTranscriptionProgress({
                  output: `Error al procesar parte ${i + 1}. Reintentando (${retryCount}/${MAX_RETRIES})...`
                });
              }
              
              // Podríamos intentar procesar con un tamaño de chunk diferente si fuera necesario
              await new Promise(resolve => setTimeout(resolve, 1000)); // Breve pausa antes de reintentar
            }
          }
          
          if (!chunkResult) {
            throw new Error(`No se pudo transcribir la parte ${i + 1} después de varios intentos`);
          }
          
          // Add timestamp marker and append to full transcript
          const startMinutes = Math.floor(chunk.startTime / 60);
          const startSeconds = chunk.startTime % 60;
          
          if (i > 0) {
            fullTranscript += `\n\n[Continuación - ${startMinutes}:${startSeconds.toString().padStart(2, '0')}]\n`;
          }
          
          fullTranscript += chunkResult.transcript;
        }
        
        // Create a combined result object
        transcriptionResult = {
          transcript: fullTranscript,
          language: "es"
        };
        
      } catch (splitError) {
        console.error("Error splitting audio:", splitError);
        
        // Si falla al dividir el audio, intentamos dividirlo de manera diferente
        if (onTranscriptionProgress) {
          onTranscriptionProgress({
            output: "Error al procesar el audio. Intentando con otro método de división..."
          });
        }
        
        // Intentar una segunda estrategia de división del audio
        try {
          // Dividir el audio manualmente en partes más pequeñas (5 minutos)
          const smallerChunkDuration = 300; // 5 minutos en segundos
          const audioChunks = await splitAudioFile(audioBlob, smallerChunkDuration);
          let totalChunks = audioChunks.length;
          
          if (onTranscriptionProgress) {
            onTranscriptionProgress({
              output: `Redividido en ${totalChunks} partes más pequeñas. Procesando...`
            });
          }
          
          // Procesar cada parte secuencialmente
          for (let i = 0; i < audioChunks.length; i++) {
            const chunk = audioChunks[i];
            
            if (onTranscriptionProgress) {
              onTranscriptionProgress({
                output: `Transcribiendo parte ${i + 1} de ${totalChunks}...`
              });
            }
            
            // Transcribir la parte actual
            try {
              const chunkResult = await transcribeAudio(chunk.blob, subject, speakerMode);
              
              // Agregar marcador de tiempo y adjuntar a la transcripción completa
              const startMinutes = Math.floor(chunk.startTime / 60);
              const startSeconds = chunk.startTime % 60;
              
              if (i > 0) {
                fullTranscript += `\n\n[Continuación - ${startMinutes}:${startSeconds.toString().padStart(2, '0')}]\n`;
              }
              
              fullTranscript += chunkResult.transcript;
              
            } catch (chunkError) {
              console.error(`Error al transcribir parte ${i + 1}:`, chunkError);
              fullTranscript += `\n\n[Error en parte ${i + 1} - No se pudo transcribir]\n`;
            }
          }
          
          // Crear objeto de resultado combinado
          transcriptionResult = {
            transcript: fullTranscript || "No se pudo transcribir completamente el audio",
            language: "es"
          };
        } catch (secondSplitError) {
          console.error("Error en el segundo intento de división:", secondSplitError);
          throw new Error("No se pudo procesar el audio después de múltiples intentos");
        }
      }
    } else {
      // Audio is short enough, process normally
      transcriptionResult = await transcribeAudio(audioBlob, subject, speakerMode);
    }
    
    // Prepare data for webhook
    const webhookData = {
      transcript: transcriptionResult.transcript,
      language: transcriptionResult.language || "es",
      subject: subject || "Sin materia",
      speakerMode: speakerMode,
      processed: true
    };
    
    // Notify that we're waiting for webhook
    if (onTranscriptionProgress) {
      onTranscriptionProgress({
        output: "Esperando respuesta del webhook..."
      });
    }
    
    try {
      // Send data to webhook - use the constant URL
      const WEBHOOK_URL = "https://sswebhookss.maettiai.tech/webhook/8e34aca2-3111-488c-8ee8-a0a2c63fc9e4";
      console.log("Iniciando envío a webhook");
      await sendToWebhook(WEBHOOK_URL, webhookData);
      console.log("Webhook completado correctamente");
    } catch (webhookError) {
      console.error("Error con el webhook pero continuando con el proceso:", webhookError);
      
      // If webhook fails, we'll still return the transcription
      if (onTranscriptionProgress) {
        onTranscriptionProgress({
          output: transcriptionResult.transcript + "\n\n(Error al procesar con el webhook)"
        });
      }
    }
    
    // Return the Groq transcription result as a fallback
    return transcriptionResult;
  } catch (error) {
    console.error("Error processing audio:", error);
    throw error;
  }
}
