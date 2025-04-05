
import { toast } from "sonner";

export async function sendToWebhook(url: string, data: any): Promise<void> {
  try {
    console.log("Enviando datos al webhook:", url);
    console.log("Datos enviados:", data);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    try {
      // Intentar obtener la respuesta del webhook
      const responseText = await response.text();
      console.log("Respuesta del webhook (texto):", responseText);
      
      if (responseText) {
        try {
          // Intentar parsear la respuesta como JSON
          const responseData = JSON.parse(responseText);
          console.log("Respuesta del webhook (parseada):", responseData);
          
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
            return; // Terminar la función después de disparar el evento
          }
        } catch (jsonError) {
          console.log("Error al parsear respuesta como JSON:", jsonError);
        }
      }
      
      // Si llegamos aquí, no se pudo obtener un output válido del webhook
      // Usar los datos originales como respaldo
      if (data.type === "transcription_analysis" || data.processed) {
        const webhookData = {
          transcript: data.transcript || null,
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
        console.log("Evento webhook_analysis disparado con datos originales:", webhookData);
      }
    } catch (responseError) {
      console.error("Error al procesar respuesta del webhook:", responseError);
      
      // Si ocurre un error al procesar la respuesta, usar los datos originales
      if (data.type === "transcription_analysis" || data.processed) {
        const webhookData = {
          transcript: data.transcript || null,
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
        console.log("Evento webhook_analysis disparado con datos originales (después de error):", webhookData);
      }
    }
    
    console.log("Proceso de webhook completado");
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
