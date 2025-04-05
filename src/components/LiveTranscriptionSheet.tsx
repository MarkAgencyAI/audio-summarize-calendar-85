import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TranscriptionPanel } from "./TranscriptionPanel";
import { Mic, X } from "lucide-react";

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
  const [userClosed, setUserClosed] = useState(false);
  
  // Auto-open the sheet when transcription begins, but only if user hasn't explicitly closed it
  useEffect(() => {
    if (isTranscribing && !open && !userClosed) {
      setOpen(true);
    }
    
    // Reset userClosed flag when transcription stops
    if (!isTranscribing) {
      setUserClosed(false);
    }
  }, [isTranscribing, open, userClosed]);

  // Listen for complete transcription events to ensure panel shows final transcription
  useEffect(() => {
    const handleTranscriptionComplete = (event: CustomEvent) => {
      if (event.detail?.data && !userClosed) {
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
  }, [userClosed]);

  const handleClose = () => {
    setOpen(false);
    setUserClosed(true);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setUserClosed(true);
      }
    }}>
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
                <Mic className="h-4 w-4" />
                <span>Ver transcripción</span>
              </>
            )}
          </Button>
        </SheetTrigger>
      )}
      
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-xl p-0 flex flex-col overflow-hidden">
        <SheetHeader className="p-4 border-b flex flex-row justify-between items-center">
          <div>
            <SheetTitle>Transcripción en proceso</SheetTitle>
            <SheetDescription>
              Visualiza la transcripción en tiempo real
            </SheetDescription>
          </div>
          <SheetClose asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </SheetClose>
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
