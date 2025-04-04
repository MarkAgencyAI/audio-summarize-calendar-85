
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

export function RecordingItem({
  recording,
  onAddToCalendar
}: RecordingItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    folders,
    getAudioUrl
  } = useRecordings();

  // Get the folder for this recording
  const folder = folders.find(f => f.id === recording.folderId) || folders[0];

  // Format the recording date
  const formattedDate = formatDistanceToNow(new Date(recording.createdAt), {
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
    <Card 
      className="overflow-hidden transition-all hover:shadow-md border border-gray-200 dark:border-custom-secondary/60" 
      style={{
        backgroundColor: `${folder.color}10`
      }}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-full" 
              style={{
                backgroundColor: folder.color
              }}
            >
              <Folder className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm text-custom-text opacity-80 dark:text-white/80">{folder.name}</span>
          </div>
          
          {recording.language && (
            <div className="flex items-center gap-1 text-xs bg-custom-primary/10 dark:bg-custom-primary/20 text-custom-primary dark:text-white px-2 py-1 rounded-full">
              <Globe className="h-3 w-3" />
              <span>{getLanguageDisplay(recording.language)}</span>
            </div>
          )}
        </div>
        
        <h3 className="font-semibold truncate text-custom-primary dark:text-custom-accent dark:text-white">
          {recording.name}
        </h3>
        
        <div className="flex flex-wrap gap-2 text-xs text-custom-text opacity-80 dark:text-white/80">
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
          <p className="text-sm line-clamp-2 text-custom-text dark:text-white/90">
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
                className="w-full border-custom-primary/20 hover:bg-custom-primary/10 text-custom-primary dark:border-custom-primary/30 dark:hover:bg-custom-primary/20 dark:text-custom-accent" 
                onClick={togglePlayback}
              >
                {isPlaying 
                  ? <><Pause className="h-4 w-4 mr-2" /> Pausar</> 
                  : <><Play className="h-4 w-4 mr-2" /> Reproducir</>
                }
              </Button>
            ) : (
              <RecordingDetails recording={recording} />
            )}
          </div>
          
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-custom-secondary/10 hover:bg-custom-secondary/20 text-custom-secondary dark:bg-custom-secondary/20 dark:hover:bg-custom-secondary/40 dark:text-white" 
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
          style={{
            display: 'none'
          }} 
        />
      )}
    </Card>
  );
}
