
/**
 * This module handles audio analysis including voice detection and noise level calculation
 */
export interface AudioAnalysisResult {
  hasVoice: boolean;
  noiseLevel: number;
  frequencyData: Uint8Array;
}

/**
 * Set up audio analysis components (analyzer node, etc.)
 */
export function setupAudioAnalysis(stream: MediaStream) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  
  return {
    audioContext,
    analyser,
    dataArray,
    bufferLength,
    source
  };
}

/**
 * Analyze audio data to detect voice and calculate noise levels
 */
export function analyzeAudioData(
  analyser: AnalyserNode,
  dataArray: Uint8Array
): AudioAnalysisResult {
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
  
  return {
    hasVoice,
    noiseLevel: avgLevel,
    frequencyData: new Uint8Array(dataArray)
  };
}
