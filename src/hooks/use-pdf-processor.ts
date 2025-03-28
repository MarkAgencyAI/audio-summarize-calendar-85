
import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import axios from "axios";

// Initialize PDF.js worker if not already initialized
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  suggestedEvents: { title: string; description: string; date?: string }[];
}

export function usePdfProcessor() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Función para extraer texto del PDF usando PDF.js
  const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
    try {
      setProgress(0);
      
      // Convert the file to an ArrayBuffer
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load the PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const totalPages = pdf.numPages;
      
      // Extract text from each page
      for (let i = 1; i <= totalPages; i++) {
        // Update progress (extraction is 50% of the total process)
        setProgress(Math.floor((i / totalPages) * 50));
        
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      if (fullText.trim().length === 0) {
        throw new Error("No se pudo extraer texto del PDF. Es posible que esté escaneado o protegido.");
      }
      
      return fullText;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error("Error al extraer texto del PDF");
    }
  };
  
  // Función para analizar el contenido con GROQ
  const analyzeContentWithGroq = async (content: string): Promise<AnalysisResult> => {
    try {
      // Validar contenido
      if (!content || content.trim().length < 10) {
        throw new Error("El contenido del PDF es demasiado corto o inválido");
      }
      
      setProgress(60);
      
      // Truncar contenido si es muy largo (para evitar exceder límites de tokens)
      const truncatedContent = content.length > 15000 
        ? content.substring(0, 15000) + "..." 
        : content;
      
      setProgress(70);
      
      // Enviar solicitud a la API de GROQ
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: `Eres un asistente especializado en analizar material educativo y generar recursos para profesores.
              Tu tarea es:
              1. Crear un resumen estructurado del contenido (máximo 3 párrafos)
              2. Extraer 5-7 puntos clave para enfatizar en clase
              3. Sugerir un plan de clase basado en el contenido
              4. Proponer posibles actividades o tareas para los estudiantes
              
              El formato de tu respuesta debe ser JSON exactamente así:
              {
                "summary": "Resumen estructurado aquí",
                "keyPoints": ["Punto 1", "Punto 2", "Punto 3", "Punto 4", "Punto 5"],
                "plan": ["Parte 1 del plan", "Parte 2 del plan", "Parte 3 del plan"],
                "activities": ["Descripción de actividad 1", "Descripción de actividad 2"]
              }`
            },
            {
              role: "user",
              content: truncatedContent
            }
          ],
          temperature: 0.2,
          max_tokens: 2048
        },
        {
          headers: {
            "Authorization": `Bearer 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`,
            "Content-Type": "application/json"
          }
        }
      );
      
      setProgress(90);
      
      // Procesar respuesta de la API
      let analysisData;
      const responseContent = response.data.choices[0].message.content;
      
      try {
        // Extraer JSON de la respuesta
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Formato de respuesta inválido");
        }
      } catch (parseError) {
        console.error("Error parsing GROQ response:", parseError);
        throw new Error("Error al procesar la respuesta de análisis");
      }
      
      // Crear eventos sugeridos a partir del plan y actividades
      const suggestedEvents = [];
      
      if (analysisData.plan) {
        for (let i = 0; i < analysisData.plan.length; i++) {
          suggestedEvents.push({
            title: `Clase: ${analysisData.plan[i].substring(0, 30)}...`,
            description: analysisData.plan[i]
          });
        }
      }
      
      if (analysisData.activities) {
        for (const activity of analysisData.activities) {
          suggestedEvents.push({
            title: `Actividad: ${activity.substring(0, 30)}...`,
            description: activity
          });
        }
      }
      
      // Formatear el resumen para mejor visualización
      const formattedSummary = `# Resumen del Material\n\n${analysisData.summary}\n\n## Puntos Clave\n\n${analysisData.keyPoints.map(point => `- ${point}`).join('\n')}\n\n## Plan de Clase\n\n${analysisData.plan.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n\n## Actividades Propuestas\n\n${analysisData.activities.map((item, index) => `${index + 1}. ${item}`).join('\n')}`;
      
      setProgress(100);
      
      return {
        summary: formattedSummary,
        keyPoints: analysisData.keyPoints || [],
        suggestedEvents
      };
    } catch (error) {
      console.error("Error analyzing content with GROQ:", error);
      
      // Proporcionar resultados de respaldo en caso de error
      return {
        summary: "# Error al analizar el contenido\n\nHubo un problema al analizar el contenido del PDF. Por favor, verifica que el archivo tenga texto extraíble y no esté protegido.",
        keyPoints: ["Verificar contenido del PDF", "Revisar permisos del documento", "Intentar con otro documento si el problema persiste"],
        suggestedEvents: [
          {
            title: "Verificar documento",
            description: "Revisar que el PDF contenga texto extraíble y no esté protegido"
          }
        ]
      };
    }
  };
  
  // Función principal para procesar el PDF completo
  const processPdf = async (file: File): Promise<{
    transcript: string;
    analysis: AnalysisResult;
  }> => {
    setLoading(true);
    setProgress(0);
    
    try {
      // Extraer texto del PDF
      const pdfText = await extractTextFromPdf(file);
      
      // Analizar el contenido del PDF con GROQ
      const analysisResult = await analyzeContentWithGroq(pdfText);
      
      return {
        transcript: pdfText,
        analysis: analysisResult
      };
    } finally {
      setLoading(false);
    }
  };
  
  return {
    processPdf,
    loading,
    progress
  };
}
