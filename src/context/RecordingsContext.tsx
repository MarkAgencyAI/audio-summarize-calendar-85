
import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { loadFromStorage, saveToStorage } from "@/lib/storage";

// Recording type
export interface Recording {
  id: string;
  name: string;
  audioUrl: string;
  audioData: string;
  output: string; // Contains the data from webhook
  createdAt: number;
  folderId: string;
  duration: number;
  subject?: string;
  suggestedEvents?: Array<{
    title: string;
    description: string;
    date?: string;
  }>;
}

// Folder type
export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  icon?: string; // Add icon field to match usage in FolderSystem
}

// Context type
interface RecordingsContextType {
  recordings: Recording[];
  addRecording: (recording: Omit<Recording, "id" | "createdAt">) => void;
  updateRecording: (id: string, data: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;
  folders: Folder[];
  addFolder: (name: string, color: string, icon?: string) => void;
  updateFolder: (id: string, data: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
}

// Create context
const RecordingsContext = createContext<RecordingsContextType | null>(null);

// Provider component
export const RecordingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  // Load recordings and folders from storage on mount
  useEffect(() => {
    const savedRecordings = loadFromStorage<Recording[]>("recordings") || [];
    const savedFolders = loadFromStorage<Folder[]>("folders") || [
      { id: "default", name: "General", color: "#6366f1", createdAt: Date.now(), icon: "folder" }
    ];
    
    // Convert any old recordings format to new format
    const updatedRecordings = savedRecordings.map(recording => {
      if (!('output' in recording) && 'transcript' in recording) {
        const rec = recording as any; // Use any to access old properties
        return {
          ...recording,
          output: rec.transcript || rec.summary || "No hay información disponible"
        };
      }
      return recording;
    });
    
    setRecordings(updatedRecordings);
    setFolders(savedFolders);
  }, []);

  // Save recordings and folders to storage on change
  useEffect(() => {
    saveToStorage("recordings", recordings);
  }, [recordings]);

  useEffect(() => {
    saveToStorage("folders", folders);
  }, [folders]);

  // Add a new recording
  const addRecording = (recordingData: Omit<Recording, "id" | "createdAt">) => {
    const newRecording: Recording = {
      ...recordingData,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    setRecordings(prev => [newRecording, ...prev]);
  };

  // Update a recording
  const updateRecording = (id: string, data: Partial<Recording>) => {
    setRecordings(prev => 
      prev.map(recording => 
        recording.id === id ? { ...recording, ...data } : recording
      )
    );
  };

  // Delete a recording
  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(recording => recording.id !== id));
  };

  // Add a new folder
  const addFolder = (name: string, color: string, icon?: string) => {
    const newFolder: Folder = {
      name,
      color,
      icon,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    setFolders(prev => [...prev, newFolder]);
  };

  // Update a folder
  const updateFolder = (id: string, data: Partial<Folder>) => {
    setFolders(prev => 
      prev.map(folder => 
        folder.id === id ? { ...folder, ...data } : folder
      )
    );
  };

  // Delete a folder (and move recordings to default)
  const deleteFolder = (id: string) => {
    if (id === "default") return; // Prevent deleting default folder
    
    // Move recordings to default folder
    setRecordings(prev => 
      prev.map(recording => 
        recording.folderId === id 
          ? { ...recording, folderId: "default" } 
          : recording
      )
    );
    
    // Delete the folder
    setFolders(prev => prev.filter(folder => folder.id !== id));
  };

  return (
    <RecordingsContext.Provider value={{
      recordings,
      addRecording,
      updateRecording,
      deleteRecording,
      folders,
      addFolder,
      updateFolder,
      deleteFolder
    }}>
      {children}
    </RecordingsContext.Provider>
  );
};

// Custom hook to use the recordings context
export const useRecordings = () => {
  const context = useContext(RecordingsContext);
  if (!context) {
    throw new Error("useRecordings must be used within a RecordingsProvider");
  }
  return context;
};
