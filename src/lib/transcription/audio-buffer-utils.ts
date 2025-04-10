/**
 * Utilidades para trabajar con buffers de audio en el navegador
 */
import { AudioChunk } from './types';

/**
 * Obtiene la duración de un blob de audio
 */
export async function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audioElement = new Audio();
    const objectUrl = URL.createObjectURL(audioBlob);
    audioElement.src = objectUrl;
    
    audioElement.onloadedmetadata = () => {
      const duration = audioElement.duration;
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };
    
    audioElement.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
  });
}

/**
 * División de audio en bloques usando Web Audio API
 * @param audioBlob Blob del audio
 * @param maxChunkDuration Duración máxima en segundos de cada bloque
 */
export async function splitAudioIntoChunks(
  audioBlob: Blob, 
  maxChunkDuration: number = 420 // 7 minutos por defecto
): Promise<AudioChunk[]> {
  try {
    console.log(`Iniciando división de audio en segmentos de ${maxChunkDuration} segundos...`);
    
    // Convertir blob a ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Decodificar el audio
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const totalDuration = audioBuffer.duration;
    
    console.log(`Audio decodificado: duración total ${totalDuration.toFixed(2)} segundos, 
                 canales: ${audioBuffer.numberOfChannels}, 
                 tasa de muestreo: ${audioBuffer.sampleRate}`);
    
    // Si la duración es menor que el máximo, devolver el blob original con su URL
    if (totalDuration <= maxChunkDuration) {
      const url = URL.createObjectURL(audioBlob);
      console.log(`Audio no necesita segmentación, duración: ${totalDuration.toFixed(2)}s < ${maxChunkDuration}s`);
      return [{
        blob: audioBlob,
        startTime: 0,
        endTime: totalDuration,
        url
      }];
    }
    
    // Calcular el número de segmentos
    const segments: AudioChunk[] = [];
    let startTime = 0;
    
    while (startTime < totalDuration) {
      const endTime = Math.min(startTime + maxChunkDuration, totalDuration);
      const chunkDuration = endTime - startTime;
      
      // Crear un nuevo buffer para este segmento
      const segmentSamples = Math.floor(chunkDuration * audioBuffer.sampleRate);
      const chunkBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        segmentSamples,
        audioBuffer.sampleRate
      );
      
      // Copiar los datos de cada canal
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = new Float32Array(segmentSamples);
        const sourceData = audioBuffer.getChannelData(channel);
        const startOffset = Math.floor(startTime * audioBuffer.sampleRate);
        
        // Copiar datos desde la posición de inicio hasta el final del chunk
        for (let i = 0; i < segmentSamples; i++) {
          if (startOffset + i < sourceData.length) {
            channelData[i] = sourceData[startOffset + i];
          }
        }
        
        // Copiar los datos al buffer del segmento
        chunkBuffer.copyToChannel(channelData, channel);
      }
      
      // Convertir a Blob y crear URL
      const chunkBlob = await bufferToWav(chunkBuffer);
      const url = URL.createObjectURL(chunkBlob);
      
      segments.push({
        blob: chunkBlob,
        startTime,
        endTime,
        url
      });
      
      console.log(`Segmento ${segments.length} creado: ${startTime.toFixed(2)}s a ${endTime.toFixed(2)}s (${chunkDuration.toFixed(2)}s)`);
      
      // Avanzar al siguiente segmento
      startTime = endTime;
    }
    
    console.log(`Audio dividido en ${segments.length} segmentos`);
    return segments;
    
  } catch (error) {
    console.error("Error al dividir el audio:", error);
    
    // Método alternativo si falla la decodificación
    console.log("Intentando método alternativo de segmentación...");
    return splitAudioFallback(audioBlob, maxChunkDuration);
  }
}

/**
 * Método alternativo para segmentar audio en caso de que falle el principal
 */
async function splitAudioFallback(audioBlob: Blob, maxChunkDuration: number): Promise<AudioChunk[]> {
  try {
    const duration = await getAudioDuration(audioBlob);
    
    // Si la duración es menor al máximo, devolver el blob original
    if (duration <= maxChunkDuration) {
      const url = URL.createObjectURL(audioBlob);
      return [{
        blob: audioBlob,
        startTime: 0,
        endTime: duration,
        url
      }];
    }
    
    // Si no podemos procesar, devolver el blob original con un warning
    console.warn(`No se pudo segmentar el audio. Se procesará como un solo archivo de ${duration.toFixed(2)}s`);
    const url = URL.createObjectURL(audioBlob);
    return [{
      blob: audioBlob,
      startTime: 0,
      endTime: duration,
      url
    }];
  } catch (error) {
    console.error("Error en el método alternativo de segmentación:", error);
    
    // Último recurso: devolver el blob original sin información de duración
    const url = URL.createObjectURL(audioBlob);
    return [{
      blob: audioBlob,
      startTime: 0,
      endTime: 0,
      url
    }];
  }
}

/**
 * Convierte un AudioBuffer a formato WAV
 */
export async function bufferToWav(buffer: AudioBuffer): Promise<Blob> {
  const numOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM format
  const bitDepth = 16;
  
  // Calcular tamaños
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const wavSize = headerSize + dataSize;
  
  // Crear arrayBuffer para el archivo WAV
  const arrayBuffer = new ArrayBuffer(wavSize);
  const view = new DataView(arrayBuffer);
  
  // Escribir el header WAV
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  // Escribir el chunk "fmt "
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  
  // Escribir el chunk "data"
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Escribir los datos de audio
  let offset = headerSize;
  const volume = 0.95; // Evitar clipping
  
  // Para cada canal, entrelazamos los samples
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i])) * volume;
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, value, true);
      offset += bytesPerSample;
    }
  }
  
  // Crear blob desde el arrayBuffer
  return new Blob([arrayBuffer], { type: 'audio/wav' });
  
  // Función auxiliar para escribir strings
  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
