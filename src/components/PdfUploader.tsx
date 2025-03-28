
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, useRecordings } from "@/context/RecordingsContext";
import { toast } from "sonner";
import { Loader2, Upload, FileText, BookOpenText, ListChecks } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as ConvertApi from "convertapi";

// Configurar cliente de ConvertAPI correctamente
const convertApiClient = ConvertApi.default("secret_oQHJ9c5WhDkkjtvH");

export function PdfUploader() {
  // Estados del componente
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [lessonName, setLessonName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("default");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const { folders, addRecording } = useRecordings();
  
  // Manejador para cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.type !== "application/pdf") {
        toast.error("Por favor, sube un archivo PDF");
        return;
      }
      
      setFile(selectedFile);
      
      // Establecer nombre de lección basado en nombre del archivo
      const fileName = selectedFile.name.replace(/\.pdf$/, "");
      setLessonName(fileName);
    }
  };
  
  // Función principal para procesar el PDF
  const processPdf = async () => {
    if (!file) {
      toast.error("Por favor, selecciona un archivo PDF");
      return;
    }
    
    if (!lessonName) {
      toast.error("Por favor, ingresa un nombre para la lección");
      return;
    }
    
    setLoading(true);
    setSummary(null);
    setKeyPoints([]);
    setShowAnalysis(false);
    
    try {
      // Extraer texto del PDF
      const pdfText = await extractTextFromPdf(file);
      
      // Analizar el contenido del PDF
      const analysisResult = await analyzeContent(pdfText);
      
      // Actualizar estados con resultados
      setSummary(analysisResult.summary);
      setKeyPoints(analysisResult.keyPoints);
      setShowAnalysis(true);
      
      // Guardar la grabación
      addRecording({
        name: lessonName,
        audioUrl: "",
        transcript: pdfText,
        summary: analysisResult.summary,
        keyPoints: analysisResult.keyPoints,
        folderId: selectedFolder,
        duration: 0,
        suggestedEvents: analysisResult.suggestedEvents
      });
      
      toast.success("PDF procesado correctamente");
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast.error("Error al procesar el PDF");
    } finally {
      setLoading(false);
    }
  };
  
  // Función para extraer texto del PDF usando ConvertAPI
  async function extractTextFromPdf(pdfFile: File): Promise<string> {
    try {
      // Convertir PDF a texto usando ConvertAPI
      const result = await convertApiClient.convert('pdf', 'txt', {
        File: pdfFile
      });
      
      // Obtener URL del archivo convertido
      const fileUrl = result.files[0].url;
      
      // Descargar el contenido de texto
      const textResponse = await fetch(fileUrl);
      
      if (!textResponse.ok) {
        throw new Error(`Error al descargar texto convertido: ${textResponse.status} ${textResponse.statusText}`);
      }
      
      const textContent = await textResponse.text();
      return textContent;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error("Error al extraer texto del PDF");
    }
  }
  
  // Función para analizar el contenido del PDF con GROQ
  async function analyzeContent(content: string): Promise<{
    summary: string;
    keyPoints: string[];
    suggestedEvents: { title: string; description: string; date?: string }[];
  }> {
    try {
      // Validar contenido
      if (!content || content.trim().length < 10) {
        throw new Error("El contenido del PDF es demasiado corto o inválido");
      }
      
      // Truncar contenido si es muy largo
      const truncatedContent = content.length > 10000 
        ? content.substring(0, 10000) + "..." 
        : content;
      
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
              2. Extraer 3-5 puntos clave para enfatizar en clase
              3. Sugerir un plan de clase basado en el contenido
              4. Proponer posibles actividades o tareas para los estudiantes
              
              El formato de tu respuesta debe ser Markdown exactamente así:
              
              # Resumen del material
              
              [Resumen estructurado aquí]
              
              ## Puntos clave para enfatizar
              
              - [Punto 1]
              - [Punto 2]
              - [Punto 3]
              ...
              
              ## Plan de clase sugerido
              
              1. [Actividad/Tema 1]
              2. [Actividad/Tema 2]
              ...
              
              ## Actividades propuestas
              
              1. [Descripción de actividad 1]
              2. [Descripción de actividad 2]
              ...`
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
      
      // Procesar respuesta de la API
      const analysisMarkdown = response.data.choices[0].message.content;
      
      // Extraer puntos clave
      const keyPointsMatch = analysisMarkdown.match(/## Puntos clave para enfatizar\s+\n([\s\S]*?)(?=\n##|$)/);
      const keyPoints = keyPointsMatch ? 
        keyPointsMatch[1].split("\n")
          .map(point => point.trim())
          .filter(point => point.startsWith("- "))
          .map(point => point.substring(2)) : 
        [];
      
      // Extraer plan de clase y actividades
      const planMatch = analysisMarkdown.match(/## Plan de clase sugerido\s+\n([\s\S]*?)(?=\n##|$)/);
      const activitiesMatch = analysisMarkdown.match(/## Actividades propuestas\s+\n([\s\S]*?)(?=\n##|$)/);
      
      // Crear eventos sugeridos
      const suggestedEvents = [];
      
      if (planMatch) {
        const planItems = planMatch[1].split("\n")
          .map(item => item.trim())
          .filter(item => /^\d+\./.test(item))
          .map(item => item.replace(/^\d+\.\s*/, ""));
        
        for (let i = 0; i < planItems.length; i++) {
          suggestedEvents.push({
            title: `Clase: ${planItems[i]}`,
            description: `Parte ${i+1} del plan de clase: ${planItems[i]}`
          });
        }
      }
      
      if (activitiesMatch) {
        const activityItems = activitiesMatch[1].split("\n")
          .map(item => item.trim())
          .filter(item => /^\d+\./.test(item))
          .map(item => item.replace(/^\d+\.\s*/, ""));
        
        for (const activity of activityItems) {
          suggestedEvents.push({
            title: `Actividad: ${activity.substring(0, 30)}...`,
            description: activity
          });
        }
      }
      
      return {
        summary: analysisMarkdown,
        keyPoints,
        suggestedEvents
      };
    } catch (error) {
      console.error("Error analyzing PDF content:", error);
      
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
  }
  
  // Interfaz de usuario
  return (
    <div className="space-y-4 p-4 glassmorphism rounded-xl">
      <h2 className="text-xl font-semibold">Subir material para clase</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pdf-file">Archivo PDF</Label>
          <Input
            id="pdf-file"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
        </div>
        
        {file && (
          <>
            <div className="space-y-2">
              <Label htmlFor="lesson-name">Nombre de la lección</Label>
              <Input
                id="lesson-name"
                value={lessonName}
                onChange={(e) => setLessonName(e.target.value)}
                placeholder="Nombre de la lección"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folder">Carpeta</Label>
              <select
                id="folder"
                className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md"
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
              >
                {folders.map((folder: Folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            
            <Button 
              onClick={processPdf} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Procesar PDF
                </>
              )}
            </Button>
          </>
        )}
      </div>
      
      {showAnalysis && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Análisis del Material
              </CardTitle>
            </CardHeader>
            <CardContent>
              {keyPoints && keyPoints.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-md font-medium flex items-center mb-2">
                    <ListChecks className="mr-2 h-4 w-4" />
                    Puntos Fuertes
                  </h3>
                  <ul className="space-y-2 pl-2">
                    {keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary h-5 w-5 text-xs mr-2 mt-0.5">
                          {index + 1}
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {summary && (
                <div>
                  <h3 className="text-md font-medium flex items-center mb-2">
                    <BookOpenText className="mr-2 h-4 w-4" />
                    Resumen Completo
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{summary}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
