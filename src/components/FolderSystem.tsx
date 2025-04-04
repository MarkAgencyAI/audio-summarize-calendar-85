
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet } from "react-native";
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
      // Toast message would be shown here in React Native
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carpetas</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => {
            setFolderName("");
            setFolderColor("#3b82f6");
            setShowAddFolderDialog(true);
          }}
        >
          <Text style={styles.buttonText}>Nueva carpeta</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.folderGrid}>
        {folders.map(folder => (
          <View 
            key={folder.id} 
            style={[
              styles.folderItem, 
              { backgroundColor: `${folder.color}20` }
            ]}
          >
            <View style={styles.folderItemHeader}>
              <View style={styles.folderInfo}>
                <View style={[styles.folderIcon, { backgroundColor: folder.color }]}>
                  {/* Folder icon would be here */}
                </View>
                <Text style={styles.folderName}>{folder.name}</Text>
              </View>
              
              <View style={styles.folderActions}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => openEditDialog(folder)}
                  disabled={folder.id === "default"}
                >
                  <Text>Edit</Text> {/* Would be an icon in real app */}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => handleDeleteFolder(folder)}
                  disabled={folder.id === "default"}
                >
                  <Text>Delete</Text> {/* Would be an icon in real app */}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
      
      {/* Add folder dialog */}
      <Modal
        visible={showAddFolderDialog}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddFolderDialog(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva carpeta</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={folderName}
                onChangeText={setFolderName}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorPickerContainer}>
                {/* Color picker would be here - simplified for now */}
                <TextInput
                  style={[styles.colorInput, { backgroundColor: folderColor }]}
                  value={folderColor}
                  onChangeText={setFolderColor}
                />
                <View style={[styles.colorPreview, { backgroundColor: folderColor }]} />
              </View>
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleAddFolder}>
              <Text style={styles.submitButtonText}>Crear carpeta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddFolderDialog(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Edit folder dialog */}
      <Modal
        visible={showEditFolderDialog}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditFolderDialog(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar carpeta</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={folderName}
                onChangeText={setFolderName}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorPickerContainer}>
                {/* Color picker would be here - simplified for now */}
                <TextInput
                  style={[styles.colorInput, { backgroundColor: folderColor }]}
                  value={folderColor}
                  onChangeText={setFolderColor}
                />
                <View style={[styles.colorPreview, { backgroundColor: folderColor }]} />
              </View>
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleEditFolder}>
              <Text style={styles.submitButtonText}>Guardar cambios</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditFolderDialog(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#005c5f',
  },
  button: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  buttonText: {
    color: '#000000',
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  folderItem: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    marginBottom: 16,
  },
  folderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIcon: {
    height: 40,
    width: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderName: {
    marginLeft: 12,
    fontWeight: '500',
    color: '#000000',
  },
  folderActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    padding: 8,
    borderRadius: 4,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    padding: 8,
    borderRadius: 4,
  },
  colorPreview: {
    width: 40,
    height: 40,
    marginLeft: 8,
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#3b82f6',
  },
});
