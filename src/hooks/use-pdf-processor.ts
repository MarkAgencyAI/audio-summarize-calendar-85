
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
  const [detectedLanguage, setDetectedLanguage] = useState<string>("es");
  
  // Función para detectar idioma basado en texto (simplificada)
  const detectLanguage = (text: string): string => {
    // Palabras comunes en diferentes idiomas para detección básica
    const languageKeywords = {
      es: ["el", "la", "de", "en", "que", "y", "a", "los", "del", "se", "las", "por", "un", "para", "con", "una"],
      en: ["the", "of", "and", "to", "in", "a", "is", "that", "for", "it", "as", "was", "with", "be", "on", "at"],
      fr: ["le", "la", "les", "des", "et", "en", "un", "une", "que", "qui", "dans", "pour", "avec", "sur", "au", "ce"],
    };
    
    // Contar coincidencias para cada idioma
    const counts: Record<string, number> = { es: 0, en: 0, fr: 0 };
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      for (const [lang, keywords] of Object.entries(languageKeywords)) {
        if (keywords.includes(word)) {
          counts[lang]++;
        }
      }
    }
    
    // Encontrar el idioma con más coincidencias
    let maxLang = "es"; // Default
    let maxCount = 0;
    
    for (const [lang, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxLang = lang;
      }
    }
    
    console.log("Detected language:", maxLang);
    return maxLang;
  };
  
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
      
      // Detect language from extracted text
      const lang = detectLanguage(fullText);
      setDetectedLanguage(lang);
      
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
      
      // Preparar mensajes según idioma detectado
      let systemPrompt = "";
      
      if (detectedLanguage === "en") {
        systemPrompt = `You are a specialized assistant in analyzing educational material and generating resources for teachers.
          Your task is to:
          1. Create a structured summary of the content (maximum 3 paragraphs)
          2. Extract 5-7 key points to emphasize in class
          3. Suggest a class plan based on the content
          4. Propose possible activities or assignments for students
          
          Your response format must be JSON exactly like this:
          {
            "summary": "Structured summary here",
            "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
            "plan": ["Part 1 of the plan", "Part 2 of the plan", "Part 3 of the plan"],
            "activities": ["Description of activity 1", "Description of activity 2"]
          }`;
      } else if (detectedLanguage === "fr") {
        systemPrompt = `Vous êtes un assistant spécialisé dans l'analyse de matériel éducatif et la génération de ressources pour les enseignants.
          Votre tâche est de :
          1. Créer un résumé structuré du contenu (maximum 3 paragraphes)
          2. Extraire 5-7 points clés à souligner en classe
          3. Suggérer un plan de cours basé sur le contenu
          4. Proposer des activités ou des devoirs possibles pour les étudiants
          
          Le format de votre réponse doit être JSON exactement comme ceci :
          {
            "summary": "Résumé structuré ici",
            "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
            "plan": ["Partie 1 du plan", "Partie 2 du plan", "Partie 3 du plan"],
            "activities": ["Description de l'activité 1", "Description de l'activité 2"]
          }`;
      } else {
        // Default to Spanish
        systemPrompt = `Eres un asistente especializado en analizar material educativo y generar recursos para profesores.
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
          }`;
      }
      
      // Enviar solicitud a la API de GROQ
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: systemPrompt
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
      
      // Preparar título según idioma detectado
      let summaryTitle = "Resumen del Material";
      let keyPointsTitle = "Puntos Clave";
      let planTitle = "Plan de Clase";
      let activitiesTitle = "Actividades Propuestas";
      
      if (detectedLanguage === "en") {
        summaryTitle = "Material Summary";
        keyPointsTitle = "Key Points";
        planTitle = "Class Plan";
        activitiesTitle = "Proposed Activities";
      } else if (detectedLanguage === "fr") {
        summaryTitle = "Résumé du Matériel";
        keyPointsTitle = "Points Clés";
        planTitle = "Plan de Cours";
        activitiesTitle = "Activités Proposées";
      }
      
      // Formatear el resumen para mejor visualización
      const formattedSummary = `# ${summaryTitle}\n\n${analysisData.summary}\n\n## ${keyPointsTitle}\n\n${analysisData.keyPoints.map(point => `- ${point}`).join('\n')}\n\n## ${planTitle}\n\n${analysisData.plan.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n\n## ${activitiesTitle}\n\n${analysisData.activities.map((item, index) => `${index + 1}. ${item}`).join('\n')}`;
      
      setProgress(100);
      
      return {
        summary: formattedSummary,
        keyPoints: analysisData.keyPoints || [],
        suggestedEvents
      };
    } catch (error) {
      console.error("Error analyzing content with GROQ:", error);
      
      // Determinar mensaje de error según idioma
      let errorSummary = "# Error al analizar el contenido\n\nHubo un problema al analizar el contenido del PDF. Por favor, verifica que el archivo tenga texto extraíble y no esté protegido.";
      let errorPoints = ["Verificar contenido del PDF", "Revisar permisos del documento", "Intentar con otro documento si el problema persiste"];
      let errorTitle = "Verificar documento";
      let errorDesc = "Revisar que el PDF contenga texto extraíble y no esté protegido";
      
      if (detectedLanguage === "en") {
        errorSummary = "# Error analyzing content\n\nThere was a problem analyzing the PDF content. Please verify that the file has extractable text and is not protected.";
        errorPoints = ["Verify PDF content", "Check document permissions", "Try with another document if the problem persists"];
        errorTitle = "Verify document";
        errorDesc = "Check that the PDF contains extractable text and is not protected";
      } else if (detectedLanguage === "fr") {
        errorSummary = "# Erreur lors de l'analyse du contenu\n\nUn problème est survenu lors de l'analyse du contenu PDF. Veuillez vérifier que le fichier contient du texte extractible et n'est pas protégé.";
        errorPoints = ["Vérifier le contenu du PDF", "Vérifier les autorisations du document", "Essayer avec un autre document si le problème persiste"];
        errorTitle = "Vérifier le document";
        errorDesc = "Vérifier que le PDF contient du texte extractible et n'est pas protégé";
      }
      
      // Proporcionar resultados de respaldo en caso de error
      return {
        summary: errorSummary,
        keyPoints: errorPoints,
        suggestedEvents: [
          {
            title: errorTitle,
            description: errorDesc
          }
        ]
      };
    }
  };
  
  // Función principal para procesar el PDF completo
  const processPdf = async (file: File): Promise<{
    transcript: string;
    analysis: AnalysisResult;
    language: string;
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
        analysis: analysisResult,
        language: detectedLanguage
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
