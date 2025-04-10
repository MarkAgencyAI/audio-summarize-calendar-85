
// Re-export desde la nueva estructura modularizada
export * from './transcription/index';

// Añadimos una nota importante sobre la respuesta del webhook
/**
 * NOTA IMPORTANTE: Al usar este servicio, asegúrate de guardar la respuesta del webhook
 * que se devuelve en el objeto result.webhookResponse. Esta respuesta contiene el resumen 
 * y puntos fuertes procesados de la transcripción.
 */

// Función auxiliar para extraer el contenido de output de la respuesta del webhook
export const extractWebhookOutput = (webhookResponse: any): any => {
  if (!webhookResponse) return null;
  
  try {
    // Si es un array y tiene elementos
    if (Array.isArray(webhookResponse) && webhookResponse.length > 0) {
      // Si el primer elemento tiene una propiedad output
      if (webhookResponse[0] && 'output' in webhookResponse[0]) {
        return webhookResponse[0].output;
      }
    }
    
    // Si es un objeto y tiene una propiedad output
    if (typeof webhookResponse === 'object' && webhookResponse !== null && 'output' in webhookResponse) {
      return webhookResponse.output;
    }
    
    // Si no se encuentra la estructura esperada, devolver la respuesta completa
    return webhookResponse;
  } catch (error) {
    console.error("Error extracting webhook output:", error);
    return webhookResponse;
  }
};
