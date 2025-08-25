import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BookingFlowProvider, type BookingFlowState, type BookingFlowType } from "@/contexts/BookingFlowContext";
import { apiRequest } from "@/lib/queryClient";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { Athlete, Parent } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { BookingWizard } from "./BookingWizard";

interface UnifiedBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Context-specific props
  parentData?: Parent | null;
  selectedAthletes?: Athlete[];
  preSelectedAthleteId?: number;
  isNewParent?: boolean;
  isAdminFlow?: boolean;
  adminContext?: 'new-athlete' | 'existing-athlete' | 'from-athlete';
  
  // Legacy support
  initialLessonType?: string;
  suggestedFocusAreas?: string[];
}

export function UnifiedBookingModal({ 
  isOpen, 
  onClose, 
  parentData = null,
  selectedAthletes = [], 
  preSelectedAthleteId,
  isNewParent = false,
  isAdminFlow = false,
  adminContext,
  initialLessonType,
  suggestedFocusAreas = []
}: UnifiedBookingModalProps) {
  
  console.log('🚀 UNIFIED BOOKING MODAL MOUNTED/OPENED:', {
    isOpen,
    parentData: parentData ? { id: parentData.id, email: parentData.email, firstName: parentData.firstName } : null,
    selectedAthletes: selectedAthletes?.length || 0,
    isAdminFlow,
    isNewParent,
    adminContext
  });
  
  // Check if user is a logged-in parent (only if no parent data provided and not admin)
  const { data: parentAuthStatus } = useQuery({
    queryKey: ['/api/parent-auth/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parent-auth/status');
      return await response.json();
    },
    enabled: !isAdminFlow && !parentData, // Only check if not admin and no parent data provided
  });

  // Fetch parent athletes for waiver status when parent is logged in
  const { data: parentAthletes } = useQuery({
    queryKey: ['/api/parent/athletes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parent/athletes');
      return await response.json();
    },
    enabled: (!!parentData || parentAuthStatus?.loggedIn) && !isAdminFlow, // Only fetch if parent is logged in and not admin
  });

  // Define helper variables for flow determination
  const loggedInParent = !!parentData || parentAuthStatus?.loggedIn;
  const isAdmin = isAdminFlow;
  
  console.log('🔧 HELPER VARIABLES:', {
    parentData: parentData ? { id: parentData.id, email: parentData.email } : null,
    parentAuthStatus,
    loggedInParent,
    isAdmin
  });

  // Determine flow type based on context
  const determineFlowType = (): BookingFlowType => {
    console.log('🔍 FLOW DETERMINATION DEBUG:', {
      loggedInParent: !!loggedInParent,
      hasParentData: !!parentData,
      selectedAthletes: selectedAthletes?.length || 0,
      selectedAthletesData: selectedAthletes,
      isAdmin: !!isAdmin,
      parentId: parentData?.id,
      parentEmail: parentData?.email
    });

    // Check logged-in parent status FIRST (this was the fix)
    if (loggedInParent) {
      console.log('✅ FLOW: parent-portal (logged-in parent)', { hasParentData: !!parentData });
      return 'parent-portal';
    }

    // Athlete-specific flow for admin or existing athlete selection
    if (selectedAthletes && selectedAthletes.length > 0) {
      console.log('✅ FLOW: athlete-modal (selected athletes)');
      return 'athlete-modal';
    }

    // Admin flows - check adminContext to determine correct flow
    if (isAdmin) {
      switch (adminContext) {
        case 'existing-athlete':
          console.log('✅ FLOW: admin-existing-athlete (admin - existing athlete)');
          return 'admin-existing-athlete';
        case 'from-athlete':
          console.log('✅ FLOW: admin-from-athlete (admin - from athlete profile)');
          return 'admin-from-athlete';
        case 'new-athlete':
        default:
          console.log('✅ FLOW: admin-new-athlete (admin - new athlete)');
          return 'admin-new-athlete';
      }
    }

    // Default: New user flow
    console.log('✅ FLOW: new-user (default)');
    return 'new-user';
  };

  const flowType = determineFlowType();

  // Prepare initial state based on context
  const getInitialState = (): BookingFlowState => {
    const baseState: BookingFlowState = {
      flowType,
      currentStep: 0,
      lessonType: initialLessonType || '',
      // Do not auto-preselect athletes for parent flows; only honor explicit preSelectedAthleteId (e.g., deep link) or admin context
      selectedAthletes: isAdminFlow
        ? selectedAthletes.map(a => a.id)
        : (preSelectedAthleteId ? [preSelectedAthleteId] : []),
      selectedTimeSlot: null,
      parentInfo: null,
      athleteInfo: [],
      safetyContact: null,
      waiverStatus: { signed: false },
      focusAreas: suggestedFocusAreas,
      focusAreaOther: '',
      isAdminFlow,
      adminNotes: '',
    };

    // Set parent info based on priority: explicit parentData > auth status > none
    if (parentData) {
      // Explicit parent data provided (from home page login or parent portal)
      baseState.parentInfo = {
        firstName: parentData.firstName || '',
        lastName: parentData.lastName || '',
        email: parentData.email || '',
        phone: parentData.phone || '',
        emergencyContactName: parentData.emergencyContactName || '',
        emergencyContactPhone: parentData.emergencyContactPhone || ''
      };
      baseState.parentId = parentData.id;
    } else if (parentAuthStatus?.loggedIn) {
      // Fallback to auth status if available (when parentData not provided)
      if (parentAuthStatus.parentData) {
        const authParent = parentAuthStatus.parentData;
        baseState.parentInfo = {
          firstName: authParent.firstName || '',
          lastName: authParent.lastName || '',
          email: authParent.email || '',
          phone: authParent.phone || '',
          emergencyContactName: authParent.emergencyContactName || '',
          emergencyContactPhone: authParent.emergencyContactPhone || ''
        };
        baseState.parentId = authParent.id;
      } else {
        // Basic auth info only
        baseState.parentInfo = {
          firstName: '',
          lastName: '',
          email: parentAuthStatus.email || '',
          phone: '',
          emergencyContactName: '',
          emergencyContactPhone: ''
        };
        baseState.parentId = parentAuthStatus.parentId;
      }
    }

    // Pre-fill athlete info if coming from athlete context
    if (selectedAthletes.length > 0) {
      baseState.athleteInfo = selectedAthletes.map(athlete => ({
        firstName: athlete.firstName || '',
        lastName: athlete.lastName || '',
        dateOfBirth: athlete.dateOfBirth || '',
        allergies: athlete.allergies || '',
        experience: (athlete.experience === 'beginner' || athlete.experience === 'intermediate' || athlete.experience === 'advanced' || athlete.experience === 'elite') 
          ? athlete.experience as 'beginner' | 'intermediate' | 'advanced' | 'elite'
          : 'beginner'
      }));
    }

    return baseState;
  };

  const initialState = getInitialState();

  // Debug logging commented out to prevent console spam
  // console.log("UnifiedBookingModal rendered with:", { flowType, isOpen, ... });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-full h-full max-w-full max-h-full sm:max-w-5xl sm:max-h-[95vh] overflow-y-auto p-0 [&>button]:hidden rounded-2xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-white/10 dark:bg-white/10"
        aria-describedby="booking-flow-description"
      >
        <VisuallyHidden>
          <DialogTitle>
            {isAdminFlow ? 'Admin Booking Management' : 'Book a Gymnastics Session'}
          </DialogTitle>
          <span id="booking-flow-description">Complete the booking process by following the steps</span>
        </VisuallyHidden>
        <BookingFlowProvider flowType={flowType} initialState={initialState}>
          <BookingWizard onClose={onClose} />
        </BookingFlowProvider>
      </DialogContent>
    </Dialog>
  );
}
