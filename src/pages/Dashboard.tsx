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

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
}

function UpcomingEvents({ events }: { events: CalendarEvent[] }) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-500" />
          Próximos Recordatorios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <p>No hay recordatorios próximos</p>
            <p className="text-xs mt-1">Tus eventos aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 5).map(event => (
              <div
                key={event.id}
                className="p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
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
  const { addRecording } = useRecordings();
  const [transcriptionOpen, setTranscriptionOpen] = useState(false);

  const handleFileUpload = (file: File) => {
    addRecording({
      id: Date.now().toString(),
      title: file.name,
      date: new Date().toISOString(),
      type: file.type,
      transcription: "Transcribiendo...",
      url: URL.createObjectURL(file),
    });
    toast.success("Archivo subido correctamente!");
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Folder className="h-5 w-5 text-blue-500" />
          Herramientas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PdfUploader onFileUpload={handleFileUpload} />
        <AudioRecorder onNewRecording={handleFileUpload} />
        <Button variant="outline" className="w-full" onClick={() => setTranscriptionOpen(true)}>
          <FileText className="mr-2 h-4 w-4" />
          Transcripción en vivo
        </Button>
        <LiveTranscriptionSheet open={transcriptionOpen} setOpen={setTranscriptionOpen} />
      </CardContent>
    </Card>
  );
}

function Transcriptions() {
  const { recordings, removeRecording } = useRecordings();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredRecordings = recordings.filter(recording =>
    recording.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
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
              onDelete={removeRecording}
              onClick={() => navigate(`/recording/${recording.id}`)}
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

  useEffect(() => {
    const storedEvents = loadFromStorage("calendarEvents");
    if (storedEvents) {
      const parsedEvents = JSON.parse(storedEvents).map((event: any) => ({
        ...event,
        date: event.date,
      }));
      setUpcomingEvents(parsedEvents);
    }
  }, []);

  useEffect(() => {
    if (upcomingEvents) {
      saveToStorage("calendarEvents", JSON.stringify(upcomingEvents));
    }
  }, [upcomingEvents]);

  return (
    <Layout>
      <div className="space-y-6 max-w-full">
        {/* Header Row */}
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

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-1 space-y-6">
            {/* Tools Card */}
            <ToolsCard />

            {/* Upcoming Events Card */}
            <UpcomingEvents events={upcomingEvents} />
          </div>

          {/* Right Column */}
          <div className="md:col-span-2">
            {/* Transcriptions Card */}
            <Transcriptions />
          </div>
        </div>
      </div>
    </Layout>
  );
}
