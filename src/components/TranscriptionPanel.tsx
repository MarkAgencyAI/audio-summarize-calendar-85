
import React from "react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, BookOpen, Clock, AlertCircle } from "lucide-react";

interface TranscriptionPanelProps {
  output: string;
  isLoading?: boolean;
  waitingForWebhook?: boolean;
}

export function TranscriptionPanel({
  output,
  isLoading = false,
  waitingForWebhook = false
}: TranscriptionPanelProps) {
  return (
    <div className="w-full h-full flex flex-col bg-card rounded-lg border shadow-sm overflow-hidden">
      <Tabs defaultValue="output" className="w-full h-full flex flex-col">
        <div className="border-b px-4 py-2 bg-muted/40 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transcripción en tiempo real</h3>
          <div className="flex items-center gap-2">
            {waitingForWebhook && (
              <Badge variant="outline" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                <Clock className="h-3 w-3 animate-pulse" />
                <span>Esperando webhook</span>
              </Badge>
            )}
          </div>
        </div>
        
        <TabsList className="bg-muted/30 p-1 mx-4 my-2 grid grid-cols-1">
          <TabsTrigger value="output">Información del Webhook</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-hidden p-4">
          {isLoading ? (
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
          ) : waitingForWebhook ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-12 w-12 text-muted-foreground/60 animate-pulse" />
                </div>
                <div className="text-center text-muted-foreground">
                  Esperando respuesta del webhook...
                </div>
                <div className="text-center text-muted-foreground/70 text-sm mt-2 max-w-md">
                  Esto puede tomar unos momentos. La información se actualizará automáticamente cuando se reciba la respuesta.
                </div>
              </div>
            </div>
          ) : (
            <TabsContent value="output" className="mt-0 h-full">
              <ScrollArea className="h-full bg-muted/20 rounded-md p-4">
                {output ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm">{output}</pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-muted-foreground">No hay información disponible del webhook</p>
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
