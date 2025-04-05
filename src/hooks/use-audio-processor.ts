import { useState, useRef, useCallback } from "react";
import { transcribeAudio } from "@/lib/groq";
import { sendToWebhook } from "@/lib/webhook";

export function useAudioProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const processingIntervalRef = useRef<number | null>(null);
  
  const setupAudioProcessing = useCallback((stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    dataArrayRef.current = dataArray;
    
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
      
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avgLevel = sum / dataArray.length;
      
      const voiceFreqStart = Math.floor(300 * dataArray.length / (analyser.context.sampleRate / 2));
      const voiceFreqEnd = Math.floor(3000 * dataArray.length / (analyser.context.sampleRate / 2));
      
      let voiceSum = 0;
      for (let i = voiceFreqStart; i < voiceFreqEnd; i++) {
        voiceSum += dataArray[i];
      }
      const voiceAvg = voiceSum / (voiceFreqEnd - voiceFreqStart);
      
      const hasVoice = voiceAvg > 20 && voiceAvg > avgLevel * 1.5;
      
      onUpdate({
        hasVoice,
        noiseLevel: avgLevel,
        frequencyData: new Uint8Array(dataArray)
      });
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
    onTranscriptionProgress?: (data: any) => void
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

      // Transcribe the audio with Groq
      const transcriptionResult = await transcribeAudio(audioBlob, subject);
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      setProgress(95);
      
      // Prepare data for webhook
      const webhookData = {
        transcript: transcriptionResult.transcript,
        language: transcriptionResult.language || "es",
        subject: subject || "Sin materia",
        processed: true
      };
      
      // Notify that we're waiting for webhook
      if (onTranscriptionProgress) {
        onTranscriptionProgress({
          output: "Esperando respuesta del webhook..."
        });
      }
      
      // Send data to webhook - use the constant URL
      const WEBHOOK_URL = "https://sswebhookss.maettiai.tech/webhook/8e34aca2-3111-488c-8ee8-a0a2c63fc9e4";
      await sendToWebhook(WEBHOOK_URL, webhookData);
      
      // The webhook.ts file will dispatch an event with the raw response
      
      setProgress(100);
      
      // Return the Groq transcription result as a fallback
      return transcriptionResult;
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
