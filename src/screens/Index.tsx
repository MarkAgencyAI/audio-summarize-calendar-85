
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function Index() {
  const navigation = useNavigation();
  const { user, isLoading } = useAuth();
  const { isDark } = useTheme();
  
  useEffect(() => {
    // Wait for auth to initialize
    if (!isLoading) {
      // Redirect to dashboard if logged in, otherwise to login
      if (user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }
  }, [user, isLoading, navigation]);
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#ffffff' }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#121212' }]}>
          Cali - Asistente de clases
        </Text>
        <ActivityIndicator size="large" color="#00b8ae" style={styles.loader} />
        <Text style={[styles.subtitle, { color: isDark ? '#e0e0e0' : '#666666' }]}>
          Cargando...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  loader: {
    marginVertical: 16,
  }
});
