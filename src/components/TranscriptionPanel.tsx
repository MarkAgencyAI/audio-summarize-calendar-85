
import React from "react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Globe, BookOpen, Clock, AlertCircle, Loader2 } from "lucide-react";

interface TranscriptionPanelProps {
  output: string | object | null | undefined;
  isLoading?: boolean;
  progress?: number;
  showProgress?: boolean;
}

export function TranscriptionPanel({
  output,
  isLoading = false,
  progress = 0,
  showProgress = false
}: TranscriptionPanelProps) {
  // Improved output processing with more comprehensive type handling
  const displayOutput = React.useMemo(() => {
    // Handle null or undefined
    if (output === null || output === undefined) {
      return '';
    }
    
    // If it's already a string, return it
    if (typeof output === 'string') {
      return output;
    }
    
    // Handle object with output property
    if (typeof output === 'object') {
      // Check if it has an 'output' property that is a string
      if ('output' in output && typeof (output as any).output === 'string') {
        return (output as any).output;
      }
      
      // If not, try to stringify the entire object
      try {
        return JSON.stringify(output, null, 2);
      } catch {
        return 'Error: Could not parse object data';
      }
    }
    
    // Fallback for any other unexpected type
    return String(output);
  }, [output]);
    
  return (
    <div className="w-full h-full flex flex-col bg-card rounded-lg border shadow-sm overflow-hidden">
      <Tabs defaultValue="output" className="w-full h-full flex flex-col">
        <div className="border-b px-4 py-2 bg-muted/40 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Información recibida</h3>
        </div>
        
        <TabsList className="bg-muted/30 p-1 mx-4 my-2 grid grid-cols-1">
          <TabsTrigger value="output">Información del Webhook</TabsTrigger>
        </TabsList>
        
        {showProgress && (
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progreso de transcripción</span>
              <span className="text-xs font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        <div className="flex-1 overflow-hidden p-4">
          {isLoading && !displayOutput ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                </div>
                <div className="text-center text-muted-foreground">
                  Procesando audio...
                </div>
              </div>
            </div>
          ) : (
            <TabsContent value="output" className="mt-0 h-full">
              <ScrollArea className="h-full bg-muted/20 rounded-md p-4">
                {displayOutput ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm">{displayOutput}</pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-muted-foreground">No hay información disponible</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
