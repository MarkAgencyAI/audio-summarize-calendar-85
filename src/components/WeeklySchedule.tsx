
import { useState } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, setHours, setMinutes, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarEvent, eventTypeColors } from "@/components/Calendar";
import { useRecordings } from "@/context/RecordingsContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface WeeklyScheduleProps {
  date: Date;
  onSave: (events: Omit<CalendarEvent, "id">[]) => void;
  onCancel: () => void;
}

interface ScheduleCell {
  day: Date;
  hour: number;
  event?: Omit<CalendarEvent, "id">;
}

export function WeeklySchedule({ date, onSave, onCancel }: WeeklyScheduleProps) {
  const { folders } = useRecordings();
  
  // Create a week range starting from Monday
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Hours from 7 AM to 9 PM
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);
  
  // State for schedule cells
  const [scheduleCells, setScheduleCells] = useState<ScheduleCell[]>(() => {
    const cells: ScheduleCell[] = [];
    days.forEach(day => {
      hours.forEach(hour => {
        cells.push({ day, hour });
      });
    });
    return cells;
  });
  
  // State for the form
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedCell, setSelectedCell] = useState<ScheduleCell | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    eventType: "",
    folderId: "",
    duration: "1"
  });
  
  // Event types
  const eventTypes = [
    "Examen Parcial",
    "Examen Final",
    "Trabajo Práctico",
    "Tarea",
    "Actividad",
    "Consulta",
    "Clase Especial",
    "Otro"
  ];
  
  // Handle cell click to add/edit event
  const handleCellClick = (day: Date, hour: number) => {
    const cell = scheduleCells.find(c => 
      c.day.getDate() === day.getDate() && 
      c.day.getMonth() === day.getMonth() && 
      c.hour === hour
    );
    
    if (cell) {
      setSelectedCell(cell);
      
      if (cell.event) {
        // Edit existing event
        setNewEvent({
          title: cell.event.title,
          description: cell.event.description || "",
          eventType: cell.event.eventType || "",
          folderId: cell.event.folderId || "",
          duration: "1" // Default to 1 hour
        });
      } else {
        // New event
        setNewEvent({
          title: "",
          description: "",
          eventType: "",
          folderId: "",
          duration: "1"
        });
      }
      
      setShowEventForm(true);
    }
  };
  
  // Handle saving the event to the schedule
  const handleSaveEvent = () => {
    if (!selectedCell) return;
    if (!newEvent.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    
    const eventDay = selectedCell.day;
    const eventHour = selectedCell.hour;
    
    // Create start date
    const startDate = setMinutes(setHours(eventDay, eventHour), 0);
    
    // Create end date based on duration
    const duration = parseInt(newEvent.duration);
    const endDate = setMinutes(setHours(eventDay, eventHour + duration), 0);
    
    // Create the event
    const event: Omit<CalendarEvent, "id"> = {
      title: newEvent.title,
      description: newEvent.description,
      date: startDate.toISOString(),
      endDate: endDate.toISOString(),
      eventType: newEvent.eventType || undefined,
      folderId: newEvent.folderId || undefined,
      repeat: "weekly" // Weekly repeating event
    };
    
    // Update the cells array
    setScheduleCells(prev => {
      return prev.map(cell => {
        if (
          cell.day.getDate() === eventDay.getDate() && 
          cell.day.getMonth() === eventDay.getMonth() && 
          cell.hour === eventHour
        ) {
          return { ...cell, event };
        }
        return cell;
      });
    });
    
    setShowEventForm(false);
    toast.success("Evento agregado al cronograma");
  };
  
  // Handle removing an event from the schedule
  const handleRemoveEvent = () => {
    if (!selectedCell) return;
    
    setScheduleCells(prev => {
      return prev.map(cell => {
        if (
          cell.day.getDate() === selectedCell.day.getDate() && 
          cell.day.getMonth() === selectedCell.day.getMonth() && 
          cell.hour === selectedCell.hour
        ) {
          return { day: cell.day, hour: cell.hour };
        }
        return cell;
      });
    });
    
    setShowEventForm(false);
    toast.success("Evento eliminado del cronograma");
  };
  
  // Handle saving the entire schedule
  const handleSaveSchedule = () => {
    const events = scheduleCells
      .filter(cell => cell.event)
      .map(cell => cell.event!);
    
    if (events.length === 0) {
      toast.error("No hay eventos en el cronograma");
      return;
    }
    
    onSave(events);
  };
  
  // Get event color based on event type
  const getEventColor = (eventType?: string) => {
    if (!eventType) return "#6b7280"; // Default gray
    return eventTypeColors[eventType] || "#6b7280";
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h2 className="text-xl font-semibold text-[#005c5f] dark:text-white">
            Cronograma Semanal
          </h2>
        </div>
        <Button onClick={handleSaveSchedule} className="flex items-center gap-1">
          <Save className="h-4 w-4 mr-1" />
          Guardar Cronograma
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        {/* Days header */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-2 border-r bg-muted/30"></div>
          {days.map((day, i) => (
            <div key={i} className="p-2 text-center font-medium border-r last:border-r-0 bg-muted/30">
              <div>{format(day, "EEE", { locale: es })}</div>
              <div className="text-xs">{format(day, "d MMM")}</div>
            </div>
          ))}
        </div>
        
        <ScrollArea className="h-[calc(100vh-220px)]">
          {/* Hours and schedule cells */}
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
              <div className="p-2 border-r text-center text-sm text-muted-foreground bg-muted/10">
                {hour}:00
              </div>
              
              {days.map((day, dayIndex) => {
                const cell = scheduleCells.find(c => 
                  c.day.getDate() === day.getDate() && 
                  c.day.getMonth() === day.getMonth() && 
                  c.hour === hour
                );
                
                const hasEvent = !!cell?.event;
                const eventColor = hasEvent ? getEventColor(cell?.event?.eventType) : undefined;
                
                return (
                  <div 
                    key={dayIndex}
                    className={`
                      p-2 border-r last:border-r-0 h-16 relative
                      ${hasEvent ? "" : "hover:bg-muted/20 cursor-pointer"}
                    `}
                    onClick={() => !hasEvent && handleCellClick(day, hour)}
                  >
                    {hasEvent ? (
                      <div 
                        className="absolute inset-1 rounded p-1 flex flex-col cursor-pointer"
                        style={{
                          backgroundColor: `${eventColor}20`,
                          borderLeft: `3px solid ${eventColor}`,
                          color: eventColor
                        }}
                        onClick={() => handleCellClick(day, hour)}
                      >
                        <div className="text-xs font-medium truncate">{cell?.event?.title}</div>
                        <div className="text-xs opacity-80">Semanal</div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </ScrollArea>
      </div>
      
      {/* Event form dialog */}
      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent className="max-w-[95vw] sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCell?.event ? "Editar evento" : "Agregar evento"}
            </DialogTitle>
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
              <Label htmlFor="eventType">Tipo de evento</Label>
              <Select
                value={newEvent.eventType}
                onValueChange={(value) => setNewEvent({
                  ...newEvent,
                  eventType: value
                })}
              >
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="otro">Otro</SelectItem>
                  {eventTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folder">Materia</Label>
              <Select
                value={newEvent.folderId}
                onValueChange={(value) => setNewEvent({
                  ...newEvent,
                  folderId: value
                })}
              >
                <SelectTrigger id="folder">
                  <SelectValue placeholder="Selecciona una materia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin materia</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (horas)</Label>
              <Select
                value={newEvent.duration}
                onValueChange={(value) => setNewEvent({
                  ...newEvent,
                  duration: value
                })}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Duración" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map(hours => (
                    <SelectItem key={hours} value={hours.toString()}>
                      {hours} {hours === 1 ? "hora" : "horas"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            {selectedCell?.event && (
              <Button variant="destructive" onClick={handleRemoveEvent}>
                <X className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
            <Button onClick={handleSaveEvent}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
