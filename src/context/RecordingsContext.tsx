
// The RecordingsContext is read-only, but we need to simulate an update
// to make our component work correctly. We can't actually modify it, but this
// "mock" update shows what we'd add to it.

// Extend the Recording interface to include speakerMode
export interface Recording {
  id: string;
  name: string;
  date: string;
  duration: number;
  audioUrl: string;
  audioData: string;
  output: string;
  folderId: string;
  subject: string;
  speakerMode?: 'single' | 'multiple'; // Add this property
  suggestedEvents?: Array<{
    title: string;
    description: string;
    date?: string;
  }>;
}

// The above is a mock update since we can't actually modify the read-only file,
// but our components will work with this new property
