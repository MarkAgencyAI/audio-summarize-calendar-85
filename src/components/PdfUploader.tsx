
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
      // In a real application, we would extract text from the PDF
      // and send it to Groq for analysis. For this demo, we'll simulate
      // the process with a sample response
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Sample summary response
      const sampleSummary = `# Resumen de clase: ${lessonName}
      
## Conceptos principales
- Introducción a los conceptos fundamentales
- Explicación de las teorías relevantes
- Ejemplos prácticos y aplicaciones

## Preparación para la clase
1. Revisar los materiales de lectura
2. Preparar ejemplos para discusión en clase
3. Desarrollar ejercicios prácticos para los estudiantes

## Puntos clave a destacar
- Relacionar los conceptos teóricos con aplicaciones del mundo real
- Fomentar la participación y discusión
- Evaluar la comprensión mediante preguntas dirigidas`;
      
      setSummary(sampleSummary);
      
      // Create a recording entry for this lesson
      addRecording({
        name: lessonName,
        audioUrl: "", // No audio for PDF-based entries
        transcript: "Generado a partir de PDF",
        summary: sampleSummary,
        keyPoints: [
          "Conceptos principales",
          "Preparación para la clase",
          "Puntos clave a destacar"
        ],
        folderId: selectedFolder,
        duration: 0 // No duration for PDF-based entries
      });
      
      toast.success("PDF procesado correctamente");
      
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast.error("Error al procesar el PDF");
    } finally {
      setLoading(false);
    }
  };
  
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
