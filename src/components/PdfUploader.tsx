
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, useRecordings } from "@/context/RecordingsContext";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import axios from "axios";

export function PdfUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [lessonName, setLessonName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("default");
  
  const { folders, addRecording } = useRecordings();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's a PDF
      if (selectedFile.type !== "application/pdf") {
        toast.error("Por favor, sube un archivo PDF");
        return;
      }
      
      setFile(selectedFile);
      
      // Set default lesson name from filename
      const fileName = selectedFile.name.replace(/\.pdf$/, "");
      setLessonName(fileName);
    }
  };
  
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
    
    try {
      // Read the PDF file as a base64 string
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      
      fileReader.onload = async () => {
        try {
          // Convert ArrayBuffer to Base64
          const arrayBuffer = fileReader.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = window.btoa(binary);
          
          // Extract text from PDF using Groq API
          const transcript = await extractTextFromPdf(base64);
          
          // Analyze the text with Groq LLM
          const analysisResult = await analyzeClassContent(transcript);
          
          // Update the UI with the generated summary
          setSummary(analysisResult.summary);
          
          // Create a recording entry for this lesson
          addRecording({
            name: lessonName,
            audioUrl: "", // No audio for PDF-based entries
            transcript: transcript,
            summary: analysisResult.summary,
            keyPoints: analysisResult.keyPoints,
            folderId: selectedFolder,
            duration: 0, // No duration for PDF-based entries
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
      
      fileReader.onerror = () => {
        toast.error("Error al leer el archivo PDF");
        setLoading(false);
      };
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast.error("Error al procesar el PDF");
      setLoading(false);
    }
  };
  
  async function extractTextFromPdf(base64Pdf: string): Promise<string> {
    try {
      // Use Groq API to extract text from PDF
      const extractionResponse = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that extracts and organizes text from PDFs. Return only the extracted text."
            },
            {
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: "Extract the text content from this PDF document and organize it in a readable format:" 
                },
                { 
                  type: "file_attachment", 
                  file_attachment: { 
                    data: base64Pdf, 
                    content_type: "application/pdf" 
                  } 
                }
              ]
            }
          ],
          temperature: 0.2
        },
        {
          headers: {
            "Authorization": `Bearer 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`,
            "Content-Type": "application/json"
          }
        }
      );
      
      return extractionResponse.data.choices[0].message.content;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error("Error al extraer texto del PDF");
    }
  }
  
  async function analyzeClassContent(content: string): Promise<{
    summary: string;
    keyPoints: string[];
    suggestedEvents: { title: string; description: string; date?: string }[];
  }> {
    try {
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
              content: content
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
      
      const analysisMarkdown = response.data.choices[0].message.content;
      
      // Extract key points from markdown
      const keyPointsMatch = analysisMarkdown.match(/## Puntos clave para enfatizar\s+\n([\s\S]*?)(?=\n##|$)/);
      const keyPoints = keyPointsMatch ? 
        keyPointsMatch[1].split("\n")
          .map(point => point.trim())
          .filter(point => point.startsWith("- "))
          .map(point => point.substring(2)) : 
        [];
      
      // Extract suggested events from the plan
      const planMatch = analysisMarkdown.match(/## Plan de clase sugerido\s+\n([\s\S]*?)(?=\n##|$)/);
      const activitiesMatch = analysisMarkdown.match(/## Actividades propuestas\s+\n([\s\S]*?)(?=\n##|$)/);
      
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
      
      // Return fallback analysis
      return {
        summary: "# Error al analizar el contenido\n\nNo se pudo generar un análisis detallado del material. Por favor, intenta nuevamente.",
        keyPoints: ["Revisar el contenido del PDF", "Extraer los conceptos principales", "Preparar ejercicios prácticos"],
        suggestedEvents: [
          {
            title: "Revisar material",
            description: "Realizar una revisión completa del material del PDF"
          }
        ]
      };
    }
  }
  
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
      
      {summary && (
        <div className="mt-6 p-4 border border-border rounded-lg bg-card">
          <h3 className="text-lg font-medium mb-2">Resumen generado</h3>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm">{summary}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
