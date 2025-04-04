
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
import { Folder } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { recordings, folders } = useRecordings();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("default");
  
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

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-custom-primary dark:text-custom-accent dark:text-white">Mi Dashboard</h1>
        
        {/* Mostrar componentes según el rol del usuario */}
        {user?.role === "teacher" ? (
          /* Teacher section: PDF Uploader */
          <PdfUploader />
        ) : (
          /* Student section: Audio Recorder */
          <AudioRecorder />
        )}
        
        <div className="glassmorphism rounded-xl p-4 md:p-6 shadow-lg dark:bg-custom-secondary/20 dark:border-custom-secondary/40">
          <div className="flex flex-col space-y-6">
            <div className="px-4 py-3">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Transcripciones</h2>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg m-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <Input
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                placeholder="Buscar transcripciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Carpeta
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {folders.map(folder => (
                  <Button
                    key={folder.id}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${
                      selectedFolder === folder.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                    onClick={() => handleFolderClick(folder.id)}
                  >
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: folder.color }}
                    />
                    {folder.name}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  className="px-3 py-1.5 rounded-md text-sm border-dashed"
                  onClick={() => navigate("/folders")}
                >
                  <Folder className="h-3 w-3 mr-1" /> Gestionar carpetas
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-300 mb-4">Tus Transcripciones</h3>
              
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
                <div className="space-y-4">
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
