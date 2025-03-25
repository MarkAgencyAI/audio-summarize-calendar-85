
import { useState } from "react";
import { Folder, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Folder as FolderType, useRecordings } from "@/context/RecordingsContext";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export function FolderSystem() {
  const { folders, addFolder, updateFolder, deleteFolder } = useRecordings();
  const isMobile = useIsMobile();
  
  const [showAddFolderDialog, setShowAddFolderDialog] = useState(false);
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#3b82f6");
  
  const handleAddFolder = () => {
    if (!folderName.trim()) {
      toast.error("El nombre de la carpeta es obligatorio");
      return;
    }
    
    addFolder(folderName, folderColor);
    toast.success("Carpeta creada");
    
    setFolderName("");
    setShowAddFolderDialog(false);
  };
  
  const handleEditFolder = () => {
    if (!selectedFolder) return;
    
    if (!folderName.trim()) {
      toast.error("El nombre de la carpeta es obligatorio");
      return;
    }
    
    updateFolder(selectedFolder.id, { name: folderName, color: folderColor });
    toast.success("Carpeta actualizada");
    
    setSelectedFolder(null);
    setShowEditFolderDialog(false);
  };
  
  const handleDeleteFolder = (folder: FolderType) => {
    // Don't allow deleting the default folder
    if (folder.id === "default") {
      toast.error("No puedes eliminar la carpeta predeterminada");
      return;
    }
    
    deleteFolder(folder.id);
    toast.success("Carpeta eliminada");
  };
  
  const openEditDialog = (folder: FolderType) => {
    setSelectedFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setShowEditFolderDialog(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xl font-medium">Carpetas</h3>
        <Button 
          variant="outline" 
          onClick={() => {
            setFolderName("");
            setFolderColor("#3b82f6");
            setShowAddFolderDialog(true);
          }}
        >
          Nueva carpeta
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map(folder => (
          <div 
            key={folder.id}
            className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
            style={{ backgroundColor: `${folder.color}20` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: folder.color }}
                >
                  <Folder className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-medium">{folder.name}</h4>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => openEditDialog(folder)}
                  disabled={folder.id === "default"}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handleDeleteFolder(folder)}
                  disabled={folder.id === "default"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add folder dialog */}
      <Dialog open={showAddFolderDialog} onOpenChange={setShowAddFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva carpeta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Nombre</Label>
              <Input 
                id="folderName" 
                value={folderName} 
                onChange={(e) => setFolderName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folderColor">Color</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  id="folderColor" 
                  type="color" 
                  value={folderColor} 
                  onChange={(e) => setFolderColor(e.target.value)} 
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <div 
                  className="h-10 w-10 rounded-lg"
                  style={{ backgroundColor: folderColor }}
                ></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddFolder}>Crear carpeta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit folder dialog */}
      <Dialog open={showEditFolderDialog} onOpenChange={setShowEditFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar carpeta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFolderName">Nombre</Label>
              <Input 
                id="editFolderName" 
                value={folderName} 
                onChange={(e) => setFolderName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFolderColor">Color</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  id="editFolderColor" 
                  type="color" 
                  value={folderColor} 
                  onChange={(e) => setFolderColor(e.target.value)} 
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <div 
                  className="h-10 w-10 rounded-lg"
                  style={{ backgroundColor: folderColor }}
                ></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditFolder}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
