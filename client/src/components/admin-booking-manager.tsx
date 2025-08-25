// Pricing now resolved via lesson_types hook inside component
import { BookingCalendar } from "@/components/BookingCalendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminButton } from "@/components/admin-ui/AdminButton";
import { AdminModal } from "@/components/admin-ui/AdminModal";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminContentTabs } from "@/components/admin-ui/AdminContentTabs";
import { Textarea } from "@/components/ui/textarea";
import { UnifiedBookingModal } from "@/components/UnifiedBookingModal";
import { useToast } from "@/hooks/use-toast";
import { useAvailableTimes } from "@/hooks/useAvailableTimes";
import { useGenders } from "@/hooks/useGenders";
import { GYMNASTICS_EVENTS } from "@/lib/constants";
import { useLessonTypes } from "@/hooks/useLessonTypes";
import { calculateAge } from "@/lib/dateUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Booking } from "@shared/schema";
import { AttendanceStatusEnum, BookingStatusEnum, PaymentStatusEnum } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Calendar, CheckCircle, CheckCircle2, Clock, Eye, FileCheck, FileText, FileX, Filter, HelpCircle, Mail, Medal, Phone, Plus, Shield, Target, User, Users, X, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminBookingDetailActions } from "./admin-booking-detail-actions";
import { BookingDetailsModal } from "./modals/BookingDetailsModal";
import { BookingEditModal } from "./BookingEditModal";

// Helper function to get status badge variant and color
export const getStatusBadgeProps = (status: string): { variant: "default" | "secondary" | "destructive" | "outline"; className?: string } => {
  switch (status) {
    case "pending":
      return { variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" };
    case "paid":
  // Blue background must have white or yellow text per brand rule
  return { variant: "default", className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:brightness-110" };
    case "confirmed":
      return { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-200" };
    case "manual":
      return { variant: "outline", className: "bg-gray-100 text-gray-800 hover:bg-gray-200" };
    case "manual-paid":
      return { variant: "default", className: "bg-lime-100 text-lime-800 hover:bg-lime-200" };
    case "completed":
      return { variant: "default", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" };
    case "no-show":
      return { variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-200" };
    case "failed":
      return { variant: "destructive", className: "bg-red-200 text-red-900 hover:bg-red-300" };
    case "cancelled":
      return { variant: "outline", className: "bg-gray-50 text-gray-500 hover:bg-gray-100 line-through" };
    default:
      return { variant: "outline" };
  }
};

// Enhanced helper function for payment status with automatic status support
export const getPaymentStatusBadgeProps = (status: string): { 
  variant: "default" | "secondary" | "destructive" | "outline"; 
  className?: string; 
  icon?: React.ReactNode;
  text?: string;
} => {
  switch (status) {
    case "reservation-pending":
      return { 
        variant: "outline", 
        className: "border-yellow-300 text-yellow-700 bg-yellow-50",
        icon: <Clock className="h-3 w-3" />,
        text: "Payment Pending"
      };
    case "reservation-paid":
      return { 
        variant: "outline", 
        className: "border-green-300 text-green-700 bg-green-50",
        icon: <CheckCircle className="h-3 w-3" />,
        text: "Paid ✓"
      };
    case "session-paid":
      return { 
        variant: "outline", 
        className: "border-green-300 text-green-700 bg-green-50",
        icon: <CheckCircle className="h-3 w-3" />,
        text: "Full Payment ✓"
      };
    case "reservation-failed":
      return { 
        variant: "outline", 
        className: "border-red-300 text-red-700 bg-red-50",
        icon: <XCircle className="h-3 w-3" />,
        text: "Payment Failed"
      };
    case "reservation-expired":
      return { 
        variant: "outline", 
        className: "border-gray-300 text-gray-700 bg-gray-50",
        icon: <Clock className="h-3 w-3" />,
        text: "Expired"
      };
    case "unpaid":
      return { 
        variant: "outline", 
        className: "border-orange-300 text-orange-700 bg-orange-50",
        icon: <AlertCircle className="h-3 w-3" />,
        text: "Unpaid"
      };
    case "paid": // Legacy status
      return { 
        variant: "outline", 
        className: "border-green-300 text-green-700 bg-green-50",
        icon: <CheckCircle className="h-3 w-3" />,
        text: "Paid ✓"
      };
    case "failed": // Legacy status
      return { 
        variant: "outline", 
        className: "border-red-300 text-red-700 bg-red-50",
        icon: <XCircle className="h-3 w-3" />,
        text: "Failed"
      };
    case "refunded":
      return { 
        variant: "outline", 
        className: "border-gray-300 text-gray-700 bg-gray-50",
        icon: <X className="h-3 w-3" />,
        text: "Refunded"
      };
    default:
      return { 
        variant: "outline", 
        className: "border-gray-300 text-gray-700 bg-gray-50",
        icon: <HelpCircle className="h-3 w-3" />,
        text: status || "Unknown"
      };
  }
};

// Enhanced helper function for attendance status with automatic status support
export const getAttendanceStatusBadgeProps = (status: string): { 
  variant: "default" | "secondary" | "destructive" | "outline"; 
  className?: string; 
  icon?: React.ReactNode;
  text?: string;
} => {
  switch (status) {
    case "pending":
      return { 
        variant: "default", 
        className: "bg-blue-500 text-white border-blue-600",
        icon: <Clock className="h-3 w-3" />,
        text: "Scheduled"
      };
    case "confirmed":
      return { 
        variant: "outline", 
        className: "border-green-300 text-green-700 bg-green-50",
        icon: <CheckCircle className="h-3 w-3" />,
        text: "Confirmed ✓"
      };
    case "completed":
      return { 
        variant: "outline", 
        className: "border-green-300 text-green-700 bg-green-50",
        icon: <CheckCircle2 className="h-3 w-3" />,
        text: "Completed ✓"
      };
    case "no-show":
      return { 
        variant: "outline", 
        className: "border-red-300 text-red-700 bg-red-50",
        icon: <XCircle className="h-3 w-3" />,
        text: "No Show"
      };
    case "cancelled":
      return { 
        variant: "outline", 
        className: "border-gray-300 text-gray-700 bg-gray-50",
        icon: <X className="h-3 w-3" />,
        text: "Cancelled"
      };
    case "manual":
      return { 
        variant: "default", 
        className: "bg-blue-500 text-white border-blue-600",
        icon: <User className="h-3 w-3" />,
        text: "Manual Entry"
      };
    default:
      return { 
        variant: "outline", 
        className: "border-gray-300 text-gray-700 bg-gray-50",
        icon: <HelpCircle className="h-3 w-3" />,
        text: status || "Pending"
      };
  }
};

// Enhanced helper function for waiver status
export const getWaiverStatusBadgeProps = (waiverSigned: boolean): { 
  variant: "default" | "secondary" | "destructive" | "outline"; 
  className?: string; 
  icon?: React.ReactNode;
  text?: string;
} => {
  if (waiverSigned) {
    return { 
      variant: "outline", 
      className: "border-green-300 text-green-700 bg-green-50",
      icon: <FileCheck className="h-3 w-3" />,
      text: "Waiver Signed ✓"
    };
  } else {
    return { 
      variant: "outline", 
      className: "border-orange-300 text-orange-700 bg-orange-50",
      icon: <FileX className="h-3 w-3" />,
      text: "Waiver Required"
    };
  }
};

// AdminRescheduleForm component
function AdminRescheduleForm({ booking, onSubmit, onCancel }: { 
  booking: Booking; 
  onSubmit: (date: string, time: string) => void; 
  onCancel: () => void 
}) {
  const [selectedDate, setSelectedDate] = useState(booking.preferredDate);
  const [selectedTime, setSelectedTime] = useState('');

  const { data: availableSlots = [], isLoading: slotsLoading } = useAvailableTimes(
    selectedDate || '',
    booking.lessonType || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate && selectedTime) {
      onSubmit(selectedDate, selectedTime);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-gray-600">
          Reschedule lesson for {booking.athlete1Name}
          {booking.athlete2Name && ` & ${booking.athlete2Name}`}
        </p>
        <p className="text-sm text-gray-600">
          Current: {booking.preferredDate} at {booking.preferredTime}
        </p>
      </div>

      <div>
        <Label htmlFor="reschedule-date">New Date</Label>
        <Input
          id="reschedule-date"
          type="date"
          value={selectedDate || ''}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedTime(''); // Reset time when date changes
          }}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div>
        <Label htmlFor="reschedule-time">New Time</Label>
        <Select
          value={selectedTime}
          onValueChange={setSelectedTime}
          disabled={!selectedDate || slotsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={slotsLoading ? "Loading times..." : "Select a time"} />
          </SelectTrigger>
          <SelectContent>
            {availableSlots.length > 0 ? (
              availableSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-slots" disabled>
                No available times for this date
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="border-slate-200/60 bg-white/80 hover:bg-white/90 dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/30 dark:hover:bg-[#0F0276]/50 backdrop-blur-sm transition-all duration-200 rounded-xl px-6 py-3 font-semibold"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!selectedDate || !selectedTime}
          className="bg-gradient-to-r from-[#0F0276] to-[#0F0276]/90 hover:from-[#0F0276]/90 hover:to-[#0F0276] border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-semibold"
        >
          Reschedule
        </Button>
      </div>
    </form>
  );
}

interface ManualBookingFormData {
  lessonType: string;
  athlete1Name: string;
  athlete1Age: number;
  athlete1Experience: string;
  athlete1Gender?: string;
  athlete2Name?: string;
  athlete2Age?: number;
  athlete2Experience?: string;
  athlete2Gender?: string;
  preferredDate: string;
  preferredTime: string;
  focusAreas: string[];
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies1?: string;
  allergies2?: string;
  amount: string;
  bookingMethod: string;
  adminNotes?: string;
  isNewAthlete?: boolean;
  selectedAthletes?: number[]; // Added for existing athlete selection
}



interface AdminBookingManagerProps {
  prefilledData?: {
    athlete1Name?: string;
    athlete1DateOfBirth?: string;
    athlete1Experience?: string;
    athlete1Allergies?: string;
    parentInfo?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    } | null;
  };
  onClose?: () => void;
  openAthleteModal?: (athleteId: string | number) => void;
  selectedBooking?: Booking | null;
  onSelectBooking?: (booking: Booking | null) => void;
}

export function AdminBookingManager({ prefilledData, onClose, openAthleteModal, selectedBooking, onSelectBooking }: AdminBookingManagerProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { genderOptions } = useGenders();
  // Dynamic lesson types (API-backed)
  const { byKey, maxFocusAreasFor } = useLessonTypes();
  const resolvePrice = (booking: any): number => {
    const lt = byKey(booking.lessonType || '');
    if (lt && typeof lt.price === 'number') return lt.price;
    if (booking.amount && !isNaN(parseFloat(booking.amount))) return parseFloat(booking.amount);
    return 0;
  };

  // Helper function to find athlete ID by name
  const findAthleteIdByName = (athleteName: string): string | null => {
    if (!athletes || !athleteName) return null;
    
    const athlete = athletes.find(a => {
      const fullName = a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : a.name;
      return fullName === athleteName;
    });
    
    return athlete?.id || null;
  };

  // Fetch all athletes for selection
  const { data: athletes = [] } = useQuery<any[]>({
    queryKey: ["/api/athletes"],
  });

  const [showManualForm, setShowManualForm] = useState(!!prefilledData);
  const [showUnifiedBooking, setShowUnifiedBooking] = useState(false);
  const [adminBookingContext, setAdminBookingContext] = useState<'new-athlete' | 'existing-athlete' | 'from-athlete'>('new-athlete');
  const [preSelectedAthleteId, setPreSelectedAthleteId] = useState<number | undefined>();
  const [bookingFilter, setBookingFilter] = useState<string>("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [sortOption, setSortOption] = useState<string>("recent");
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [tab, setTab] = useState<'active' | 'archived' | 'calendar'>("active");
  const [showArchivedInCalendar, setShowArchivedInCalendar] = useState<boolean>(false);
  // Search term for archived bookings
  const [archivedSearch, setArchivedSearch] = useState<string>("");

  // Auth status check to ensure queries are enabled only when admin is logged in
  const { data: authStatus } = useQuery<{ loggedIn: boolean; adminId?: number }>({
    queryKey: ['/api/auth/status'],
    queryFn: () => apiRequest('GET', '/api/auth/status').then(res => res.json()),
  });

  // Fetch active bookings
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    queryFn: () => apiRequest('GET', '/api/bookings').then(res => res.json()),
    enabled: !!authStatus?.loggedIn,
  });

  // Fetch archived bookings (completed, no-show, cancelled)
  const { data: archivedBookings = [], isLoading: loadingArchived } = useQuery<Booking[]>({
    queryKey: ["/api/archived-bookings"],
    queryFn: () => apiRequest('GET', '/api/archived-bookings').then(res => res.json()),
    enabled: !!authStatus?.loggedIn && (tab === 'archived' || showArchivedInCalendar),
  });

  // Filter archived bookings by search term (athlete names, date/time, lesson type, statuses, parent email)
  const filteredArchivedBookings = useMemo(() => {
    const list = (archivedBookings as any[]) || [];
    const q = archivedSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((booking: any) => {
      const names = (booking.athletes?.map((a: any) => a?.name).filter(Boolean))
        || [booking.athlete1Name, booking.athlete2Name].filter(Boolean);
      const lessonType = typeof booking.lessonType === 'object' && booking.lessonType && 'name' in booking.lessonType
        ? (booking.lessonType as any).name
        : (booking.lessonType || booking.lessonTypeName || "");
      const haystack = [
        booking.preferredDate,
        booking.preferredTime,
        lessonType,
        booking.paymentStatus,
        booking.attendanceStatus,
        booking.parentEmail,
        ...(names || [])
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [archivedBookings, archivedSearch]);

  // Combined bookings for calendar view
  const allBookingsForCalendar = useMemo(() => {
    if (!showArchivedInCalendar) return bookings || [];
    return [...(bookings || []), ...(archivedBookings || [])];
  }, [bookings, archivedBookings, showArchivedInCalendar]);

  // Helper function to invalidate booking caches
  const invalidateBookingQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    queryClient.invalidateQueries({ queryKey: ["/api/archived-bookings"] });
  };

  // Create manual booking mutation
  const createManualBooking = useMutation({
    mutationFn: async (bookingData: ManualBookingFormData & { isNewAthlete?: boolean }) => {
      // Calculate date of birth from age for compatibility
      const today = new Date();
      const athlete1DOB = new Date(today.getFullYear() - bookingData.athlete1Age, today.getMonth(), today.getDate());
      const athlete2DOB = bookingData.athlete2Age ? 
        new Date(today.getFullYear() - bookingData.athlete2Age, today.getMonth(), today.getDate()) : null;

      const formattedData: any = {
        lessonType: bookingData.lessonType as any,
        preferredDate: new Date(bookingData.preferredDate),
        preferredTime: bookingData.preferredTime,
        focusAreas: bookingData.focusAreas, // Send the actual focus area names
        apparatusIds: [],
        sideQuestIds: [],
        parentInfo: {
          firstName: bookingData.parentFirstName,
          lastName: bookingData.parentLastName,
          email: bookingData.parentEmail,
          phone: bookingData.parentPhone,
          emergencyContactName: bookingData.emergencyContactName,
          emergencyContactPhone: bookingData.emergencyContactPhone,
        },
        amount: bookingData.amount,
        status: BookingStatusEnum.CONFIRMED,
        attendanceStatus: AttendanceStatusEnum.PENDING,
        bookingMethod: bookingData.bookingMethod as any,
        waiverSigned: false,
        paymentStatus: PaymentStatusEnum.RESERVATION_PENDING,
        reservationFeePaid: false,
        paidAmount: "0.00",
        specialRequests: "",
        adminNotes: bookingData.adminNotes || "",
        // Safety verification fields (defaults for admin-created bookings)
        safetyContact: {
          willDropOff: true,
          willPickUp: true,
          dropoffPersonName: bookingData.parentFirstName + " " + bookingData.parentLastName,
          dropoffPersonRelationship: "Parent",
          dropoffPersonPhone: bookingData.parentPhone,
          pickupPersonName: bookingData.parentFirstName + " " + bookingData.parentLastName,
          pickupPersonRelationship: "Parent",
          pickupPersonPhone: bookingData.parentPhone,
        },
        safetyVerificationSigned: false,
        // Handle athletes based on booking type
        ...(bookingData.isNewAthlete ? {
          // For new athletes, send athleteInfo
          athleteInfo: [
            {
              firstName: bookingData.athlete1Name.split(' ')[0] || '',
              lastName: bookingData.athlete1Name.split(' ').slice(1).join(' ') || '',
              dateOfBirth: athlete1DOB.toISOString().split('T')[0],
              allergies: bookingData.allergies1 || "",
              experience: bookingData.athlete1Experience,
              gender: bookingData.athlete1Gender || "",
            },
            ...(bookingData.athlete2Name ? [{
              firstName: bookingData.athlete2Name.split(' ')[0] || '',
              lastName: bookingData.athlete2Name.split(' ').slice(1).join(' ') || '',
              dateOfBirth: athlete2DOB ? athlete2DOB.toISOString().split('T')[0] : "",
              allergies: bookingData.allergies2 || "",
              experience: bookingData.athlete2Experience || "beginner",
              gender: bookingData.athlete2Gender || "",
            }] : [])
          ]
        } : {
          // For existing athletes, use the bookingData.selectedAthletes
          selectedAthletes: bookingData.selectedAthletes || []
        })
      };

      // Use the admin-specific endpoint for admin bookings
      const response = await apiRequest("POST", "/api/admin/bookings", formattedData);
      const result = await response.json();

      // If this is a new athlete, trigger automated email workflows
      if (bookingData.isNewAthlete) {
        try {
          await apiRequest("POST", `/api/bookings/${result.id}/send-new-athlete-emails`);
        } catch (emailError) {
          console.warn("Failed to send automated emails:", emailError);
          // Don't fail the booking creation if emails fail
        }
      }

      return result;
    },
    onSuccess: (data) => {
      if (!data || !data.booking) {
        console.error("Received invalid response from booking creation:", data);
        toast({
          title: "Warning",
          description: "Booking might have been created but returned an unexpected response. Please check the bookings list.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Booking Created",
        description: "Manual booking has been successfully created.",
      });
      invalidateBookingQueries();
      setShowManualForm(false);
      // Ensure modal is closed
      if (onClose) {
        onClose();
      }
      // Force a small delay to ensure state updates are processed
      setTimeout(() => {
        if (onClose) onClose();
      }, 100);
    },
    onError: (error: any) => {
      console.error("Manual booking error:", error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please check all required fields.",
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Booking status has been updated successfully.",
      });
      invalidateBookingQueries();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      });
    },
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: number; paymentStatus: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}/payment-status`, { paymentStatus });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to update payment status");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Status Updated",
        description: "Payment status has been updated successfully.",
      });
      invalidateBookingQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status.",
        variant: "destructive",
      });
    },
  });

  // Update attendance status mutation
  const updateAttendanceStatusMutation = useMutation({
    mutationFn: async ({ id, attendanceStatus }: { id: number; attendanceStatus: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}/attendance-status`, { attendanceStatus });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to update attendance status");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Attendance Status Updated",
        description: "Attendance status has been updated successfully.",
      });
      invalidateBookingQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance status.",
        variant: "destructive",
      });
    },
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/bookings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Deleted",
        description: "Booking has been deleted successfully.",
      });
      invalidateBookingQueries();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete booking.",
        variant: "destructive",
      });
    },
  });

  // Reschedule booking mutation
  const rescheduleBookingMutation = useMutation({
    mutationFn: async ({ id, date, time }: { id: number; date: string; time: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}`, {
        preferredDate: date,
        preferredTime: time,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Rescheduled",
        description: "The booking has been rescheduled successfully.",
      });
      invalidateBookingQueries();
      setShowRescheduleModal(false);
      setRescheduleBooking(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reschedule booking.",
        variant: "destructive",
      });
    },
  });

  // Send waiver email mutation
  const sendWaiverEmailMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/send-waiver-email`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Waiver Email Sent",
        description: "Waiver email has been sent to the parent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to send waiver email.",
        variant: "destructive",
      });
    },
  });

  const filteredAndSortedBookings = bookings
    .filter((booking: Booking) => {
      // Filter by status
      if (bookingFilter !== "all" && booking.status !== bookingFilter) {
        return false;
      }
      // Filter by date if specified
      if (dateFilter && booking.preferredDate !== dateFilter) {
        return false;
      }
      return true;
    })
    .sort((a: Booking, b: Booking) => {
      switch (sortOption) {
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "date-asc":
          return new Date(a.preferredDate + " " + a.preferredTime).getTime() - 
                 new Date(b.preferredDate + " " + b.preferredTime).getTime();
        case "date-desc":
          return new Date(b.preferredDate + " " + b.preferredTime).getTime() - 
                 new Date(a.preferredDate + " " + a.preferredTime).getTime();
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <img src="/CWT_Circle_LogoSPIN.png" alt="Loading" className="animate-spin w-6 h-6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Isolation container so the tab list doesn’t overlay content */}
      <div className="relative isolate mb-8 pt-8 pb-8 border-b border-slate-200/60 dark:border-white/20">
        {/* Modern Tabs for Active/Archived */}
        <AdminContentTabs
          value={tab}
          onValueChange={v => setTab(v as 'active' | 'archived' | 'calendar')}
          items={[
            {
              value: "active",
              label: "Active Bookings",
              icon: <Calendar className="h-4 w-4 sm:mr-2 hidden sm:inline-block" />,
              activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/80 data-[state=active]:text-[#0F0276]",
            },
            {
              value: "calendar",
              label: "Calendar View",
              icon: <Calendar className="h-4 w-4 sm:mr-2 hidden sm:inline-block" />,
              activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/80 data-[state=active]:text-[#0F0276]",
            },
            {
              value: "archived",
              label: "Archived Bookings",
              icon: <FileCheck className="h-4 w-4 sm:mr-2 hidden sm:inline-block" />,
              activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/80 data-[state=active]:text-[#0F0276]",
            },
          ]}
          // Use the same styling as Messages tab
          listClassName="bg-slate-100 text-[#0F0276] dark:bg-[#D8BD2A]/10 dark:text-white border-slate-200 dark:border-[#D8BD2A]/20 mb-4"
          triggerClassName="gap-2"
        >
          <TabsContent value="active">
            {/* CONTENT: push it down and ensure it’s clickable */}
            <div className="relative z-0 mt-12 sm:mt-6 pointer-events-auto">
          {/* Modern Header Section */}
          <div className="mt-6 rounded-xl p-6 mb-6 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border border-slate-200/60 text-[#0F0276] dark:bg-[#2A4A9B] dark:text-white dark:border-white/20">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 mb-2 text-[#0F0276] dark:text-white">
                  <Calendar className="h-8 w-8 text-[#0F0276] dark:text-white" />
                  Active Bookings
                </h2>
                <p className="text-[#0F0276]/90 dark:text-white/90">Manage upcoming sessions and bookings</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <AdminButton
                  onClick={() => {
                    setAdminBookingContext('new-athlete');
                    setPreSelectedAthleteId(undefined);
                    setShowUnifiedBooking(true);
                  }}
                  variant="primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Athlete Booking
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  onClick={() => {
                    setAdminBookingContext('existing-athlete');
                    setPreSelectedAthleteId(undefined);
                    setShowUnifiedBooking(true);
                  }}
                  className="font-semibold"
                >
                  <User className="h-4 w-4 mr-2" />
                  Existing Athlete
                </AdminButton>
              </div>
            </div>
            
            {/* Modern Filter Section */}
        <div className="mt-6 flex flex-col lg:flex-row gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#0F0276]/70 dark:text-white/70" />
                  <Input
                    type="date"
            className="pl-10 rounded-xl border-slate-300/60 text-[#0F0276] bg-white focus:border-[#0F0276] focus:ring-[#0F0276] dark:border-white/40 dark:text-[#0F0276] dark:bg-white dark:focus:border-white dark:focus:ring-white"
                    onChange={(e) => setDateFilter(e.target.value)}
                    placeholder="Filter by date"
                  />
                </div>
                <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#0F0276]/70 dark:text-white/70" />
                  <Select value={bookingFilter} onValueChange={setBookingFilter}>
            <SelectTrigger className="pl-10 rounded-xl bg-transparent border-slate-300/60 text-[#0F0276] focus:border-[#0F0276] focus:ring-[#0F0276] dark:border-white/40 dark:text-white dark:focus:border-white dark:focus:ring-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="manual-paid">Manual Paid</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="no-show">No Show</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="rounded-xl bg-transparent border-slate-300/60 text-[#0F0276] focus:border-[#0F0276] focus:ring-[#0F0276] dark:border-white/40 dark:text-white dark:focus:border-white dark:focus:ring-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="date-asc">Session Date ↑</SelectItem>
                    <SelectItem value="date-desc">Session Date ↓</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Mobile list (active) to avoid horizontal scroll */}
          <div className="sm:hidden space-y-3">
            {filteredAndSortedBookings.length === 0 ? (
              <Card className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:bg-white/10 text-[#0F0276] dark:text-white">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Calendar className="h-8 w-8 text-gray-400" />
                    <div className="font-medium text-lg">No active bookings found</div>
                    <div className="text-sm text-gray-600 dark:text-white/90">
                      Active bookings will appear here when athletes have pending, confirmed, or paid sessions.
                    </div>
                    <div className="text-sm text-gray-600 dark:text-white/90">
                      Completed, cancelled, and no-show bookings can be found in the "Archived" tab.
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredAndSortedBookings.map((booking: Booking) => (
                <Card key={booking.id} className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:bg-white/10 text-[#0F0276] dark:text-white">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#0F0276]/10 dark:bg-white/15">
                          <Calendar className="h-4 w-4 text-[#0F0276] dark:text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-[#0F0276] dark:text-white">{booking.preferredDate}</div>
                          <div className="text-sm text-[#0F0276]/90 dark:text-white/90">{booking.preferredTime}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {/* Payment */}
                        <div>
                          <Badge variant="outline" className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10">
                            {(booking.paymentStatus || 'unpaid').replace('-', ' ')}
                          </Badge>
                        </div>
                        {/* Attendance */}
                        <div>
                          <Badge variant="outline" className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10">
                            {(booking.attendanceStatus || 'pending').replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {/* Athletes */}
                    <div className="mt-3 text-sm text-[#0F0276] dark:text-white">
                      {(() => {
                        const names = booking.athletes?.map((a: any) => a.name).filter(Boolean) || [booking.athlete1Name, booking.athlete2Name].filter(Boolean as any);
                        const validNames = (names as string[]).filter(Boolean);
                        if (validNames.length === 0) return <span className="italic text-[#0F0276]/80 dark:text-white/80">No athletes</span>;
                        const first = validNames[0];
                        const rest = validNames.length - 1;
                        return <span>{first}{rest > 0 ? ` +${rest} more` : ''}</span>;
                      })()}
                    </div>
                    {/* Lesson type */}
                    <div className="mt-2">
                      <Badge variant="outline" className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10 font-medium">
                        {(() => {
                          const lessonType = booking.lessonType;
                          if (typeof lessonType === 'object' && lessonType && 'name' in lessonType) {
                            return (lessonType as any).name;
                          }
                          return lessonType || booking.lessonTypeName || 'Unknown Lesson Type';
                        })()}
                      </Badge>
                    </div>
                    {/* Quick actions */}
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <Select
                        value={booking.paymentStatus || 'unpaid'}
                        onValueChange={(value) => updatePaymentStatusMutation.mutate({ id: booking.id, paymentStatus: value })}
                        disabled={updatePaymentStatusMutation.isPending}
                      >
                        <SelectTrigger className="h-9 w-full rounded-lg bg-transparent text-[#0F0276] border-[#0F0276]/30 focus:border-[#0F0276] focus:ring-[#0F0276] dark:text-white dark:border-white/40 dark:focus:border-white dark:focus:ring-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="reservation-pending">Reservation: Pending</SelectItem>
                          <SelectItem value="reservation-failed">Reservation: Failed</SelectItem>
                          <SelectItem value="reservation-paid">Reservation: Paid</SelectItem>
                          <SelectItem value="session-paid">Session Paid</SelectItem>
                          <SelectItem value="reservation-refunded">Reservation: Refunded</SelectItem>
                          <SelectItem value="session-refunded">Session: Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={booking.attendanceStatus || 'pending'}
                        onValueChange={(value) => updateAttendanceStatusMutation.mutate({ id: booking.id, attendanceStatus: value })}
                        disabled={updateAttendanceStatusMutation.isPending}
                      >
                        <SelectTrigger className="h-9 w-full rounded-lg bg-transparent text-[#0F0276] border-[#0F0276]/30 focus:border-[#0F0276] focus:ring-[#0F0276] dark:text-white dark:border-white/40 dark:focus:border-white dark:focus:ring-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="no-show">No Show</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Action buttons (mobile) */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <AdminButton 
                        variant="secondary" 
                        size="sm" 
                        className="w-full justify-center"
                        onClick={() => {
                          setSelectedBookingForDetails(booking);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </AdminButton>
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setRescheduleBooking(booking);
                          setShowRescheduleModal(true);
                        }}
                        className="w-full justify-center"
                      >
                        Reschedule
                      </AdminButton>
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        onClick={() => sendWaiverEmailMutation.mutate(booking.id)}
                        disabled={!booking.parentEmail || sendWaiverEmailMutation.isPending}
                        title={!booking.parentEmail ? 'No parent email on file for this booking' : undefined}
                        className="w-full justify-center"
                      >
                        Send Waiver
                      </AdminButton>
                      <AdminButton
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this booking?')) {
                            deleteBookingMutation.mutate(booking.id);
                          }
                        }}
                        className="w-full justify-center"
                      >
                        Delete
                      </AdminButton>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop table (active) */}
          <Card className="hidden sm:block rounded-xl border-0 shadow-lg bg-transparent">
            <CardContent className="p-0">
              <Table className="w-full border-separate border-spacing-y-2">
                <TableHeader>
                  <TableRow className="border-transparent bg-transparent">
                    <TableHead className="font-semibold text-[#0F0276] dark:text-white">Date & Time</TableHead>
                    <TableHead className="font-semibold text-[#0F0276] dark:text-white">Athletes</TableHead>
                    <TableHead className="font-semibold text-[#0F0276] dark:text-white">Lesson Type</TableHead>
                    <TableHead className="font-semibold text-[#0F0276] dark:text-white">Payment Status</TableHead>
                    <TableHead className="font-semibold text-[#0F0276] dark:text-white">Attendance</TableHead>
                    <TableHead className="font-semibold text-[#0F0276] dark:text-white">Amount</TableHead>
                    <TableHead className="font-semibold text-[#0F0276] dark:text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Calendar className="h-8 w-8 text-gray-400" />
                          <div>
                            <div className="font-medium text-lg">No active bookings found</div>
                            <div className="text-sm text-gray-500 mt-1">
                              Active bookings will appear here when athletes have pending, confirmed, or paid sessions.
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Completed, cancelled, and no-show bookings can be found in the "Archived" tab.
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedBookings.map((booking: Booking) => (
                    <TableRow key={booking.id} className="transition-colors border-transparent">
                      <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#0F0276]/10 dark:bg-white/15">
                            <Calendar className="h-4 w-4 text-[#0F0276] dark:text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-[#0F0276] dark:text-white">{booking.preferredDate}</div>
                            <div className="text-sm text-[#0F0276]/90 dark:text-white/90">{booking.preferredTime}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                        <div className="space-y-1">
                          {booking.athletes?.map((athlete: any, index: number) => (
                            <div key={index} className={index === 0 ? "font-semibold text-[#0F0276] dark:text-white" : "text-sm text-[#0F0276]/90 dark:text-white/90"}>
                              {athlete.name}
                            </div>
                          )) || (
                            <div className="space-y-1">
                              {booking.athlete1Name && <div className="font-semibold text-[#0F0276] dark:text-white">{booking.athlete1Name}</div>}
                              {booking.athlete2Name && <div className="text-sm text-[#0F0276]/90 dark:text-white/90">{booking.athlete2Name}</div>}
                              {!booking.athlete1Name && !booking.athlete2Name && (
                                <div className="italic text-[#0F0276]/80 dark:text-white/80">No athletes</div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                        <Badge variant="outline" className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10 font-medium">
                          {(() => {
                            const lessonType = booking.lessonType;
                            if (typeof lessonType === 'object' && lessonType && 'name' in lessonType) {
                              return (lessonType as any).name;
                            }
                            return lessonType || booking.lessonTypeName || 'Unknown Lesson Type';
                          })()}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                        <Select
                          value={booking.paymentStatus || "unpaid"}
                          onValueChange={(value) => 
                            updatePaymentStatusMutation.mutate({ 
                              id: booking.id, 
                              paymentStatus: value 
                            })
                          }
                          disabled={updatePaymentStatusMutation.isPending}
                        >
                          <SelectTrigger className="h-9 w-[150px] rounded-lg bg-transparent text-[#0F0276] border-[#0F0276]/30 focus:border-[#0F0276] focus:ring-[#0F0276] dark:text-white dark:border-white/40 dark:focus:border-white dark:focus:ring-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="reservation-pending">Reservation: Pending</SelectItem>
                            <SelectItem value="reservation-failed">Reservation: Failed</SelectItem>
                            <SelectItem value="reservation-paid">Reservation: Paid</SelectItem>
                            <SelectItem value="session-paid">Session Paid</SelectItem>
                            <SelectItem value="reservation-refunded">Reservation: Refunded</SelectItem>
                            <SelectItem value="session-refunded">Session: Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
            <TableCell className="bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                        <Select
                          value={booking.attendanceStatus || "pending"}
                          onValueChange={(value) => 
                            updateAttendanceStatusMutation.mutate({ 
                              id: booking.id, 
                              attendanceStatus: value 
                            })
                          }
                          disabled={updateAttendanceStatusMutation.isPending}
                        >
              <SelectTrigger className="h-8 w/[120px] bg-transparent text-[#0F0276] border-[#0F0276]/30 focus:border-[#0F0276] focus:ring-[#0F0276] dark:text-white dark:border-white/40 dark:focus:border-white dark:focus:ring-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="no-show">No Show</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                        <div className="text-sm font-medium text-[#0F0276] dark:text-white">
                          ${(() => {
                            const price = resolvePrice(booking);
                            return price > 0 ? price.toFixed(2) : '0.00';
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10"
                            onClick={() => {
                              setSelectedBookingForDetails(booking);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRescheduleBooking(booking);
                              setShowRescheduleModal(true);
                            }}
                            className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10"
                          >
                            Reschedule
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendWaiverEmailMutation.mutate(booking.id)}
                            disabled={!booking.parentEmail || sendWaiverEmailMutation.isPending}
                            title={!booking.parentEmail ? 'No parent email on file for this booking' : undefined}
                            className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10"
                          >
                            Send Waiver
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this booking?')) {
                                deleteBookingMutation.mutate(booking.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {/* Reschedule Modal */}
          <AdminModal 
            isOpen={showRescheduleModal} 
            onClose={() => setShowRescheduleModal(false)}
            title="Quick Reschedule"
            size="lg"
            showCloseButton={false}
          >
            {rescheduleBooking && (
              <AdminRescheduleForm 
                booking={rescheduleBooking} 
                onSubmit={(date, time) => {
                  rescheduleBookingMutation.mutate({
                    id: rescheduleBooking.id,
                    date,
                    time
                  });
                }} 
                onCancel={() => setShowRescheduleModal(false)} 
              />
            )}
          </AdminModal>
          {/* Unified Booking Modal for Admin Flows */}
          <UnifiedBookingModal
            isOpen={showUnifiedBooking}
            onClose={() => setShowUnifiedBooking(false)}
            isAdminFlow={true}
            adminContext={adminBookingContext}
            preSelectedAthleteId={preSelectedAthleteId}
          />
          </div>
        </TabsContent>
        <TabsContent value="calendar">
          {/* CONTENT: push it down and ensure it’s clickable */}
          <div className="relative z-0 mt-12 sm:mt-6 pointer-events-auto">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-[#0F0276]/5 to-[#D8BD2A]/5 dark:bg-[#0F0276] rounded-xl border border-slate-200/50 dark:border-white/20 p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#0F0276] dark:text-white">Calendar View</h2>
                  <p className="text-slate-600 dark:text-white">Manage bookings in a visual calendar format</p>
                </div>
                <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="w-full sm:w-auto flex items-center gap-2 bg-white text-[#0F0276] border border-slate-200 dark:border-[#D8BD2A] dark:border-2 rounded-md px-3 py-1.5">
                    <Checkbox 
                      id="show-archived" 
                      checked={showArchivedInCalendar}
                      onCheckedChange={(checked) => {
                        setShowArchivedInCalendar(!!checked);
                        // If we're showing archived bookings now, make sure they're loaded
                        if (checked && !archivedBookings.length) {
                          queryClient.invalidateQueries({ queryKey: ['/api/archived-bookings'] });
                        }
                      }}
                    />
                    <Label htmlFor="show-archived" className="text-sm cursor-pointer text-[#0F0276] dark:text-[#0F0276]">
                      Show completed/cancelled
                    </Label>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto justify-center flex items-center gap-2 bg-white text-[#0F0276] border-slate-200 dark:text-white dark:bg-transparent dark:border-2 dark:border-[#D8BD2A]"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
                      if (showArchivedInCalendar) {
                        queryClient.invalidateQueries({ queryKey: ['/api/archived-bookings'] });
                      }
                    }}
                  >
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </Button>
                  <Button 
                    variant="default" 
                    className="w-full sm:w-auto justify-center bg-[#0F0276] hover:bg-[#0F0276]/90 dark:bg-white dark:hover:bg-white/90 dark:text-[#0F0276] flex items-center gap-2 border border-transparent dark:border-2 dark:border-[#D8BD2A]"
                    onClick={() => {
                      setAdminBookingContext("new-athlete");
                      setShowUnifiedBooking(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    New Booking
                  </Button>
                </div>
              </div>
            </div>

            {/* Calendar Component */}
            <div className="h-[700px] border rounded-xl bg-white dark:bg-[#0F0276] dark:border-white/20 shadow-sm p-2">
              {allBookingsForCalendar?.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-8">
                  <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700">No Bookings Available</h3>
                  <p className="text-gray-500 max-w-md mt-2">
                    {showArchivedInCalendar 
                      ? "There are no bookings (active or archived) to display on the calendar."
                      : "There are no active bookings to display on the calendar. Create a new booking to see it here or toggle 'Show completed/cancelled' to see past bookings."}
                  </p>
                  <Button 
                    variant="default" 
                    className="mt-6 bg-[#0F0276] hover:bg-[#0F0276]/90"
                    onClick={() => {
                      setAdminBookingContext("new-athlete");
                      setShowUnifiedBooking(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Booking
                  </Button>
                </div>
              ) : (
                <BookingCalendar 
                  bookings={allBookingsForCalendar} 
                  onBookingSelect={(bookingId) => {
                    // Look in both active and archived bookings
                    const booking = allBookingsForCalendar.find((b: any) => b.id === bookingId);
                    if (booking) {
                      onSelectBooking?.(booking);
                      setShowDetailModal(true);
                    }
                  }} 
                />
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="archived">
          {/* CONTENT: push it down and ensure it’s clickable */}
          <div className="relative z-0 mt-12 sm:mt-6 pointer-events-auto">
          {/* Modern Archived Header */}
          <div className="bg-gradient-to-r from-slate-100/50 to-slate-200/30 dark:bg-[#0F0276] dark:from-[#0F0276] dark:to-[#0F0276] rounded-xl border border-slate-200/50 dark:border-white/20 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-white tracking-tight flex items-center gap-3">
                  <FileCheck className="h-8 w-8 text-slate-500 dark:text-[#D8BD2A]" />
                  Archived Bookings
                </h2>
                <p className="text-slate-600 dark:text-white mt-1">Completed, cancelled, and no-show sessions</p>
              </div>
              <div className="w-full lg:w-[380px]">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4a7 7 0 015.292 11.708l3 3a1 1 0 01-1.414 1.414l-3-3A7 7 0 1111 4zm0 2a5 5 0 100 10 5 5 0 000-10z" fill="currentColor" />
                  </svg>
                  <Input
                    type="text"
                    value={archivedSearch}
                    onChange={(e) => setArchivedSearch(e.target.value)}
                    placeholder="Search archived bookings..."
                    className="w-full pl-10 rounded-xl border-slate-300/60 text-slate-700 bg-white focus:border-[#0F0276] focus:ring-[#0F0276] dark:border-white/40 dark:text-white dark:bg-[#0F0276]"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {loadingArchived ? (
            <div className="flex items-center justify-center py-8">
              <img src="/CWT_Circle_LogoSPIN.png" alt="Loading" className="animate-spin w-6 h-6" />
            </div>
          ) : (
            <>
              {/* Mobile list (archived) */}
              <div className="sm:hidden space-y-3">
                {filteredArchivedBookings.length === 0 ? (
                  <Card className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:bg-white/10 text-[#0F0276] dark:text-white">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <FileCheck className="h-8 w-8 text-gray-400" />
                        <div className="font-medium text-lg">No archived bookings found</div>
                        <div className="text-sm text-gray-600 dark:text-white/90">
                          {archivedSearch ? 'Try a different search.' : 'Completed, cancelled, and no-show bookings will appear here.'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filteredArchivedBookings.map((booking: Booking) => (
                    <Card key={booking.id} className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:bg-white/10 text-[#0F0276] dark:text-white">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#0F0276]/10 dark:bg-white/15">
                              <Calendar className="h-4 w-4 text-[#0F0276] dark:text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-[#0F0276] dark:text-white">{booking.preferredDate}</div>
                              <div className="text-sm text-[#0F0276]/90 dark:text-white/90">{booking.preferredTime}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10">
                              {(booking.paymentStatus || 'unpaid').replace('-', ' ')}
                            </Badge>
                            <Badge variant="outline" className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10">
                              {(booking.attendanceStatus || 'pending').replace('-', ' ')}
                            </Badge>
                          </div>
                        </div>
                        {/* Athletes */}
                        <div className="mt-3 text-sm text-[#0F0276] dark:text-white">
                          {(() => {
                            const names = booking.athletes?.map((a: any) => a.name).filter(Boolean) || [booking.athlete1Name, booking.athlete2Name].filter(Boolean as any);
                            const validNames = (names as string[]).filter(Boolean);
                            if (validNames.length === 0) return <span className="italic text-[#0F0276]/80 dark:text-white/80">No athletes</span>;
                            const first = validNames[0];
                            const rest = validNames.length - 1;
                            return <span>{first}{rest > 0 ? ` +${rest} more` : ''}</span>;
                          })()}
                        </div>
                        {/* Lesson type */}
                        <div className="mt-2">
                          <Badge variant="outline" className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10 font-medium">
                            {(() => {
                              const lessonType = booking.lessonType;
                              if (typeof lessonType === 'object' && lessonType && 'name' in lessonType) {
                                return (lessonType as any).name;
                              }
                              return lessonType || booking.lessonTypeName || 'Unknown Lesson Type';
                            })()}
                          </Badge>
                        </div>
                        {/* Details action */}
                        <div className="mt-3 flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10"
                            onClick={() => {
                              setSelectedBookingForDetails(booking);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this archived booking?')) {
                                deleteBookingMutation.mutate(booking.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop table (archived) - match active table styling */}
              <Card className="hidden sm:block rounded-xl border-0 shadow-lg bg-transparent">
                <CardContent className="p-0">
                  <Table className="w-full border-separate border-spacing-y-2">
                  <TableHeader>
                    <TableRow className="border-transparent bg-transparent">
                      <TableHead className="font-semibold text-[#0F0276] dark:text-white">Date & Time</TableHead>
                      <TableHead className="font-semibold text-[#0F0276] dark:text-white">Athletes</TableHead>
                      <TableHead className="font-semibold text-[#0F0276] dark:text-white">Lesson Type</TableHead>
                      <TableHead className="font-semibold text-[#0F0276] dark:text-white">Payment Status</TableHead>
                      <TableHead className="font-semibold text-[#0F0276] dark:text-white">Attendance</TableHead>
                      <TableHead className="font-semibold text-[#0F0276] dark:text-white">Amount</TableHead>
                      <TableHead className="font-semibold text-[#0F0276] dark:text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArchivedBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                          <div className="flex flex-col items-center gap-3">
                            <FileCheck className="h-8 w-8 text-gray-400" />
                            <div>
                              <div className="font-medium text-lg">No archived bookings found</div>
                              <div className="text-sm text-gray-500 mt-1">
                                {archivedSearch ? 'Try a different search.' : 'Completed, cancelled, and no-show bookings will appear here.'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredArchivedBookings.map((booking: Booking) => (
                        <TableRow key={booking.id} className="transition-colors border-transparent">
                          <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-[#0F0276]/10 dark:bg-white/15">
                                <Calendar className="h-4 w-4 text-[#0F0276] dark:text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-[#0F0276] dark:text-white">{booking.preferredDate}</div>
                                <div className="text-sm text-[#0F0276]/90 dark:text-white/90">{booking.preferredTime}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                            <div className="space-y-1">
                              {booking.athletes?.map((athlete: any, index: number) => (
                                <div key={index} className={index === 0 ? "font-semibold text-[#0F0276] dark:text-white" : "text-sm text-[#0F0276]/90 dark:text-white/90"}>
                                  {athlete.name}
                                </div>
                              )) || (
                                <div className="space-y-1">
                                  {booking.athlete1Name && <div className="font-semibold text-[#0F0276] dark:text-white">{booking.athlete1Name}</div>}
                                  {booking.athlete2Name && <div className="text-sm text-[#0F0276]/90 dark:text-white/90">{booking.athlete2Name}</div>}
                                  {!booking.athlete1Name && !booking.athlete2Name && (
                                    <div className="italic text-[#0F0276]/80 dark:text-white/80">No athletes</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                            <Badge variant="outline" className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10 font-medium">
                              {(() => {
                                const lessonType = booking.lessonType;
                                if (typeof lessonType === 'object' && lessonType && 'name' in lessonType) {
                                  return (lessonType as any).name;
                                }
                                return lessonType || booking.lessonTypeName || 'Unknown Lesson Type';
                              })()}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                            <Select
                              value={booking.paymentStatus || "unpaid"}
                              onValueChange={(value) => 
                                updatePaymentStatusMutation.mutate({ 
                                  id: booking.id, 
                                  paymentStatus: value 
                                })
                              }
                              disabled={updatePaymentStatusMutation.isPending}
                            >
                              <SelectTrigger className="h-9 w-[150px] rounded-lg bg-transparent text-[#0F0276] border-[#0F0276]/30 focus:border-[#0F0276] focus:ring-[#0F0276] dark:text-white dark:border-white/40 dark:focus:border-white dark:focus:ring-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                                <SelectItem value="reservation-pending">Reservation: Pending</SelectItem>
                                <SelectItem value="reservation-failed">Reservation: Failed</SelectItem>
                                <SelectItem value="reservation-paid">Reservation: Paid</SelectItem>
                                <SelectItem value="session-paid">Session Paid</SelectItem>
                                <SelectItem value="reservation-refunded">Reservation: Refunded</SelectItem>
                                <SelectItem value="session-refunded">Session: Refunded</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                            <Select
                              value={booking.attendanceStatus || "pending"}
                              onValueChange={(value) => 
                                updateAttendanceStatusMutation.mutate({ 
                                  id: booking.id, 
                                  attendanceStatus: value 
                                })
                              }
                              disabled={updateAttendanceStatusMutation.isPending}
                            >
                              <SelectTrigger className="h-9 w-[120px] rounded-lg bg-transparent text-[#0F0276] border-[#0F0276]/30 focus:border-[#0F0276] focus:ring-[#0F0276] dark:text-white dark:border-white/40 dark:focus:border-white dark:focus:ring-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="no-show">No Show</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                            <div className="text-sm font-medium text-[#0F0276] dark:text-white">
                              ${(() => {
                                const price = resolvePrice(booking);
                                return price > 0 ? price.toFixed(2) : '0.00';
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10"
                                onClick={() => {
                                  setSelectedBookingForDetails(booking);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this archived booking?')) {
                                    deleteBookingMutation.mutate(booking.id);
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            </>
          )}
          </div>
        </TabsContent>
        </AdminContentTabs>
      </div>

      {/* New Booking Details Modal using AdminModal */}
      <BookingDetailsModal
        isOpen={!!selectedBookingForDetails}
        onClose={() => setSelectedBookingForDetails(null)}
        booking={selectedBookingForDetails}
        onEdit={(booking) => {
          setEditingBooking(booking);
          setSelectedBookingForDetails(null);
        }}
        onOpenStripe={(booking) => {
          const s = (booking as any)?.stripeSessionId;
          if (s) {
            window.open(`https://dashboard.stripe.com/checkout/sessions/${s}`, '_blank');
          } else {
            const email = booking.parent?.email || booking.parentEmail;
            if (email) {
              window.open(`https://dashboard.stripe.com/payments?query=${email}`, '_blank');
            }
          }
        }}
      />

      {/* Booking Edit Modal */}
      {editingBooking && (
        <BookingEditModal
          booking={editingBooking}
          open={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          onSuccess={() => {
            setEditingBooking(null);
            // Refresh the bookings data
            queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
          }}
        />
      )}

      {/* Legacy Booking Detail Modal - keeping for compatibility with selectedBooking */}
      {selectedBooking && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#0F0276]">
                Booking Details
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <BookingDetailsView booking={selectedBooking} />
            </div>
            <div className="flex justify-between mt-4">
              <AdminBookingDetailActions booking={selectedBooking} />
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Booking Details View Component
function BookingDetailsView({ booking }: { booking: Booking }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gradient-to-r from-white to-blue-50 p-3 sm:p-4 rounded-xl border border-blue-100 shadow-sm">
          <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4" />
            Lesson Details
          </h4>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded-lg">
              <span className="font-medium text-gray-700">Type:</span>
              <span className="text-gray-900">{(() => {
                const lessonType = booking.lessonType;
                if (typeof lessonType === 'object' && lessonType && 'name' in lessonType) {
                  return (lessonType as any).name;
                }
                return lessonType || booking.lessonTypeName || 'Unknown Lesson Type';
              })()}</span>
            </div>
            <div className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded-lg">
              <span className="font-medium text-gray-700">Date:</span>
              <span className="text-gray-900">{booking.preferredDate}</span>
            </div>
            <div className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded-lg">
              <span className="font-medium text-gray-700">Time:</span>
              <span className="text-gray-900">{booking.preferredTime}</span>
            </div>
            <div className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded-lg">
              <span className="font-medium text-gray-700">Payment Status:</span>
              {(() => {
                const badgeProps = getPaymentStatusBadgeProps(booking.paymentStatus || 'unpaid');
                return (
                  <Badge className={`${badgeProps.className} flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium`}>
                    {badgeProps.icon}
                    {booking.displayPaymentStatus || badgeProps.text || (booking.paymentStatus || 'unpaid').charAt(0).toUpperCase() + (booking.paymentStatus || 'unpaid').slice(1)}
                  </Badge>
                );
              })()}
            </div>
            <div className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded-lg">
              <span className="font-medium text-gray-700">Attendance Status:</span>
              {(() => {
                const badgeProps = getAttendanceStatusBadgeProps(booking.attendanceStatus || 'pending');
                return (
                  <Badge className={`${badgeProps.className} flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium`}>
                    {badgeProps.icon}
                    {badgeProps.text || (booking.attendanceStatus || 'pending').charAt(0).toUpperCase() + (booking.attendanceStatus || 'pending').slice(1).replace(/-/g, ' ')}
                  </Badge>
                );
              })()}
            </div>
            <div className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded-lg">
              <span className="font-medium text-gray-700">Amount:</span>
              <span className="text-gray-900 font-medium">{(() => {
                // Local price resolution (component-level) without depending on parent scope
                let price = 0;
                if (booking.lessonType && typeof booking.lessonType === 'object') {
                  const ltObj: any = booking.lessonType;
                  if (typeof ltObj.price === 'number') price = ltObj.price;
                  else if (ltObj.price) price = parseFloat(ltObj.price);
                  else if (ltObj.total_price) price = parseFloat(ltObj.total_price);
                }
                if (!price && booking.amount) {
                  const amt = parseFloat(booking.amount);
                  if (!isNaN(amt)) price = amt;
                }
                return `$${price.toFixed(2)}`;
              })()}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-white to-purple-50 p-3 sm:p-4 rounded-xl border border-purple-100 shadow-sm">
          <h4 className="font-semibold text-purple-800 flex items-center gap-2 mb-3">
            <User className="w-4 h-4" />
            Parent Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
            <div className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded-lg sm:col-span-2">
              <span className="font-medium text-gray-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-500" />
                Name:
              </span>
              <span className="text-gray-900 font-medium">{booking.parent?.firstName || booking.parentFirstName} {booking.parent?.lastName || booking.parentLastName}</span>
            </div>
            <div className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded-lg sm:col-span-2">
              <span className="font-medium text-gray-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-500" />
                Email:
              </span>
              <span className="text-gray-900">{booking.parent?.email || booking.parentEmail}</span>
            </div>
            <div className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded-lg sm:col-span-2">
              <span className="font-medium text-gray-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-purple-500" />
                Phone:
              </span>
              <span className="text-gray-900">{booking.parent?.phone || booking.parentPhone}</span>
            </div>
            <div className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded-lg sm:col-span-2">
              <span className="font-medium text-gray-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                Emergency Contact:
              </span>
              <span className="text-gray-900">{booking.parent?.emergencyContactName || booking.emergencyContactName}</span>
            </div>
            <div className="flex items-center justify-between bg-white bg-opacity-70 p-2 rounded-lg sm:col-span-2">
              <span className="font-medium text-gray-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-red-500" />
                Emergency Phone:
              </span>
              <span className="text-gray-900">{booking.parent?.emergencyContactPhone || booking.emergencyContactPhone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-white to-green-50 p-3 sm:p-4 rounded-xl border border-green-100 shadow-sm">
        <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" />
          Athletes
        </h4>
        <div className="space-y-3">
          {booking.athletes && booking.athletes.length > 0 ? (
            booking.athletes.map((athlete: any, index: number) => (
              <div key={athlete.id || index} className="p-3 bg-white rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-green-600" />
                  {athlete.firstName && athlete.lastName 
                    ? `${athlete.firstName} ${athlete.lastName}`
                    : athlete.name || 'Unnamed Athlete'}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  Age: {calculateAge(athlete.dateOfBirth || '')} | 
                  <Medal className="w-3 h-3 text-gray-500" />
                  Experience: {athlete.experience}
                </div>
                {athlete.allergies && (
                  <div className="text-xs sm:text-sm text-red-600 mt-1.5 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5" />
                    <span>Allergies: {athlete.allergies}</span>
                  </div>
                )}
              </div>
            ))
          ) : (booking as any).athleteNames && (booking as any).athleteNames.length > 0 ? (
            // Fallback to athleteNames from upcoming sessions
            (booking as any).athleteNames.map((athleteName: string, index: number) => (
              <div key={index} className="p-3 bg-white rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-green-600" />
                  {athleteName}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1.5">
                  Limited athlete information available
                </div>
              </div>
            ))
          ) : (
            // Fallback to legacy fields
            <>
              {booking.athlete1Name && (
                <div className="p-3 bg-white rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-green-600" />
                    {booking.athlete1Name}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    Age: {calculateAge(booking.athlete1DateOfBirth || '')} | 
                    <Medal className="w-3 h-3 text-gray-500" />
                    Experience: {booking.athlete1Experience}
                  </div>
                  {booking.athlete1Allergies && (
                    <div className="text-xs sm:text-sm text-red-600 mt-1.5 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5" />
                      <span>Allergies: {booking.athlete1Allergies}</span>
                    </div>
                  )}
                </div>
              )}
              {booking.athlete2Name && (
                <div className="p-3 bg-white rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-green-600" />
                    {booking.athlete2Name}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    Age: {booking.athlete2DateOfBirth ? calculateAge(booking.athlete2DateOfBirth) : "N/A"} | 
                    <Medal className="w-3 h-3 text-gray-500" />
                    Experience: {booking.athlete2Experience}
                  </div>
                  {booking.athlete2Allergies && (
                    <div className="text-xs sm:text-sm text-red-600 mt-1.5 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5" />
                      <span>Allergies: {booking.athlete2Allergies}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {(!booking.athletes || booking.athletes.length === 0) && !(booking as any).athleteNames && !booking.athlete1Name && (
            <div className="text-center py-4 text-gray-500">
              <Users className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              No athletes assigned
            </div>
          )}
        </div>
      </div>

      {(booking.focusAreas && booking.focusAreas.length > 0) || booking.focusAreaOther ? (
        <div className="bg-gradient-to-r from-white to-amber-50 p-3 sm:p-4 rounded-xl border border-amber-100 shadow-sm">
          <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" />
            Focus Areas
          </h4>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const areas: string[] = Array.isArray(booking.focusAreas) ? [...booking.focusAreas] : [];
              const hasOtherBadge = areas.some(a => typeof a === 'string' && a.toLowerCase().startsWith('other:'));
              if (booking.focusAreaOther && !hasOtherBadge) {
                areas.push(`Other: ${booking.focusAreaOther}`);
              }
              return areas.map((area: any, index: number) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200"
                >
                  {area}
                </Badge>
              ));
            })()}
          </div>
        </div>
      ) : null}

      {/* Safety Information Section */}
      <div className="bg-gradient-to-r from-white to-red-50 p-3 sm:p-4 rounded-xl border border-red-100 shadow-sm">
        <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4" />
          Safety Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h5 className="font-medium text-red-700 text-sm flex items-center gap-1.5 mb-2">
              <User className="w-3.5 h-3.5" />
              Drop-off Person
            </h5>
            <div className="space-y-2 text-xs sm:text-sm bg-white p-2 sm:p-3 rounded-lg border border-red-100">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Name:</span>
                <span className="text-gray-900">{booking.dropoffPersonName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Relationship:</span>
                <span className="text-gray-900">{booking.dropoffPersonRelationship || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="text-gray-900">{booking.dropoffPersonPhone || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-red-700 text-sm flex items-center gap-1.5 mb-2">
              <User className="w-3.5 h-3.5" />
              Pick-up Person
            </h5>
            <div className="space-y-2 text-xs sm:text-sm bg-white p-2 sm:p-3 rounded-lg border border-red-100">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Name:</span>
                <span className="text-gray-900">{booking.pickupPersonName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Relationship:</span>
                <span className="text-gray-900">{booking.pickupPersonRelationship || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="text-gray-900">{booking.pickupPersonPhone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {booking.altPickupPersonName && (
          <div className="mt-4">
            <h5 className="font-medium text-red-700 text-sm flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5" />
              Alternative Pick-up Person
            </h5>
            <div className="space-y-2 text-xs sm:text-sm bg-white p-2 sm:p-3 rounded-lg border border-red-100">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Name:</span>
                <span className="text-gray-900">{booking.altPickupPersonName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Relationship:</span>
                <span className="text-gray-900">{booking.altPickupPersonRelationship || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="text-gray-900">{booking.altPickupPersonPhone || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {booking.adminNotes && (
        <div className="bg-gradient-to-r from-white to-gray-50 p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4" />
            Admin Notes
          </h4>
          <p className="text-sm bg-white p-3 rounded-lg border border-gray-100 text-gray-700 leading-relaxed">{booking.adminNotes}</p>
        </div>
      )}
    </div>
  );
}