
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Globe } from "lucide-react";
import { toast } from "sonner";
import { CalendarEvent } from "@/components/Calendar";

// Google API client ID (this is a public key that can be safely included in client-side code)
const GOOGLE_CLIENT_ID = "694467530438-n4v9g32o6bqqv0phs52qciq09urceogo.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar";

// Define URLs for our Supabase Edge Functions
const AUTH_URL = import.meta.env.VITE_SUPABASE_URL ? 
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth` : 
  'http://localhost:54321/functions/v1/google-calendar-auth';
  
const SYNC_URL = import.meta.env.VITE_SUPABASE_URL ? 
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync` : 
  'http://localhost:54321/functions/v1/google-calendar-sync';

interface GoogleCalendarSyncProps {
  events: CalendarEvent[];
  onEventsSynced: () => void;
}

export function GoogleCalendarSync({ events, onEventsSynced }: GoogleCalendarSyncProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [syncedEvents, setSyncedEvents] = useState<string[]>([]);

  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('google_access_token');
    const expiryTime = localStorage.getItem('google_token_expiry');
    
    if (token && expiryTime && new Date().getTime() < parseInt(expiryTime)) {
      setAccessToken(token);
      setIsAuthenticated(true);
    }
    
    // Handle OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === localStorage.getItem('oauth_state')) {
      exchangeCodeForToken(code);
      // Clean URL without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  // Exchange the authorization code for an access token
  const exchangeCodeForToken = async (code: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${AUTH_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirect_uri: window.location.origin + window.location.pathname })
      });
      
      if (!response.ok) {
        throw new Error('Error exchanging code for token');
      }
      
      const data = await response.json();
      const { access_token, expires_in } = data;
      
      // Calculate expiry time and store token in localStorage
      const expiryTime = new Date().getTime() + (expires_in * 1000);
      localStorage.setItem('google_access_token', access_token);
      localStorage.setItem('google_token_expiry', expiryTime.toString());
      
      setAccessToken(access_token);
      setIsAuthenticated(true);
      toast.success('Conectado a Google Calendar');
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      toast.error('Error al conectar con Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    
    // Generate a random state value for CSRF protection
    const state = Math.random().toString(36).substring(2);
    localStorage.setItem('oauth_state', state);
    
    // Construct the Google OAuth URL
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = `${AUTH_URL}/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    // Redirect the user to the authorization URL
    window.location.href = authUrl;
  };

  const handleGoogleSignOut = () => {
    setIsLoading(true);
    
    // Clear tokens from localStorage
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    localStorage.removeItem('oauth_state');
    
    setAccessToken(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    toast.success('Desconectado de Google Calendar');
  };

  const syncEventsToGoogleCalendar = async () => {
    if (!isAuthenticated || !accessToken) {
      toast.error("Por favor, inicia sesión con Google para sincronizar eventos");
      return;
    }

    setIsLoading(true);
    
    try {
      // Filter events that haven't been synced yet
      const unsyncedEvents = events.filter(event => !event.googleEventId);
      
      if (unsyncedEvents.length === 0) {
        toast.info("No hay eventos nuevos para sincronizar");
        setIsLoading(false);
        return;
      }
      
      // Call our secure Edge Function to sync events
      const response = await fetch(SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ events: unsyncedEvents })
      });
      
      if (!response.ok) {
        throw new Error('Error syncing events');
      }
      
      const data = await response.json();
      const syncedEventIds = data.syncedEvents.map((e: any) => e.localEventId);
      
      // Update UI with synced events
      setSyncedEvents(prev => [...prev, ...syncedEventIds]);
      
      toast.success(`Se han sincronizado ${unsyncedEvents.length} eventos con Google Calendar`);
      onEventsSynced();
    } catch (error) {
      console.error("Error syncing events to Google Calendar", error);
      toast.error("Error al sincronizar eventos con Google Calendar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Conecta tu cuenta de Google para sincronizar los eventos de este calendario con Google Calendar.
      </p>
      
      {!isAuthenticated ? (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <Globe className="mr-2 h-4 w-4" />
          Iniciar sesión con Google
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Conectado a Google Calendar</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleGoogleSignOut}
              disabled={isLoading}
            >
              Desconectar
            </Button>
          </div>
          
          <Button 
            className="w-full"
            onClick={syncEventsToGoogleCalendar}
            disabled={isLoading}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Sincronizar eventos con Google
          </Button>
        </div>
      )}
    </div>
  );
}
