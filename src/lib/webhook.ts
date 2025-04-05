
import { toast } from "sonner";

/**
 * Envía datos a un webhook
 * @param url URL del webhook
 * @param data Datos a enviar
 * @returns Promise con la respuesta
 */
export async function sendToWebhook(url: string, data: any): Promise<void> {
  try {
    console.log("Enviando datos al webhook:", url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "no-cors", // Para manejar CORS
      body: JSON.stringify(data),
    });
    
    console.log("Datos enviados al webhook correctamente");
    return;
  } catch (error) {
    console.error("Error al enviar datos al webhook:", error);
    toast.error("Error al enviar la transcripción al webhook");
    throw error;
  }
}
