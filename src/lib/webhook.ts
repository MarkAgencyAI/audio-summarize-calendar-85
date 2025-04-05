
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
    
    if (!response.ok) {
      throw new Error(`Error en la respuesta del webhook: ${response.status}`);
    }
    
    // Obtener el texto de la respuesta
    const responseText = await response.text();
    console.log("Respuesta del webhook (texto):", responseText);
    
    if (responseText) {
      try {
        // Intentar parsear la respuesta como JSON
        const responseData = JSON.parse(responseText);
        console.log("Respuesta del webhook (parseada):", responseData);
        
        // Verificar si la respuesta es un array y extraer el primer elemento
        let processedData = responseData;
        if (Array.isArray(responseData) && responseData.length > 0) {
          processedData = responseData[0];
          console.log("Procesando primer elemento del array:", processedData);
        }
        
        // Verificar si hay un campo output en la respuesta
        if (processedData && processedData.output) {
          console.log("Se encontró variable output en la respuesta:", processedData.output);
          
          // Disparar evento personalizado con los datos de output
          const analysisEvent = new CustomEvent('webhookMessage', {
            detail: {
              type: 'webhook_analysis',
              data: {
                transcript: processedData.output,
                summary: processedData.output,
                keyPoints: []
              }
            }
          });
          
          window.dispatchEvent(analysisEvent);
          toast.success("Datos recibidos del webhook correctamente");
          return;
        }
        
        // Si no hay output pero hay datos directamente en la respuesta
        if (processedData) {
          // Verificar si hay datos en la raíz del objeto
          const webhookData = {
            transcript: data.transcript || null,
            summary: processedData.output || null,
            keyPoints: []
          };
          
          const analysisEvent = new CustomEvent('webhookMessage', {
            detail: {
              type: 'webhook_analysis',
              data: webhookData
            }
          });
          
          window.dispatchEvent(analysisEvent);
          toast.success("Datos recibidos del webhook");
        }
      } catch (jsonError) {
        console.error("Error al parsear respuesta como JSON:", jsonError);
        toast.error("Error al procesar la respuesta del webhook");
        
        // Notificar que hubo un error con el webhook
        const errorEvent = new CustomEvent('webhookMessage', {
          detail: {
            type: 'webhook_analysis',
            data: null,
            error: jsonError.message
          }
        });
        window.dispatchEvent(errorEvent);
      }
    } else {
      toast.warning("Respuesta vacía del webhook");
      
      // Respuesta vacía, usar datos originales como respaldo
      const errorEvent = new CustomEvent('webhookMessage', {
        detail: {
          type: 'webhook_analysis',
          data: {
            transcript: data.transcript || null,
            summary: null,
            keyPoints: []
          },
          error: "Respuesta vacía del webhook"
        }
      });
      window.dispatchEvent(errorEvent);
    }
  } catch (error) {
    console.error("Error al enviar datos al webhook:", error);
    toast.error("Error al enviar datos al webhook");
    
    // Notificar que hubo un error con el webhook
    const errorEvent = new CustomEvent('webhookMessage', {
      detail: {
        type: 'webhook_analysis',
        data: null,
        error: true
      }
    });
    window.dispatchEvent(errorEvent);
    
    throw error;
  }
}
