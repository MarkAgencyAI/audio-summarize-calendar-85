
import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transcribeAudio } from "@/lib/groq";
import { useRecordings } from "@/context/RecordingsContext";
import { toast } from "sonner";

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { addRecording, folders } = useRecordings();

  useEffect(() => {
    // Initialize audio element
    if (audioUrl && !audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      
      // Setup audio event listeners
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      
      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Release the media stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start the timer
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("No se pudo acceder al micrófono. Por favor, verifica los permisos.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleTranscribe = async () => {
    if (!audioUrl) return;
    
    try {
      setIsTranscribing(true);
      
      // Get the audio blob from the URL
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();
      
      // Transcribe the audio
      const result = await transcribeAudio(audioBlob);
      
      // Add the recording to the state
      addRecording({
        name: `Grabación ${new Date().toLocaleString()}`,
        audioUrl,
        transcript: result.transcript,
        summary: result.summary,
        keyPoints: result.keyPoints,
        folderId: "default",
        duration: recordingTime,
      });
      
      toast.success("Audio transcrito exitosamente");
      
      // Reset the recorder
      setAudioUrl(null);
      setRecordingTime(0);
      setCurrentTime(0);
      
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast.error("Error al transcribir el audio. Por favor, intenta nuevamente.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  // Calculate progress percentage for playback
  const progressPercentage = recordingTime > 0 ? (currentTime / recordingTime) * 100 : 0;
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`relative glassmorphism rounded-xl p-6 shadow-lg transition-all duration-300 ${isRecording ? 'bg-opacity-90' : ''}`}>
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className={`
              h-20 w-20 flex items-center justify-center rounded-full 
              ${isRecording 
                ? 'bg-red-500 animate-pulse-record' 
                : 'bg-primary hover:bg-primary/90'}
              transition-all duration-300
            `}>
              {audioUrl && !isRecording ? (
                <button 
                  onClick={togglePlayback}
                  className="h-full w-full flex items-center justify-center focus:outline-none"
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8 text-white" />
                  ) : (
                    <Play className="h-8 w-8 text-white" />
                  )}
                </button>
              ) : (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className="h-full w-full flex items-center justify-center focus:outline-none"
                  disabled={isTranscribing}
                >
                  {isRecording ? (
                    <Square className="h-8 w-8 text-white" />
                  ) : (
                    <Mic className="h-8 w-8 text-white" />
                  )}
                </button>
              )}
            </div>
            {isRecording && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500"></span>
              </span>
            )}
          </div>
          
          <div className="text-center w-full">
            {isRecording ? (
              <div className="text-xl font-medium">{formatTime(recordingTime)}</div>
            ) : audioUrl ? (
              <div className="space-y-4 w-full">
                <div className="text-sm text-muted-foreground">
                  {formatTime(recordingTime)}
                </div>
                
                {/* Audio Player UI */}
                <div className="w-full">
                  <div className="w-full bg-secondary rounded-full h-1.5 mb-2">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(recordingTime)}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleTranscribe}
                  className="w-full"
                  disabled={isTranscribing}
                >
                  {isTranscribing ? "Transcribiendo..." : "Transcribir audio"}
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Presiona para grabar</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
