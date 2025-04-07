
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { FolderSystem } from "@/components/FolderSystem";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadFromStorage } from "@/lib/storage";
import { parseISO, format, isWithinInterval, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
}

function UpcomingEvents({ events }: { events: CalendarEvent[] }) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-500" />
          Próximos Recordatorios
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center text-muted-foreground py-2">
            <p>No hay recordatorios próximos</p>
            <p className="text-xs mt-1">Tus eventos aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 5).map(event => (
              <div
                key={event.id}
                className="p-2 bg-secondary/50 rounded-lg transition-colors cursor-pointer"
                onClick={() => navigate("/calendar")}
              >
                <div className="font-medium text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-orange-500" />
                  {event.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(parseISO(event.date), "PPPp", { locale: es })}
                </div>
              </div>
            ))}

            {events.length > 5 && (
              <Button
                variant="link"
                className="w-full text-sm"
                onClick={() => navigate("/calendar")}
              >
                Ver todos los eventos ({events.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FoldersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  
  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  
  useEffect(() => {
    const loadEvents = () => {
      const storedEvents = loadFromStorage<CalendarEvent[]>("calendarEvents") || [];
      const now = new Date();
      const filteredEvents = storedEvents.filter((event: CalendarEvent) => {
        try {
          const eventDate = parseISO(event.date);
          return isWithinInterval(eventDate, {
            start: now,
            end: addDays(now, 14)
          });
        } catch (error) {
          console.error("Error parsing date for event:", event);
          return false;
        }
      });
      
      filteredEvents.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      setUpcomingEvents(filteredEvents);
    };
    
    loadEvents();
    
    const intervalId = setInterval(loadEvents, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <Layout>
      <div className="space-y-4 md:space-y-8 max-w-full mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Materias</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="glassmorphism rounded-xl p-3 md:p-6 shadow-lg w-full overflow-hidden">
              <div className="w-full overflow-x-auto">
                <FolderSystem />
              </div>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <UpcomingEvents events={upcomingEvents} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
