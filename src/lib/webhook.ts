
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
      const webhookData = {
        summary: data.summary || null,
        keyPoints: data.keyPoints || []
      };
      
      const analysisEvent = new CustomEvent('webhookMessage', {
        detail: {
          type: 'webhook_analysis',
          data: webhookData
        }
      });
      
      window.dispatchEvent(analysisEvent);
      console.log("Evento webhook_analysis disparado con:", webhookData.summary, webhookData.keyPoints);
    }
    
    console.log("Datos enviados al webhook correctamente");
  } catch (error) {
    console.error("Error al enviar datos al webhook:", error);
    
    // Notificar que hubo un error con el webhook
    const errorEvent = new CustomEvent('webhookMessage', {
      detail: {
        type: 'webhook_analysis',
        data: null,
        error: true
      }
    });
    window.dispatchEvent(errorEvent);
    
    toast.error("Error al enviar datos al webhook");
    throw error;
  }
}
