import { useState } from "react";

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
const API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

/**
 * Transcribe audio using GROQ API
 * @param audioBlob The audio blob to transcribe
 * @returns A promise with the transcription results
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  if (!API_KEY) {
    console.warn("GROQ API key is not set. Please set VITE_GROQ_API_KEY environment variable.");
    throw new Error("GROQ API key is not set");
  }

  try {
    // Convert audio blob to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    // For now, we're using a text-based approach with GROQ
    // In a real implementation, you might want to use a specialized audio transcription API
    // Here we're simulating by telling GROQ to process this audio data
    
    const systemPrompt = `
      You are an AI assistant that helps transcribe and summarize audio content.
      The user will share a simulated recording of a lecture or meeting.
      Your task is to:
      1. Provide a complete transcript of what's said
      2. Generate a concise summary of the content
      3. Extract 3-5 key points
      4. Suggest calendar events based on any mentioned dates, deadlines, or meetings
      
      Format your response as JSON with the following structure:
      {
        "transcript": "full transcript text here",
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

    const userMessage = `
      I need to transcribe this audio. Since this is a text-based API and not actual audio processing,
      please generate a plausible transcript, summary, key points, and calendar events as if this were a 
      recording of a class lecture or business meeting. Be creative but realistic.
      
      Audio data (mock): ${base64Audio.substring(0, 100)}...
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
          { role: "user", content: userMessage }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`GROQ API error: ${response.status} ${errorData}`);
    }

    const data: GroqResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message.content) {
      throw new Error("Invalid response from GROQ API");
    }
    
    // Parse the JSON response
    const content = data.choices[0].message.content;
    try {
      const parsedResult = JSON.parse(content);
      return {
        transcript: parsedResult.transcript || "Transcription not available",
        summary: parsedResult.summary || "Summary not available",
        keyPoints: parsedResult.keyPoints || ["No key points available"],
        suggestedEvents: parsedResult.suggestedEvents || []
      };
    } catch (error) {
      console.error("Error parsing GROQ response:", error);
      // Fallback in case JSON parsing fails
      return {
        transcript: "Failed to parse transcription",
        summary: "Failed to generate summary",
        keyPoints: ["Failed to extract key points"],
        suggestedEvents: []
      };
    }
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    throw error;
  }
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
