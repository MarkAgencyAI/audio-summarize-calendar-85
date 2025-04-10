
/**
 * Utilidades para trabajar con buffers de audio en el navegador
 */
import { AudioChunk } from './types';

/**
 * Obtiene la duración de un blob de audio
 */
export async function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      URL.revokeObjectURL(audioUrl);
      resolve(duration);
    };
    
    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl);
      reject(error);
    };
  });
}

/**
 * Divide un blob de audio en segmentos de duración máxima especificada
 */
export async function splitAudioIntoChunks(audioBlob: Blob, maxChunkDuration: number): Promise<AudioChunk[]> {
  try {
    console.log(`Dividiendo audio de ${(audioBlob.size / (1024 * 1024)).toFixed(2)}MB en segmentos de ${maxChunkDuration} segundos...`);
    
    // Convertir el blob a ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Crear un AudioContext para decodificar el audio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Decodificar el audio
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const duration = audioBuffer.duration;
    
    console.log(`Audio decodificado: ${duration.toFixed(2)} segundos, ${sampleRate}Hz, ${numberOfChannels} canales`);
    
    // Calcular número de chunks
    const numChunks = Math.ceil(duration / maxChunkDuration);
    console.log(`Dividiendo en ${numChunks} partes...`);
    
    const chunks: AudioChunk[] = [];
    
    // Crear cada chunk
    for (let i = 0; i < numChunks; i++) {
      const startTime = i * maxChunkDuration;
      const endTime = Math.min((i + 1) * maxChunkDuration, duration);
      const chunkDuration = endTime - startTime;
      
      console.log(`Creando parte ${i + 1}/${numChunks}: ${startTime.toFixed(2)}s - ${endTime.toFixed(2)}s (${chunkDuration.toFixed(2)}s)`);
      
      // Crear un nuevo buffer para el chunk
      const chunkBuffer = audioContext.createBuffer(
        numberOfChannels,
        Math.ceil(chunkDuration * sampleRate),
        sampleRate
      );
      
      // Copiar los datos de cada canal
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const originalData = audioBuffer.getChannelData(channel);
        const chunkData = chunkBuffer.getChannelData(channel);
        
        const startSample = Math.floor(startTime * sampleRate);
        const samplesToCopy = chunkData.length;
        
        for (let j = 0; j < samplesToCopy; j++) {
          if (startSample + j < originalData.length) {
            chunkData[j] = originalData[startSample + j];
          }
        }
      }
      
      // Convertir el buffer a WAV
      const wavArrayBuffer = await bufferToWav(chunkBuffer);
      const chunkBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
      
      // Crear URL para el chunk
      const chunkUrl = URL.createObjectURL(chunkBlob);
      
      chunks.push({
        blob: chunkBlob,
        startTime,
        endTime,
        url: chunkUrl
      });
      
      console.log(`Parte ${i + 1} creada: ${(chunkBlob.size / 1024).toFixed(2)}KB, URL: ${chunkUrl}`);
    }
    
    return chunks;
  } catch (error) {
    console.error("Error al dividir el audio:", error);
    throw error;
  }
}

/**
 * Convierte un AudioBuffer a formato WAV
 */
export function bufferToWav(buffer: AudioBuffer): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM format
    const bitDepth = 16;
    
    // Calcular tamaño del buffer
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const headerSize = 44;
    const wavSize = headerSize + dataSize;
    
    // Crear cabecera WAV
    const wav = new ArrayBuffer(wavSize);
    const view = new DataView(wav);
    
    // Escribir cabecera "RIFF"
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    
    // Escribir chunk "fmt "
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    
    // Escribir chunk "data"
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Escribir datos de audio
    const offset = headerSize;
    const bufferData = new Float32Array(buffer.length * numberOfChannels);
    
    // Entrelazar canales
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < buffer.length; i++) {
        bufferData[i * numberOfChannels + channel] = channelData[i];
      }
    }
    
    // Convertir y escribir muestras de audio
    let index = 0;
    const volume = 0.9; // Evitar clipping
    for (let i = 0; i < bufferData.length; i++) {
      const sample = Math.max(-1, Math.min(1, bufferData[i])) * volume;
      view.setInt16(offset + index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      index += 2;
    }
    
    resolve(wav);
  });
  
  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
