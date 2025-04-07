
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecordings } from "@/context/RecordingsContext";
import { Layout } from "@/components/Layout";
import { RecordingItem } from "@/components/RecordingItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotesSection } from "@/components/NotesSection";
import { ArrowLeft, Pencil, Check, X, Folder, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FolderDetailsPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { folders, recordings, updateFolder } = useRecordings();
  const folder = folders.find(f => f.id === folderId);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [activeTab, setActiveTab] = useState("transcriptions");
  
  useEffect(() => {
    if (!folder) {
      navigate("/folders");
      return;
    }
    
    setFolderName(folder.name);
  }, [folder, navigate]);
  
  if (!folder) {
    return null;
  }
  
  const folderRecordings = recordings.filter(r => r.folderId === folderId);
  
  const handleSaveTitle = () => {
    if (folderName.trim() === "") {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    
    updateFolder(folder.id, { name: folderName });
    setIsEditingTitle(false);
    toast.success("Nombre actualizado");
  };
  
  const handleCancelEdit = () => {
    setFolderName(folder.name);
    setIsEditingTitle(false);
  };
  
  const handleAddToCalendar = (recording: any) => {
    console.log("Add to calendar:", recording);
    toast.info("Funcionalidad en desarrollo");
  };
  
  return (
    <Layout>
      <div className="space-y-6 max-w-full">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/folders")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div 
            className="h-8 w-8 rounded flex items-center justify-center" 
            style={{ backgroundColor: folder.color }}
          >
            <Folder className="h-4 w-4 text-white" />
          </div>
          
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input 
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="h-9 max-w-[300px]"
                autoFocus
              />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSaveTitle}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleCancelEdit}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{folder.name}</h1>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsEditingTitle(true)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="transcriptions" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Transcripciones</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>Apuntes</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="transcriptions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  Transcripciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {folderRecordings.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <p>No hay transcripciones en esta carpeta</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {folderRecordings.map(recording => (
                      <div key={recording.id} className="mb-2">
                        <RecordingItem
                          recording={recording}
                          onAddToCalendar={handleAddToCalendar}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notes">
            <NotesSection folderId={folderId} sectionTitle={`Apuntes de ${folder.name}`} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
