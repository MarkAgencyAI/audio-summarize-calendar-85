
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Feather } from '@expo/vector-icons';

export default function Profile() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#121212' : '#ffffff' }
    ]}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={[
          styles.userName,
          { color: isDark ? '#ffffff' : '#121212' }
        ]}>
          {user?.name || 'Usuario'}
        </Text>
        
        <Text style={[
          styles.userEmail,
          { color: isDark ? '#e0e0e0' : '#666666' }
        ]}>
          {user?.email || 'email@ejemplo.com'}
        </Text>
      </View>
      
      <View style={styles.settings}>
        <TouchableOpacity 
          style={[
            styles.settingItem,
            { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }
          ]}
          onPress={toggleTheme}
        >
          <View style={styles.settingIcon}>
            <Feather 
              name={isDark ? 'sun' : 'moon'} 
              size={20} 
              color="#00b8ae" 
            />
          </View>
          <View style={styles.settingContent}>
            <Text style={[
              styles.settingTitle,
              { color: isDark ? '#ffffff' : '#121212' }
            ]}>
              Tema
            </Text>
            <Text style={[
              styles.settingValue,
              { color: isDark ? '#e0e0e0' : '#666666' }
            ]}>
              {isDark ? 'Oscuro' : 'Claro'}
            </Text>
          </View>
          <Feather 
            name="chevron-right" 
            size={20} 
            color={isDark ? '#e0e0e0' : '#666666'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.settingItem,
            { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }
          ]}
        >
          <View style={styles.settingIcon}>
            <Feather 
              name="bell" 
              size={20} 
              color="#00b8ae" 
            />
          </View>
          <View style={styles.settingContent}>
            <Text style={[
              styles.settingTitle,
              { color: isDark ? '#ffffff' : '#121212' }
            ]}>
              Notificaciones
            </Text>
            <Text style={[
              styles.settingValue,
              { color: isDark ? '#e0e0e0' : '#666666' }
            ]}>
              Activadas
            </Text>
          </View>
          <Feather 
            name="chevron-right" 
            size={20} 
            color={isDark ? '#e0e0e0' : '#666666'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.settingItem,
            { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }
          ]}
          onPress={handleLogout}
        >
          <View style={styles.settingIcon}>
            <Feather 
              name="log-out" 
              size={20} 
              color="#ff4d4f" 
            />
          </View>
          <Text style={[
            styles.settingTitle,
            styles.logoutText,
            { color: '#ff4d4f' }
          ]}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00b8ae',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  settings: {
    marginTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
  },
  logoutText: {
    flex: 1,
  },
});
