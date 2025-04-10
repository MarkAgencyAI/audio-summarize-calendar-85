
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
  recentRecordings: Recording[];
  folders: Folder[];
  fetchUserData: () => Promise<void>;
  addRecording: (recording: Recording) => void;
  deleteRecording: (id: string) => void;
}
