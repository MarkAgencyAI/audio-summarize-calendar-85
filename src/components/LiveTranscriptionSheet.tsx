
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TranscriptionPanel } from "./TranscriptionPanel";
import { Mic, X, Play, Pause, Loader2, Square, User, Users, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LiveTranscriptionSheetProps {
  isTranscribing: boolean;
  output: string | { output: string } | any;
  progress?: number;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  webhookResponse?: any;
}

export function LiveTranscriptionSheet({
  isTranscribing,
  output,
  progress = 0,
  children,
  open,
  onOpenChange,
  webhookResponse
}: LiveTranscriptionSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [userClosed, setUserClosed] = useState(false);
  const [activeTab, setActiveTab] = useState("transcription");
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
    if (!newOpen) {
      setUserClosed(true);
    }
  };

  // Auto-open the sheet when transcription begins, but only if user hasn't explicitly closed it
  useEffect(() => {
    if (isTranscribing && !isOpen && !userClosed) {
      handleOpenChange(true);
    }

    // Reset userClosed flag when transcription stops
    if (!isTranscribing) {
      setUserClosed(false);
    }
  }, [isTranscribing, isOpen, userClosed]);

  // Listen for complete transcription events to ensure panel shows final transcription
  useEffect(() => {
    const handleTranscriptionComplete = (event: CustomEvent) => {
      if (event.detail?.data && !userClosed) {
        // Keep the sheet open to show the final results
        handleOpenChange(true);
        
        // Si hay respuesta del webhook, cambiar a esa pestaña
        if (event.detail.data.webhookResponse) {
          setActiveTab("webhook");
        }
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
    handleOpenChange(false);
    setUserClosed(true);
  };
  
  // Ensure the output is safe to render by normalizing it to a string format
  // This is crucial to fix the React error #31
  const safeOutput = (() => {
    try {
      if (output === null || output === undefined) {
        return "";
      }
      
      if (typeof output === 'string') {
        return output;
      }
      
      if (typeof output === 'object') {
        if ('output' in output && typeof output.output === 'string') {
          return output.output;
        }
        
        return JSON.stringify(output, null, 2);
      }
      
      return String(output);
    } catch (error) {
      console.error("Error processing output:", error);
      return "Error: No se pudo procesar el formato de salida";
    }
  })();
  
  // Procesar webhook response para mostrarlo
  const hasWebhookResponse = webhookResponse || 
    (typeof output === 'object' && output && 'webhookResponse' in output);
  
  const webhookContent = (() => {
    try {
      if (webhookResponse) {
        return typeof webhookResponse === 'string' 
          ? webhookResponse 
          : JSON.stringify(webhookResponse, null, 2);
      }
      
      if (typeof output === 'object' && output && 'webhookResponse' in output) {
        const resp = output.webhookResponse;
        return typeof resp === 'string' ? resp : JSON.stringify(resp, null, 2);
      }
      
      return "No hay respuesta del webhook aún";
    } catch (error) {
      return "Error al procesar la respuesta del webhook";
    }
  })();
  
  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {children ? (
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          
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
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </SheetClose>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="bg-muted/30 p-1 mx-4 my-2">
              <TabsTrigger value="transcription">Transcripción</TabsTrigger>
              <TabsTrigger value="webhook" disabled={!hasWebhookResponse}>
                Respuesta del Webhook
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transcription" className="flex-1 overflow-hidden mt-0 px-0">
              <div className="px-4 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Progreso de transcripción</span>
                  <span className="text-xs font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
                </div>
              </div>
            
              <TranscriptionPanel 
                output={safeOutput}
                isLoading={isTranscribing && !output}
                progress={progress}
                showProgress={false}
              />
            </TabsContent>
            
            <TabsContent value="webhook" className="flex-1 overflow-hidden mt-0 px-0">
              <TranscriptionPanel 
                output={webhookContent}
                isLoading={false}
                showProgress={false}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
