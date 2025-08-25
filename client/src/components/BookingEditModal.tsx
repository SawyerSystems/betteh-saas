import { BookingStatusBadge } from '@/components/ui/booking-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AdminModal, AdminModalSection, AdminModalDetailRow, AdminModalGrid } from '@/components/admin-ui/AdminModal';
import { AdminButton } from '@/components/admin-ui/AdminButton';
import { useToast } from '@/hooks/use-toast';
import { determineBookingStatus } from '@/lib/booking-status';
import { apiRequest } from '@/lib/queryClient';
import type { Athlete, Booking, LessonType, Parent } from '@shared/schema';
import { AttendanceStatusEnum, BookingStatusEnum, PaymentStatusEnum } from '@shared/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle,
    Bookmark,
    CheckCircle,
    ClipboardList,
    Clock,
    CreditCard,
    DollarSign,
    Filter,
    Info,
    Lock,
    MessageSquare,
    Shield,
    Tag,
    Target,
    User,
    UserCheck,
    Users,
    X
} from "lucide-react";
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery as useRQQuery } from '@tanstack/react-query';

// Define the FocusArea interface
interface FocusArea {
  id: number;
  name: string;
  level?: string;
  apparatusId?: number;
}

// Define the Apparatus interface
interface Apparatus {
  id: number;
  name: string;
  sortOrder?: number;
}

type BookingEditModalProps = {
  booking: Booking;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function BookingEditModal({ booking, open, onClose, onSuccess }: BookingEditModalProps) {
  // Ensure booking exists with fallback values
  if (!booking) {
    console.error('BookingEditModal: No booking provided');
    return null;
  }
  
  const [tab, setTab] = useState('general');
  const [isDevMode, setIsDevMode] = useState(false); // For advanced editing mode toggle
  const [paymentStatus, setPaymentStatus] = useState((booking.paymentStatus || 'unpaid') as string);
  const [attendanceStatus, setAttendanceStatus] = useState((booking.attendanceStatus || 'pending') as string);
  
  // Derive booking status automatically from payment and attendance status
  const derivedStatus = useMemo(() => {
    return determineBookingStatus(paymentStatus, attendanceStatus);
  }, [paymentStatus, attendanceStatus]);
  const [paidAmount, setPaidAmount] = useState<string>(booking.paidAmount?.toString() || '0.00');
  const [adminNotes, setAdminNotes] = useState(booking.adminNotes || '');
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests || '');
  const [selectedLessonTypeId, setSelectedLessonTypeId] = useState<number>(booking.lessonTypeId || 0);
  const [focusAreas, setFocusAreas] = useState<string[]>(booking.focusAreas || []);
  const [tempFocusArea, setTempFocusArea] = useState('');
  const [focusAreaOther, setFocusAreaOther] = useState(booking.focusAreaOther || '');
  const [selectedApparatusId, setSelectedApparatusId] = useState<number | null>(null);
  const [bookingAthletes, setBookingAthletes] = useState<{ athleteId: number | null }[]>([]);
  const [isValidationError, setIsValidationError] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  
  // Safety Information
  const [dropoffPersonName, setDropoffPersonName] = useState(booking.dropoffPersonName || '');
  const [dropoffPersonRelationship, setDropoffPersonRelationship] = useState(booking.dropoffPersonRelationship || '');
  const [dropoffPersonPhone, setDropoffPersonPhone] = useState(booking.dropoffPersonPhone || '');
  const [pickupPersonName, setPickupPersonName] = useState(booking.pickupPersonName || '');
  const [pickupPersonRelationship, setPickupPersonRelationship] = useState(booking.pickupPersonRelationship || '');
  const [pickupPersonPhone, setPickupPersonPhone] = useState(booking.pickupPersonPhone || '');
  const [altPickupPersonName, setAltPickupPersonName] = useState(booking.altPickupPersonName || '');
  const [altPickupPersonRelationship, setAltPickupPersonRelationship] = useState(booking.altPickupPersonRelationship || '');
  const [altPickupPersonPhone, setAltPickupPersonPhone] = useState(booking.altPickupPersonPhone || '');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all lesson types
  const { data: lessonTypes = [] } = useQuery<LessonType[]>({
    queryKey: ['/api/lesson-types'],
  });

  // Fetch all parents for athlete selection
  const { data: parents = [] } = useQuery<Parent[]>({
    queryKey: ['/api/parents'],
    // Add staleTime to prevent unnecessary refetches
    staleTime: 60 * 1000 // 1 minute
  });

  // Fetch all athletes
  const { data: allAthletes = [] } = useQuery<Athlete[]>({
    queryKey: ['/api/athletes'],
    // Add staleTime to prevent unnecessary refetches
    staleTime: 60 * 1000 // 1 minute
  });
  
  // Fetch athletes for current booking - moved up to fix reference issue
  const { data: bookingDetails } = useQuery({
    queryKey: ['/api/bookings', booking.id, 'details'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/bookings/${booking.id}/details`);
      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }
      const data = await response.json();
      console.log("BookingDetails received from API:", data);
      return data;
    },
    enabled: open,
  });
  
  // Determine athlete experience levels based on selected athletes
  const getAthleteExperienceLevels = (): string[] => {
    try {
      // First, check if we need to use the booking details for athletes (when data is first loaded)
      if (bookingDetails?.athletes && (!bookingAthletes || bookingAthletes.length === 0 || 
          !bookingAthletes.some(ba => ba && ba.athleteId))) {
        
        // Use booking details to determine athlete experience levels
        if (!Array.isArray(bookingDetails.athletes) || bookingDetails.athletes.length === 0) {
          return ['intermediate']; // Default fallback
        }
        
        // Map experience levels directly from booking details
        const athleteLevels = bookingDetails.athletes.map((athlete: any) => {
          if (!athlete) return 'intermediate'; // Handle null athlete
          
          // Handle both formats: { experience: '...' } and { athlete: { experience: '...' } }
          const exp = ((athlete.experience || athlete?.athlete?.experience) || '').toLowerCase();
          if (exp.includes('beginner') || exp.includes('new')) return 'beginner';
          if (exp.includes('advanced') || exp.includes('expert')) return 'advanced';
          return 'intermediate'; // Default
        });
        
        return athleteLevels.length > 0 ? athleteLevels : ['intermediate'];
      }
      
      // Otherwise, use the current bookingAthletes state
      if (!Array.isArray(bookingAthletes) || bookingAthletes.length === 0) {
        return ['intermediate']; // Default fallback
      }
      
      // Get the experience levels of all valid selected athletes
      const selectedAthleteIds = bookingAthletes
        .filter(ba => ba && ba.athleteId)
        .map(ba => ba.athleteId);
      
      if (selectedAthleteIds.length === 0) {
        return ['intermediate']; // Default fallback
      }
      
      // Find the athletes in the allAthletes array
      const selectedAthletes = Array.isArray(allAthletes) 
        ? allAthletes.filter(a => a && selectedAthleteIds.includes(a.id))
        : [];
      
      if (selectedAthletes.length === 0) {
        return ['intermediate']; // Default fallback
      }
      
      // Map experience levels to standard levels (beginner, intermediate, advanced)
      const athleteLevels = selectedAthletes.map((athlete: Athlete) => {
        if (!athlete) return 'intermediate'; // Handle null athlete
        const exp = (athlete.experience || '').toLowerCase();
        if (exp.includes('beginner') || exp.includes('new')) return 'beginner';
        if (exp.includes('advanced') || exp.includes('expert')) return 'advanced';
        return 'intermediate'; // Default
      });
      
      return athleteLevels.length > 0 ? athleteLevels : ['intermediate'];
    } catch (error) {
      console.error("Error in getAthleteExperienceLevels:", error);
      return ['intermediate']; // Fail safely with intermediate level
    }
  };
  
  // Fetch all apparatus
  const { data: apparatusAll = [] } = useQuery<Apparatus[]>({
    queryKey: ['/api/apparatus'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/apparatus');
      if (!response.ok) {
        throw new Error('Failed to fetch apparatus');
      }
      return response.json();
    }
  });

  // Load site-content to get admin apparatus availability
  const { data: siteContent } = useQuery<any>({
    queryKey: ['/api/site-content'],
    queryFn: async () => (await apiRequest('GET', '/api/site-content')).json(),
    staleTime: 60_000,
  });

  const adminAllowedIds: number[] | null = siteContent?.about?.apparatusAvailability?.admin || null;
  const apparatus: Apparatus[] = React.useMemo(() => {
    if (!Array.isArray(apparatusAll)) return [];
    if (!adminAllowedIds || adminAllowedIds.length === 0) return apparatusAll; // default allow all
    const set = new Set<number>(adminAllowedIds);
    return apparatusAll.filter(a => set.has(a.id));
  }, [apparatusAll, adminAllowedIds]);

  // Get appropriate focus areas based on athlete experience levels and selected apparatus
  const { data: dynamicFocusAreas = [], isLoading: isFocusAreasLoading } = useQuery<FocusArea[]>({
    queryKey: ['/api/focus-areas', getAthleteExperienceLevels().join('-'), selectedApparatusId],
    queryFn: async () => {
      try {
        const levels = getAthleteExperienceLevels();
        // Use the most restrictive level (beginner < intermediate < advanced)
        const level = levels.includes('beginner') ? 'beginner' : 
                     (levels.includes('intermediate') ? 'intermediate' : 'advanced');
        
        // Build the query URL with apparatus filter if one is selected
        let url = `/api/focus-areas?level=${level}`;
        if (selectedApparatusId) {
          url += `&apparatusId=${selectedApparatusId}`;
        }
                     
        const response = await apiRequest('GET', url);
        if (!response.ok) {
          console.error('Failed to fetch focus areas:', await response.text());
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching focus areas:", error);
        return [];
      }
    },
    enabled: open && bookingDetails !== undefined,
    staleTime: 30000, // Cache results for 30 seconds to reduce repeated fetches
  });

  // Get the selected lesson type
  const selectedLessonType = Array.isArray(lessonTypes) 
    ? lessonTypes.find(lt => lt.id === selectedLessonTypeId) 
    : null;
  
  // Filter athletes by parent
  const [selectedParentId, setSelectedParentId] = useState<number | null>(booking.parentId || null);
  const parentAthletes = Array.isArray(allAthletes) 
    ? allAthletes.filter((athlete: any) => athlete && athlete.parentId === selectedParentId)
    : [];
  
  // Use an effect to update form state when booking details are loaded
  useEffect(() => {
    if (bookingDetails && open) {
      console.log("Loading booking details into form:", bookingDetails);
      
      // Set all basic booking fields
      setPaymentStatus(bookingDetails.paymentStatus || 'unpaid');
      setAttendanceStatus(bookingDetails.attendanceStatus || 'pending');
      setPaidAmount(bookingDetails.paidAmount?.toString() || '0.00');
      setAdminNotes(bookingDetails.adminNotes || '');
      setSpecialRequests(bookingDetails.specialRequests || '');
      
      // Set lesson type from the lessonType object or fallback to lessonTypeId
      if (bookingDetails.lessonType && bookingDetails.lessonType.id) {
        setSelectedLessonTypeId(bookingDetails.lessonType.id);
      } else if (bookingDetails.lessonTypeId) {
        setSelectedLessonTypeId(bookingDetails.lessonTypeId);
      }
      
      // Set focus areas - handling both array of strings and array of objects
      if (bookingDetails.focusAreas && Array.isArray(bookingDetails.focusAreas)) {
        // Server returns array of strings for focusAreas 
        setFocusAreas(bookingDetails.focusAreas);
      }
      
      // Set custom focus area if available
      if (bookingDetails.focusAreaOther) {
        setFocusAreaOther(bookingDetails.focusAreaOther);
      }
      
      // Set safety information
      setDropoffPersonName(bookingDetails.dropoffPersonName || '');
      setDropoffPersonRelationship(bookingDetails.dropoffPersonRelationship || '');
      setDropoffPersonPhone(bookingDetails.dropoffPersonPhone || '');
      setPickupPersonName(bookingDetails.pickupPersonName || '');
      setPickupPersonRelationship(bookingDetails.pickupPersonRelationship || '');
      setPickupPersonPhone(bookingDetails.pickupPersonPhone || '');
      setAltPickupPersonName(bookingDetails.altPickupPersonName || '');
      setAltPickupPersonRelationship(bookingDetails.altPickupPersonRelationship || '');
      setAltPickupPersonPhone(bookingDetails.altPickupPersonPhone || '');
      
      // Set parent ID from the parent object or fallback to parentId
      if (bookingDetails.parent && bookingDetails.parent.id) {
        setSelectedParentId(bookingDetails.parent.id);
      } else if (bookingDetails.parentId) {
        setSelectedParentId(bookingDetails.parentId);
      }
      
      // Set athletes - handling the structure returned from API
      if (bookingDetails.athletes && Array.isArray(bookingDetails.athletes)) {
        let mappedAthletes;
        
        // Handle both formats: [{ id: 1, ... }] and [{ athleteId: 1, ... }]
        if (bookingDetails.athletes[0] && 'athleteId' in bookingDetails.athletes[0]) {
          // Already in correct format
          mappedAthletes = bookingDetails.athletes.map((athlete: any) => ({
            athleteId: athlete.athleteId || null
          }));
        } else {
          // Convert from { id: 1, ... } format to { athleteId: 1 }
          mappedAthletes = bookingDetails.athletes.map((athlete: any) => ({
            athleteId: athlete.id || null
          }));
        }
        
        setBookingAthletes(mappedAthletes.length > 0 ? mappedAthletes : [{ athleteId: null }]);
      } else {
        // If no athletes but modal is open, set at least one empty slot
        setBookingAthletes([{ athleteId: null }]);
      }
      
      // Add debug log to track data
      console.log("Loading booking details into form:", bookingDetails);
    }
    // Only depend on bookingDetails and open status to prevent infinite loops
  }, [bookingDetails, open]);
  
  // Log filtered athletes whenever parent changes
  useEffect(() => {
    console.log("Selected parent:", selectedParentId);
    console.log("Filtered athletes:", parentAthletes);
    
    // If parent changes and there are no athletes, initialize with an empty athlete slot
    if (selectedParentId && parentAthletes.length === 0 && bookingAthletes.length === 0) {
      setBookingAthletes([{ athleteId: null }]);
    }
  }, [selectedParentId, parentAthletes.length]);
  
  // Separate effect to handle apparatus selection based on focus areas
  useEffect(() => {
    // Only run this when we have booking details, focus areas, and dynamicFocusAreas are loaded
    if (bookingDetails?.focusAreas && 
        Array.isArray(bookingDetails.focusAreas) && 
        bookingDetails.focusAreas.length > 0 && 
        dynamicFocusAreas.length > 0 &&
        !selectedApparatusId) { // Don't override if user has already selected an apparatus
      
      // Look for any focus area that has an apparatus ID
      for (const areaName of bookingDetails.focusAreas) {
        const matchingArea = dynamicFocusAreas.find(area => area.name === areaName);
        if (matchingArea?.apparatusId) {
          console.log("Setting apparatus ID from focus area:", matchingArea.name, matchingArea.apparatusId);
          setSelectedApparatusId(matchingArea.apparatusId);
          break;
        }
      }
    }
  }, [bookingDetails?.focusAreas, dynamicFocusAreas, selectedApparatusId]);

  // Note: Booking data initialization is now handled by the useEffect above

  // Reset all form fields to initial state
  const resetForm = () => {
    console.log("Resetting form state");
    
    // Reset general booking info
    setPaymentStatus(booking.paymentStatus || 'unpaid');
    setAttendanceStatus(booking.attendanceStatus || 'pending');
    setPaidAmount(booking.paidAmount?.toString() || '0.00');
    setAdminNotes(booking.adminNotes || '');
    setSpecialRequests(booking.specialRequests || '');
    setSelectedLessonTypeId(booking.lessonTypeId || 0);
    setFocusAreas(booking.focusAreas || []);
    setTempFocusArea('');
    setFocusAreaOther(booking.focusAreaOther || '');
    setSelectedApparatusId(null);
    
    // Reset athletes
    setBookingAthletes([]);
    
    // Reset safety information
    setDropoffPersonName(booking.dropoffPersonName || '');
    setDropoffPersonRelationship(booking.dropoffPersonRelationship || '');
    setDropoffPersonPhone(booking.dropoffPersonPhone || '');
    setPickupPersonName(booking.pickupPersonName || '');
    setPickupPersonRelationship(booking.pickupPersonRelationship || '');
    setPickupPersonPhone(booking.pickupPersonPhone || '');
    setAltPickupPersonName(booking.altPickupPersonName || '');
    setAltPickupPersonRelationship(booking.altPickupPersonRelationship || '');
    setAltPickupPersonPhone(booking.altPickupPersonPhone || '');
    
    // Reset validation state
    setIsValidationError(false);
    setValidationMessage('');
    
    // Reset tab
    setTab('general');
  };
  
  // Update mutation with comprehensive error handling and data validation
  const updateBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending booking update data:", data);
      
      try {
        // Validate athletes before sending
        if (!Array.isArray(data.athletes) || data.athletes.length === 0) {
          throw new Error("At least one athlete is required");
        }
        
        // Ensure all athlete IDs are valid
        const validAthletes = data.athletes.filter((a: {athleteId?: number | null}) => a && a.athleteId);
        if (validAthletes.length === 0) {
          throw new Error("Please select valid athletes");
        }
        
        // Validate parent ID
        if (!data.parentId) {
          throw new Error("Parent selection is required");
        }
        
        // Send update request
        const response = await apiRequest('PATCH', `/api/bookings/${booking.id}`, data);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Booking update failed:", errorData);
          throw new Error(errorData.message || 'Failed to update booking');
        }
        
        const result = await response.json();
        console.log("Booking update successful:", result);
        return result;
      } catch (error: any) {
        console.error("Error in update mutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', booking.id, 'details'] });
      
      // Reset form state
      resetForm();
      
      // Format updated fields for success message
      const updatedFields = [];
      if (data.status) updatedFields.push('Status');
      if (data.paymentStatus) updatedFields.push('Payment Status');
      if (data.attendanceStatus) updatedFields.push('Attendance');
      if (data.focusAreas?.length > 0) updatedFields.push('Focus Areas');
      if (data.athletes?.length > 0) updatedFields.push('Athletes');
      if (data.dropoffPersonName) updatedFields.push('Safety Info');
      
      const updatedFieldsText = updatedFields.length > 0 
        ? `Updated: ${updatedFields.join(', ')}`
        : 'All changes saved';
      
      // Show success toast with more details
      toast({
        title: "Booking Updated Successfully",
        description: `Booking #${booking.id} has been updated. ${updatedFieldsText}`,
        variant: "default"
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the modal
      onClose();
    },
    onError: (error: Error) => {
      // Log the detailed error for debugging
      console.error("Booking update error:", error);
      
      // Create a user-friendly error message
      let errorMessage = error.message || "Failed to update booking";
      
      // Check for common error patterns and provide specific guidance
      if (errorMessage.includes("athlete")) {
        errorMessage = "There was an issue with the selected athletes. Please check your athlete selections.";
        setTab('athletes');
      } else if (errorMessage.includes("parent")) {
        errorMessage = "There was an issue with the parent selection. Please select a valid parent.";
        setTab('general');
      } else if (errorMessage.includes("focus")) {
        errorMessage = "Please provide at least one focus area for the lesson.";
        setTab('general');
      } else if (errorMessage.toLowerCase().includes("database") || errorMessage.toLowerCase().includes("connection")) {
        errorMessage = "Database connection error. Please try again or contact support if the problem persists.";
      }
      
      // Show toast with the user-friendly error message
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Set validation error for in-form display
      setIsValidationError(true);
      setValidationMessage(errorMessage);
    }
  });
  
  // Delete mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      console.log("Sending booking delete request for ID:", bookingId);
      
      try {
        // Send delete request
        const response = await apiRequest('DELETE', `/api/bookings/${bookingId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Booking delete failed:", errorData);
          throw new Error(errorData.message || 'Failed to delete booking');
        }
        
        return { success: true, id: bookingId };
      } catch (error: any) {
        console.error("Error in delete mutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      
      // Show success toast
      toast({
        title: "Booking Deleted",
        description: `Booking #${booking.id} has been permanently deleted`,
        variant: "default"
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the modal
      onClose();
    },
    onError: (error: Error) => {
      // Log the detailed error for debugging
      console.error("Booking delete error:", error);
      
      // Show toast with the error message
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete booking. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Function to handle booking deletion
  const handleDeleteBooking = (bookingId: number) => {
    deleteBookingMutation.mutate(bookingId);
  };

  const handleLessonTypeChange = (lessonTypeId: string) => {
    const newLessonTypeId = parseInt(lessonTypeId);
    const newLessonType = lessonTypes.find(lt => lt.id === newLessonTypeId);
    const currentLessonType = lessonTypes.find(lt => lt.id === selectedLessonTypeId);
    
    if (!newLessonType || !currentLessonType) return;
    
    // Handle private to semi-private transition (add athlete slot)
  if ((currentLessonType.isPrivate ? 1 : 2) === 1 && (newLessonType.isPrivate ? 1 : 2) > 1) {
      // Keep the existing athlete and allow adding more
    }
    
    // Handle semi-private to private transition (remove extra athletes)
  if ((currentLessonType.isPrivate ? 1 : 2) > 1 && (newLessonType.isPrivate ? 1 : 2) === 1) {
      if (bookingAthletes.length > 1) {
        setBookingAthletes([bookingAthletes[0]]);
      }
    }
    
    // Handle duration change and focus areas
    if (currentLessonType.durationMinutes !== newLessonType.durationMinutes) {
      if (newLessonType.durationMinutes > currentLessonType.durationMinutes) {
        // Going from short to long session - allow more focus areas
      } else {
        // Going from long to short session - limit focus areas
        if (focusAreas.length > 2) {
          setFocusAreas(focusAreas.slice(0, 2));
        }
      }
    }
    
    setSelectedLessonTypeId(newLessonTypeId);
  };
  
  const addFocusArea = () => {
    const raw = tempFocusArea.trim();
    if (!raw) return;
    
    const newLessonType = lessonTypes.find(lt => lt.id === selectedLessonTypeId);
    if (!newLessonType) return;
    
    const maxFocusAreas = newLessonType.durationMinutes >= 60 ? 4 : 2;
    
    // Determine if this is a known predefined area
    const isKnownArea = dynamicFocusAreas.some((fa: any) => fa?.name?.toLowerCase() === raw.toLowerCase());
    
    // Compose the next focus areas list respecting max and avoiding duplicates
    let nextAreas = [...focusAreas];
    
    if (!isKnownArea) {
      // Treat as custom -> sync to focusAreaOther and prefix with "Other:" for server validation
      const otherLabel = `Other: ${raw}`;
      // Remove any existing Other entry
      nextAreas = nextAreas.filter(a => typeof a === 'string' && !a.toLowerCase().startsWith('other:'));
      // Only add if capacity allows and not already present
      if (nextAreas.length < maxFocusAreas && !nextAreas.includes(otherLabel)) {
        nextAreas.push(otherLabel);
        setFocusAreaOther(raw);
      }
    } else {
      // Known area
      if (!nextAreas.includes(raw) && nextAreas.length < maxFocusAreas) {
        nextAreas.push(raw);
      }
    }
    
    if (nextAreas.length === focusAreas.length) {
      // No change (likely due to max limit); show feedback if over limit
      if (focusAreas.length >= maxFocusAreas) {
        toast({
          title: "Maximum Focus Areas",
          description: `You can only add up to ${maxFocusAreas} focus areas for this lesson type.`,
          variant: "destructive"
        });
      }
    } else {
      setFocusAreas(nextAreas);
      setTempFocusArea('');
    }
  };
  
  const removeFocusArea = (index: number) => {
    const newFocusAreas = [...focusAreas];
    const removed = newFocusAreas.splice(index, 1)[0];
    setFocusAreas(newFocusAreas);
    // If removing the Other entry, clear focusAreaOther to keep consistency
    if (typeof removed === 'string' && removed.toLowerCase().startsWith('other:')) {
      setFocusAreaOther('');
    }
  };
  
  const handleAthleteChange = (athleteId: string, index: number) => {
    try {
      const newBookingAthletes = Array.isArray(bookingAthletes) ? [...bookingAthletes] : [];
      // Skip special values like "no-athletes"
      if (athleteId === "no-athletes") {
        return;
      }
      
      // Handle empty string or invalid value
      if (!athleteId || athleteId === '') {
        newBookingAthletes[index] = { athleteId: null };
      } else {
        const parsedId = parseInt(athleteId, 10);
        newBookingAthletes[index] = { athleteId: isNaN(parsedId) ? null : parsedId };
      }
      setBookingAthletes(newBookingAthletes);
    } catch (error) {
      console.error('Error updating athlete selection:', error);
      toast({
        title: "Error",
        description: "Failed to update athlete selection. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const addAthleteSlot = () => {
    try {
      if (!Array.isArray(lessonTypes)) {
        toast({
          title: "Error",
          description: "Lesson types not loaded yet. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const newLessonType = lessonTypes.find(lt => lt.id === selectedLessonTypeId);
      if (!newLessonType) {
        toast({
          title: "Error",
          description: "Please select a lesson type first",
          variant: "destructive"
        });
        return;
      }
      
      const currentAthletes = Array.isArray(bookingAthletes) ? bookingAthletes : [];
      
    const maxAthletes = newLessonType.isPrivate ? 1 : 2;
    if (currentAthletes.length < maxAthletes) {
        setBookingAthletes([...currentAthletes, { athleteId: null }]);
      } else {
        toast({
          title: "Maximum Athletes",
      description: `This lesson type can only have ${maxAthletes} athletes.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding athlete slot:', error);
      toast({
        title: "Error",
        description: "Failed to add athlete. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const removeAthleteSlot = (index: number) => {
    try {
      if (!Array.isArray(bookingAthletes)) {
        console.error('bookingAthletes is not an array');
        return;
      }
      
      if (bookingAthletes.length <= 1) {
        toast({
          title: "Cannot Remove",
          description: "At least one athlete is required for booking.",
          variant: "destructive"
        });
        return;
      }
      
      const newBookingAthletes = [...bookingAthletes];
      newBookingAthletes.splice(index, 1);
      setBookingAthletes(newBookingAthletes);
    } catch (error) {
      console.error('Error removing athlete slot:', error);
      toast({
        title: "Error",
        description: "Failed to remove athlete. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const validateForm = () => {
    // Reset validation state first
    setIsValidationError(false);
    setValidationMessage("");
    
    // Validate required booking information
    if (!selectedLessonTypeId) {
      setIsValidationError(true);
      setValidationMessage("Please select a lesson type.");
      setTab('general');
      return false;
    }
    
    if (!selectedParentId) {
      setIsValidationError(true);
      setValidationMessage("Please select a parent for this booking.");
      setTab('general');
      return false;
    }
    
    if (!paymentStatus) {
      setIsValidationError(true);
      setValidationMessage("Please select a payment status.");
      setTab('general');
      return false;
    }
    
          // Validate at least one athlete is selected
    if (!Array.isArray(bookingAthletes) || 
        bookingAthletes.length === 0 || 
        bookingAthletes.every((a: { athleteId: number | null }) => !a || a.athleteId === null || a.athleteId === 0 || a.athleteId === undefined)) {
      setIsValidationError(true);
      setValidationMessage("Please select at least one athlete.");
      setTab('athletes');
      return false;
    }
    
    // Validate at least one focus area
    if (!Array.isArray(focusAreas) || focusAreas.length === 0) {
      setIsValidationError(true);
      setValidationMessage("Please add at least one focus area.");
      setTab('general');
      return false;
    }
    
    // Validate required safety fields
    if (!dropoffPersonName || !dropoffPersonRelationship || !dropoffPersonPhone) {
      setIsValidationError(true);
      setValidationMessage("Please fill in all required drop-off information.");
      setTab('safety');
      return false;
    }
    
    if (!pickupPersonName || !pickupPersonRelationship || !pickupPersonPhone) {
      setIsValidationError(true);
      setValidationMessage("Please fill in all required pickup information.");
      setTab('safety');
      return false;
    }
    
    // Check for any non-numeric characters in phone numbers
    const phoneRegex = /^[\d\+\-\(\)\s\.]+$/;
    if (dropoffPersonPhone && !phoneRegex.test(dropoffPersonPhone)) {
      setIsValidationError(true);
      setValidationMessage("Drop-off person phone number contains invalid characters.");
      setTab('safety');
      return false;
    }
    
    if (pickupPersonPhone && !phoneRegex.test(pickupPersonPhone)) {
      setIsValidationError(true);
      setValidationMessage("Pickup person phone number contains invalid characters.");
      setTab('safety');
      return false;
    }
    
    if (altPickupPersonPhone && !phoneRegex.test(altPickupPersonPhone)) {
      setIsValidationError(true);
      setValidationMessage("Alternative pickup person phone number contains invalid characters.");
      setTab('safety');
      return false;
    }
    
    // All validations passed
    setIsValidationError(false);
    setValidationMessage("");
    return true;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    try {
      // Run form validation
      if (!validateForm()) {
        return;
      }
      
      // Convert paid amount to decimal
      const numericPaidAmount = parseFloat(paidAmount);
      if (isNaN(numericPaidAmount)) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid number for paid amount.",
          variant: "destructive"
        });
        return;
      }
      
      // Clean up athlete data before sending
      const cleanedAthletes = Array.isArray(bookingAthletes) 
        ? bookingAthletes
            .filter((a: { athleteId: number | null }) => a && (a.athleteId !== null && a.athleteId !== undefined)) 
            .map((a: { athleteId: number | null }) => ({ athleteId: a.athleteId }))
        : [];
      
      // Add validation for at least one athlete
      if (cleanedAthletes.length === 0) {
        setIsValidationError(true);
        setValidationMessage("Please select at least one athlete.");
        setTab('athletes'); // Switch to athletes tab
        return;
      }
      
      // Normalize focus areas for server validation:
      // - Keep known areas as-is
      // - Prefix unknown/custom areas with "Other: "
      // - Ensure focusAreaOther is set if we created an Other entry
      const knownAreaNames = new Set<string>([
        ...dynamicFocusAreas.map((fa: any) => fa?.name).filter(Boolean),
        'Strength Training',
        'Flexibility',
      ]);
      let normalizedOther = focusAreaOther || '';
      const normalizedFocusAreas = (focusAreas || []).map((area) => {
        if (typeof area !== 'string') return '';
        if (area.toLowerCase().startsWith('other:')) {
          // Extract custom text if not already stored
          const text = area.slice(6).trim();
          if (!normalizedOther && text) normalizedOther = text;
          return area;
        }
        if (knownAreaNames.has(area)) return area;
        // Unknown -> treat as custom
        if (!normalizedOther) normalizedOther = area;
        return `Other: ${area}`;
      }).filter(Boolean) as string[];

      // Prepare complete booking data for update
      const bookingData = {
        status: derivedStatus, // Use the derived status based on payment and attendance
        paymentStatus,
        attendanceStatus,
        developerMode: isDevMode, // Pass this flag to the API
        paidAmount: numericPaidAmount,
        adminNotes,
        specialRequests,
        lessonTypeId: selectedLessonTypeId,
        focusAreas: normalizedFocusAreas,
        focusAreaOther: normalizedOther,
        athletes: cleanedAthletes,
        parentId: selectedParentId,
        
        // Safety information
        dropoffPersonName,
        dropoffPersonRelationship,
        dropoffPersonPhone,
        pickupPersonName,
        pickupPersonRelationship,
        pickupPersonPhone,
        altPickupPersonName,
        altPickupPersonRelationship,
        altPickupPersonPhone,
        
        // Add timestamp for the update
        updatedAt: new Date().toISOString(),
      };
      
      console.log("Submitting booking update:", bookingData);
      
      // Submit data to the mutation
      updateBookingMutation.mutate(bookingData);
      
    } catch (error: any) {
      console.error("Error in form submission:", error);
      toast({
        title: "Form Submission Error",
        description: error.message || "An error occurred while processing your form. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Calculate total price
  const calculatePrice = () => {
    const lessonType = lessonTypes.find(lt => lt.id === selectedLessonTypeId);
  return lessonType ? Number(lessonType.totalPrice) : 0;
  };

  const getMaxAthletes = () => {
    const lessonType = lessonTypes.find(lt => lt.id === selectedLessonTypeId);
  return lessonType ? (lessonType.isPrivate ? 1 : 2) : 1;
  };

  const getMaxFocusAreas = () => {
    const lessonType = lessonTypes.find(lt => lt.id === selectedLessonTypeId);
  return lessonType ? (lessonType.durationMinutes >= 60 ? 4 : 2) : 2;
  };
  
  // Filter focus areas based on athlete experience levels
  const getAppropriateSkillLevels = () => {
    const athleteLevels = getAthleteExperienceLevels();
    
    // If any athlete is a beginner, only show beginner skills
    if (athleteLevels.includes('beginner')) {
      return ['beginner'];
    }
    
    // If any athlete is intermediate, show beginner and intermediate skills
    if (athleteLevels.includes('intermediate')) {
      return ['beginner', 'intermediate'];
    }
    
    // For advanced athletes, show all skill levels
    return ['beginner', 'intermediate', 'advanced'];
  };

  const getLessonTypeDuration = () => {
    const lessonType = lessonTypes.find(lt => lt.id === selectedLessonTypeId);
  return lessonType ? `${lessonType.durationMinutes} minutes` : '';
  };

  const isPrivateLessonType = () => {
    const lessonType = lessonTypes.find(lt => lt.id === selectedLessonTypeId);
    return lessonType ? lessonType.isPrivate : true;
  };

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <div>
        {isDevMode && attendanceStatus === "confirmed" && (
          <AdminButton
            variant="destructive"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
                deleteBookingMutation.mutate(booking.id);
              }
            }}
            className="flex items-center gap-2"
          >
            Delete Booking
          </AdminButton>
        )}
      </div>
      <div className="flex gap-3">
        <AdminButton 
          variant="secondary"
          onClick={() => onClose()}
        >
          Cancel
        </AdminButton>
        <AdminButton 
          variant="primary"
          onClick={handleSubmit}
          disabled={updateBookingMutation.isPending}
        >
          {updateBookingMutation.isPending ? 'Updating...' : 'Update Booking'}
        </AdminButton>
      </div>
    </div>
  );

  return (
    <AdminModal
      isOpen={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={`Edit Booking #${booking.id}`}
      size="3xl"
      showCloseButton={false}
      footer={footer}
    >
      <div className="space-y-6">
        {isValidationError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 flex items-start gap-2 dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-300">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="text-sm">{validationMessage}</div>
          </div>
        )}
        
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-4 bg-gray-100 p-1 rounded-lg dark:bg-[#0F0276]/20">
            <TabsTrigger value="general" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#0F0276]/40 dark:data-[state=active]:text-blue-200">General</TabsTrigger>
            <TabsTrigger value="athletes" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#0F0276]/40 dark:data-[state=active]:text-blue-200">Athletes</TabsTrigger>
            <TabsTrigger value="safety" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#0F0276]/40 dark:data-[state=active]:text-blue-200">Safety Info</TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#0F0276]/40 dark:data-[state=active]:text-blue-200">Notes</TabsTrigger>
          </TabsList>
            
            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-80 p-3 rounded-lg border border-gray-200 shadow-sm dark:bg-[#0F0276]/40 dark:border-[#2A4A9B]/40">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 dark:text-blue-200">
                      <CheckCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      Booking Status
                    </Label>
                    
                    {/* Dev Mode Toggle */}
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsDevMode(!isDevMode)}
                      className="h-7 text-xs"
                    >
                      {isDevMode ? (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Shield className="h-3.5 w-3.5" />
                          Exit Dev Mode
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Lock className="h-3.5 w-3.5" />
                          Advanced
                        </span>
                      )}
                    </Button>
                  </div>
                  
                  <div className="mt-1.5">
                    {isDevMode ? (
                      // Dev mode - Allow direct status selection
                      <Select 
                        value={derivedStatus} 
                        onValueChange={(newStatus) => {
                          console.log("Status changed (Dev Mode):", newStatus);
                          // Do nothing for now, since derivedStatus is handled by useMemo
                          // The form submission will use the selected status directly
                        }}
                      >
                        <SelectTrigger className="bg-white border-amber-200 mt-1.5 dark:bg-[#0F0276]/20 dark:border-[#2A4A9B]/40 dark:text-blue-200">
                          <SelectValue placeholder="Select status (Developer Mode)" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Only show the six allowed status values */}
                          {[
                            BookingStatusEnum.PENDING,
                            BookingStatusEnum.PAID,
                            BookingStatusEnum.CONFIRMED,
                            BookingStatusEnum.COMPLETED,
                            BookingStatusEnum.CANCELLED,
                            BookingStatusEnum.FAILED
                          ].map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      // Normal mode - Read-only status badge
                      <div className="mt-2.5">
                        <BookingStatusBadge 
                          paymentStatus={paymentStatus}
                          attendanceStatus={attendanceStatus}
                          className="py-1.5 px-3 text-base"
                        />
                        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          <span>
                            Status is automatically determined from Payment and Attendance statuses
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-80 p-3 rounded-lg border border-gray-200 shadow-sm dark:bg-[#0F0276]/40 dark:border-[#2A4A9B]/40">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 dark:text-blue-200">
                    <CreditCard className="h-4 w-4 text-green-500 dark:text-green-400" />
                    Payment Status
                  </Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger className="bg-white border-gray-200 mt-1.5 dark:bg-[#0F0276]/20 dark:border-[#2A4A9B]/40 dark:text-blue-200">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PaymentStatusEnum).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-80 p-3 rounded-lg border border-gray-200 shadow-sm dark:bg-[#0F0276]/40 dark:border-[#2A4A9B]/40">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 dark:text-blue-200">
                    <UserCheck className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    Attendance Status
                  </Label>
                  <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                    <SelectTrigger className="bg-white border-gray-200 mt-1.5 dark:bg-[#0F0276]/20 dark:border-[#2A4A9B]/40 dark:text-blue-200">
                      <SelectValue placeholder="Select attendance status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AttendanceStatusEnum).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-white bg-opacity-80 p-3 rounded-lg border border-gray-200 shadow-sm dark:bg-[#0F0276]/40 dark:border-[#2A4A9B]/40">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 dark:text-blue-200">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Paid Amount
                  </Label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-blue-300">$</span>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={paidAmount} 
                      onChange={(e) => setPaidAmount(e.target.value)} 
                      placeholder="0.00"
                      className="pl-8 bg-white border-gray-200 dark:bg-[#0F0276]/20 dark:border-[#2A4A9B]/40 dark:text-blue-200 dark:placeholder:text-blue-300"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="bg-gradient-to-r from-white to-indigo-50 p-3 rounded-lg border border-indigo-100 shadow-sm dark:bg-gradient-to-r dark:from-[#0F0276]/40 dark:to-[#0F0276]/20 dark:border-[#2A4A9B]/40">
                  <Label className="text-sm font-medium text-indigo-700 flex items-center gap-1.5 dark:text-blue-200">
                    <Bookmark className="h-4 w-4 text-indigo-600 dark:text-blue-400" />
                    Lesson Type
                  </Label>
                  <Select 
                    value={selectedLessonTypeId?.toString()} 
                    onValueChange={handleLessonTypeChange}
                  >
                    <SelectTrigger className="bg-white border-indigo-100 mt-1.5 dark:bg-[#0F0276]/20 dark:border-[#2A4A9B]/40 dark:text-blue-200">
                      <SelectValue placeholder="Select lesson type" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessonTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name} - {type.durationMinutes} min ({type.isPrivate ? 'Private' : `Semi-private (2)`}) - ${Number(type.totalPrice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-white to-teal-50 p-4 rounded-lg border border-teal-100 shadow-sm mt-4 dark:bg-gradient-to-r dark:from-[#0F0276]/40 dark:to-[#0F0276]/20 dark:border-[#2A4A9B]/40">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-teal-700 flex items-center gap-1.5 dark:text-blue-200">
                    <Target className="h-4 w-4 text-teal-600 dark:text-blue-400" />
                    Focus Areas ({focusAreas.length}/{getMaxFocusAreas()})
                  </Label>
                  <div className="text-xs flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-1 rounded-full dark:text-blue-200 dark:bg-[#0F0276]/30">
                    <Filter className="h-3 w-3" />
                    <span>Level: {getAthleteExperienceLevels().join(', ')}</span>
                  </div>
                </div>
                
                {/* Step 1: Select Apparatus */}
                <div className="mb-4 bg-white p-3 rounded-lg dark:bg-[#0F0276]/40 dark:border-[#2A4A9B]/40 border border-gray-200">
                  <Label className="text-sm font-medium text-blue-700 flex items-center gap-1.5 mb-2 dark:text-blue-200">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Step 1: Select Apparatus
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {apparatus.map((app) => (
                      <Button
                        key={app.id}
                        type="button"
                        variant={selectedApparatusId === app.id ? "default" : "outline"}
                        className={selectedApparatusId === app.id 
                          ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700" 
                          : "border-blue-200 hover:bg-blue-50 text-blue-700 dark:border-[#2A4A9B] dark:hover:bg-[#0F0276]/20 dark:text-blue-200"}
                        onClick={() => setSelectedApparatusId(app.id)}
                      >
                        {app.name}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant={selectedApparatusId === null ? "default" : "outline"}
                      className={selectedApparatusId === null 
                        ? "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700" 
                        : "border-purple-200 hover:bg-purple-50 text-purple-700 dark:border-[#2A4A9B] dark:hover:bg-[#0F0276]/20 dark:text-purple-300"}
                      onClick={() => setSelectedApparatusId(null)}
                    >
                      All Apparatus
                    </Button>
                  </div>
                </div>

                {/* Step 2: Select Focus Areas */}
                <div className="flex flex-col gap-3">
                  <div className="bg-white p-3 rounded-lg dark:bg-[#0F0276]/40 dark:border-[#2A4A9B]/40 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-teal-700 flex items-center gap-1.5 dark:text-blue-200">
                        <Target className="h-4 w-4 text-teal-600 dark:text-blue-400" />
                        Step 2: Select Focus Areas
                      </Label>
                      {selectedApparatusId && (
                        <div className="text-xs flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded-full dark:text-blue-200 dark:bg-[#0F0276]/30">
                          <Filter className="h-3 w-3" />
                          <span>Filtered by: {apparatus.find(a => a.id === selectedApparatusId)?.name || 'Selected Apparatus'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1">
                        <Select
                          value="custom"
                          onValueChange={(value) => {
                            if (value === "custom" || value === "no-focus-areas-empty" || value === "no-focus-areas-apparatus") return;
                            // If the selected value is a known area, add directly; else route through addFocusArea logic as custom
                            setTempFocusArea(value);
                            const isKnown = dynamicFocusAreas.some((fa: any) => fa?.name === value) || [
                              "Strength Training","Flexibility"
                            ].includes(value);
                            if (isKnown) {
                              if (focusAreas.length < getMaxFocusAreas() && !focusAreas.includes(value)) {
                                setFocusAreas([...focusAreas, value]);
                                setTempFocusArea('');
                              }
                            } else {
                              // Custom selection (unlikely through dropdown), treat like typing and Add button
                              addFocusArea();
                            }
                          }}
                        >
                          <SelectTrigger className={`bg-white border-teal-100 dark:bg-[#0F0276]/20 dark:border-[#2A4A9B]/40 dark:text-blue-200 ${isFocusAreasLoading ? 'opacity-50' : ''}`}>
                            <SelectValue placeholder={isFocusAreasLoading ? "Loading focus areas..." : (selectedApparatusId ? "Select focus area for selected apparatus" : "Select focus area")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom focus area...</SelectItem>
                            
                            {/* Dynamically load focus areas from API */}
                            {dynamicFocusAreas.length > 0 ? (
                              dynamicFocusAreas.map((area: FocusArea) => (
                                <SelectItem key={area.id} value={area.name}>
                                  {area.name} {area.level && `(${area.level.charAt(0).toUpperCase() + area.level.slice(1)})`}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-focus-areas-empty" disabled>
                                {selectedApparatusId ? "No focus areas found for this apparatus" : "No focus areas available"}
                              </SelectItem>
                            )}
                            
                            {/* Always available general focus areas */}
                            {selectedApparatusId && dynamicFocusAreas.length === 0 && !isFocusAreasLoading && (
                              <SelectItem disabled value="no-focus-areas-apparatus">
                                No focus areas found for this apparatus
                              </SelectItem>
                            )}
                            
                            {/* Always available for all levels */}
                            <SelectItem value="Strength Training">Strength Training</SelectItem>
                            <SelectItem value="Flexibility">Flexibility</SelectItem>
                            <SelectItem value="Basic Tumbling">Basic Tumbling</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Input 
                          value={tempFocusArea} 
                          onChange={(e) => setTempFocusArea(e.target.value)} 
                          placeholder="Custom focus area"
                          disabled={focusAreas.length >= getMaxFocusAreas()}
                          className="w-48 bg-white border-teal-100 dark:bg-[#0F0276]/20 dark:border-[#2A4A9B]/40 dark:text-blue-200 dark:placeholder:text-blue-300"
                        />
                        <Button 
                          type="button" 
                          onClick={addFocusArea}
                          disabled={focusAreas.length >= getMaxFocusAreas() || !tempFocusArea.trim()}
                          className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {focusAreas.map((area, index) => {
                        // Find matching focus area to get level, or determine from name
                        const matchingFocusArea = dynamicFocusAreas.find((fa: FocusArea) => fa.name === area);
                        let level = matchingFocusArea?.level || 'intermediate';
                        let levelColor = 'bg-teal-50 border-teal-200 text-teal-800';
                        
                        // Identify the apparatus for this focus area
                        const focusApparatus = matchingFocusArea?.apparatusId 
                          ? apparatus.find(a => a.id === matchingFocusArea.apparatusId)?.name 
                          : (selectedApparatusId ? apparatus.find(a => a.id === selectedApparatusId)?.name : null);
                        
                        // Fallback logic for custom areas or if no match found
                        if (!matchingFocusArea) {
                          if (area.toLowerCase().includes('beginner') || 
                              area.toLowerCase().includes('forward roll') || 
                              area.toLowerCase().includes('backward roll') ||
                              area.toLowerCase().includes('floor skills') || 
                              area.toLowerCase().includes('balance beam')) {
                            level = 'beginner';
                          } else if (area.toLowerCase().includes('advanced') || 
                                    area.toLowerCase().includes('competition')) {
                            level = 'advanced';
                          } else if (area === "Strength Training" || 
                                     area === "Flexibility" || 
                                     area === "Basic Tumbling") {
                            // These are general areas that apply to all apparatus
                            level = 'general';
                          }
                        }
                        
                        // Set color based on level
                        if (level === 'beginner') {
                          levelColor = 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-700/40 dark:text-green-200';
                        } else if (level === 'advanced') {
                          levelColor = 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700/40 dark:text-orange-200';
                        } else if (level === 'general') {
                          levelColor = 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700/40 dark:text-blue-200';
                        }
                        
                        return (
                          <div key={index} className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${levelColor}`}>
                            <span>{area}</span>
                            {focusApparatus && (
                              <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full dark:bg-blue-800/40 dark:text-blue-200">
                                {focusApparatus}
                              </span>
                            )}
                            <div className="flex items-center ml-1">
                              <Tag className="h-3 w-3 mr-1 opacity-70" />
                              <span className="text-xs opacity-70">{level}</span>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 rounded-full hover:bg-teal-100 dark:hover:bg-[#0F0276]/30"
                              onClick={() => removeFocusArea(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                      {focusAreas.length === 0 && (
                        <div className="text-gray-500 text-sm italic py-2 dark:text-blue-300">No focus areas added yet</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Step 3: Custom Focus Area (Other) */}
                  <div className="bg-white p-3 rounded-lg dark:bg-[#0F0276]/40 dark:border-[#2A4A9B]/40 border border-gray-200">
                    <Label className="text-sm font-medium text-purple-700 flex items-center gap-1.5 mb-2 dark:text-blue-200">
                      <Target className="h-4 w-4 text-purple-600 dark:text-blue-400" />
                      Step 3: Additional Custom Focus Area (Optional)
                    </Label>
                    <Textarea
                      value={focusAreaOther}
                      onChange={(e) => setFocusAreaOther(e.target.value)}
                      placeholder="Enter additional custom focus areas or specific skills not listed above"
                      className="min-h-[80px] bg-white border-purple-100 dark:bg-[#0F0276]/20 dark:border-[#2A4A9B]/40 dark:text-blue-200"
                    />
                  </div>
                </div>
              </div>
              
              <Card className="mt-4 border-blue-100 shadow-sm bg-gradient-to-r from-white to-blue-50 dark:border-[#2A4A9B]/40 dark:bg-gradient-to-r dark:from-[#0F0276]/40 dark:to-[#0F0276]/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-1.5 rounded-full dark:bg-[#0F0276]/60">
                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Session Details</span>
                    </div>
                    <span className="text-lg font-bold bg-blue-50 px-3 py-1 rounded-full text-blue-700 dark:bg-[#0F0276]/60 dark:text-blue-200">${calculatePrice()}</span>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 bg-white bg-opacity-70 p-2 rounded-lg dark:bg-[#0F0276]/30 dark:border dark:border-[#2A4A9B]/30">
                      <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      <span className="font-medium text-gray-700 dark:text-blue-200">Duration:</span>
                      <span className="ml-auto dark:text-blue-200">{getLessonTypeDuration()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white bg-opacity-70 p-2 rounded-lg dark:bg-[#0F0276]/30 dark:border dark:border-[#2A4A9B]/30">
                      <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      <span className="font-medium text-gray-700 dark:text-blue-200">Capacity:</span>
                      <span className="ml-auto dark:text-blue-200">{getMaxAthletes()} Athlete{getMaxAthletes() > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="athletes" className="space-y-4 pt-4">
              <div>
                <Label className="dark:text-blue-200">Parent</Label>
                <Select 
                  value={selectedParentId?.toString() || 'no-parent-selected'} 
                  onValueChange={(value) => {
                    try {
                      // Skip special values
                      if (value === "no-parents" || value === "no-parent-selected") {
                        return;
                      }
                      
                      const parsedValue = parseInt(value, 10);
                      if (!isNaN(parsedValue)) {
                        console.log("Parent selected:", parsedValue);
                        setSelectedParentId(parsedValue);
                      }
                    } catch (error) {
                      console.error('Error setting parent ID:', error);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(parents) && parents.length > 0 ? parents.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id.toString()}>
                        {parent.firstName || parent.lastName ? 
                          `${parent.firstName || ''} ${parent.lastName || ''}`.trim() : 
                          parent.email || 'Unknown Parent'} 
                        {parent.email ? `(${parent.email})` : ''}
                      </SelectItem>
                    )) : (
                      <SelectItem value="no-parents" disabled>No parents available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-gradient-to-r from-white to-orange-50 p-4 rounded-lg border border-orange-100 shadow-sm mt-4 dark:bg-gradient-to-r dark:from-[#0F0276]/40 dark:to-[#0F0276]/20 dark:border-[#2A4A9B]/40">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-orange-700 flex items-center gap-1.5 dark:text-blue-200">
                    <Users className="h-4 w-4 text-orange-600 dark:text-blue-400" />
                    Athletes ({Array.isArray(bookingAthletes) ? bookingAthletes.length : 0}/{getMaxAthletes()})
                  </Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addAthleteSlot}
                    disabled={Array.isArray(bookingAthletes) && bookingAthletes.length >= getMaxAthletes()}
                    className="border-orange-200 hover:bg-orange-50 text-orange-700 dark:border-[#2A4A9B]/40 dark:hover:bg-[#0F0276]/30 dark:text-blue-200"
                  >
                    Add Athlete
                  </Button>
                </div>
                
                <div className="space-y-3 bg-white bg-opacity-70 p-3 rounded-lg dark:bg-[#0F0276]/30 dark:border dark:border-[#2A4A9B]/30">
                {Array.isArray(bookingAthletes) ? bookingAthletes.map((bookingAthlete, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Select 
                        value={bookingAthlete && bookingAthlete.athleteId ? bookingAthlete.athleteId.toString() : 'select-athlete'} 
                        onValueChange={(value) => handleAthleteChange(value, index)}
                        defaultValue="select-athlete"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select athlete" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="select-athlete" disabled>Select an athlete</SelectItem>
                          {selectedParentId && Array.isArray(parentAthletes) && parentAthletes.length > 0 ? (
                            parentAthletes.map((athlete: any) => (
                              <SelectItem key={athlete.id} value={athlete.id.toString()}>
                                {athlete.name || (athlete.firstName || athlete.lastName ? 
                                  `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim() : 
                                  'Unnamed Athlete')}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-athletes" disabled>
                              {selectedParentId ? "No athletes found for this parent" : "Please select a parent first"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 dark:hover:bg-[#0F0276]/40"
                      onClick={() => removeAthleteSlot(index)}
                    >
                      <X className="h-4 w-4 dark:text-blue-300" />
                    </Button>
                  </div>
                )) : <div className="p-4 text-center bg-gray-50 rounded-md text-gray-500 text-sm dark:bg-[#0F0276]/20 dark:text-blue-300">
                  No athletes added yet. Please select a parent and add athletes.
                </div>}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="safety" className="space-y-6 pt-4">
              {/* Drop-off Person Section */}
              <div className="space-y-4 bg-gradient-to-r from-white to-blue-50 p-4 rounded-lg border border-blue-100 dark:bg-gradient-to-r dark:from-[#0F0276]/40 dark:to-[#0F0276]/20 dark:border-[#2A4A9B]/40">
                <h4 className="font-medium text-blue-700 flex items-center gap-1.5 dark:text-blue-200">
                  <User className="w-4 h-4 dark:text-blue-400" />
                  Drop-off Person Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dropoff-name" className="text-sm dark:text-blue-200">Name*</Label>
                    <Input
                      id="dropoff-name"
                      value={dropoffPersonName}
                      onChange={(e) => setDropoffPersonName(e.target.value)}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dropoff-relationship" className="text-sm dark:text-blue-200">Relationship to Athlete*</Label>
                    <Input
                      id="dropoff-relationship"
                      value={dropoffPersonRelationship}
                      onChange={(e) => setDropoffPersonRelationship(e.target.value)}
                      placeholder="Parent, Guardian, etc."
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="dropoff-phone" className="text-sm dark:text-blue-200">Phone Number*</Label>
                    <Input
                      id="dropoff-phone"
                      value={dropoffPersonPhone}
                      onChange={(e) => setDropoffPersonPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Pick-up Person Section */}
              <div className="space-y-4 bg-gradient-to-r from-white to-green-50 p-4 rounded-lg border border-green-100 dark:bg-gradient-to-r dark:from-[#0F0276]/40 dark:to-[#0F0276]/20 dark:border-[#2A4A9B]/40">
                <h4 className="font-medium text-green-700 flex items-center gap-1.5 dark:text-blue-200">
                  <User className="w-4 h-4 dark:text-blue-400" />
                  Pick-up Person Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pickup-name" className="text-sm dark:text-blue-200">Name*</Label>
                    <Input
                      id="pickup-name"
                      value={pickupPersonName}
                      onChange={(e) => setPickupPersonName(e.target.value)}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pickup-relationship" className="text-sm dark:text-blue-200">Relationship to Athlete*</Label>
                    <Input
                      id="pickup-relationship"
                      value={pickupPersonRelationship}
                      onChange={(e) => setPickupPersonRelationship(e.target.value)}
                      placeholder="Parent, Guardian, etc."
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="pickup-phone" className="text-sm dark:text-blue-200">Phone Number*</Label>
                    <Input
                      id="pickup-phone"
                      value={pickupPersonPhone}
                      onChange={(e) => setPickupPersonPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Alternative Pick-up Person Section */}
              <div className="space-y-4 bg-gradient-to-r from-white to-purple-50 p-4 rounded-lg border border-purple-100 dark:bg-gradient-to-r dark:from-[#0F0276]/40 dark:to-[#0F0276]/20 dark:border-[#2A4A9B]/40">
                <h4 className="font-medium text-purple-700 flex items-center gap-1.5 dark:text-blue-200">
                  <Users className="w-4 h-4 dark:text-blue-400" />
                  Alternative Pick-up Person (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="alt-pickup-name" className="text-sm dark:text-blue-200">Name</Label>
                    <Input
                      id="alt-pickup-name"
                      value={altPickupPersonName}
                      onChange={(e) => setAltPickupPersonName(e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="alt-pickup-relationship" className="text-sm dark:text-blue-200">Relationship to Athlete</Label>
                    <Input
                      id="alt-pickup-relationship"
                      value={altPickupPersonRelationship}
                      onChange={(e) => setAltPickupPersonRelationship(e.target.value)}
                      placeholder="Parent, Guardian, etc."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="alt-pickup-phone" className="text-sm dark:text-blue-200">Phone Number</Label>
                    <Input
                      id="alt-pickup-phone"
                      value={altPickupPersonPhone}
                      onChange={(e) => setAltPickupPersonPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4 pt-4">
              <div className="bg-gradient-to-r from-white to-purple-50 p-4 rounded-lg border border-purple-100 shadow-sm dark:bg-gradient-to-r dark:from-[#0F0276]/40 dark:to-[#0F0276]/20 dark:border-[#2A4A9B]/40">
                <Label htmlFor="admin-notes" className="text-sm font-medium text-purple-700 flex items-center gap-1.5 mb-2 dark:text-blue-200">
                  <ClipboardList className="h-4 w-4 text-purple-600 dark:text-blue-400" />
                  Admin Notes
                </Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-[100px] bg-white border-purple-100 dark:bg-[#0F0276]/20 dark:border-[#2A4A9B]/40 dark:text-blue-200"
                  placeholder="Internal notes visible only to admin"
                />
              </div>
              
              <div className="bg-gradient-to-r from-white to-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm mt-4 dark:bg-gradient-to-r dark:from-[#0F0276]/40 dark:to-[#0F0276]/20 dark:border-[#2A4A9B]/40">
                <Label htmlFor="special-requests" className="text-sm font-medium text-blue-700 flex items-center gap-1.5 mb-2 dark:text-blue-200">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Special Requests
                </Label>
                <Textarea
                  id="special-requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="min-h-[100px] bg-white border-blue-100 dark:bg-[#0F0276]/20 dark:border-[#2A4A9B]/40 dark:text-blue-200"
                  placeholder="Special requests from parents"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </AdminModal>
  );
}
