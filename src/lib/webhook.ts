
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
    
    // Intentar obtener la respuesta aunque estemos en modo no-cors
    try {
      // Si hay una respuesta del webhook con la variable 'output'
      const responseData = await response.json();
      console.log("Respuesta del webhook:", responseData);
      
      if (responseData && responseData.output) {
        console.log("Se encontró variable output en la respuesta:", responseData.output);
        
        // Disparar evento personalizado con los datos de output
        const webhookData = {
          transcript: responseData.output.transcript || null,
          summary: responseData.output.summary || null,
          keyPoints: responseData.output.keyPoints || []
        };
        
        const analysisEvent = new CustomEvent('webhookMessage', {
          detail: {
            type: 'webhook_analysis',
            data: webhookData
          }
        });
        
        window.dispatchEvent(analysisEvent);
        console.log("Evento webhook_analysis disparado con datos de output:", webhookData);
      } else {
        // Si no hay variable output, disparar evento con los datos originales (comportamiento anterior)
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
      }
    } catch (parseError) {
      console.log("No se pudo parsear respuesta (esperado en modo no-cors):", parseError);
      
      // Si estamos en modo no-cors no podremos leer la respuesta, sigue con el comportamiento original
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
