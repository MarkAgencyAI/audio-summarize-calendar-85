import { useState, useRef, useEffect } from "react";
import { Mic, X, Play, Pause, Loader2, Stop } from "lucide-react";
import { useRecordings } from "@/context/RecordingsContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type RecordingState = "idle" | "recording" | "paused";

export function AudioRecorder() {
  const { addRecording, folders } = useRecordings();
  const { user } = useAuth();
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingName, setRecordingName] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("default");
  
  const [hasPermission, setHasPermission] = useState(false);
  
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop()); // Stop the stream
      } catch (error) {
        console.error("Error getting microphone permission:", error);
        setHasPermission(false);
      }
    };
    
    checkPermissions();
  }, []);
  
  const startRecording = async () => {
    if (!hasPermission) {
      toast.error("Por favor, permite el acceso al micrófono");
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      
      mediaRecorder.current.onstop = () => {
        const fullBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        setAudioBlob(fullBlob);
      };
      
      mediaRecorder.current.start();
      setRecordingState("recording");
      startTimer();
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Error al iniciar la grabación");
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.pause();
      setRecordingState("paused");
      pauseTimer();
    }
  };
  
  const resumeRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "paused") {
      mediaRecorder.current.resume();
      setRecordingState("recording");
      startTimer();
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      setRecordingState("idle");
      stopTimer();
      
      // Stop all tracks from the media stream
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  const clearRecording = () => {
    setAudioBlob(null);
    setRecordingName("");
  };
  
  // Timer functions
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  
  const startTimer = () => {
    timerInterval.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };
  
  const pauseTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
  };
  
  const stopTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      setRecordingDuration(0);
    }
  };
  
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const saveRecording = async (audioBlob) => {
    try {
      setIsProcessing(true);
      
      // Create a URL for the audio blob
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Convert the blob to base64 data for persistent storage
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64AudioData = reader.result as string;
        
        // Get the transcription
        // const result = await transcribeAudio(audioBlob);
        const result = {
          transcript: "Simulated transcript",
          summary: "Simulated summary",
          keyPoints: ["Simulated key point 1", "Simulated key point 2"],
          suggestedEvents: []
        };
        
        // Add the recording to context
        addRecording({
          name: recordingName || `Grabación ${formatDate(new Date())}`,
          audioUrl,
          audioData: base64AudioData, // Store base64 data for persistence
          transcript: result.transcript,
          summary: result.summary,
          keyPoints: result.keyPoints,
          folderId: selectedFolder,
          duration: recordingDuration
        });
        
        // Reset the state
        setIsProcessing(false);
        setRecordingState('idle');
        setRecordingName('');
        setAudioBlob(null);
        setRecordingDuration(0);
        
        toast.success('Grabación guardada correctamente');
      };
    } catch (error) {
      console.error('Error saving recording:', error);
      setIsProcessing(false);
      toast.error('Error al guardar la grabación');
    }
  };
  
  return (
    <div className="glassmorphism rounded-xl p-4 md:p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Nueva grabación</h2>
      
      <div className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {recordingState === "idle" && (
              <Button onClick={startRecording} disabled={isProcessing}>
                <Mic className="h-4 w-4 mr-2" />
                Grabar
              </Button>
            )}
            
            {recordingState === "recording" && (
              <>
                <Button onClick={pauseRecording} disabled={isProcessing}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
                <Button onClick={stopRecording} disabled={isProcessing} variant="destructive">
                  <Stop className="h-4 w-4 mr-2" />
                  Detener
                </Button>
              </>
            )}
            
            {recordingState === "paused" && (
              <>
                <Button onClick={resumeRecording} disabled={isProcessing}>
                  <Play className="h-4 w-4 mr-2" />
                  Reanudar
                </Button>
                <Button onClick={stopRecording} disabled={isProcessing} variant="destructive">
                  <Stop className="h-4 w-4 mr-2" />
                  Detener
                </Button>
              </>
            )}
          </div>
          
          <span>{formatTime(recordingDuration)}</span>
        </div>
        
        {/* Recording Name Input */}
        {audioBlob === null ? null : (
          <>
            <div className="space-y-2">
              <Label htmlFor="recording-name">Nombre de la grabación</Label>
              <Input
                id="recording-name"
                placeholder="Nombre de la grabación"
                value={recordingName}
                onChange={(e) => setRecordingName(e.target.value)}
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
          </>
        )}
        
        {/* Actions */}
        {audioBlob && (
          <div className="flex justify-between gap-4">
            <Button variant="ghost" onClick={clearRecording}>
              <X className="h-4 w-4 mr-2" />
              Borrar
            </Button>
            
            <Button
              onClick={() => saveRecording(audioBlob)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Guardar grabación"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
