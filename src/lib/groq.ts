
// API key for Groq
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
    // First, we need to convert the audio to a format that can be transcribed
    // For this example, we'll just convert to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    // Simulated transcription response (in a real app, this would call the Groq API)
    // Since we can't make real API calls here, we'll simulate the response
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a plausible fake transcript
    const transcript = "Buenas tardes, quería consultar sobre la reunión de planificación del proyecto que tenemos pendiente. Creo que deberíamos agendar una sesión para el próximo jueves a las 3 PM para discutir los avances con el equipo de desarrollo. También necesitamos coordinar con el departamento de marketing para la presentación final que está programada para el 15 de noviembre. Por cierto, no olvides que el plazo para enviar el informe preliminar es este viernes.";
    
    // Generate a summary
    const summary = "Consulta sobre reunión de planificación de proyecto, propuesta para reunión el jueves a las 3 PM, coordinación con marketing para presentación del 15 de noviembre, y recordatorio de informe preliminar para este viernes.";
    
    // Extract key points
    const keyPoints = [
      "Reunión de planificación pendiente",
      "Propuesta: jueves a las 3 PM",
      "Coordinación con marketing para presentación (15 nov)",
      "Plazo de informe preliminar: este viernes"
    ];
    
    // Suggest events for calendar
    const suggestedEvents = [
      {
        title: "Reunión de planificación",
        description: "Discutir avances con el equipo de desarrollo",
        date: getNextDayOfWeek(4, 15).toISOString() // Next Thursday at a random time
      },
      {
        title: "Presentación final con Marketing",
        description: "Presentación del proyecto finalizado",
        date: new Date(new Date().getFullYear(), 10, 15, 10).toISOString() // November 15
      },
      {
        title: "Entrega informe preliminar",
        description: "Fecha límite para enviar el informe",
        date: getNextFriday().toISOString() // This Friday
      }
    ];
    
    return {
      transcript,
      summary,
      keyPoints,
      suggestedEvents
    };
    
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio. Please try again.");
  }
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

// In a real implementation, we would have a proper API call here using fetch or axios
// async function callGroqApi(base64Audio: string): Promise<any> {
//   const response = await fetch('https://api.groq.com/v1/audio/transcribe', {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${GROQ_API_KEY}`,
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//       audio: base64Audio,
//       model: 'whisper-large-v3',
//       language: 'es'
//     })
//   });
//
//   if (!response.ok) {
//     throw new Error(`API error: ${response.status}`);
//   }
//
//   return response.json();
// }
