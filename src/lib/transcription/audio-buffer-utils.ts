
/**
 * Utilidades para trabajar con buffers de audio en el navegador
 */

/**
 * Obtiene la duración de un blob de audio
 */
export async function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audioElement = new Audio();
    audioElement.src = URL.createObjectURL(audioBlob);
    
    audioElement.onloadedmetadata = () => {
      const duration = audioElement.duration;
      URL.revokeObjectURL(audioElement.src);
      resolve(duration);
    };
    
    audioElement.onerror = (error) => {
      URL.revokeObjectURL(audioElement.src);
      reject(error);
    };
  });
}

/**
 * Convierte un AudioBuffer a formato WAV
 */
export async function audioBufferToWav(buffer: AudioBuffer, mimeType: string = 'audio/wav'): Promise<Blob> {
  // Número de canales
  const numOfChannels = buffer.numberOfChannels;
  // Frecuencia de muestreo
  const sampleRate = buffer.sampleRate;
  // Profundidad de bits
  const bitsPerSample = 16;
  // Bytes por muestra
  const bytesPerSample = bitsPerSample / 8;
  // Tamaño del bloque
  const blockAlign = numOfChannels * bytesPerSample;
  
  // Longitud de los datos de audio
  const dataLength = buffer.length * numOfChannels * bytesPerSample;
  // Tamaño del header + datos
  const headerLength = 44;
  // Longitud total del archivo
  const fileLength = headerLength + dataLength;
  
  // Crear arrayBuffer para el archivo WAV
  const arrayBuffer = new ArrayBuffer(fileLength);
  // Vista para escribir en el buffer
  const view = new DataView(arrayBuffer);
  
  // Escribir el header WAV
  // "RIFF" en ASCII
  view.setUint8(0, 'R'.charCodeAt(0));
  view.setUint8(1, 'I'.charCodeAt(0));
  view.setUint8(2, 'F'.charCodeAt(0));
  view.setUint8(3, 'F'.charCodeAt(0));
  
  // Tamaño total del archivo - 8
  view.setUint32(4, fileLength - 8, true);
  
  // "WAVE" en ASCII
  view.setUint8(8, 'W'.charCodeAt(0));
  view.setUint8(9, 'A'.charCodeAt(0));
  view.setUint8(10, 'V'.charCodeAt(0));
  view.setUint8(11, 'E'.charCodeAt(0));
  
  // "fmt " en ASCII
  view.setUint8(12, 'f'.charCodeAt(0));
  view.setUint8(13, 'm'.charCodeAt(0));
  view.setUint8(14, 't'.charCodeAt(0));
  view.setUint8(15, ' '.charCodeAt(0));
  
  // Tamaño del bloque fmt
  view.setUint32(16, 16, true);
  // Formato de audio (1 = PCM)
  view.setUint16(20, 1, true);
  // Número de canales
  view.setUint16(22, numOfChannels, true);
  // Frecuencia de muestreo
  view.setUint32(24, sampleRate, true);
  // Bytes por segundo
  view.setUint32(28, sampleRate * blockAlign, true);
  // Tamaño del bloque
  view.setUint16(32, blockAlign, true);
  // Bits por muestra
  view.setUint16(34, bitsPerSample, true);
  
  // "data" en ASCII
  view.setUint8(36, 'd'.charCodeAt(0));
  view.setUint8(37, 'a'.charCodeAt(0));
  view.setUint8(38, 't'.charCodeAt(0));
  view.setUint8(39, 'a'.charCodeAt(0));
  
  // Tamaño de los datos
  view.setUint32(40, dataLength, true);
  
  // Escribir los datos de audio
  let offset = 44;
  const volume = 1;
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    const channel = buffer.getChannelData(i);
    for (let j = 0; j < buffer.length; j++) {
      const sample = Math.max(-1, Math.min(1, channel[j] * volume));
      const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16Sample, true);
      offset += bytesPerSample;
    }
  }
  
  // Crear blob desde el arrayBuffer
  return new Blob([arrayBuffer], { type: mimeType });
}

/**
 * Convierte un AudioBuffer a Blob
 */
export async function audioBufferToBlob(buffer: AudioBuffer, mimeType: string = 'audio/wav'): Promise<Blob> {
  return audioBufferToWav(buffer, mimeType);
}

/**
 * Convierte un buffer de audio a un archivo WAV (forma alternativa)
 */
export function bufferToWave(abuffer: AudioBuffer): Blob {
  const numOfChannels = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChannels * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let offset = 0;
  let pos = 0;
  
  // Escribir header "RIFF"
  setUint32(0x46464952);
  // Escribir tamaño del chunk
  setUint32(length - 8);
  // Escribir header "WAVE"
  setUint32(0x45564157);
  // Escribir header "fmt " y tamaño del chunk
  setUint32(0x20746D66);
  setUint32(16);
  // Escribir formato (1 para PCM)
  setUint16(1);
  // Canales
  setUint16(numOfChannels);
  // Frecuencia de muestreo
  setUint32(abuffer.sampleRate);
  // Bytes por segundo
  setUint32(abuffer.sampleRate * 2 * numOfChannels);
  // Tamaño de bloque
  setUint16(numOfChannels * 2);
  // Bits por muestra
  setUint16(16);
  // Escribir subchunk "data" y tamaño
  setUint32(0x61746164);
  setUint32(abuffer.length * numOfChannels * 2);
  
  // Escribir datos PCM
  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }
  
  for (let i = 0; i < abuffer.length; i++) {
    for (let j = 0; j < numOfChannels; j++) {
      const sample = Math.max(-1, Math.min(1, channels[j][i]));
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      pos += 2;
    }
  }
  
  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  
  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * División de audio en bloques
 * @param audioBlob Blob del audio
 * @param maxChunkDuration Duración máxima en segundos de cada bloque
 */
export async function splitAudioIntoChunks(
  audioBlob: Blob, 
  maxChunkDuration: number = 420 // 7 minutos por defecto
): Promise<{ blob: Blob, startTime: number, endTime: number }[]> {
  try {
    // Convertir blob a ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Decodificar el audio
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const totalDuration = audioBuffer.duration;
    
    // Si la duración es menor que el máximo, devolver el blob original
    if (totalDuration <= maxChunkDuration) {
      return [{
        blob: audioBlob,
        startTime: 0,
        endTime: totalDuration
      }];
    }
    
    console.log(`Dividiendo audio de ${totalDuration.toFixed(2)} segundos en segmentos de ${maxChunkDuration} segundos`);
    
    // Calcular el número de segmentos
    const segments = [];
    let startTime = 0;
    
    while (startTime < totalDuration) {
      const endTime = Math.min(startTime + maxChunkDuration, totalDuration);
      const chunkDuration = endTime - startTime;
      
      // Crear un nuevo buffer para este segmento
      const chunkBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        Math.floor(chunkDuration * audioBuffer.sampleRate),
        audioBuffer.sampleRate
      );
      
      // Copiar los datos de cada canal
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = new Float32Array(chunkBuffer.length);
        const sourceData = audioBuffer.getChannelData(channel);
        const startOffset = Math.floor(startTime * audioBuffer.sampleRate);
        
        // Copiar datos desde la posición de inicio hasta el final del chunk
        for (let i = 0; i < chunkBuffer.length; i++) {
          if (startOffset + i < sourceData.length) {
            channelData[i] = sourceData[startOffset + i];
          }
        }
        
        // Copiar los datos al buffer del segmento
        chunkBuffer.copyToChannel(channelData, channel);
      }
      
      // Convertir a WAV
      const chunkBlob = await audioBufferToWav(chunkBuffer, audioBlob.type || 'audio/wav');
      
      segments.push({
        blob: chunkBlob,
        startTime,
        endTime
      });
      
      // Avanzar al siguiente segmento
      startTime = endTime;
    }
    
    console.log(`Audio dividido en ${segments.length} segmentos`);
    return segments;
    
  } catch (error) {
    console.error("Error al dividir el audio:", error);
    
    // Plan B: Si falla la decodificación, devolver el blob original
    const duration = await getAudioDuration(audioBlob);
    return [{
      blob: audioBlob,
      startTime: 0,
      endTime: duration
    }];
  }
}
