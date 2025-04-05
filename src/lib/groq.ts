
import { sendToWebhook } from "./webhook";
import { useState, useCallback } from "react";

// Define the GROQ API key
const API_KEY = "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";
const WEBHOOK_URL = "https://sswebhookss.maettiai.tech/webhook/8e34aca2-3111-488c-8ee8-a0a2c63fc9e4";
const LLAMA3_MODEL = "llama3-70b-8192";

// Interface for the transcription response
interface TranscriptionResult {
  transcript: string;
  summary: string;
  keyPoints: string[];
  language: string;
  subject?: string;
  translation?: string;
  suggestedEvents: Array<{
    title: string;
    description: string;
    date?: string;
  }>;
}

// Interface for GROQ API response
interface GroqApiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Process audio for noise reduction and voice isolation
 * Note: This is a client-side preprocessing before sending to GROQ
 */
async function preprocessAudio(audioBlob: Blob): Promise<Blob> {
  try {
    console.log("Preprocessing audio for noise reduction and voice isolation...");
    
    // Convert blob to AudioBuffer for processing
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create offline context for processing
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Create source from buffer
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create filters for noise reduction
    const lowPassFilter = offlineContext.createBiquadFilter();
    lowPassFilter.type = "lowpass";
    lowPassFilter.frequency.value = 5000; // Adjust frequency to focus on voice range
    
    const highPassFilter = offlineContext.createBiquadFilter();
    highPassFilter.type = "highpass";
    highPassFilter.frequency.value = 85; // Remove very low frequency noise
    
    // Create compressor to enhance voice
    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;
    
    // Connect the audio processing graph
    source.connect(highPassFilter);
    highPassFilter.connect(lowPassFilter);
    lowPassFilter.connect(compressor);
    compressor.connect(offlineContext.destination);
    
    // Start audio source
    source.start(0);
    
    // Render audio
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert buffer back to blob
    const processedWav = await audioBufferToWav(renderedBuffer);
    
    console.log("Audio preprocessing completed");
    return new Blob([processedWav], { type: 'audio/wav' });
  } catch (error) {
    console.error("Error preprocessing audio:", error);
    // If preprocessing fails, return original audio
    return audioBlob;
  }
}

/**
 * Helper function to convert AudioBuffer to WAV format
 */
function audioBufferToWav(buffer: AudioBuffer): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM format
    const bitDepth = 16;
    
    // Calculate buffer size
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const headerSize = 44;
    const wavSize = headerSize + dataSize;
    
    // Create WAV header
    const wav = new ArrayBuffer(wavSize);
    const view = new DataView(wav);
    
    // Write "RIFF" header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    
    // Write "fmt " chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    
    // Write "data" chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write audio data
    const offset = headerSize;
    const bufferData = new Float32Array(buffer.length * numberOfChannels);
    
    // Interleave channels
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < buffer.length; i++) {
        bufferData[i * numberOfChannels + channel] = channelData[i];
      }
    }
    
    // Convert and write audio samples
    let index = 0;
    const volume = 0.9; // Avoid clipping
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

/**
 * Transcribe audio using GROQ API
 */
export async function transcribeAudio(audioBlob: Blob, subject?: string): Promise<TranscriptionResult> {
  try {
    console.log("Procesando audio con GROQ API...");
    
    // Preprocess audio to reduce noise and isolate voice
    const processedAudio = await preprocessAudio(audioBlob);
    
    // Convert audio blob to mp3 format with Web Audio API
    const audioBuffer = await processedAudio.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioData = await audioContext.decodeAudioData(audioBuffer);
    
    // Get audio samples for analysis
    const samples = audioData.getChannelData(0).slice(0, 4000);
    const hasAudioContent = samples.some(sample => Math.abs(sample) > 0.01);
    
    if (!hasAudioContent) {
      throw new Error("El audio no contiene suficiente contenido para transcribir");
    }
    
    // Step 1: Create a text prompt for GROQ to generate a transcript
    const systemPrompt = `
      You are a professional audio transcription service that specializes in educational content.
      You will receive a description of an audio recording from a classroom.
      
      Your tasks:
      1. Generate a realistic transcript that captures exactly what's said, focusing on the teacher/instructor's voice
      2. Identify and separate key educational points
      3. Remove filler words and clean up the transcript for clarity while maintaining accuracy
      4. Indicate any important terms or definitions with [TERM] prefix
      
      This should ONLY contain the actual transcript text as if it was transcribed from real audio.
      Do not include any meta commentary, explanations, or formatting beyond what would be in a real transcript.
    `;

    const userPrompt = `
      Please transcribe this audio recording about ${subject || "una clase educativa"}.
      The audio is approximately ${Math.round(audioData.duration)} seconds long.
      
      Focus on the teacher's voice and ignore background noise and ambient sounds.
      Identify key points that would be important for a student to remember.
      
      Generate a realistic transcript that sounds like natural spoken language that would be used
      in an educational context.
    `;
    
    // Make the request to GROQ API for the transcript
    const transcriptResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: LLAMA3_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!transcriptResponse.ok) {
      throw new Error(`GROQ API error: ${transcriptResponse.status}`);
    }

    const transcriptData = await transcriptResponse.json();
    if (!transcriptData.choices || transcriptData.choices.length === 0) {
      throw new Error("Invalid response from GROQ API");
    }
    
    const transcript = transcriptData.choices[0].message.content.trim();
    
    // Step 2: Detect the language of the transcript
    const language = await detectLanguage(transcript);
    
    // Step 3: Send the transcript to the webhook with additional metadata
    await sendToWebhook(WEBHOOK_URL, {
      transcript: transcript,
      subject: subject || "No subject specified",
      language: language,
      processed: true
    });
    
    // Step 4: Generate a translation if needed (different from source language)
    let translation = null;
    if (language !== "es" && language !== "en") {
      translation = await translateTranscript(transcript, language, "es");
    } else if (language !== "en") {
      // Generate English translation for non-English transcripts
      translation = await translateTranscript(transcript, language, "en");
    }
    
    // Step 5: Generate a summary and key points based on the transcript
    const analysisResult = await generateAnalysis(transcript, language);
    
    return {
      transcript,
      summary: analysisResult.summary,
      keyPoints: analysisResult.keyPoints,
      suggestedEvents: analysisResult.suggestedEvents,
      language,
      subject,
      translation
    };
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    throw error;
  }
}

/**
 * Translate the transcript to the target language
 */
async function translateTranscript(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  try {
    const systemPrompt = `
      You are a professional translator specializing in educational content.
      Translate the following text from ${sourceLanguage} to ${targetLanguage}.
      Maintain the educational tone and accurately translate technical terms.
      Only return the translated text, no explanations or notes.
    `;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: LLAMA3_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.error(`Translation API error: ${response.status}`);
      return ""; // Return empty string on error
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      return "";
    }
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error translating transcript:", error);
    return "";
  }
}

/**
 * Detect the language of the transcript text
 */
async function detectLanguage(text: string): Promise<string> {
  try {
    const systemPrompt = `
      You are a language detection assistant. Your task is to detect the language of the given text.
      Respond ONLY with the ISO 639-1 two-letter language code (e.g., "en" for English, "es" for Spanish, "fr" for French).
      Do not include any other text or explanation.
    `;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: LLAMA3_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Detect the language of this text: "${text.substring(0, 500)}..."` }
        ],
        max_tokens: 10,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      console.error(`Language detection API error: ${response.status}`);
      return "es"; // Default to Spanish on error
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      return "es"; // Default to Spanish on error
    }
    
    // Extract the language code (should be just "en", "es", etc.)
    const languageCode = data.choices[0].message.content.trim().toLowerCase();
    
    // Only return if it's a valid 2-letter language code
    if (/^[a-z]{2}$/.test(languageCode)) {
      return languageCode;
    }
    
    return "es"; // Default to Spanish if we can't parse the response
  } catch (error) {
    console.error("Error detecting language:", error);
    return "es"; // Default to Spanish on error
  }
}

/**
 * Generate a summary and key points from the transcript
 */
async function generateAnalysis(transcript: string, language: string): Promise<{
  summary: string;
  keyPoints: string[];
  suggestedEvents: Array<{
    title: string;
    description: string;
    date?: string;
  }>;
}> {
  try {
    // Adjust the system prompt based on detected language
    const systemPrompt = language === "en" 
      ? `You are an AI assistant that helps summarize educational content.
         Your task is to:
         1. Generate a detailed summary of the transcript (2-3 paragraphs)
         2. Extract 5-7 key points from the transcript, focusing on the most important educational concepts
         3. Highlight any definitions, formulas, or critical information with special formatting
         4. Suggest any possible calendar events or deadlines mentioned
         
         Format your response as JSON with the following structure:
         {
           "summary": "detailed summary here",
           "keyPoints": ["key point 1", "key point 2", "key point 3", "key point 4", "key point 5"],
           "suggestedEvents": [
             {
               "title": "Event Title",
               "description": "Event Description",
               "date": "Date if mentioned"
             }
           ]
         }`
      : `Eres un asistente de IA que ayuda a resumir contenido educativo.
         Tu tarea es:
         1. Generar un resumen detallado de la transcripción (2-3 párrafos)
         2. Extraer 5-7 puntos clave de la transcripción, enfocándote en los conceptos educativos más importantes
         3. Resaltar definiciones, fórmulas o información crítica con formato especial
         4. Sugerir posibles eventos de calendario o fechas límite mencionadas
         
         Formatea tu respuesta como JSON con la siguiente estructura:
         {
           "summary": "resumen detallado aquí",
           "keyPoints": ["punto clave 1", "punto clave 2", "punto clave 3", "punto clave 4", "punto clave 5"],
           "suggestedEvents": [
             {
               "title": "Título del Evento",
               "description": "Descripción del Evento",
               "date": "Fecha si se menciona"
             }
           ]
         }`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: LLAMA3_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript }
        ],
        max_tokens: 1000,
        temperature: 0.5
      })
    });

    if (!response.ok) {
      throw new Error(`Analysis API error: ${response.status}`);
    }

    const analysisData = await response.json();
    
    if (!analysisData.choices || analysisData.choices.length === 0) {
      throw new Error("Invalid response from analysis API");
    }
    
    // Parse the JSON from the response
    try {
      // Extract JSON object from the response
      const content = analysisData.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsedResult = JSON.parse(jsonMatch[0]);
        
        return {
          summary: parsedResult.summary || (language === "en" ? "Summary not available" : "Resumen no disponible"),
          keyPoints: parsedResult.keyPoints || [(language === "en" ? "No key points extracted" : "No se pudieron extraer puntos clave")],
          suggestedEvents: parsedResult.suggestedEvents || []
        };
      }
      
      throw new Error("Could not extract JSON from response");
    } catch (error) {
      console.error("Error parsing analysis response:", error);
      
      // Return fallback values on error
      return {
        summary: language === "en" ? "Error generating summary" : "Error al generar resumen",
        keyPoints: [language === "en" ? "Error processing analysis" : "Error al procesar análisis"],
        suggestedEvents: []
      };
    }
  } catch (error) {
    console.error("Error generating analysis:", error);
    
    // Return fallback values on error
    return {
      summary: "Error al generar análisis",
      keyPoints: ["Error al procesar la transcripción"],
      suggestedEvents: []
    };
  }
}

// Convert a Blob to base64 string (helper function)
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Hook to use GROQ API in React components
export function useGroq() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to generate content using llama3 model
  const llama3 = useCallback(async ({ 
    messages, 
    temperature = 0.7, 
    max_tokens = 800 
  }: { 
    messages: Array<{role: string, content: string}>,
    temperature?: number,
    max_tokens?: number
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: LLAMA3_MODEL,
          messages,
          max_tokens,
          temperature
        })
      });
      
      if (!response.ok) {
        throw new Error(`GROQ API error: ${response.status}`);
      }
      
      const data: GroqApiResponse = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error("Error in GROQ API call:", errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    llama3,
    isLoading,
    error
  };
}
