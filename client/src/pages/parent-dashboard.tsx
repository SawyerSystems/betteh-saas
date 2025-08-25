import { GenderSelect } from '@/components/GenderSelect';
import { ParentWaiverManagement } from '@/components/parent-waiver-management';
import { ParentAthleteDetailDialog } from '@/components/ParentAthleteDetailDialog';
import { SafetyInformationDialog } from '@/components/safety-information-dialog';
import { BookingCancellationModal } from '@/components/BookingCancellationModal';
import { ParentFormInput, ParentFormTextarea, ParentFormSelectTrigger, Select, SelectContent, SelectItem, SelectValue } from '@/components/parent-ui/ParentFormComponents';
import { TwoStepFocusAreas } from '@/components/two-step-focus-areas-edit';
import { AddAthleteModal } from '@/components/AddAthleteModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UnifiedBookingModal } from '@/components/UnifiedBookingModal';
import { UpdatedWaiverModal } from '@/components/updated-waiver-modal';
import { toast } from '@/hooks/use-toast';
import { useAthleteWaiverStatus } from '@/hooks/use-waiver-status';
import { useAvailableTimes } from '@/hooks/useAvailableTimes';
import { formatDate } from '@/lib/dateUtils';
import { apiRequest } from '@/lib/queryClient';
import type { Athlete, Booking, Parent, FocusArea } from '@shared/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Activity, AlertCircle, Award, BookMarked, Calendar, CheckCircle, CheckCircle2, Clock, Download, Edit, Eye, FileCheck, FileText, FileX, HelpCircle, Lightbulb, Mail, MapPin, Medal, PlusCircle, Settings, Shield, Star, Target, TrendingUp, Trophy, User, UserCircle, Users, X, XCircle, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';

// Import new parent UI components
import {
  ParentStatsGrid,
  ParentStatCard,
  ParentTabs,
  ParentTabsList,
  ParentTabsTrigger,
  ParentTabsContent,
  ParentCard,
  ParentCardHeader,
  ParentCardTitle,
  ParentCardContent,
  ParentButton
} from '@/components/parent-ui';

// Import modal components
import {
  ParentModal,
  ParentModalSection,
  ParentModalGrid
} from '@/components/parent-ui/ParentModal';

// Import layout components directly
import {
  ParentMainContainer,
  ParentContentContainer,
  ParentPageHeader,
  ParentPageTitle,
  ParentPageSubtitle
} from '@/components/parent-ui/ParentLayout';
import { ParentMainContentContainer } from '@/components/parent-ui/ParentMainContentContainer';

// Helper function to format focus areas for display
type FocusAreaDisplay = FocusArea | { name: string; apparatusName?: string } | string;
const formatFocusAreas = (focusAreas: FocusAreaDisplay[]): string => {
  if (!focusAreas || focusAreas.length === 0) return 'No specific focus areas';
  
  return focusAreas.map(area => {
    if (typeof area === 'string') {
      return area; // Legacy string format
    } else if (area && typeof area === 'object' && 'name' in area && typeof area.name === 'string') {
      // New object format with apparatus info
      const withApparatus = area as { name: string; apparatusName?: string };
      return withApparatus.apparatusName ? `${withApparatus.apparatusName}: ${withApparatus.name}` : withApparatus.name;
    }
    return 'Unknown'; // Fallback
  }).join(', ');
};

// Helper function to format time from 24-hour to 12-hour format
const formatTime = (time: string | null) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${m} ${period}`;
};

// Helper function to format payment status for display
const formatPaymentStatus = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'unpaid':
      return 'No Payment';
    case 'reservation-failed':
      return 'Failed';
    case 'reservation-pending':
      return 'Pending';
    case 'reservation-refunded':
      return 'Refunded';
    case 'reservation-paid':
      return 'Res. Paid';
    case 'session-paid':
      return 'Paid';
    case 'session-refunded':
      return 'Fully Refunded';
    default:
      return paymentStatus || 'Unknown';
  }
};

// RescheduleForm component
function RescheduleForm({ booking, onSubmit, onCancel }: { 
  booking: Booking; 
  onSubmit: (date: string, time: string) => void; 
  onCancel: () => void 
}) {
  const [selectedDate, setSelectedDate] = useState('');
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <ParentModalSection title="Current Session Details">
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <p>
            <span className="font-medium">Athletes:</span> <span className="text-[#B8860B]">{booking.athlete1Name}</span>
            {booking.athlete2Name && <span className="text-[#B8860B]"> & {booking.athlete2Name}</span>}
          </p>
          <p>
            <span className="font-medium">Current Date:</span> {booking.preferredDate} at {formatTime(booking.preferredTime)}
          </p>
        </div>
      </ParentModalSection>

      <ParentModalSection title="New Session Details">
        <ParentModalGrid>
          <div>
            <Label htmlFor="reschedule-date" className="text-sm font-medium text-gray-700 dark:text-white">New Date</Label>
            <ParentFormInput
              id="reschedule-date"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime(''); // Reset time when date changes
              }}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <Label htmlFor="reschedule-time" className="text-sm font-medium text-gray-700 dark:text-white">New Time</Label>
            <Select
              value={selectedTime}
              onValueChange={setSelectedTime}
              disabled={!selectedDate || slotsLoading}
            >
              <ParentFormSelectTrigger>
                <SelectValue placeholder={slotsLoading ? "Loading times..." : "Select a time"} />
              </ParentFormSelectTrigger>
              <SelectContent>
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {formatTime(slot)}
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
        </ParentModalGrid>
      </ParentModalSection>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <ParentButton variant="secondary" onClick={onCancel}>
          Cancel
        </ParentButton>
        <ParentButton type="submit" disabled={!selectedDate || !selectedTime}>
          Reschedule
        </ParentButton>
      </div>
    </form>
  );
}

// EditBookingForm component
function EditBookingForm({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  // Initialize focus areas - handle both legacy (strings) and new (objects) formats
  const initializeFocusAreas = () => {
    if (!booking.focusAreas || booking.focusAreas.length === 0) return [];
    
    // If the first item is an object, it's the new format
    if (typeof booking.focusAreas[0] === 'object' && booking.focusAreas[0] !== null) {
      return booking.focusAreas as any[];
    }
    
    // Legacy format - convert strings to objects for consistency
    return (booking.focusAreas as string[]).map((name, index) => ({
      id: `legacy-${index}`,
      name,
      apparatus_id: 0,
      apparatusName: 'Legacy'
    }));
  };
  
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<any[]>(initializeFocusAreas());
  const [specialNotes, setSpecialNotes] = useState(booking.adminNotes || '');
  
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

  // Determine lesson duration and focus area limits
  const getLessonConfig = () => {
    const lessonType = booking.lessonType?.toLowerCase() || '';
    if (lessonType.includes('deep-dive') || lessonType.includes('partner-progression') || lessonType.includes('1-hour')) {
      return { maxFocusAreas: 4, duration: '60 minutes' };
    }
    return { maxFocusAreas: 2, duration: '30 minutes' };
  };
  
  const lessonConfig = getLessonConfig();

  // Check auth status before making the request
  const { data: authStatus } = useQuery<{ loggedIn: boolean; parentId?: string; email?: string }>({
    queryKey: ['/api/parent-auth/status'],
    retry: false,
  });

  useEffect(() => {
    console.log('🔑 Parent Authentication Status:', authStatus);
  }, [authStatus]);

  const updateBookingMutation = useMutation({
    mutationFn: async (data: { 
      focusAreas: any[]; 
      specialNotes: string;
      dropoffPersonName: string;
      dropoffPersonRelationship: string;
      dropoffPersonPhone: string;
      pickupPersonName: string;
      pickupPersonRelationship: string;
      pickupPersonPhone: string;
      altPickupPersonName?: string;
      altPickupPersonRelationship?: string;
      altPickupPersonPhone?: string;
    }) => {
      console.log('� Auth Status before request:', authStatus);
      console.log('�🔄 Sending booking update request for ID:', booking.id, 'with data:', data);
      try {
        // First, verify that we have an authentication cookie
        console.log('🍪 Current cookies:', document.cookie || 'No cookies found');
        
        // Use the correct safety information endpoint with PUT method
        const response = await apiRequest('PUT', `/api/parent/bookings/${booking.id}/safety`, data);
        console.log('✅ Booking update response:', response.status, response.statusText);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Booking update failed:', response.status, errorText);
          throw new Error(`Failed to update booking: ${response.status} ${errorText}`);
        }
        return response.json();
      } catch (error) {
        console.error('❌ Booking update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parent/bookings'] });
      toast({
        title: "Booking Updated",
        description: "Booking information has been updated successfully."
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update booking. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required safety fields
    if (!dropoffPersonName || !dropoffPersonRelationship || !dropoffPersonPhone || 
        !pickupPersonName || !pickupPersonRelationship || !pickupPersonPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required pickup and drop-off information.",
        variant: "destructive"
      });
      return;
    }
    
    updateBookingMutation.mutate({
      focusAreas: selectedFocusAreas,
      specialNotes: specialNotes,
      dropoffPersonName,
      dropoffPersonRelationship,
      dropoffPersonPhone,
      pickupPersonName,
      pickupPersonRelationship,
      pickupPersonPhone,
      altPickupPersonName,
      altPickupPersonRelationship,
      altPickupPersonPhone
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Focus Areas Section */}
      <ParentModalSection title="Focus Areas">
        <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <TwoStepFocusAreas
            selectedFocusAreas={selectedFocusAreas}
            onFocusAreasChange={setSelectedFocusAreas}
            maxFocusAreas={lessonConfig.maxFocusAreas}
            lessonDuration={lessonConfig.duration}
          />
        </div>
      </ParentModalSection>

      {/* Safety Information Section */}
      <ParentModalSection title="Safety Information">
        <div className="space-y-6">
          {/* Drop-off Person Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Drop-off Person Information</h4>
            <ParentModalGrid>
              <div>
                <Label htmlFor="dropoff-name" className="text-sm font-medium text-gray-700 dark:text-white">Name*</Label>
                <ParentFormInput
                  id="dropoff-name"
                  value={dropoffPersonName}
                  onChange={(e) => setDropoffPersonName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dropoff-relationship" className="text-sm font-medium text-gray-700 dark:text-white">Relationship to Athlete*</Label>
                <ParentFormInput
                  id="dropoff-relationship"
                  value={dropoffPersonRelationship}
                  onChange={(e) => setDropoffPersonRelationship(e.target.value)}
                  placeholder="Parent, Guardian, etc."
                  required
                />
              </div>
              <div>
                <Label htmlFor="dropoff-phone" className="text-sm font-medium text-gray-700 dark:text-white">Phone Number*</Label>
                <ParentFormInput
                  id="dropoff-phone"
                  value={dropoffPersonPhone}
                  onChange={(e) => setDropoffPersonPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </ParentModalGrid>
          </div>
          
          {/* Pick-up Person Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Pick-up Person Information</h4>
            <ParentModalGrid>
              <div>
                <Label htmlFor="pickup-name" className="text-sm font-medium text-gray-700 dark:text-white">Name*</Label>
                <ParentFormInput
                  id="pickup-name"
                  value={pickupPersonName}
                  onChange={(e) => setPickupPersonName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="pickup-relationship" className="text-sm font-medium text-gray-700 dark:text-white">Relationship to Athlete*</Label>
                <ParentFormInput
                  id="pickup-relationship"
                  value={pickupPersonRelationship}
                  onChange={(e) => setPickupPersonRelationship(e.target.value)}
                  placeholder="Parent, Guardian, etc."
                  required
                />
              </div>
              <div>
                <Label htmlFor="pickup-phone" className="text-sm font-medium text-gray-700 dark:text-white">Phone Number*</Label>
                <ParentFormInput
                  id="pickup-phone"
                  value={pickupPersonPhone}
                  onChange={(e) => setPickupPersonPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </ParentModalGrid>
          </div>
          
          {/* Alternative Pick-up Person Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Alternative Pick-up Person (Optional)</h4>
            <ParentModalGrid>
              <div>
                <Label htmlFor="alt-pickup-name" className="text-sm font-medium text-gray-700 dark:text-white">Name</Label>
                <ParentFormInput
                  id="alt-pickup-name"
                  value={altPickupPersonName}
                  onChange={(e) => setAltPickupPersonName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label htmlFor="alt-pickup-relationship" className="text-sm font-medium text-gray-700 dark:text-white">Relationship to Athlete</Label>
                <ParentFormInput
                  id="alt-pickup-relationship"
                  value={altPickupPersonRelationship}
                  onChange={(e) => setAltPickupPersonRelationship(e.target.value)}
                  placeholder="Relative, Friend, etc."
                />
              </div>
              <div>
                <Label htmlFor="alt-pickup-phone" className="text-sm font-medium text-gray-700 dark:text-white">Phone Number</Label>
                <ParentFormInput
                  id="alt-pickup-phone"
                  value={altPickupPersonPhone}
                  onChange={(e) => setAltPickupPersonPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </ParentModalGrid>
          </div>
        </div>
      </ParentModalSection>
      
      <ParentModalSection title="Special Notes">
        <div>
          <Label htmlFor="special-notes" className="text-sm font-medium text-gray-700 dark:text-white">Additional Information</Label>
          <ParentFormTextarea
            id="special-notes"
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            placeholder="Add any special notes about this booking..."
          />
        </div>
      </ParentModalSection>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <ParentButton variant="secondary" onClick={onClose}>
          Cancel
        </ParentButton>
        <ParentButton type="submit" disabled={updateBookingMutation.isPending}>
          {updateBookingMutation.isPending ? 'Updating...' : 'Update Booking'}
        </ParentButton>
      </div>
    </form>
  );
}

import SEOHead from '@/components/SEOHead';

function ParentDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [reschedulingBookingId, setReschedulingBookingId] = useState<number | null>(null);
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [editingAthleteId, setEditingAthleteId] = useState<number | null>(null);
  const [editingAthleteInfo, setEditingAthleteInfo] = useState<any>(null);
  const [editingAthleteGender, setEditingAthleteGender] = useState<string>('');
  const [editingAthleteIsGymMember, setEditingAthleteIsGymMember] = useState<boolean>(false);
  const [editingAthleteExperience, setEditingAthleteExperience] = useState<string>('');
  const [editingAthleteFirstName, setEditingAthleteFirstName] = useState<string>('');
  const [editingAthleteLastName, setEditingAthleteLastName] = useState<string>('');
  const [editingAthleteDateOfBirth, setEditingAthleteDateOfBirth] = useState<string>('');
  const [editingAthleteAllergies, setEditingAthleteAllergies] = useState<string>('');
  const [showAddAthleteModal, setShowAddAthleteModal] = useState<boolean>(false);
  const [selectedAthleteForBooking, setSelectedAthleteForBooking] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showUpdateProfile, setShowUpdateProfile] = useState(false);
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);
  const [showUpdateEmergencyContact, setShowUpdateEmergencyContact] = useState(false);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [selectedAthleteForWaiver, setSelectedAthleteForWaiver] = useState<any>(null);

  // Add callback to handle athlete creation and open waiver modal
  const handleAthleteCreated = useCallback((newAthlete: any) => {
    // Handle both camelCase and snake_case field names from API
    const firstName = newAthlete.firstName || newAthlete.first_name || '';
    const lastName = newAthlete.lastName || newAthlete.last_name || '';
    const athleteName = newAthlete.name || `${firstName} ${lastName}`.trim();
    
    // Ensure the athlete object has the expected properties for the waiver modal
    const athleteForWaiver = {
      ...newAthlete,
      name: athleteName,
      firstName: firstName,
      lastName: lastName,
    };
    
    // Set the athlete for waiver and open the waiver modal
    setSelectedAthleteForWaiver(athleteForWaiver);
    setShowAddAthleteModal(false);
    setShowWaiverModal(true);
  }, []);

  // Hook for waiver status - moved to top level to fix Rules of Hooks violation
  const { data: waiverStatus, isLoading: waiverLoading, error: waiverError } = useAthleteWaiverStatus(
    editingAthleteId ?? ''
  );

  // Initialize the edit form state when an athlete is selected for editing
  useEffect(() => {
    if (editingAthleteInfo) {
      setEditingAthleteFirstName(editingAthleteInfo.firstName || editingAthleteInfo.name?.split(' ')[0] || '');
      setEditingAthleteLastName(editingAthleteInfo.lastName || editingAthleteInfo.name?.split(' ').slice(1).join(' ') || '');
      setEditingAthleteDateOfBirth(editingAthleteInfo.dateOfBirth || '');
      setEditingAthleteGender(editingAthleteInfo.gender || '');
      setEditingAthleteExperience(editingAthleteInfo.experience || 'beginner');
      setEditingAthleteAllergies(editingAthleteInfo.allergies || '');
      setEditingAthleteIsGymMember(!!editingAthleteInfo.isGymMember);
    }
  }, [editingAthleteInfo]);

  // Check if parent is authenticated
  const { data: authStatus } = useQuery<{ loggedIn: boolean; parentId?: number; email?: string }>({
    queryKey: ['/api/parent-auth/status'],
  });

  useEffect(() => {
    if (authStatus && !authStatus.loggedIn) {
      setLocation('/parent/login');
    }
  }, [authStatus, setLocation]);

  // Get parent's bookings
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/parent/bookings'],
    enabled: authStatus?.loggedIn,
  });

  // Get complete parent information
  const { data: parentInfo } = useQuery<Parent>({
    queryKey: ['/api/parent/info'],
    enabled: authStatus?.loggedIn,
  });

  // Get parent's athletes
  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ['/api/parent/athletes'],
    enabled: authStatus?.loggedIn,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/parent-auth/logout');
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation('/');
    },
  });

  const upcomingBookings = bookings.filter(b => {
    if (!b.preferredDate) return false;
    
    // Parse the date as a local date to avoid timezone issues
    const [year, month, day] = b.preferredDate.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day); // month is 0-indexed
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start from beginning of today
    
    const isUpcoming = bookingDate >= today && 
           b.status !== 'cancelled' &&
           b.status !== 'completed' &&
           b.attendanceStatus !== 'cancelled';
    
    return isUpcoming;
  }).sort((a, b) => {
    // Sort by date (soonest first), then by time if same date
    if (!a.preferredDate || !b.preferredDate) return 0;
    
    const dateComparison = a.preferredDate.localeCompare(b.preferredDate);
    if (dateComparison !== 0) return dateComparison;
    
    // If same date, sort by time (earliest first)
    if (a.preferredTime && b.preferredTime) {
      return a.preferredTime.localeCompare(b.preferredTime);
    }
    
    return 0;
  });

  const pastBookings = bookings.filter(b => {
    // Adventure Log should show completed sessions and cancelled bookings
    return b.attendanceStatus === 'completed' || b.status === 'cancelled' || b.attendanceStatus === 'cancelled';
  }).sort((a, b) => {
    // Sort past bookings by date (most recent first), then by time if same date
    if (!a.preferredDate || !b.preferredDate) return 0;
    
    const dateComparison = b.preferredDate.localeCompare(a.preferredDate); // Reverse order for past bookings
    if (dateComparison !== 0) return dateComparison;
    
    // If same date, sort by time (latest first for past bookings)
    if (a.preferredTime && b.preferredTime) {
      return b.preferredTime.localeCompare(a.preferredTime);
    }
    
    return 0;
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
        description: "Your booking has been rescheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/parent/bookings"] });
      setReschedulingBookingId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reschedule booking.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleReschedule = (bookingId: number) => {
    setReschedulingBookingId(bookingId);
  };

  const handleEditBooking = (bookingId: number) => {
    setEditingBookingId(bookingId);
  };

  // Loading state while checking authentication
  if (!authStatus) {
    return (
      <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black flex items-center justify-center">
        <img 
          src="/CWT_Circle_LogoSPIN.png" 
          alt="Loading" 
          className="animate-spin w-16 h-16" 
        />
      </div>
    );
  }

  // If not logged in, the useEffect will redirect - show loading state instead of null
  if (!authStatus.loggedIn) {
    return (
      <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black flex items-center justify-center">
        <img 
          src="/CWT_Circle_LogoSPIN.png" 
          alt="Loading" 
          className="animate-spin w-16 h-16" 
        />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Parent Dashboard — Coach Will Tumbles"
        description="Private parent dashboard."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/parent-dashboard` : 'https://www.coachwilltumbles.com/parent-dashboard'}
        robots="noindex,follow"
        structuredData={{ "@context": "https://schema.org", "@type": "WebPage" }}
      />
      <ParentMainContainer>
        <ParentContentContainer>
          <ParentPageHeader>
            <ParentPageTitle className="text-[#0F0276] dark:text-[#B8860B]">Parent Portal</ParentPageTitle>
            <ParentPageSubtitle className="text-[#0F0276]/80 dark:text-[#B8860B]/80">Manage your athletes, sessions and waivers</ParentPageSubtitle>
          </ParentPageHeader>

          {/* Statistics Overview Section */}
          <section className="mb-8">
            <ParentStatsGrid>
              <ParentStatCard
                icon={<Users className="h-6 w-6" />}
                label="Total Athletes"
                value={athletes.length}
                color="blue"
              />
              <ParentStatCard
                icon={<Calendar className="h-6 w-6" />}
                label="Upcoming Sessions"
                value={upcomingBookings.length}
                color="green"
              />
              <ParentStatCard
                icon={<BookMarked className="h-6 w-6" />}
                label="Total Bookings"
                value={bookings.length}
                color="purple"
              />
            </ParentStatsGrid>
          </section>

          {/* Main Content Section */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[#0F0276] dark:text-[#B8860B]">Booking Management</h2>
                <p className="text-[#0F0276]/80 dark:text-[#B8860B]/70 text-sm">Schedule and manage yourcoaching sessions</p>
              </div>
              <div className="flex gap-2">
                <ParentButton 
                  onClick={() => {
                    console.log('🎯 PARENT DASHBOARD: Book New Session clicked!', {
                  hasParentInfo: !!parentInfo,
                  parentInfo: parentInfo ? { id: parentInfo.id, email: parentInfo.email } : null
                });
                // Open booking modal directly (wizard will handle athlete selection)
                setSelectedAthleteForBooking(null); // Clear any pre-selection
                setShowBookingModal(true);
              }}
              variant="primary"
              size="md"
              className="dark:!bg-gradient-to-r dark:!from-[#B8860B] dark:!to-[#B8860B]/90 dark:!hover:from-[#A0751F] dark:!hover:to-[#A0751F]/90 dark:!border-[#B8860B] dark:!text-[#0F0276]"
            >
              <PlusCircle className="h-4 w-4" />
              Book New Session
            </ParentButton>
          </div>
        </div>

          <ParentTabs defaultValue="upcoming">
          <ParentTabsList className="w-full grid grid-cols-2 xs:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-2 p-1 sm:p-2 h-auto mb-4 sm:mb-6 overflow-x-auto">
            <ParentTabsTrigger value="upcoming" className="min-h-[40px] sm:min-h-[48px] text-xs sm:text-sm">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden xs:inline">Upcoming</span>
              <span className="xs:hidden">Next</span>
            </ParentTabsTrigger>
            <ParentTabsTrigger value="past" className="min-h-[40px] sm:min-h-[48px] text-xs sm:text-sm">
              <BookMarked className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden xs:inline">Adventure Log</span>
              <span className="xs:hidden">Past</span>
            </ParentTabsTrigger>
            <ParentTabsTrigger value="athletes" className="min-h-[40px] sm:min-h-[48px] text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span>Athletes</span>
            </ParentTabsTrigger>
            <ParentTabsTrigger value="waivers" className="min-h-[40px] sm:min-h-[48px] text-xs sm:text-sm">
              <FileCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span>Waivers</span>
            </ParentTabsTrigger>
            <ParentTabsTrigger value="profile" className="min-h-[40px] sm:min-h-[48px] text-xs sm:text-sm">
              <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span>Profile</span>
            </ParentTabsTrigger>
            <ParentTabsTrigger value="settings" className="min-h-[40px] sm:min-h-[48px] text-xs sm:text-sm">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span>Settings</span>
            </ParentTabsTrigger>
          </ParentTabsList>

          <ParentTabsContent value="upcoming">
            <ParentMainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <Calendar className="h-8 w-8 text-[#D8BD2A]" />
                  Upcoming Sessions
                </span>
              }
            >
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-4">🗓️</div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-1">No upcoming sessions</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">Book a new session to see it here!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {upcomingBookings.map((booking) => (
                      <ParentCard 
                        key={booking.id}
                        className="group hover:shadow-xl transition-all duration-300 overflow-hidden"
                      >
                        <ParentCardContent className="p-6">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Athlete Info */}
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                {booking.athletes && booking.athletes.length > 0 ? (
                                  <h3 className="text-lg font-bold text-[#B8860B] dark:text-[#B8860B] group-hover:text-[#B8860B]/80 dark:group-hover:text-[#B8860B]/90 transition-colors">
                                    {booking.athletes.map((athlete: any) => 
                                      athlete.name || 
                                      `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 
                                      'Athlete'
                                    ).join(' & ')}
                                  </h3>
                                ) : (
                                  <h3 className="text-lg font-bold text-[#B8860B] dark:text-[#B8860B] group-hover:text-[#B8860B]/80 dark:group-hover:text-[#B8860B]/90 transition-colors">
                                    {booking.athlete1Name || 'Your Athlete'}
                                    {booking.athlete2Name && ` & ${booking.athlete2Name}`}
                                  </h3>
                                )}
                              </div>

                              {/* Session Details */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
                                    <Calendar className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">Session Date</p>
                                    <p className="font-semibold text-[#0F0276] dark:text-white">
                                      {booking.preferredDate ? formatDate(booking.preferredDate) : 'Date TBD'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                                    <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">Session Time</p>
                                    <p className="font-semibold text-[#0F0276] dark:text-white">
                                      {formatTime(booking.preferredTime)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Lesson Type */}
                              <div className="flex items-center gap-3">
                                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                                  <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <p className="text-sm text-slate-600 dark:text-slate-300">Lesson Type</p>
                                  <p className="font-semibold text-[#0F0276] dark:text-white">
                                    {booking.lessonType?.replace('-', ' ').replace('min', 'minute') || 'Unknown Lesson Type'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Status & Action Column */}
                            <div className="flex-shrink-0 flex flex-col gap-3 min-w-[140px]">
                              {/* Status Badges */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {booking.paymentStatus === 'reservation-pending' && <Clock className="w-4 h-4 text-yellow-600" />}
                                  {(booking.paymentStatus === 'reservation-paid' || booking.paymentStatus === 'session-paid') && <CheckCircle className="w-4 h-4 text-green-600" />}
                                  {(booking.paymentStatus === 'reservation-failed') && <XCircle className="w-4 h-4 text-red-600" />}
                                  {(booking.paymentStatus === 'reservation-refunded' || booking.paymentStatus === 'session-refunded') && <XCircle className="w-4 h-4 text-blue-600" />}
                                  {booking.paymentStatus === 'unpaid' && <AlertCircle className="w-4 h-4 text-orange-600" />}
                                  
                                  <Badge 
                                    variant="outline"
                                    className={`text-xs px-2 py-1 ${
                                      booking.paymentStatus === 'session-paid' ? 'border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400' :
                                      booking.paymentStatus === 'reservation-paid' ? 'border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400' :
                                      booking.paymentStatus === 'reservation-pending' ? 'border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                      booking.paymentStatus === 'reservation-failed' ? 'border-red-300 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400' :
                                      booking.paymentStatus === 'reservation-refunded' ? 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' :
                                      booking.paymentStatus === 'session-refunded' ? 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' :
                                      booking.paymentStatus === 'unpaid' ? 'border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400' :
                                      'border-gray-300 text-gray-700 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400'
                                    }`}
                                  >
                                    {formatPaymentStatus(booking.paymentStatus)}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-2">
                                  {booking.waiverSigned ? (
                                    <FileCheck className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <FileX className="w-4 h-4 text-orange-600" />
                                  )}
                                  <Badge 
                                    variant="outline"
                                    className={`text-xs px-2 py-1 ${
                                      booking.waiverSigned ? 'border-green-300 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400' : 
                                      'border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400'
                                    }`}
                                  >
                                    {booking.waiverSigned ? 'Waiver Signed ✓' : 'Waiver Required'}
                                  </Badge>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              {booking.status !== 'cancelled' && (
                                <div className="flex flex-col gap-2">
                                  <ParentButton
                                    size="sm"
                                    variant="secondary"
                                    className="w-full text-xs"
                                    onClick={() => handleReschedule(booking.id)}
                                  >
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Reschedule
                                  </ParentButton>
                                  <ParentButton
                                    size="sm"
                                    variant="primary"
                                    className="w-full text-xs"
                                    onClick={() => handleEditBooking(booking.id)}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </ParentButton>
                                  <ParentButton
                                    size="sm"
                                    variant="destructive"
                                    className="w-full text-xs"
                                    onClick={() => setCancelBookingId(booking.id)}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </ParentButton>
                                </div>
                              )}
                            </div>
                          </div>
                        </ParentCardContent>
                      </ParentCard>
                    ))}
                  </div>
                )}
            </ParentMainContentContainer>
          </ParentTabsContent>

          <ParentTabsContent value="past">
            <ParentMainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <BookMarked className="h-8 w-8 text-[#D8BD2A]" />
                  Adventure Log
                </span>
              }
            >
                {pastBookings.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-4">🎯</div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-1">No adventures completed yet!</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">Complete your first session to start tracking progress</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Modern Adventure Log Metrics */}
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-[#0F0276] dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                        Progress Summary
                      </h3>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                        <ParentCard className="hover:shadow-md transition-all duration-200">
                          <ParentCardContent className="pt-4 pb-4 px-4 sm:pt-6 sm:pb-6 sm:px-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 sm:p-3 rounded-full">
                                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 truncate">Sessions Completed</p>
                                <p className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-white">{pastBookings.length}</p>
                              </div>
                            </div>
                          </ParentCardContent>
                        </ParentCard>
                        
                        <ParentCard className="hover:shadow-md transition-all duration-200">
                          <ParentCardContent className="pt-4 pb-4 px-4 sm:pt-6 sm:pb-6 sm:px-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 sm:p-3 rounded-full">
                                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 truncate">Skills Practiced</p>
                                <p className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-white">
                                  {pastBookings.reduce((total, booking) => {
                                    return total + (booking.focusAreas?.length || 0);
                                  }, 0)}
                                </p>
                              </div>
                            </div>
                          </ParentCardContent>
                        </ParentCard>
                        
                        <ParentCard className="hover:shadow-md transition-all duration-200">
                          <ParentCardContent className="pt-4 pb-4 px-4 sm:pt-6 sm:pb-6 sm:px-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 sm:p-3 rounded-full">
                                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 truncate">Adventure Level</p>
                                <p className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-white">Level {Math.floor(pastBookings.length / 3) + 1}</p>
                              </div>
                            </div>
                          </ParentCardContent>
                        </ParentCard>
                        
                        <ParentCard className="hover:shadow-md transition-all duration-200">
                          <ParentCardContent className="pt-4 pb-4 px-4 sm:pt-6 sm:pb-6 sm:px-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 sm:p-3 rounded-full">
                                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 truncate">Consistency</p>
                                <p className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-white">
                                  {(() => {
                                    const sessionsPerMonth = pastBookings.length / Math.max(1, 
                                      Math.ceil((new Date().getTime() - new Date(Math.min(...pastBookings.map(b => b.createdAt ? new Date(b.createdAt).getTime() : Date.now()))).getTime()) / (1000 * 60 * 60 * 24 * 30))
                                    );
                                    if (sessionsPerMonth >= 4) return "Excellent 🔥";
                                    if (sessionsPerMonth >= 2) return "Good ⚡";
                                    return "Building 💪";
                                  })()}
                                </p>
                              </div>
                            </div>
                          </ParentCardContent>
                        </ParentCard>
                      </div>
                      
                      {/* Progress Bar */}
                      <ParentCard className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700">
                        <ParentCardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Progress to Next Level
                            </span>
                            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                              Level {Math.floor(pastBookings.length / 3) + 1}
                            </span>
                          </div>
                          <div className="w-full bg-yellow-200 dark:bg-yellow-800/30 rounded-full h-3 relative overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-yellow-400 to-orange-400 dark:from-yellow-500 dark:to-orange-500 h-3 rounded-full transition-all duration-500 relative"
                              style={{ width: `${Math.min(((pastBookings.length % 3) / 3) * 100, 100)}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                            </div>
                          </div>
                          <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 text-center">
                            {pastBookings.length % 3 === 0 && pastBookings.length > 0 
                              ? "🎉 Level Complete! Ready for the next challenge!"
                              : `${3 - (pastBookings.length % 3)} more sessions to level up! 🎯`
                            }
                          </div>
                        </ParentCardContent>
                      </ParentCard>
                    </div>

                    {/* Adventure Log Entries */}
                    <div className="space-y-4">
                      <h3 className="text-base xs:text-lg font-semibold text-[#0F0276] dark:text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Adventure History
                        <span className="text-xs font-normal text-[#0F0276] dark:text-white">({pastBookings.length} completed)</span>
                      </h3>
                      
                      {pastBookings.map((booking) => (
                        <ParentCard 
                          key={booking.id}
                          className="group hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          <ParentCardContent className="p-3 xs:p-4 sm:p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Left Column - Session Info */}
                            <div className="space-y-3 sm:space-y-4">
                              {/* Athlete and Date */}
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1 xs:mb-2">
                                    <div className="bg-blue-100 dark:bg-blue-900/50 p-1 rounded-full">
                                      <User className="w-3 h-3 xs:w-4 xs:h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="font-medium text-sm xs:text-base sm:text-lg text-[#B8860B]">
                                      {booking.athletes && booking.athletes.length > 0 ? (
                                        booking.athletes.map((athlete: any) => athlete.name).join(' & ')
                                      ) : (
                                        <>
                                          {booking.athlete1Name}
                                          {booking.athlete2Name && ` & ${booking.athlete2Name}`}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
                                      {booking.preferredDate ? format(new Date(`${booking.preferredDate}T12:00:00Z`), 'MMM d, yyyy') : 'Date TBD'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
                                      {formatTime(booking.preferredTime) || 'Time TBD'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <User className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
                                      {booking.coachName || 'Coach Will'}
                                    </div>
                                  </div>
                                </div>
                                {booking.status === 'cancelled' ? (
                                  <Badge 
                                    variant="outline"
                                    className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700 text-[10px] xs:text-xs h-auto py-0.5"
                                  >
                                    ❌ Cancelled
                                  </Badge>
                                ) : (
                                  <Badge 
                                    variant="outline"
                                    className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 text-[10px] xs:text-xs h-auto py-0.5"
                                  >
                                    ✅ Completed
                                  </Badge>
                                )}
                              </div>

                              {/* Focus Areas */}
                              {booking.focusAreas && booking.focusAreas.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-xs xs:text-sm text-gray-700 dark:text-gray-300 mb-1 xs:mb-2 flex items-center gap-1 xs:gap-2">
                                    <Target className="w-3 h-3 xs:w-4 xs:h-4 text-blue-600 dark:text-blue-400" />
                                    Skills Practiced
                                  </h4>
                                  <div className="flex flex-wrap gap-1 xs:gap-2">
                  {booking.focusAreas.map((area: FocusAreaDisplay, index: number) => (
                                      <Badge 
                                        key={index}
                                        variant="secondary"
                                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700 text-[10px] xs:text-xs h-auto py-0.5"
                                      >
                    {typeof area === 'string' ? area : ('name' in area ? area.name : 'Unknown')}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right Column - Progress & Notes */}
                            <div className="space-y-3 sm:space-y-4">
                              {/* Only show progress notes and recommendations for completed sessions, not cancelled ones */}
                              {booking.attendanceStatus === 'completed' && (
                                <>
                                  {/* Progress Note */}
                                  <div>
                                    <h4 className="font-medium text-xs xs:text-sm text-gray-700 dark:text-gray-300 mb-1 xs:mb-2 flex items-center gap-1 xs:gap-2">
                                      <TrendingUp className="w-3 h-3 xs:w-4 xs:h-4 text-green-600 dark:text-green-400" />
                                      Progress Note
                                    </h4>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-2 xs:p-3 sm:p-4 border border-gray-200 dark:border-gray-600">
                                      <p className="text-xs xs:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {booking.progressNote || 
                                         booking.adminNotes || 
                                         "Great session! The athlete showed excellent focus and made steady progress in their skills. Keep up the fantastic work! 🌟"}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Coach Recommendation (placeholder) */}
                                  <div>
                                    <h4 className="font-medium text-xs xs:text-sm text-gray-700 dark:text-gray-300 mb-1 xs:mb-2 flex items-center gap-1 xs:gap-2">
                                      <Lightbulb className="w-3 h-3 xs:w-4 xs:h-4 text-amber-600 dark:text-amber-400" />
                                      Coach Recommendation
                                    </h4>
                                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 xs:p-3 border border-amber-200 dark:border-amber-700">
                                      <p className="text-[10px] xs:text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                                        {(() => {
                                          if (booking.focusAreas?.some((area: any) => typeof area === 'object' && typeof area.name === 'string' && area.name.includes('Tumbling'))) {
                                            return "Continue working on tumbling fundamentals. Practice at home with forward rolls on soft surfaces!";
                                          }
                                          if (booking.focusAreas?.some((area: any) => typeof area === 'object' && typeof area.name === 'string' && area.name.includes('Beam'))) {
                                            return "Great balance work! Practice walking on lines at home to improve beam skills.";
                                          }
                                          if (booking.focusAreas?.some((area: any) => typeof area === 'object' && typeof area.name === 'string' && area.name.includes('Flexibility'))) {
                                            return "Keep up the daily stretching routine. Consistency is key for flexibility gains!";
                                          }
                                          return "Excellent progress! Continue practicing basic movements and building strength at home.";
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {/* Show cancellation info for cancelled bookings */}
                              {(booking.status === 'cancelled' || booking.attendanceStatus === 'cancelled') && (
                                <div>
                                  <h4 className="font-medium text-xs xs:text-sm text-gray-700 dark:text-gray-300 mb-1 xs:mb-2 flex items-center gap-1 xs:gap-2">
                                    <XCircle className="w-3 h-3 xs:w-4 xs:h-4 text-red-600 dark:text-red-400" />
                                    Booking Status
                                  </h4>
                                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 xs:p-3 border border-red-200 dark:border-red-700">
                                    <p className="text-xs xs:text-sm text-red-800 dark:text-red-300">
                                      This booking was cancelled.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          </ParentCardContent>
                        </ParentCard>
                      ))}
                    </div>

                    {/* Export Option */}
                    <div className="border-t pt-4 xs:pt-6">
                      <div className="flex flex-col xs:flex-row justify-between xs:items-center gap-3">
                        <div>
                          <h4 className="font-medium text-sm xs:text-base text-white flex items-center gap-1 xs:gap-2">
                            <FileText className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-white" />
                            Export Progress Report
                          </h4>
                          <p className="text-[10px] xs:text-xs text-white">Download a complete progress report for your records</p>
                        </div>
                        <ParentButton 
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement PDF export
                            toast({
                              title: "Feature Coming Soon! 🚀",
                              description: "PDF export will be available in the next update.",
                            });
                          }}
                        className="flex items-center gap-2 text-xs h-8 xs:h-9"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export PDF
                      </ParentButton>
                    </div>
                  </div>
                </div>
                )}
            </ParentMainContentContainer>
          </ParentTabsContent>

          <ParentTabsContent value="athletes">
            <ParentMainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <Users className="h-8 w-8 text-[#D8BD2A]" />
                  Your Athletes
                </span>
              }
            >
                {athletes.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-4">👤</div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-1">No athletes registered</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">Add athletes to get started with bookings</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                    {athletes.map((athlete) => (
                      <div key={athlete.id} className="border border-slate-200/60 rounded-xl p-3 xs:p-4 bg-gradient-to-r from-white to-blue-50/50 hover:shadow-md transition-all duration-200 dark:border-purple-400/20 dark:from-purple-900/20 dark:to-blue-900/20">
                        <div className="flex justify-between items-start mb-2 xs:mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-full">
                              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="font-semibold text-sm xs:text-base sm:text-lg text-[#B8860B] dark:text-[#B8860B]">{athlete.name}</h3>
                          </div>
                          <ParentButton
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs px-2"
                            onClick={() => setEditingAthleteId(athlete.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            <span className="hidden xs:inline">View Details</span>
                            <span className="xs:hidden">View</span>
                          </ParentButton>
                        </div>
                        
                        <div className="space-y-2 mt-3">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#0F0276] dark:text-white" />
                            <p className="text-xs xs:text-sm text-[#0F0276] dark:text-white">
                              Born: {athlete.dateOfBirth ? format(new Date(`${athlete.dateOfBirth}T12:00:00Z`), 'MMM d, yyyy') : 'Unknown'}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <Medal className="w-3.5 h-3.5 text-[#0F0276] dark:text-white" />
                            <p className="text-xs xs:text-sm text-[#0F0276] dark:text-white">
                              Experience: {athlete.experience}
                            </p>
                          </div>
                          
                          {athlete.allergies && (
                            <div className="flex items-start gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-orange-500 mt-0.5" />
                              <div>
                                <p className="text-xs xs:text-sm font-medium text-[#0F0276] dark:text-white">
                                  Allergies:
                                </p>
                                <p className="text-[10px] xs:text-xs text-[#0F0276] dark:text-white">{athlete.allergies}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 flex justify-center">
                  <ParentButton 
                    variant="success"
                    onClick={() => setShowAddAthleteModal(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add New Athlete
                  </ParentButton>
                </div>
            </ParentMainContentContainer>
          </ParentTabsContent>

          <ParentTabsContent value="profile">
            <ParentMainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <UserCircle className="h-8 w-8 text-[#D8BD2A]" />
                  My Information
                </span>
              }
            >
                {/* Game-Style Statistics Dashboard - Moved to Top */}
                {authStatus?.email && (
                  <div className="mb-6">
                    <h4 className="font-medium text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      Adventure Progress
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">🎮</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                      <ParentStatCard
                        label="Total Quests"
                        value={bookings.length}
                        icon={<Star />}
                        color="blue"
                      />
                      <ParentStatCard
                        label="Active Heroes"
                        value={athletes.length}
                        icon={<Users />}
                        color="green"
                      />
                      <ParentStatCard
                        label="Next Adventures"
                        value={upcomingBookings.length}
                        icon={<Calendar />}
                        color="orange"
                      />
                      <ParentStatCard
                        label="Victories"
                        value={bookings.filter(b => b.status === 'completed').length}
                        icon={<Trophy />}
                        color="purple"
                      />
                    </div>

                    {/* Experience Bar */}
                    <ParentCard className="mt-4 sm:mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700">
                      <ParentCardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-bold text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                            Adventure Level
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-yellow-700 dark:text-yellow-400">Level {Math.floor(bookings.filter(b => b.status === 'completed').length / 3) + 1}</span>
                        </div>
                        <div className="w-full bg-yellow-200 dark:bg-yellow-800/30 rounded-full h-2 sm:h-3 relative overflow-hidden">
                          <div 
                            className="bg-yellow-400 dark:bg-yellow-500 h-2 sm:h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(((bookings.filter(b => b.status === 'completed').length % 3) / 3) * 100, 100)}%` }}
                          >
                          </div>
                        </div>
                        <div className="text-[10px] sm:text-xs text-yellow-700 dark:text-yellow-400 mt-1 text-center">
                          {3 - (bookings.filter(b => b.status === 'completed').length % 3)} more sessions to level up! 🎯
                        </div>
                      </ParentCardContent>
                    </ParentCard>
                  </div>
                )}

                {authStatus?.email && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Personal Information */}
                    <div className="bg-gradient-to-r from-white to-purple-50/50 p-3 sm:p-4 rounded-xl border border-purple-100/60 shadow-sm hover:shadow-md transition-all dark:from-purple-900/20 dark:to-purple-800/20 dark:border-purple-400/20">
                      <h4 className="font-medium text-base sm:text-lg text-purple-800 dark:text-purple-300 flex items-center gap-2 mb-3 sm:mb-4">
                        <User className="w-4 h-4" />
                        Personal Information
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="bg-white/70 dark:bg-purple-900/30 p-2 sm:p-3 rounded-lg">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white">{parentInfo?.firstName || 'Not provided'}</p>
                        </div>
                        <div className="bg-white/70 dark:bg-purple-900/30 p-2 sm:p-3 rounded-lg">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white">{parentInfo?.lastName || 'Not provided'}</p>
                        </div>
                        <div className="bg-white/70 dark:bg-purple-900/30 p-2 sm:p-3 rounded-lg">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white">{parentInfo?.email || authStatus.email}</p>
                        </div>
                        <div className="bg-white/70 dark:bg-purple-900/30 p-2 sm:p-3 rounded-lg">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white">{parentInfo?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-gradient-to-r from-white to-red-50/50 p-3 sm:p-4 rounded-xl border border-red-100/60 shadow-sm hover:shadow-md transition-all dark:from-red-900/20 dark:to-red-800/20 dark:border-red-400/20">
                      <h4 className="font-medium text-base sm:text-lg text-red-800 dark:text-red-300 flex items-center gap-2 mb-3 sm:mb-4">
                        <AlertCircle className="w-4 h-4" />
                        Emergency Contact
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="bg-white/70 dark:bg-red-900/30 p-2 sm:p-3 rounded-lg">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Emergency Contact Name</label>
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white">{parentInfo?.emergencyContactName || 'Not provided'}</p>
                        </div>
                        <div className="bg-white/70 dark:bg-red-900/30 p-2 sm:p-3 rounded-lg">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Emergency Contact Phone</label>
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white">{parentInfo?.emergencyContactPhone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {authStatus?.email && (
                  <div>
                    {/* Account Actions */}
                    <div className="border-t border-slate-200/60 dark:border-purple-400/20 pt-4 sm:pt-6">
                      <h4 className="font-medium text-base sm:text-lg text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        Account Actions
                      </h4>
                      <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                        <ParentButton 
                          size="sm"
                          variant="secondary"
                          onClick={() => setShowUpdateProfile(true)}
                          className="h-9 text-xs sm:text-sm"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          Update Profile
                        </ParentButton>
                        <ParentButton 
                          size="sm"
                          variant="secondary"
                          onClick={() => setShowSafetyInfo(true)}
                          className="h-9 text-xs sm:text-sm bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-400/20 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                        >
                          <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                          Safety Info
                        </ParentButton>
                        <ParentButton 
                          size="sm"
                          variant="secondary"
                          onClick={() => setShowUpdateEmergencyContact(true)}
                          className="h-9 text-xs sm:text-sm"
                        >
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          Update Emergency Contact
                        </ParentButton>
                      </div>
                    </div>
                  </div>
                )}
            </ParentMainContentContainer>
          </ParentTabsContent>

          <ParentTabsContent value="waivers">
            <ParentMainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <FileText className="h-8 w-8 text-[#D8BD2A]" />
                  Waivers & Documents
                </span>
              }
            >
              <ParentWaiverManagement />
            </ParentMainContentContainer>
          </ParentTabsContent>

          <ParentTabsContent value="settings">
            <ParentMainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <Settings className="h-8 w-8 text-[#D8BD2A]" />
                  Settings & Preferences
                </span>
              }
            >
              <div className="space-y-6">
                {/* Notification Settings */}
                <ParentCard>
                  <ParentCardHeader>
                    <ParentCardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Notification Preferences
                    </ParentCardTitle>
                  </ParentCardHeader>
                  <ParentCardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-900 dark:text-[#D8BD2A]">Email Notifications</div>
                        <div className="text-sm text-gray-500 dark:text-white">
                          Receive booking confirmations and updates via email
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-900 dark:text-[#D8BD2A]">SMS Notifications</div>
                        <div className="text-sm text-gray-500 dark:text-white">
                          Get text reminders for upcoming sessions
                        </div>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-900 dark:text-[#D8BD2A]">Session Reminders</div>
                        <div className="text-sm text-gray-500 dark:text-white">
                          24-hour reminders for upcoming sessions
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </ParentCardContent>
                </ParentCard>

                {/* Privacy & Security */}
                <ParentCard>
                  <ParentCardHeader>
                    <ParentCardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Privacy & Security
                    </ParentCardTitle>
                  </ParentCardHeader>
                  <ParentCardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-900 dark:text-[#D8BD2A]">Marketing Communications</div>
                        <div className="text-sm text-gray-500 dark:text-white">
                          Receive updates about new programs and events
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </ParentCardContent>
                </ParentCard>

                {/* Account Actions */}
                <ParentCard>
                  <ParentCardHeader>
                    <ParentCardTitle className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5" />
                      Account Actions
                    </ParentCardTitle>
                  </ParentCardHeader>
                  <ParentCardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ParentButton variant="secondary" className="justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export My Data
                      </ParentButton>
                      
                      <ParentButton variant="secondary" className="justify-start">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Support
                      </ParentButton>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Need help or have questions? Coach Will is here to assist you.
                      </p>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <p>📧 Email: admin@coachwilltumbles.com</p>
                        <p>📞 Phone: (585) 755-8122</p>
                      </div>
                    </div>
                  </ParentCardContent>
                </ParentCard>
              </div>
            </ParentMainContentContainer>
          </ParentTabsContent>
        </ParentTabs>
        </section>
      </ParentContentContainer>
    </ParentMainContainer>

    {/* Modals */}
    {/* Athlete Detail Modal */}
    <ParentAthleteDetailDialog
          open={editingAthleteId !== null}
          onOpenChange={(open) => {
            // Only update when actually closing, to avoid cascaded state churn
            if (!open) setEditingAthleteId(null);
          }}
          athlete={editingAthleteId ? athletes.find(a => a.id === editingAthleteId) || null : null}
          onBookSession={() => {
            const athlete = athletes.find(a => a.id === editingAthleteId);
            if (athlete) {
              setEditingAthleteId(null); // Close this modal
              setSelectedAthleteForBooking(athlete);
              setShowBookingModal(true);
            }
          }}
          onEditAthlete={() => {
            const athlete = athletes.find(a => a.id === editingAthleteId);
            if (athlete) {
              setEditingAthleteInfo(athlete);
              setEditingAthleteGender(athlete.gender || '');
              setEditingAthleteId(null); // Close this modal
            }
          }}
          showActionButtons={true}
        />

        {/* Direct Booking Modal for Logged-in Parents */}
        <UnifiedBookingModal 
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedAthleteForBooking(null);
          }}
          parentData={parentInfo || undefined}
          selectedAthletes={selectedAthleteForBooking ? [{
            id: selectedAthleteForBooking.id,
            parentId: selectedAthleteForBooking.parentId,
            name: selectedAthleteForBooking.name,
            firstName: selectedAthleteForBooking.firstName,
            lastName: selectedAthleteForBooking.lastName,
            dateOfBirth: selectedAthleteForBooking.dateOfBirth,
            gender: selectedAthleteForBooking.gender,
            allergies: selectedAthleteForBooking.allergies || '',
            experience: selectedAthleteForBooking.experience,
            photo: selectedAthleteForBooking.photo,
            isGymMember: selectedAthleteForBooking.isGymMember ?? false,
            createdAt: new Date(),
            updatedAt: new Date(),
            latestWaiverId: selectedAthleteForBooking.latestWaiverId,
            waiverStatus: selectedAthleteForBooking.waiverStatus,
            waiverSigned: selectedAthleteForBooking.waiverSigned || false,
            tenantId: (selectedAthleteForBooking as any).tenantId || '00000000-0000-0000-0000-000000000001'
          }] : Array.isArray(athletes) ? athletes.map(athlete => ({
            ...athlete,
            isGymMember: athlete.isGymMember ?? false,
            waiverSigned: athlete.waiverSigned || false,
            tenantId: (athlete as any).tenantId || '00000000-0000-0000-0000-000000000001'
          })) : []}
          isNewParent={false}
        />

        {/* Reschedule Booking Modal */}
        <ParentModal 
          isOpen={reschedulingBookingId !== null} 
          onClose={() => setReschedulingBookingId(null)}
          title="Reschedule Booking"
          description="Choose a new date and time for your lesson"
          size="lg"
        >
          <div className="max-h-[60vh] sm:max-h-none overflow-y-auto px-1">
            {reschedulingBookingId && (() => {
              const booking = bookings.find(b => b.id === reschedulingBookingId);
              if (!booking) return null;

              return <RescheduleForm booking={booking} onSubmit={(date, time) => {
                rescheduleBookingMutation.mutate({
                  id: booking.id,
                  date,
                  time
                });
              }} onCancel={() => setReschedulingBookingId(null)} />;
            })()}
          </div>
        </ParentModal>

        {/* Edit Booking Modal */}
        <ParentModal 
          isOpen={editingBookingId !== null} 
          onClose={() => setEditingBookingId(null)}
          title="Edit Booking Details"
          description="Update lesson focus areas, safety information, and special notes"
          size="xl"
        >
          <div className="max-h-[60vh] sm:max-h-none overflow-y-auto px-1">
            {editingBookingId && (() => {
              const booking = bookings.find(b => b.id === editingBookingId);
              if (!booking) return null;

              return (
                <div className="space-y-6">
                  <ParentModalSection title="Current Booking Information">
                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                      <div>
                        <span className="font-medium">Current Focus Areas:</span>
                        <p className="mt-1">{formatFocusAreas((booking.focusAreas || []) as unknown as FocusAreaDisplay[])}</p>
                      </div>
                      <div>
                        <span className="font-medium">Lesson Details:</span>
                        <p className="mt-1">
                          <span className="text-[#B8860B]">{booking.athlete1Name}</span>
                          {booking.athlete2Name && <span className="text-[#B8860B]"> & {booking.athlete2Name}</span>} - 
                          {booking.lessonType?.replace('-', ' ') || 'Unknown Lesson Type'} on {booking.preferredDate} at {formatTime(booking.preferredTime)}
                        </p>
                      </div>
                    </div>
                  </ParentModalSection>

                  <EditBookingForm booking={booking} onClose={() => setEditingBookingId(null)} />
                </div>
              );
            })()}
          </div>
        </ParentModal>

        {/* Cancel Booking Modal */}
        <BookingCancellationModal
          isOpen={cancelBookingId !== null}
          onClose={() => setCancelBookingId(null)}
          booking={cancelBookingId ? bookings.find(b => b.id === cancelBookingId) || null : null}
          onSuccess={() => {
            // Additional success handling if needed
            setCancelBookingId(null);
          }}
        />

        {/* Edit Athlete Modal */}
        <ParentModal
          isOpen={editingAthleteInfo !== null}
          onClose={() => {
            setEditingAthleteInfo(null);
            setEditingAthleteGender('');
            setEditingAthleteIsGymMember(false);
            setEditingAthleteExperience('');
            setEditingAthleteFirstName('');
            setEditingAthleteLastName('');
            setEditingAthleteDateOfBirth('');
            setEditingAthleteAllergies('');
          }}
          title="Edit Athlete Information"
          description="Update athlete details and preferences"
          size="lg"
          closeOnEscape={false}
          closeOnOutsideClick={true}
        >
          <div className="max-h-[45vh] sm:max-h-[55vh] md:max-h-none overflow-y-auto px-1">
            {editingAthleteInfo && (() => {
              const athlete = editingAthleteInfo;
              if (!athlete) return null;

              return (
                <div className="space-y-4 sm:space-y-6">
              <ParentModalSection title="Basic Information">
                <ParentModalGrid>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="athlete-firstName" className="text-[#0F0276] dark:text-white text-sm">First Name</Label>
                    <ParentFormInput
                      key={`firstName-${editingAthleteInfo?.id ?? 'new'}`}
                      id="athlete-firstName"
                      value={editingAthleteFirstName}
                      onChange={(e) => setEditingAthleteFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="athlete-lastName" className="text-[#0F0276] dark:text-white text-sm">Last Name</Label>
                    <ParentFormInput
                      key={`lastName-${editingAthleteInfo?.id ?? 'new'}`}
                      id="athlete-lastName"
                      value={editingAthleteLastName}
                      onChange={(e) => setEditingAthleteLastName(e.target.value)}
                    />
                  </div>
                </ParentModalGrid>
              </ParentModalSection>

              <ParentModalSection title="Personal Details">
                <div className="space-y-2 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="athlete-dob" className="text-[#0F0276] dark:text-white text-sm">Date of Birth</Label>
                    <ParentFormInput
                      key={`dob-${editingAthleteInfo?.id ?? 'new'}`}
                      id="athlete-dob"
                      type="date"
                      value={editingAthleteDateOfBirth}
                      onChange={(e) => setEditingAthleteDateOfBirth(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="athlete-gender" className="text-[#0F0276] dark:text-white text-sm">Gender</Label>
                    <GenderSelect
                      key={`gender-${editingAthleteInfo?.id ?? 'new'}`}
                      value={editingAthleteGender}
                      onValueChange={setEditingAthleteGender}
                      id="athlete-gender"
                      name="gender"
                    />
                  </div>
                </div>
              </ParentModalSection>

              <ParentModalSection title="Experience & Membership">
                <div className="space-y-2 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="athlete-gymmember" className="text-[#0F0276] dark:text-white text-sm">Already in Gym Classes?</Label>
                    <div className="flex items-center justify-between rounded-md border p-2 sm:p-3 border-gray-300 dark:border-[#B8860B]">
                      <div>
                        <p className="font-medium text-[#0F0276] dark:text-white text-sm">Gym Member</p>
                        <p className="text-xs sm:text-sm text-[#0F0276]/60 dark:text-white/60">Toggle on if this athlete is already enrolled in gym classes.</p>
                      </div>
                      <Switch
                        id="athlete-gymmember"
                        checked={editingAthleteIsGymMember}
                        onCheckedChange={setEditingAthleteIsGymMember}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="athlete-experience" className="text-[#0F0276] dark:text-white text-sm">Experience Level</Label>
                    <Select 
                      key={`experience-${editingAthleteInfo?.id ?? 'new'}`}
                      value={editingAthleteExperience} 
                      onValueChange={setEditingAthleteExperience}
                    >
                      <ParentFormSelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </ParentFormSelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="elite">Elite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </ParentModalSection>

              <ParentModalSection title="Additional Information">
                <div className="space-y-2 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="athlete-allergies" className="text-[#0F0276] dark:text-white text-sm">Allergies & Medical Notes</Label>
                    {/* Stable key to prevent remounts if props around change; */}
                    <ParentFormTextarea
                      key={`allergies-${editingAthleteInfo?.id ?? 'new'}`}
                      id="athlete-allergies"
                      value={editingAthleteAllergies}
                      onChange={(e) => setEditingAthleteAllergies(e.target.value)}
                      placeholder="Enter any allergies or medical notes..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              </ParentModalSection>

              <div className="flex justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditingAthleteInfo(null);
                    setEditingAthleteGender('');
                    setEditingAthleteIsGymMember(false);
                    setEditingAthleteExperience('');
                    setEditingAthleteFirstName('');
                    setEditingAthleteLastName('');
                    setEditingAthleteDateOfBirth('');
                    setEditingAthleteAllergies('');
                  }}
                  className="text-[#0F0276] border-[#0F0276]/50 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/50 dark:hover:bg-white/20 text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      const updateData = {
                        firstName: editingAthleteFirstName,
                        lastName: editingAthleteLastName,
                        name: `${editingAthleteFirstName} ${editingAthleteLastName}`,
                        dateOfBirth: editingAthleteDateOfBirth,
                        gender: editingAthleteGender,
                        allergies: editingAthleteAllergies || null,
                        experience: editingAthleteExperience,
                        isGymMember: editingAthleteIsGymMember
                      };

                      await apiRequest('PUT', `/api/parent/athletes/${editingAthleteInfo.id}`, updateData);

                      // Invalidate queries to refresh data
                      queryClient.invalidateQueries({ queryKey: ['/api/parent/athletes'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/parent/bookings'] });

                      toast({
                        title: "Athlete Updated",
                        description: "Athlete information has been updated successfully.",
                      });
                      setEditingAthleteInfo(null);
                      setEditingAthleteGender('');
                      setEditingAthleteIsGymMember(false);
                      setEditingAthleteExperience('');
                      setEditingAthleteFirstName('');
                      setEditingAthleteLastName('');
                      setEditingAthleteDateOfBirth('');
                      setEditingAthleteAllergies('');
                    } catch (error) {
                      toast({
                        title: "Update Failed",
                        description: "Failed to update athlete information. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="bg-[#0F0276] hover:bg-[#0F0276]/90 text-white dark:bg-[#B8860B] dark:hover:bg-[#B8860B]/90 dark:text-[#0F0276] text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  Save Changes
                </Button>
              </div>
            </div>
              );
            })()}
          </div>
        </ParentModal>

        {/* Update Profile Modal */}
        <ParentModal 
          isOpen={showUpdateProfile} 
          onClose={() => setShowUpdateProfile(false)}
          title="Update Profile"
          description="Update your personal information and contact details"
          size="lg"
        >
          <ParentModalSection>
            <ParentModalGrid>
              <div>
                <Label htmlFor="profile-first-name" className="text-sm font-medium text-gray-700 dark:text-white">
                  First Name
                </Label>
                <ParentFormInput
                  id="profile-first-name"
                  defaultValue={parentInfo?.firstName || ''}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label htmlFor="profile-last-name" className="text-sm font-medium text-gray-700 dark:text-white">
                  Last Name
                </Label>
                <ParentFormInput
                  id="profile-last-name"
                  defaultValue={parentInfo?.lastName || ''}
                  placeholder="Enter your last name"
                />
              </div>
            </ParentModalGrid>

            <div className="space-y-4">
              <div>
                <Label htmlFor="profile-email" className="text-sm font-medium text-gray-700 dark:text-white">
                  Email Address
                </Label>
                <ParentFormInput
                  id="profile-email"
                  type="email"
                  defaultValue={parentInfo?.email || authStatus?.email || ''}
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <Label htmlFor="profile-phone" className="text-sm font-medium text-gray-700 dark:text-white">
                  Phone Number
                </Label>
                <ParentFormInput
                  id="profile-phone"
                  type="tel"
                  defaultValue={parentInfo?.phone || ''}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
              <ParentButton variant="secondary" onClick={() => setShowUpdateProfile(false)}>
                Cancel
              </ParentButton>
              <ParentButton onClick={() => {
                toast({
                  title: "Profile Updated",
                  description: "Your profile information has been updated successfully.",
                });
                setShowUpdateProfile(false);
              }}>
                Save Changes
              </ParentButton>
            </div>
          </ParentModalSection>
        </ParentModal>

        {/* Update Emergency Contact Modal */}
        <ParentModal 
          isOpen={showUpdateEmergencyContact} 
          onClose={() => setShowUpdateEmergencyContact(false)}
          title="Update Emergency Contacts"
          description="Manage your emergency contact information for athlete safety"
          size="xl"
        >
          <div className="max-h-[60vh] sm:max-h-none overflow-y-auto px-1">
            <ParentModalSection title="Primary Emergency Contact">
              <ParentModalGrid>
                <div>
                  <Label htmlFor="emergency-1-name" className="text-sm font-medium text-gray-700 dark:text-white">
                    Contact Name
                  </Label>
                  <ParentFormInput
                    id="emergency-1-name"
                    defaultValue={parentInfo?.emergencyContactName || ''}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency-1-phone" className="text-sm font-medium text-gray-700 dark:text-white">
                    Phone Number
                  </Label>
                  <ParentFormInput
                    id="emergency-1-phone"
                    type="tel"
                    defaultValue={parentInfo?.emergencyContactPhone || ''}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="emergency-1-relationship" className="text-sm font-medium text-gray-700 dark:text-white">
                    Relationship
                  </Label>
                  <Select defaultValue="parent">
                    <ParentFormSelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </ParentFormSelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="grandparent">Grandparent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="aunt-uncle">Aunt/Uncle</SelectItem>
                      <SelectItem value="family-friend">Family Friend</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </ParentModalGrid>
            </ParentModalSection>

            <ParentModalSection title="Secondary Emergency Contact">
              <ParentModalGrid>
                <div>
                  <Label htmlFor="emergency-2-name" className="text-sm font-medium text-gray-700 dark:text-white">
                    Contact Name
                  </Label>
                  <ParentFormInput
                    id="emergency-2-name"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency-2-phone" className="text-sm font-medium text-gray-700 dark:text-white">
                    Phone Number
                  </Label>
                  <ParentFormInput
                    id="emergency-2-phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="emergency-2-relationship" className="text-sm font-medium text-gray-700 dark:text-white">
                    Relationship
                  </Label>
                  <Select>
                    <ParentFormSelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </ParentFormSelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="grandparent">Grandparent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="aunt-uncle">Aunt/Uncle</SelectItem>
                      <SelectItem value="family-friend">Family Friend</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </ParentModalGrid>
            </ParentModalSection>

            <ParentModalSection title="Additional Emergency Contact (Optional)">
              <ParentModalGrid>
                <div>
                  <Label htmlFor="emergency-3-name" className="text-sm font-medium text-gray-700 dark:text-white">
                    Contact Name
                  </Label>
                  <ParentFormInput
                    id="emergency-3-name"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency-3-phone" className="text-sm font-medium text-gray-700 dark:text-white">
                    Phone Number
                  </Label>
                  <ParentFormInput
                    id="emergency-3-phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="emergency-3-relationship" className="text-sm font-medium text-gray-700 dark:text-white">
                    Relationship
                  </Label>
                  <Select>
                    <ParentFormSelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </ParentFormSelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="grandparent">Grandparent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="aunt-uncle">Aunt/Uncle</SelectItem>
                      <SelectItem value="family-friend">Family Friend</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </ParentModalGrid>
            </ParentModalSection>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <ParentButton variant="secondary" onClick={() => setShowUpdateEmergencyContact(false)}>
              Cancel
            </ParentButton>
            <ParentButton onClick={() => {
              toast({
                title: "Emergency Contacts Updated",
                description: "Your emergency contact information has been updated successfully.",
              });
              setShowUpdateEmergencyContact(false);
            }}>
              Save Contacts
            </ParentButton>
          </div>
        </ParentModal>

        {/* Waiver Modal */}
        {selectedAthleteForWaiver && (
          <UpdatedWaiverModal
            isOpen={showWaiverModal}
            onClose={() => {
              setShowWaiverModal(false);
              setSelectedAthleteForWaiver(null);
            }}
            onWaiverSigned={(waiverData) => {
              toast({
                title: "Waiver Signed Successfully",
                description: `Digital waiver completed for ${selectedAthleteForWaiver.name}`,
              });
              setShowWaiverModal(false);
              setSelectedAthleteForWaiver(null);
              queryClient.invalidateQueries({ queryKey: ['/api/parent/bookings'] });
              queryClient.invalidateQueries({ queryKey: ['/api/parent/athletes'] });
            }}
            bookingData={{
              athleteName: selectedAthleteForWaiver.name,
              parentName: `${parentInfo?.firstName || ''} ${parentInfo?.lastName || ''}`.trim(),
              relationshipToAthlete: "Parent/Guardian",
              emergencyContactNumber: parentInfo?.phone || "",
            }}
            athleteId={selectedAthleteForWaiver.id}
            parentId={parentInfo?.id || 0}
          />
        )}

        {/* Add Athlete Modal */}
        <AddAthleteModal
          isOpen={showAddAthleteModal}
          onClose={() => setShowAddAthleteModal(false)}
        />

    {/* Safety Information Dialog */}
    <SafetyInformationDialog
      open={showSafetyInfo}
      onOpenChange={setShowSafetyInfo}
      parentInfo={parentInfo || undefined}
      hasCurrentBookings={upcomingBookings.length > 0}
    />
    </>
  );
}

export default ParentDashboard;