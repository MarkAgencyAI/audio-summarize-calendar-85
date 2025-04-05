
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
        let rawData = responseData;
        if (Array.isArray(responseData) && responseData.length > 0) {
          rawData = responseData[0];
          console.log("Usando primer elemento del array:", rawData);
        }
        
        // Buscar el campo output en la respuesta y usarlo tal cual
        if (rawData && rawData.output) {
          console.log("Se encontró output en la respuesta:", rawData.output);
          
          // Disparar evento con el output exacto del webhook
          const analysisEvent = new CustomEvent('webhookMessage', {
            detail: {
              type: 'webhook_analysis',
              data: {
                output: rawData.output
              }
            }
          });
          
          window.dispatchEvent(analysisEvent);
          toast.success("Datos recibidos del webhook correctamente");
          return;
        }
        
        // Si no hay output, mostramos un mensaje
        toast.warning("La respuesta del webhook no contiene campo 'output'");
        const errorEvent = new CustomEvent('webhookMessage', {
          detail: {
            type: 'webhook_analysis',
            data: null,
            error: "La respuesta del webhook no contiene campo 'output'"
          }
        });
        window.dispatchEvent(errorEvent);
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
      
      // Respuesta vacía
      const errorEvent = new CustomEvent('webhookMessage', {
        detail: {
          type: 'webhook_analysis',
          data: null,
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
