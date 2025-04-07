
// The RecordingItem component is read-only, so we will create a new version that supports speaker icons

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate, formatDuration } from "@/lib/utils";
import { MoreVertical, Calendar, FileText, Download, Trash2, User, Users } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRecordings } from "@/context/RecordingsContext";
import { toast } from "sonner";

// Extend or recreate the component by adding the display of speaker mode icons
export function RecordingItem({ recording, onAddToCalendar }) {
  const navigate = useNavigate();
  const { deleteRecording } = useRecordings();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenDetails = () => {
    navigate(`/recordings/${recording.id}`);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    
    try {
      const link = document.createElement('a');
      link.href = recording.audioUrl;
      link.download = `${recording.name || 'recording'}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Grabación descargada correctamente');
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast.error('Error al descargar la grabación');
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de que quieres eliminar esta grabación?')) {
      deleteRecording(recording.id);
      toast.success('Grabación eliminada correctamente');
    }
  };

  const handleAddToCalendar = (e) => {
    e.stopPropagation();
    onAddToCalendar(recording);
  };

  // Determine icon based on speaker mode
  const speakerIcon = recording.speakerMode === 'multiple' 
    ? <Users className="h-4 w-4 text-blue-500" /> 
    : <User className="h-4 w-4 text-green-500" />;
  
  const speakerLabel = recording.speakerMode === 'multiple' 
    ? "Múltiples oradores" 
    : "Un orador";

  return (
    <div 
      className="py-3 hover:bg-secondary/30 transition-colors cursor-pointer"
      onClick={handleOpenDetails}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {speakerIcon}
            <h3 className="text-base font-medium truncate">{recording.name || "Sin nombre"}</h3>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{formatDate(new Date())}</span>
            <span>•</span>
            <span>{formatDuration(recording.duration || 0)}</span>
            <span>•</span>
            <span>{recording.subject || "Sin materia"}</span>
            <span>•</span>
            <span>{speakerLabel}</span>
          </div>
          
          {recording.output && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {recording.output}
            </p>
          )}
        </div>

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Opciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpenDetails}>
              <FileText className="h-4 w-4 mr-2" />
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddToCalendar}>
              <Calendar className="h-4 w-4 mr-2" />
              Añadir al calendario
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Descargar audio
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
