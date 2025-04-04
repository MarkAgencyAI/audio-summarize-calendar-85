
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AudioRecorder } from "@/components/AudioRecorder";
import { RecordingItem } from "@/components/RecordingItem";
import { Recording, useRecordings } from "@/context/RecordingsContext";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarEvent } from "@/components/Calendar";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { PdfUploader } from "@/components/PdfUploader";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recordings, folders } = useRecordings();
  const isMobile = useIsMobile();
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("default");
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  
  // Load events from localStorage
  useEffect(() => {
    const storedEvents = localStorage.getItem("events");
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    }
  }, []);
  
  // Save events to localStorage when they change
  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);
  
  const filteredRecordings = recordings.filter(recording => {
    // Filter by folder
    const folderMatch = selectedFolder === "default" ? true : recording.folderId === selectedFolder;
    
    // Filter by search term
    const searchMatch = searchTerm
      ? recording.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recording.transcript.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recording.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      : true;
    
    return folderMatch && searchMatch;
  });
  
  const handleAddEvent = (event: Omit<CalendarEvent, "id">) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
    };
    setEvents(prev => [...prev, newEvent]);
  };
  
  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };
  
  const handleAddToCalendar = (recording: Recording) => {
    navigate("/calendar", { state: { recording } });
  };
  
  // Determine if user is a teacher or student
  const isTeacher = user?.role === "teacher";
  
  // Get the page title based on user role
  const pageTitle = isTeacher ? "Transcripciones" : "Grabaciones";
  
  return (
    <Layout>
      <div className="space-y-10">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-custom-primary dark:text-custom-accent">{pageTitle}</h1>
          
          {/* Show AudioRecorder to students, PdfUploader to teachers */}
          {!isTeacher ? (
            <AudioRecorder />
          ) : (
            <div className="glassmorphism rounded-xl p-4 md:p-6 shadow-lg mb-8">
              <PdfUploader />
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="dark:text-white">Buscar</Label>
                <Input
                  id="search"
                  placeholder={`Buscar ${pageTitle.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="dark:bg-custom-secondary/30 dark:border-custom-secondary/60 dark:placeholder:text-white/50 dark:text-white"
                />
              </div>
              
              <div className="w-full md:w-64">
                <Label htmlFor="folder" className="dark:text-white">Carpeta</Label>
                <select
                  id="folder"
                  className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md dark:bg-custom-secondary/30 dark:border-custom-secondary/60 dark:text-white"
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
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-custom-primary dark:text-custom-accent">{`Tus ${pageTitle}`}</h2>
          
          {filteredRecordings.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-lg bg-muted/30 dark:bg-custom-secondary/10 dark:border-custom-secondary/40">
              <p className="text-muted-foreground dark:text-white/60">No hay {pageTitle.toLowerCase()}</p>
              <p className="text-sm text-muted-foreground dark:text-white/60 mt-2">
                {isTeacher 
                  ? "Sube material en PDF para obtener resúmenes" 
                  : "Graba tu primer audio para comenzar"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecordings.map(recording => (
                <RecordingItem 
                  key={recording.id} 
                  recording={recording} 
                  onAddToCalendar={handleAddToCalendar}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
