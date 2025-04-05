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
  output: string;
  children?: React.ReactNode;
}

export function LiveTranscriptionSheet({
  isTranscribing,
  output,
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
          <SheetTitle>Información del webhook</SheetTitle>
          <SheetDescription>
            Visualiza la información recibida del webhook
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <TranscriptionPanel
            output={output}
            isLoading={isTranscribing && !output}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
