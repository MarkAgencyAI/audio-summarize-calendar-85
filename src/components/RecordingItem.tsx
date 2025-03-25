import { useState, useRef, useEffect } from "react";
import { Folder, Calendar, Play, Pause, Clock, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Recording, useRecordings } from "@/context/RecordingsContext";

interface RecordingItemProps {
  recording: Recording;
  onAddToCalendar: (recording: Recording) => void;
}

export function RecordingItem({ recording, onAddToCalendar }: RecordingItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { folders, getAudioUrl } = useRecordings();
  
  // Get the folder for this recording
  const folder = folders.find((f) => f.id === recording.folderId) || folders[0];
  
  // Format the recording date
  const formattedDate = formatDistanceToNow(recording.createdAt, {
    addSuffix: true,
    locale: es
  });
  
  // Format duration in mm:ss
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };
  
  useEffect(() => {
    // Get the audio URL from the recording context
    const url = getAudioUrl(recording);
    setAudioUrl(url);
    
    // Clean up audio resources when unmounting
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [recording, getAudioUrl]);
  
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md" 
      style={{ backgroundColor: `${folder.color}20` }}>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full" style={{ backgroundColor: folder.color }}>
            <Folder className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm text-muted-foreground">{folder.name}</span>
        </div>
        
        <h3 className="font-semibold truncate">{recording.name}</h3>
        
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(recording.duration)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
        </div>
        
        {recording.summary && (
          <p className="text-sm line-clamp-2">
            {recording.summary}
          </p>
        )}
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {audioUrl ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={togglePlayback}
              >
                {isPlaying ? 
                  <><Pause className="h-4 w-4 mr-2" /> Pausar</> : 
                  <><Play className="h-4 w-4 mr-2" /> Reproducir</>
                }
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                disabled
              >
                <FileText className="h-4 w-4 mr-2" /> Ver transcripción
              </Button>
            )}
          </div>
          
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => onAddToCalendar(recording)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Añadir al calendario
          </Button>
        </div>
      </div>
      
      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef}
        src={audioUrl}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />
    </Card>
  );
}
