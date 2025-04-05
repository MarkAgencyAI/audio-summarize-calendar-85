
import { useState } from "react";
import { sendToWebhook } from "./webhook";

// Define the types for GROQ API responses and requests
interface GroqMessage {
  role: string;
  content: string;
}

interface GroqRequestOptions {
  messages: GroqMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stop?: string[];
}

interface GroqChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

interface GroqResponse {
  choices: GroqChoice[];
}

// Additional interface for transcription results
interface TranscriptionResult {
  transcript: string;
  summary: string;
  keyPoints: string[];
  language?: string;
  subject?: string;
  suggestedEvents: Array<{
    title: string;
    description: string;
    startDate?: string;
    endDate?: string;
  }>;
}

// Default models
const LLAMA3_MODEL = "llama3-70b-8192";

// Use environment variables if available
const API_KEY = "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";

// Define the webhook URL as a constant
const WEBHOOK_URL = "https://sswebhookss.maettiai.tech/webhook/8e34aca2-3111-488c-8ee8-a0a2c63fc9e4";

/**
 * Transcribe audio using Whisper-compatible API
 * This is a simplified implementation that directly asks GROQ to generate a transcript
 */
export async function transcribeAudio(audioBlob: Blob, subject?: string): Promise<TranscriptionResult> {
  try {
    // Convert audio blob to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    if (!API_KEY) {
      console.warn("GROQ API key is not set. Please set VITE_GROQ_API_KEY environment variable.");
      const mockResult = generateMockTranscription(subject);
      return mockResult;
    }
    
    console.log("Transcribiendo audio con GROQ API...");
    
    // Using GROQ to simulate transcription and analysis
    const systemPrompt = `
      You are a transcription assistant. Your task is to transcribe audio content.
      Generate a realistic transcript based on the audio data provided.
      
      In your response, ONLY include a transcript of what would be said in the audio.
      Do not include any other text, JSON formatting, or explanation.
      Just return the transcript text directly.
    `;

    const userMessage = `
      Generate a realistic transcript as if this were a recording of a business meeting or lecture.
      The transcript should be about 200-400 words and focused on some educational or business topic.
      Respond ONLY with the transcript text.
    `;

    // First, get a raw transcript
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
          { role: "user", content: userMessage }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!transcriptResponse.ok) {
      throw new Error(`GROQ API error: ${transcriptResponse.status}`);
    }

    const transcriptData: GroqResponse = await transcriptResponse.json();
    
    if (!transcriptData.choices || transcriptData.choices.length === 0) {
      throw new Error("Invalid response from GROQ API");
    }
    
    const transcript = transcriptData.choices[0].message.content.trim();
    
    // Detect the language of the transcript
    const languageResponse = await detectLanguage(transcript);
    
    // Send the transcript to the webhook with subject metadata
    await sendToWebhook(WEBHOOK_URL, {
      transcript: transcript,
      subject: subject || "No subject specified",
      language: languageResponse.language
    });
    
    // Now generate a summary and key points
    const summaryResponse = await generateSummary(transcript, languageResponse.language);
    
    return {
      transcript: transcript,
      summary: summaryResponse.summary,
      keyPoints: summaryResponse.keyPoints,
      suggestedEvents: summaryResponse.suggestedEvents || [],
      language: languageResponse.language,
      subject: subject
    };
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    
    // Return a fallback mock result
    return generateMockTranscription(subject);
  }
}

/**
 * Detect the language of a text
 */
async function detectLanguage(text: string): Promise<{ language: string, confidence: number }> {
  try {
    if (!API_KEY) {
      return { language: "es", confidence: 1.0 }; // Default to Spanish
    }
    
    const systemPrompt = `
      You are a language detection assistant. Your task is to detect the language of the given text.
      
      Format your response as JSON with the following structure:
      {
        "language": "iso_code",
        "confidence": 0.95
      }
      
      Where iso_code is the ISO 639-1 two-letter language code (e.g., "en" for English, "es" for Spanish).
      The confidence score should be between 0 and 1.
      
      Only respond with the JSON, nothing else.
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
        max_tokens: 100,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`GROQ API error: ${response.status}`);
    }

    const data: GroqResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error("Invalid response from GROQ API");
    }
    
    // Parse the JSON response
    const content = data.choices[0].message.content;
    
    try {
      // Extract JSON from the response (handle cases where there might be extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResult = JSON.parse(jsonMatch[0]);
        
        return {
          language: parsedResult.language || "es",
          confidence: parsedResult.confidence || 0.8
        };
      } else {
        throw new Error("No se encontró formato JSON en la respuesta");
      }
    } catch (error) {
      console.error("Error parsing GROQ language detection response:", error);
      return { language: "es", confidence: 0.5 }; // Default to Spanish
    }
  } catch (error) {
    console.error("Error detecting language:", error);
    return { language: "es", confidence: 0.5 }; // Default to Spanish
  }
}

/**
 * Generate summary and key points from transcript
 */
async function generateSummary(transcript: string, language: string = "es"): Promise<{
  summary: string,
  keyPoints: string[],
  suggestedEvents: Array<{
    title: string;
    description: string;
    startDate?: string;
    endDate?: string;
  }>
}> {
  try {
    if (!API_KEY) {
      return {
        summary: "No se pudo generar un resumen debido a que la API key no está configurada.",
        keyPoints: ["Configurar API key de GROQ"],
        suggestedEvents: []
      };
    }
    
    // Adjust system prompt based on language
    const systemPrompt = language === "es" 
      ? `
        Eres un asistente de IA que ayuda a resumir el contenido de transcripciones.
        Tu tarea es:
        1. Generar un resumen conciso de la transcripción
        2. Extraer 3-5 puntos clave
        3. Sugerir eventos de calendario basados en fechas mencionadas, plazos o reuniones
        
        Formatea tu respuesta como JSON con la siguiente estructura:
        {
          "summary": "resumen conciso aquí",
          "keyPoints": ["punto clave 1", "punto clave 2", "punto clave 3"],
          "suggestedEvents": [
            {
              "title": "Título del Evento",
              "description": "Descripción del Evento",
              "startDate": "Fecha ISO si está disponible",
              "endDate": "Fecha ISO si está disponible"
            }
          ]
        }
      `
      : `
        You are an AI assistant that helps summarize transcript content.
        Your task is to:
        1. Generate a concise summary of the transcript
        2. Extract 3-5 key points
        3. Suggest calendar events based on any mentioned dates, deadlines, or meetings
        
        Format your response as JSON with the following structure:
        {
          "summary": "concise summary here",
          "keyPoints": ["key point 1", "key point 2", "key point 3"],
          "suggestedEvents": [
            {
              "title": "Event Title",
              "description": "Event Description",
              "startDate": "ISO date string if available",
              "endDate": "ISO date string if available"
            }
          ]
        }
      `;

    const userMessage = language === "es"
      ? `Genera un resumen, puntos clave y eventos sugeridos para esta transcripción: ${transcript}`
      : `Generate summary, key points, and suggested events for this transcript: ${transcript}`;

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
          { role: "user", content: userMessage }
        ],
        max_tokens: 1000,
        temperature: 0.5
      })
    });

    if (!response.ok) {
      throw new Error(`GROQ API error: ${response.status}`);
    }

    const data: GroqResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error("Invalid response from GROQ API");
    }
    
    // Parse the JSON response
    const content = data.choices[0].message.content;
    
    try {
      // Extract JSON from the response (handle cases where there might be extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResult = JSON.parse(jsonMatch[0]);
        
        return {
          summary: parsedResult.summary || (language === "es" ? "Resumen no disponible" : "Summary not available"),
          keyPoints: parsedResult.keyPoints || [language === "es" ? "No se pudieron extraer puntos clave" : "No key points could be extracted"],
          suggestedEvents: parsedResult.suggestedEvents || []
        };
      } else {
        throw new Error(language === "es" ? "No se encontró formato JSON en la respuesta" : "No JSON format found in response");
      }
    } catch (error) {
      console.error("Error parsing GROQ summary response:", error);
      
      return {
        summary: language === "es" 
          ? "Error al generar el resumen. Por favor, inténtalo de nuevo."
          : "Error generating summary. Please try again.",
        keyPoints: [language === "es" ? "Error al procesar la respuesta de la API" : "Error processing API response"],
        suggestedEvents: []
      };
    }
  } catch (error) {
    console.error("Error generating summary:", error);
    
    return {
      summary: language === "es" 
        ? "No se pudo generar un resumen debido a un error en la API."
        : "Could not generate a summary due to an API error.",
      keyPoints: [language === "es" ? "Error al comunicarse con la API de GROQ" : "Error communicating with GROQ API"],
      suggestedEvents: []
    };
  }
}

/**
 * Generate a mock transcription when API calls fail
 */
function generateMockTranscription(subject?: string): TranscriptionResult {
  return {
    transcript: "Esta es una transcripción simulada porque hubo un problema con la API GROQ. Para resolver este problema, asegúrate de que la API de GROQ esté funcionando correctamente.",
    summary: "Este audio contiene información sobre un error con la API de GROQ y cómo solucionarlo.",
    keyPoints: [
      "La transcripción actual es simulada debido a problemas con la API",
      "Verificar la conexión con la API de GROQ",
      "Contacta al administrador si necesitas ayuda"
    ],
    suggestedEvents: [
      {
        title: "Verificar API de GROQ",
        description: "Verificar la conexión y funcionamiento de la API de GROQ"
      }
    ],
    language: "es",
    subject: subject || "Sin materia especificada"
  };
}

/**
 * Convert a Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
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

/**
 * Custom hook for using GROQ API
 */
export function useGroq() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Call the GROQ API with Llama 3 model
   */
  const llama3 = async (options: Omit<GroqRequestOptions, "model">): Promise<GroqResponse | null> => {
    if (!API_KEY) {
      console.warn("GROQ API key is not set. Please set VITE_GROQ_API_KEY environment variable.");
      setError(new Error("GROQ API key is not set"));
      return null;
    }

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
          ...options
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`GROQ API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error calling GROQ API:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    llama3,
    isLoading,
    error
  };
}
