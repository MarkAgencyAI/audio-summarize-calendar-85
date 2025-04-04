
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { Recording, useRecordings } from "@/context/RecordingsContext";

export default function Dashboard() {
  const navigation = useNavigation();
  const { recordings, folders } = useRecordings();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("default");
  
  // Filter recordings based on search term and selected folder
  const filteredRecordings = recordings.filter(recording => {
    // Filter by folder
    const folderMatch = selectedFolder === "default" ? true : recording.folderId === selectedFolder;

    // Filter by search term
    const searchMatch = searchTerm 
      ? recording.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        recording.transcript.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (recording.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) 
      : true;
      
    return folderMatch && searchMatch;
  });
  
  const handleAddToCalendar = (recording: Recording) => {
    // In React Native, we would navigate to the Calendar screen
    // This is a placeholder until we create the Calendar screen
    console.log("Navigate to calendar with recording:", recording.id);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transcripciones</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Text style={styles.label}>Buscar</Text>
        <TextInput
          style={styles.input}
          placeholder="Buscar transcripciones..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        
        <Text style={styles.label}>Carpeta</Text>
        {/* In a real app, this would be a proper picker/dropdown */}
        <View style={styles.folderSelector}>
          {folders.map(folder => (
            <TouchableOpacity
              key={folder.id}
              style={[
                styles.folderOption,
                selectedFolder === folder.id && styles.selectedFolder
              ]}
              onPress={() => setSelectedFolder(folder.id)}
            >
              <Text style={styles.folderText}>{folder.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.recordingsSection}>
        <Text style={styles.sectionTitle}>Tus Transcripciones</Text>
        
        {filteredRecordings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay transcripciones</Text>
            <Text style={styles.emptySubtext}>
              Graba tu primer audio para comenzar
            </Text>
          </View>
        ) : (
          <View style={styles.recordingsList}>
            {filteredRecordings.map(recording => (
              <View key={recording.id} style={styles.recordingItem}>
                <Text style={styles.recordingTitle}>{recording.name}</Text>
                {recording.summary && (
                  <Text style={styles.recordingSummary}>{recording.summary}</Text>
                )}
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => handleAddToCalendar(recording)}
                >
                  <Text style={styles.calendarButtonText}>Agregar al calendario</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#005c5f',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333333',
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dddddd',
    marginBottom: 16,
  },
  folderSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  folderOption: {
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    margin: 4,
  },
  selectedFolder: {
    backgroundColor: '#3b82f6',
  },
  folderText: {
    color: '#333333',
  },
  recordingsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#005c5f',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  recordingsList: {
    gap: 16,
  },
  recordingItem: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recordingTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  recordingSummary: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  calendarButton: {
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  calendarButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
});
