import { useState, useMemo, useEffect, useCallback } from "react";
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addDays, parseISO, setHours, setMinutes, addHours, addWeeks, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, FolderPlus, Calendar as CalendarIcon, Filter, GraduationCap, Award, Book, Briefcase, Clock, Star, FileText, LayoutGrid, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRecordings } from "@/context/RecordingsContext";
import { DailyView } from "@/components/DailyView";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WeeklySchedule } from "@/components/WeeklySchedule";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  color?: string;
  folderId?: string;
  eventType?: string;
  repeat?: "none" | "daily" | "weekly" | "monthly";
}

export const eventTypeColors: Record<string, string> = {
  "Examen Parcial": "#F97316",
  "Examen Final": "#ef4444",
  "Trabajo Práctico": "#8B5CF6",
  "Tarea": "#0EA5E9",
  "Actividad": "#10b981",
  "Consulta": "#D946EF",
  "Clase Especial": "#f59e0b",
  "Otro": "#6b7280",
};

interface CalendarProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, "id">) => void;
  onDeleteEvent: (id: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function Calendar({
  events,
  onAddEvent,
  onDeleteEvent,
  activeFilter,
  onFilterChange
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    folderId: "",
    eventType: "",
    repeat: "none" as "none" | "daily" | "weekly" | "monthly"
  });
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#3b82f6");
  const [showDailyView, setShowDailyView] = useState(false);
  const [dailyViewDate, setDailyViewDate] = useState<Date | null>(null);
  const [showWeeklySchedule, setShowWeeklySchedule] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deleteAllRecurring, setDeleteAllRecurring] = useState(false);
  const [hasSchedule, setHasSchedule] = useState(false);

  const isMobile = useIsMobile();
  const { folders, addFolder } = useRecordings();

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

  useEffect(() => {
    const scheduleExists = events.some(event => 
      event.eventType === "Cronograma" && event.repeat === "weekly"
    );
    setHasSchedule(scheduleExists);
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") {
      return events;
    } else if (activeFilter === "cronograma") {
      return events.filter(event => event.eventType === "Cronograma");
    }
    return events.filter(event => 
      event.eventType === activeFilter || (!event.eventType && activeFilter === "otro")
    );
  }, [events, activeFilter]);

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
    filteredEvents.forEach(event => {
      const dateKey = format(parseISO(event.date), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  const handleDateClick = (date: Date) => {
    setDailyViewDate(date);
    setShowDailyView(true);
  };

  const handleTimeSelect = (time: Date) => {
    const endTime = addHours(time, 1);
    setSelectedDate(time);
    setNewEvent({
      title: "",
      description: "",
      date: format(time, "yyyy-MM-dd'T'HH:mm"),
      endDate: format(endTime, "yyyy-MM-dd'T'HH:mm"),
      folderId: "",
      eventType: "",
      repeat: "none"
    });
    setShowEventDialog(true);
  };

  const handleBackToMonth = () => {
    setShowDailyView(false);
    setDailyViewDate(null);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    
    if (newEvent.endDate && new Date(newEvent.endDate) <= new Date(newEvent.date)) {
      toast.error("La hora de finalización debe ser posterior a la hora de inicio");
      return;
    }
    
    if (newEvent.repeat !== "none") {
      createRepeatingEvents();
    } else {
      onAddEvent({
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        endDate: newEvent.endDate || undefined,
        folderId: newEvent.folderId || undefined,
        eventType: newEvent.eventType || undefined,
        repeat: newEvent.repeat
      });
      
      toast.success("Evento agregado");
    }
    
    setShowEventDialog(false);
  };

  const createRepeatingEvents = () => {
    const baseEvent = {
      title: newEvent.title,
      description: newEvent.description,
      folderId: newEvent.folderId || undefined,
      eventType: newEvent.eventType || undefined,
      repeat: newEvent.repeat
    };
    
    onAddEvent({
      ...baseEvent,
      date: newEvent.date,
      endDate: newEvent.endDate || undefined
    });
    
    const startDate = new Date(newEvent.date);
    const endDate = newEvent.endDate ? new Date(newEvent.endDate) : undefined;
    const duration = endDate ? endDate.getTime() - startDate.getTime() : 3600000;
    
    for (let i = 1; i <= 10; i++) {
      let nextDate = new Date(startDate);
      
      if (newEvent.repeat === "daily") {
        nextDate = addDays(startDate, i);
      } else if (newEvent.repeat === "weekly") {
        nextDate = addWeeks(startDate, i);
      } else if (newEvent.repeat === "monthly") {
        nextDate = new Date(startDate);
        nextDate.setMonth(nextDate.getMonth() + i);
      }
      
      const nextEndDate = endDate ? new Date(nextDate.getTime() + duration) : undefined;
      
      onAddEvent({
        ...baseEvent,
        date: nextDate.toISOString(),
        endDate: nextEndDate?.toISOString()
      });
    }
    
    toast.success(`Se han creado eventos repetitivos (${newEvent.repeat})`);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      if (selectedEvent.repeat && selectedEvent.repeat !== "none") {
        setShowDeleteConfirmDialog(true);
      } else {
        onDeleteEvent(selectedEvent.id);
        toast.success("Evento eliminado");
        setSelectedEvent(null);
      }
    }
  };

  const confirmDeleteEvent = () => {
    if (!selectedEvent) return;
    
    if (deleteAllRecurring) {
      const eventsToDelete = events.filter(event => 
        event.title === selectedEvent.title && 
        event.eventType === selectedEvent.eventType &&
        event.repeat === selectedEvent.repeat
      );
      
      eventsToDelete.forEach(event => {
        onDeleteEvent(event.id);
      });
      
      toast.success("Se eliminaron todos los eventos recurrentes");
    } else {
      onDeleteEvent(selectedEvent.id);
      toast.success("Evento eliminado");
    }
    
    setShowDeleteConfirmDialog(false);
    setSelectedEvent(null);
    setDeleteAllRecurring(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("El nombre de la materia es obligatorio");
      return;
    }
    
    addFolder(newFolderName, newFolderColor);
    
    setTimeout(() => {
      const newFolder = folders[folders.length - 1];
      if (newFolder) {
        setNewEvent({
          ...newEvent,
          folderId: newFolder.id
        });
      }
    }, 100);
    
    toast.success("Materia creada");
    setNewFolderName("");
    setNewFolderColor("#3b82f6");
    setShowNewFolderDialog(false);
  };

  const handleCreateWeeklySchedule = (weeklyEvents: Omit<CalendarEvent, "id">[]) => {
    if (weeklyEvents.length === 0) {
      toast.error("No hay eventos en el cronograma");
      return;
    }
    
    if (hasSchedule) {
      const scheduleEvents = events.filter(event => 
        event.eventType === "Cronograma" && event.repeat === "weekly"
      );
      
      scheduleEvents.forEach(event => {
        onDeleteEvent(event.id);
      });
    }
    
    weeklyEvents.forEach(event => {
      onAddEvent({
        ...event,
        eventType: "Cronograma",
        repeat: "weekly"
      });
    });
    
    setShowWeeklySchedule(false);
    setHasSchedule(true);
    toast.success("Cronograma semanal guardado");
  };

  const getDayNames = () => {
    if (isMobile) {
      return ["D", "L", "M", "X", "J", "V", "S"];
    }
    return ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  };

  const getFolderName = (folderId?: string) => {
    if (!folderId) return "Sin materia";
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : "Sin materia";
  };

  const getEventIcon = (eventType: string) => {
    switch(eventType) {
      case 'Examen Parcial':
      case 'Examen Final':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'Trabajo Práctico':
        return <Book className="h-4 w-4 mr-2" />;
      case 'Tarea':
        return <Briefcase className="h-4 w-4 mr-2" />;
      case 'Actividad':
        return <Star className="h-4 w-4 mr-2" />;
      case 'Consulta':
        return <Clock className="h-4 w-4 mr-2" />;
      case 'Clase Especial':
        return <GraduationCap className="h-4 w-4 mr-2" />;
      case 'Cronograma':
        return <LayoutGrid className="h-4 w-4 mr-2" />;
      default:
        return <CalendarIcon className="h-4 w-4 mr-2" />;
    }
  };

  const getEventColor = (eventType?: string) => {
    if (!eventType) return "#6b7280";
    if (eventType === "Cronograma") return "#3b82f6";
    return eventTypeColors[eventType] || "#6b7280";
  };

  return (
    <div className="w-full">
      {showWeeklySchedule ? (
        <WeeklySchedule 
          date={currentDate}
          onSave={handleCreateWeeklySchedule}
          onCancel={() => setShowWeeklySchedule(false)}
          hasExistingSchedule={hasSchedule}
          existingEvents={events}
        />
      ) : showDailyView && dailyViewDate ? (
        <DailyView 
          date={dailyViewDate}
          events={events}
          onBack={handleBackToMonth}
          onTimeSelect={handleTimeSelect}
          onEventClick={handleEventClick}
          activeFilter={activeFilter}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-xl md:text-2xl font-semibold text-[#005c5f] dark:text-white truncate">
              {format(currentDate, "MMMM yyyy", {
                locale: es
              })}
            </h2>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowWeeklySchedule(true)}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {hasSchedule ? "Editar Cronograma" : "Crear Cronograma"}
                </span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {activeFilter === "all" ? "Todos los eventos" : 
                       activeFilter === "otro" ? "Otros eventos" : 
                       activeFilter === "cronograma" ? "Cronograma" : activeFilter}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => onFilterChange("all")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>Todos los eventos</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => onFilterChange("cronograma")}
                      className={activeFilter === "cronograma" ? "bg-primary/10" : ""}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      <Badge 
                        style={{backgroundColor: "#3b82f6"}} 
                        className="h-2 w-2 p-0 rounded-full mr-1"
                      />
                      <span>Cronograma</span>
                    </DropdownMenuItem>
                    
                    {eventTypes.map(type => (
                      <DropdownMenuItem 
                        key={type} 
                        onClick={() => onFilterChange(type)}
                        className={activeFilter === type ? "bg-primary/10" : ""}
                      >
                        <div className="flex items-center gap-2">
                          {getEventIcon(type)}
                          <Badge 
                            style={{backgroundColor: getEventColor(type)}} 
                            className="h-2 w-2 p-0 rounded-full mr-1"
                          />
                          <span>{type}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="calendar-container w-full overflow-hidden">
            <div className="calendar-grid-container min-w-full">
              <div className="calendar-grid mb-1">
                {getDayNames().map(day => 
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
                        {dayEvents.map(event => (
                          <div 
                            key={event.id} 
                            className="calendar-event hover:bg-primary/20 flex items-center gap-1" 
                            style={{
                              backgroundColor: `${getEventColor(event.eventType)}20`,
                              color: getEventColor(event.eventType)
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                          >
                            {event.repeat && event.repeat !== "none" && (
                              <RotateCcw className="h-3 w-3 flex-shrink-0" />
                            )}
                            <span className="truncate text-xs">{event.title}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="absolute bottom-1 right-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 opacity-0 hover:opacity-100 bg-muted/50 hover:bg-muted" 
                          onClick={e => {
                            e.stopPropagation();
                            const now = new Date();
                            const selectedTime = setMinutes(setHours(day, now.getHours()), 0);
                            handleTimeSelect(selectedTime);
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
        </>
      )}
      
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Agregar evento</DialogTitle>
            <DialogDescription>Completa los detalles para crear un nuevo evento</DialogDescription>
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
              <Label htmlFor="folder">Materia</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
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
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowNewFolderDialog(true)}
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
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
                      <div className="flex items-center gap-2">
                        <Badge 
                          style={{backgroundColor: getEventColor(type)}} 
                          className="h-2 w-2 p-0 rounded-full"
                        />
                        {type}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            
            <div className="space-y-2">
              <Label>Repetición</Label>
              <RadioGroup 
                value={newEvent.repeat} 
                onValueChange={(value: "none" | "daily" | "weekly" | "monthly") => 
                  setNewEvent({
                    ...newEvent,
                    repeat: value
                  })
                }
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none">Sin repetición</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily">Todos los días</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly">Todas las semanas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly">Todos los meses</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddEvent}>Guardar evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nueva materia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Nombre</Label>
              <Input 
                id="folderName" 
                value={newFolderName} 
                onChange={e => setNewFolderName(e.target.value)} 
                placeholder="Nombre de la materia"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folderColor">Color</Label>
              <div className="flex items-center">
                <input 
                  id="folderColor"
                  type="color"
                  className="border border-gray-300 dark:border-gray-700 p-2 rounded w-16 h-10" 
                  value={newFolderColor} 
                  onChange={e => setNewFolderColor(e.target.value)} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateFolder}>Crear materia</Button>
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
              <p className="text-sm text-muted-foreground mb-1">
                {format(parseISO(selectedEvent.date), "PPP", { locale: es })}
              </p>
              
              <p className="text-sm text-muted-foreground mb-3">
                {format(parseISO(selectedEvent.date), "HH:mm")} 
                {selectedEvent.endDate && ` - ${format(parseISO(selectedEvent.endDate), "HH:mm")}`}
              </p>
              
              {selectedEvent.eventType && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Tipo:</span>
                  <Badge 
                    style={{backgroundColor: getEventColor(selectedEvent.eventType)}}
                    className="text-white"
                  >
                    {selectedEvent.eventType}
                  </Badge>
                </div>
              )}
              
              {selectedEvent.repeat && selectedEvent.repeat !== "none" && (
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Repetición: {
                    selectedEvent.repeat === "daily" ? "Diaria" :
                    selectedEvent.repeat === "weekly" ? "Semanal" : "Mensual"
                  }
                </p>
              )}
              
              {selectedEvent.folderId && (
                <p className="text-sm font-medium mb-3">
                  Materia: {getFolderName(selectedEvent.folderId)}
                </p>
              )}
              
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
      
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar evento recurrente</DialogTitle>
            <DialogDescription>
              Este es un evento que se repite. ¿Desea eliminar solo esta instancia o todos los eventos de la serie?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup 
              value={deleteAllRecurring ? "all" : "single"} 
              onValueChange={(value) => setDeleteAllRecurring(value === "all")}
              className="flex flex-col space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="delete-single" />
                <Label htmlFor="delete-single">Solo esta instancia</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="delete-all" />
                <Label htmlFor="delete-all">Todos los eventos recurrentes</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirmDialog(false);
                setSelectedEvent(null);
                setDeleteAllRecurring(false);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteEvent}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
