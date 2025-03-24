import { useState, useRef, useEffect } from "react";
import { Play, Pause, Trash2, Edit2, Calendar, Folder } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Recording, useRecordings } from "@/context/RecordingsContext";
import { toast } from "sonner";

interface RecordingItemProps {
  recording: Recording;
  onAddToCalendar: (recording: Recording) => void;
}

export function RecordingItem({ recording, onAddToCalendar }: RecordingItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [editName, setEditName] = useState(recording.name);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(recording.folderId);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { updateRecording, deleteRecording, folders } = useRecordings();
  
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(recording.audioUrl);
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [recording.audioUrl]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleSaveEdit = () => {
    if (editName.trim()) {
      updateRecording(recording.id, { 
        name: editName,
        folderId: selectedFolder 
      });
      toast.success("Grabación actualizada");
    }
  };
  
  const handleDelete = () => {
    deleteRecording(recording.id);
    toast.success("Grabación eliminada");
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="border border-border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md bg-card">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium truncate mr-2">{recording.name}</h3>
          <div className="flex items-center space-x-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar grabación</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input 
                      id="name" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
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
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveEdit}>Guardar cambios</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground mb-3">
          {formatDate(recording.createdAt)} • {formatTime(recording.duration)}
        </div>
        
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" /> Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Reproducir
              </>
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                setSelectedFolder(recording.folderId);
                document.getElementById("editFolderDialog")?.click();
              }}
            >
              <Folder className="h-4 w-4" /> Carpeta
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => onAddToCalendar(recording)}
            >
              <Calendar className="h-4 w-4" /> Calendario
            </Button>
          </div>
        </div>
      </div>
      
      <div 
        className="border-t border-border p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="text-sm font-medium mb-2">Resumen</div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {recording.summary}
        </p>
        
        {showDetails && (
          <div className="mt-4 animate-fade-in">
            <div className="text-sm font-medium mb-2">Puntos clave</div>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {recording.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
            
            <div className="text-sm font-medium mt-4 mb-2">Transcripción</div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {recording.transcript}
            </p>
          </div>
        )}
      </div>
      
      <Dialog>
        <DialogTrigger asChild>
          <button id="editFolderDialog" className="hidden"></button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover grabación a carpeta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderSelect">Seleccionar carpeta</Label>
              <select
                id="folderSelect"
                className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md"
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
              >
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              updateRecording(recording.id, { folderId: selectedFolder });
              toast.success("Grabación movida a carpeta");
            }}>
              Mover a carpeta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
