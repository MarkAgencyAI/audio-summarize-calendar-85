import { toast } from "sonner";

/**
 * Send data to a webhook endpoint
 */
export async function sendToWebhook(url: string, data: any): Promise<void> {
  try {
    console.log("Enviando datos al webhook:", url);
    
    // For structured data with transcript and metadata
    if (typeof data === 'object' && data.transcript) {
      console.log("Enviando transcripción con metadata:", data.transcript.substring(0, 200) + "...");
      
      // Send structured JSON data
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors", // Handle CORS issues
        body: JSON.stringify({
          transcript: data.transcript,
          subject: data.subject || "No subject specified",
          language: data.language || "es"
        }),
      });
      
      console.log("Datos enviados al webhook correctamente");
      return;
    }
    
    // If it's a simple string
    if (typeof data === 'string') {
      console.log("Enviando texto:", data.substring(0, 200) + "...");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        mode: "no-cors", // Handle CORS issues
        body: data,
      });
      
      console.log("Texto enviado al webhook correctamente");
      return;
    }
    
    // Otherwise, send as JSON
    console.log("Enviando datos:", JSON.stringify(data).substring(0, 200) + "...");
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "no-cors", // Handle CORS issues
      body: JSON.stringify(data),
    });
    
    console.log("Datos enviados al webhook correctamente");
    return;
  } catch (error) {
    console.error("Error al enviar datos al webhook:", error);
    toast.error("Error al enviar datos al webhook");
    throw error;
  }
}
