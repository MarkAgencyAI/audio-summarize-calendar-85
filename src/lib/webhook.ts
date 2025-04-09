
/**
 * Sends data to a webhook endpoint
 * @param url Webhook URL
 * @param data Data to send
 * @returns Response from the webhook
 */
export async function sendToWebhook(url: string, data: any): Promise<any> {
  try {
    console.log("Enviando datos al webhook:", url);
    console.log("Datos:", JSON.stringify(data).slice(0, 100) + "...");
    
    if (!url || !url.startsWith("http")) {
      throw new Error("URL de webhook inválida");
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Error desconocido");
      console.error(`Error webhook (${response.status}): ${errorText}`);
      throw new Error(`Error del webhook: ${response.status}`);
    }
    
    try {
      const responseData = await response.json();
      console.log("Respuesta del webhook:", responseData);
      return responseData;
    } catch (error) {
      // Si no es JSON, devolver el texto
      const text = await response.text();
      console.log("Respuesta del webhook (texto):", text);
      return text;
    }
  } catch (error) {
    console.error("Error al enviar al webhook:", error);
    throw error;
  }
}
