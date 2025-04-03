
import { useState } from "react";
import { Recording, useRecordings } from "@/context/RecordingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FileText, Edit, Trash2, Save, X, Globe } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface RecordingDetailsProps {
  recording: Recording;
}

export function RecordingDetails({ recording }: RecordingDetailsProps) {
  const { updateRecording, deleteRecording, folders } = useRecordings();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(recording.name);
  const [isOpen, setIsOpen] = useState(false);
  
  // Get folder details
  const folder = folders.find(f => f.id === recording.folderId) || folders[0];
  
  // Format language display
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
    
    updateRecording(recording.id, { name: newName });
    setIsRenaming(false);
    toast.success("Nombre actualizado");
  };
  
  const handleCancelRename = () => {
    setNewName(recording.name);
    setIsRenaming(false);
  };
  
  const handleDelete = () => {
    deleteRecording(recording.id);
    setIsOpen(false);
    toast.success("Grabación eliminada");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
        >
          <FileText className="h-4 w-4 mr-2" /> Ver transcripción
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex-1">
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <Input 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8"
                    autoFocus
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleSaveRename}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleCancelRename}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{recording.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsRenaming(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar esta grabación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente esta grabación.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center gap-2 mt-2">
          <div 
            className="h-6 w-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: folder.color }}
          >
            <Folder className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm">{folder.name}</span>
          
          {recording.language && (
            <div className="flex items-center gap-1 ml-auto text-xs bg-muted px-2 py-1 rounded-full">
              <Globe className="h-3 w-3" />
              <span>{getLanguageDisplay(recording.language)}</span>
            </div>
          )}
        </div>
        
        <Separator className="my-2" />
        
        <div className="flex-1 overflow-hidden pt-2">
          <ScrollArea className="h-full">
            {recording.summary && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Resumen</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-md">{recording.summary}</pre>
                </div>
              </div>
            )}
            
            {recording.keyPoints && recording.keyPoints.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Puntos clave</h3>
                <ul className="space-y-1 ml-5 list-disc">
                  {recording.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <h3 className="font-medium mb-2">Transcripción completa</h3>
            <pre className="whitespace-pre-wrap text-sm font-sans bg-muted/30 p-4 rounded-md">
              {recording.transcript}
            </pre>
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
