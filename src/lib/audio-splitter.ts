
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

interface AudioChunk {
  blob: Blob;
  startTime: number;
  endTime: number;
}

// Simple in-memory file system for web environment
const FileSystem = {
  fileMap: new Map<string, Uint8Array>(),
  
  writeFile: async (path: string, data: Uint8Array): Promise<void> => {
    FileSystem.fileMap.set(path, data);
    console.log(`File written to ${path}`);
    return Promise.resolve();
  },
  
  readFile: async (path: string): Promise<Uint8Array> => {
    const data = FileSystem.fileMap.get(path);
    if (!data) {
      throw new Error(`File not found: ${path}`);
    }
    return Promise.resolve(data);
  },
  
  deleteFile: async (path: string): Promise<void> => {
    FileSystem.fileMap.delete(path);
    console.log(`File deleted: ${path}`);
    return Promise.resolve();
  },
  
  listFiles: async (prefix: string): Promise<string[]> => {
    return Array.from(FileSystem.fileMap.keys())
      .filter(key => key.startsWith(prefix))
      .sort();
  }
};

/**
 * Splits an audio file into chunks of specified duration (in seconds)
 * @param audioBlob The audio file to split
 * @param maxChunkDuration Maximum duration of each chunk in seconds (default: 5 minutes)
 * @returns Array of audio chunks with blob and time information
 */
export async function splitAudioFile(
  audioBlob: Blob,
  maxChunkDuration: number = 300 // 5 minutes in seconds for better processing
): Promise<AudioChunk[]> {
  // First, convert Blob to ArrayBuffer
  const arrayBuffer = await audioBlob.arrayBuffer();
  
  // Create a temporary file from the blob
  const audioFile = new Uint8Array(arrayBuffer);
  const timestamp = Date.now();
  const tempFileName = `temp_audio_${timestamp}`;
  const outputPrefix = `chunk_${timestamp}_`;
  
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
    
    // Use the segment filter to automatically split the audio into chunks
    // This is more efficient than manually splitting
    const segmentCommand = `-i ${tempFileName} -f segment -segment_time ${maxChunkDuration} -c copy ${outputPrefix}%03d`;
    
    console.log(`Executing segment command: ${segmentCommand}`);
    const segmentSession = await FFmpegKit.execute(segmentCommand);
    
    const returnCode = await segmentSession.getReturnCode();
    if (!ReturnCode.isSuccess(returnCode)) {
      console.error(`Error in segmentation: ${await segmentSession.getOutput()}`);
      throw new Error("Failed to segment audio file");
    }
    
    // Find all segment files
    const segmentFiles = await FileSystem.listFiles(outputPrefix);
    console.log(`Created ${segmentFiles.length} segments`);
    
    // Process each segment
    const chunks: AudioChunk[] = [];
    
    for (let i = 0; i < segmentFiles.length; i++) {
      const fileName = segmentFiles[i];
      const startTime = i * maxChunkDuration;
      const endTime = Math.min(startTime + maxChunkDuration, duration);
      
      // Read the segment file data
      const segmentData = await FileSystem.readFile(fileName);
      
      // Convert to blob with same type as input
      const chunkBlob = new Blob([segmentData], { type: audioBlob.type });
      
      chunks.push({
        blob: chunkBlob,
        startTime,
        endTime
      });
      
      // Clean up the segment file
      await FileSystem.deleteFile(fileName);
    }
    
    // Delete the temporary input file
    await FileSystem.deleteFile(tempFileName);
    
    console.log(`Audio successfully split into ${chunks.length} chunks`);
    return chunks;
    
  } catch (error) {
    console.error("Error splitting audio:", error);
    throw error;
  }
}
