
import { useState, useRef, useCallback } from "react";
import { transcribeAudio } from "@/lib/groq";

export function useAudioProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const processingIntervalRef = useRef<number | null>(null);
  
  // Audio processing setup
  const setupAudioProcessing = useCallback((stream: MediaStream) => {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    // Create analyser
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    
    // Create buffer
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    dataArrayRef.current = dataArray;
    
    // Connect stream to analyser
    const source = audioContext.createMediaStreamSource(stream);
    streamSourceRef.current = source;
    source.connect(analyser);
    
    return {
      audioContext,
      analyser,
      dataArray,
      bufferLength
    };
  }, []);
  
  // Process audio from stream to detect voice activity and noise levels
  const processAudioStream = useCallback((
    onUpdate: (data: { 
      hasVoice: boolean; 
      noiseLevel: number;
      frequencyData: Uint8Array;
    }) => void
  ) => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    // Start processing loop
    processingIntervalRef.current = window.setInterval(() => {
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      
      if (!analyser || !dataArray) return;
      
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avgLevel = sum / dataArray.length;
      
      // Check for voice (higher frequencies between 300Hz-3000Hz will be stronger)
      // This is a simplified approach, would need more complex processing for accurate voice detection
      const voiceFreqStart = Math.floor(300 * dataArray.length / (analyser.context.sampleRate / 2));
      const voiceFreqEnd = Math.floor(3000 * dataArray.length / (analyser.context.sampleRate / 2));
      
      let voiceSum = 0;
      for (let i = voiceFreqStart; i < voiceFreqEnd; i++) {
        voiceSum += dataArray[i];
      }
      const voiceAvg = voiceSum / (voiceFreqEnd - voiceFreqStart);
      
      // Detect voice if voice frequency average is significantly higher than overall average
      const hasVoice = voiceAvg > 20 && voiceAvg > avgLevel * 1.5;
      
      // Call the update function with the processed data
      onUpdate({
        hasVoice,
        noiseLevel: avgLevel,
        frequencyData: new Uint8Array(dataArray) // Clone array to avoid mutations
      });
    }, 100); // Update at 10Hz
    
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
    };
  }, []);
  
  // Clean up audio processing resources
  const cleanupAudioProcessing = useCallback(() => {
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
    if (streamSourceRef.current) {
      streamSourceRef.current.disconnect();
      streamSourceRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    dataArrayRef.current = null;
  }, []);
  
  // Process completed audio file
  const processAudioFile = async (
    audioBlob: Blob,
    subject?: string,
    onTranscriptionProgress?: (data: any) => void
  ) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate progress updates (since the actual API doesn't provide progress)
      let progressInterval: number | null = null;
      if (onTranscriptionProgress) {
        progressInterval = window.setInterval(() => {
          setProgress((prev) => {
            const newProgress = Math.min(prev + 5, 90);
            
            // Call the progress callback with dummy data to show in UI
            if (newProgress > 10 && newProgress % 20 === 0) {
              onTranscriptionProgress({
                transcript: "Transcripción en progreso...",
                keyPoints: ["Procesando audio..."],
                language: "es",
                summary: "Generando resumen..."
              });
            }
            
            return newProgress;
          });
        }, 500);
      }
      
      // Actually transcribe the audio
      const result = await transcribeAudio(audioBlob, subject);
      
      // Clear the simulated progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      setProgress(100);
      
      return result;
    } catch (error) {
      console.error("Error processing audio:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    isProcessing,
    progress,
    setupAudioProcessing,
    processAudioStream,
    processAudioFile,
    cleanupAudioProcessing
  };
}
