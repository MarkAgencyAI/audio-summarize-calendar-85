
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
  const [isOpen, setIsOpen] = useState(false);
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
  
  const handleOpenDetails = () => {
    setIsOpen(true);
  };

  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-md border border-gray-200 dark:border-custom-secondary/60" 
      style={{
        backgroundColor: `${folder.color}10`
      }}
    >
      <div className="p-3 md:p-4 space-y-2 md:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 md:p-2 rounded-full" 
              style={{
                backgroundColor: folder.color
              }}
            >
              <Folder className="h-3 w-3 md:h-4 md:w-4 text-white" />
            </div>
            <span className="text-xs md:text-sm text-custom-text opacity-80 dark:text-white/80 truncate max-w-[120px]">{folder.name}</span>
          </div>
          
          {recording.language && (
            <div className="flex items-center gap-1 text-xs bg-custom-primary/10 dark:bg-custom-primary/20 text-custom-primary dark:text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
              <Globe className="h-2.5 w-2.5 md:h-3 md:w-3" />
              <span className="text-[10px] md:text-xs">{getLanguageDisplay(recording.language)}</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-start">
          <h3 className="font-semibold truncate text-sm md:text-base text-custom-primary dark:text-custom-accent dark:text-white max-w-[70%]">
            {recording.name}
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handleOpenDetails}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 text-[10px] md:text-xs text-custom-text opacity-80 dark:text-white/80">
          {recording.duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
              {formatDuration(recording.duration)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
            {formattedDate}
          </span>
        </div>
        
        {recording.summary && (
          <p className="text-xs md:text-sm line-clamp-2 text-custom-text dark:text-white/90">
            {typeof recording.summary === 'string' && recording.summary.includes('#') 
              ? recording.summary.split('\n').find(line => !line.startsWith('#') && line.trim() !== '') || "Sin resumen" 
              : recording.summary}
          </p>
        )}
        
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {audioUrl ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 min-w-0 border-custom-primary/20 hover:bg-custom-primary/10 text-custom-primary dark:border-custom-primary/30 dark:hover:bg-custom-primary/20 dark:text-custom-accent text-xs md:text-sm py-1 h-8" 
                onClick={togglePlayback}
              >
                {isPlaying 
                  ? <><Pause className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" /> <span className="truncate">Pausar</span></> 
                  : <><Play className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" /> <span className="truncate">Reproducir</span></>
                }
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 min-w-0 text-[#001011] hover:bg-[#001011]/10 border-[#001011]/20 dark:border-custom-primary/30 dark:text-custom-accent dark:hover:bg-custom-primary/20 text-xs md:text-sm py-1 h-8"
                onClick={handleOpenDetails}
              >
                <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" /> 
                <span className="truncate">Ver transcripción</span>
              </Button>
            )}
            
            <Button 
              variant="secondary" 
              size="sm" 
              className="flex-1 min-w-0 bg-custom-secondary/10 hover:bg-custom-secondary/20 text-custom-secondary dark:bg-custom-secondary/20 dark:hover:bg-custom-secondary/40 dark:text-white text-xs md:text-sm py-1 h-8" 
              onClick={() => onAddToCalendar(recording)}
            >
              <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" />
              <span className="truncate">Añadir al calendario</span>
            </Button>
          </div>
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
      
      {/* RecordingDetails Dialog */}
      <RecordingDetails recording={recording} isOpen={isOpen} onOpenChange={setIsOpen} />
    </Card>
  );
}
