
import { useState, useMemo } from "react";
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  color?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, "id">) => void;
  onDeleteEvent: (id: string) => void;
}

export function Calendar({
  events,
  onAddEvent,
  onDeleteEvent
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: ""
  });
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);

    let allDays = eachDayOfInterval({
      start,
      end
    });

    const dayOfWeek = start.getDay();

    const prevDays = Array.from({
      length: dayOfWeek
    }, (_, i) => {
      return addDays(start, -(dayOfWeek - i));
    });

    const lastDayOfWeek = end.getDay();

    const nextDays = Array.from({
      length: 6 - lastDayOfWeek
    }, (_, i) => {
      return addDays(end, i + 1);
    });
    return [...prevDays, ...allDays, ...nextDays];
  }, [currentDate]);

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      const dateKey = format(parseISO(event.date), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [events]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setNewEvent({
      title: "",
      description: "",
      date: format(date, "yyyy-MM-dd'T'HH:mm")
    });
    setShowEventDialog(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    onAddEvent({
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date
    });
    toast.success("Evento agregado");
    setShowEventDialog(false);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      onDeleteEvent(selectedEvent.id);
      toast.success("Evento eliminado");
      setSelectedEvent(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-[#005c5f] dark:text-white truncate">
          {format(currentDate, "MMMM yyyy", {
            locale: es
          })}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="w-full overflow-auto pb-2">
        <div className="min-w-[640px] max-w-full">
          <div className="calendar-grid mb-1">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => 
              <div key={day} className="py-2 text-center font-medium text-sm">
                {day}
              </div>
            )}
          </div>
          
          <div className="calendar-grid border border-border rounded-lg overflow-hidden">
            {days.map((day, i) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate[dateKey] || [];
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              return (
                <div 
                  key={i} 
                  className={`
                    calendar-date border border-border p-1
                    ${isCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground"}
                    hover:bg-secondary/50 transition-colors cursor-pointer
                  `} 
                  onClick={() => handleDateClick(day)}
                >
                  <div className={`
                    flex items-center justify-center h-7 w-7 mb-1 text-sm
                    ${isToday ? "bg-primary text-primary-foreground rounded-full" : ""}
                  `}>
                    {format(day, "d")}
                    {dayEvents.length > 0 && 
                      <span className="ml-1 bg-primary/20 text-primary text-xs px-1 rounded-full">
                        {dayEvents.length}
                      </span>
                    }
                  </div>
                  
                  <div className="space-y-1 max-h-[80px] overflow-y-auto">
                    {dayEvents.map(event => 
                      <div 
                        key={event.id} 
                        className="calendar-event bg-primary/10 text-primary hover:bg-primary/20" 
                        onClick={e => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                      >
                        {event.title}
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute bottom-1 right-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 opacity-0 hover:opacity-100 bg-muted/50 hover:bg-muted" 
                      onClick={e => {
                        e.stopPropagation();
                        handleDateClick(day);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Agregar evento</DialogTitle>
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
            <div className="space-y-2">
              <Label htmlFor="date">Fecha y hora</Label>
              <Input 
                id="date" 
                type="datetime-local" 
                value={newEvent.date} 
                onChange={e => setNewEvent({
                  ...newEvent,
                  date: e.target.value
                })} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddEvent}>Guardar evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!selectedEvent} onOpenChange={open => !open && setSelectedEvent(null)}>
        {selectedEvent && 
          <DialogContent className="max-w-[95vw] sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                {format(parseISO(selectedEvent.date), "PPPp", {
                  locale: es
                })}
              </p>
              <p className="whitespace-pre-line">
                {selectedEvent.description}
              </p>
            </div>
            <DialogFooter>
              <Button variant="destructive" onClick={handleDeleteEvent}>
                Eliminar evento
              </Button>
            </DialogFooter>
          </DialogContent>
        }
      </Dialog>
    </div>
  );
}
