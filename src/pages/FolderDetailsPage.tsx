
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useRecordings, Folder, Grade, Recording } from "@/context/RecordingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RecordingDetails } from "@/components/RecordingDetails";
import { 
  Award, 
  Edit, 
  FileText, 
  Play, 
  Pause, 
  Trash, 
  Plus, 
  X,
  Star
} from "lucide-react";
import { formatTimeFromSeconds } from "@/lib/utils";

// Recording Item component
const RecordingListItem = ({ recording }: { recording: Recording }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [showRecordingDetails, setShowRecordingDetails] = useState(false);
  
  // Toggle audio playback
  const togglePlay = () => {
    if (!audioElement) {
      const audio = new Audio(recording.audioUrl);
      setAudioElement(audio);
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Clean up audio element on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, [audioElement]);
  
  return (
    <>
      <div className="flex items-center justify-between bg-background/80 p-3 rounded-md mb-2">
        <div className="flex items-center max-w-[70%]">
          <FileText className="h-4 w-4 mr-2 text-blue-500" />
          <span className="text-sm truncate">{recording.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 mr-2">
            {formatTimeFromSeconds(recording.duration)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-blue-500"
            onClick={() => setShowRecordingDetails(true)}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {showRecordingDetails && (
        <RecordingDetails 
          recording={recording} 
          isOpen={showRecordingDetails} 
          onOpenChange={setShowRecordingDetails}
        />
      )}
    </>
  );
};

// Grade component
const GradeItem = ({ grade, onDelete, onEdit }: { grade: Grade, onDelete: () => void, onEdit: (score: number) => void }) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newScore, setNewScore] = useState(grade.score.toString());

  const handleSaveEdit = () => {
    const score = parseFloat(newScore);
    if (isNaN(score) || score < 0 || score > 10) {
      toast.error("La nota debe ser un número entre 0 y 10");
      return;
    }
    onEdit(score);
    setShowEditDialog(false);
  };

  return (
    <>
      <div className="flex items-center justify-between bg-background/80 p-3 rounded-md mb-2">
        <div className="flex items-center">
          <Star className="h-4 w-4 mr-2 text-yellow-500" />
          <span className="text-sm">{grade.name}</span>
        </div>
        <div className="flex items-center">
          <span className={`font-bold text-sm mr-4 ${grade.score >= 6 ? 'text-green-500' : 'text-red-500'}`}>
            {grade.score.toFixed(1)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-blue-500"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-500"
            onClick={onDelete}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Editar nota</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Nota (0-10)</label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function FolderDetailsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { folderId } = useParams<{ folderId: string }>();
  const {
    folders,
    recordings,
    getFolderGrades,
    calculateFolderAverage,
    deleteGrade,
    updateGrade,
    addGrade,
    updateFolder,
    deleteFolder,
  } = useRecordings();
  
  const [showAddGradeDialog, setShowAddGradeDialog] = useState(false);
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false);
  const [gradeName, setGradeName] = useState("");
  const [gradeScore, setGradeScore] = useState("7");
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#3b82f6");
  const [folderIcon, setFolderIcon] = useState("folder");
  
  // Find the current folder
  const folder = folders.find(f => f.id === folderId);
  
  // Get recordings and grades for this folder
  const folderRecordings = recordings.filter(recording => recording.folderId === folderId);
  const folderGrades = getFolderGrades(folderId || "");
  const average = calculateFolderAverage(folderId || "");
  
  // Handle auth redirection
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  
  // Handle folder not found
  useEffect(() => {
    if (!folder && folderId) {
      toast.error("Materia no encontrada");
      navigate("/folders");
    } else if (folder) {
      // Set folder details for editing
      setFolderName(folder.name);
      setFolderColor(folder.color);
      setFolderIcon(folder.icon || "folder");
    }
  }, [folder, folderId, navigate]);
  
  if (!folder) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Materia no encontrada</h1>
            <Button onClick={() => navigate("/folders")}>Volver a materias</Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Render icon for the folder (simplified version)
  const renderFolderIcon = () => {
    return (
      <div 
        className="h-12 w-12 rounded flex justify-center items-center flex-shrink-0" 
        style={{ backgroundColor: folder.color }}
      >
        <FileText color="#ffffff" size={24} />
      </div>
    );
  };
  
  const handleAddGrade = () => {
    if (!folderId) return;
    if (!gradeName.trim()) {
      toast.error("El nombre de la evaluación es obligatorio");
      return;
    }
    
    const score = parseFloat(gradeScore);
    if (isNaN(score) || score < 0 || score > 10) {
      toast.error("La nota debe ser un número entre 0 y 10");
      return;
    }
    
    addGrade(folderId, gradeName, score);
    toast.success("Nota agregada");
    setGradeName("");
    setGradeScore("7");
    setShowAddGradeDialog(false);
  };
  
  const handleEditFolder = () => {
    if (!folderId) return;
    if (!folderName.trim()) {
      toast.error("El nombre de la materia es obligatorio");
      return;
    }
    updateFolder(folderId, {
      name: folderName,
      color: folderColor,
      icon: folderIcon
    });
    toast.success("Materia actualizada");
    setShowEditFolderDialog(false);
  };
  
  const handleDeleteFolder = () => {
    // Don't allow deleting the default folder
    if (folderId === "default") {
      toast.error("No puedes eliminar la materia predeterminada");
      return;
    }
    deleteFolder(folderId || "");
    toast.success("Materia eliminada");
    navigate("/folders");
  };
  
  return (
    <Layout>
      <div className="space-y-6 max-w-full mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/folders")}
          >
            Volver a materias
          </Button>
        </div>
        
        {/* Folder header */}
        <div className="flex justify-between items-center flex-wrap gap-2 bg-card p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            {renderFolderIcon()}
            <div className="ml-3">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{folder.name}</h1>
              {average > 0 && (
                <span className={`text-sm font-semibold ${average >= 6 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  Promedio: {average.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-500 dark:text-blue-400 disabled:opacity-50" 
              onClick={() => setShowEditFolderDialog(true)} 
              disabled={folder.id === "default"}
            >
              <Edit className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-500 dark:text-red-400 disabled:opacity-50" 
              onClick={handleDeleteFolder} 
              disabled={folder.id === "default"}
            >
              <Trash className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Eliminar</span>
            </Button>
          </div>
        </div>
        
        {/* Recordings section - MOVED ABOVE GRADES */}
        <Card className="w-full border shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-500" />
              Grabaciones
              {folderRecordings.length > 0 && (
                <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-xs px-2 py-0.5 rounded-full">
                  {folderRecordings.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background/50 p-3 rounded-md">
              {folderRecordings.length === 0 ? (
                <div className="text-center text-muted-foreground py-2 text-sm">
                  No hay grabaciones en esta materia
                </div>
              ) : (
                folderRecordings.map(recording => (
                  <RecordingListItem 
                    key={recording.id} 
                    recording={recording} 
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Grades section - MOVED BELOW RECORDINGS */}
        <Card className="w-full border shadow-sm overflow-hidden">
          <CardHeader className="pb-3 flex justify-between items-center flex-row">
            <CardTitle className="text-lg font-medium flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-500" />
              Evaluaciones
              {folderGrades.length > 0 && (
                <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-xs px-2 py-0.5 rounded-full">
                  {folderGrades.length}
                </span>
              )}
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs" 
              onClick={() => setShowAddGradeDialog(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Agregar nota
            </Button>
          </CardHeader>
          <CardContent>
            <div className="bg-background/50 p-3 rounded-md">
              {folderGrades.length === 0 ? (
                <div className="text-center text-muted-foreground py-2 text-sm">
                  No hay evaluaciones registradas
                </div>
              ) : (
                folderGrades.map(grade => (
                  <GradeItem 
                    key={grade.id} 
                    grade={grade} 
                    onDelete={() => deleteGrade(grade.id)}
                    onEdit={(score) => updateGrade(grade.id, { score })}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Add grade dialog */}
        <Dialog open={showAddGradeDialog} onOpenChange={setShowAddGradeDialog}>
          <DialogContent className="max-w-[95vw] w-[450px]">
            <DialogHeader>
              <DialogTitle>Agregar evaluación</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">Nombre de la evaluación</label>
                <Input 
                  value={gradeName} 
                  onChange={e => setGradeName(e.target.value)} 
                  className="w-full"
                  placeholder="Ej: Examen parcial, Trabajo práctico, etc."
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">Nota (0-10)</label>
                <Input 
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={gradeScore} 
                  onChange={e => setGradeScore(e.target.value)} 
                  className="w-full"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                className="w-full sm:w-auto" 
                onClick={handleAddGrade}
              >
                Agregar nota
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit folder dialog - simplified version */}
        <Dialog open={showEditFolderDialog} onOpenChange={setShowEditFolderDialog}>
          <DialogContent className="max-w-[95vw] w-[450px]">
            <DialogHeader>
              <DialogTitle>Editar materia</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">Nombre</label>
                <Input 
                  className="w-full" 
                  value={folderName} 
                  onChange={e => setFolderName(e.target.value)} 
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">Color</label>
                <div className="flex items-center">
                  <input 
                    type="color"
                    className="border border-gray-300 dark:border-gray-700 p-2 rounded w-16 h-10" 
                    value={folderColor} 
                    onChange={e => setFolderColor(e.target.value)} 
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                className="w-full sm:w-auto" 
                onClick={handleEditFolder}
              >
                Guardar cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
