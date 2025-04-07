
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { CalendarEvent } from "@/components/Calendar";

// Google API client ID (this is a public key that can be safely included in client-side code)
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";
const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY";
const SCOPES = "https://www.googleapis.com/auth/calendar";

interface GoogleCalendarSyncProps {
  events: CalendarEvent[];
  onEventsSynced: () => void;
}

export function GoogleCalendarSync({ events, onEventsSynced }: GoogleCalendarSyncProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncedEvents, setSyncedEvents] = useState<string[]>([]);

  useEffect(() => {
    // Load the Google API client library
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleAPI;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeGoogleAPI = () => {
    window.gapi.load("client:auth2", () => {
      window.gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
      }).then(() => {
        // Check if user is already signed in
        if (window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
          setIsAuthenticated(true);
        }
      }).catch(error => {
        console.error("Error initializing Google API", error);
        toast.error("Error al inicializar la API de Google");
      });
    });
  };

  const handleGoogleSignIn = () => {
    if (!window.gapi || !window.gapi.auth2) {
      toast.error("La API de Google no se ha cargado correctamente");
      return;
    }

    setIsLoading(true);
    window.gapi.auth2.getAuthInstance().signIn()
      .then(response => {
        setIsAuthenticated(true);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error signing in with Google", error);
        toast.error("Error al iniciar sesión con Google");
        setIsLoading(false);
      });
  };

  const handleGoogleSignOut = () => {
    if (!window.gapi || !window.gapi.auth2) {
      toast.error("La API de Google no se ha cargado correctamente");
      return;
    }

    setIsLoading(true);
    window.gapi.auth2.getAuthInstance().signOut()
      .then(() => {
        setIsAuthenticated(false);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error signing out from Google", error);
        toast.error("Error al cerrar sesión de Google");
        setIsLoading(false);
      });
  };

  const syncEventsToGoogleCalendar = async () => {
    if (!isAuthenticated || !window.gapi || !window.gapi.client) {
      toast.error("Por favor, inicia sesión con Google para sincronizar eventos");
      return;
    }

    setIsLoading(true);
    const newlySyncedEvents: string[] = [];

    try {
      // Filter events that haven't been synced yet
      const unsyncedEvents = events.filter(event => !event.googleEventId);
      
      if (unsyncedEvents.length === 0) {
        toast.info("No hay eventos nuevos para sincronizar");
        setIsLoading(false);
        return;
      }

      // Create batch request
      const batch = window.gapi.client.newBatch();
      
      unsyncedEvents.forEach((event, index) => {
        const googleEvent = {
          summary: event.title,
          description: event.description || "",
          start: {
            dateTime: new Date(event.date).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: new Date(new Date(event.date).getTime() + 60 * 60 * 1000).toISOString(), // Add 1 hour by default
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        };
        
        batch.add(
          window.gapi.client.calendar.events.insert({
            calendarId: "primary",
            resource: googleEvent
          }),
          { id: event.id }
        );
        
        newlySyncedEvents.push(event.id);
      });
      
      await batch.execute();
      
      // Update UI with synced events
      setSyncedEvents(prev => [...prev, ...newlySyncedEvents]);
      
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
          <Calendar className="mr-2 h-4 w-4" />
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
