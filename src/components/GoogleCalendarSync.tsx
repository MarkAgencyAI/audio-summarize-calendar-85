
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Globe } from "lucide-react";
import { toast } from "sonner";
import { CalendarEvent } from "@/components/Calendar";
import { googleCalendarService } from "@/services/GoogleCalendarService";

interface GoogleCalendarSyncProps {
  events: CalendarEvent[];
  onEventsSynced: (syncedEvents: {localEventId: string, googleEventId: string, htmlLink?: string}[]) => void;
}

export function GoogleCalendarSync({ events, onEventsSynced }: GoogleCalendarSyncProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeGoogleCalendar = async () => {
      try {
        setIsInitializing(true);
        await googleCalendarService.init();
        setIsAuthenticated(googleCalendarService.isSignedIn());
      } catch (error) {
        console.error("Error initializing Google Calendar", error);
        toast.error(`Error initializing Google Calendar: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeGoogleCalendar();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      await googleCalendarService.signIn();
      setIsAuthenticated(true);
      toast.success('Conectado a Google Calendar correctamente');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error(`Error al iniciar sesión con Google: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignOut = () => {
    googleCalendarService.signOut();
    setIsAuthenticated(false);
    toast.success('Desconectado de Google Calendar');
  };

  const syncEventsToGoogleCalendar = async () => {
    if (!isAuthenticated) {
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
      
      console.log(`Syncing ${unsyncedEvents.length} events to Google Calendar`);
      
      // Call our service to sync events
      const syncedEvents = await googleCalendarService.syncEvents(unsyncedEvents);
      
      // Call the callback with the synced events
      if (syncedEvents.length > 0) {
        onEventsSynced(syncedEvents);
        toast.success(`Se han sincronizado ${syncedEvents.length} eventos con Google Calendar`);
      } else {
        toast.info("No se han sincronizado eventos");
      }
    } catch (error) {
      console.error("Error syncing events to Google Calendar", error);
      toast.error(`Error al sincronizar eventos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Cargando Google Calendar...
        </p>
        <div className="w-full flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    );
  }

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
