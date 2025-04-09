
import { useState, useRef, useCallback } from "react";
import { setupAudioAnalysis, analyzeAudioData } from "@/lib/audio-analyzer";
import { processAudioForTranscription } from "@/lib/transcription-processor";

export function useAudioProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const processingIntervalRef = useRef<number | null>(null);
  
  const setupAudioProcessing = useCallback((stream: MediaStream) => {
    const { audioContext, analyser, dataArray, bufferLength, source } = setupAudioAnalysis(stream);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    streamSourceRef.current = source;
    
    return {
      audioContext,
      analyser,
      dataArray,
      bufferLength
    };
  }, []);
  
  const processAudioStream = useCallback((
    onUpdate: (data: { 
      hasVoice: boolean; 
      noiseLevel: number;
      frequencyData: Uint8Array;
    }) => void
  ) => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    processingIntervalRef.current = window.setInterval(() => {
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      
      if (!analyser || !dataArray) return;
      
      const analysisResult = analyzeAudioData(analyser, dataArray);
      onUpdate(analysisResult);
    }, 100);
    
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
    };
  }, []);
  
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
  
  const processAudioFile = async (
    audioBlob: Blob,
    subject?: string,
    onTranscriptionProgress?: (data: any) => void,
    speakerMode: 'single' | 'multiple' = 'single'
  ) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      let progressInterval: number | null = null;
      if (onTranscriptionProgress) {
        progressInterval = window.setInterval(() => {
          setProgress((prev) => {
            const newProgress = Math.min(prev + 5, 90);
            
            if (newProgress > 10 && newProgress % 20 === 0) {
              onTranscriptionProgress({
                output: "Transcribiendo audio..."
              });
            }
            
            return newProgress;
          });
        }, 500);
      }

      // Process the audio file using the extracted module
      const transcriptionResult = await processAudioForTranscription(
        audioBlob, 
        subject, 
        onTranscriptionProgress,
        speakerMode
      );
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      setProgress(100);
      return transcriptionResult;
      
    } catch (error) {
      console.error("Error processing audio:", error);
      
      // Notify about the error
      if (onTranscriptionProgress) {
        onTranscriptionProgress({
          output: "Error al procesar el audio: " + (error.message || "Error desconocido")
        });
      }
      
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
