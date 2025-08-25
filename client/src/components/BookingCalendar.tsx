import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addHours, format, parseISO } from 'date-fns';
import { X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar } from 'react-big-calendar';

// Default localizer using date-fns
import * as dates from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { dateFnsLocalizer } from 'react-big-calendar';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse: parseISO,
  startOfWeek: (date: Date) => {
    return dates.startOfWeek(date);
  },
  getDay: (date: Date) => dates.getDay(date),
  locales,
});

// Type definitions
type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  bookingId: number;
  status: string;
  lessonType: string;
  athleteNames: string;
  color?: string;
};

type BookingCalendarProps = {
  bookings: any[];
  onBookingSelect: (bookingId: number) => void;
};

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookings,
  onBookingSelect,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateEvents, setDateEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState('month');

  // Log booking data for debugging
  useEffect(() => {
    if (bookings && bookings.length > 0) {
      console.log('Calendar received bookings:', bookings.length);
      
      // Check the first booking to see what fields are available
      const sampleBooking = bookings[0];
      console.log('Sample booking structure:', {
        id: sampleBooking.id,
        preferredDate: sampleBooking.preferredDate || sampleBooking.preferred_date,
        preferredTime: sampleBooking.preferredTime || sampleBooking.preferred_time,
        lessonType: sampleBooking.lessonType?.name || sampleBooking.lesson_type,
        athletes: sampleBooking.athletes?.length ? `${sampleBooking.athletes.length} athletes` : 'No athlete array',
        athlete1Name: sampleBooking.athlete1Name,
        status: sampleBooking.attendanceStatus || sampleBooking.attendance_status || sampleBooking.status
      });
    }
  }, [bookings]);

  // Convert bookings to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    if (!bookings) return [];

    return bookings.map((booking) => {
      // Parse the preferred date and time
      const preferredDate = booking.preferredDate || booking.preferred_date;
      const preferredTime = booking.preferredTime || booking.preferred_time;
      
      if (!preferredDate || !preferredTime) {
        console.warn(`Booking ${booking.id} missing date/time:`, { preferredDate, preferredTime });
        return null;
      }
      
      const dateTimeStr = `${preferredDate}T${preferredTime}`;
      let start;
      try {
        start = parseISO(dateTimeStr);
        
        // Check if date is valid
        if (isNaN(start.getTime())) {
          console.warn(`Invalid date/time for booking ${booking.id}:`, dateTimeStr);
          return null;
        }
      } catch (error) {
        console.error(`Error parsing date for booking ${booking.id}:`, error);
        return null;
      }
      
      // Get lesson duration from lessonType if available, or default to 1 hour
      const duration = booking.lessonType?.duration || 
                       (booking.duration ? parseFloat(booking.duration) : 1);
      
      const end = addHours(start, duration);
      
      // Get lesson type name and athlete names
      const lessonTypeName = booking.lessonType?.name || 
                           booking.lessonTypeName || 
                           booking.lesson_type || 
                           'Unknown Lesson';
      
      // Generate athlete names string from athletes array or use provided value
      let athleteNames = '';
      if (booking.athletes && booking.athletes.length > 0) {
        athleteNames = booking.athletes.map((a: any) => a.name).join(', ');
      } else if (booking.athlete1Name) {
        athleteNames = booking.athlete2Name 
          ? `${booking.athlete1Name}, ${booking.athlete2Name}` 
          : booking.athlete1Name;
      } else {
        athleteNames = booking.athlete_names || 'No athletes';
      }
      
      const title = `${lessonTypeName} - ${athleteNames}`;
      
  // Set color based on status
  let color;
      const paymentStatus = booking.paymentStatus || booking.payment_status;
      const attendanceStatus = booking.attendanceStatus || booking.attendance_status;
      
      // Status-based coloring (ensure contrast and brand rules: blue -> white/yellow text)
      if (attendanceStatus === 'completed') {
        // success
        color = 'bg-emerald-100 border-emerald-300 dark:bg-emerald-600/40 dark:border-emerald-400';
      } else if (attendanceStatus === 'no-show') {
        // error
        color = 'bg-red-100 border-red-300 dark:bg-red-600/40 dark:border-red-400';
      } else if (attendanceStatus === 'cancelled') {
        // neutral/disabled
        color = 'bg-gray-100 border-gray-300 dark:bg-gray-600/40 dark:border-gray-400';
      } else if (paymentStatus === 'reservation-paid' || paymentStatus === 'session-paid') {
        // paid/reserved
        color = 'bg-blue-600/20 border-blue-400 dark:bg-blue-500/40 dark:border-blue-400';
      } else {
        // pending/unpaid
        color = 'bg-amber-100 border-amber-300 dark:bg-amber-500/40 dark:border-amber-400';
      }

      return {
        id: booking.id,
        title,
        start,
        end,
        bookingId: booking.id,
        status: attendanceStatus || booking.status || 'Unknown',
        lessonType: lessonTypeName,
        athleteNames,
        color,
      } as CalendarEvent;
    }).filter((event): event is CalendarEvent => event !== null); // Filter out null events
  }, [bookings]);

  // Handle event click
  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      onBookingSelect(event.bookingId);
    },
    [onBookingSelect]
  );

  // Handle date cell click
  const handleDateClick = useCallback(
    ({ start }: { start: Date }) => {
      // Filter events for the clicked date
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(start);
      endDate.setHours(23, 59, 59, 999);
      
      const filteredEvents = events
        .filter((event): event is CalendarEvent => event !== null)
        .filter((event) => event.start >= startDate && event.start <= endDate);
      
      setSelectedDate(start);
      setDateEvents(filteredEvents);
    },
    [events]
  );

  // Handle view change
  const handleViewChange = useCallback((newView: string) => {
    setView(newView);
  }, []);

  // Custom event component to show colored events
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    // Define status-specific styles
    let statusClass = '';
    let statusIcon = '';
    
    switch(event.status) {
      case 'completed':
        statusClass = 'text-green-700';
        statusIcon = '✓';
        break;
      case 'cancelled':
        statusClass = 'text-gray-500 line-through';
        statusIcon = '✗';
        break;
      case 'no-show':
        statusClass = 'text-red-700';
        statusIcon = '⊘';
        break;
      default:
        statusClass = '';
        statusIcon = '';
    }
    
    return (
      <div
        className={`rounded p-1 ${event.color || 'bg-blue-600/20 border-blue-400 dark:bg-blue-500/40 dark:border-blue-400'} border`}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={`${event.title} - ${event.status}`}
      >
        <span className={`text-xs font-medium ${statusClass || 'text-slate-900 dark:text-white'}`}>
          {format(event.start, 'h:mm a')} - {event.title}
          {statusIcon && <span className="ml-1 font-bold">{statusIcon}</span>}
        </span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col dark:text-white">
      {/* Add CSS for React Big Calendar scrolling */}
      <style>{`
        .rbc-time-content {
          overflow-y: auto !important;
          max-height: 600px;
        }
        .rbc-time-view {
          overflow: hidden;
        }
        .rbc-time-view .rbc-time-content {
          flex: 1;
        }
        /* Dark mode tweaks for react-big-calendar */
        :root.dark .rbc-month-view, :root.dark .rbc-time-view, :root.dark .rbc-agenda-view {
          background-color: rgba(15, 2, 118, 0.85);
          color: white;
        }
        :root.dark .rbc-header, :root.dark .rbc-time-header, :root.dark .rbc-time-content, :root.dark .rbc-day-bg, :root.dark .rbc-timeslot-group {
          border-color: rgba(255,255,255,0.2);
        }
        :root.dark .rbc-off-range-bg { background-color: rgba(255,255,255,0.05); }
        :root.dark .rbc-today { background-color: rgba(216,189,42,0.15); }
        /* Let our custom event component control colors; make wrapper transparent in dark */
        :root.dark .rbc-event { background: transparent; }
        :root.dark .rbc-event-label { color: #fff; }
        :root.dark .rbc-slot-selection { background: rgba(216,189,42,0.25); }
        :root.dark .rbc-toolbar button { color: #fff; border-color: rgba(255,255,255,0.4); }
        :root.dark .rbc-toolbar button.rbc-active, :root.dark .rbc-toolbar button:active {
          background-color: #D8BD2A !important;
          color: #0F0276 !important;
          border-color: #D8BD2A !important;
        }
        .rbc-toolbar button.rbc-active, .rbc-toolbar button:active {
          background-color: #D8BD2A !important;
          color: #0F0276 !important;
          border-color: #D8BD2A !important;
        }
      `}</style>
      <div className="flex-1 relative">
        <div className="h-full overflow-y-auto">
          <Calendar
            localizer={localizer}
            events={events.filter((event): event is CalendarEvent => event !== null)}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%', minHeight: '600px' }}
            views={{ month: true, week: true, day: true }}
            view={view as any}
            onView={handleViewChange as any}
            onSelectEvent={handleEventClick}
            onSelectSlot={handleDateClick}
            selectable
            popup
            components={{
              event: EventComponent,
            }}
          />
        </div>
        {selectedDate && dateEvents.length > 0 && (
          <div className="absolute bottom-4 right-4 w-72 shadow-xl rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-[#0F0276]/80 backdrop-blur-md glass-surface glass-card z-10 text-slate-900 dark:text-white">
            <Card>
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-medium">
                  {format(selectedDate, 'MMMM d, yyyy')} ({dateEvents.length} bookings)
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setSelectedDate(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-0">
                <ScrollArea className="h-64 p-3">
                  <div className="space-y-2">
                    {dateEvents.map((event) => (
                      <div 
                        key={event.id}
                        className="border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{format(event.start, 'h:mm a')}</p>
                          <Badge 
                            variant="outline" 
                            className={
                              event.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : 
                              event.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              event.status === 'cancelled' ? 'bg-gray-100 text-gray-500 border-gray-200 line-through' :
                              event.status === 'no-show' ? 'bg-red-100 text-red-800 border-red-200' :
                              'bg-amber-100 text-amber-800 border-amber-200'
                            }
                          >
                            {event.status === 'completed' ? `${event.status} ✓` : 
                             event.status === 'cancelled' ? `${event.status} ✗` : 
                             event.status === 'no-show' ? `${event.status} ⊘` : 
                             event.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.lessonType}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export { BookingCalendar };
