import React, { useState } from "react";
import { useRecordings, Folder, Grade, Recording } from "@/context/RecordingsContext";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Book, 
  FlaskConical, 
  Atom, 
  GraduationCap, 
  Microscope, 
  Pencil,
  Briefcase, 
  Gavel, 
  Computer, 
  BarChart, 
  Map, 
  Building,
  Music, 
  Film,
  Languages,
  Folder as FolderIcon,
  Edit,
  Trash,
  Plus,
  X,
  Award,
  Star,
  FileText,
  Play,
  Pause,
  Clock,
  Calendar
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordingDetails } from "@/components/RecordingDetails";
import { formatDate, formatTimeFromSeconds } from "@/lib/utils";

// Definir iconos académicos
interface IconOption {
  name: string;
  component: React.ReactNode;
  label: string;
  area: string;
}

const academicIcons: IconOption[] = [
  { name: "folder", component: <FolderIcon />, label: "General", area: "General" },
  { name: "book", component: <Book />, label: "Libro", area: "General académico" },
  { name: "flask-conical", component: <FlaskConical />, label: "Matraz", area: "Química, Biología" },
  { name: "atom", component: <Atom />, label: "Átomo", area: "Física, Química" },
  { name: "graduation-cap", component: <GraduationCap />, label: "Birrete", area: "Educación" },
  { name: "microscope", component: <Microscope />, label: "Microscopio", area: "Biología, Medicina" },
  { name: "pencil", component: <Pencil />, label: "Lápiz", area: "Humanidades" },
  { name: "briefcase", component: <Briefcase />, label: "Maletín", area: "Negocios, Economía" },
  { name: "gavel", component: <Gavel />, label: "Martillo", area: "Derecho" },
  { name: "computer", component: <Computer />, label: "Computadora", area: "Informática" },
  { name: "bar-chart", component: <BarChart />, label: "Gráfico", area: "Estadística, Economía" },
  { name: "map", component: <Map />, label: "Mapa", area: "Geografía, Historia" },
  { name: "building", component: <Building />, label: "Edificio", area: "Arquitectura, Ingeniería" },
  { name: "music", component: <Music />, label: "Música", area: "Música" },
  { name: "film", component: <Film />, label: "Cine", area: "Cine" },
  { name: "languages", component: <Languages />, label: "Idiomas", area: "Lingüística" },
];

// Renderizado de iconos por nombre
const renderIcon = (iconName: string, color: string): JSX.Element => {
  const icon = academicIcons.find(i => i.name === iconName);
  if (!icon) return <FolderIcon color={color} />;
  
  const IconComponent = React.cloneElement(icon.component as React.ReactElement, {
    color: color,
    size: 24
  });
  
  return IconComponent;
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
      <div className="flex items-center justify-between bg-background/80 p-2 rounded-md mb-2">
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

// Recording Item component - New component for displaying recordings in folders
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
  React.useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, [audioElement]);
  
  return (
    <>
      <div className="flex items-center justify-between bg-background/80 p-2 rounded-md mb-2">
        <div className="flex items-center max-w-[70%]">
          <FileText className="h-4 w-4 mr-2 text-blue-500" />
          <span className="text-sm truncate">{recording.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-2">
            {formatTimeFromSeconds(recording.duration)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-blue-500"
            onClick={() => setShowRecordingDetails(true)}
          >
            <FileText className="h-3 w-3" />
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

export function FolderSystem() {
  const {
    folders,
    addFolder,
    updateFolder,
    deleteFolder,
    addGrade,
    updateGrade,
    deleteGrade,
    getFolderGrades,
    calculateFolderAverage,
    recordings
  } = useRecordings();
  const [showAddFolderDialog, setShowAddFolderDialog] = useState(false);
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#3b82f6");
  const [folderIcon, setFolderIcon] = useState("folder");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, Record<string, boolean>>>({});
  const [showAddGradeDialog, setShowAddGradeDialog] = useState(false);
  const [gradeName, setGradeName] = useState("");
  const [gradeScore, setGradeScore] = useState("7");
  const [selectedFolderForGrade, setSelectedFolderForGrade] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  const toggleSection = (folderId: string, section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [folderId]: {
        ...(prev[folderId] || {}),
        [section]: !(prev[folderId] && prev[folderId][section])
      }
    }));
  };

  const handleAddFolder = () => {
    if (!folderName.trim()) {
      toast.error("El nombre de la materia es obligatorio");
      return;
    }
    addFolder(folderName, folderColor, folderIcon);
    toast.success("Materia creada");
    setFolderName("");
    setFolderIcon("folder");
    setShowAddFolderDialog(false);
  };

  const handleEditFolder = () => {
    if (!selectedFolder) return;
    if (!folderName.trim()) {
      toast.error("El nombre de la materia es obligatorio");
      return;
    }
    updateFolder(selectedFolder.id, {
      name: folderName,
      color: folderColor,
      icon: folderIcon
    });
    toast.success("Materia actualizada");
    setSelectedFolder(null);
    setShowEditFolderDialog(false);
  };

  const handleDeleteFolder = (folder: Folder) => {
    // Don't allow deleting the default folder
    if (folder.id === "default") {
      toast.error("No puedes eliminar la materia predeterminada");
      return;
    }
    deleteFolder(folder.id);
    toast.success("Materia eliminada");
  };

  const openEditDialog = (folder: Folder) => {
    setSelectedFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setFolderIcon(folder.icon || "folder");
    setShowEditFolderDialog(true);
  };

  const openAddGradeDialog = (folderId: string) => {
    setSelectedFolderForGrade(folderId);
    setGradeName("");
    setGradeScore("7");
    setShowAddGradeDialog(true);
  };

  const handleAddGrade = () => {
    if (!selectedFolderForGrade) return;
    if (!gradeName.trim()) {
      toast.error("El nombre de la evaluación es obligatorio");
      return;
    }
    
    const score = parseFloat(gradeScore);
    if (isNaN(score) || score < 0 || score > 10) {
      toast.error("La nota debe ser un número entre 0 y 10");
      return;
    }
    
    addGrade(selectedFolderForGrade, gradeName, score);
    toast.success("Nota agregada");
    setGradeName("");
    setGradeScore("7");
    setShowAddGradeDialog(false);
  };

  const handleUpdateGrade = (gradeId: string, score: number) => {
    updateGrade(gradeId, { score });
    toast.success("Nota actualizada");
  };
  
  // Function to get recordings for a specific folder
  const getFolderRecordings = (folderId: string) => {
    return recordings.filter(recording => recording.folderId === folderId);
  };

  return (
    <div className="p-2 md:p-4 flex-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-400">Materias</h2>
        <Button 
          onClick={() => {
            setFolderName("");
            setFolderColor("#3b82f6");
            setFolderIcon("folder");
            setShowAddFolderDialog(true);
          }}
          className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
        >
          Nueva materia
        </Button>
      </div>
      
      <div className="grid gap-4 grid-cols-1">
        {folders.map(folder => {
          const folderGrades = getFolderGrades(folder.id);
          const folderRecordings = getFolderRecordings(folder.id);
          const average = calculateFolderAverage(folder.id);
          const isExpanded = !!expandedFolders[folder.id];
          
          // Check if sections are expanded
          const sectionsState = expandedSections[folder.id] || {};
          const isGradesExpanded = !!sectionsState["grades"];
          const isRecordingsExpanded = !!sectionsState["recordings"];
          
          return (
            <Card 
              key={folder.id} 
              className="w-full border border-gray-300 dark:border-gray-600 overflow-hidden" 
              style={{
                backgroundColor: `${folder.color}10`
              }}
            >
              <CardHeader className="p-4 pb-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center" onClick={() => toggleFolder(folder.id)} style={{ cursor: 'pointer' }}>
                    <div 
                      className="h-10 w-10 rounded flex justify-center items-center flex-shrink-0" 
                      style={{
                        backgroundColor: folder.color
                      }}
                    >
                      {renderIcon(folder.icon || "folder", "#ffffff")}
                    </div>
                    <div className="ml-3">
                      <CardTitle className="text-lg font-medium text-black dark:text-white">{folder.name}</CardTitle>
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
                      onClick={() => openEditDialog(folder)} 
                      disabled={folder.id === "default"}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 dark:text-red-400 disabled:opacity-50" 
                      onClick={() => handleDeleteFolder(folder)} 
                      disabled={folder.id === "default"}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="p-4 pt-0">
                  {/* Sección de Evaluaciones */}
                  <div className="mb-4">
                    <div 
                      className="flex justify-between items-center mb-3 cursor-pointer"
                      onClick={() => toggleSection(folder.id, "grades")}
                    >
                      <h3 className="text-sm font-medium flex items-center">
                        <Award className="h-4 w-4 mr-1 text-yellow-500" />
                        Evaluaciones
                        {folderGrades.length > 0 && (
                          <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-xs px-2 py-0.5 rounded-full">
                            {folderGrades.length}
                          </span>
                        )}
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddGradeDialog(folder.id);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar nota
                      </Button>
                    </div>
                    
                    {isGradesExpanded && (
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
                              onEdit={(score) => handleUpdateGrade(grade.id, score)}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Sección de Grabaciones */}
                  <div className="mb-4">
                    <div 
                      className="flex justify-between items-center mb-3 cursor-pointer"
                      onClick={() => toggleSection(folder.id, "recordings")}
                    >
                      <h3 className="text-sm font-medium flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-blue-500" />
                        Grabaciones
                        {folderRecordings.length > 0 && (
                          <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-xs px-2 py-0.5 rounded-full">
                            {folderRecordings.length}
                          </span>
                        )}
                      </h3>
                    </div>
                    
                    {isRecordingsExpanded && (
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
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
      
      {/* Add folder dialog */}
      <Dialog open={showAddFolderDialog} onOpenChange={setShowAddFolderDialog}>
        <DialogContent className="max-w-[95vw] w-[450px]">
          <DialogHeader>
            <DialogTitle>Nueva materia</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Nombre</label>
              <Input 
                value={folderName} 
                onChange={e => setFolderName(e.target.value)} 
                className="w-full" 
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Icono</label>
              <Select value={folderIcon} onValueChange={setFolderIcon}>
                <SelectTrigger className="w-full mb-2">
                  <SelectValue placeholder="Seleccionar icono" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <ScrollArea className="h-[200px]">
                    {academicIcons.map((icon) => (
                      <SelectItem key={icon.name} value={icon.name} className="flex items-center py-2">
                        <div className="flex items-center">
                          <span className="mr-2">
                            {React.cloneElement(icon.component as React.ReactElement, { size: 20 })}
                          </span>
                          <span>{icon.label}</span>
                          <span className="ml-2 text-xs text-gray-500">({icon.area})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              
              <div className="flex items-center mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <div className="mr-2">Icono seleccionado:</div>
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded">
                  {renderIcon(folderIcon, "#ffffff")}
                </div>
              </div>
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
                <div 
                  className="w-10 h-10 ml-2 rounded flex items-center justify-center" 
                  style={{
                    backgroundColor: folderColor
                  }} 
                >
                  {renderIcon(folderIcon, "#ffffff")}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              className="w-full sm:w-auto" 
              onClick={handleAddFolder}
            >
              Crear materia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit folder dialog */}
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
              <label className="block mb-2 text-sm font-medium">Icono</label>
              <Select value={folderIcon} onValueChange={setFolderIcon}>
                <SelectTrigger className="w-full mb-2">
                  <SelectValue placeholder="Seleccionar icono" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <ScrollArea className="h-[200px]">
                    {academicIcons.map((icon) => (
                      <SelectItem key={icon.name} value={icon.name} className="flex items-center py-2">
                        <div className="flex items-center">
                          <span className="mr-2">
                            {React.cloneElement(icon.component as React.ReactElement, { size: 20 })}
                          </span>
                          <span>{icon.label}</span>
                          <span className="ml-2 text-xs text-gray-500">({icon.area})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              
              <div className="flex items-center mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <div className="mr-2">Icono seleccionado:</div>
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded">
                  {renderIcon(folderIcon, "#ffffff")}
                </div>
              </div>
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
                <div 
                  className="w-10 h-10 ml-2 rounded flex items-center justify-center" 
                  style={{
                    backgroundColor: folderColor
                  }} 
                >
                  {renderIcon(folderIcon, "#ffffff")}
                </div>
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
    </div>
  );
}
