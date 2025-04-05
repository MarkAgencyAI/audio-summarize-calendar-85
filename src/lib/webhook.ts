
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
    
    try {
      // Intentar obtener la respuesta del webhook
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
            const webhookData = {
              transcript: processedData.output.transcript || null,
              summary: processedData.output.summary || null,
              keyPoints: processedData.output.keyPoints || []
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
          
          // Si no hay output pero hay datos directamente en la respuesta
          if (processedData) {
            const webhookData = {
              transcript: processedData.transcript || null,
              summary: processedData.summary || null,
              keyPoints: processedData.keyPoints || []
            };
            
            const analysisEvent = new CustomEvent('webhookMessage', {
              detail: {
                type: 'webhook_analysis',
                data: webhookData
              }
            });
            
            window.dispatchEvent(analysisEvent);
            console.log("Evento webhook_analysis disparado con datos directos:", webhookData);
            return;
          }
        } catch (jsonError) {
          console.log("Error al parsear respuesta como JSON:", jsonError);
          
          // Intentar buscar si hay un campo output en el texto directamente
          if (responseText.includes('"output"')) {
            try {
              // Intentar extraer la parte JSON que contiene output
              const outputMatch = responseText.match(/"output"\s*:\s*({[^}]+})/);
              if (outputMatch && outputMatch[1]) {
                const outputData = JSON.parse(`{${outputMatch[1]}}`);
                console.log("Se encontró output en texto:", outputData);
                
                const webhookData = {
                  transcript: outputData.transcript || null,
                  summary: outputData.summary || null,
                  keyPoints: outputData.keyPoints || []
                };
                
                const analysisEvent = new CustomEvent('webhookMessage', {
                  detail: {
                    type: 'webhook_analysis',
                    data: webhookData
                  }
                });
                
                window.dispatchEvent(analysisEvent);
                console.log("Evento webhook_analysis disparado con datos extraídos de texto:", webhookData);
                return;
              }
            } catch (extractError) {
              console.error("Error al extraer datos de output del texto:", extractError);
            }
          }
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
      } else {
        // Notificar que no se obtuvo una respuesta válida
        const errorEvent = new CustomEvent('webhookMessage', {
          detail: {
            type: 'webhook_analysis',
            data: null,
            error: "No se pudo procesar la respuesta del webhook"
          }
        });
        window.dispatchEvent(errorEvent);
        toast.warning("Respuesta del webhook no válida");
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
      } else {
        // Notificar error si no hay datos para usar
        const errorEvent = new CustomEvent('webhookMessage', {
          detail: {
            type: 'webhook_analysis',
            data: null,
            error: true
          }
        });
        window.dispatchEvent(errorEvent);
        toast.error("Error al procesar la respuesta del webhook");
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
