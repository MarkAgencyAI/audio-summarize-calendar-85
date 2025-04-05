
import { useState } from "react";
import { Recording, useRecordings } from "@/context/RecordingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FileText, Edit, Trash2, Save, X, Globe, Folder } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGroq } from "@/lib/groq";
import { sendToWebhook } from "@/lib/webhook";

interface RecordingDetailsProps {
  recording: Recording;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Define the webhook URL
const WEBHOOK_URL = "https://ssn8nss.maettiai.tech/webhook-test/8e34aca2-3111-488c-8ee8-a0a2c63fc9e4";

export function RecordingDetails({
  recording,
  isOpen: propIsOpen,
  onOpenChange
}: RecordingDetailsProps) {
  const {
    updateRecording,
    deleteRecording,
    folders
  } = useRecordings();
  
  const { llama3, isLoading: isGroqLoading } = useGroq();
  
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(recording.name);
  const [isOpen, setIsOpenState] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(recording.folderId);
  const [isEditingOutput, setIsEditingOutput] = useState(false);
  const [editedOutput, setEditedOutput] = useState(recording.output || "");
  const [isGeneratingOutput, setIsGeneratingOutput] = useState(false);
  
  // Use controlled or uncontrolled state based on whether props are provided
  const dialogOpen = propIsOpen !== undefined ? propIsOpen : isOpen;
  const setDialogOpen = onOpenChange || setIsOpenState;
  
  const folder = folders.find(f => f.id === recording.folderId) || folders[0];
  
  const getLanguageDisplay = (code?: string) => {
    const languages: Record<string, string> = {
      es: "Español",
      en: "English",
      fr: "Français"
    };
    return code ? languages[code] || code.toUpperCase() : "Español";
  };
  
  const handleSaveRename = () => {
    if (newName.trim() === "") {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    updateRecording(recording.id, {
      name: newName
    });
    setIsRenaming(false);
    toast.success("Nombre actualizado");
  };
  
  const handleCancelRename = () => {
    setNewName(recording.name);
    setIsRenaming(false);
  };
  
  const handleDelete = () => {
    deleteRecording(recording.id);
    setDialogOpen(false);
    toast.success("Grabación eliminada");
  };
  
  const handleFolderChange = (folderId: string) => {
    setSelectedFolder(folderId);
    updateRecording(recording.id, {
      folderId
    });
    toast.success("Carpeta actualizada");
  };
  
  const handleSaveOutput = async () => {
    // Send updated output to webhook
    await sendToWebhook(WEBHOOK_URL, {
      type: "output_update",
      recordingId: recording.id,
      output: editedOutput,
      timestamp: new Date().toISOString()
    });
    
    updateRecording(recording.id, {
      output: editedOutput
    });
    setIsEditingOutput(false);
    toast.success("Contenido actualizado");
  };
  
  const handleCancelOutputEdit = () => {
    setEditedOutput(recording.output || "");
    setIsEditingOutput(false);
  };

  const generateOutputWithGroq = async () => {
    try {
      setIsGeneratingOutput(true);
      toast.info("Generando contenido con IA...");

      // Send a request to the webhook to indicate we're starting a generation
      await sendToWebhook(WEBHOOK_URL, {
        type: "generating_output",
        recordingId: recording.id,
        audioUrl: recording.audioUrl,
        timestamp: new Date().toISOString()
      });

      // Generate a prompt for the analysis
      const prompt = `Genera un análisis del siguiente audio. Destaca los puntos principales, las fechas importantes si las hay, y organiza la información de forma clara y coherente. Si hay temas educativos, enfócate en explicarlos de manera didáctica.

Por favor proporciona un análisis bien estructurado de aproximadamente 5-10 oraciones.`;

      // Call the GROQ API
      const response = await llama3({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      if (response && response.choices && response.choices[0]?.message?.content) {
        const output = response.choices[0].message.content;
        
        // Send the generated output to the webhook
        await sendToWebhook(WEBHOOK_URL, {
          type: "generated_output",
          recordingId: recording.id,
          output: output,
          timestamp: new Date().toISOString()
        });
        
        // Update the recording with the generated output
        updateRecording(recording.id, {
          output: output
        });
        
        // Update local state
        setEditedOutput(output);
        
        toast.success("Contenido generado exitosamente");
      } else {
        // Try to generate a basic output if the API fails
        const simpleOutput = `Contenido generado localmente: Este es un análisis básico de la grabación "${recording.name}" que contiene aproximadamente ${recording.audioData.length} caracteres.`;
        
        // Send the simple output to the webhook
        await sendToWebhook(WEBHOOK_URL, {
          type: "fallback_output",
          recordingId: recording.id,
          output: simpleOutput,
          error: "No se pudo obtener respuesta de la API",
          timestamp: new Date().toISOString()
        });
        
        // Update with simple output
        updateRecording(recording.id, {
          output: simpleOutput
        });
        
        // Update local state
        setEditedOutput(simpleOutput);
        
        toast.warning("Se generó un contenido básico debido a problemas con la API");
      }
    } catch (error) {
      console.error("Error al generar el contenido:", error);
      
      // Send error to webhook
      await sendToWebhook(WEBHOOK_URL, {
        type: "output_generation_error",
        recordingId: recording.id,
        error: String(error),
        timestamp: new Date().toISOString()
      });
      
      toast.error("Error al generar el contenido");
      
      // Generate fallback output
      const errorOutput = "No se pudo generar un análisis automático. Por favor, intente más tarde o edite manualmente el contenido.";
      setEditedOutput(errorOutput);
      updateRecording(recording.id, {
        output: errorOutput
      });
    } finally {
      setIsGeneratingOutput(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-3xl w-[95vw] md:w-auto max-h-[90vh] flex flex-col dark:bg-[#001A29] dark:border-custom-secondary">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex-1 max-w-[calc(100%-40px)]">
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <Input 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    className="h-8 max-w-[200px]" 
                    autoFocus 
                  />
                  <Button variant="ghost" size="icon" onClick={handleSaveRename} className="h-7 w-7 p-0">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleCancelRename} className="h-7 w-7 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[#005c5f] dark:text-[#f1f2f6] truncate">{recording.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => setIsRenaming(true)} className="h-7 w-7 p-0 flex-shrink-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive h-7 w-7 p-0 flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="dark:bg-[#001A29] dark:border-custom-secondary max-w-[95vw] md:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar esta grabación?</AlertDialogTitle>
                  <AlertDialogDescription className="dark:text-gray-300">
                    Esta acción no se puede deshacer. Se eliminará permanentemente esta grabación.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="dark:bg-custom-secondary/40 dark:text-white dark:hover:bg-custom-secondary/60">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Detalles de la grabación y transcripción
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="flex items-center gap-2">
            <div 
              className="h-6 w-6 rounded-full flex items-center justify-center" 
              style={{
                backgroundColor: folder.color
              }}
            >
              <Folder className="h-3 w-3 text-white" />
            </div>
            
            <Select value={selectedFolder} onValueChange={handleFolderChange}>
              <SelectTrigger className="h-7 w-auto min-w-24 max-w-40 dark:bg-custom-secondary/40 dark:border-custom-secondary">
                <SelectValue placeholder="Seleccionar carpeta" />
              </SelectTrigger>
              <SelectContent className="dark:bg-[#001A29] dark:border-custom-secondary">
                {folders.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{
                          backgroundColor: f.color
                        }}
                      />
                      <span className="truncate">{f.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {recording.subject && (
            <div className="flex items-center gap-1 ml-auto text-xs bg-muted px-2 py-1 rounded-full dark:bg-custom-secondary/40 dark:text-white">
              <Globe className="h-3 w-3" />
              <span>{recording.subject}</span>
            </div>
          )}
        </div>
        
        <Separator className="my-2 dark:bg-custom-secondary/40" />
        
        <div className="flex-1 overflow-hidden pt-2">
          <ScrollArea className="h-[60vh] md:h-[65vh] pr-2">
            <div className="mb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-medium mb-2 dark:text-custom-accent text-[#005c5f] dark:text-[#f1f2f6]">
                  Contenido
                </h3>
                <div className="flex gap-1 flex-wrap">
                  {isEditingOutput ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleSaveOutput} className="h-7 py-0">
                        <Save className="h-3.5 w-3.5 mr-1" /> Guardar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCancelOutputEdit} className="h-7 py-0">
                        <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditingOutput(true)} 
                        className="h-7 py-0"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateOutputWithGroq}
                        disabled={isGeneratingOutput || isGroqLoading}
                        className="h-7 py-0"
                      >
                        {isGeneratingOutput ? 'Generando...' : 'Generar con IA'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {isEditingOutput ? (
                  <Textarea 
                    value={editedOutput} 
                    onChange={e => setEditedOutput(e.target.value)}
                    className="min-h-[150px] whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-md dark:bg-custom-secondary/20 dark:text-white/90"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-md dark:bg-custom-secondary/20 dark:text-white/90 overflow-x-auto">
                    {recording.output || "No hay contenido disponible. Edita o genera contenido con IA."}
                  </pre>
                )}
              </div>
            </div>
            
            {recording.suggestedEvents && recording.suggestedEvents.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-2 dark:text-custom-accent">Eventos sugeridos</h3>
                <ul className="space-y-1 ml-5 list-disc dark:text-white/90">
                  {recording.suggestedEvents.map((event, index) => (
                    <li key={index}>
                      <strong>{event.title}</strong>: {event.description}
                      {event.date && <span className="text-sm text-muted-foreground ml-2">({event.date})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button onClick={() => setDialogOpen(false)} className="dark:bg-custom-primary dark:text-white dark:hover:bg-custom-primary/90 text-white">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
