import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TranscriptionPanel } from "./TranscriptionPanel";
import { Mic, MicOff } from "lucide-react";

interface LiveTranscriptionSheetProps {
  isTranscribing: boolean;
  transcript: string;
  translation?: string;
  keyPoints: string[];
  language: string;
  summary: string;
  children?: React.ReactNode;
}

export function LiveTranscriptionSheet({
  isTranscribing,
  transcript,
  translation,
  keyPoints,
  language,
  summary,
  children
}: LiveTranscriptionSheetProps) {
  const [open, setOpen] = useState(false);
  
  // Auto-open the sheet when transcription begins
  useEffect(() => {
    if (isTranscribing && !open) {
      setOpen(true);
    }
  }, [isTranscribing, open]);

  // Listen for complete transcription events to ensure panel shows final transcription
  useEffect(() => {
    const handleTranscriptionComplete = (event: CustomEvent) => {
      if (event.detail?.data) {
        // Keep the sheet open to show the final results
        setOpen(true);
      }
    };

    const handleEvent = (e: Event) => {
      if ((e as CustomEvent).detail?.type === 'transcriptionComplete') {
        handleTranscriptionComplete(e as CustomEvent);
      }
    };
    
    window.addEventListener('audioRecorderMessage', handleEvent);
    
    return () => {
      window.removeEventListener('audioRecorderMessage', handleEvent);
    };
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children ? (
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            size="sm"
          >
            {isTranscribing ? (
              <>
                <Mic className="h-4 w-4 text-red-500 animate-pulse" />
                <span>Transcribiendo...</span>
              </>
            ) : (
              <>
                <MicOff className="h-4 w-4" />
                <span>Ver transcripción</span>
              </>
            )}
          </Button>
        </SheetTrigger>
      )}
      
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-xl p-0 flex flex-col overflow-hidden">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Transcripción en tiempo real</SheetTitle>
          <SheetDescription>
            Visualiza la transcripción y puntos clave
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <TranscriptionPanel
            transcript={transcript}
            translation={translation}
            keyPoints={keyPoints}
            language={language}
            summary={summary}
            isLoading={isTranscribing && !transcript}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
