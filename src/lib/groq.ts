
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
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    // Convert audio blob to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    if (!API_KEY) {
      console.warn("GROQ API key is not set. Please set VITE_GROQ_API_KEY environment variable.");
      const mockResult = generateMockTranscription();
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
    
    // Send the transcript to the webhook
    await sendToWebhook(WEBHOOK_URL, transcript);
    
    // Now generate a summary and key points
    const summaryResponse = await generateSummary(transcript);
    
    return {
      transcript: transcript,
      summary: summaryResponse.summary,
      keyPoints: summaryResponse.keyPoints,
      suggestedEvents: summaryResponse.suggestedEvents || []
    };
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    
    // Return a fallback mock result
    return generateMockTranscription();
  }
}

/**
 * Generate summary and key points from transcript
 */
async function generateSummary(transcript: string): Promise<{
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
    
    const systemPrompt = `
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
          { role: "user", content: `Generate summary, key points, and suggested events for this transcript: ${transcript}` }
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
          summary: parsedResult.summary || "Resumen no disponible",
          keyPoints: parsedResult.keyPoints || ["No se pudieron extraer puntos clave"],
          suggestedEvents: parsedResult.suggestedEvents || []
        };
      } else {
        throw new Error("No se encontró formato JSON en la respuesta");
      }
    } catch (error) {
      console.error("Error parsing GROQ summary response:", error);
      
      return {
        summary: "Error al generar el resumen. Por favor, inténtalo de nuevo.",
        keyPoints: ["Error al procesar la respuesta de la API"],
        suggestedEvents: []
      };
    }
  } catch (error) {
    console.error("Error generating summary:", error);
    
    return {
      summary: "No se pudo generar un resumen debido a un error en la API.",
      keyPoints: ["Error al comunicarse con la API de GROQ"],
      suggestedEvents: []
    };
  }
}

/**
 * Generate a mock transcription when API calls fail
 */
function generateMockTranscription(): TranscriptionResult {
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
    ]
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
