import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface Recording {
  id: string;
  name: string;
  audioUrl: string;
  audioData?: string; // Base64 audio data for persistent storage
  transcript: string;
  summary: string | null;
  keyPoints: string[];
  folderId: string;
  createdAt: Date;
  duration: number;
  suggestedEvents?: {
    title: string;
    description: string;
    date?: string;
  }[];
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

interface RecordingsContextType {
  recordings: Recording[];
  folders: Folder[];
  addRecording: (recording: Omit<Recording, "id" | "createdAt">) => void;
  updateRecording: (id: string, data: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;
  addFolder: (name: string, color: string) => Folder;
  updateFolder: (id: string, data: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  getAudioUrl: (recording: Recording) => string;
}

const RecordingsContext = createContext<RecordingsContextType | undefined>(undefined);

const DEFAULT_FOLDERS: Folder[] = [
  {
    id: "default",
    name: "Todas las grabaciones",
    color: "#3b82f6",
    createdAt: new Date(),
  },
];

export function RecordingsProvider({ children }: { children: ReactNode }) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [folders, setFolders] = useState<Folder[]>(DEFAULT_FOLDERS);

  useEffect(() => {
    // Load recordings and folders from localStorage
    const storedRecordings = localStorage.getItem("recordings");
    const storedFolders = localStorage.getItem("folders");

    if (storedRecordings) {
      setRecordings(JSON.parse(storedRecordings).map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
      })));
    }

    if (storedFolders) {
      setFolders(JSON.parse(storedFolders).map((f: any) => ({
        ...f,
        createdAt: new Date(f.createdAt),
      })));
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("recordings", JSON.stringify(recordings));
  }, [recordings]);

  useEffect(() => {
    localStorage.setItem("folders", JSON.stringify(folders));
  }, [folders]);

  // Helper function to get valid audio URL
  const getAudioUrl = (recording: Recording): string => {
    // If we have stored audioData (base64), create a blob URL
    if (recording.audioData) {
      try {
        // Convert base64 to blob
        const byteCharacters = atob(recording.audioData.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/webm' });
        
        // Create and return blob URL
        return URL.createObjectURL(blob);
      } catch (error) {
        console.error("Error creating audio URL from data:", error);
      }
    }
    
    // Fall back to stored URL if no data or error occurred
    return recording.audioUrl;
  };

  const addRecording = (recordingData: Omit<Recording, "id" | "createdAt">) => {
    const newRecording: Recording = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...recordingData,
    };
    setRecordings(prev => [newRecording, ...prev]);
  };

  const updateRecording = (id: string, data: Partial<Recording>) => {
    setRecordings(prev =>
      prev.map(recording =>
        recording.id === id ? { ...recording, ...data } : recording
      )
    );
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(recording => recording.id !== id));
  };

  const addFolder = (name: string, color: string): Folder => {
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      color,
      createdAt: new Date(),
    };
    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  };

  const updateFolder = (id: string, data: Partial<Folder>) => {
    setFolders(prev =>
      prev.map(folder => (folder.id === id ? { ...folder, ...data } : folder))
    );
  };

  const deleteFolder = (id: string) => {
    // Don't allow deleting the default folder
    if (id === "default") return;
    
    // Move recordings from deleted folder to default folder
    setRecordings(prev =>
      prev.map(recording =>
        recording.folderId === id ? { ...recording, folderId: "default" } : recording
      )
    );
    
    // Delete the folder
    setFolders(prev => prev.filter(folder => folder.id !== id));
  };

  return (
    <RecordingsContext.Provider
      value={{
        recordings,
        folders,
        addRecording,
        updateRecording,
        deleteRecording,
        addFolder,
        updateFolder,
        deleteFolder,
        getAudioUrl,
      }}
    >
      {children}
    </RecordingsContext.Provider>
  );
}

export function useRecordings() {
  const context = useContext(RecordingsContext);
  if (context === undefined) {
    throw new Error("useRecordings must be used within a RecordingsProvider");
  }
  return context;
}
