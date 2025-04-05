
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecordings } from "@/context/RecordingsContext";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import { PdfUploader } from "@/components/PdfUploader";
import { AudioRecorder } from "@/components/AudioRecorder";
import { RecordingItem } from "@/components/RecordingItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Folder, Mic, FileText } from "lucide-react";
import { LiveTranscriptionSheet } from "@/components/LiveTranscriptionSheet";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const { recordings, folders } = useRecordings();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("default");
  
  // Estado para la transcripción en tiempo real
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState({
    transcript: "",
    translation: "",
    keyPoints: [],
    language: "es",
    summary: ""
  });
  
  // Filter recordings based on search term and selected folder
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
  
  const handleAddToCalendar = (recording) => {
    // Navigate to calendar with the recording data
    navigate("/calendar", { state: { recording } });
  };
  
  const handleFolderClick = (folderId: string) => {
    setSelectedFolder(folderId);
  };

  // Create a custom event handler for the AudioRecorder that will be passed to data-* attributes
  // and handled via event listeners
  const handleAudioRecorderMessage = (event: CustomEvent) => {
    const { type, data } = event.detail;
    
    if (type === 'transcriptionUpdate') {
      setIsTranscribing(true);
      setLiveTranscription({
        transcript: data.transcript || "",
        translation: data.translation || "",
        keyPoints: data.keyPoints || [],
        language: data.language || "es",
        summary: data.summary || ""
      });
    } else if (type === 'transcriptionComplete') {
      setIsTranscribing(false);
      toast.success("Transcripción completada");
    }
  };
  
  // Add event listener on component mount
  React.useEffect(() => {
    // Use a typed event listener
    const handleEvent = (e: Event) => {
      handleAudioRecorderMessage(e as CustomEvent);
    };
    
    window.addEventListener('audioRecorderMessage', handleEvent);
    
    return () => {
      window.removeEventListener('audioRecorderMessage', handleEvent);
    };
  }, []);

  return (
    <Layout>
      <div className="space-y-4 max-w-full">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-custom-primary dark:text-custom-accent dark:text-white">Mi Dashboard</h1>
          
          {/* Panel de transcripción en tiempo real */}
          <LiveTranscriptionSheet
            isTranscribing={isTranscribing}
            transcript={liveTranscription.transcript}
            translation={liveTranscription.translation}
            keyPoints={liveTranscription.keyPoints}
            language={liveTranscription.language}
            summary={liveTranscription.summary}
          >
            <Button 
              variant={isTranscribing ? "default" : "outline"} 
              className="flex items-center gap-2"
              size="sm"
            >
              {isTranscribing ? (
                <>
                  <Mic className="h-4 w-4 text-white animate-pulse" />
                  <span>Transcribiendo...</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>Transcripciones</span>
                </>
              )}
            </Button>
          </LiveTranscriptionSheet>
        </div>
        
        {/* Mostrar componentes según el rol del usuario */}
        {user?.role === "teacher" ? (
          /* Teacher section: PDF Uploader */
          <PdfUploader />
        ) : (
          /* Student section: Audio Recorder - we'll use data attributes instead of props */
          <AudioRecorder 
            data-enable-messaging="true"
          />
        )}
        
        <div className="glassmorphism rounded-xl p-3 md:p-6 shadow-lg dark:bg-custom-secondary/20 dark:border-custom-secondary/40 overflow-hidden">
          <div className="flex flex-col space-y-4">
            <div className="px-2 md:px-4 py-2 md:py-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">Transcripciones</h2>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/30 p-3 md:p-4 rounded-lg mx-1 md:m-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <Input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                placeholder="Buscar transcripciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Carpeta
              </label>
              <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto max-w-full pb-2">
                {folders.map(folder => (
                  <Button
                    key={folder.id}
                    className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm transition-colors flex items-center gap-1 whitespace-nowrap ${
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
                    <span className="truncate max-w-[100px] md:max-w-[150px]">{folder.name}</span>
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  className="px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm border-dashed whitespace-nowrap"
                  onClick={() => navigate("/folders")}
                >
                  <Folder className="h-3 w-3 mr-1" /> Gestionar carpetas
                </Button>
              </div>
            </div>
            
            <div className="p-2 md:p-4">
              <h3 className="text-base md:text-lg font-medium text-gray-800 dark:text-gray-300 mb-4">Tus Transcripciones</h3>
              
              {filteredRecordings.length === 0 ? (
                <div className="p-4 md:p-8 text-center bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No hay transcripciones</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                    {user?.role === "teacher" 
                      ? "Sube tu primer PDF para comenzar" 
                      : "Graba tu primer audio para comenzar"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </div>
    </Layout>
  );
}
