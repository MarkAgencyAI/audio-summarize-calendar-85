
import React, { useState } from "react";
import { Folder as FolderType, useRecordings } from "@/context/RecordingsContext";
import { toast } from "sonner";
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
  Folder 
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Definir iconos académicos
interface IconOption {
  name: string;
  component: React.ReactNode;
  label: string;
  area: string;
}

const academicIcons: IconOption[] = [
  { name: "folder", component: <Folder />, label: "General", area: "General" },
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
  if (!icon) return <Folder color={color} />;
  
  const IconComponent = React.cloneElement(icon.component as React.ReactElement, {
    color: color,
    size: 24
  });
  
  return IconComponent;
};

export function FolderSystem() {
  const {
    folders,
    addFolder,
    updateFolder,
    deleteFolder
  } = useRecordings();
  const [showAddFolderDialog, setShowAddFolderDialog] = useState(false);
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#3b82f6");
  const [folderIcon, setFolderIcon] = useState("folder");

  const handleAddFolder = () => {
    if (!folderName.trim()) {
      toast.error("El nombre de la carpeta es obligatorio");
      return;
    }
    addFolder(folderName, folderColor, folderIcon);
    toast.success("Carpeta creada");
    setFolderName("");
    setFolderIcon("folder");
    setShowAddFolderDialog(false);
  };

  const handleEditFolder = () => {
    if (!selectedFolder) return;
    if (!folderName.trim()) {
      toast.error("El nombre de la carpeta es obligatorio");
      return;
    }
    updateFolder(selectedFolder.id, {
      name: folderName,
      color: folderColor,
      icon: folderIcon
    });
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
    setFolderIcon(folder.icon || "folder");
    setShowEditFolderDialog(true);
  };

  return (
    <div className="p-4 flex-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-400">Carpetas</h2>
        <button 
          onClick={() => {
            setFolderName("");
            setFolderColor("#3b82f6");
            setFolderIcon("folder");
            setShowAddFolderDialog(true);
          }} 
          className="bg-gray-100 dark:bg-gray-800 py-2 px-4 rounded border border-gray-300 dark:border-gray-600 text-black dark:text-white">
          Nueva carpeta
        </button>
      </div>
      
      <div className="flex flex-wrap">
        {folders.map(folder => (
          <div 
            key={folder.id} 
            className="w-full p-4 rounded border border-gray-300 dark:border-gray-600 mb-4" 
            style={{
              backgroundColor: `${folder.color}20`
            }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div 
                  className="h-10 w-10 rounded flex justify-center items-center" 
                  style={{
                    backgroundColor: folder.color
                  }}
                >
                  {renderIcon(folder.icon || "folder", "#ffffff")}
                </div>
                <span className="ml-3 font-medium text-black dark:text-white">{folder.name}</span>
              </div>
              
              <div className="flex">
                <button 
                  className="p-2 ml-1 text-blue-500 dark:text-blue-400 disabled:opacity-50" 
                  onClick={() => openEditDialog(folder)} 
                  disabled={folder.id === "default"}
                >
                  Edit
                </button>
                
                <button 
                  className="p-2 ml-1 text-red-500 dark:text-red-400 disabled:opacity-50" 
                  onClick={() => handleDeleteFolder(folder)} 
                  disabled={folder.id === "default"}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add folder dialog */}
      {showAddFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="w-4/5 max-w-md rounded p-4 bg-white dark:bg-slate-900">
            <h3 className="text-lg font-bold mb-4 text-black dark:text-white">Nueva carpeta</h3>
            
            <div className="mb-4">
              <label className="block mb-2 text-black dark:text-white">Nombre</label>
              <input 
                value={folderName} 
                onChange={e => setFolderName(e.target.value)} 
                className="border border-gray-300 dark:border-gray-700 p-2 rounded w-full bg-white dark:bg-slate-800 text-black dark:text-white" 
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-black dark:text-white">Icono</label>
              <Select value={folderIcon} onValueChange={setFolderIcon}>
                <SelectTrigger className="w-full mb-2 bg-white dark:bg-slate-800">
                  <SelectValue placeholder="Seleccionar icono" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto bg-white dark:bg-slate-800">
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
              <label className="block mb-2 text-black dark:text-white">Color</label>
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
            
            <button 
              className="bg-blue-500 text-white p-3 rounded w-full mb-2" 
              onClick={handleAddFolder}
            >
              Crear carpeta
            </button>
            <button 
              className="p-3 rounded w-full text-blue-500 dark:text-blue-400" 
              onClick={() => setShowAddFolderDialog(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      
      {/* Edit folder dialog */}
      {showEditFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-slate-900 w-4/5 max-w-md rounded p-4">
            <h3 className="text-lg font-bold mb-4 text-black dark:text-white">Editar carpeta</h3>
            
            <div className="mb-4">
              <label className="block mb-2 text-black dark:text-white">Nombre</label>
              <input 
                className="border border-gray-300 dark:border-gray-700 p-2 rounded w-full bg-white dark:bg-slate-800 text-black dark:text-white" 
                value={folderName} 
                onChange={e => setFolderName(e.target.value)} 
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-black dark:text-white">Icono</label>
              <Select value={folderIcon} onValueChange={setFolderIcon}>
                <SelectTrigger className="w-full mb-2 bg-white dark:bg-slate-800">
                  <SelectValue placeholder="Seleccionar icono" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto bg-white dark:bg-slate-800">
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
              <label className="block mb-2 text-black dark:text-white">Color</label>
              <div className="flex items-center">
                <input 
                  type="color"
                  className="border border-gray-300 dark:border-gray-700 p-2 rounded w-16 h-10" 
                  style={{
                    backgroundColor: folderColor
                  }} 
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
            
            <button 
              className="bg-blue-500 text-white p-3 rounded w-full mb-2" 
              onClick={handleEditFolder}
            >
              Guardar cambios
            </button>
            <button 
              className="p-3 rounded w-full text-blue-500 dark:text-blue-400" 
              onClick={() => setShowEditFolderDialog(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
