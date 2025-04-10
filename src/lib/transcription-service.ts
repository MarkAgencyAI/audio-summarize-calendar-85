
// Re-export desde la nueva estructura modularizada
export * from './transcription/index';

// Añadimos una nota importante sobre la respuesta del webhook
/**
 * NOTA IMPORTANTE: Al usar este servicio, asegúrate de guardar la respuesta del webhook
 * que se devuelve en el objeto result.webhookResponse. Esta respuesta contiene el resumen 
 * y puntos fuertes procesados de la transcripción.
 */
