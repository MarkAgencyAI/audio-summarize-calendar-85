
import { toast } from "sonner";
import { formatMathExpression } from "./math";

export async function sendToWebhook(url: string, data: any): Promise<void> {
  try {
    console.log("Enviando datos al webhook:", url);
    console.log("Datos enviados:", data);
    
    // Set proper CORS headers and make sure we're using the correct method
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
      },
      mode: "cors", // Changed from 'no-cors' to properly handle the response
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en la respuesta del webhook: ${response.status}`, errorText);
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
        
        // Check if there's content field or if we should use output
        let noteContent = "";
        if (rawData && rawData.content) {
          noteContent = formatMathExpression(rawData.content);
          console.log("Se encontró content en la respuesta:", noteContent);
        } else if (rawData && rawData.output) {
          noteContent = formatMathExpression(rawData.output);
          console.log("Se encontró output en la respuesta:", noteContent);
        } else if (rawData && rawData.message) {
          noteContent = formatMathExpression(rawData.message);
          console.log("Se encontró message en la respuesta:", noteContent);
        }
        
        // Disparar evento con el output exacto del webhook
        const analysisEvent = new CustomEvent('webhookMessage', {
          detail: {
            type: 'webhook_analysis',
            data: {
              output: rawData.output || "",
              content: noteContent
            }
          }
        });
        
        window.dispatchEvent(analysisEvent);
        toast.success("Datos recibidos del webhook correctamente");
        return;
      } catch (jsonError) {
        console.error("Error al parsear respuesta como JSON:", jsonError);
        
        // Si no se puede parsear como JSON, usamos el texto directamente
        const formattedText = formatMathExpression(responseText);
        const analysisEvent = new CustomEvent('webhookMessage', {
          detail: {
            type: 'webhook_analysis',
            data: {
              output: responseText,
              content: formattedText
            }
          }
        });
        
        window.dispatchEvent(analysisEvent);
        toast.success("Texto recibido del webhook correctamente");
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
    toast.error(`Error al enviar datos al webhook: ${error.message}`);
    
    // Notificar que hubo un error con el webhook
    const errorEvent = new CustomEvent('webhookMessage', {
      detail: {
        type: 'webhook_analysis',
        data: null,
        error: error.message || "Error desconocido al contactar el webhook"
      }
    });
    window.dispatchEvent(errorEvent);
    
    throw error;
  }
}
