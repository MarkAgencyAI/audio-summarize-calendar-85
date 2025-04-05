
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
    const updatedRecordings = savedRecordings.map((recording: any) => {
      if (!('output' in recording) && 'transcript' in recording) {
        // Create a new recording object with all required properties
        const updatedRec: Recording = {
          id: recording.id,
          name: recording.name || recording.title || "Sin nombre",
          audioUrl: recording.audioUrl || "",
          audioData: recording.audioData || "",
          createdAt: recording.createdAt || Date.now(),
          folderId: recording.folderId || "default",
          duration: recording.duration || 0,
          output: recording.transcript || recording.summary || recording.output || "No hay información disponible",
          // Copy optional properties if they exist
          subject: recording.subject,
          suggestedEvents: recording.suggestedEvents
        };
        
        return updatedRec;
      }
      return recording as Recording;
    });
    
    setRecordings(updatedRecordings);
    setFolders(savedFolders);
  }, []);

  // Save recordings and folders to storage on change
  useEffect(() => {
    if (recordings.length > 0) {
      saveToStorage("recordings", recordings);
    }
  }, [recordings]);

  useEffect(() => {
    if (folders.length > 0) {
      saveToStorage("folders", folders);
    }
  }, [folders]);

  // Add a new recording
  const addRecording = (recordingData: Omit<Recording, "id" | "createdAt">) => {
    const newRecording: Recording = {
      id: uuidv4(),
      createdAt: Date.now(),
      name: recordingData.name,
      audioUrl: recordingData.audioUrl,
      audioData: recordingData.audioData,
      output: recordingData.output,
      folderId: recordingData.folderId,
      duration: recordingData.duration,
      subject: recordingData.subject,
      suggestedEvents: recordingData.suggestedEvents
    };
    
    setRecordings(prev => {
      const updatedRecordings = [newRecording, ...prev];
      // Save to localStorage immediately to ensure persistence
      saveToStorage("recordings", updatedRecordings);
      return updatedRecordings;
    });
  };

  // Update a recording
  const updateRecording = (id: string, data: Partial<Recording>) => {
    setRecordings(prev => {
      const updatedRecordings = prev.map(recording => 
        recording.id === id ? { ...recording, ...data } : recording
      );
      // Save to localStorage immediately
      saveToStorage("recordings", updatedRecordings);
      return updatedRecordings;
    });
  };

  // Delete a recording
  const deleteRecording = (id: string) => {
    setRecordings(prev => {
      const updatedRecordings = prev.filter(recording => recording.id !== id);
      // Save to localStorage immediately
      saveToStorage("recordings", updatedRecordings);
      return updatedRecordings;
    });
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
    
    setFolders(prev => {
      const updatedFolders = [...prev, newFolder];
      // Save to localStorage immediately
      saveToStorage("folders", updatedFolders);
      return updatedFolders;
    });
  };

  // Update a folder
  const updateFolder = (id: string, data: Partial<Folder>) => {
    setFolders(prev => {
      const updatedFolders = prev.map(folder => 
        folder.id === id ? { ...folder, ...data } : folder
      );
      // Save to localStorage immediately
      saveToStorage("folders", updatedFolders);
      return updatedFolders;
    });
  };

  // Delete a folder (and move recordings to default)
  const deleteFolder = (id: string) => {
    if (id === "default") return; // Prevent deleting default folder
    
    // Move recordings to default folder
    setRecordings(prev => {
      const updatedRecordings = prev.map(recording => 
        recording.folderId === id 
          ? { ...recording, folderId: "default" } 
          : recording
      );
      // Save to localStorage immediately
      saveToStorage("recordings", updatedRecordings);
      return updatedRecordings;
    });
    
    // Delete the folder
    setFolders(prev => {
      const updatedFolders = prev.filter(folder => folder.id !== id);
      // Save to localStorage immediately
      saveToStorage("folders", updatedFolders);
      return updatedFolders;
    });
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
