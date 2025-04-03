
import { useState, useRef, useEffect } from "react";
import { Folder, Calendar, Play, Pause, Clock, FileText, Edit, Trash2, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Recording, useRecordings } from "@/context/RecordingsContext";
import { RecordingDetails } from "@/components/RecordingDetails";
import { Input } from "@/components/ui/input";

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
  
  // Format language display
  const getLanguageDisplay = (code?: string) => {
    const languages: Record<string, string> = {
      es: "Español",
      en: "English",
      fr: "Français"
    };
    return code ? languages[code] || code.toUpperCase() : "Español";
  };
  
  useEffect(() => {
    // Only get audio URL if this is an audio recording
    if (recording.audioUrl || recording.audioData) {
      const url = getAudioUrl(recording);
      setAudioUrl(url);
      
      // Clean up audio resources when unmounting
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioUrl);
        }
      };
    }
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full" style={{ backgroundColor: folder.color }}>
              <Folder className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">{folder.name}</span>
          </div>
          
          {recording.language && (
            <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
              <Globe className="h-3 w-3" />
              <span>{getLanguageDisplay(recording.language)}</span>
            </div>
          )}
        </div>
        
        <h3 className="font-semibold truncate">{recording.name}</h3>
        
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {recording.duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(recording.duration)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
        </div>
        
        {recording.summary && (
          <p className="text-sm line-clamp-2">
            {typeof recording.summary === 'string' && recording.summary.includes('#') 
              ? recording.summary.split('\n').find(line => !line.startsWith('#') && line.trim() !== '') || "Sin resumen" 
              : recording.summary}
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
              <RecordingDetails recording={recording} />
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
      {audioUrl && (
        <audio 
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          style={{ display: 'none' }}
        />
      )}
    </Card>
  );
}
