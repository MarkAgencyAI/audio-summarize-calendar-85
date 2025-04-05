import { useState, useRef, useEffect } from "react";
import { Mic, X, Play, Pause, Loader2, Square } from "lucide-react";
import { useRecordings } from "@/context/RecordingsContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { transcribeAudio, blobToBase64 } from "@/lib/groq";
import { useAudioProcessor } from "@/hooks/use-audio-processor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RecordingState = "idle" | "recording" | "paused";

export function AudioRecorder() {
  const { addRecording, folders } = useRecordings();
  const { user } = useAuth();
  const { processAudioFile } = useAudioProcessor();
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingName, setRecordingName] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("default");
  const [subject, setSubject] = useState("");
  
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
      
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  const clearRecording = () => {
    setAudioBlob(null);
    setRecordingName("");
  };
  
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
      setRecordingDuration(prevDuration => {
        return prevDuration;  // Preserve the final duration
      });
    }
  };
  
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const dispatchTranscriptionUpdate = (data: any) => {
    const event = new CustomEvent('audioRecorderMessage', {
      detail: {
        type: 'transcriptionUpdate',
        data
      }
    });
    window.dispatchEvent(event);
  };
  
  const dispatchTranscriptionComplete = (data: any) => {
    const event = new CustomEvent('audioRecorderMessage', {
      detail: {
        type: 'transcriptionComplete',
        data
      }
    });
    window.dispatchEvent(event);
  };
  
  const saveRecording = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      toast.info("Procesando grabación...");
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Convert audio to base64 for storage
      const base64AudioData = await blobToBase64(audioBlob);
      
      let transcriptionResult;
      try {
        // Update the progress UI via events
        dispatchTranscriptionUpdate({
          transcript: "Iniciando transcripción...",
          keyPoints: ["Procesando audio..."],
          language: "es"
        });
        
        // Use the real GROQ API for transcription with subject
        transcriptionResult = await processAudioFile(
          audioBlob, 
          subject,
          (progressData) => dispatchTranscriptionUpdate(progressData)
        );
        
        if (!transcriptionResult || !transcriptionResult.transcript) {
          throw new Error("No se pudo transcribir el audio correctamente");
        }
        
        toast.success("Audio transcrito correctamente");
        
        // Send the complete transcription results to update the transcription panel
        dispatchTranscriptionUpdate(transcriptionResult);
        dispatchTranscriptionComplete(transcriptionResult);
      } catch (error) {
        console.error("Error transcribing audio:", error);
        toast.error("Error al transcribir el audio. No se pudo procesar.");
        
        // Don't provide default values - treat this as a real error
        throw error;
      }
      
      // Add the recording with all data
      addRecording({
        name: recordingName || `Grabación ${formatDate(new Date())}`,
        audioUrl,
        audioData: base64AudioData as string,
        transcript: transcriptionResult.transcript,
        summary: transcriptionResult.summary || "",
        keyPoints: transcriptionResult.keyPoints || [],
        folderId: selectedFolder,
        duration: recordingDuration,
        language: transcriptionResult.language || "es",
        subject: subject || "Sin materia especificada",
        suggestedEvents: transcriptionResult.suggestedEvents || []
      });
      
      // Reset all states
      setIsProcessing(false);
      setRecordingState('idle');
      setRecordingName('');
      setSubject('');
      setAudioBlob(null);
      setRecordingDuration(0);
      
      toast.success('Grabación guardada correctamente');
    } catch (error) {
      console.error('Error saving recording:', error);
      setIsProcessing(false);
      toast.error('Error al guardar la grabación');
    }
  };
  
  return (
    <div className="glassmorphism rounded-xl p-4 md:p-6 shadow-lg bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5">
      <h2 className="text-xl font-semibold mb-4 text-custom-primary">Nueva grabación</h2>
      
      <div className="space-y-4">
        {recordingState === "idle" && audioBlob === null && (
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-custom-text">Materia</Label>
            <Input
              id="subject"
              placeholder="Ingresa la materia (ej: Matemáticas, Historia, etc.)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border-custom-primary/20 focus:border-custom-primary focus:ring-custom-primary"
            />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {recordingState === "idle" && (
              <Button onClick={startRecording} disabled={isProcessing} className="bg-custom-primary hover:bg-custom-primary/90 text-white">
                <Mic className="h-4 w-4 mr-2" />
                Grabar
              </Button>
            )}
            
            {recordingState === "recording" && (
              <>
                <Button onClick={pauseRecording} disabled={isProcessing} className="bg-custom-accent hover:bg-custom-accent/90 text-white">
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
                <Button onClick={stopRecording} disabled={isProcessing} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Detener
                </Button>
              </>
            )}
            
            {recordingState === "paused" && (
              <>
                <Button onClick={resumeRecording} disabled={isProcessing} className="bg-custom-accent hover:bg-custom-accent/90 text-white">
                  <Play className="h-4 w-4 mr-2" />
                  Reanudar
                </Button>
                <Button onClick={stopRecording} disabled={isProcessing} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Detener
                </Button>
              </>
            )}
          </div>
          
          <span className="text-custom-text">{formatTime(recordingDuration)}</span>
        </div>
        
        {audioBlob === null ? null : (
          <>
            <div className="space-y-2">
              <Label htmlFor="recording-name" className="text-custom-text">Nombre de la grabación</Label>
              <Input
                id="recording-name"
                placeholder="Nombre de la grabación"
                value={recordingName}
                onChange={(e) => setRecordingName(e.target.value)}
                className="border-custom-primary/20 focus:border-custom-primary focus:ring-custom-primary"
              />
            </div>
            
            {!subject && (
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-custom-text">Materia</Label>
                <Input
                  id="subject"
                  placeholder="Ingresa la materia (ej: Matemáticas, Historia, etc.)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="border-custom-primary/20 focus:border-custom-primary focus:ring-custom-primary"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="folder" className="text-custom-text">Carpeta</Label>
              <select
                id="folder"
                className="w-full h-10 px-3 py-2 bg-background text-custom-text border border-custom-primary/20 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-primary focus:border-custom-primary"
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
        
        {audioBlob && (
          <div className="flex justify-between gap-4">
            <Button variant="ghost" onClick={clearRecording} className="text-custom-primary hover:bg-custom-primary/10">
              <X className="h-4 w-4 mr-2" />
              Borrar
            </Button>
            
            <Button
              onClick={() => saveRecording(audioBlob)}
              disabled={isProcessing}
              className="bg-custom-primary hover:bg-custom-primary/90 text-white"
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
