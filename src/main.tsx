
import { AppRegistry } from 'react-native-web';
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
