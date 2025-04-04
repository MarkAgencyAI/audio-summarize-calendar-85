import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet } from "react-native-web";
import { Folder as FolderType, useRecordings } from "@/context/RecordingsContext";

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

  const handleAddFolder = () => {
    if (!folderName.trim()) {
      console.error("El nombre de la carpeta es obligatorio");
      return;
    }
    addFolder(folderName, folderColor);
    console.log("Carpeta creada");
    setFolderName("");
    setShowAddFolderDialog(false);
  };

  const handleEditFolder = () => {
    if (!selectedFolder) return;
    if (!folderName.trim()) {
      console.error("El nombre de la carpeta es obligatorio");
      return;
    }
    updateFolder(selectedFolder.id, {
      name: folderName,
      color: folderColor
    });
    console.log("Carpeta actualizada");
    setSelectedFolder(null);
    setShowEditFolderDialog(false);
  };

  const handleDeleteFolder = (folder: FolderType) => {
    // Don't allow deleting the default folder
    if (folder.id === "default") {
      console.error("No puedes eliminar la carpeta predeterminada");
      return;
    }
    deleteFolder(folder.id);
    console.log("Carpeta eliminada");
  };

  const openEditDialog = (folder: FolderType) => {
    setSelectedFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setShowEditFolderDialog(true);
  };

  return (
    <div className="p-4 flex-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-emerald-800">Carpetas</h2>
        <button 
          className="bg-gray-100 py-2 px-4 rounded border border-gray-300"
          onClick={() => {
            setFolderName("");
            setFolderColor("#3b82f6");
            setShowAddFolderDialog(true);
          }}
        >
          Nueva carpeta
        </button>
      </div>
      
      <div className="flex flex-wrap">
        {folders.map(folder => (
          <div 
            key={folder.id} 
            className="w-full p-4 rounded border border-gray-300 mb-4"
            style={{ backgroundColor: `${folder.color}20` }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded justify-center items-center" style={{ backgroundColor: folder.color }} />
                <span className="ml-3 font-medium text-black">{folder.name}</span>
              </div>
              
              <div className="flex">
                <button 
                  className="p-2 ml-1"
                  onClick={() => openEditDialog(folder)}
                  disabled={folder.id === "default"}
                >
                  Edit
                </button>
                
                <button 
                  className="p-2 ml-1"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white w-4/5 rounded p-4">
            <h3 className="text-lg font-bold mb-4">Nueva carpeta</h3>
            <div className="mb-4">
              <label className="block mb-2">Nombre</label>
              <input
                className="border border-gray-300 p-2 rounded w-full"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Color</label>
              <div className="flex items-center">
                <input
                  className="border border-gray-300 p-2 rounded w-16 h-10"
                  style={{ backgroundColor: folderColor }}
                  value={folderColor}
                  onChange={(e) => setFolderColor(e.target.value)}
                />
                <div className="w-10 h-10 ml-2 rounded" style={{ backgroundColor: folderColor }} />
              </div>
            </div>
            <button className="bg-blue-500 text-white p-3 rounded w-full mb-2" onClick={handleAddFolder}>
              Crear carpeta
            </button>
            <button className="p-3 rounded w-full text-blue-500" onClick={() => setShowAddFolderDialog(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      
      {/* Edit folder dialog */}
      {showEditFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white w-4/5 rounded p-4">
            <h3 className="text-lg font-bold mb-4">Editar carpeta</h3>
            <div className="mb-4">
              <label className="block mb-2">Nombre</label>
              <input
                className="border border-gray-300 p-2 rounded w-full"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Color</label>
              <div className="flex items-center">
                <input
                  className="border border-gray-300 p-2 rounded w-16 h-10"
                  style={{ backgroundColor: folderColor }}
                  value={folderColor}
                  onChange={(e) => setFolderColor(e.target.value)}
                />
                <div className="w-10 h-10 ml-2 rounded" style={{ backgroundColor: folderColor }} />
              </div>
            </div>
            <button className="bg-blue-500 text-white p-3 rounded w-full mb-2" onClick={handleEditFolder}>
              Guardar cambios
            </button>
            <button className="p-3 rounded w-full text-blue-500" onClick={() => setShowEditFolderDialog(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
