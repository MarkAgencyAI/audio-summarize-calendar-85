
import React from 'react';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import App from './App';
import './index.css';

function Main() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <App />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
});

// Register the main component to be the entry point of the application
registerRootComponent(Main);
