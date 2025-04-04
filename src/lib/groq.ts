
import axios from "axios";

// API key para Groq
const GROQ_API_KEY = "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";

export interface TranscriptionResult {
  transcript: string;
  summary: string;
  keyPoints: string[];
  suggestedEvents: {
    title: string;
    description: string;
    date?: string;
  }[];
}

export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    // Convertir el audio blob a un archivo para enviarlo a la API
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("language", "es");
    
    // Llamada a la API de Groq para transcribir el audio
    const response = await axios.post(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      formData,
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    
    // Obtener la transcripción del audio
    const transcript = response.data.text;
    
    // Una vez obtenida la transcripción, enviarla a Groq LLM para analizar
    // y extraer el resumen, puntos clave y eventos sugeridos
    const analysisResult = await analyzeTranscription(transcript);
    
    return {
      transcript,
      summary: analysisResult.summary,
      keyPoints: analysisResult.keyPoints,
      suggestedEvents: analysisResult.suggestedEvents,
    };
  } catch (error) {
    console.error("Error transcribiendo audio:", error);
    throw new Error("Error al transcribir el audio. Por favor, intenta nuevamente.");
  }
}

async function analyzeTranscription(transcript: string): Promise<Omit<TranscriptionResult, "transcript">> {
  try {
    // Llamada a la API de Groq para analizar la transcripción con un mejor modelo
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192", // Usando un modelo más potente para mejores resúmenes
        messages: [
          {
            role: "system",
            content: `Eres un asistente especializado en analizar transcripciones de audio en español.
            Tu tarea es:
            1. Crear un resumen completo y detallado (2-3 párrafos) que capture los puntos más importantes
            2. Extraer 5-7 puntos clave de la conversación, ordenados por importancia
            3. Sugerir posibles eventos para agendar basados en fechas, horas o reuniones mencionadas
            4. Identificar conceptos importantes o términos técnicos mencionados
            
            El formato de tu respuesta debe ser JSON exactamente así:
            {
              "summary": "resumen detallado aquí",
              "keyPoints": ["punto 1", "punto 2", "punto 3", ...],
              "suggestedEvents": [
                {
                  "title": "título del evento",
                  "description": "descripción del evento",
                  "date": "fecha en formato ISO (si se menciona)"
                },
                ...
              ]
            }`
          },
          {
            role: "user",
            content: transcript
          }
        ],
        temperature: 0.1, // Temperatura más baja para respuestas más precisas
        max_tokens: 2048 // Tokens aumentados para resúmenes más completos
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    try {
      // Intentar analizar la respuesta de la API
      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonResponse = JSON.parse(jsonMatch[0]);
        return {
          summary: jsonResponse.summary || "No se pudo generar un resumen.",
          keyPoints: jsonResponse.keyPoints || [],
          suggestedEvents: jsonResponse.suggestedEvents || []
        };
      } else {
        throw new Error("No se pudo extraer JSON de la respuesta");
      }
    } catch (parseError) {
      console.error("Error analizando respuesta JSON:", parseError);
      
      // Proporcionar un resultado de respaldo en caso de error
      return fallbackAnalysis(transcript);
    }
  } catch (error) {
    console.error("Error analizando transcripción:", error);
    return fallbackAnalysis(transcript);
  }
}

// Análisis de respaldo para cuando la API falla
function fallbackAnalysis(transcript: string): Omit<TranscriptionResult, "transcript"> {
  // Generar un resumen básico (primeras 150 palabras)
  const words = transcript.split(' ');
  const summary = words.slice(0, 150).join(' ') + (words.length > 150 ? '...' : '');
  
  // Extraer posibles puntos clave (frases que terminan con punto)
  const sentences = transcript.split('.');
  const filteredSentences = sentences
    .filter(s => s.trim().length > 20 && s.trim().length < 100)
    .slice(0, 5)
    .map(s => s.trim() + '.');
  
  // Crear eventos sugeridos simples
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  return {
    summary,
    keyPoints: filteredSentences.length > 0 ? filteredSentences : ["No se pudieron identificar puntos clave."],
    suggestedEvents: [
      {
        title: "Revisar transcripción",
        description: "Revisar la transcripción generada y confirmar su precisión",
        date: today.toISOString()
      }
    ]
  };
}

// Helper function to convert Blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]); // Remove the data URL prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper function to get the next occurrence of a specific day of the week
function getNextDayOfWeek(dayOfWeek: number, hour: number = 9): Date {
  const date = new Date();
  const currentDayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate days to add
  let daysToAdd = dayOfWeek - currentDayOfWeek;
  if (daysToAdd <= 0) {
    daysToAdd += 7; // If the day has already occurred this week, get next week's occurrence
  }
  
  date.setDate(date.getDate() + daysToAdd);
  date.setHours(hour, 0, 0, 0);
  
  return date;
}

// Helper function to get next Friday
function getNextFriday(): Date {
  return getNextDayOfWeek(5, 17); // Friday at 5 PM
}
