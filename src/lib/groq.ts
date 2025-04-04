
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

// Default models
const LLAMA3_MODEL = "llama3-70b-8192";

// Use environment variables if available
const API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

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
