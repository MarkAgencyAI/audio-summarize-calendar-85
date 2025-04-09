
/**
 * Utility functions for audio buffer processing
 */

/**
 * Obtiene la duración en segundos de un blob de audio
 */
export async function getAudioDuration(audioBlob: Blob): Promise<number> {
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
 * Escribe una cadena UTF8 en un DataView
 */
export function writeUTFBytes(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Convierte un AudioBuffer a un Blob en formato WAV
 */
export async function audioBufferToWav(buffer: AudioBuffer, mimeType: string): Promise<Blob> {
  // Función para escribir una cadena UTF8 en un DataView
  
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
  writeUTFBytes(view, 0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeUTFBytes(view, 8, 'WAVE');
  
  // Escribir cabecera fmt
  writeUTFBytes(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // tamaño del bloque fmt
  view.setUint16(20, format, true); // formato PCM
  view.setUint16(22, numChannels, true); // número de canales
  view.setUint32(24, sampleRate, true); // frecuencia de muestreo
  view.setUint32(28, byteRate, true); // byte rate
  view.setUint16(32, blockAlign, true); // block align
  view.setUint16(34, bitDepth, true); // bits por muestra
  
  // Escribir cabecera data
  writeUTFBytes(view, 36, 'data');
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
 * Convierte un buffer a formato WAV
 */
export function bufferToWave(buffer: AudioBuffer, start: number, end: number): ArrayBuffer {
  const numOfChan = buffer.numberOfChannels;
  const length = (end - start) * numOfChan * 2 + 44;
  const result = new ArrayBuffer(length);
  const view = new DataView(result);
  
  // RIFF chunk descriptor
  writeUTFBytes(view, 0, 'RIFF');
  view.setUint32(4, length - 8, true);
  writeUTFBytes(view, 8, 'WAVE');
  
  // FMT sub-chunk
  writeUTFBytes(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numOfChan, true); // # channels
  view.setUint32(24, buffer.sampleRate, true); // sample rate
  view.setUint32(28, buffer.sampleRate * numOfChan * 2, true); // byte rate
  view.setUint16(32, numOfChan * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  
  // Data sub-chunk
  writeUTFBytes(view, 36, 'data');
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

/**
 * Convierte un AudioBuffer a Blob (método alternativo)
 * @deprecated Usar audioBufferToWav en su lugar
 */
export async function audioBufferToBlob(buffer: AudioBuffer, mimeType: string): Promise<Blob> {
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
      const wavBlob = bufferToWave(renderedBuffer, 0, renderedBuffer.length);
      resolve(new Blob([wavBlob], { type: mimeType || 'audio/wav' }));
    });
  });
}
