
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

interface AudioChunk {
  blob: Blob;
  startTime: number;
  endTime: number;
}

/**
 * Simulates file system operations for React Native FFmpeg in a web environment
 */
const FileSystem = {
  // In-memory file system for web environment
  fileMap: new Map<string, Uint8Array>(),

  // Write data to our in-memory file system
  writeFile: async (path: string, data: Uint8Array): Promise<void> => {
    FileSystem.fileMap.set(path, data);
    console.log(`File written to ${path}`);
    return Promise.resolve();
  },

  // Read data from our in-memory file system
  readFile: async (path: string): Promise<Uint8Array> => {
    const data = FileSystem.fileMap.get(path);
    if (!data) {
      throw new Error(`File not found: ${path}`);
    }
    return Promise.resolve(data);
  },

  // Delete file from our in-memory file system
  deleteFile: async (path: string): Promise<void> => {
    FileSystem.fileMap.delete(path);
    console.log(`File deleted: ${path}`);
    return Promise.resolve();
  },
};

/**
 * Splits an audio file into chunks of specified duration (in seconds)
 */
export async function splitAudioFile(
  audioBlob: Blob,
  maxChunkDuration: number = 600 // 10 minutes in seconds
): Promise<AudioChunk[]> {
  // First, convert Blob to ArrayBuffer
  const arrayBuffer = await audioBlob.arrayBuffer();
  
  // Create a temporary file from the blob
  const audioFile = new Uint8Array(arrayBuffer);
  const tempFileName = `temp_audio_${Date.now()}`;
  const outputPrefix = `chunk_${Date.now()}_`;
  
  try {
    // Write the audio data to our in-memory file system
    await FileSystem.writeFile(tempFileName, audioFile);
    
    // Get audio duration
    const probeSession = await FFmpegKit.execute(`-i ${tempFileName} -f null -`);
    const output = await probeSession.getOutput();
    
    // Parse duration from FFmpeg output
    let duration = 0;
    const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1]);
      const minutes = parseInt(durationMatch[2]);
      const seconds = parseInt(durationMatch[3]);
      duration = hours * 3600 + minutes * 60 + seconds;
    } else {
      throw new Error("Could not determine audio duration");
    }
    
    console.log(`Audio duration: ${duration} seconds`);
    
    // If duration is less than the maximum chunk size, return the original blob
    if (duration <= maxChunkDuration) {
      return [{
        blob: audioBlob,
        startTime: 0,
        endTime: duration
      }];
    }
    
    // Calculate number of chunks needed
    const numChunks = Math.ceil(duration / maxChunkDuration);
    console.log(`Splitting audio into ${numChunks} chunks`);
    
    const chunks: AudioChunk[] = [];
    
    // Split audio into chunks
    for (let i = 0; i < numChunks; i++) {
      const startTime = i * maxChunkDuration;
      const endTime = Math.min(startTime + maxChunkDuration, duration);
      const outputFileName = `${outputPrefix}${i}.webm`;
      
      // Execute FFmpeg command to split audio
      const session = await FFmpegKit.execute(
        `-i ${tempFileName} -ss ${startTime} -to ${endTime} -c copy ${outputFileName}`
      );
      
      const returnCode = await session.getReturnCode();
      if (!ReturnCode.isSuccess(returnCode)) {
        throw new Error(`Error splitting audio chunk ${i}: ${await session.getOutput()}`);
      }
      
      // Read the chunk file as bytes
      const chunkData = await FileSystem.readFile(outputFileName);
      
      // Convert to Blob
      const chunkBlob = new Blob([chunkData], { type: audioBlob.type });
      chunks.push({
        blob: chunkBlob,
        startTime,
        endTime
      });
      
      // Delete the output file to save space
      await FileSystem.deleteFile(outputFileName);
    }
    
    // Delete the temporary file
    await FileSystem.deleteFile(tempFileName);
    
    console.log(`Audio split into ${chunks.length} chunks successfully`);
    return chunks;
  } catch (error) {
    console.error("Error splitting audio:", error);
    throw error;
  }
}
