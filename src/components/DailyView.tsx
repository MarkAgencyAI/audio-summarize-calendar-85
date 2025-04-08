
import { useState } from "react";
import { format, addHours, startOfDay, isSameHour, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/components/Calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface DailyViewProps {
  date: Date;
  events: CalendarEvent[];
  onBack: () => void;
  onTimeSelect: (time: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function DailyView({
  date,
  events,
  onBack,
  onTimeSelect,
  onEventClick
}: DailyViewProps) {
  const isMobile = useIsMobile();
  const dayEvents = events.filter(event => 
    format(parseISO(event.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
  );
  
  // Generate time slots from 7:00 AM to 9:00 PM
  const startTime = 7; // 7 AM
  const endTime = 21; // 9 PM
  
  const timeSlots = Array.from({ length: endTime - startTime + 1 }, (_, i) => {
    const slotTime = addHours(startOfDay(date), startTime + i);
    const slotEvents = dayEvents.filter(event => 
      isSameHour(parseISO(event.date), slotTime)
    );
    
    return {
      time: slotTime,
      events: slotEvents
    };
  });

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h2 className="text-xl font-semibold text-[#005c5f] dark:text-white">
            {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </h2>
        </div>
      </div>
      
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-2">
          {timeSlots.map((slot, index) => (
            <div 
              key={index}
              className="flex items-start border-l-2 border-primary/20 pl-2 py-2 group hover:bg-primary/5 rounded-r-md"
            >
              <div className="w-16 flex-shrink-0 text-sm text-muted-foreground">
                {format(slot.time, "HH:mm")}
              </div>
              
              <div className="flex-1 min-h-[60px] relative">
                {slot.events.length > 0 ? (
                  <div className="space-y-1 w-full">
                    {slot.events.map(event => (
                      <div 
                        key={event.id}
                        className="bg-primary/10 text-primary p-2 rounded-md cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => onEventClick(event)}
                      >
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-xs truncate">
                          {format(parseISO(event.date), "HH:mm")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div 
                    className="w-full h-full min-h-[60px] cursor-pointer flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onTimeSelect(slot.time)}
                  >
                    <Button variant="ghost" size="sm" className="h-6">
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar evento
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
