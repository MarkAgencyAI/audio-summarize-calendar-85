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

// Note type
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  folderId: string;
  imageUrl?: string;
}

// Grade type
export interface Grade {
  id: string;
  name: string;
  score: number;
  createdAt: number;
  folderId: string;
}

// Folder type
export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  icon?: string;
  grades?: Grade[];
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
  grades: Grade[];
  addGrade: (folderId: string, name: string, score: number) => void;
  updateGrade: (id: string, data: Partial<Grade>) => void;
  deleteGrade: (id: string) => void;
  getFolderGrades: (folderId: string) => Grade[];
  calculateFolderAverage: (folderId: string) => number;
  notes: Note[];
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  getFolderNotes: (folderId: string) => Note[];
}

// Create context
const RecordingsContext = createContext<RecordingsContextType | null>(null);

// Provider component
export const RecordingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Load recordings, folders, grades and notes from storage on mount
  useEffect(() => {
    const savedRecordings = loadFromStorage<Recording[]>("recordings") || [];
    const savedFolders = loadFromStorage<Folder[]>("folders") || [
      { id: "default", name: "General", color: "#6366f1", createdAt: Date.now(), icon: "folder" }
    ];
    const savedGrades = loadFromStorage<Grade[]>("grades") || [];
    const savedNotes = loadFromStorage<Note[]>("notes") || [];
    
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
    setGrades(savedGrades);
    setNotes(savedNotes);
  }, []);

  // Save recordings, folders, grades and notes to storage on change
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

  useEffect(() => {
    if (grades.length > 0) {
      saveToStorage("grades", grades);
    }
  }, [grades]);
  
  useEffect(() => {
    if (notes.length > 0) {
      saveToStorage("notes", notes);
    }
  }, [notes]);

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
    
    // Move notes to default folder
    setNotes(prev => {
      const updatedNotes = prev.map(note => 
        note.folderId === id 
          ? { ...note, folderId: "default" } 
          : note
      );
      // Save to localStorage immediately
      saveToStorage("notes", updatedNotes);
      return updatedNotes;
    });
    
    // Delete the folder's grades
    setGrades(prev => {
      const updatedGrades = prev.filter(grade => grade.folderId !== id);
      // Save to localStorage immediately
      saveToStorage("grades", updatedGrades);
      return updatedGrades;
    });
    
    // Delete the folder
    setFolders(prev => {
      const updatedFolders = prev.filter(folder => folder.id !== id);
      // Save to localStorage immediately
      saveToStorage("folders", updatedFolders);
      return updatedFolders;
    });
  };

  // Add a new grade
  const addGrade = (folderId: string, name: string, score: number) => {
    const newGrade: Grade = {
      id: uuidv4(),
      name,
      score,
      createdAt: Date.now(),
      folderId
    };
    
    setGrades(prev => {
      const updatedGrades = [...prev, newGrade];
      // Save to localStorage immediately
      saveToStorage("grades", updatedGrades);
      return updatedGrades;
    });
  };

  // Update a grade
  const updateGrade = (id: string, data: Partial<Grade>) => {
    setGrades(prev => {
      const updatedGrades = prev.map(grade => 
        grade.id === id ? { ...grade, ...data } : grade
      );
      // Save to localStorage immediately
      saveToStorage("grades", updatedGrades);
      return updatedGrades;
    });
  };

  // Delete a grade
  const deleteGrade = (id: string) => {
    setGrades(prev => {
      const updatedGrades = prev.filter(grade => grade.id !== id);
      // Save to localStorage immediately
      saveToStorage("grades", updatedGrades);
      return updatedGrades;
    });
  };

  // Get grades for a specific folder
  const getFolderGrades = (folderId: string) => {
    return grades.filter(grade => grade.folderId === folderId);
  };

  // Calculate average grade for a folder
  const calculateFolderAverage = (folderId: string) => {
    const folderGrades = getFolderGrades(folderId);
    if (folderGrades.length === 0) return 0;
    
    const sum = folderGrades.reduce((total, grade) => total + grade.score, 0);
    return parseFloat((sum / folderGrades.length).toFixed(1));
  };

  // Add a new note
  const addNote = (noteData: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const newNote: Note = {
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: noteData.title,
      content: noteData.content,
      folderId: noteData.folderId,
      imageUrl: noteData.imageUrl,
    };
    
    setNotes(prev => {
      const updatedNotes = [newNote, ...prev];
      // Save to localStorage immediately to ensure persistence
      saveToStorage("notes", updatedNotes);
      return updatedNotes;
    });
  };

  // Update a note
  const updateNote = (id: string, data: Partial<Note>) => {
    setNotes(prev => {
      const updatedNotes = prev.map(note => 
        note.id === id ? { ...note, ...data, updatedAt: Date.now() } : note
      );
      // Save to localStorage immediately
      saveToStorage("notes", updatedNotes);
      return updatedNotes;
    });
  };

  // Delete a note
  const deleteNote = (id: string) => {
    setNotes(prev => {
      const updatedNotes = prev.filter(note => note.id !== id);
      // Save to localStorage immediately
      saveToStorage("notes", updatedNotes);
      return updatedNotes;
    });
  };

  // Get notes for a specific folder
  const getFolderNotes = (folderId: string) => {
    return notes.filter(note => note.folderId === folderId);
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
      deleteFolder,
      grades,
      addGrade,
      updateGrade,
      deleteGrade,
      getFolderGrades,
      calculateFolderAverage,
      notes,
      addNote,
      updateNote,
      deleteNote,
      getFolderNotes
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
