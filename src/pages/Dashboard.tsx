
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecordings } from "@/context/RecordingsContext";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import { PdfUploader } from "@/components/PdfUploader";
import { AudioRecorder } from "@/components/AudioRecorder";
import { RecordingItem } from "@/components/RecordingItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Mic, FileText, Search, Calendar, Bell } from "lucide-react";
import { LiveTranscriptionSheet } from "@/components/LiveTranscriptionSheet";
import { toast } from "sonner";
import { parseISO, format, isWithinInterval, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
}

function UpcomingEvents({ events }: { events: CalendarEvent[] }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <Card className={isMobile ? "mb-6" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-500" />
          Próximos Recordatorios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground py-2">
            <p>No hay recordatorios próximos</p>
            <p className="text-xs mt-1">Tus eventos aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 5).map(event => (
              <div
                key={event.id}
                className="p-2 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                onClick={() => navigate("/calendar")}
              >
                <div className="font-medium text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-orange-500" />
                  {event.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(parseISO(event.date), "PPPp", { locale: es })}
                </div>
              </div>
            ))}

            {events.length > 5 && (
              <Button
                variant="link"
                className="w-full text-sm"
                onClick={() => navigate("/calendar")}
              >
                Ver todos los eventos ({events.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ToolsCard() {
  const { recordings, addRecording } = useRecordings();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionOutput, setTranscriptionOutput] = useState("");
  const [transcriptionOpen, setTranscriptionOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleAudioRecorderMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.type === 'recordingStarted') {
        setIsRecording(true);
      } else if (customEvent.detail?.type === 'recordingStopped') {
        setIsRecording(false);
      } else if (customEvent.detail?.type === 'transcriptionStarted') {
        setIsTranscribing(true);
        setTranscriptionOutput("");
      } else if (customEvent.detail?.type === 'transcriptionComplete' || 
                customEvent.detail?.type === 'transcriptionStopped') {
        setIsTranscribing(false);
        setTimeout(() => {
          if (!isRecording) {
            setTranscriptionOutput("");
          }
        }, 30000);
      } else if (customEvent.detail?.type === 'transcriptionUpdate') {
        setTranscriptionOutput(customEvent.detail.data || "");
      }
    };

    window.addEventListener('audioRecorderMessage', handleAudioRecorderMessage);
    
    return () => {
      window.removeEventListener('audioRecorderMessage', handleAudioRecorderMessage);
    };
  }, [isRecording]);

  const handleFileUpload = (file: File) => {
    addRecording({
      name: file.name,
      audioUrl: URL.createObjectURL(file),
      audioData: "",
      output: "Transcribiendo...",
      folderId: "default",
      duration: 0
    });
    toast.success("Archivo subido correctamente!");
  };

  const showTranscriptionOptions = isRecording || isTranscribing || transcriptionOutput;

  return (
    <Card className="h-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Folder className="h-5 w-5 text-blue-500" />
          Herramientas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {user?.role === "teacher" && <PdfUploader />}
        <AudioRecorder />
        
        {showTranscriptionOptions && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setTranscriptionOpen(true)}
          >
            <FileText className="mr-2 h-4 w-4" />
            {isTranscribing ? "Ver transcripción en vivo" : "Ver transcripción"}
          </Button>
        )}
        
        <LiveTranscriptionSheet
          isTranscribing={isTranscribing}
          output={transcriptionOutput}
          open={transcriptionOpen}
          onOpenChange={setTranscriptionOpen}
        />
      </CardContent>
    </Card>
  );
}

function Transcriptions() {
  const { recordings, deleteRecording } = useRecordings();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredRecordings = recordings.filter(recording =>
    (recording.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCalendar = (recording: any) => {
    console.log("Add to calendar:", recording);
    toast.info("Funcionalidad en desarrollo");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-500" />
          Transcripciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar transcripciones..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="divide-y divide-border">
          {filteredRecordings.map(recording => (
            <RecordingItem
              key={recording.id}
              recording={recording}
              onAddToCalendar={handleAddToCalendar}
            />
          ))}
          {filteredRecordings.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              <p>No se encontraron transcripciones</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadEvents = () => {
      const storedEvents = loadFromStorage<CalendarEvent[]>("calendarEvents") || [];
      const now = new Date();
      const filteredEvents = storedEvents.filter((event: CalendarEvent) => {
        try {
          const eventDate = parseISO(event.date);
          return isWithinInterval(eventDate, {
            start: now,
            end: addDays(now, 14)
          });
        } catch (error) {
          console.error("Error parsing date for event:", event);
          return false;
        }
      });
      
      filteredEvents.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      setUpcomingEvents(filteredEvents);
    };
    
    loadEvents();
    
    const intervalId = setInterval(loadEvents, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Layout>
      <div className="space-y-6 max-w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-custom-primary dark:text-custom-accent dark:text-white">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.role === "teacher" ? "Gestiona tus transcripciones" : "Gestiona tus recursos"}
            </p>
          </div>
        </div>

        {isMobile && (
          <div className="grid grid-cols-1 gap-4">
            <UpcomingEvents events={upcomingEvents} />
            <ToolsCard />
            <Transcriptions />
          </div>
        )}

        {!isMobile && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-4 space-y-6">
              <ToolsCard />
              <UpcomingEvents events={upcomingEvents} />
            </div>
            <div className="md:col-span-2">
              <Transcriptions />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
