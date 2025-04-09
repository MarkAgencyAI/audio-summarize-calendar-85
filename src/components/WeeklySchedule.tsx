
import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, setHours, setMinutes, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, Plus, Save, X, AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WeeklyScheduleProps {
  date: Date;
  onSave: (events: Omit<CalendarEvent, "id">[]) => void;
  onCancel: () => void;
  hasExistingSchedule?: boolean;
  existingEvents?: CalendarEvent[];
}

interface ScheduleCell {
  day: Date;
  hour: number;
  event?: Omit<CalendarEvent, "id">;
}

export function WeeklySchedule({ 
  date, 
  onSave, 
  onCancel, 
  hasExistingSchedule = false,
  existingEvents = [] 
}: WeeklyScheduleProps) {
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

  // Load existing schedule events when component mounts
  useEffect(() => {
    if (hasExistingSchedule && existingEvents.length > 0) {
      const scheduleEvents = existingEvents.filter(event => 
        event.eventType === "Cronograma" && event.repeat === "weekly"
      );
      
      if (scheduleEvents.length > 0) {
        const updatedCells = [...scheduleCells];
        
        scheduleEvents.forEach(event => {
          const eventDate = parseISO(event.date);
          const eventDay = eventDate.getDay();
          const eventHour = eventDate.getHours();
          
          // Find the corresponding cell in the current week
          const weekDay = days.find(d => d.getDay() === eventDay);
          
          if (weekDay && hours.includes(eventHour)) {
            const cellIndex = updatedCells.findIndex(cell => 
              cell.day.getDay() === weekDay.getDay() && 
              cell.hour === eventHour
            );
            
            if (cellIndex !== -1) {
              // Calculate event duration
              let duration = 1;
              if (event.endDate) {
                const endDate = parseISO(event.endDate);
                duration = endDate.getHours() - eventDate.getHours();
                if (duration < 1) duration = 1;
              }
              
              updatedCells[cellIndex].event = {
                title: event.title,
                description: event.description,
                date: setHours(setMinutes(weekDay, 0), eventHour).toISOString(),
                endDate: setHours(setMinutes(weekDay, 0), eventHour + duration).toISOString(),
                eventType: event.eventType,
                folderId: event.folderId,
                repeat: "weekly"
              };
            }
          }
        });
        
        setScheduleCells(updatedCells);
      }
    }
  }, [hasExistingSchedule, existingEvents, days, hours]);
  
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
        const duration = cell.event.endDate 
          ? Math.round((new Date(cell.event.endDate).getTime() - new Date(cell.event.date).getTime()) / 3600000)
          : 1;
        
        setNewEvent({
          title: cell.event.title,
          description: cell.event.description || "",
          eventType: cell.event.eventType || "",
          folderId: cell.event.folderId || "",
          duration: duration.toString()
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
      const updated = [...prev];
      
      // First, clear any cells that might be occupied by this event (for resizing)
      if (selectedCell.event) {
        const oldDuration = selectedCell.event.endDate 
          ? Math.round((new Date(selectedCell.event.endDate).getTime() - new Date(selectedCell.event.date).getTime()) / 3600000)
          : 1;
        
        for (let i = 0; i < oldDuration; i++) {
          const cellToCheck = updated.find(c => 
            c.day.getDate() === eventDay.getDate() && 
            c.day.getMonth() === eventDay.getMonth() && 
            c.hour === (eventHour + i)
          );
          
          if (cellToCheck && cellToCheck.event?.title === selectedCell.event.title) {
            const cellIndex = updated.indexOf(cellToCheck);
            if (cellIndex !== -1) {
              updated[cellIndex] = { ...updated[cellIndex], event: undefined };
            }
          }
        }
      }
      
      // Now set the event in the first cell
      const cellIndex = updated.findIndex(c => 
        c.day.getDate() === eventDay.getDate() && 
        c.day.getMonth() === eventDay.getMonth() && 
        c.hour === eventHour
      );
      
      if (cellIndex !== -1) {
        updated[cellIndex] = { ...updated[cellIndex], event };
      }
      
      return updated;
    });
    
    setShowEventForm(false);
    toast.success("Evento agregado al cronograma");
  };
  
  // Handle removing an event from the schedule
  const handleRemoveEvent = () => {
    if (!selectedCell) return;
    
    setScheduleCells(prev => {
      const updated = [...prev];
      
      // Find the original cell
      const cellIndex = updated.findIndex(c => 
        c.day.getDate() === selectedCell.day.getDate() && 
        c.day.getMonth() === selectedCell.day.getMonth() && 
        c.hour === selectedCell.hour
      );
      
      if (cellIndex !== -1 && updated[cellIndex].event) {
        const eventTitle = updated[cellIndex].event!.title;
        const eventDuration = updated[cellIndex].event!.endDate 
          ? Math.round((new Date(updated[cellIndex].event!.endDate).getTime() - new Date(updated[cellIndex].event!.date).getTime()) / 3600000)
          : 1;
        
        // Clear all cells occupied by this event
        for (let i = 0; i < eventDuration; i++) {
          const hourToCheck = selectedCell.hour + i;
          const cellToUpdateIndex = updated.findIndex(c => 
            c.day.getDate() === selectedCell.day.getDate() && 
            c.day.getMonth() === selectedCell.day.getMonth() && 
            c.hour === hourToCheck
          );
          
          if (cellToUpdateIndex !== -1 && updated[cellToUpdateIndex].event?.title === eventTitle) {
            updated[cellToUpdateIndex] = { 
              ...updated[cellToUpdateIndex], 
              event: undefined 
            };
          }
        }
      }
      
      return updated;
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
  
  // Check if a cell is part of a multi-hour event but not the first cell
  const isContinuationCell = (day: Date, hour: number) => {
    // Look for an event starting before this hour on the same day
    for (let h = hour - 1; h >= hours[0]; h--) {
      const prevCell = scheduleCells.find(c => 
        c.day.getDate() === day.getDate() && 
        c.day.getMonth() === day.getMonth() && 
        c.hour === h
      );
      
      if (prevCell?.event) {
        // Check if this previous event extends to current hour
        const startHour = prevCell.hour;
        const duration = prevCell.event.endDate 
          ? Math.round((new Date(prevCell.event.endDate).getTime() - new Date(prevCell.event.date).getTime()) / 3600000)
          : 1;
        
        if (startHour + duration > hour) {
          return {
            isContinuation: true,
            event: prevCell.event
          };
        }
      }
    }
    
    return {
      isContinuation: false,
      event: undefined
    };
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
            {hasExistingSchedule ? "Editar Cronograma Semanal" : "Crear Cronograma Semanal"}
          </h2>
        </div>
        <Button onClick={handleSaveSchedule} className="flex items-center gap-1">
          <Save className="h-4 w-4 mr-1" />
          Guardar Cronograma
        </Button>
      </div>
      
      {hasExistingSchedule && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Ya existe un cronograma semanal. Al guardar este cronograma, se reemplazará el anterior.
          </AlertDescription>
        </Alert>
      )}
      
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
                
                const continuationCheck = isContinuationCell(day, hour);
                const isPartOfEvent = cell?.event || continuationCheck.isContinuation;
                const eventToUse = cell?.event || continuationCheck.event;
                const eventColor = eventToUse ? getEventColor(eventToUse.eventType) : undefined;
                
                return (
                  <div 
                    key={dayIndex}
                    className={`
                      p-2 border-r last:border-r-0 h-16 relative
                      ${isPartOfEvent ? "" : "hover:bg-muted/20 cursor-pointer"}
                    `}
                    onClick={() => !isPartOfEvent && handleCellClick(day, hour)}
                  >
                    {isPartOfEvent ? (
                      <div 
                        className={`absolute inset-1 rounded p-1 flex flex-col ${continuationCheck.isContinuation ? "border-t-0 rounded-t-none" : "cursor-pointer"}`}
                        style={{
                          backgroundColor: `${eventColor}20`,
                          borderLeft: `3px solid ${eventColor}`,
                          color: eventColor
                        }}
                        onClick={e => {
                          if (!continuationCheck.isContinuation) {
                            e.stopPropagation();
                            handleCellClick(day, hour);
                          }
                        }}
                      >
                        {!continuationCheck.isContinuation && (
                          <>
                            <div className="text-xs font-medium truncate">{eventToUse?.title}</div>
                            <div className="text-xs opacity-80">Semanal</div>
                          </>
                        )}
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
