
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
import { Folder, Mic, FileText, Search, Calendar } from "lucide-react";
import { LiveTranscriptionSheet } from "@/components/LiveTranscriptionSheet";
import { toast } from "sonner";
import { parseISO, format, isWithinInterval, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { loadFromStorage, saveToStorage } from "@/lib/storage";

// Interface for calendar events
interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  color?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { recordings, folders } = useRecordings();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("default");
  
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [webhookOutput, setWebhookOutput] = useState("");
  
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  
  const filteredRecordings = recordings.filter(recording => {
    const folderMatch = selectedFolder === "default" ? true : recording.folderId === selectedFolder;
    const searchMatch = searchTerm 
      ? recording.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        recording.output?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
      
    return folderMatch && searchMatch;
  });
  
  // Load upcoming calendar events that are within the next 14 days
  useEffect(() => {
    const loadEvents = () => {
      const storedEvents = loadFromStorage<CalendarEvent[]>("events") || [];
      const now = new Date();
      const twoWeeksLater = addDays(now, 14);
      
      const filtered = storedEvents.filter(event => {
        const eventDate = parseISO(event.date);
        return isWithinInterval(eventDate, { start: now, end: twoWeeksLater });
      });
      
      // Sort by most recent first
      filtered.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
      
      setUpcomingEvents(filtered);
    };
    
    loadEvents();
    
    // Set up a timer to refresh the events every minute
    const interval = setInterval(loadEvents, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const handleAddToCalendar = (recording) => {
    navigate("/calendar", { state: { recording } });
  };
  
  const handleFolderClick = (folderId: string) => {
    setSelectedFolder(folderId);
  };

  const handleAudioRecorderMessage = (event: CustomEvent) => {
    const { type, data } = event.detail;
    
    if (type === 'transcriptionUpdate') {
      setIsTranscribing(true);
      if (data && data.output) {
        setWebhookOutput(data.output);
      }
    } else if (type === 'transcriptionComplete') {
      setIsTranscribing(false);
      toast.success("Transcripción completada");
    }
  };

  const handleWebhookMessage = (event: CustomEvent) => {
    const { type, data, error } = event.detail;
    
    if (type === 'webhook_analysis') {
      console.log("Recibido análisis de webhook:", data);
      
      if (data && data.output) {
        setWebhookOutput(data.output);
        setIsTranscribing(false);
        toast.success("Información del webhook recibida correctamente");
      } else if (error) {
        setIsTranscribing(false);
        toast.error("Error en la respuesta del webhook");
      } else {
        setIsTranscribing(false);
        toast.warning("No se recibieron datos del webhook");
      }
    }
  };
  
  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      
      if (customEvent.detail?.type === 'transcriptionUpdate' || 
          customEvent.detail?.type === 'transcriptionComplete') {
        handleAudioRecorderMessage(customEvent);
      } else if (customEvent.detail?.type === 'webhook_analysis') {
        handleWebhookMessage(customEvent);
      }
    };
    
    window.addEventListener('audioRecorderMessage', handleEvent);
    window.addEventListener('webhookMessage', handleEvent);
    
    return () => {
      window.removeEventListener('audioRecorderMessage', handleEvent);
      window.removeEventListener('webhookMessage', handleEvent);
    };
  }, []);

  return (
    <Layout>
      <div className="space-y-6 max-w-full">
        {/* Header Row - Important first horizontal scan */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-custom-primary dark:text-custom-accent dark:text-white">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.role === "teacher" ? "Gestiona tus transcripciones" : "Gestiona tus grabaciones"}
            </p>
          </div>
          
          {isTranscribing && (
            <LiveTranscriptionSheet
              isTranscribing={isTranscribing}
              output={webhookOutput}
            >
              <Button 
                variant="default"
                className="flex items-center gap-2 bg-primary"
                size="sm"
              >
                <Mic className="h-4 w-4 text-white animate-pulse" />
                <span>Transcribiendo...</span>
              </Button>
            </LiveTranscriptionSheet>
          )}
        </div>
        
        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Second F scan */}
          <div className="md:col-span-1 space-y-6">
            {/* Tools Card */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Herramientas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {user?.role === "teacher" ? (
                  <PdfUploader />
                ) : (
                  <AudioRecorder 
                    data-enable-messaging="true"
                  />
                )}
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Carpetas</h3>
                  <div className="flex flex-wrap gap-2 overflow-x-auto max-w-full pb-2">
                    {folders.map(folder => (
                      <Button
                        key={folder.id}
                        className={`px-2 py-1 rounded-md text-xs transition-colors flex items-center gap-1 whitespace-nowrap ${
                          selectedFolder === folder.id 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                        onClick={() => handleFolderClick(folder.id)}
                      >
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className="truncate max-w-[100px]">{folder.name}</span>
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      className="px-2 py-1 rounded-md text-xs border-dashed whitespace-nowrap"
                      onClick={() => navigate("/folders")}
                    >
                      <Folder className="h-3 w-3 mr-1" /> Gestionar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Upcoming Events Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximos eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No hay eventos próximos
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.slice(0, 5).map(event => (
                      <div 
                        key={event.id} 
                        className="p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                        onClick={() => navigate("/calendar")}
                      >
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(event.date), "PPPp", { locale: es })}
                        </div>
                      </div>
                    ))}
                    
                    {upcomingEvents.length > 5 && (
                      <Button 
                        variant="link" 
                        className="w-full text-sm" 
                        onClick={() => navigate("/calendar")}
                      >
                        Ver todos los eventos ({upcomingEvents.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Content */}
          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">
                  Tus Transcripciones
                </CardTitle>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="w-full pl-8 pr-4"
                    placeholder="Buscar transcripciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredRecordings.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-gray-600 dark:text-gray-400 font-medium">No hay transcripciones</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                      {user?.role === "teacher" 
                        ? "Sube tu primer PDF para comenzar" 
                        : "Graba tu primer audio para comenzar"}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {filteredRecordings.map(recording => (
                      <RecordingItem 
                        key={recording.id} 
                        recording={recording} 
                        onAddToCalendar={handleAddToCalendar} 
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
