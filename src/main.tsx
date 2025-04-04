
// This file is kept for compatibility with the web version
// In React Native, index.js is the main entry point
import { AppRegistry } from 'react-native';
import App from './App';

// Register the app for web
AppRegistry.registerComponent('AudioSummaryApp', () => App);

// Web-specific setup
if (typeof document !== 'undefined') {
  const rootTag = document.getElementById('root') || document.getElementById('app');
  if (rootTag) {
    AppRegistry.runApplication('AudioSummaryApp', {
      rootTag
    });
  }
}
