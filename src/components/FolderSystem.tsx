
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecordings, type Folder } from "@/context/RecordingsContext";
import { 
  Folder as FolderIcon, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Check, 
  X 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FOLDER_COLORS = [
  "#4f46e5", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
];

const ColorPicker = ({ 
  selectedColor, 
  onSelectColor 
}: { 
  selectedColor: string; 
  onSelectColor: (color: string) => void 
}) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {FOLDER_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            "w-6 h-6 rounded-full transition-all",
            selectedColor === color ? "ring-2 ring-offset-2 ring-black dark:ring-white" : ""
          )}
          style={{ backgroundColor: color }}
          onClick={() => onSelectColor(color)}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
};

export function FolderSystem() {
  const navigate = useNavigate();
  const { folders, addFolder, updateFolder, deleteFolder } = useRecordings();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>(FOLDER_COLORS[0]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>("");
  
  const handleCreateFolder = () => {
    if (newFolderName.trim() === "") {
      toast.error("El nombre de la carpeta no puede estar vacío");
      return;
    }
    
    addFolder(newFolderName.trim(), selectedColor);
    
    setIsDialogOpen(false);
    setNewFolderName("");
    setSelectedColor(FOLDER_COLORS[0]);
    
    toast.success(`Carpeta "${newFolderName}" creada correctamente`);
  };
  
  const handleUpdateFolder = (id: string) => {
    if (editingFolderName.trim() === "") {
      toast.error("El nombre de la carpeta no puede estar vacío");
      return;
    }
    
    updateFolder(id, { name: editingFolderName });
    setEditingFolderId(null);
    toast.success("Carpeta actualizada correctamente");
  };
  
  const handleDeleteFolder = (id: string) => {
    const folder = folders.find(f => f.id === id);
    if (id === "default") {
      toast.error("No puedes eliminar la carpeta predeterminada");
      return;
    }
    
    if (confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folder?.name}"?`)) {
      deleteFolder(id);
      toast.success("Carpeta eliminada correctamente");
    }
  };
  
  const handleFolderClick = (id: string) => {
    navigate(`/folder/${id}`);
  };
  
  const startEditingFolder = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mis Carpetas</h2>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          size="sm"
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Nueva carpeta
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {folders.map((folder) => (
          <div 
            key={folder.id}
            className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
          >
            {editingFolderId === folder.id ? (
              <div className="flex items-center justify-between">
                <Input 
                  value={editingFolderName}
                  onChange={(e) => setEditingFolderName(e.target.value)}
                  className="mr-2"
                  autoFocus
                />
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleUpdateFolder(folder.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingFolderId(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-2 flex-1 overflow-hidden"
                  onClick={() => handleFolderClick(folder.id)}
                >
                  <div 
                    className="h-8 w-8 rounded flex items-center justify-center flex-shrink-0" 
                    style={{ backgroundColor: folder.color }}
                  >
                    <FolderIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium truncate">{folder.name}</span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Opciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEditingFolder(folder)}>
                      <Pencil className="h-4 w-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="text-destructive"
                      disabled={folder.id === "default"}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva carpeta</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nombre de la carpeta</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ej: Física, Química, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <ColorPicker 
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
