
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Calendar, CalendarEvent } from "@/components/Calendar";
import { useAuth } from "@/context/AuthContext";
import { format, addHours } from "date-fns";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { loadFromStorage, saveToStorage } from "@/lib/storage";

export default function CalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endDate: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    folderId: "",
    eventType: ""
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadedEvents = loadFromStorage<CalendarEvent[]>("calendarEvents") || [];
    setEvents(loadedEvents);
  }, []);

  useEffect(() => {
    saveToStorage("calendarEvents", events);
  }, [events]);

  useEffect(() => {
    if (location.state?.recording) {
      const recording = location.state.recording;
      if (recording.keyPoints?.length > 0) {
        const dialog = document.createElement("dialog");
        dialog.className = "fixed inset-0 flex items-center justify-center bg-black/50 z-50";
        dialog.innerHTML = `
          <div class="bg-background dark:bg-custom-secondary/20 dark:border-custom-secondary/40 dark:text-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <h2 class="text-xl font-bold mb-4 dark:text-white">Eventos sugeridos</h2>
            <p class="text-sm text-muted-foreground dark:text-white/60 mb-4">
              Se encontraron los siguientes eventos en la grabación. 
              ¿Deseas agregarlos al calendario?
            </p>
            <div class="space-y-2 max-h-60 overflow-y-auto" id="suggested-events"></div>
            <div class="flex justify-end space-x-2 mt-6">
              <button class="px-4 py-2 bg-secondary text-secondary-foreground dark:bg-custom-secondary/40 dark:text-white rounded-lg" id="cancel-button">
                Cancelar
              </button>
              <button class="px-4 py-2 bg-primary text-primary-foreground dark:bg-custom-accent dark:text-white rounded-lg" id="add-button">
                Agregar seleccionados
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(dialog);
        dialog.showModal();
        const suggestedEventsContainer = dialog.querySelector("#suggested-events");

        recording.keyPoints.forEach((point, index) => {
          const now = new Date();
          const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (index + 1));
          const eventEl = document.createElement("div");
          eventEl.className = "flex items-center space-x-2";
          eventEl.innerHTML = `
            <input type="checkbox" id="event-${index}" class="h-4 w-4" checked />
            <label for="event-${index}" class="flex-1 dark:text-white">
              <div class="font-medium text-sm break-words">${point}</div>
              <div class="text-xs text-muted-foreground dark:text-white/60">
                ${format(eventDate, "PPP")}
              </div>
            </label>
          `;
          suggestedEventsContainer?.appendChild(eventEl);
        });

        const cancelButton = dialog.querySelector("#cancel-button");
        const addButton = dialog.querySelector("#add-button");
        if (cancelButton) {
          cancelButton.addEventListener("click", () => {
            dialog.close();
            dialog.remove();
          });
        }
        if (addButton) {
          addButton.addEventListener("click", () => {
            const checkboxes = dialog.querySelectorAll("input[type=checkbox]:checked");
            const newEvents: CalendarEvent[] = [];
            
            checkboxes.forEach((checkbox, index) => {
              const now = new Date();
              const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (index + 1));
              const newEvent: CalendarEvent = {
                id: crypto.randomUUID(),
                title: recording.keyPoints[index],
                description: `Evento basado en la grabación: ${recording.name}`,
                date: eventDate.toISOString(),
                folderId: recording.folderId // Associate with the recording's folder
              };
              newEvents.push(newEvent);
            });
            
            setEvents(prev => {
              const updatedEvents = [...prev, ...newEvents];
              saveToStorage("calendarEvents", updatedEvents);
              return updatedEvents;
            });
            
            toast.success("Eventos agregados al calendario");
            dialog.close();
            dialog.remove();
          });
        }
      }

      navigate("/calendar", {
        replace: true
      });
    }
  }, [location.state, navigate]);

  const handleAddEvent = (event: Omit<CalendarEvent, "id">) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID()
    };
    setEvents(prev => {
      const updatedEvents = [...prev, newEvent];
      saveToStorage("calendarEvents", updatedEvents);
      return updatedEvents;
    });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => {
      const updatedEvents = prev.filter(event => event.id !== id);
      saveToStorage("calendarEvents", updatedEvents);
      return updatedEvents;
    });
  };

  const handleQuickAddEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    
    // Validate end date is after start date
    if (newEvent.endDate && new Date(newEvent.endDate) <= new Date(newEvent.date)) {
      toast.error("La hora de finalización debe ser posterior a la hora de inicio");
      return;
    }
    
    handleAddEvent({
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      endDate: newEvent.endDate || undefined,
      folderId: newEvent.folderId || undefined,
      eventType: newEvent.eventType || undefined
    });
    
    // Reset form
    setNewEvent({
      title: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endDate: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      folderId: "",
      eventType: ""
    });
    
    toast.success("Evento agregado");
    setShowAddEventDialog(false);
  };

  // Handler for filter changes
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    // Puedes mostrar un mensaje para indicar que el filtro ha cambiado
    if (filter === "all") {
      toast.info("Mostrando todos los eventos");
    } else {
      toast.info(`Mostrando eventos de tipo: ${filter}`);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-custom-primary dark:text-custom-accent dark:text-white">
          Calendario
        </h1>
        
        <div className="glassmorphism rounded-xl p-3 md:p-6 shadow-lg dark:bg-custom-secondary/20 dark:border-custom-secondary/40 w-full overflow-hidden">
          <div className="w-full overflow-x-auto">
            <Calendar 
              events={events} 
              onAddEvent={handleAddEvent} 
              onDeleteEvent={handleDeleteEvent}
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>
      </div>
      
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button 
          onClick={() => setShowAddEventDialog(true)}
          className="rounded-full shadow-lg w-14 h-14 p-4"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Quick Add Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Agregar evento</DialogTitle>
            <DialogDescription>Completa los datos para agregar un nuevo evento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input 
                id="title" 
                value={newEvent.title} 
                onChange={e => setNewEvent({
                  ...newEvent,
                  title: e.target.value
                })} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea 
                id="description" 
                value={newEvent.description} 
                onChange={e => setNewEvent({
                  ...newEvent,
                  description: e.target.value
                })} 
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Hora de inicio</Label>
                <Input 
                  id="startDate" 
                  type="datetime-local" 
                  value={newEvent.date} 
                  onChange={e => setNewEvent({
                    ...newEvent,
                    date: e.target.value
                  })} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">Hora de finalización</Label>
                <Input 
                  id="endDate" 
                  type="datetime-local" 
                  value={newEvent.endDate} 
                  onChange={e => setNewEvent({
                    ...newEvent,
                    endDate: e.target.value
                  })} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleQuickAddEvent}>Guardar evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
