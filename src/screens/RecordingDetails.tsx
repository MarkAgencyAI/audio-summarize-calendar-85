
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { AudioPlayer } from '@/components/AudioPlayer';

export default function RecordingDetails({ route }) {
  const { recordingId } = route.params;
  const { isDark } = useTheme();
  
  // Mock data - in a real app this would come from a context or API
  const recording = {
    id: recordingId,
    title: 'Grabación de ejemplo',
    date: new Date().toLocaleDateString(),
    duration: 120, // 2 minutes in seconds
    audioUrl: 'https://example.com/audio.mp3',
    transcription: 'Transcripción de ejemplo para la grabación. Esta es una transcripción simulada que representaría el contenido de audio convertido a texto.',
    summary: 'Este es un resumen del contenido de la grabación. Destaca los puntos principales discutidos en el audio.'
  };
  
  return (
    <ScrollView 
      style={[
        styles.container,
        { backgroundColor: isDark ? '#121212' : '#ffffff' }
      ]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[
        styles.title,
        { color: isDark ? '#ffffff' : '#121212' }
      ]}>
        {recording.title}
      </Text>
      
      <Text style={[
        styles.date,
        { color: isDark ? '#e0e0e0' : '#666666' }
      ]}>
        {recording.date}
      </Text>
      
      <View style={styles.playerContainer}>
        <AudioPlayer 
          audioUrl={recording.audioUrl}
          initialDuration={recording.duration}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle,
          { color: isDark ? '#ffffff' : '#121212' }
        ]}>
          Resumen
        </Text>
        <Text style={[
          styles.sectionContent,
          { color: isDark ? '#e0e0e0' : '#666666' }
        ]}>
          {recording.summary}
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle,
          { color: isDark ? '#ffffff' : '#121212' }
        ]}>
          Transcripción
        </Text>
        <Text style={[
          styles.sectionContent,
          { color: isDark ? '#e0e0e0' : '#666666' }
        ]}>
          {recording.transcription}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    marginBottom: 24,
  },
  playerContainer: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
});
