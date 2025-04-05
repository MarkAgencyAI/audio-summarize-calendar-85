
import { toast } from "sonner";

export async function sendToWebhook(url: string, data: any): Promise<void> {
  try {
    console.log("Enviando datos al webhook:", url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "no-cors",
      body: JSON.stringify(data),
    });
    
    // Disparar evento personalizado para análisis del webhook
    if (data.type === "transcription_analysis") {
      const analysisEvent = new CustomEvent('audioRecorderMessage', {
        detail: {
          type: 'webhook_analysis',
          data: {
            summary: data.summary,
            keyPoints: data.keyPoints
          }
        }
      });
      window.dispatchEvent(analysisEvent);
    }
    
    console.log("Datos enviados al webhook correctamente");
  } catch (error) {
    console.error("Error al enviar datos al webhook:", error);
    toast.error("Error al enviar datos al webhook");
    throw error;
  }
}
