
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
  
  return (
    <Layout>
      <div className="space-y-10">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Grabaciones</h1>
          
          <AudioRecorder />
          
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Buscar grabaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="w-full md:w-64">
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
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Tus grabaciones</h2>
          
          {filteredRecordings.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">No hay grabaciones</p>
              <p className="text-sm text-muted-foreground mt-2">
                Graba tu primer audio para comenzar
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
