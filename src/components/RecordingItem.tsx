
import React, { useState } from "react";
import { useRecordings } from "@/context/RecordingsContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate, formatTimeFromSeconds } from "@/lib/utils";
import { Mic, Clock, Trash2, Calendar, File, Play, Pause, Folder } from "lucide-react";

interface RecordingItemProps {
  recording: any;
  onAddToCalendar: (recording: any) => void;
}

export function RecordingItem({ recording, onAddToCalendar }: RecordingItemProps) {
  const { deleteRecording, folders } = useRecordings();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const folderName = folders.find(f => f.id === recording.folderId)?.name || "Sin carpeta";
  const folderColor = folders.find(f => f.id === recording.folderId)?.color || "#888888";
  
  // Toggle audio playback
  const togglePlay = () => {
    if (!audioElement) {
      const audio = new Audio(recording.audioUrl);
      setAudioElement(audio);
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Clean up audio element on unmount
  React.useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, [audioElement]);
  
  // Remove recording and close dialog
  const handleDelete = () => {
    deleteRecording(recording.id);
    setShowDetails(false);
  };
  
  return (
    <>
      <Card className="border-custom-primary/10 overflow-hidden hover:shadow-md transition-shadow bg-card">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between gap-2">
          <div className="flex-1 overflow-hidden">
            <CardTitle className="text-base truncate">{recording.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {formatTimeFromSeconds(recording.duration)}
              <span className="mx-1">•</span>
              {formatDate(new Date(recording.createdAt || Date.now()))}
            </CardDescription>
          </div>
          
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </CardHeader>
        
        <CardContent className="p-4 pt-2">
          <div className="flex items-center gap-1 mb-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: folderColor }}
            />
            <span className="text-xs text-muted-foreground">{folderName}</span>
            
            {recording.subject && (
              <>
                <span className="mx-1 text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{recording.subject}</span>
              </>
            )}
          </div>
          
          <p className="text-xs line-clamp-2 text-muted-foreground mb-2">
            {recording.output || "Sin información del webhook"}
          </p>
          
          <div className="flex justify-between gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 flex-1"
              onClick={() => setShowDetails(true)}
            >
              <File className="h-3 w-3 mr-1" />
              Ver detalles
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 flex-1"
              onClick={() => onAddToCalendar(recording)}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Calendario
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{recording.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 my-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Información del webhook:</h3>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[30vh]">
                  {recording.output || "Sin información del webhook"}
                </pre>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Folder className="h-4 w-4" />
                <span>{folderName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatTimeFromSeconds(recording.duration)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={handleDelete} className="flex items-center">
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
            <Button variant="outline" onClick={() => onAddToCalendar(recording)}>
              <Calendar className="h-4 w-4 mr-2" />
              Agregar a Calendario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
