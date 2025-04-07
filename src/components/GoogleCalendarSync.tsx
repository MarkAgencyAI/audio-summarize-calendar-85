
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Globe } from "lucide-react";
import { toast } from "sonner";
import { CalendarEvent } from "@/components/Calendar";

// Define URLs for our Supabase Edge Functions
const AUTH_URL = import.meta.env.VITE_SUPABASE_URL ? 
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth` : 
  'http://localhost:54321/functions/v1/google-calendar-auth';
  
const SYNC_URL = import.meta.env.VITE_SUPABASE_URL ? 
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync` : 
  'http://localhost:54321/functions/v1/google-calendar-sync';

// Fixed redirect URI that should match what's in the Edge Function
const REDIRECT_URI = 'https://cali-asistente.lovable.ai/calendar';

interface GoogleCalendarSyncProps {
  events: CalendarEvent[];
  onEventsSynced: (syncedEvents: {localEventId: string, googleEventId: string}[]) => void;
}

export function GoogleCalendarSync({ events, onEventsSynced }: GoogleCalendarSyncProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('google_access_token');
    const expiryTime = localStorage.getItem('google_token_expiry');
    
    if (token && expiryTime && new Date().getTime() < parseInt(expiryTime)) {
      setAccessToken(token);
      setIsAuthenticated(true);
    }
    
    // Handle OAuth redirect (this runs when user is redirected back from Google)
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get('code');
    const state = queryParams.get('state');
    
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
        body: JSON.stringify({ code })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token exchange error:', errorData);
        throw new Error(`Error exchanging code for token: ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      const { access_token, expires_in, refresh_token } = data;
      
      // Calculate expiry time and store token in localStorage
      const expiryTime = new Date().getTime() + ((expires_in || 3600) * 1000);
      localStorage.setItem('google_access_token', access_token);
      localStorage.setItem('google_token_expiry', expiryTime.toString());
      
      // Store refresh token if available (for future implementation)
      if (refresh_token) {
        localStorage.setItem('google_refresh_token', refresh_token);
      }
      
      setAccessToken(access_token);
      setIsAuthenticated(true);
      toast.success('Conectado a Google Calendar correctamente');
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      toast.error(`Error al conectar con Google Calendar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      // Generate a random state value for CSRF protection
      const state = Math.random().toString(36).substring(2);
      localStorage.setItem('oauth_state', state);
      
      // Get authorization URL from our Edge Function
      const response = await fetch(`${AUTH_URL}/authorize?state=${state}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error getting authorization URL: ${errorData.error || 'Unknown error'}`);
      }
      
      const { authUrl } = await response.json();
      
      // Redirect the user to the Google authorization page
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Google sign-in:', error);
      toast.error(`Error al iniciar sesión con Google: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setIsLoading(false);
    }
  };

  const handleGoogleSignOut = () => {
    // Clear tokens from localStorage
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    localStorage.removeItem('google_refresh_token');
    localStorage.removeItem('oauth_state');
    
    setAccessToken(null);
    setIsAuthenticated(false);
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
        const errorData = await response.json();
        throw new Error(`Error synchronizing events: ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      // Call the callback with the synced events
      if (data.syncedEvents && data.syncedEvents.length > 0) {
        onEventsSynced(data.syncedEvents);
        toast.success(`Se han sincronizado ${data.syncedEvents.length} eventos con Google Calendar`);
      } else {
        toast.info("No se han sincronizado eventos");
      }
      
      // Log errors if any
      if (data.errorEvents && data.errorEvents.length > 0) {
        console.error('Some events failed to sync:', data.errorEvents);
        toast.error(`Hubo errores al sincronizar ${data.errorEvents.length} eventos`);
      }
    } catch (error) {
      console.error("Error syncing events to Google Calendar", error);
      toast.error(`Error al sincronizar eventos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
          {isLoading ? 'Conectando...' : 'Iniciar sesión con Google'}
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
            {isLoading ? 'Sincronizando...' : 'Sincronizar eventos con Google'}
          </Button>
        </div>
      )}
    </div>
  );
}
