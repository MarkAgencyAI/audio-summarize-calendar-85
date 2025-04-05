
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, BookOpen, Key, Clock } from "lucide-react";

interface TranscriptionPanelProps {
  transcript: string;
  translation?: string;
  keyPoints: string[];
  language: string;
  summary: string;
  isLoading?: boolean;
}

export function TranscriptionPanel({
  transcript,
  translation,
  keyPoints,
  language,
  summary,
  isLoading = false
}: TranscriptionPanelProps) {
  const getLanguageDisplay = (code?: string) => {
    const languages: Record<string, string> = {
      es: "Español",
      en: "English",
      fr: "Français",
      de: "Deutsch",
      pt: "Português",
      it: "Italiano"
    };
    return code ? languages[code] || code.toUpperCase() : "Desconocido";
  };

  const waitingForSummary = transcript && !summary && !isLoading;

  return (
    <div className="w-full h-full flex flex-col bg-card rounded-lg border shadow-sm overflow-hidden">
      <Tabs defaultValue="transcript" className="w-full h-full flex flex-col">
        <div className="border-b px-4 py-2 bg-muted/40 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transcripción en tiempo real</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 bg-muted/50">
              <Globe className="h-3 w-3" />
              <span>{getLanguageDisplay(language)}</span>
            </Badge>
          </div>
        </div>
        
        <TabsList className="bg-muted/30 p-1 mx-4 my-2 grid grid-cols-3">
          <TabsTrigger value="transcript">Transcripción</TabsTrigger>
          {translation && <TabsTrigger value="translation">Traducción</TabsTrigger>}
          <TabsTrigger value="keypoints">Puntos Clave</TabsTrigger>
          {summary && <TabsTrigger value="summary">Resumen</TabsTrigger>}
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
          ) : waitingForSummary ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-12 w-12 text-muted-foreground/60 animate-pulse" />
                </div>
                <div className="text-center text-muted-foreground">
                  Esperando respuesta del análisis...
                </div>
              </div>
            </div>
          ) : (
            <>
              <TabsContent value="transcript" className="mt-0 h-full">
                <ScrollArea className="h-full bg-muted/20 rounded-md p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{transcript || "No hay transcripción disponible"}</pre>
                </ScrollArea>
              </TabsContent>
              
              {translation && (
                <TabsContent value="translation" className="mt-0 h-full">
                  <ScrollArea className="h-full bg-muted/20 rounded-md p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{translation || "No hay traducción disponible"}</pre>
                  </ScrollArea>
                </TabsContent>
              )}
              
              <TabsContent value="keypoints" className="mt-0 h-full">
                <ScrollArea className="h-full bg-muted/20 rounded-md p-4">
                  <div className="space-y-2">
                    <h4 className="text-md font-medium flex items-center gap-2">
                      <Key className="h-4 w-4" /> Puntos Clave
                    </h4>
                    <Separator className="my-2" />
                    
                    {keyPoints && keyPoints.length > 0 ? (
                      <ul className="space-y-2 list-disc pl-5">
                        {keyPoints.map((point, index) => (
                          <li key={index} className="text-sm">
                            {point}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Esperando puntos clave del análisis...</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="summary" className="mt-0 h-full">
                <ScrollArea className="h-full bg-muted/20 rounded-md p-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {summary ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm">{summary}</pre>
                    ) : (
                      <p className="text-sm text-muted-foreground">Esperando resumen del análisis...</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
