
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecordings } from "@/context/RecordingsContext";
import { Layout } from "@/components/Layout";

export default function Dashboard() {
  const navigate = useNavigate();
  const { recordings, folders } = useRecordings();
  
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

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-custom-primary dark:text-custom-accent dark:text-white">Transcripciones</h1>
        
        <div className="glassmorphism rounded-xl p-4 md:p-6 shadow-lg dark:bg-custom-secondary/20 dark:border-custom-secondary/40">
          <div className="flex flex-col space-y-6">
            <div className="px-4 py-3">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Transcripciones</h2>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg m-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <input
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
                  <button
                    key={folder.id}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      selectedFolder === folder.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    {folder.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-300 mb-4">Tus Transcripciones</h3>
              
              {filteredRecordings.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No hay transcripciones</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Graba tu primer audio para comenzar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecordings.map(recording => (
                    <div 
                      key={recording.id}
                      className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <h4 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-2">{recording.name}</h4>
                      
                      {recording.summary && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{recording.summary}</p>
                      )}
                      
                      <button
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                        onClick={() => handleAddToCalendar(recording)}
                      >
                        Agregar al calendario
                      </button>
                    </div>
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
