import { toast } from "sonner";

export async function sendToWebhook(url: string, data: any): Promise<void> {
  try {
    console.log("Enviando datos al webhook:", url);
    
    // If data is a simple string, send it directly as text
    if (typeof data === 'string') {
      console.log("Enviando texto:", data.substring(0, 200) + "...");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        mode: "no-cors", // Para manejar CORS
        body: data,
      });
      
      console.log("Texto enviado al webhook correctamente");
      return;
    }
    
    // Otherwise, send as JSON
    console.log("Enviando datos:", JSON.stringify(data).substring(0, 200) + "...");
    
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
