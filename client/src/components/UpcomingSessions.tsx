import { Badge } from "@/components/ui/badge";
import { BookingCalendar } from "@/components/BookingCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { AdminContentTabs } from "@/components/admin-ui/AdminContentTabs";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, List, User } from "lucide-react";
import { useState } from "react";

// (removed unused helper formatDateWithoutTimezoneIssues)

interface UpcomingSession {
  id: number;
  sessionDate: string;
  sessionTime: string;
  lessonType: string;
  parentName: string;
  athleteNames: string[];
  athletes: { id: number; firstName: string; lastName: string }[];
  focusAreas: string[];
  paymentStatus: string;
  attendanceStatus: string;
}

interface UpcomingSessionsProps {
  onBookingSelect?: (bookingId: number) => void;
}

export function UpcomingSessions({ onBookingSelect }: UpcomingSessionsProps = {}) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const { data: sessions = [], isLoading, error } = useQuery<UpcomingSession[]>({
    queryKey: ['/api/upcoming-sessions'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/upcoming-sessions");
      return response.json();
    },
  });

  // Helper to format date and time (combine separate date & time fields without timezone shifts)
  const formatSessionDateTime = (sessionDate: string, sessionTime: string): 'TBD' | { date: string; time: string } => {
    if (!sessionDate) return 'TBD';

    try {
      // Parse date components manually to avoid implicit UTC/local conversions on bare YYYY-MM-DD
      const [year, month, day] = sessionDate.split('-').map(Number);
      const dateOnly = new Date(year, (month || 1) - 1, day || 1);

      // If time is provided (HH:MM or HH:MM:SS), construct a Date including time for locale formatting
      let timeString = 'Time TBD';
      if (sessionTime && sessionTime !== 'TBD') {
        const [hhRaw, mmRaw] = sessionTime.split(':');
        const hours = Number(hhRaw);
        const minutes = Number(mmRaw);
        const dateWithTime = new Date(year, (month || 1) - 1, day || 1, hours, minutes);
        timeString = dateWithTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }

      return {
        date: dateOnly.toLocaleDateString('en-US', {
          month: 'short',
            day: 'numeric',
            year: 'numeric'
        }),
        time: timeString
      };
    } catch {
      return { date: 'Invalid Date', time: 'Invalid Time' };
    }
  };

  // Helper to get badge props for payment status
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'reservation-paid':
        return { variant: 'default' as const, className: 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0' };
      case 'session-paid':
        return { variant: 'default' as const, className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0' };
      case 'reservation-pending':
        return { variant: 'secondary' as const, className: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300' };
      default:
        return { variant: 'outline' as const, className: 'border-slate-300 text-slate-700' };
    }
  };

  // Helper to get badge props for attendance status
  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { variant: 'default' as const, className: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0' };
      case 'pending':
        return { variant: 'secondary' as const, className: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300' };
      case 'completed':
        return { variant: 'default' as const, className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0' };
      default:
        return { variant: 'outline' as const, className: 'border-slate-300 text-slate-700' };
    }
  };

  // Handle booking selection for the calendar view
  const handleBookingSelect = (bookingId: number) => {
    if (onBookingSelect) {
      onBookingSelect(bookingId);
    } else {
      // Fallback behavior when no callback is provided
      console.log(`Selected booking ID: ${bookingId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Modern Loading State */}
        <div className="border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md rounded-xl p-6 dark:bg-[#0F0276] dark:border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 dark:bg-[#D8BD2A]/10 rounded-lg">
              <Clock className="h-6 w-6 text-[#0F0276] dark:text-[#D8BD2A]" />
            </div>
            <h3 className="text-2xl font-black text-[#0F0276] tracking-tight dark:text-white">Upcoming Sessions</h3>
          </div>
          <p className="text-slate-600 dark:text-white">Loading session information...</p>
        </div>
        <Card className="rounded-2xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-white/10 dark:bg-white/10 dark:text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <img src="/CWT_Circle_LogoSPIN.png" alt="Loading" className="animate-spin h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="border border-red-200 bg-red-50 rounded-xl p-6">
          <h3 className="text-2xl font-black text-red-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            Upcoming Sessions
          </h3>
          <p className="text-red-600">Error loading session information</p>
        </div>
        <Card className="rounded-2xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-white/10 dark:bg-white/10 dark:text-white">
          <CardContent className="p-8">
            <div className="text-red-500 text-center">
              Error loading upcoming sessions. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convert sessions to calendar events format
  const calendarBookings = sessions.map((session) => ({
    id: session.id,
    preferred_date: session.sessionDate,
    preferred_time: session.sessionTime,
    lesson_type: session.lessonType,
    athlete_names: session.athleteNames.join(", "),
    focusAreas: session.focusAreas,
    payment_status: session.paymentStatus,
    attendance_status: session.attendanceStatus,
  }));

  return (
    <>
      {/* Header Section with Tabs */}
      <div className="border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md rounded-2xl p-6 dark:bg-white/10 dark:border-white/10 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div>
            <p className="text-slate-600 dark:text-white">View and manage scheduled sessions</p>
          </div>
          <Badge
            variant="secondary"
            className="bg-slate-100 text-[#0F0276] dark:text-white dark:bg-[#D8BD2A]/10 border-slate-200 dark:border-[#D8BD2A]/20 font-bold text-lg px-4 py-2 w-fit"
          >
            {sessions.length} sessions
          </Badge>
        </div>

        {/* View Mode Tabs */}
        <AdminContentTabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "list" | "calendar")}
          items={[
            {
              value: "list",
              label: "List View",
              icon: <List className="h-4 w-4 mr-2" />,
              activeGradient:
                "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white dark:data-[state=active]:from-[#D8BD2A] dark:data-[state=active]:to-[#D8BD2A] dark:data-[state=active]:text-[#0F0276]",
            },
            {
              value: "calendar",
              label: "Calendar View",
              icon: <Calendar className="h-4 w-4 mr-2" />,
              activeGradient:
                "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white dark:data-[state=active]:from-[#D8BD2A] dark:data-[state=active]:to-[#D8BD2A] dark:data-[state=active]:text-[#0F0276]",
            },
          ]}
          listClassName="bg-slate-100 dark:bg-slate-900/40 p-1 rounded-lg w-fit"
          triggerClassName="rounded-md border border-transparent data-[state=active]:shadow-sm data-[state=active]:border-blue-300 dark:data-[state=active]:border-[#D8BD2A] dark:border-white/20"
        />
      </div>

      {/* Session Content - sits directly on MainContentContainer */}
      {viewMode === "list" ? (
        sessions.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-white/10 dark:bg-white/10">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">No upcoming sessions scheduled</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">When you book sessions, they will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const formattedDateTime = formatSessionDateTime(session.sessionDate, session.sessionTime);
              return (
                <div
                  key={session.id}
                  className="rounded-2xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md hover:shadow-md transition-all duration-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                          <div className="p-4 md:p-5 flex flex-col md:flex-row justify-between gap-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-slate-100 dark:bg-white/15 rounded-lg">
                                    <Clock className="h-4 w-4 text-[#0F0276] dark:text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-[#0F0276] dark:text-white">
                                      {formattedDateTime !== "TBD" ? formattedDateTime.date : "Date TBD"}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-white/90">
                                      {formattedDateTime !== "TBD" ? formattedDateTime.time : "Time TBD"}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="border-slate-300 text-[#0F0276] bg-slate-50 dark:border-white/40 dark:text-white dark:bg-white/10 font-semibold"
                                >
                                  {session.lessonType.replace("-", " ").replace("min", "minute")}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-white/15 rounded-lg">
                                  <User className="h-4 w-4 text-[#0F0276] dark:text-white" />
                                </div>
                                <span className="font-semibold text-[#0F0276] dark:text-white">
                                  {session.athleteNames.join(", ") || "No athletes listed"}
                                </span>
                              </div>
                              {session.focusAreas && session.focusAreas.length > 0 && (
                                <div className="text-slate-600 dark:text-white/90 ml-11">
                                  <span className="font-medium">Focus Areas:</span> {session.focusAreas.join(", ")}
                                </div>
                              )}
                              <div className="text-slate-600 dark:text-white/90 ml-11">
                                <span className="font-medium">Parent:</span> {session.parentName}
                              </div>
                            </div>
                            <div className="flex flex-row lg:flex-col gap-3 lg:items-end">
                              <Badge {...getPaymentStatusBadge(session.paymentStatus)} className="font-semibold">
                                {session.paymentStatus.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Badge>
                              <Badge {...getAttendanceStatusBadge(session.attendanceStatus)} className="font-semibold">
                                {session.attendanceStatus.charAt(0).toUpperCase() + session.attendanceStatus.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-white/10 dark:bg-white/10 dark:text-white p-6">
                  <div className="h-[600px]">
                    <BookingCalendar bookings={calendarBookings} onBookingSelect={handleBookingSelect} />
                  </div>
                </div>
              )}
    </>
  );
}
