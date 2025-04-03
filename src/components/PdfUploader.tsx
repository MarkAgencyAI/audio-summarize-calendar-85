
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, useRecordings } from "@/context/RecordingsContext";
import { toast } from "sonner";
import { Loader2, Upload, FileText, BookOpenText, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePdfProcessor } from "@/hooks/use-pdf-processor";
import { Progress } from "@/components/ui/progress";

export function PdfUploader() {
  // Estados del componente
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [lessonName, setLessonName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("default");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { folders, addRecording } = useRecordings();
  const { processPdf, loading, progress } = usePdfProcessor();
  
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
  const handleProcessPdf = async () => {
    if (!file) {
      toast.error("Por favor, selecciona un archivo PDF");
      return;
    }
    
    if (!lessonName) {
      toast.error("Por favor, ingresa un nombre para la lección");
      return;
    }
    
    setSummary(null);
    setKeyPoints([]);
    setShowAnalysis(false);
    
    try {
      // Notificar inicio de procesamiento
      toast.info("Procesando PDF...");
      
      // Procesar el PDF
      const result = await processPdf(file);
      
      // Actualizar estados con resultados
      setSummary(result.analysis.summary);
      setKeyPoints(result.analysis.keyPoints);
      setShowAnalysis(true);
      
      // Buscar la carpeta seleccionada
      const folder = folders.find(f => f.id === selectedFolder);
      
      // Guardar la grabación
      addRecording({
        name: lessonName,
        audioUrl: "",
        audioData: "",
        transcript: result.transcript,
        summary: result.analysis.summary,
        keyPoints: result.analysis.keyPoints,
        folderId: selectedFolder,
        duration: 0,
        suggestedEvents: result.analysis.suggestedEvents,
        language: result.language || "es"
      });
      
      toast.success("PDF procesado correctamente");
      
      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFile(null);
      setLessonName("");
    } catch (error: any) {
      console.error("Error processing PDF:", error);
      toast.error(error.message || "Error al procesar el PDF");
    }
  };
  
  // Interfaz de usuario
  return (
    <div className="space-y-4">
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
            ref={fileInputRef}
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
              onClick={handleProcessPdf} 
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
            
            {loading && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {progress < 50 ? 'Extrayendo texto...' : 'Analizando contenido...'}
                </p>
              </div>
            )}
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
