
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useRecordings } from '@/context/RecordingsContext';
import { useTheme } from '@/context/ThemeContext';
import { Feather } from '@expo/vector-icons';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { recentRecordings, folders, fetchUserData } = useRecordings();
  const { isDark } = useTheme();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await fetchUserData();
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const renderRecordingItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.recordingItem,
        { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }
      ]}
      onPress={() => navigation.navigate('RecordingDetails', { recordingId: item.id })}
    >
      <View style={styles.recordingIcon}>
        <Feather name="mic" size={20} color="#00b8ae" />
      </View>
      <View style={styles.recordingInfo}>
        <Text style={[styles.recordingTitle, { color: isDark ? '#ffffff' : '#121212' }]}>
          {item.title || 'Grabación sin título'}
        </Text>
        <Text style={[styles.recordingMeta, { color: isDark ? '#e0e0e0' : '#666666' }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={isDark ? '#e0e0e0' : '#666666'} />
    </TouchableOpacity>
  );
  
  const renderFolderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.folderItem,
        { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }
      ]}
      onPress={() => navigation.navigate('FolderDetails', { folderId: item.id })}
    >
      <View style={styles.folderIcon}>
        <Feather name="folder" size={20} color="#00b8ae" />
      </View>
      <View style={styles.folderInfo}>
        <Text style={[styles.folderTitle, { color: isDark ? '#ffffff' : '#121212' }]}>
          {item.name || 'Carpeta sin nombre'}
        </Text>
        <Text style={[styles.folderMeta, { color: isDark ? '#e0e0e0' : '#666666' }]}>
          {item.recordingsCount || 0} grabaciones
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={isDark ? '#e0e0e0' : '#666666'} />
    </TouchableOpacity>
  );
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#ffffff' }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: isDark ? '#ffffff' : '#121212' }]}>
            Hola, {user?.name || 'Usuario'}
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#e0e0e0' : '#666666' }]}>
            Bienvenido a Cali
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
          onPress={() => navigation.navigate('Recorder')}
        >
          <View style={styles.actionIcon}>
            <Feather name="mic" size={24} color="#00b8ae" />
          </View>
          <Text style={[styles.actionText, { color: isDark ? '#ffffff' : '#121212' }]}>
            Grabar
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
          onPress={() => navigation.navigate('Calendar')}
        >
          <View style={styles.actionIcon}>
            <Feather name="calendar" size={24} color="#00b8ae" />
          </View>
          <Text style={[styles.actionText, { color: isDark ? '#ffffff' : '#121212' }]}>
            Calendario
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}
          onPress={() => navigation.navigate('Folders')}
        >
          <View style={styles.actionIcon}>
            <Feather name="folder" size={24} color="#00b8ae" />
          </View>
          <Text style={[styles.actionText, { color: isDark ? '#ffffff' : '#121212' }]}>
            Carpetas
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Recent Recordings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#121212' }]}>
            Grabaciones recientes
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Recordings')}>
            <Text style={[styles.seeAllText, { color: '#00b8ae' }]}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#00b8ae" style={styles.loader} />
        ) : recentRecordings.length > 0 ? (
          <FlatList
            data={recentRecordings.slice(0, 3)}
            renderItem={renderRecordingItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Feather name="mic-off" size={40} color="#cccccc" />
            <Text style={[styles.emptyText, { color: isDark ? '#e0e0e0' : '#666666' }]}>
              No hay grabaciones recientes
            </Text>
          </View>
        )}
      </View>
      
      {/* Folders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#121212' }]}>
            Tus carpetas
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Folders')}>
            <Text style={[styles.seeAllText, { color: '#00b8ae' }]}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#00b8ae" style={styles.loader} />
        ) : folders.length > 0 ? (
          <FlatList
            data={folders.slice(0, 3)}
            renderItem={renderFolderItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Feather name="folder" size={40} color="#cccccc" />
            <Text style={[styles.emptyText, { color: isDark ? '#e0e0e0' : '#666666' }]}>
              No hay carpetas
            </Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00b8ae',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    width: '30%',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
  },
  loader: {
    marginVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 8,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  recordingIcon: {
    marginRight: 16,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  recordingMeta: {
    fontSize: 14,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  folderIcon: {
    marginRight: 16,
  },
  folderInfo: {
    flex: 1,
  },
  folderTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  folderMeta: {
    fontSize: 14,
  },
});
