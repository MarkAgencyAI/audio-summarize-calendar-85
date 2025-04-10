
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function Folders() {
  const { isDark } = useTheme();
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#121212' : '#ffffff' }
    ]}>
      <Text style={[
        styles.title,
        { color: isDark ? '#ffffff' : '#121212' }
      ]}>
        Carpetas
      </Text>
      
      <Text style={[
        styles.subtitle,
        { color: isDark ? '#e0e0e0' : '#666666' }
      ]}>
        Próximamente: Organiza tus grabaciones en carpetas
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
