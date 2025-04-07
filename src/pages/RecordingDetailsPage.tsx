
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useRecordings } from "@/context/RecordingsContext";
import { RecordingDetails } from "@/components/RecordingDetails";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function RecordingDetailsPage() {
  const { recordingId } = useParams<{ recordingId: string }>();
  const navigate = useNavigate();
  const { recordings } = useRecordings();
  const [isOpen, setIsOpen] = useState(true);
  
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
