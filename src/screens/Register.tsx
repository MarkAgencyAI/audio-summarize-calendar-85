
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigation = useNavigation();
  const { register } = useAuth();
  const { isDark } = useTheme();
  
  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      await register(name, email, password);
      // Navigation will be handled by the Auth context through the Index component
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ScrollView 
      contentContainerStyle={[
        styles.container, 
        { backgroundColor: isDark ? '#121212' : '#ffffff' }
      ]}
    >
      <View style={styles.card}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#121212' }]}>
          Crear cuenta
        </Text>
        
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDark ? '#e0e0e0' : '#666666' }]}>
              Nombre
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                  color: isDark ? '#ffffff' : '#121212',
                  borderColor: isDark ? '#3a3a3a' : '#e0e0e0'
                }
              ]}
              placeholder="Tu nombre"
              placeholderTextColor={isDark ? '#909090' : '#aaaaaa'}
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDark ? '#e0e0e0' : '#666666' }]}>
              Correo electrónico
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                  color: isDark ? '#ffffff' : '#121212',
                  borderColor: isDark ? '#3a3a3a' : '#e0e0e0'
                }
              ]}
              placeholder="tucorreo@ejemplo.com"
              placeholderTextColor={isDark ? '#909090' : '#aaaaaa'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDark ? '#e0e0e0' : '#666666' }]}>
              Contraseña
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                  color: isDark ? '#ffffff' : '#121212',
                  borderColor: isDark ? '#3a3a3a' : '#e0e0e0'
                }
              ]}
              placeholder="••••••••"
              placeholderTextColor={isDark ? '#909090' : '#aaaaaa'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.linkText, { color: isDark ? '#00b8ae' : '#008C85' }]}>
              ¿Ya tienes una cuenta? Inicia sesión
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    padding: 24,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#00b8ae',
    height: 50,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff4d4f',
    marginBottom: 16,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
});
