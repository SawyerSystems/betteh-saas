import { EnhancedScheduleManager } from "@/components/admin/EnhancedScheduleManager";
import { ActivityLogPage } from "@/components/ActivityLogPage";
import { AthleteDetailDialog } from "@/components/AthleteDetailDialog";
import { GenderSelect } from "@/components/GenderSelect";
import { PaymentsTab } from "@/components/PaymentsTab";
import { UnifiedBookingModal } from "@/components/UnifiedBookingModal";
import { UpcomingSessions } from "@/components/UpcomingSessions";
import { WaiverStatusDisplay } from "@/components/WaiverStatusDisplay";
import { AdminBookingManager } from "@/components/admin-booking-manager";
import { AdminLessonTypeManager } from "@/components/admin-lesson-type-manager";
import { AdminSiteContentManager } from "@/components/admin-site-content-manager";
import { AdminWaiverManagement } from "@/components/admin-waiver-management";
import AdminMessagesTab from "@/components/admin/AdminMessagesTab";
import AdminAnalyticsTab from "@/components/admin/AdminAnalyticsTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import AthleteProgressPage from "@/components/admin/AthleteProgressPage";
import { ContentSection, SectionBasedContentEditor } from "@/components/section-based-content-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin-ui/AdminCard";
import { AdminButton } from "@/components/admin-ui/AdminButton";
import { AdminModal, AdminModalSection, AdminModalDetailRow, AdminModalGrid } from "@/components/admin-ui/AdminModal";
import { AdminAnalyticsMetrics, type MetricCard } from "@/components/admin-ui/AdminAnalyticsMetrics";
import { AdminTabButtonsRow } from "@/components/admin-ui/AdminTabButtons";
import { AdminContentTabs } from "@/components/admin-ui/AdminContentTabs";
import { useBrand } from "@/contexts/BrandContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import AdminPayoutsTab from "@/components/admin/AdminPayoutsTab";
import { Label } from "@/components/ui/label";
import AddressAutocompleteInput from "@/components/ui/address-autocomplete-input";
import { type AddressComponents } from "@/hooks/use-address-autocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAvailability, useDeleteAvailability, useUpdateAvailability } from "@/hooks/use-availability";
import { type EventRow } from "@/hooks/use-events"; // Import only the type to prevent circular reference
import { useFixDialogAccessibility } from "@/hooks/use-fix-dialog-accessibility";
import { useToast } from "@/hooks/use-toast";
import { useMissingWaivers } from "@/hooks/use-waiver-status";
import { calculateAge } from "@/lib/dateUtils";
import { apiRequest } from "@/lib/queryClient";
// Import EventDeletionModal separately to avoid potential circular dependencies
import { EventDeletionModal, type DeletionMode } from "@/components/ui/event-deletion-modal";
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { Athlete, Availability, BlogPost, Booking, Event, InsertAthlete, InsertAvailability, InsertBlogPost, InsertEvent, Parent, Tip } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Activity,
    AlertCircle,
    Ban,
    BarChart,
  Calendar,
  CalendarDays,
  CalendarX,
    CheckCircle,
  ChevronLeft,
  ChevronRight,
    Clock,
    DollarSign,
    Dumbbell,
    Edit,
    Eye,
    FileText,
    Info,
    List,
    Loader2,
    Mail,
    Menu,
    MessageCircle,
    MessageSquare,
    Phone,
    Plus,
    RefreshCw,
    Save,
    Search,
    Settings,
    Star,
    Trash2,
    TrendingUp,
    User,
    UserCircle,
    Users,
    X
} from "lucide-react";
import { useEffect, useMemo, useState, lazy, Suspense, useCallback } from "react";
import { useLessonTypes } from "@/hooks/useLessonTypes";
import SEOHead from "@/components/SEOHead";
import { useLocation } from "wouter";
import { MainContentContainer } from "@/components/admin-ui/MainContentContainer";

// Lazy load heavy admin sub-pages to keep initial bundle light
const AdminSkillsManager = lazy(() => import("@/components/admin/AdminSkillsManager"));

export default function Admin() {
  const brand = useBrand();
  
  // Legend color map - centralized for calendar and legend consistency
  const legendColors: Record<string, { bg: string; border: string }> = {
    'Coaching: Team Meet/Competition': { bg: '#8B5CF6', border: '#7C3AED' }, // purple
    'Coaching: Practice': { bg: '#3B82F6', border: '#2563EB' }, // blue
    'Own: Team Meet/Competition': { bg: '#10B981', border: '#059669' }, // green
    'Own: Practice': { bg: '#14B8A6', border: '#0D9488' }, // teal
    'Medical Appointment': { bg: '#EF4444', border: '#DC2626' }, // red
    'Dental Appointment': { bg: '#F97316', border: '#EA580C' }, // orange
    'Meeting': { bg: '#6366F1', border: '#4F46E5' }, // indigo
    'Busy: Work': { bg: '#EAB308', border: '#CA8A04' }, // yellow
    'Busy: Personal': { bg: '#EC4899', border: '#DB2777' }, // pink
    'Default': { bg: '#6B7280', border: '#4B5563' }, // gray fallback
  };

  const [, setLocation] = useLocation();
  
  // ALL STATE HOOKS FIRST
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(window?.innerWidth >= 768); // Default to open on desktop only
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false); // Track sidebar collapsed state
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Persist active tab across refreshes to prevent hook count mismatches
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin-active-tab') || "bookings";
    }
    return "bookings";
  });
  
  // Set sidebar open state based on window size with enhanced mobile support
  useEffect(() => {
    const handleResize = () => {
      // Only auto-show sidebar on larger screens (md breakpoint)
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    
    // Add resize listener with passive option for better performance
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Initial check
    handleResize();
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [newPost, setNewPost] = useState<InsertBlogPost>({ title: "", content: "", excerpt: "", category: "", imageUrl: null });
  const [newPostSections, setNewPostSections] = useState<ContentSection[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editingPostSections, setEditingPostSections] = useState<ContentSection[]>([]);
  const [isCreateBlogPostOpen, setIsCreateBlogPostOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [editingTipSections, setEditingTipSections] = useState<ContentSection[]>([]);
  const [isCreateTipOpen, setIsCreateTipOpen] = useState(false);
  const [newTip, setNewTip] = useState({
    title: "",
    content: "",
    category: "vault",
    difficulty: "beginner",
    videoUrl: "",
  });
  const [newTipSections, setNewTipSections] = useState<ContentSection[]>([]);
  
  const [newAvailability, setNewAvailability] = useState<InsertAvailability>({
    tenantId: process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    isRecurring: true,
    isAvailable: true
  });
  
  // Unified event state management (replaces both exception and event states)
  const [newEvent, setNewEvent] = useState<Partial<InsertEvent>>({
    title: "",
    notes: "",
    location: "",
    // Address fields
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    isAllDay: false,
    timezone: "America/Los_Angeles",
    startAt: new Date(),
    endAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    recurrenceRule: null,
    recurrenceEndAt: null,
    recurrenceExceptions: [],
    isAvailabilityBlock: false,
    blockingReason: "",
    category: "", // Category for event classification and color coding
    isDeleted: false,
  });

  // Recurrence UI state
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY'>('WEEKLY');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [monthlyMode, setMonthlyMode] = useState<'DATE' | 'WEEKDAY_POS'>('DATE');
  const [recurrenceEndMode, setRecurrenceEndMode] = useState<'NEVER' | 'ON_DATE'>('NEVER');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
  
  // Truly unified modal state - single modal for all event/block operations
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  
  // Unified events only
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  // New: separate viewing state for unified events (view details modal)
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  // Event deletion modal state
  const [deletingEvent, setDeletingEvent] = useState<EventRow | null>(null);
  // Unified modal state - single modal for all operations
  const isModalOpen = isEventModalOpen || !!editingEvent;
  const isViewEventModalOpen = !!viewingEvent; // dedicated view details modal
  
  // Big Calendar localizer
  const localizer = momentLocalizer(moment);
  
  // Edit handlers
  // Legacy exception editing removed

  const handleSaveEdit = () => {
  // Legacy exception save removed
  };

  const handleCancelEdit = () => {
    // Close all modals and reset states
    setEditingEvent(null);
  setViewingEvent(null);
    setIsEventModalOpen(false);
    
    // Reset unified event form
    setNewEvent({
      title: "",
      notes: "",
      location: "",
      // Address fields
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
      isAllDay: false,
      timezone: "America/Los_Angeles",
      startAt: new Date(),
      endAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
      recurrenceRule: null,
      recurrenceEndAt: null,
      recurrenceExceptions: [],
      isAvailabilityBlock: false,
      blockingReason: "",
      isDeleted: false,
    });
    
    // Reset recurrence state
    setRecurrenceEnabled(false);
    setRecurrenceFrequency('WEEKLY');
    setSelectedWeekdays([]);
    setMonthlyMode('DATE');
    setRecurrenceEndMode('NEVER');
    setRecurrenceEndDate(null);
    
  };
  
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isAthleteViewOpen, setIsAthleteViewOpen] = useState(false);
  const [isAthleteEditOpen, setIsAthleteEditOpen] = useState(false);
  const [editIsGymMember, setEditIsGymMember] = useState<boolean>(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [isPhotoEnlarged, setIsPhotoEnlarged] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isManualBookingFromAthlete, setIsManualBookingFromAthlete] = useState(false);
  
  // Unified booking modal state
  const [showUnifiedBooking, setShowUnifiedBooking] = useState(false);
  const [adminBookingContext, setAdminBookingContext] = useState<'new-athlete' | 'existing-athlete' | 'from-athlete'>('new-athlete');
  const [preSelectedAthleteId, setPreSelectedAthleteId] = useState<number | undefined>();
  
  // Parent management state
  const [isParentEditOpen, setIsParentEditOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<any>(null);
  const [viewingParent, setViewingParent] = useState<any>(null);
  
  // Parent edit form state
  const [editParentForm, setEditParentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });
  
  // Athletes search state
  const [athleteSearchTerm, setAthleteSearchTerm] = useState<string>("");
  
  // Parents state
  const [parentSearchTerm, setParentSearchTerm] = useState<string>("");
  const [currentParentPage, setCurrentParentPage] = useState(1);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  
  // Delete athlete error state
  const [deleteAthleteError, setDeleteAthleteError] = useState<{
    athlete: Athlete;
    activeBookings: Booking[];
  } | null>(null);
  
  // Analytics state
  const [analyticsDateRange, setAnalyticsDateRange] = useState({ start: '', end: '' });
  const [analyticsLessonType, setAnalyticsLessonType] = useState('all');
  
  // Developer Settings state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteUsersConfirmOpen, setIsDeleteUsersConfirmOpen] = useState(false);
  
  // ALL UTILITY HOOKS
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fix dialog accessibility issues
  useFixDialogAccessibility();

  // Keep membership toggle in sync with selected athlete when edit opens/changes
  useEffect(() => {
    if (isAthleteEditOpen && selectedAthlete) {
      setEditIsGymMember(!!selectedAthlete.isGymMember);
    }
  }, [isAthleteEditOpen, selectedAthlete]);
  
  // Populate parent edit form when editing parent changes
  useEffect(() => {
    if (editingParent) {
      setEditParentForm({
        firstName: editingParent.first_name || editingParent.firstName || '',
        lastName: editingParent.last_name || editingParent.lastName || '',
        email: editingParent.email || '',
        phone: editingParent.phone || '',
        emergencyContactName: editingParent.emergencyContactName || editingParent.emergency_contact_name || '',
        emergencyContactPhone: editingParent.emergencyContactPhone || editingParent.emergency_contact_phone || ''
      });
    }
  }, [editingParent]);
  
  // ALL QUERIES
  const { data: authStatus, isLoading: authLoading } = useQuery<{ loggedIn: boolean; adminId?: number }>({
    queryKey: ['/api/auth/status'],
    queryFn: () => apiRequest('GET', '/api/auth/status').then(res => res.json()),
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    queryFn: () => apiRequest('GET', '/api/bookings').then(res => res.json()),
    enabled: !!authStatus?.loggedIn,
  });

  // Include archived bookings (completed, no-show, cancelled) so totals/analytics are ALL bookings
  const { data: archivedBookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/archived-bookings'],
    queryFn: () => apiRequest('GET', '/api/archived-bookings').then(res => res.json()),
    enabled: !!authStatus?.loggedIn,
  });

  const { data: blogPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog-posts'],
    queryFn: () => apiRequest('GET', '/api/blog-posts').then(res => res.json()),
    enabled: !!authStatus?.loggedIn,
  });

  const { data: tips = [] } = useQuery<Tip[]>({
    queryKey: ['/api/tips'],
    queryFn: () => apiRequest('GET', '/api/tips').then(res => res.json()),
    enabled: !!authStatus?.loggedIn,
  });

  const { data: parents = [] } = useQuery<Parent[]>({
    queryKey: ['/api/parents'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parents?limit=1000').then(res => res.json());
      // Handle paginated response format: {parents: [...], pagination: {...}}
      return response.parents || [];
    },
    enabled: !!authStatus?.loggedIn,
  });

  // Enhanced parents query with pagination and search
  const { 
    data: parentsData, 
    isLoading: parentsLoading, 
    refetch: refetchParents 
  } = useQuery({
    queryKey: ['/api/parents', { search: parentSearchTerm, page: currentParentPage, limit: 20 }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentParentPage.toString(),
        limit: '20'
      });
      
      if (parentSearchTerm.trim()) {
        params.append('search', parentSearchTerm.trim());
      }
      
      const response = await apiRequest('GET', `/api/parents?${params.toString()}`);
      return await response.json();
    },
    enabled: !!authStatus?.loggedIn,
  });

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ['/api/athletes'],
    queryFn: () => apiRequest('GET', '/api/athletes').then(res => res.json()),
    enabled: !!authStatus?.loggedIn,
  });

  // Lesson types for pricing + dynamic analytics
  const { data: lessonTypes = [] } = useLessonTypes();

  const lessonTypesById = useMemo(() => {
    const map = new Map<number, any>();
    (lessonTypes || []).forEach((lt: any) => {
      if (typeof lt?.id === 'number') map.set(lt.id, lt);
    });
    return map;
  }, [lessonTypes]);

  const lessonTypesByName = useMemo(() => {
    const map = new Map<string, any>();
    (lessonTypes || []).forEach((lt: any) => {
      if (lt?.name) map.set(lt.name, lt);
    });
    return map;
  }, [lessonTypes]);

  // Query for detailed parent information when one is selected
  const { data: selectedParentDetails } = useQuery({
    queryKey: ['/api/parents', viewingParent?.id],
    queryFn: async () => {
      if (!viewingParent?.id) return null;
      try {
        const response = await apiRequest('GET', `/api/parents/${viewingParent.id}`);
        if (!response.ok) return null; // Handle 404 gracefully
        return await response.json();
      } catch (error) {
        console.warn(`Parent ${viewingParent.id} not found:`, error);
        return null;
      }
    },
    enabled: !!authStatus?.loggedIn && !!viewingParent?.id,
    retry: false, // Don't retry 404s
  });

  const { data: availability = [] } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
    queryFn: () => apiRequest("GET", "/api/availability").then(res => res.json()),
    enabled: !!authStatus?.loggedIn,
  });

  // Legacy availability exceptions removed from UI

  // Events queries - calculate date range for calendar expansion
  const calendarRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1); // Start of current year
    const end = new Date(now.getFullYear() + 1, 11, 31); // End of next year
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }, []);

  // Use events query with proper auth checks
  const { data: events = [] } = useQuery<EventRow[]>({
    queryKey: ["/api/events", calendarRange.start, calendarRange.end],
    queryFn: async () => {
      if (!authStatus?.loggedIn) {
        // Return empty array if not authenticated to avoid 401 errors
        return [];
      }
      const qs = calendarRange ? `?start=${encodeURIComponent(calendarRange.start)}&end=${encodeURIComponent(calendarRange.end)}&expand=true` : '?expand=true';
      return apiRequest("GET", `/api/events${qs}`).then(r => r.json());
    },
    enabled: !!authStatus?.loggedIn,
  });

  const { data: missingWaivers = [] } = useMissingWaivers(!!authStatus?.loggedIn) as { data: Athlete[] };

  // ALL MUTATIONS
  // Define event mutation hooks manually to avoid circular dependencies
  const createEventMutation = useMutation({
    mutationFn: async (input: Partial<EventRow>) => apiRequest("POST", "/api/events", input).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/events"] }),
  });
  
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EventRow> }) => 
      apiRequest("PUT", `/api/events/${id}`, data).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/events"] }),
  });
  
  const deleteEventMutation = useMutation({
    mutationFn: async (params: string | { id: string; mode?: 'this' | 'future' | 'all'; instanceDate?: string }) => {
      if (typeof params === 'string') {
        // Legacy: simple ID string (defaults to 'all' mode)
        return apiRequest("DELETE", `/api/events/${params}`).then(r => r.json());
      } else {
        // Enhanced: object with deletion mode - send in request body
        const { id, mode = 'all', instanceDate } = params;
        
        const requestBody = {
          mode,
          ...(instanceDate && { instanceDate })
        };
        
        return apiRequest("DELETE", `/api/events/${id}`, requestBody).then(r => r.json());
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/events"] }),
  });

  // Enhanced deletion handler
  const handleEventDeletion = (deletion: DeletionMode) => {
    if (!deletingEvent) return;
    
    const baseId = deletingEvent.id.includes(':') ? deletingEvent.id.substring(0, deletingEvent.id.indexOf(':')) : deletingEvent.id;
    const instanceDate = deletion.instanceDate || (deletingEvent.id.includes(':') 
      ? deletingEvent.id.substring(deletingEvent.id.indexOf(':') + 1) 
      : undefined);
    
    const deleteParams = {
      id: baseId,
      mode: deletion.mode,
      instanceDate: instanceDate
    };
    
    console.log("🗑️ [ADMIN] Deletion params:", deleteParams);
    
    deleteEventMutation.mutate(deleteParams, {
      onSuccess: () => {
        toast({
          title: "Event deleted successfully",
          description: `Event deleted using "${deletion.mode}" mode`,
        });
        setDeletingEvent(null);
      },
      onError: (error: any) => {
        toast({
          title: "Failed to delete event", 
          description: error.message || "An error occurred while deleting the event",
          variant: "destructive",
        });
      }
    });
  };

  // ALL MUTATIONS
  // Delete parent mutation
  const deleteParentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/parents/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete parent");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parents'] });
      toast({ title: "Parent deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting parent",
        description: error.message || "Failed to delete parent",
        variant: "destructive",
      });
    },
  });
  const createAvailabilityMutation = useCreateAvailability();
  const updateAvailabilityMutation = useUpdateAvailability();
  const deleteAvailabilityMutation = useDeleteAvailability();
  // Legacy exception mutations removed

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({ title: "Booking updated successfully" });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/bookings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({ title: "Booking deleted successfully" });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/bookings/${id}/confirm-payment`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to confirm payment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({ 
        title: "Payment Confirmed", 
        description: "Confirmation email has been sent to the parent." 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const createBlogPostMutation = useMutation({
    mutationFn: async (post: InsertBlogPost) => {
      const response = await apiRequest("POST", "/api/blog-posts", post);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      setNewPost({ title: "", content: "", excerpt: "", category: "", imageUrl: null });
      setNewPostSections([]);
      setIsCreateBlogPostOpen(false);
      toast({ title: "Blog post created successfully" });
    },
  });

  const updateBlogPostMutation = useMutation({
    mutationFn: async (post: BlogPost) => {
      const response = await apiRequest("PATCH", `/api/blog-posts/${post.id}`, post);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      setEditingPost(null);
      toast({ title: "Blog post updated successfully" });
    },
  });

  const deleteBlogPostMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/blog-posts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      toast({ title: "Blog post deleted successfully" });
    },
  });

  const createTipMutation = useMutation({
    mutationFn: async (tip: any) => {
      const response = await apiRequest("POST", "/api/tips", tip);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tips'] });
      setNewTip({ title: "", content: "", category: "vault", difficulty: "beginner", videoUrl: "" });
      setNewTipSections([]);
      setIsCreateTipOpen(false);
      toast({ title: "Tip created successfully" });
    },
  });

  const updateTipMutation = useMutation({
    mutationFn: async (tip: Tip) => {
      const response = await apiRequest("PATCH", `/api/tips/${tip.id}`, tip);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tips'] });
      setEditingTip(null);
      toast({ title: "Tip updated successfully" });
    },
  });

  const deleteTipMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/tips/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tips'] });
      toast({ title: "Tip deleted successfully" });
    },
  });

  const deleteAthleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/athletes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
      toast({ title: "Athlete deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot delete athlete",
        description: error.message || "This athlete has active bookings. Please cancel or complete all bookings first.",
        variant: "destructive",
      });
    },
  });

  const updateAthleteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAthlete> }) => {
      const response = await apiRequest("PATCH", `/api/athletes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
      setIsAthleteEditOpen(false);
      toast({ title: "Athlete updated successfully" });
    },
    onError: (error: any) => {
      let description = "Failed to update athlete";
      if (error instanceof Error && error.message) {
        // Try to parse backend error JSON if present
        try {
          const match = error.message.match(/\{.*\}$/);
          if (match) {
            const errObj = JSON.parse(match[0]);
            if (errObj.error) description = errObj.error;
            if (errObj.details && errObj.details.fieldErrors) {
              description += ': ' + Object.entries(errObj.details.fieldErrors)
                .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
                .join('; ');
            }
          }
        } catch {}
      }
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async ({ type, email }: { type: string, email: string }) => {
      const response = await apiRequest("POST", "/api/test-email", { type, email });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Test email sent successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Email test failed", 
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    },
  });

  // Parent update mutation
  const saveParentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/parents/${id}`, data);
      if (!response.ok) {
        throw new Error(`Failed to update parent: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parents'] });
      toast({
        title: "Parent Updated Successfully",
        description: "Parent information has been saved.",
      });
      setIsParentEditOpen(false);
      setEditingParent(null);
    },
    onError: (error: any) => {
      console.error("Error updating parent:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update parent information",
        variant: "destructive",
      });
    },
  });

  // Developer Settings Mutations
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/clear-test-data");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parents'] });
      setIsDeleteConfirmOpen(false);
      toast({ 
        title: "Data cleared successfully", 
        description: `Cleared ${data.cleared.bookings} bookings, ${data.cleared.athletes} athletes, ${data.cleared.parents} parents, ${data.cleared.waivers || 0} waiver files`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error clearing data",
        description: error.message || "Failed to clear test data",
        variant: "destructive",
      });
    },
  });

  const generateBookingsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/generate-test-bookings");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parents'] });
      toast({ 
        title: "Test bookings generated", 
        description: `Created ${data.count || 5} sample bookings`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error generating bookings",
        description: error.message || "Failed to generate test bookings",
        variant: "destructive",
      });
    },
  });

  const createParentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/parent-auth/create-test-parent", {
        email: "test@example.com",
        name: "Test Parent"
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/parents'] });
      toast({ 
        title: "Test parent created", 
        description: `Created parent account: ${data.parent?.email}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating parent",
        description: error.message || "Failed to create test parent",
        variant: "destructive",
      });
    },
  });

  const paymentSimulationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/simulate-payment-success");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({ 
        title: "Payment simulation complete", 
        description: `Updated ${data.updated || 0} bookings to session-paid`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error simulating payments",
        description: error.message || "Failed to simulate payment success",
        variant: "destructive",
      });
    },
  });

  const paymentResetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/reset-payment-status");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({ 
        title: "Payment status reset", 
        description: `Reset ${data.updated || 0} bookings to reservation-paid`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error resetting payments",
        description: error.message || "Failed to reset payment status",
        variant: "destructive",
      });
    },
  });

  const healthCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/health-check");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Health check complete", 
        description: `${data.passed}/${data.total} tests passed`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Health check failed",
        description: error.message || "System health check failed",
        variant: "destructive",
      });
    },
  });

  const databaseTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/database-test");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Database test complete", 
        description: data.message || "Database connection successful"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Database test failed",
        description: error.message || "Database connection test failed",
        variant: "destructive",
      });
    },
  });

  const deleteUserAccountsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/delete-user-accounts");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ 
        title: "User accounts deleted", 
        description: data.message
      });
      setIsDeleteUsersConfirmOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete user accounts",
        description: error.message || "Error deleting user accounts",
        variant: "destructive"
      });
    }
  });

  // Password email mutations
  const sendPasswordSetupMutation = useMutation({
    mutationFn: async ({ parentId, email }: { parentId?: number; email?: string }) => {
      const response = await apiRequest("POST", "/api/admin/send-password-setup-email", {
        body: JSON.stringify({ parentId, email }),
        headers: { "Content-Type": "application/json" },
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password setup email sent",
        description: data.message || "Password setup email sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send password setup email",
        description: error.message || "Failed to send password setup email",
        variant: "destructive",
      });
    },
  });

  const sendPasswordResetMutation = useMutation({
    mutationFn: async ({ parentId, email }: { parentId?: number; email?: string }) => {
      const response = await apiRequest("POST", "/api/admin/send-password-reset-email", {
        body: JSON.stringify({ parentId, email }),
        headers: { "Content-Type": "application/json" },
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password reset email sent",
        description: data.message || "Password reset email sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send password reset email",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    },
  });

  // Helper functions - defined before use to prevent hoisting issues
  const sectionsToContent = (sections: ContentSection[]): string => {
    return sections.map(section => {
      if (section.type === 'text') {
        return section.content;
      } else if (section.type === 'image') {
        return `[IMAGE: ${section.content}]${section.caption ? `\nCaption: ${section.caption}` : ''}`;
      } else if (section.type === 'video') {
        return `[VIDEO: ${section.content}]${section.caption ? `\nCaption: ${section.caption}` : ''}`;
      }
      return '';
    }).join('\n\n');
  };

  const contentToSections = (content: string): ContentSection[] => {
    if (!content) return [];
    
    const lines = content.split('\n');
    const sections: ContentSection[] = [];
    let currentText = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('[IMAGE:') && line.includes(']')) {
        if (currentText.trim()) {
          sections.push({
            id: `section-${Date.now()}-${Math.random()}`,
            type: 'text',
            content: currentText.trim()
          });
          currentText = '';
        }
        
        const imageUrl = line.substring(7, line.indexOf(']')).trim();
        const caption = lines[i + 1]?.startsWith('Caption:') ? lines[i + 1].substring(8).trim() : undefined;
        sections.push({
          id: `section-${Date.now()}-${Math.random()}`,
          type: 'image',
          content: imageUrl,
          caption
        });
        if (caption) i++;
      } else if (line.startsWith('[VIDEO:') && line.includes(']')) {
        if (currentText.trim()) {
          sections.push({
            id: `section-${Date.now()}-${Math.random()}`,
            type: 'text',
            content: currentText.trim()
          });
          currentText = '';
        }
        
        const videoUrl = line.substring(7, line.indexOf(']')).trim();
        const caption = lines[i + 1]?.startsWith('Caption:') ? lines[i + 1].substring(8).trim() : undefined;
        sections.push({
          id: `section-${Date.now()}-${Math.random()}`,
          type: 'video',
          content: videoUrl,
          caption
        });
        if (caption) i++;
      } else {
        currentText += (currentText ? '\n' : '') + line;
      }
    }
    
    if (currentText.trim()) {
      sections.push({
        id: `section-${Date.now()}-${Math.random()}`,
        type: 'text',
        content: currentText.trim()
      });
    }
    
    return sections;
  };

  // Recurrence Helper Functions
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getOrdinalSuffix = (n: number) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const mod100 = n % 100;
    return suffixes[(mod100 - 20) % 10] || suffixes[mod100] || suffixes[0];
  };

  // Client-side RRULE builder
  const buildRRuleFromUi = (opts: {
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY';
    weekdays?: number[]; // 0-6 Sun..Sat for WEEKLY
    monthlyMode?: 'DATE' | 'WEEKDAY_POS';
    byMonthDay?: number; // for DATE
    bySetPos?: number; // for WEEKDAY_POS (1..5)
    until?: string | null; // ISO end date (inclusive of start)
    dtstart?: string; // ISO
  }): string | null => {
    const parts: string[] = [];
    const mapIdxToByday = ['SU','MO','TU','WE','TH','FR','SA'];
    
    if (opts.frequency === 'DAILY') {
      parts.push('FREQ=DAILY');
    } else if (opts.frequency === 'WEEKLY' || opts.frequency === 'BIWEEKLY') {
      parts.push('FREQ=WEEKLY');
      parts.push(`INTERVAL=${opts.frequency === 'BIWEEKLY' ? 2 : 1}`);
      const days = (opts.weekdays && opts.weekdays.length > 0) ? opts.weekdays : undefined;
      if (days) parts.push(`BYDAY=${days.map(i => mapIdxToByday[i]).join(',')}`);
    } else if (opts.frequency === 'MONTHLY') {
      parts.push('FREQ=MONTHLY');
      if (opts.monthlyMode === 'DATE' && opts.byMonthDay) parts.push(`BYMONTHDAY=${opts.byMonthDay}`);
      if (opts.monthlyMode === 'WEEKDAY_POS' && opts.bySetPos && opts.weekdays && opts.weekdays[0] != null) {
        parts.push(`BYDAY=${mapIdxToByday[opts.weekdays[0]]}`);
        parts.push(`BYSETPOS=${opts.bySetPos}`);
      }
    } else if (opts.frequency === 'YEARLY') {
      parts.push('FREQ=YEARLY');
    }
    
    if (opts.until) {
      const d = new Date(opts.until);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const u = `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
      parts.push(`UNTIL=${u}`);
    }
    
    return parts.join(';');
  };

  const initializeRecurrenceFromEvent = (event: Partial<InsertEvent>) => {
    if (event.recurrenceRule) {
      setRecurrenceEnabled(true);
      // Parse basic recurrence rule - this is a simplified parser
      if (event.recurrenceRule.includes('FREQ=DAILY')) {
        setRecurrenceFrequency('DAILY');
      } else if (event.recurrenceRule.includes('FREQ=WEEKLY')) {
        const interval = event.recurrenceRule.match(/INTERVAL=(\d+)/);
        setRecurrenceFrequency(interval && interval[1] === '2' ? 'BIWEEKLY' : 'WEEKLY');
        
        const byday = event.recurrenceRule.match(/BYDAY=([^;]+)/);
        if (byday) {
          const days = byday[1].split(',');
          const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
          const weekdays = days.map(d => dayMap[d.trim()]).filter(d => d !== undefined);
          setSelectedWeekdays(weekdays);
        }
      } else if (event.recurrenceRule.includes('FREQ=MONTHLY')) {
        setRecurrenceFrequency('MONTHLY');
        if (event.recurrenceRule.includes('BYMONTHDAY=')) {
          setMonthlyMode('DATE');
        } else if (event.recurrenceRule.includes('BYSETPOS=')) {
          setMonthlyMode('WEEKDAY_POS');
        }
      } else if (event.recurrenceRule.includes('FREQ=YEARLY')) {
        setRecurrenceFrequency('YEARLY');
      }
      
      if (event.recurrenceEndAt) {
        setRecurrenceEndMode('ON_DATE');
        setRecurrenceEndDate(new Date(event.recurrenceEndAt));
      } else {
        setRecurrenceEndMode('NEVER');
        setRecurrenceEndDate(null);
      }
    }
  };

  const updateRecurrenceRule = () => {
    if (!recurrenceEnabled) {
      setNewEvent(prev => ({
        ...prev,
        recurrenceRule: null,
        recurrenceEndAt: null
      }));
      return;
    }

    const startDate = newEvent.startAt || new Date();
    const rule = buildRRuleFromUi({
      frequency: recurrenceFrequency,
      weekdays: selectedWeekdays.length > 0 ? selectedWeekdays : [startDate.getDay()],
      monthlyMode,
      byMonthDay: monthlyMode === 'DATE' ? startDate.getDate() : undefined,
      bySetPos: monthlyMode === 'WEEKDAY_POS' ? Math.ceil(startDate.getDate() / 7) : undefined,
      until: recurrenceEndMode === 'ON_DATE' && recurrenceEndDate ? recurrenceEndDate.toISOString() : null,
      dtstart: startDate.toISOString()
    });

    setNewEvent(prev => ({
      ...prev,
      recurrenceRule: rule,
      recurrenceEndAt: recurrenceEndMode === 'ON_DATE' && recurrenceEndDate ? recurrenceEndDate : null
    }));
  };

  const getRecurrenceSummary = () => {
    if (!recurrenceEnabled || !recurrenceFrequency) {
      return 'No recurrence';
    }

    let summary = '';
    const startDate = newEvent.startAt || new Date();

    switch (recurrenceFrequency) {
      case 'DAILY':
        summary = 'Daily';
        break;
      case 'WEEKLY':
        if (selectedWeekdays.length > 0) {
          const dayNames = selectedWeekdays.map(d => weekdayNames[d]).join(', ');
          summary = `Weekly on ${dayNames}`;
        } else {
          summary = `Weekly on ${weekdayNames[startDate.getDay()]}`;
        }
        break;
      case 'BIWEEKLY':
        if (selectedWeekdays.length > 0) {
          const dayNames = selectedWeekdays.map(d => weekdayNames[d]).join(', ');
          summary = `Every 2 weeks on ${dayNames}`;
        } else {
          summary = `Every 2 weeks on ${weekdayNames[startDate.getDay()]}`;
        }
        break;
      case 'MONTHLY':
        if (monthlyMode === 'DATE') {
          const dayNum = startDate.getDate();
          summary = `Monthly on the ${dayNum}${getOrdinalSuffix(dayNum)}`;
        } else {
          const weekPos = Math.ceil(startDate.getDate() / 7);
          const dayName = weekdayNames[startDate.getDay()];
          summary = `Monthly on the ${weekPos}${getOrdinalSuffix(weekPos)} ${dayName}`;
        }
        break;
      case 'YEARLY':
        summary = 'Yearly';
        break;
    }

    if (recurrenceEndMode === 'ON_DATE' && recurrenceEndDate) {
      summary += ` until ${recurrenceEndDate.toLocaleDateString()}`;
    }

    return summary;
  };

  // MEMO VALUES
  const parentMapping = useMemo(() => {
    const mapping = new Map();
    bookings.forEach(booking => {
      if (booking.athlete1Name) {
        const key = `${booking.athlete1Name}-${booking.athlete1DateOfBirth}`;
        if (!mapping.has(key)) {
          mapping.set(key, {
            id: booking.id,
            firstName: booking.parent?.firstName || booking.parentFirstName || '',
            lastName: booking.parent?.lastName || booking.parentLastName || '',
            email: booking.parent?.email || booking.parentEmail || '',
            phone: booking.parent?.phone || booking.parentPhone || '',
            emergencyContactName: booking.parent?.emergencyContactName || booking.emergencyContactName || '',
            emergencyContactPhone: booking.parent?.emergencyContactPhone || booking.emergencyContactPhone || '',
            waiverSigned: false, // TODO: Check athlete waiver status
            waiverSignedAt: null // Waiver timestamp not available in this context
          });
        }
      }
      
      if (booking.athlete2Name) {
        const key = `${booking.athlete2Name}-${booking.athlete2DateOfBirth}`;
        if (!mapping.has(key)) {
          mapping.set(key, {
            id: booking.id,
            firstName: booking.parent?.firstName || booking.parentFirstName || '',
            lastName: booking.parent?.lastName || booking.parentLastName || '',
            email: booking.parent?.email || booking.parentEmail || '',
            phone: booking.parent?.phone || booking.parentPhone || '',
            emergencyContactName: booking.parent?.emergencyContactName || booking.emergencyContactName || '',
            emergencyContactPhone: booking.parent?.emergencyContactPhone || booking.emergencyContactPhone || '',
            waiverSigned: false, // TODO: Check athlete waiver status
            waiverSignedAt: null // Waiver timestamp not available in this context
          });
        }
      }
    });
    return mapping;
  }, [bookings]);

  // EFFECTS
  useEffect(() => {
    if (!authLoading && (!authStatus || !authStatus.loggedIn)) {
      console.log("Admin not authenticated, redirecting to login");
      setLocation('/admin/login');
    }
  }, [authStatus, authLoading, setLocation]);
  
  // Add an additional effect to verify authentication status periodically
  useEffect(() => {
    // Check auth status every minute to ensure session hasn't expired
    const checkInterval = setInterval(() => {
      if (authStatus?.loggedIn) {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
      }
    }, 60000);
    
    return () => clearInterval(checkInterval);
  }, [authStatus?.loggedIn, queryClient]);

  useEffect(() => {
    if (editingPost) {
      setEditingPostSections(contentToSections(editingPost.content));
    }
  }, [editingPost]);

  useEffect(() => {
    if (editingTip) {
      setEditingTipSections(contentToSections(editingTip.content));
    }
  }, [editingTip]);

  // Persist active tab to prevent hook count mismatches on refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin-active-tab', activeTab);
    }
  }, [activeTab]);

  // Initialize weekdays when start date changes
  useEffect(() => {
    if (newEvent.startAt && selectedWeekdays.length === 0 && recurrenceEnabled && (recurrenceFrequency === 'WEEKLY' || recurrenceFrequency === 'BIWEEKLY')) {
      const startDay = new Date(newEvent.startAt).getDay();
      setSelectedWeekdays([startDay]);
    }
  }, [newEvent.startAt, recurrenceFrequency, recurrenceEnabled, selectedWeekdays.length]);

  // Update recurrence rule when any recurrence setting changes
  useEffect(() => {
    updateRecurrenceRule();
  }, [recurrenceEnabled, recurrenceFrequency, selectedWeekdays, monthlyMode, recurrenceEndMode, recurrenceEndDate, newEvent.startAt]);

  // DASHBOARD STATS
  // Merge active + archived for "ALL" views
  const allBookings = useMemo(() => {
    return [...(bookings || []), ...(archivedBookings || [])];
  }, [bookings, archivedBookings]);

  const totalBookingsAll = allBookings.length;
  const totalParents = parents.length;

  // Upcoming = future date/time AND not cancelled/completed
  const isUpcoming = useCallback((b: Booking) => {
    if (!b?.preferredDate) return false;
    try {
      const time = (b.preferredTime && typeof b.preferredTime === 'string') ? b.preferredTime : '00:00:00';
      const dt = new Date(`${b.preferredDate}T${time}`);
      const now = new Date();
      const status = (b.attendanceStatus || '').toLowerCase();
      const notDone = status === 'pending' || status === 'confirmed';
      return notDone && dt >= now;
    } catch {
      return false;
    }
  }, []);
  
  const upcomingBookingsCount = useMemo(() => allBookings.filter(isUpcoming).length, [allBookings, isUpcoming]);
  const pendingBookings = useMemo(() => allBookings.filter(b => b.attendanceStatus === "pending").length, [allBookings]);
  const confirmedBookings = useMemo(() => allBookings.filter(b => b.attendanceStatus === "confirmed").length, [allBookings]);

  // Shared analytics/header computed values
  const thisMonthBookings = useMemo(() => {
    return allBookings.filter(b => {
      if (!b.preferredDate) return false;
      const bookingDate = new Date(b.preferredDate);
      const now = new Date();
      return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
    }).length;
  }, [allBookings]);

  const conversionRate = useMemo(() => {
    if (!allBookings.length) return 0;
    const converted = allBookings.filter(b => b.attendanceStatus === 'confirmed' || b.attendanceStatus === 'completed').length;
    return Math.round((converted / allBookings.length) * 100);
  }, [allBookings]);

  const avgBookingValue = useMemo(() => {
    if (!allBookings.length) return '0.00';
    const toNumber = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const sum = allBookings.reduce((acc, b: any) => {
      const amountNum = toNumber(b?.amount);
      if (amountNum > 0) return acc + amountNum;
      if (b?.lessonTypeId && lessonTypesById.has(b.lessonTypeId)) {
        const match: any = lessonTypesById.get(b.lessonTypeId);
        return acc + toNumber(match?.price);
      }
      const lt: any = b?.lessonType;
      if (lt && typeof lt === 'object' && 'price' in lt) return acc + toNumber(lt.price);
      const name = typeof lt === 'string' ? lt : undefined;
      if (name && lessonTypesByName.has(name)) {
        const match: any = lessonTypesByName.get(name);
        return acc + toNumber(match?.price);
      }
      return acc;
    }, 0);
    return (sum / allBookings.length).toFixed(2);
  }, [allBookings, lessonTypesById, lessonTypesByName]);

  const onlinePct = useMemo(() => {
    if (!allBookings.length) return 0;
    const count = allBookings.filter((b: any) => b?.bookingMethod === 'Website').length;
    return Math.round((count / allBookings.length) * 100);
  }, [allBookings]);

  const adminBookedPct = useMemo(() => {
    if (!allBookings.length) return 0;
    const count = allBookings.filter((b: any) => b?.bookingMethod === 'Admin').length;
    return Math.round((count / allBookings.length) * 100);
  }, [allBookings]);

  const dashboardHeaderMetrics = useMemo<MetricCard[]>(() => {
    const metrics: MetricCard[] = [
      {
        key: 'upcoming',
        label: 'Upcoming Missions',
        value: upcomingBookingsCount,
        hint: `of ${totalBookingsAll} total`,
        icon: <Calendar className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />,
        color: 'indigo' as const,
      },
      {
        key: 'total',
        label: 'Total Missions',
        value: totalBookingsAll,
        icon: <Calendar className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />,
        color: 'slate' as const,
      },
      {
        key: 'pending',
        label: 'Pending',
        value: pendingBookings,
        icon: <Clock className="h-5 w-5 text-amber-700" />,
        color: 'amber' as const,
      },
      {
        key: 'confirmed',
        label: 'Confirmed',
        value: confirmedBookings,
        icon: <CheckCircle className="h-5 w-5 text-green-700" />,
        color: 'green' as const,
      },
      {
        key: 'athletes',
        label: 'Total Athletes',
        value: athletes.length,
        icon: <Users className="h-5 w-5 text-blue-700 dark:text-blue-300" />,
        color: 'blue' as const,
      },
      {
        key: 'parents',
        label: 'Total Parents',
        value: totalParents,
        icon: <Users className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />,
        color: 'indigo' as const,
      },
    ];
    if (missingWaivers.length > 0) {
      metrics.push({
        key: 'missing-waivers',
        label: 'Missing Waivers',
        value: missingWaivers.length,
        hint: 'Athletes need waivers signed',
        icon: <AlertCircle className="h-5 w-5 text-red-700" />,
  color: 'amber' as const,
      });
    }
    return metrics;
  }, [upcomingBookingsCount, totalBookingsAll, pendingBookings, confirmedBookings, athletes.length, totalParents, missingWaivers.length]);

  // Analytics tab key metrics
  const analyticsHeaderMetrics = useMemo(() => {
    const metrics = [
      {
        key: 'total-all',
        label: 'Total Bookings',
        value: totalBookingsAll,
        hint: 'All time',
        icon: <Calendar className="h-5 w-5 text-slate-700" />,
        color: 'slate' as const,
      },
      {
        key: 'this-month',
        label: 'This Month',
        value: thisMonthBookings,
        hint: 'Monthly bookings',
        icon: <CalendarDays className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />,
        color: 'indigo' as const,
      },
      {
        key: 'conversion',
        label: 'Conversion Rate',
        value: `${conversionRate}%`,
        hint: 'Form to payment',
        icon: <CheckCircle className="h-5 w-5 text-green-700" />,
        color: 'green' as const,
      },
      {
        key: 'avg-value',
        label: 'Avg Booking Value',
        value: `$${avgBookingValue}`,
        hint: 'Full lesson price only',
        icon: <DollarSign className="h-5 w-5 text-amber-700" />,
        color: 'amber' as const,
      },
    ];
    return metrics;
  }, [totalBookingsAll, thisMonthBookings, conversionRate, avgBookingValue]);

  // EARLY RETURNS AFTER ALL HOOKS
  if (authLoading) {
    return (
      <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black flex items-center justify-center">
        <img 
          src="/assets/betteh_logo_black_font.png" 
          alt="Loading" 
          className="animate-spin w-16 h-16" 
        />
      </div>
    );
  }

  if (!authStatus?.loggedIn) {
    // Show a visible fallback instead of a blank screen while redirect effect runs
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black p-6 text-center">
        <img
          src="/assets/betteh_logo_black_font.png"
          alt="Redirecting"
          className="animate-spin w-16 h-16 mb-6"
        />
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">Admin Sign In Required</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md">You're not logged in. Redirecting you to the admin login page…</p>
        <a
          href="/admin/login"
          className="inline-flex items-center px-5 py-3 rounded-lg bg-[#0F0276] text-white font-medium shadow hover:bg-[#12038f] focus:outline-none focus:ring-2 focus:ring-[#D8BD2A] transition"
        >
          Go to Admin Login
        </a>
        <noscript>
          <p className="mt-4 text-sm text-red-700">JavaScript is disabled; use the button above to continue.</p>
        </noscript>
      </div>
    );
  }

  // Developer Settings Handler Functions
  const handleClearTestData = () => {
    clearDataMutation.mutate();
  };

  const handleGenerateTestBookings = () => {
    generateBookingsMutation.mutate();
  };

  const handleCreateTestParent = () => {
    createParentMutation.mutate();
  };

  const handleSimulatePaymentSuccess = () => {
    paymentSimulationMutation.mutate();
  };

  const handleResetPaymentStatus = () => {
    paymentResetMutation.mutate();
  };

  const handleSystemHealthCheck = () => {
    healthCheckMutation.mutate();
  };

  const handleDatabaseTest = () => {
    databaseTestMutation.mutate();
  };

  const handlePhotoClick = (photoUrl: string) => {
    setEnlargedPhoto(photoUrl);
    setIsPhotoEnlarged(true);
  };

  const openAthleteModal = (athleteId: string | number) => {
    console.log('🔍 openAthleteModal CALLED:', {
      athleteId,
      athleteIdType: typeof athleteId,
      athletesArray: athletes,
      athletesLength: athletes.length
    });
    
    const athlete = athletes.find(a => a.id === Number(athleteId));
    console.log('🔍 FOUND ATHLETE:', athlete);
    
    if (athlete) {
      console.log('🔍 SETTING SELECTED ATHLETE:', athlete);
      // Ensure other modals are closed first
      setIsAthleteEditOpen(false);
      
      // Set athlete and open modal
      setSelectedAthlete(athlete);
      setIsAthleteViewOpen(true);
      console.log('🔍 MODAL SHOULD BE OPEN NOW');
    } else {
      console.log('🔍 ATHLETE NOT FOUND!');
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, athleteId: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const compressedFile = await compressImage(file, 800, 0.8);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Photo = reader.result as string;
        
        const response = await apiRequest("PUT", `/api/athletes/${athleteId}/photo`, {
          photo: base64Photo
        });
        
        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
          toast({
            title: "Photo Updated",
            description: "Athlete photo has been successfully updated.",
          });
          setIsAthleteEditOpen(false);
        } else {
          throw new Error('Upload failed');
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a new blob with the file name attached as a property
            const compressedBlob = Object.assign(blob, { 
              name: file.name.replace(/\.[^/.]+$/, '.jpg'), // Change extension to .jpg
              lastModified: Date.now()
            });
            resolve(compressedBlob as File);
          }
        }, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleLogout = async () => {
    try {
      await apiRequest('GET', '/api/auth/logout');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
      setLocation('/admin/login');
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of the admin dashboard.",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  // ANALYTICS COMPUTED DATA
  const filteredBookingsForAnalytics = allBookings.filter(booking => {
    // Filter by date range
    if (analyticsDateRange.start && booking.preferredDate && booking.preferredDate < analyticsDateRange.start) return false;
    if (analyticsDateRange.end && booking.preferredDate && booking.preferredDate > analyticsDateRange.end) return false;
    
    // Filter by lesson type
    const lessonTypeName = (() => {
      const lt = booking.lessonType as any;
      if (lt && typeof lt === 'object' && 'name' in lt) return lt.name;
      if (typeof lt === 'string') return lt;
      if (booking.lessonTypeId && lessonTypesById.has(booking.lessonTypeId)) {
        return lessonTypesById.get(booking.lessonTypeId)?.name;
      }
      return undefined;
    })();
    if (analyticsLessonType !== 'all' && lessonTypeName !== analyticsLessonType) return false;
    
    return true;
  });

  // Calculate focus area statistics from ALL bookings in current filters
  const focusAreaStats = (() => {
    const areaCount = new Map<string, number>();
    filteredBookingsForAnalytics.forEach(booking => {
      if (booking.focusAreas && Array.isArray(booking.focusAreas)) {
        booking.focusAreas.forEach((area: string) => {
          areaCount.set(area, (areaCount.get(area) || 0) + 1);
        });
      }
    });
    return Array.from(areaCount.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count);
  })();

  // Calculate booking trends by month (ALL bookings, last 6 months), respects lesson type but ignores custom date range
  const bookingTrendData = (() => {
    const monthCount = new Map<string, number>();
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    const dataset = allBookings.filter(b => {
      if (!b.preferredDate) return false;
      const d = new Date(b.preferredDate);
      if (d < sixMonthsAgo) return false;
      // Respect lesson type selection
      if (analyticsLessonType !== 'all') {
        const name = (() => {
          const lt: any = (b as any).lessonType;
          if (lt && typeof lt === 'object' && 'name' in lt) return lt.name as string;
          if (typeof lt === 'string') return lt;
          if (b.lessonTypeId && lessonTypesById.has(b.lessonTypeId)) return lessonTypesById.get(b.lessonTypeId)?.name as string;
          return undefined;
        })();
        if (name !== analyticsLessonType) return false;
      }
      return true;
    });

    dataset.forEach(booking => {
      if (!booking.preferredDate) return;
      const date = new Date(booking.preferredDate);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthCount.set(monthKey, (monthCount.get(monthKey) || 0) + 1);
    });

    // Build the last 6 month labels
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      months.push(monthKey);
    }

    return months.map(month => ({
      month,
      count: monthCount.get(month) || 0
    }));
  })();

  // Filtered parents for local search when not using server-side search
  const filteredParents = parentsData?.parents || [];

  // Debug: Avg Booking Value breakdown when `?debugAvg` is present
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('debugAvg')) {
        const toNumber = (v: any) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };
        const details = (allBookings || []).map((b: any) => {
          const bookingAmount = b?.amount;
          const amountNum = toNumber(bookingAmount);
          const ltObj = b?.lessonType;
          const ltId = b?.lessonTypeId;
          let ltFromId: any = undefined;
          let ltFromName: any = undefined;
          let resolved = 0;
          let source = '';
          if (amountNum > 0) {
            resolved = amountNum;
            source = 'booking.amount';
          } else if (ltId && lessonTypesById.has(ltId)) {
            ltFromId = lessonTypesById.get(ltId);
            resolved = toNumber(ltFromId?.price);
            source = 'lessonTypesById.price';
          } else if (ltObj && typeof ltObj === 'object' && 'price' in ltObj) {
            resolved = toNumber((ltObj as any)?.price);
            source = 'booking.lessonType.price';
          } else if (typeof ltObj === 'string' && lessonTypesByName.has(ltObj)) {
            ltFromName = lessonTypesByName.get(ltObj);
            resolved = toNumber(ltFromName?.price);
            source = 'lessonTypesByName.price';
          } else {
            source = 'unresolved(0)';
          }
          return {
            lessonTypeId: ltId,
            lessonTypeName: typeof ltObj === 'string' ? ltObj : (ltObj?.name || undefined),
            bookingAmount,
            ltFromIdPrice: ltFromId?.price,
            ltFromNamePrice: ltFromName?.price,
            resolvedPrice: resolved,
            source,
          };
        });
        const sum = details.reduce((acc, d) => acc + toNumber(d.resolvedPrice), 0);
        const count = (allBookings || []).length;
        const known = details.filter(d => toNumber(d.resolvedPrice) > 0);
        const sumKnown = known.reduce((acc, d) => acc + toNumber(d.resolvedPrice), 0);
        const avgAll = count ? (sum / count) : 0;
        const avgKnown = known.length ? (sumKnown / known.length) : 0;
        // eslint-disable-next-line no-console
        console.groupCollapsed('%c[AVG DEBUG] Avg Booking Value breakdown', 'color:#0F0276;font-weight:bold;');
        // eslint-disable-next-line no-console
        console.table(details);
        // eslint-disable-next-line no-console
        console.log('[AVG DEBUG] sum(all)/count(all)=', sum, '/', count, '=', avgAll.toFixed(2));
        // eslint-disable-next-line no-console
        console.log('[AVG DEBUG] sum(known)/count(known)=', sumKnown, '/', known.length, '=', avgKnown.toFixed(2));
        // eslint-disable-next-line no-console
        console.groupEnd();
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Avg debug logging failed:', e);
  }

  // RENDER
  return (
    <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black">
      <SEOHead
        title={`Admin Dashboard — ${brand.businessName}`}
        description="Admin dashboard."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/admin` : window.location.origin + '/admin'}
        robots="noindex,follow"
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebPage' }}
      />
      {/* Mobile Hamburger Menu */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed z-40 top-20 left-4 md:hidden p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-sm rounded-md shadow-sm transition-all duration-200"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
      )}
      
      <div className="flex h-full">
        {/* Sidebar Navigation */}
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onLogout={handleLogout}
          onCollapseChange={(collapsed) => setIsSidebarCollapsed(collapsed)}
        />

        {/* Main Content Area */}
        <div className={`transition-all duration-300 ${
          isSidebarOpen 
            ? isSidebarCollapsed 
              ? 'md:ml-[80px] md:w-[calc(100%-80px)]' 
              : 'md:ml-[280px] md:w-[calc(100%-280px)]'
            : 'md:w-full'
        } w-full`}>
          <div className="max-w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 sm:mb-10 gap-4">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0F0276] dark:text-[#D8BD2A] drop-shadow-sm">
                {/* Show different titles based on active tab */}
                {activeTab === 'bookings' && 'Booking Manager'}
                {activeTab === 'upcoming' && 'Upcoming Sessions'}
                {activeTab === 'athletes' && 'Athlete Management'}
                {activeTab === 'parents' && 'Parent Management'}
                {activeTab === 'content' && 'Content Management'}
                {activeTab === 'analytics' && 'Analytics Dashboard'}
                {activeTab === 'progress' && 'Athlete Progress'}
                {activeTab === 'settings' && 'Admin Settings'}
                {activeTab === 'schedule' && 'Schedule Management'}
                {activeTab === 'parentcomm' && 'Parent Communications'}
                {activeTab === 'waivers' && 'Waiver Management'}
                {activeTab === 'payments' && 'Payment Management'}
                {activeTab === 'payouts' && 'Payouts'}
                {activeTab === 'lesson-types' && 'Lesson Type Management'}
              </h1>
              
              {/* Contextual Actions */}
              <div className="flex gap-4">
                {/* Removed New Booking button as it's redundant with the buttons in the booking manager */}
              </div>
            </div>

        <div className="mb-6 sm:mb-10">
          {!bookings || !athletes ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mx-auto w-full">
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="rounded-3xl shadow-lg border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 transform transition-transform hover:scale-[1.02] duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <AdminAnalyticsMetrics metrics={dashboardHeaderMetrics} columns={{ base: 2, sm: 3, lg: 4 }} />
          )}
        </div>

        <Tabs value={activeTab} className="w-full max-w-full overflow-hidden">
          {/* TabsList is now hidden as we're using the sidebar instead */}
          <TabsList className="hidden">
            <TabsTrigger 
              value="bookings" 
              className="hidden"
              role="tab"
              aria-controls="bookings-panel"
              aria-label="Manage bookings and reservations"
            >
              📅 Bookings
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming" 
              className="hidden"
              role="tab"
              aria-controls="upcoming-panel"
              aria-label="View upcoming sessions and schedule"
            >
              🔮 Upcoming
            </TabsTrigger>
            <TabsTrigger 
              value="athletes" 
              className="hidden"
              role="tab"
              aria-controls="athletes-panel"
              aria-label="Manage athlete profiles and information"
            >
              🏆 Athletes
            </TabsTrigger>
            <TabsTrigger 
              value="parents" 
              className="hidden"
              role="tab"
              aria-controls="parents-panel"
              aria-label="Manage parent profiles and family relationships"
            >
              👪 Parents
            </TabsTrigger>
            <TabsTrigger 
              value="content" 
              className="hidden"
            >
              📝 Content
            </TabsTrigger>
            <TabsTrigger 
              value="schedule" 
              className="hidden"
            >
              ⏰ Schedule
            </TabsTrigger>
            <TabsTrigger 
              value="lesson-types" 
              className="hidden"
            >
              🎓 Lesson Types
            </TabsTrigger>
            <TabsTrigger 
              value="skills" 
              className="hidden"
            >
              🥇 Skills
            </TabsTrigger>
            <TabsTrigger 
              value="parentcomm" 
              className="hidden"
            >
              💬 Messages
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="hidden"
            >
              💳 Payments
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="hidden"
            >
              💬 Messages
            </TabsTrigger>
            <TabsTrigger 
              value="payouts" 
              className="hidden"
            >
              🧾 Payouts
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="hidden"
            >
              📊 Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="activity-logs" 
              className="hidden"
            >
              📋 Activity Logs
            </TabsTrigger>
            <TabsTrigger 
              value="waivers" 
              className="hidden"
            >
              📋 Waivers
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="hidden"
            >
              ⚙️ Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" role="tabpanel" id="bookings-panel" aria-labelledby="bookings-tab" className="w-full max-w-full px-0 sm:px-2 dark:text-white">
            <MainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <Calendar className="h-8 w-8 text-[#D8BD2A]" />
                  Booking Management
                </span>
              }
            >
              <AdminBookingManager 
                openAthleteModal={openAthleteModal}
                selectedBooking={selectedBooking}
                onSelectBooking={setSelectedBooking}
              />
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="lesson-types" role="tabpanel" id="lesson-types-panel" aria-labelledby="lesson-types-tab" className="w-full max-w-full px-0 sm:px-2 dark:text-white">
            <MainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <Dumbbell className="h-8 w-8 text-[#D8BD2A]" />
                  Lesson Type Management
                </span>
              }
            >
              <AdminLessonTypeManager />
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="skills" role="tabpanel" id="skills-panel" aria-labelledby="skills-tab" className="w-full max-w-full px-0 sm:px-2">
            <MainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <Star className="h-8 w-8 text-[#D8BD2A]" />
                  Skills Management
                </span>
              }
            >
              <Suspense fallback={<div className="space-y-3">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>}>
                <AdminSkillsManager />
              </Suspense>
            </MainContentContainer>
          </TabsContent>
          <TabsContent value="progress" role="tabpanel" id="progress-panel" aria-labelledby="progress-tab" className="w-full max-w-full px-0 sm:px-2">
            <MainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <TrendingUp className="h-8 w-8 text-[#D8BD2A]" />
                  Athlete Progress
                </span>
              }
            >
              <p className="text-slate-600 dark:text-slate-200 mb-4">Track progress with filters and summary bars.</p>
              <AthleteProgressPage />
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="athletes" role="tabpanel" id="athletes-panel" aria-labelledby="athletes-tab" className="w-full max-w-full px-0 sm:px-2 dark:text-white">
            <MainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <Users className="h-8 w-8 text-[#D8BD2A]" />
                  Athletes Management
                  <Badge variant="secondary" className="bg-gradient-to-r from-[#D8BD2A]/20 to-[#D8BD2A]/30 text-[#0F0276] dark:text-white font-bold rounded-xl px-3 py-1">
                    {athletes.length} total
                  </Badge>
                </span>
              }
            >
              <div className="space-y-6 sm:space-y-8">
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-300 h-5 w-5" />
                    <Input
                      placeholder="Search athletes..."
                      value={athleteSearchTerm}
                      onChange={(e) => setAthleteSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-3 rounded-xl border-0 bg-slate-50/80 dark:bg-white/10 dark:text-white dark:placeholder-white/70 focus:ring-2 focus:ring-[#0F0276] dark:focus:ring-[#D8BD2A] focus:bg-white dark:focus:bg-white/20 transition-all duration-200 text-base"
                    />
                  </div>
                  {/* Athletes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {athletes
                      .filter((athlete, index, self) =>
                        index === self.findIndex((a) => a.id === athlete.id)
                      )
                      .filter(athlete => {
                        // Search filter
                        if (athleteSearchTerm) {
                          const searchTerm = athleteSearchTerm.toLowerCase();
                          const athleteName = (athlete.firstName && athlete.lastName 
                            ? `${athlete.firstName} ${athlete.lastName}` 
                            : athlete.name || 'Unknown Athlete').toLowerCase();
                          if (!athleteName.includes(searchTerm)) {
                            return false;
                          }
                        }
                        return !!athlete.dateOfBirth;
                      })
                      .map((athlete) => {
                        const today = new Date();
                        const birthDate = new Date(athlete.dateOfBirth || "1970-01-01");
                        const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                        if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
                        const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        const isUpcomingBirthday = daysUntilBirthday >= 0 && daysUntilBirthday <= 7;
                        const athleteKey = `${athlete.name}-${athlete.dateOfBirth || 'no-dob'}`;
                        const parentInfo = parentMapping.get(athleteKey);
                        return (
                          <div
                            key={athlete.id}
                            className={
                              isUpcomingBirthday
                                ? 'relative border-2 border-amber-300 dark:border-[#D8BD2A]/40 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:bg-white/10 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] dark:text-white'
                                : 'relative border border-slate-200/60 dark:border-white/10 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:bg-white/10 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] dark:text-white'
                            }
                          >
                            {/* Action buttons - responsive layout */}
                            <div className="flex justify-end gap-2 mb-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className={`h-9 w-9 p-0 rounded-xl border-0 shadow-md transition-all duration-200 ${isUpcomingBirthday ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-800 dark:hover:bg-amber-700 dark:text-amber-200' : 'bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md hover:bg-blue-50 text-blue-600 dark:bg-[#0F0276]/90 dark:hover:bg-slate-600 dark:text-blue-300'}`} 
                                onClick={() => { setSelectedAthlete(athlete); setIsAthleteViewOpen(true); }} 
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className={`h-9 w-9 p-0 rounded-xl border-0 shadow-md transition-all duration-200 ${isUpcomingBirthday ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' : 'bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md hover:bg-green-50 text-green-600 dark:bg-[#0F0276]/90 dark:hover:bg-green-800 dark:text-green-400'}`} 
                                onClick={() => { setSelectedAthlete(athlete); setIsAthleteEditOpen(true); }} 
                                title="Edit Athlete"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-9 w-9 p-0 rounded-xl border-0 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md hover:bg-red-50 text-red-600 dark:bg-[#0F0276]/90 dark:hover:bg-red-800 dark:text-red-400 shadow-md transition-all duration-200" 
                                onClick={() => { 
                                  const activeBookings = bookings.filter(b => (b.athlete1Name === athlete.name || b.athlete2Name === athlete.name) && (b.status === 'confirmed' || b.status === 'pending')); 
                                  if (activeBookings.length > 0) { 
                                    setDeleteAthleteError({ athlete, activeBookings }); 
                                  } else { 
                                    deleteAthleteMutation.mutate(athlete.id); 
                                  } 
                                }} 
                                title="Delete Athlete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {/* Card Content */}
                            <div className="flex items-start space-x-4">
                              {athlete.photo ? (
                                <img 
                                  src={athlete.photo} 
                                  alt={`${athlete.name}'s photo`} 
                                  className="w-16 h-16 rounded-2xl object-cover cursor-pointer hover:opacity-80 transition-all duration-200 shadow-md ring-2 ring-slate-200 dark:ring-white/20" 
                                  onClick={() => handlePhotoClick(athlete.photo!)} 
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-white/10 dark:to-white/5 flex items-center justify-center shadow-md">
                                  <User className="h-8 w-8 text-slate-500 dark:text-slate-200" />
                                </div>
                              )}
                              <div className="flex-1 space-y-3 pt-1">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 leading-tight">
                                  🧑 {athlete.firstName && athlete.lastName ? `${athlete.firstName} ${athlete.lastName}` : athlete.name}
                                </h3>
                                {isUpcomingBirthday && (
                                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
                                    <span className="text-lg">🎉</span>
                                    <span className="text-sm font-semibold text-amber-800">
                                      Birthday in {daysUntilBirthday} {daysUntilBirthday === 1 ? 'day' : 'days'}!
                                    </span>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <p className="text-sm text-slate-600 dark:text-slate-200 flex items-center gap-2 font-medium">
                                    🎂 <span className="font-semibold">Age:</span> {athlete.dateOfBirth ? calculateAge(athlete.dateOfBirth) : 'Unknown'} 
                                    <span className="text-slate-400 dark:text-slate-300">|</span> 
                                    🥇 <span className="font-semibold">Level:</span> {athlete.experience.charAt(0).toUpperCase() + athlete.experience.slice(1)}
                                  </p>
                                  {parentInfo && (
                                    <p className="text-sm text-slate-600 dark:text-slate-200 flex items-center gap-2 font-medium">
                                      👨‍👦 <span className="font-semibold">Parent:</span> {parentInfo.firstName} {parentInfo.lastName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="payouts" role="tabpanel" id="payouts-panel" aria-labelledby="payouts-tab" className="w-full max-w-full px-0 sm:px-2">
            <MainContentContainer 
              heading={
                <div className="flex items-center gap-2 sm:gap-3">
                  <DollarSign className="h-8 w-8 text-[#D8BD2A]" />
                  Payouts Management
                </div>
              }
            >
              <AdminPayoutsTab />
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="parents" role="tabpanel" id="parents-panel" aria-labelledby="parents-tab" className="w-full max-w-full px-0 sm:px-2 dark:text-white">
            <MainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <User className="h-8 w-8 text-[#D8BD2A]" />
                  Parents Management
                  <Badge variant="secondary" className="bg-gradient-to-r from-[#D8BD2A]/20 to-[#D8BD2A]/30 text-[#0F0276] dark:text-white font-bold rounded-xl px-3 py-1">
                    {parentsData?.parents?.length || 0} total
                  </Badge>
                </span>
              }
            >
              <div className="space-y-6 sm:space-y-8">
                {/* Search bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-300" />
                    <Input
                      type="text"
                      placeholder="Search parents by name, email, or phone..."
                      value={parentSearchTerm}
                      onChange={(e) => setParentSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-3 rounded-xl border-0 bg-slate-50/80 dark:bg-white/10 dark:text-white dark:placeholder-white/70 focus:ring-2 focus:ring-[#0F0276] dark:focus:ring-[#D8BD2A] focus:bg-white dark:focus:bg-white/20 transition-all duration-200 text-base"
                    />
                  </div>
                  <Button
                    onClick={() => refetchParents()}
                    variant="outline"
                    size="sm"
                    disabled={parentsLoading}
                    className="bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl px-4 py-3 font-semibold dark:bg-[#0F0276]/90 dark:hover:bg-slate-600 dark:text-white"
                  >
                    <RefreshCw className={`h-5 w-5 ${parentsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                {parentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <img 
                        src="/assets/betteh_logo_black_font.png" 
                        alt="Loading" 
                        className="h-8 w-8 animate-spin mx-auto" 
                      />
                      <p className="text-slate-600 dark:text-slate-200 font-medium">Loading parents data...</p>
                    </div>
                  </div>
                ) : parentsData?.parents?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/10 dark:to-white/5 rounded-full flex items-center justify-center mb-4">
                      <User className="h-12 w-12 text-slate-400 dark:text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No parents found</h3>
                    <p className="text-slate-600 dark:text-slate-200 max-w-md mx-auto">
                      {parentSearchTerm 
                        ? `No parents match "${parentSearchTerm}". Try adjusting your search terms.`
                        : "No parent accounts have been created yet. They'll appear here when parents complete bookings."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {filteredParents.map((parent: any) => {
                        const athleteCount = typeof parent.athlete_count === 'number' ? parent.athlete_count : (parent.athletes?.length ?? 0);
                        const bookingCount = typeof parent.booking_count === 'number' ? parent.booking_count : (parent.bookings?.length ?? 0);
                        
                        return (
                          <Card 
                            key={parent.id} 
                            className="group rounded-2xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-white/10 dark:bg-white/10 hover:from-slate-50 hover:via-white hover:to-slate-50 dark:hover:bg-white/15 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                          >
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0 space-y-4">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-xl text-[#0F0276] dark:text-white group-hover:text-[#0F0276]/80 dark:group-hover:text-white/90 transition-colors">
                                      {parent.first_name} {parent.last_name}
                                    </h3>
                                    <Badge variant="outline" className="text-xs font-medium bg-slate-50/80 dark:bg-white/10 border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-200">
                                      ID: {parent.id}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-200">
                                      <Mail className="h-4 w-4 text-[#D8BD2A] flex-shrink-0" />
                                      <span className="truncate font-medium">{parent.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-200">
                                      <Phone className="h-4 w-4 text-[#D8BD2A] flex-shrink-0" />
                                      <span className="font-medium">{parent.phone}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#D8BD2A]/10 to-[#D8BD2A]/20 rounded-lg">
                                      <Users className="h-4 w-4 text-[#0F0276] dark:text-white" />
                                      <span className="font-semibold text-[#0F0276] dark:text-white">
                                        {athleteCount} athlete{athleteCount !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg">
                                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                                        {bookingCount} booking{bookingCount !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  </div>

                                  {parent.athletes && parent.athletes.length > 0 && (
                                    <div className="pt-3 border-t border-slate-100">
                                      <p className="text-sm font-semibold text-[#0F0276] dark:text-white mb-2">Athletes:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {parent.athletes.map((athlete: any, index: number) => (
                                          <Badge 
                                            key={index}
                                            variant="secondary" 
                                            className="bg-gradient-to-r from-slate-100 to-slate-200/50 dark:from-white/10 dark:to-white/5 text-slate-700 dark:text-white text-xs font-medium rounded-lg px-2 py-1"
                                          >
                                            {athlete.first_name} {athlete.last_name}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const validParent = filteredParents.find((p: any) => p.id === parent.id);
                                      if (validParent) {
                                        setViewingParent(validParent);
                                      } else {
                                        console.warn(`Parent ${parent.id} not found in current parents list`);
                                      }
                                    }}
                                    className="bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-3 py-2 font-semibold dark:bg-[#0F0276]/90 dark:hover:bg-slate-600 dark:text-white"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const validParent = filteredParents.find((p: any) => p.id === parent.id);
                                      if (validParent) {
                                        setEditingParent(validParent);
                                        setIsParentEditOpen(true);
                                        setViewingParent(null);
                                      } else {
                                        console.warn(`Parent ${parent.id} not found in current parents list`);
                                      }
                                    }}
                                    className="bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-3 py-2 font-semibold dark:bg-[#0F0276]/90 dark:hover:bg-slate-600 dark:text-white"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete ${parent.first_name} ${parent.last_name}? This action cannot be undone.`)) {
                                        deleteParentMutation.mutate(parent.id);
                                      }
                                    }}
                                    className="bg-gradient-to-r from-red-500 to-red-600 border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-3 py-2 font-semibold"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {parentsData?.pagination && parentsData.pagination.totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 pt-6 border-t border-slate-100 dark:border-white/10">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentParentPage <= 1}
                          onClick={() => setCurrentParentPage(Math.max(1, currentParentPage - 1))}
                          className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-4 py-2 font-semibold disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-200 px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-white/10 dark:to-white/5 rounded-lg">
                            Page {currentParentPage} of {parentsData.pagination.totalPages}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentParentPage >= parentsData.pagination.totalPages}
                          onClick={() => setCurrentParentPage(Math.min(parentsData.pagination.totalPages, currentParentPage + 1))}
                          className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-4 py-2 font-semibold disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="upcoming" role="tabpanel" id="upcoming-panel" aria-labelledby="upcoming-tab" className="w-full max-w-full px-0 sm:px-2 dark:text-white">
            <MainContentContainer 
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-[#D8BD2A]/10 rounded-lg">
                    <Clock className="h-6 w-6 text-[#0F0276] dark:text-[#D8BD2A]" />
                  </div>
                  Upcoming Sessions
                </span>
              }
            >
              <UpcomingSessions 
                onBookingSelect={async (bookingId) => {
                  // Switch to bookings tab
                  setActiveTab("bookings");
                  
                  // Fetch full booking details with athlete information
                  try {
                    const response = await apiRequest("GET", `/api/bookings/${bookingId}`);
                    const bookingData = await response.json();
                    if (bookingData) {
                      setSelectedBooking(bookingData);
                    }
                  } catch (error) {
                    console.error("Error fetching booking details:", error);
                  }
                }}
              />
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="content" className="w-full max-w-full px-0 sm:px-2 dark:text-white">
            <MainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <MessageSquare className="h-8 w-8 text-[#D8BD2A]" />
                  Content Management
                </span>
              }
            >
              <div className="p-4 sm:p-6 lg:p-8">
                <AdminContentTabs
                  defaultValue="blog"
                  items={[
                    {
                      value: "blog",
                      label: "Blog Posts",
                      activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0F0276] data-[state=active]:to-[#0F0276]/90",
                    },
                    {
                      value: "tips",
                      label: "Tips & Drills",
                      activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0F0276] data-[state=active]:to-[#0F0276]/90",
                    },
                  ]}
                  listClassName="grid w-full grid-cols-2 p-1 bg-gradient-to-r from-slate-100 to-slate-200/50 rounded-xl mb-4 sm:mb-6"
                  triggerClassName="rounded-lg data-[state=active]:shadow-md font-semibold transition-all duration-200"
                >
                  <TabsContent value="blog" className="space-y-6 mt-6">
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setIsCreateBlogPostOpen(true)}
                        className="bg-gradient-to-r from-[#D8BD2A] to-[#D8BD2A]/90 hover:from-[#D8BD2A]/90 hover:to-[#D8BD2A] border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-semibold text-[#0F0276]"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        New Blog Post
                      </Button>
                    </div>
                    
                    {/* Edit Blog Post Dialog */}
                    <AdminModal 
                      isOpen={!!editingPost} 
                      onClose={() => setEditingPost(null)}
                      title="Edit Blog Post"
                      size="3xl"
                    >
                        {editingPost && (
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const content = sectionsToContent(editingPostSections);
                            updateBlogPostMutation.mutate({ 
                              ...editingPost, 
                              content,
                              // Convert ContentSection to the schema format
                              sections: editingPostSections.map(section => ({
                                title: section.caption || '', // Use caption or empty string
                                content: section.content,
                                imageUrl: section.type === 'image' ? section.content : undefined
                              }))
                            });
                          }}>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-blog-title">Title</Label>
                                <Input
                                  id="edit-blog-title"
                                  value={editingPost.title}
                                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-blog-excerpt">Excerpt</Label>
                                <Textarea
                                  id="edit-blog-excerpt"
                                  value={editingPost.excerpt}
                                  onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                                  rows={3}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-blog-category">Category</Label>
                                <Input
                                  id="edit-blog-category"
                                  value={editingPost.category || ''}
                                  onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Content</Label>
                                <SectionBasedContentEditor
                                  sections={editingPostSections}
                                  onChange={setEditingPostSections}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  type="submit"
                                  className="bg-gradient-to-r from-[#0F0276] to-[#0F0276]/90 hover:from-[#0F0276]/90 hover:to-[#0F0276] border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-semibold"
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </div>
                          </form>
                        )}
                    </AdminModal>
                    
                    <div className="grid grid-cols-1 gap-6">
                      {blogPosts.map((post) => (
                        <AdminCard 
                          key={post.id} 
                          className="group hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          <AdminCardContent className="p-6">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0 space-y-3">
                                <h3 className="text-xl font-bold text-[#0F0276] dark:text-white group-hover:text-[#0F0276]/80 dark:group-hover:text-white/90 transition-colors line-clamp-2">
                                  {post.title}
                                </h3>
                                <p className="text-slate-600 dark:text-white text-sm leading-relaxed line-clamp-3">
                                  {post.excerpt}
                                </p>
                                <div className="flex items-center gap-3 pt-2">
                                  <Badge 
                                    variant="secondary" 
                                    className="bg-gradient-to-r from-[#D8BD2A]/20 to-[#D8BD2A]/30 text-[#0F0276] dark:text-white font-medium rounded-lg px-3 py-1"
                                  >
                                    {post.category}
                                  </Badge>
                                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-white">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium">
                                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'No date'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingPost(post)}
                                  className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-3 py-2 font-semibold dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteBlogPostMutation.mutate(post.id)}
                                  className="bg-gradient-to-r from-red-500 to-red-600 border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-3 py-2 font-semibold"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </AdminCardContent>
                        </AdminCard>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tips" className="space-y-6 mt-6">
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setIsCreateTipOpen(true)}
                        className="bg-gradient-to-r from-[#D8BD2A] to-[#D8BD2A]/90 hover:from-[#D8BD2A]/90 hover:to-[#D8BD2A] border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-semibold text-[#0F0276]"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        New Tip
                      </Button>
                    </div>
                    
                    {/* Edit Tip Dialog */}
                    <AdminModal 
                      isOpen={!!editingTip} 
                      onClose={() => setEditingTip(null)}
                      title="Edit Tip"
                      size="3xl"
                    >
                        {editingTip && (
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const content = sectionsToContent(editingTipSections);
                            updateTipMutation.mutate({ 
                              ...editingTip, 
                              content,
                              // Convert ContentSection to the schema format
                              sections: editingTipSections.map(section => ({
                                title: section.caption || '', // Use caption or empty string instead of 'text'
                                content: section.content,
                                imageUrl: section.type === 'image' ? section.content : undefined
                              }))
                            });
                          }}>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-tip-title">Title</Label>
                                <Input
                                  id="edit-tip-title"
                                  value={editingTip.title}
                                  onChange={(e) => setEditingTip({ ...editingTip, title: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-tip-category">Category</Label>
                                <Select
                                  value={editingTip.category}
                                  onValueChange={(value) => setEditingTip({ ...editingTip, category: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="vault">Vault</SelectItem>
                                    <SelectItem value="bars">Bars</SelectItem>
                                    <SelectItem value="beam">Beam</SelectItem>
                                    <SelectItem value="floor">Floor</SelectItem>
                                    <SelectItem value="drills">Drills</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="edit-tip-difficulty">Difficulty</Label>
                                <Select
                                  value={editingTip.difficulty}
                                  onValueChange={(value) => setEditingTip({ ...editingTip, difficulty: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                    <SelectItem value="elite">Elite</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="edit-tip-video">Video URL (optional)</Label>
                                <Input
                                  id="edit-tip-video"
                                  value={editingTip.videoUrl || ''}
                                  onChange={(e) => setEditingTip({ ...editingTip, videoUrl: e.target.value })}
                                  placeholder="YouTube or Vimeo URL"
                                />
                              </div>
                              <div>
                                <Label>Content</Label>
                                <SectionBasedContentEditor
                                  sections={editingTipSections}
                                  onChange={setEditingTipSections}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="submit"
                                  className="bg-gradient-to-r from-[#0F0276] to-[#0F0276]/90 hover:from-[#0F0276]/90 hover:to-[#0F0276] border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-semibold"
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </div>
                          </form>
                        )}
                    </AdminModal>                    <div className="grid grid-cols-1 gap-6">
                      {tips.map((tip) => (
                        <AdminCard 
                          key={tip.id} 
                          className="group hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          <AdminCardContent className="p-6">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0 space-y-3">
                                <h3 className="text-xl font-bold text-[#0F0276] dark:text-white group-hover:text-[#0F0276]/80 dark:group-hover:text-white/90 transition-colors line-clamp-2">
                                  {tip.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge 
                                    variant="secondary" 
                                    className="bg-gradient-to-r from-[#D8BD2A]/20 to-[#D8BD2A]/30 text-[#0F0276] dark:text-white font-medium rounded-lg px-3 py-1"
                                  >
                                    {tip.category}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200 text-blue-700 dark:from-blue-800 dark:to-blue-900 dark:border-blue-600 dark:text-blue-200 font-medium rounded-lg px-3 py-1"
                                  >
                                    {tip.difficulty}
                                  </Badge>
                                  {tip.videoUrl && (
                                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg px-3 py-1">
                                      📹 Has Video
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingTip(tip)}
                                  className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-3 py-2 font-semibold dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteTipMutation.mutate(tip.id)}
                                  className="bg-gradient-to-r from-red-500 to-red-600 border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-3 py-2 font-semibold"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </AdminCardContent>
                        </AdminCard>
                      ))}
                    </div>
                  </TabsContent>
                </AdminContentTabs>
              </div>
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="schedule" role="tabpanel" id="schedule-panel" aria-labelledby="schedule-tab" className="w-full max-w-full px-0 sm:px-2">
            <MainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <Clock className="h-8 w-8 text-[#D8BD2A]" />
                  Schedule & Availability
                </span>
              }
            >
              <div className="space-y-6">
                {/* Booking Cutoff System Overview */}
                <AdminCard>
                  <AdminCardContent className="p-6">
                      <h3 className="text-xl font-bold mb-3 text-blue-800 dark:text-white flex items-center gap-2">
                        🚀 Booking Cutoff System
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                        The system automatically prevents scheduling conflicts by restricting lesson bookings based on your availability and lesson duration.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <AdminCard>
                          <AdminCardContent className="p-4">
                            <h4 className="font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                              📅 30-minute Lessons
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                              Quick Journey & Dual Quest lessons automatically cut off 30 minutes before your end time.
                            </p>
                          </AdminCardContent>
                        </AdminCard>
                        <AdminCard>
                          <AdminCardContent className="p-4">
                            <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                              ⏰ 60-minute Lessons
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                              Deep Dive & Partner Progression lessons automatically cut off 60 minutes before your end time.
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                              Example: If you end at 3:30 PM, last 60-min lesson starts at 2:30 PM
                            </p>
                          </AdminCardContent>
                        </AdminCard>
                      </div>
                    </AdminCardContent>
                  </AdminCard>

                  {/* Schedule Management Tabs */}
                  <Tabs defaultValue="availability" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 p-1 bg-gradient-to-r from-slate-100 to-slate-200/50 rounded-xl mb-6">
                      <TabsTrigger 
                        value="availability" 
                        className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0F0276] data-[state=active]:to-[#0F0276]/90 data-[state=active]:text-white data-[state=active]:shadow-md font-semibold transition-all duration-200"
                      >
                        📅 Regular Availability
                      </TabsTrigger>
                      <TabsTrigger 
                        value="events" 
                        className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/90 data-[state=active]:text-[#0F0276] data-[state=active]:shadow-md font-semibold transition-all duration-200"
                      >
                        🎯 Events & Blocks
                      </TabsTrigger>
                    </TabsList>

                    {/* Regular Availability Tab */}
                    <TabsContent value="availability" className="space-y-6">
                      <EnhancedScheduleManager />
                    </TabsContent>

                    {/* Events & Blocks Tab */}
                    <TabsContent value="events" className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-[#0F0276] dark:text-white flex items-center gap-3">
                          <Calendar className="h-7 w-7 text-[#D8BD2A]" />
                          Events & Schedule
                          <Badge variant="secondary" className="bg-gradient-to-r from-[#D8BD2A]/20 to-[#D8BD2A]/30 text-[#0F0276] dark:text-white font-bold rounded-xl px-3 py-1">
                            {(events?.length || 0)} items
                          </Badge>
                        </h3>
                        <Button 
                          onClick={() => {
                            // Reset to default state (informational event)
                            setNewEvent({
                              ...newEvent,
                              isAvailabilityBlock: false,
                              blockingReason: ""
                            });
                            setIsEventModalOpen(true);
                          }}
                          className="bg-gradient-to-r from-[#D8BD2A] to-[#D8BD2A]/90 hover:from-[#D8BD2A]/90 hover:to-[#D8BD2A] border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-4 py-2 font-semibold text-[#0F0276]"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Event
                        </Button>
                      </div>

                      {/* React Big Calendar */}
                      <AdminCard className="p-0 overflow-hidden">
                        <div className="h-[600px] p-4">
                          <BigCalendar
                            localizer={localizer}
                            events={
                              (events?.map(event => {
                                const startDate = new Date(event.startAt);
                                const endDate = new Date(event.endAt);
                                return {
                                  id: `event-${event.id}`,
                                  title: event.title || 'Event',
                                  start: startDate,
                                  end: endDate,
                                  allDay: event.isAllDay,
                                  resource: { ...event, type: 'event' }
                                };
                              }) || [])
                            }
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%' }}
                            onSelectEvent={(event) => {
                              const resource = event.resource;
                              if (resource.type === 'event') setViewingEvent(resource as any);
                            }}
                            eventPropGetter={(event) => {
                              const resource = event.resource as any; // Cast to any for property access
                              
                              let backgroundColor = legendColors['Default'].bg;
                              let borderColor = legendColors['Default'].border;
                              
                              if (resource.type === 'event') {
                                // Function to intelligently map categories and blocking reasons to legend colors
                                const getCategoryKey = (category: string | null, blockingReason: string | null, isAvailabilityBlock: boolean): string => {
                                  // Direct category match first
                                  if (category && legendColors[category]) {
                                    return category;
                                  }
                                  
                                  // For availability blocks, map blocking reasons to categories
                                  if (isAvailabilityBlock && blockingReason) {
                                    const reason = blockingReason.toLowerCase();
                                    
                                    // Medical/health appointments
                                    if (reason.includes('medical') || reason.includes('doctor') || reason.includes('health')) {
                                      return 'Medical Appointment';
                                    }
                                    if (reason.includes('dental') || reason.includes('dentist')) {
                                      return 'Dental Appointment';
                                    }
                                    
                                    // Work-related
                                    if (reason.includes('work') || reason.includes('meeting') || reason.includes('conference')) {
                                      return 'Busy: Work';
                                    }
                                    
                                    // Personal appointments
                                    if (reason.includes('personal') || reason.includes('appointment')) {
                                      return 'Busy: Personal';
                                    }
                                    
                                    // Gymnastics-related
                                    if (reason.includes('practice') || reason.includes('training')) {
                                      if (reason.includes('coaching') || reason.includes('coach')) {
                                        return 'Coaching: Practice';
                                      } else {
                                        return 'Own: Practice';
                                      }
                                    }
                                    
                                    // Competition/meet related
                                    if (reason.includes('competition') || reason.includes('meet') || reason.includes('cup') || reason.includes('championship')) {
                                      if (reason.includes('coaching') || reason.includes('coach')) {
                                        return 'Coaching: Team Meet/Competition';
                                      } else {
                                        return 'Own: Team Meet/Competition';
                                      }
                                    }
                                    
                                    // Default for unknown blocking reasons - treat as personal busy time
                                    return 'Busy: Personal';
                                  }
                                  
                                  // For regular events without specific categories, use a neutral color
                                  return 'Default';
                                };
                                
                                const categoryKey = getCategoryKey(resource.category, resource.blockingReason, resource.isAvailabilityBlock);
                                
                                if (legendColors[categoryKey]) {
                                  backgroundColor = legendColors[categoryKey].bg;
                                  borderColor = legendColors[categoryKey].border;
                                }
                              } else if (resource.category && legendColors[resource.category]) {
                                backgroundColor = legendColors[resource.category].bg;
                                borderColor = legendColors[resource.category].border;
                              }
                              
                              return {
                                style: {
                                  backgroundColor,
                                  borderColor,
                                  color: 'white',
                                  fontWeight: '500',
                                  borderRadius: '4px',
                                  border: `2px solid ${borderColor}`,
                                  cursor: 'pointer'
                                }
                              };
                            }}
                            views={['month', 'week', 'day', 'agenda']}
                            defaultView="month"
                            toolbar={true}
                            popup={true}
                            popupOffset={{x: 0, y: 0}}
                            formats={{
                              eventTimeRangeFormat: ({ start, end }, culture, localizer) => {
                                return localizer?.format(start, 'h:mm A', culture) + ' - ' + localizer?.format(end, 'h:mm A', culture);
                              },
                            }}
                            components={{
                              event: ({ event }) => {
                                const resource = event.resource as any; // Cast for property access
                                return (
                                  <div className="text-xs font-medium truncate">
                                    {event.title}{resource.recurrenceRule ? ' 🔁' : ''}
                                    {resource.category && (
                                      <div className="text-xs opacity-80 truncate">
                                        {resource.category}
                                      </div>
                                    )}
                                  </div>
                                );
                              },
                            }}
                          />
                        </div>
                      </AdminCard>

                      {/* Legend */}
                      <AdminCard>
                        <AdminCardHeader>
                          <AdminCardTitle className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-[#D8BD2A] to-[#D8BD2A]/80 rounded"></div>
                            Calendar Legend
                          </AdminCardTitle>
                        </AdminCardHeader>
                        <AdminCardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{backgroundColor: legendColors['Coaching: Team Meet/Competition'].bg}}></div>
                              <span>Coaching Competitions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{backgroundColor: legendColors['Coaching: Practice'].bg}}></div>
                              <span>Coaching Practice</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{backgroundColor: legendColors['Own: Team Meet/Competition'].bg}}></div>
                              <span>Own Competitions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{backgroundColor: legendColors['Own: Practice'].bg}}></div>
                              <span>Own Practice</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{backgroundColor: legendColors['Medical Appointment'].bg}}></div>
                              <span>Medical</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{backgroundColor: legendColors['Dental Appointment'].bg}}></div>
                              <span>Dental</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{backgroundColor: legendColors['Meeting'].bg}}></div>
                              <span>Meetings</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{backgroundColor: legendColors['Busy: Work'].bg}}></div>
                              <span>Work</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{backgroundColor: legendColors['Busy: Personal'].bg}}></div>
                              <span>Personal</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{backgroundColor: legendColors['Default'].bg}}></div>
                              <span>Default/Other</span>
                            </div>
                          </div>
                        </AdminCardContent>
                      </AdminCard>

                      {/* List View */}
                      <AdminCard>
                        <AdminCardHeader>
                          <AdminCardTitle className="flex items-center gap-2">
                            <List className="h-5 w-5 text-[#D8BD2A]" />
                            List View
                          </AdminCardTitle>
                          {/* Legacy controls removed */}
                        </AdminCardHeader>
                        <AdminCardContent>
                          <div className="grid grid-cols-1 gap-4">
                            {(events || []).map(ev => ({
                              id: ev.id,
                              date: ev.startAt ? new Date(ev.startAt).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
                              startTime: ev.startAt ? new Date(ev.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
                              endTime: ev.endAt ? new Date(ev.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
                              allDay: ev.isAllDay,
                              title: ev.title,
                              reason: ev.blockingReason,
                              category: ev.isAvailabilityBlock ? 'Blocked' : undefined,
                              notes: ev.notes,
                              type: 'event'
                            }))
                              ?.sort((a, b) => {
                                // Parse dates to avoid timezone issues when sorting
                                const [yearA, monthA, dayA] = a.date.split('-').map(Number);
                                const [yearB, monthB, dayB] = b.date.split('-').map(Number);
                                const dateA = new Date(yearA, monthA - 1, dayA);
                                const dateB = new Date(yearB, monthB - 1, dayB);
                                return dateA.getTime() - dateB.getTime();
                              })
                              ?.map((exception) => (
                                <div key={exception.id + '-event'} className="border-l-4 border-[#D8BD2A] bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                    <div className="space-y-2 flex-1 min-w-0">
                                      <div className="flex items-center gap-3">
                                        <div className="text-lg font-bold text-[#0F0276] dark:text-white">
                                          {(() => {
                                            // Parse date to avoid timezone issues
                                            const [year, month, day] = exception.date.split('-').map(Number);
                                            const localDate = new Date(year, month - 1, day);
                                            return localDate.toLocaleDateString('en-US', { 
                                              weekday: 'long', 
                                              year: 'numeric', 
                                              month: 'long', 
                                              day: 'numeric' 
                                            });
                                          })()}
                                        </div>
                                        {exception.title && (
                                          <Badge variant="outline" className="bg-[#D8BD2A]/10 border-[#D8BD2A] text-[#0F0276]">
                                            {exception.title}
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                                        {exception.allDay ? (
                                          <div className="flex items-center gap-2">
                                            <CalendarX className="h-4 w-4 text-[#D8BD2A]" />
                                            <span className="font-medium">All Day</span>
                                          </div>
                                        ) : exception.startTime && exception.endTime ? (
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-[#D8BD2A]" />
                                            <span className="font-medium">{exception.startTime} - {exception.endTime}</span>
                                          </div>
                                        ) : null}
                                        
                                        {exception.category && (
                                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium">
                                            {exception.category}
                                          </Badge>
                                        )}
                                      </div>

                                      {exception.reason && (
                                        <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                          <strong>Reason:</strong> {exception.reason}
                                        </p>
                                      )}

                                      {exception.notes && (
                                        <p className="text-sm text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                          <strong>Notes:</strong> {exception.notes}
                                        </p>
                                      )}
                                    </div>

                                    <div className="w-full sm:w-auto flex flex-wrap sm:flex-nowrap gap-2 sm:ml-4 justify-start sm:justify-end">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const full = (events || []).find(e => e.id === exception.id);
                                          setViewingEvent(full as any || (exception as any));
                                        }}
                                        className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-3 py-2 font-semibold dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
                                        title="View Details"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                          const fullEvent = (events || []).find(e => e.id === exception.id);
                                          setDeletingEvent(fullEvent as any || (exception as any));
                                        }}
                                        className="bg-gradient-to-r from-red-500 to-red-600 border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-3 py-2 font-semibold"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}

                            {(!events || events.length === 0) && (
                              <div className="text-center py-12">
                                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-[#D8BD2A]/20 to-[#D8BD2A]/30 rounded-full flex items-center justify-center mb-4">
                                  <Calendar className="h-12 w-12 text-[#D8BD2A]" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No events or blocks found</h3>
                                <p className="text-slate-600 dark:text-slate-200 max-w-md mx-auto">
                                  No events have been created yet. Use "Add Event" to get started.
                                </p>
                              </div>
                            )}
                          </div>
                        </AdminCardContent>
                      </AdminCard>
                    </TabsContent>
                  </Tabs>
                </div>
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="parentcomm" className="w-full max-w-full px-0 sm:px-2 dark:bg-[#0F0276] dark:text-white">
            <MainContentContainer
              heading={
                <span className="inline-flex items-center gap-2 sm:gap-3">
                  <MessageCircle className="h-8 w-8 text-[#D8BD2A]" />
                  Parent Communication
                  <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-blue-200/50 text-blue-700 dark:from-blue-800 dark:to-blue-900 dark:text-blue-200 font-bold rounded-xl px-4 py-2 w-fit">
                    Frontend Only - Coming Soon
                  </Badge>
                </span>
              }
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Message List */}
                  <div className="lg:col-span-1">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-[#0F0276] dark:text-white">Messages</h3>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-gradient-to-r from-[#0F0276] to-[#0F0276]/90 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl px-4 py-2 font-semibold"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        New
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { id: 1, parent: "Sarah Johnson", athlete: "Emma Johnson", lastMessage: "Thank you for the great lesson!", time: "2h ago", unread: true },
                        { id: 2, parent: "Mike Chen", athlete: "Lucas Chen", lastMessage: "Can we reschedule Friday's session?", time: "5h ago", unread: false },
                        { id: 3, parent: "Lisa Rodriguez", athlete: "Sofia Rodriguez", lastMessage: "Sofia loved the new routine!", time: "1d ago", unread: false },
                      ].map((thread) => (
                        <AdminCard
                          key={thread.id}
                          className={`rounded-xl cursor-pointer transition-all duration-300 border ${
                            thread.unread 
                              ? 'border-blue-300 bg-white/75 supports-[backdrop-filter]:bg-white/45 backdrop-blur-md shadow-lg hover:shadow-xl' 
                              : 'border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-md hover:shadow-lg'
                          }`}
                        >
                          <AdminCardContent className="p-4">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[#0F0276] dark:text-white truncate">{thread.parent}</p>
                                <p className="text-sm text-slate-600 font-medium truncate">{thread.athlete}</p>
                                <p className="text-sm text-slate-500 mt-2 line-clamp-2">{thread.lastMessage}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs text-slate-500 font-medium">{thread.time}</p>
                                {thread.unread && (
                                  <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mt-1 ml-auto shadow-sm"></div>
                                )}
                              </div>
                            </div>
                          </AdminCardContent>
                        </AdminCard>
                      ))}
                    </div>
                  </div>

                  {/* Message Thread */}
                  <div className="lg:col-span-2">
                    <AdminCard className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg h-fit">
                      <AdminCardHeader className="pb-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-bold text-[#0F0276] dark:text-white">Sarah Johnson</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Parent of Emma Johnson</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-3 py-2"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg px-3 py-2"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </AdminCardHeader>
                      
                      <AdminCardContent className="space-y-6">
                        <div className="space-y-4 max-h-96 overflow-y-auto px-2">
                          <div className="flex justify-start">
                              <div className="rounded-xl p-4 max-w-xs shadow-md border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md">
                              <p className="text-sm text-slate-700 leading-relaxed">Hi {brand.coachName}! Emma is really excited about her upcoming competition.</p>
                              <p className="text-xs text-slate-500 mt-2 font-medium">Yesterday, 3:45 PM</p>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <div className="bg-[#0F0276] text-white rounded-xl p-4 max-w-xs shadow-lg">
                              <p className="text-sm leading-relaxed">That's wonderful! Emma has been working so hard. She's definitely ready!</p>
                              <p className="text-xs text-blue-100 mt-2 font-medium">Yesterday, 4:10 PM</p>
                            </div>
                          </div>
                          <div className="flex justify-start">
                            <div className="rounded-xl p-4 max-w-xs shadow-md border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md">
                              <p className="text-sm text-slate-700 leading-relaxed">Thank you for the great lesson!</p>
                              <p className="text-xs text-slate-500 mt-2 font-medium">Today, 10:30 AM</p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 space-y-4">
                          <div className="flex gap-2">
                            <Select defaultValue="custom">
                              <SelectTrigger className="w-48 rounded-lg border-0 bg-slate-50 shadow-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">Custom Message</SelectItem>
                                <SelectItem value="reschedule">Reschedule Template</SelectItem>
                                <SelectItem value="policy">Policy Reminder</SelectItem>
                                <SelectItem value="thanks">Thank You</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-3">
                            <Textarea 
                              placeholder="Type your message..." 
                              className="flex-1 rounded-lg border-0 bg-slate-50 focus:ring-2 focus:ring-[#0F0276] resize-none"
                              rows={3}
                            />
                            <Button className="self-end bg-gradient-to-r from-[#0F0276] to-[#0F0276]/90 border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg px-6 py-2 font-semibold">
                              Send
                            </Button>
                          </div>
                        </div>
                      </AdminCardContent>
                    </AdminCard>
                  </div>
                </div>

                {/* Email Testing Section */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Email System Testing</h3>
                  <AdminCard>
                    <AdminCardHeader>
                      <AdminCardTitle className="text-sm">Test Email Templates</AdminCardTitle>
                      <p className="text-sm text-gray-600 dark:text-slate-300">Send test emails to verify the system is working properly</p>
                    </AdminCardHeader>
                    <AdminCardContent>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const email = formData.get('email') as string;
                        const type = formData.get('type') as string;
                        
                        if (email && type) {
                          testEmailMutation.mutate({ type, email });
                        }
                      }} className="space-y-4">
                        <div>
                          <Label htmlFor="test-email">Email Address</Label>
                          <Input
                            id="test-email"
                            name="email"
                            type="email"
                            placeholder="test@example.com"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email-type">Email Type</Label>
                          <Select name="type" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select email type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="session-confirmation">Session Confirmation</SelectItem>
                              <SelectItem value="session-cancellation">Session Cancellation</SelectItem>
                              <SelectItem value="new-tip">New Tip/Blog Notification</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          type="submit" 
                          disabled={testEmailMutation.isPending}
                        >
                          {testEmailMutation.isPending ? 'Sending...' : 'Send Test Email'}
                        </Button>
                      </form>
                    </AdminCardContent>
                  </AdminCard>
                </div>
              </div>
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="payments" className="w-full max-w-full px-0 sm:px-2">
            <MainContentContainer 
              heading={
                <div className="flex items-center gap-2 sm:gap-3">
                  <DollarSign className="h-8 w-8 text-[#D8BD2A]" />
                  Payment Management
                </div>
              }
            >
              <PaymentsTab />
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="analytics" className="w-full max-w-full px-0 sm:px-2">
            <MainContentContainer 
              heading={
                <div className="flex items-center gap-2 sm:gap-3">
                  <BarChart className="h-8 w-8 text-[#D8BD2A]" />
                  Analytics Dashboard
                </div>
              }
            >
              <AdminAnalyticsTab
                analyticsHeaderMetrics={analyticsHeaderMetrics}
                allBookings={allBookings}
                lessonTypes={lessonTypes}
                analyticsDateRange={analyticsDateRange}
                setAnalyticsDateRange={setAnalyticsDateRange}
                analyticsLessonType={analyticsLessonType}
                setAnalyticsLessonType={setAnalyticsLessonType}
              />
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="activity-logs" className="w-full max-w-full px-0 sm:px-2">
            <MainContentContainer 
              heading={
                <div className="flex items-center gap-2 sm:gap-3">
                  <Activity className="h-8 w-8 text-[#D8BD2A]" />
                  Activity Logs
                </div>
              }
            >
              <ActivityLogPage />
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="waivers" className="w-full max-w-full px-0 sm:px-2">
            <MainContentContainer 
              heading={
                <div className="flex items-center gap-2 sm:gap-3">
                  <FileText className="h-8 w-8 text-[#D8BD2A]" />
                  Waiver Management
                </div>
              }
            >
              <AdminWaiverManagement />
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="messages" className="w-full max-w-full px-0 sm:px-2">
            <MainContentContainer 
              heading={
                <div className="flex items-center gap-2 sm:gap-3">
                  <MessageSquare className="h-8 w-8 text-[#D8BD2A]" />
                  Messages
                </div>
              }
            >
              <AdminMessagesTab />
            </MainContentContainer>
          </TabsContent>

          <TabsContent value="settings" className="w-full max-w-full px-0 sm:px-2">
            <MainContentContainer 
              heading={
                <div className="flex items-center gap-2 sm:gap-3">
                  <Settings className="h-8 w-8 text-[#D8BD2A]" />
                  Settings
                </div>
              }
            >
              <AdminSettingsTab
                isDeleteConfirmOpen={isDeleteConfirmOpen}
                setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
                clearDataMutation={clearDataMutation}
                handleClearTestData={handleClearTestData}
                handleGenerateTestBookings={handleGenerateTestBookings}
                generateBookingsMutation={generateBookingsMutation}
                handleCreateTestParent={handleCreateTestParent}
                handleSimulatePaymentSuccess={handleSimulatePaymentSuccess}
                handleResetPaymentStatus={handleResetPaymentStatus}
                handleSystemHealthCheck={handleSystemHealthCheck}
                handleDatabaseTest={handleDatabaseTest}
                createParentMutation={createParentMutation}
                paymentSimulationMutation={paymentSimulationMutation}
                paymentResetMutation={paymentResetMutation}
                healthCheckMutation={healthCheckMutation}
                databaseTestMutation={databaseTestMutation}
                deleteUserAccountsMutation={deleteUserAccountsMutation}
                setIsDeleteUsersConfirmOpen={setIsDeleteUsersConfirmOpen}
              />
            </MainContentContainer>
          </TabsContent>
        </Tabs>
        
        {/* Parent Details Dialog */}
        <AdminModal 
          isOpen={!!viewingParent} 
          onClose={() => setViewingParent(null)}
          title="Parent Details"
          size="4xl"
          showCloseButton={false}
        >
          {viewingParent && selectedParentDetails && (
            <>
              {/* Basic Information */}
              <AdminModalSection
                title="Basic Information"
                icon={<User className="h-5 w-5" />}
              >
                <AdminModalGrid cols={2}>
                  <div>
                    <AdminModalDetailRow
                      label="Full Name"
                      value={`${selectedParentDetails.firstName || selectedParentDetails.first_name} ${selectedParentDetails.lastName || selectedParentDetails.last_name}`}
                      icon={<User className="h-4 w-4" />}
                    />
                    <AdminModalDetailRow
                      label="Email"
                      value={selectedParentDetails.email}
                      icon={<Mail className="h-4 w-4" />}
                    />
                    <AdminModalDetailRow
                      label="Phone"
                      value={selectedParentDetails.phone}
                      icon={<Phone className="h-4 w-4" />}
                    />
                  </div>
                  <div>
                    <AdminModalDetailRow
                      label="Parent ID"
                      value={selectedParentDetails.id}
                      icon={<User className="h-4 w-4" />}
                    />
                    <AdminModalDetailRow
                      label="Emergency Contact"
                      value={selectedParentDetails.emergencyContactName || selectedParentDetails.emergency_contact_name || 'Not provided'}
                      icon={<AlertCircle className="h-4 w-4" />}
                    />
                    {(selectedParentDetails.emergencyContactPhone || selectedParentDetails.emergency_contact_phone) && (
                      <AdminModalDetailRow
                        label="Emergency Phone"
                        value={selectedParentDetails.emergencyContactPhone || selectedParentDetails.emergency_contact_phone}
                        icon={<Phone className="h-4 w-4" />}
                      />
                    )}
                    <AdminModalDetailRow
                      label="Member Since"
                      value={(selectedParentDetails.createdAt || selectedParentDetails.created_at) ? new Date(selectedParentDetails.createdAt || selectedParentDetails.created_at).toLocaleDateString() : 'Unknown'}
                      icon={<CalendarDays className="h-4 w-4" />}
                    />
                  </div>
                </AdminModalGrid>
              </AdminModalSection>

              {/* Athletes */}
              {selectedParentDetails.athletes && selectedParentDetails.athletes.length > 0 && (
                <AdminModalSection
                  title={`Athletes (${selectedParentDetails.athletes.length})`}
                  icon={<Dumbbell className="h-5 w-5" />}
                  className="mt-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedParentDetails.athletes.map((athlete: any) => (
                      <div
                        key={athlete.id}
                        className="p-4 cursor-pointer border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 bg-white dark:bg-slate-800/30"
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for ${athlete.firstName || athlete.first_name || ''} ${athlete.lastName || athlete.last_name || ''}`}
                        onClick={() => {
                          setSelectedAthlete({
                            ...athlete,
                            name: `${athlete.firstName || athlete.first_name || ''} ${athlete.lastName || athlete.last_name || ''}`.trim(),
                            dateOfBirth: athlete.date_of_birth || athlete.dateOfBirth || athlete.birth_date || '',
                            photo: athlete.photo,
                          });
                          setIsAthleteViewOpen(true);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedAthlete({
                              ...athlete,
                              name: `${athlete.firstName || athlete.first_name || ''} ${athlete.lastName || athlete.last_name || ''}`.trim(),
                              dateOfBirth: athlete.date_of_birth || athlete.dateOfBirth || athlete.birth_date || '',
                              photo: athlete.photo,
                            });
                            setIsAthleteViewOpen(true);
                          }
                        }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <UserCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              {athlete.firstName || athlete.first_name || ''} {athlete.lastName || athlete.last_name || athlete.name?.split(' ').slice(1).join(' ') || ''}
                            </h4>
                            <Badge variant="outline" className="bg-white dark:bg-slate-700 border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 font-medium">
                              ID: {athlete.id}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                            <p>
                              <strong>Age:</strong>{' '}
                              {(() => {
                                const dob = athlete.date_of_birth || athlete.dateOfBirth || athlete.birth_date;
                                if (dob) {
                                  const age = calculateAge(dob);
                                  return isNaN(age) ? 'Not provided' : age;
                                }
                                return 'Not provided';
                              })()}
                            </p>
                            <p>
                              <strong>Gender:</strong> {(() => {
                                const genderRaw = athlete.gender || athlete.gender_identity || athlete.genderIdentity || '';
                                if (!genderRaw) return 'Not provided';
                                const g = genderRaw.toLowerCase().replace(/\s|_/g, '');
                                if (g === 'male') return 'Male';
                                if (g === 'female') return 'Female';
                                if (g === 'other') return 'Other';
                                if (g === 'prefernottosay' || g === 'prefernotosay' || g === 'prefer_not_to_say') return 'Prefer not to say';
                                return genderRaw;
                              })()}
                            </p>
                            {athlete.skill_level && (
                              <p>
                                <strong>Skill Level:</strong> {athlete.skill_level}
                              </p>
                            )}
                            {athlete.medical_conditions && (
                              <p>
                                <strong>Medical Conditions:</strong> {athlete.medical_conditions}
                              </p>
                            )}
                          </div>
                          {athlete.waivers && athlete.waivers.length > 0 && (
                            <div className="mt-2">
                              <WaiverStatusDisplay 
                                athleteId={athlete.id} 
                                athleteName={`${athlete.firstName || athlete.first_name || ''} ${athlete.lastName || athlete.last_name || ''}`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AdminModalSection>
              )}

              {/* Booking History */}
              {selectedParentDetails.bookings && selectedParentDetails.bookings.length > 0 && (
                <AdminModalSection
                  title={`Booking History (${selectedParentDetails.bookings.length})`}
                  icon={<Calendar className="h-5 w-5" />}
                  className="mt-6"
                >
                  <div className="space-y-3">
                    {selectedParentDetails.bookings
                      .sort((a: any, b: any) => new Date(b.preferred_date).getTime() - new Date(a.preferred_date).getTime())
                      .slice(0, 10)
                      .map((booking: any) => (
                      <div key={booking.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-800/30">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {new Date(`${booking.preferred_date}T12:00:00Z`).toLocaleDateString()}
                              </span>
                              <Badge variant="outline" className="bg-white dark:bg-slate-700 border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 font-medium">
                                #{booking.id}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                              <Dumbbell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <strong>Lesson:</strong> {booking.lesson_type}
                            </p>
                            {booking.special_requests && (
                              <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <strong>Notes:</strong> {booking.special_requests}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <Badge 
                              variant={
                                booking.payment_status === 'reservation-paid' ? 'default' :
                                booking.payment_status === 'reservation-pending' ? 'secondary' : 'destructive'
                              }
                              className={`px-3 py-1 ${
                                booking.payment_status === 'reservation-paid' 
                                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/60' 
                                  : ''
                              }`}
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              {booking.payment_status}
                            </Badge>
                            <Badge 
                              variant={
                                booking.attendance_status === 'confirmed' ? 'default' :
                                booking.attendance_status === 'completed' ? 'default' : 'secondary'
                              }
                              className={`block mt-1 px-3 py-1 ${
                                booking.attendance_status === 'completed' 
                                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/60' 
                                  : ''
                              }`}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {booking.attendance_status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {selectedParentDetails.bookings.length > 10 && (
                      <div className="flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-2 border border-blue-200 dark:border-blue-800">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          Showing 10 most recent bookings of {selectedParentDetails.bookings.length} total
                        </p>
                      </div>
                    )}
                  </div>
                </AdminModalSection>
              )}
              
              {/* Password Management Actions */}
              <AdminModalSection
                title="Password Management"
                icon={<Mail className="h-5 w-5" />}
                className="mt-6"
              >
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    Send password setup or reset emails to this parent. These emails will use the correct production URLs.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => {
                        sendPasswordSetupMutation.mutate({
                          parentId: selectedParentDetails.id,
                          email: selectedParentDetails.email
                        });
                      }}
                      disabled={sendPasswordSetupMutation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {sendPasswordSetupMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Send Password Setup Email
                    </Button>
                    <Button
                      onClick={() => {
                        sendPasswordResetMutation.mutate({
                          parentId: selectedParentDetails.id,
                          email: selectedParentDetails.email
                        });
                      }}
                      disabled={sendPasswordResetMutation.isPending}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {sendPasswordResetMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Send Password Reset Email
                    </Button>
                  </div>
                </div>
              </AdminModalSection>
            </>
          )}
        </AdminModal>

        {/* View Event Details Modal */}
        
        {/* Photo Enlargement Modal */}
        <Dialog open={isPhotoEnlarged} onOpenChange={setIsPhotoEnlarged}>
          <DialogContent 
            className="max-w-4xl max-h-[90vh] overflow-y-auto" 
            aria-labelledby="athlete-photo-title"
            aria-describedby="athlete-photo-description"
          >
            <DialogHeader className="bg-gradient-to-r from-[#0F0276]/10 to-[#D8BD2A]/10 px-6 py-4 rounded-t-lg -mt-6 -mx-6 mb-6">
              <DialogTitle id="athlete-photo-title" className="text-2xl font-black text-[#0F0276] dark:text-white tracking-tight flex items-center gap-3">
                <div className="p-2 bg-[#D8BD2A]/20 rounded-lg">
                  <User className="h-5 w-5 text-[#D8BD2A]" />
                </div>
                Athlete Photo
              </DialogTitle>
              <DialogDescription id="athlete-photo-description" className="text-slate-600">
                Enlarged view of the athlete's photo
              </DialogDescription>
            </DialogHeader>
            {enlargedPhoto && (
              <div className="flex justify-center">
                <img
                  src={enlargedPhoto}
                  alt="Enlarged athlete photo"
                  className="max-w-full max-h-[70vh] rounded-lg shadow-lg border-4 border-white"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Athlete Edit Modal */}
        <AdminModal 
          isOpen={isAthleteEditOpen} 
          onClose={() => setIsAthleteEditOpen(false)}
          title="Edit Athlete"
          size="2xl"
          showCloseButton={false}
        >
      {selectedAthlete && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const firstName = formData.get('firstName') as string;
                const lastName = formData.get('lastName') as string;
                updateAthleteMutation.mutate({
                  id: selectedAthlete.id,
                  data: {
                    firstName,
                    lastName,
                    name: `${firstName} ${lastName}`,
                    dateOfBirth: formData.get('dateOfBirth') as string,
                    gender: (formData.get('gender') as "Male" | "Female" | "Other" | "Prefer not to say") || undefined,
                    experience: formData.get('experience') as any,
        allergies: formData.get('allergies') as string || null,
        isGymMember: editIsGymMember,
                  }
                });
              }}>
                <div className="space-y-6">
                  {/* Photo Upload Section */}
                  <div className="flex flex-col items-center space-y-3">
                    <h3 className="text-lg font-semibold text-[#0F0276] dark:text-white">Athlete Photo</h3>
                    <div className="relative">
                      {selectedAthlete.photo ? (
                        <img
                          src={selectedAthlete.photo}
                          alt={`${selectedAthlete.name}'s photo`}
                          className="w-28 h-28 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-blue-100 ring-offset-2 shadow-md"
                          onClick={() => handlePhotoClick(selectedAthlete.photo!)}
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center ring-2 ring-blue-100 ring-offset-2 shadow-md">
                          <User className="h-12 w-12 text-blue-300" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, selectedAthlete.id)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingPhoto}
                      />
                      {uploadingPhoto && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <img 
                            src="/assets/betteh_logo_black_font.png" 
                            alt="Loading" 
                            className="animate-spin w-6 h-6" 
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center">
                      <Edit className="h-3 w-3 mr-1" />
                      Click photo to enlarge or upload new
                    </p>
                  </div>

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#0F0276] dark:text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-[#D8BD2A]" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-firstName">First Name *</Label>
                        <Input
                          id="edit-firstName"
                          name="firstName"
                          defaultValue={selectedAthlete.firstName || (selectedAthlete.name ? selectedAthlete.name.split(' ')[0] : '')}
                          required
                          autoComplete="given-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-lastName">Last Name *</Label>
                        <Input
                          id="edit-lastName"
                          name="lastName"
                          defaultValue={selectedAthlete.lastName || (selectedAthlete.name ? selectedAthlete.name.split(' ').slice(1).join(' ') : '')}
                          required
                          autoComplete="family-name"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <Label>Gym Membership</Label>
                        <p className="text-sm text-muted-foreground">Toggle on if athlete is already in gym classes.</p>
                      </div>
                      <Switch
                        checked={editIsGymMember}
                        onCheckedChange={setEditIsGymMember}
                        aria-label="Toggle gym membership"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-dob">Date of Birth *</Label>
                        <Input
                          id="edit-dob"
                          name="dateOfBirth"
                          type="date"
                          defaultValue={selectedAthlete.dateOfBirth || ''}
                          required
                          autoComplete="bday"
                        />
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Used to calculate age for appropriate class placement
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="edit-gender">Gender</Label>
                        <GenderSelect
                          name="gender"
                          defaultValue={selectedAthlete.gender || ""}
                          id="edit-gender"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Training Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#0F0276] dark:text-white flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-[#D8BD2A]" />
                      Training Information
                    </h3>
                    <div>
                      <Label htmlFor="edit-experience">Experience Level *</Label>
                      <Select
                        name="experience"
                        defaultValue={selectedAthlete.experience}
                        required
                      >
                        <SelectTrigger id="edit-experience">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="elite">Elite</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Used to match appropriate coaching and skill development
                      </p>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#0F0276] dark:text-white flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-[#D8BD2A]" />
                      Medical Information
                    </h3>
                    <div>
                      <Label htmlFor="edit-allergies">Allergies/Medical Notes</Label>
                      <Textarea
                        id="edit-allergies"
                        name="allergies"
                        defaultValue={selectedAthlete.allergies || ''}
                        placeholder="Any allergies or medical conditions..."
                        rows={3}
                      />
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Important medical information for coaches to be aware of
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      type="submit"
                      aria-label={`Save changes for ${selectedAthlete.name}`}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-1">
                        <Save className="h-4 w-4 mr-1" />
                        Save Changes
                      </div>
                    </Button>
                  </div>
                </div>
              </form>
            )}
        </AdminModal>

        {/* Athlete View Modal */}
        <AthleteDetailDialog
          open={isAthleteViewOpen && !!selectedAthlete}
          onOpenChange={setIsAthleteViewOpen}
          athlete={selectedAthlete}
          bookings={bookings}
          parentInfo={selectedAthlete ? parentMapping.get(`${selectedAthlete.name}-${selectedAthlete.dateOfBirth}`) : undefined}
          onBookSession={() => {
            setIsAthleteViewOpen(false);
            setAdminBookingContext('from-athlete');
            setPreSelectedAthleteId(selectedAthlete?.id);
            setShowUnifiedBooking(true);
          }}
          onEditAthlete={() => {
            setIsAthleteViewOpen(false);
            setIsAthleteEditOpen(true);
          }}
          showActionButtons={true}
        />

        {/* Delete Athlete Error Modal */}
        <Dialog open={!!deleteAthleteError} onOpenChange={() => setDeleteAthleteError(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cannot Delete Athlete</DialogTitle>
              <DialogDescription>
                {deleteAthleteError && (
                  <>
                    <p className="mb-3">
                      {deleteAthleteError.athlete.name} has {deleteAthleteError.activeBookings.length} active booking{deleteAthleteError.activeBookings.length > 1 ? 's' : ''} that must be cancelled first.
                    </p>
                    <div className="space-y-2">
                      {deleteAthleteError.activeBookings.map((booking) => (
                        <div key={booking.id} className="text-sm border rounded p-2">
                          <p className="font-medium">{booking.preferredDate} at {booking.preferredTime}</p>
                          <p className="text-gray-600 dark:text-slate-300">{(() => {
                            const lt = booking.lessonType;
                            const name = (typeof lt === 'object' && lt && 'name' in lt) 
                              ? (lt as any).name 
                              : lt;
                            return name || 'Unknown';
                          })()} - Status: {booking.status}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm">
                      Please cancel these sessions before deleting the athlete.
                    </p>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => setDeleteAthleteError(null)}>Understood</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Parent Edit Modal */}
        <AdminModal 
          isOpen={isParentEditOpen} 
          onClose={() => setIsParentEditOpen(false)}
          title="Edit Parent Information"
          size="2xl"
          showCloseButton={false}
        >
            {editingParent && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#0F0276] dark:text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-[#D8BD2A]" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="parent-first-name">First Name</Label>
                      <Input 
                        id="parent-first-name"
                        value={editParentForm.firstName}
                        onChange={(e) => setEditParentForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="First Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="parent-last-name">Last Name</Label>
                      <Input 
                        id="parent-last-name"
                        value={editParentForm.lastName}
                        onChange={(e) => setEditParentForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="parent-email">Email</Label>
                    <Input 
                      id="parent-email"
                      type="email"
                      value={editParentForm.email}
                      onChange={(e) => setEditParentForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email"
                    />
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      Used for account access and communication
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="parent-phone">Phone</Label>
                    <Input 
                      id="parent-phone"
                      value={editParentForm.phone}
                      onChange={(e) => setEditParentForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone Number"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#0F0276] dark:text-white flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-[#D8BD2A]" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency-name">Contact Name</Label>
                      <Input 
                        id="emergency-name"
                        value={editParentForm.emergencyContactName}
                        onChange={(e) => setEditParentForm(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                        placeholder="Emergency Contact Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency-phone">Contact Phone</Label>
                      <Input 
                        id="emergency-phone"
                        value={editParentForm.emergencyContactPhone}
                        onChange={(e) => setEditParentForm(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                        placeholder="Emergency Contact Phone"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    onClick={() => {
                      if (editingParent) {
                        const updateData = {
                          firstName: editParentForm.firstName,
                          lastName: editParentForm.lastName,
                          email: editParentForm.email,
                          phone: editParentForm.phone,
                          emergencyContactName: editParentForm.emergencyContactName,
                          emergencyContactPhone: editParentForm.emergencyContactPhone
                        };
                        saveParentMutation.mutate({ id: editingParent.id, data: updateData });
                      }
                    }}
                    disabled={saveParentMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveParentMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
        </AdminModal>

        {/* Unified Booking Modal for Admin Flows */}
        <UnifiedBookingModal
          isOpen={showUnifiedBooking}
          onClose={() => {
            setShowUnifiedBooking(false);
            setPreSelectedAthleteId(undefined);
          }}
          isAdminFlow={true}
          adminContext={adminBookingContext}
          preSelectedAthleteId={preSelectedAthleteId}
        />

        {/* Manual Booking Modal from Athlete Profile - DEPRECATED */}
        {/* This has been replaced with UnifiedBookingModal above */}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Clear Test Data</DialogTitle>
              <DialogDescription>
                <div className="space-y-2">
                  <p>Are you sure you want to clear all test data? This action will permanently delete:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All bookings</li>
                    <li>All athletes</li>
                    <li>All parents</li>
                    <li>All authentication codes</li>
                    <li>All test waiver files</li>
                  </ul>
                  <p className="font-semibold text-red-600">This action cannot be undone!</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  clearDataMutation.mutate();
                  setIsDeleteConfirmOpen(false);
                }}
                disabled={clearDataMutation.isPending}
              >
                {clearDataMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Clearing...
                  </>
                ) : (
                  'Clear All Test Data'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Accounts Confirmation Dialog */}
        <Dialog open={isDeleteUsersConfirmOpen} onOpenChange={setIsDeleteUsersConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete User Accounts</DialogTitle>
              <DialogDescription>
                <div className="space-y-2">
                  <p>Are you sure you want to delete all user accounts created during booking?</p>
                  <p>This will remove all non-admin user accounts from the system.</p>
                  <p className="font-semibold text-red-600">This action cannot be undone!</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteUsersConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteUserAccountsMutation.mutate();
                }}
                disabled={deleteUserAccountsMutation.isPending}
              >
                {deleteUserAccountsMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete User Accounts'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Blog Post Modal */}
        <AdminModal 
          isOpen={isCreateBlogPostOpen} 
          onClose={() => setIsCreateBlogPostOpen(false)}
          title="Create New Blog Post"
          size="3xl"
          showCloseButton={false}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="blog-title">Title</Label>
              <Input
                id="blog-title"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="Enter blog post title"
              />
            </div>
            <div>
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea
                id="blog-excerpt"
                value={newPost.excerpt}
                onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                placeholder="Brief description of the post"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="blog-category">Category</Label>
              <Input
                id="blog-category"
                value={newPost.category || ''}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                placeholder="e.g., Training Tips, Nutrition"
              />
            </div>
            <div>
              <Label>Content</Label>
              <SectionBasedContentEditor
                sections={newPostSections}
                onChange={setNewPostSections}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  const content = sectionsToContent(newPostSections);
                  createBlogPostMutation.mutate({ ...newPost, content });
                }}
                className="bg-gradient-to-r from-[#0F0276] to-[#0F0276]/90 hover:from-[#0F0276]/90 hover:to-[#0F0276] border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-semibold"
              >
                Create Post
              </Button>
            </div>
          </div>
        </AdminModal>

        {/* Create Tip Modal */}
        <AdminModal 
          isOpen={isCreateTipOpen} 
          onClose={() => setIsCreateTipOpen(false)}
          title="Create New Tip"
          size="3xl"
          showCloseButton={false}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="tip-title">Title</Label>
              <Input
                id="tip-title"
                value={newTip.title}
                onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                placeholder="Enter tip title"
              />
            </div>
            <div>
              <Label htmlFor="tip-category">Category</Label>
              <Select
                value={newTip.category}
                onValueChange={(value) => setNewTip({ ...newTip, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vault">Vault</SelectItem>
                  <SelectItem value="bars">Bars</SelectItem>
                  <SelectItem value="beam">Beam</SelectItem>
                  <SelectItem value="floor">Floor</SelectItem>
                  <SelectItem value="drills">Drills</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tip-difficulty">Difficulty</Label>
              <Select
                value={newTip.difficulty}
                onValueChange={(value) => setNewTip({ ...newTip, difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content</Label>
              <SectionBasedContentEditor
                sections={newTipSections}
                onChange={setNewTipSections}
              />
            </div>
            <div>
              <Label htmlFor="tip-video">Video URL (optional)</Label>
              <Input
                id="tip-video"
                value={newTip.videoUrl}
                onChange={(e) => setNewTip({ ...newTip, videoUrl: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  const content = sectionsToContent(newTipSections);
                  createTipMutation.mutate({
                    ...newTip,
                    content,
                    // Convert ContentSection to the schema format
                    sections: newTipSections.map(section => ({
                      title: section.caption || '', // Use caption or empty string instead of 'text'
                      content: section.content,
                      imageUrl: section.type === 'image' ? section.content : undefined
                    })),
                    videoUrl: newTip.videoUrl || null
                  });
                }}
                className="bg-gradient-to-r from-[#0F0276] to-[#0F0276]/90 hover:from-[#0F0276]/90 hover:to-[#0F0276] border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-semibold"
              >
                Create Tip
              </Button>
            </div>
          </div>
        </AdminModal>

        {/* Unified Event/Availability Modal */}
        <AdminModal 
          isOpen={isModalOpen} 
          onClose={handleCancelEdit}
          title={editingEvent ? "Edit Event" : "Add Event"}
          size="4xl"
          showCloseButton={false}
        >
          {/* Event Form */}
          <div className="space-y-6">
            {/* Event Type Toggle - Enhanced */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <Switch 
                  id="availability-block"
                  checked={newEvent.isAvailabilityBlock || false}
                  onCheckedChange={(checked) => setNewEvent({
                    ...newEvent,
                    isAvailabilityBlock: checked,
                    blockingReason: checked ? (newEvent.blockingReason || "Unavailable") : ""
                  })}
                />
                <div className="flex-1">
                  <Label htmlFor="availability-block" className="text-sm font-semibold text-[#0F0276] dark:text-white flex items-center gap-2">
                    {newEvent.isAvailabilityBlock ? (
                      <>
                        <Ban className="h-4 w-4 text-red-500" />
                        Block Availability
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 text-blue-500" />
                        Informational Event
                      </>
                    )}
                  </Label>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {newEvent.isAvailabilityBlock 
                      ? "This will prevent lesson bookings during this time" 
                      : "This is an informational event that won't block bookings"}
                  </p>
                </div>
              </div>
            </div>

            {/* Title and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-[#0F0276] dark:text-white">
                  {newEvent.isAvailabilityBlock ? "Block Reason *" : "Event Title *"}
                </Label>
                <Input
                  value={newEvent.title || ''}
                  onChange={(e) => setNewEvent({
                    ...newEvent,
                    title: e.target.value
                  })}
                  placeholder={newEvent.isAvailabilityBlock 
                    ? "e.g., Doctor Visit, Vacation, Team Practice" 
                    : "e.g., Competition, Meeting, Personal Event"}
                  className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-[#0F0276] dark:text-white">
                  {newEvent.isAvailabilityBlock ? "Blocking Category" : "Event Category"}
                </Label>
                <Select
                  value={newEvent.isAvailabilityBlock ? (newEvent.blockingReason || 'Unavailable') : (newEvent.category || '')}
                  onValueChange={(value) => setNewEvent({
                    ...newEvent,
                    ...(newEvent.isAvailabilityBlock 
                      ? { blockingReason: value } 
                      : { category: value })
                  })}
                >
                  <SelectTrigger className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Coaching: Team Meet/Competition">🏆 Coaching: Team Meet/Competition</SelectItem>
                    <SelectItem value="Coaching: Practice">🤸 Coaching: Practice</SelectItem>
                    <SelectItem value="Own: Team Meet/Competition">🥇 Own: Team Meet/Competition</SelectItem>
                    <SelectItem value="Own: Practice">💪 Own: Practice</SelectItem>
                    <SelectItem value="Medical Appointment">🏥 Medical Appointment</SelectItem>
                    <SelectItem value="Dental Appointment">🦷 Dental Appointment</SelectItem>
                    <SelectItem value="Meeting">🤝 Meeting</SelectItem>
                    <SelectItem value="Busy: Work">💼 Busy: Work</SelectItem>
                    <SelectItem value="Busy: Personal">🏠 Busy: Personal</SelectItem>
                    {newEvent.isAvailabilityBlock && (
                      <SelectItem value="Unavailable">❌ Unavailable</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Time Settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-[#0F0276] dark:text-white">Start Date *</Label>
                  <Input
                    type="date"
                    value={newEvent.startAt ? (() => {
                      const date = new Date(newEvent.startAt);
                      // Apply timezone offset to prevent date shifting
                      const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                      return offsetDate.toISOString().split('T')[0];
                    })() : ''}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      if (!selectedDate) return;
                      
                      const currentStart = newEvent.startAt ? new Date(newEvent.startAt) : new Date();
                      const currentEnd = newEvent.endAt ? new Date(newEvent.endAt) : new Date(Date.now() + 60 * 60 * 1000);
                      
                      // Parse the date and preserve local timezone
                      const [year, month, day] = selectedDate.split('-').map(Number);
                      const newStart = new Date(currentStart);
                      newStart.setFullYear(year, month - 1, day);
                      
                      // Update end date to match if it's the same day, otherwise preserve end date
                      const newEnd = currentStart.toDateString() === currentEnd.toDateString() 
                        ? (() => {
                            const endDate = new Date(currentEnd);
                            endDate.setFullYear(year, month - 1, day);
                            return endDate;
                          })()
                        : currentEnd;
                      
                      setNewEvent({
                        ...newEvent,
                        startAt: newStart,
                        endAt: newEnd
                      });
                    }}
                    className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-[#0F0276] dark:text-white">End Date</Label>
                  <Input
                    type="date"
                    value={newEvent.endAt ? (() => {
                      const date = new Date(newEvent.endAt);
                      // Apply timezone offset to prevent date shifting
                      const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                      return offsetDate.toISOString().split('T')[0];
                    })() : ''}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      if (!selectedDate) return;
                      
                      const currentEnd = newEvent.endAt ? new Date(newEvent.endAt) : new Date();
                      
                      // Parse the date and preserve local timezone
                      const [year, month, day] = selectedDate.split('-').map(Number);
                      const newEnd = new Date(currentEnd);
                      newEnd.setFullYear(year, month - 1, day);
                      
                      setNewEvent({
                        ...newEvent,
                        endAt: newEnd
                      });
                    }}
                    className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Switch 
                  id="all-day"
                  checked={newEvent.isAllDay || false}
                  onCheckedChange={(checked) => setNewEvent({
                    ...newEvent,
                    isAllDay: checked
                  })}
                />
                <Label htmlFor="all-day" className="text-sm font-semibold text-[#0F0276] dark:text-white">
                  All Day Event
                </Label>
              </div>

              {!newEvent.isAllDay && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-[#0F0276] dark:text-white">Start Time</Label>
                    <Input
                      type="time"
                      value={newEvent.startAt ? new Date(newEvent.startAt).toTimeString().slice(0, 5) : ''}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        const currentStart = newEvent.startAt ? new Date(newEvent.startAt) : new Date();
                        const dateStr = currentStart.toISOString().split('T')[0];
                        const newStart = new Date(dateStr + 'T' + timeValue + ':00');
                        
                        setNewEvent({
                          ...newEvent,
                          startAt: newStart
                        });
                      }}
                      className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-[#0F0276] dark:text-white">End Time</Label>
                    <Input
                      type="time"
                      value={newEvent.endAt ? new Date(newEvent.endAt).toTimeString().slice(0, 5) : ''}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        const currentEnd = newEvent.endAt ? new Date(newEvent.endAt) : new Date();
                        const dateStr = currentEnd.toISOString().split('T')[0];
                        const newEnd = new Date(dateStr + 'T' + timeValue + ':00');
                        
                        setNewEvent({
                          ...newEvent,
                          endAt: newEnd
                        });
                      }}
                      className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[#0F0276] dark:text-white">Location (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AddressAutocompleteInput
                  label="Address Line 1"
                  value={newEvent.addressLine1 || ''}
                  onChange={(e) => setNewEvent({
                    ...newEvent,
                    addressLine1: e.target.value
                  })}
                  onPlaceSelected={(addressComponents) => {
                    setNewEvent(prev => ({
                      ...prev,
                      addressLine1: addressComponents.addressLine1 || prev.addressLine1,
                      city: addressComponents.city || prev.city,
                      state: addressComponents.state || prev.state,
                      zipCode: addressComponents.zipCode || prev.zipCode,
                      country: addressComponents.country || prev.country,
                      // Also set the simple location field for backward compatibility
                      location: [
                        addressComponents.addressLine1,
                        addressComponents.city,
                        addressComponents.state
                      ].filter(Boolean).join(', ')
                    }));
                  }}
                  onManualInput={(value) => {
                    setNewEvent(prev => ({
                      ...prev,
                      addressLine1: value,
                      // Update simple location field too
                      location: value
                    }));
                  }}
                  placeholder="123 Main St"
                  className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]"
                  labelClassName="text-sm text-slate-600 dark:text-slate-300"
                  helperText="Start typing for address suggestions"
                  autocompleteOptions={{
                    componentRestrictions: { country: ['us', 'ca'] },
                    types: ['address']
                  }}
                />
                
                <div>
                  <Label className="text-sm text-slate-600 dark:text-slate-300">Address Line 2</Label>
                  <Input
                    value={newEvent.addressLine2 || ''}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      addressLine2: e.target.value
                    })}
                    placeholder="Apt, Suite, Unit"
                    className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-slate-600 dark:text-slate-300">City</Label>
                  <Input
                    value={newEvent.city || ''}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      city: e.target.value
                    })}
                    placeholder="City"
                    className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-slate-600 dark:text-slate-300">State</Label>
                  <Input
                    value={newEvent.state || ''}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      state: e.target.value
                    })}
                    placeholder="ST"
                    className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-slate-600 dark:text-slate-300">ZIP Code</Label>
                  <Input
                    value={newEvent.zipCode || ''}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      zipCode: e.target.value
                    })}
                    placeholder="12345"
                    className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-slate-600 dark:text-slate-300">Country</Label>
                  <Input
                    value={newEvent.country || 'United States'}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      country: e.target.value
                    })}
                    className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-sm font-semibold text-[#0F0276] dark:text-white">Notes</Label>
              <Textarea
                value={newEvent.notes || ''}
                onChange={(e) => setNewEvent({
                  ...newEvent,
                  notes: e.target.value
                })}
                placeholder="Additional details about this event (optional)"
                className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A] resize-none"
                rows={3}
              />
            </div>

            {/* Recurrence */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch 
                  id="recurrence-toggle"
                  checked={recurrenceEnabled}
                  onCheckedChange={(checked) => {
                    setRecurrenceEnabled(checked);
                    if (!checked) {
                      setNewEvent(prev => ({
                        ...prev,
                        recurrenceRule: null,
                        recurrenceEndAt: null
                      }));
                    }
                  }}
                />
                <Label htmlFor="recurrence-toggle" className="text-sm font-semibold text-[#0F0276] dark:text-white">
                  Repeat Event
                </Label>
              </div>

              {recurrenceEnabled && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4">
                  {/* Frequency Selection */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Repeats</Label>
                    <Select 
                      value={recurrenceFrequency} 
                      onValueChange={(value: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY') => {
                        setRecurrenceFrequency(value);
                        // Reset weekdays when changing frequency
                        if (value === 'WEEKLY' || value === 'BIWEEKLY') {
                          if (selectedWeekdays.length === 0 && newEvent.startAt) {
                            setSelectedWeekdays([new Date(newEvent.startAt).getDay()]);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="BIWEEKLY">Bi-Weekly (Every 2 weeks)</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weekly/Bi-Weekly Options */}
                  {(recurrenceFrequency === 'WEEKLY' || recurrenceFrequency === 'BIWEEKLY') && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        Repeat on
                      </Label>
                      <div className="grid grid-cols-7 gap-2">
                        {weekdayNames.map((day, index) => (
                          <div key={day} className="flex items-center space-x-1">
                            <Checkbox
                              id={`weekday-${index}`}
                              checked={selectedWeekdays.includes(index)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedWeekdays(prev => [...prev, index].sort((a, b) => a - b));
                                } else {
                                  setSelectedWeekdays(prev => prev.filter(d => d !== index));
                                }
                              }}
                              className="border-[#D8BD2A]/50 data-[state=checked]:bg-[#D8BD2A] data-[state=checked]:border-[#D8BD2A]"
                            />
                            <Label 
                              htmlFor={`weekday-${index}`} 
                              className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer"
                            >
                              {day.slice(0, 3)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monthly Options */}
                  {recurrenceFrequency === 'MONTHLY' && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        Monthly pattern
                      </Label>
                      <RadioGroup 
                        value={monthlyMode} 
                        onValueChange={(value: 'DATE' | 'WEEKDAY_POS') => setMonthlyMode(value)}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="DATE" id="monthly-date" />
                          <Label htmlFor="monthly-date" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                            On day {newEvent.startAt ? new Date(newEvent.startAt).getDate() : 1} of the month
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="WEEKDAY_POS" id="monthly-weekday" />
                          <Label htmlFor="monthly-weekday" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                            On the {newEvent.startAt ? Math.ceil(new Date(newEvent.startAt).getDate() / 7) : 1}{getOrdinalSuffix(newEvent.startAt ? Math.ceil(new Date(newEvent.startAt).getDate() / 7) : 1)} {' '}
                            {newEvent.startAt ? weekdayNames[new Date(newEvent.startAt).getDay()] : 'Monday'} of the month
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* End Date Options */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Ends
                    </Label>
                    <RadioGroup 
                      value={recurrenceEndMode} 
                      onValueChange={(value: 'NEVER' | 'ON_DATE') => setRecurrenceEndMode(value)}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="NEVER" id="end-never" />
                        <Label htmlFor="end-never" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                          Never
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="ON_DATE" id="end-date" />
                        <Label htmlFor="end-date" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                          On
                        </Label>
                        <Input
                          type="date"
                          value={recurrenceEndDate ? 
                            new Date(recurrenceEndDate.getTime() - recurrenceEndDate.getTimezoneOffset() * 60000)
                              .toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              // Create a date in local timezone for the selected date
                              const [year, month, day] = e.target.value.split('-').map(Number);
                              const date = new Date(year, month - 1, day, 23, 59, 59);
                              setRecurrenceEndDate(date);
                              setRecurrenceEndMode('ON_DATE');
                            } else {
                              setRecurrenceEndDate(null);
                            }
                          }}
                          disabled={recurrenceEndMode === 'NEVER'}
                          className="w-40 border-[#D8BD2A]/30 focus:border-[#D8BD2A] focus:ring-[#D8BD2A] disabled:opacity-50"
                        />
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Summary */}
                  {getRecurrenceSummary() && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                        📅 {getRecurrenceSummary()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button 
                variant="outline"
                onClick={handleCancelEdit}
                className="px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // Prepare event data for creation/update
                  const eventData = {
                    title: newEvent.title || (newEvent.isAvailabilityBlock ? "Blocked Time" : "Event"),
                    notes: newEvent.notes,
                    location: newEvent.location,
                    // Address fields
                    addressLine1: newEvent.addressLine1,
                    addressLine2: newEvent.addressLine2,
                    city: newEvent.city,
                    state: newEvent.state,
                    zipCode: newEvent.zipCode,
                    country: newEvent.country,
                    isAllDay: newEvent.isAllDay || false,
                    timezone: newEvent.timezone || "America/Los_Angeles",
                    startAt: newEvent.startAt ? newEvent.startAt.toISOString() : new Date().toISOString(),
                    endAt: newEvent.endAt ? newEvent.endAt.toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                    // Persist recurrence configuration (previously always null)
                    recurrenceRule: newEvent.recurrenceRule || null,
                    recurrenceEndAt: newEvent.recurrenceEndAt ? (newEvent.recurrenceEndAt instanceof Date ? newEvent.recurrenceEndAt.toISOString() : String(newEvent.recurrenceEndAt)) : null,
                    recurrenceExceptions: [],
                    isAvailabilityBlock: newEvent.isAvailabilityBlock || false,
                    blockingReason: newEvent.isAvailabilityBlock ? (newEvent.blockingReason || "Unavailable") : null,
                    category: newEvent.category || null,
                    isDeleted: false
                  };
                  
                  if (editingEvent) {
                    // Update existing event - extract master event ID from expanded ID
                    const masterEventId = editingEvent.id.includes(':') ? editingEvent.id.split(':')[0] : editingEvent.id;
                    console.log('Updating event with data:', eventData, 'Master ID:', masterEventId);
                    updateEventMutation.mutate({ id: masterEventId, data: eventData }, {
                      onSuccess: (response) => {
                        console.log('Event updated successfully:', response);
                        toast({
                          title: "Event Updated",
                          description: "Your event has been updated successfully.",
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/events"] });
                        handleCancelEdit();
                      },
                      onError: (error) => {
                        console.error('Failed to update event:', error);
                        toast({
                          title: "Error Updating Event",
                          description: error?.message || "Failed to update event. Please try again.",
                          variant: "destructive",
                        });
                      }
                    });
                  } else {
                    // Create new event
                    console.log('Creating event with data:', eventData);
                    createEventMutation.mutate(eventData, {
                      onSuccess: (response) => {
                        console.log('Event created successfully:', response);
                        toast({
                          title: "Event Created",
                          description: "Your event has been saved successfully.",
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/events"] });
                        handleCancelEdit();
                      },
                      onError: (error) => {
                        console.error('Failed to create event:', error);
                        toast({
                          title: "Error Creating Event",
                          description: error?.message || "Failed to create event. Please try again.",
                          variant: "destructive",
                        });
                      }
                    });
                  }
                }} 
                className="bg-gradient-to-r from-[#D8BD2A] to-[#D8BD2A]/90 hover:from-[#D8BD2A]/90 hover:to-[#D8BD2A] text-[#0F0276] border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg px-6 font-semibold"
              >
                {editingEvent ? "🔄 Update Event" : newEvent.isAvailabilityBlock ? "🚫 Block Time" : "📅 Add Event"}
              </Button>
            </div>
          </div>
        </AdminModal>

        {/* View Event Details Modal */}
        <AdminModal
          isOpen={isViewEventModalOpen}
          onClose={() => setViewingEvent(null)}
          title={viewingEvent ? viewingEvent.title || 'Event Details' : 'Event Details'}
          size="3xl"
        >
          {viewingEvent && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4 items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#0F0276] dark:text-white flex items-center gap-2">
                    {viewingEvent.title || 'Untitled Event'}
                    {viewingEvent.recurrenceRule && <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded">Recurring</span>}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {new Date(viewingEvent.startAt).toLocaleString()} - {new Date(viewingEvent.endAt).toLocaleString()}
                  </p>
                  {viewingEvent.isAllDay && <p className="text-xs text-slate-500 mt-1">All day</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      // Switch to edit mode using current viewing event
                      const eventData: any = viewingEvent;
                      setViewingEvent(null);
                      setEditingEvent(eventData);
                      setNewEvent({
                        title: eventData.title || '',
                        notes: eventData.notes || '',
                        location: eventData.location || '',
                        addressLine1: eventData.addressLine1 || '',
                        addressLine2: eventData.addressLine2 || '',
                        city: eventData.city || '',
                        state: eventData.state || '',
                        zipCode: eventData.zipCode || '',
                        country: eventData.country || 'United States',
                        isAllDay: eventData.isAllDay || false,
                        timezone: eventData.timezone || 'America/Los_Angeles',
                        startAt: new Date(eventData.startAt),
                        endAt: new Date(eventData.endAt),
                        recurrenceRule: eventData.recurrenceRule,
                        recurrenceEndAt: eventData.recurrenceEndAt ? new Date(eventData.recurrenceEndAt) : null,
                        recurrenceExceptions: eventData.recurrenceExceptions || [],
                        isAvailabilityBlock: eventData.isAvailabilityBlock || false,
                        blockingReason: eventData.blockingReason || '',
                        category: eventData.category || '',
                        isDeleted: false
                      });
                      initializeRecurrenceFromEvent({
                        recurrenceRule: eventData.recurrenceRule,
                        recurrenceEndAt: eventData.recurrenceEndAt ? new Date(eventData.recurrenceEndAt) : null,
                        startAt: new Date(eventData.startAt)
                      });
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow hover:shadow-lg"
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      console.log("🗑️ DELETE BUTTON CLICKED", { viewingEvent });
                      // Convert viewingEvent to EventRow format
                      const eventRow: EventRow = {
                        ...viewingEvent,
                        startAt: viewingEvent.startAt instanceof Date ? viewingEvent.startAt.toISOString() : viewingEvent.startAt,
                        endAt: viewingEvent.endAt instanceof Date ? viewingEvent.endAt.toISOString() : viewingEvent.endAt,
                        recurrenceEndAt: viewingEvent.recurrenceEndAt instanceof Date ? viewingEvent.recurrenceEndAt.toISOString() : viewingEvent.recurrenceEndAt,
                        createdAt: viewingEvent.createdAt instanceof Date ? viewingEvent.createdAt.toISOString() : viewingEvent.createdAt,
                        updatedAt: viewingEvent.updatedAt instanceof Date ? viewingEvent.updatedAt.toISOString() : viewingEvent.updatedAt,
                      } as EventRow;
                      console.log("🗑️ SETTING DELETING EVENT", { eventRow });
                      setDeletingEvent(eventRow);
                      setViewingEvent(null);
                    }}
                    className="shadow hover:shadow-lg"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>

              {viewingEvent.notes && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-200">
                  <strong className="font-semibold">Notes:</strong>
                  <div className="mt-1 whitespace-pre-wrap">{viewingEvent.notes}</div>
                </div>
              )}

              {viewingEvent.isAvailabilityBlock && viewingEvent.blockingReason && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-sm text-red-700 dark:text-red-300">
                  <strong className="font-semibold">Blocking Reason:</strong> {viewingEvent.blockingReason}
                </div>
              )}

              {(viewingEvent.addressLine1 || viewingEvent.city) && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-200">
                  <strong className="font-semibold">Location:</strong>
                  <div className="mt-1 space-y-1">
                    {viewingEvent.addressLine1 && <div>{viewingEvent.addressLine1}</div>}
                    {viewingEvent.addressLine2 && <div>{viewingEvent.addressLine2}</div>}
                    {viewingEvent.city && (
                      <div>
                        {viewingEvent.city}{viewingEvent.state && `, ${viewingEvent.state}`}{viewingEvent.zipCode && ` ${viewingEvent.zipCode}`}
                      </div>
                    )}
                    {viewingEvent.country && <div>{viewingEvent.country}</div>}
                  </div>
                </div>
              )}

              {viewingEvent.recurrenceRule && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-xs text-slate-600 dark:text-slate-300 font-mono break-all">
                  <strong className="font-semibold mr-2">Recurrence Rule:</strong> {viewingEvent.recurrenceRule}
                  {viewingEvent.recurrenceEndAt && (
                    <div className="mt-1">
                      <strong className="font-semibold">Ends:</strong> {new Date(viewingEvent.recurrenceEndAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </AdminModal>

        {/* Event Deletion Modal */}
        <EventDeletionModal
          isOpen={!!deletingEvent}
          onClose={() => {
            console.log("🚫 MODAL CLOSING");
            setDeletingEvent(null);
          }}
          onConfirm={handleEventDeletion}
          event={deletingEvent}
          isLoading={deleteEventMutation.isPending}
        />
          </div>
        </div>
      </div>
    </div>
  );
}