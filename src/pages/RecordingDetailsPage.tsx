
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useRecordings } from "@/context/RecordingsContext";
import { RecordingDetails } from "@/components/RecordingDetails";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { loadAudioFromStorage } from "@/lib/storage";
import { toast } from "sonner";

export default function RecordingDetailsPage() {
  const { recordingId } = useParams<{ recordingId: string }>();
  const navigate = useNavigate();
  const { recordings } = useRecordings();
  const [isOpen, setIsOpen] = useState(true);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  
  // Find the recording
  const recording = recordings.find(r => r.id === recordingId);
  
  // If recording not found, redirect to dashboard
  useEffect(() => {
    if (!recording) {
      navigate("/dashboard");
    }
  }, [recording, navigate]);
  
  // Handle closing the dialog
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      navigate("/dashboard");
    }
  };
  
  // Preload audio from storage when page loads
  useEffect(() => {
    if (recording) {
      const preloadAudio = async () => {
        try {
          const audioBlob = await loadAudioFromStorage(recording.id);
          if (!audioBlob && recording.audioUrl) {
            // If not in storage, try to fetch from URL
            const response = await fetch(recording.audioUrl);
            if (response.ok) {
              // Audio loaded successfully
              setIsAudioLoaded(true);
            } else {
              toast.error("No se pudo cargar el audio");
            }
          } else if (audioBlob) {
            // Audio loaded from IndexedDB
            setIsAudioLoaded(true);
          }
        } catch (error) {
          console.error("Error preloading audio:", error);
          toast.error("Error al cargar el audio");
        }
      };
      
      preloadAudio();
    }
  }, [recording]);
  
  if (!recording) {
    return null;
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
        </Button>
        
        <RecordingDetails 
          recording={recording} 
          isOpen={isOpen} 
          onOpenChange={handleOpenChange} 
        />
      </div>
    </Layout>
  );
}
