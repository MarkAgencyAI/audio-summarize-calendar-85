
import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { RecordingsProvider } from "@/context/RecordingsContext";

// Screens
import Index from "./screens/Index";
import Login from "./screens/Login";
import Register from "./screens/Register";
import Dashboard from "./screens/Dashboard";
import Calendar from "./screens/Calendar";
import Folders from "./screens/Folders";
import FolderDetails from "./screens/FolderDetails";
import Profile from "./screens/Profile";
import RecordingDetails from "./screens/RecordingDetails";
import NotFound from "./screens/NotFound";

// Create a Stack navigator
const Stack = createNativeStackNavigator();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RecordingsProvider>
          <ThemeProvider>
            <NavigationContainer>
              <Stack.Navigator 
                initialRouteName="Index"
                screenOptions={{
                  headerShown: false
                }}
              >
                <Stack.Screen name="Index" component={Index} />
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Register" component={Register} />
                <Stack.Screen name="Dashboard" component={Dashboard} />
                <Stack.Screen name="Calendar" component={Calendar} />
                <Stack.Screen name="Folders" component={Folders} />
                <Stack.Screen name="FolderDetails" component={FolderDetails} />
                <Stack.Screen name="Profile" component={Profile} />
                <Stack.Screen name="RecordingDetails" component={RecordingDetails} />
                <Stack.Screen name="NotFound" component={NotFound} />
              </Stack.Navigator>
            </NavigationContainer>
          </ThemeProvider>
        </RecordingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
