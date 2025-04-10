
export interface Recording {
  id: string;
  title?: string;
  createdAt: string;
  // Add other relevant properties
}

export interface Folder {
  id: string;
  name?: string;
  recordingsCount?: number;
  // Add other relevant properties
}

export interface RecordingsContextType {
  recordings: Recording[];
  recentRecordings: Recording[]; // Added this property
  folders: Folder[];
  fetchUserData: () => Promise<void>; // Added this property
  addRecording: (recording: Recording) => void;
  deleteRecording: (id: string) => void;
}
