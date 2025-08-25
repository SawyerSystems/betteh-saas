import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

export type BookingFlowType = 'parent-portal' | 'athlete-modal' | 'new-user' | 'admin-new-athlete' | 'admin-existing-athlete' | 'admin-from-athlete';

interface AthleteInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  allergies: string;
  experience: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  gender?: string;
}

interface BookingAthlete {
  athleteId: number;
  slotOrder: number;
  name: string;
  dateOfBirth: string;
  allergies?: string;
  experience: string;
  photo?: string;
}

export interface BookingFlowState {
  flowType: BookingFlowType;
  currentStep: number;
  parentId?: number;
  selectedParent?: any; // Parent object when selected from existing parents
  isNewParentCreated?: boolean; // Flag to track if a new parent was created
  lessonType: string;
  selectedAthletes: number[];
  selectedTimeSlot: { date: string; time: string } | null;
  parentInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  } | null;
  athleteInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    allergies: string;
  experience: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  }[];
  safetyContact: {
    willDropOff?: boolean;
    willPickUp?: boolean;
    dropoffPersonName: string;
    dropoffPersonRelationship: string;
    dropoffPersonPhone: string;
    pickupPersonName: string;
    pickupPersonRelationship: string;
    pickupPersonPhone: string;
  } | null;
  waiverStatus: {
    signed: boolean;
    signedAt?: Date;
  };
  focusAreas: string[];
  focusAreaOther: string; // Custom focus area text when "Other" is selected
  // Admin-specific properties
  isAdminFlow?: boolean;
  adminPaymentMethod?: 'stripe' | 'cash' | 'check' | 'pending';
  adminNotes?: string;
  skipWaiver?: boolean;
  skipSafety?: boolean;
}

// Define flow steps for each booking context
export const BOOKING_FLOWS = {
  'parent-portal': [
    'lessonType',
    'athleteSelect',
    'athleteInfoForm', // Add step for creating new athletes
    'focusAreas',
    'schedule',
    'parentConfirm',
    'safety',
    'waiver',
    'payment',
  ],
  'athlete-modal': [
    'lessonType',
    'athleteSelectIfSemi',
    'focusAreas',
    'schedule',
    'parentConfirm',
    'safety',
    'waiver',
    'payment',
  ],
  'new-user': [
    'lessonType',
    'athleteInfoForm',
    'parentSelection', // New step: Choose new or existing parent
    'focusAreas',
    'schedule',
    'parentInfoForm',
    'safety',
    'waiver',
    'payment',
  ],
  'admin-new-athlete': [
    'lessonType',
    'parentSelection', // Move parent selection first
    'parentInfoForm', // Parent creation/selection step
    'athleteInfoForm', // Then create athlete under selected parent
    'focusAreas',
    'schedule',
    'adminPayment',
  ],
  'admin-existing-athlete': [
    'lessonType',
    'athleteSelect',
    'focusAreas',
    'schedule',
    'parentConfirm',
    'safety',
    'adminPayment',
  ],
  'admin-from-athlete': [
    'lessonType',
    'focusAreas',
    'schedule',
    'parentConfirm',
    'safety',
    'adminPayment',
  ]
} as const;

interface BookingFlowContextType {
  state: BookingFlowState;
  updateState: (updates: Partial<BookingFlowState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  getCurrentStepName: () => string;
  isLastStep: () => boolean;
  resetFlow: () => void;
}

const BookingFlowContext = createContext<BookingFlowContextType | undefined>(undefined);

const initialState: BookingFlowState = {
  flowType: 'new-user',
  currentStep: 0,
  selectedParent: undefined,
  lessonType: '',
  selectedAthletes: [],
  selectedTimeSlot: null,
  parentInfo: null,
  athleteInfo: [],
  safetyContact: null,
  waiverStatus: { signed: false },
  focusAreas: [],
  focusAreaOther: '',
};

interface BookingFlowProviderProps {
  children: ReactNode;
  flowType?: BookingFlowType;
  initialState?: Partial<BookingFlowState>;
}

export function BookingFlowProvider({ 
  children, 
  flowType = 'new-user',
  initialState: customInitialState 
}: BookingFlowProviderProps) {
  const mergedState = {
    ...initialState,
    ...customInitialState,
    flowType,
  };

  console.log("BookingFlowProvider initializing with:", {
    flowType,
    customInitialState,
    mergedState: {
      ...mergedState,
      parentInfo: mergedState.parentInfo ? {
        firstName: mergedState.parentInfo.firstName,
        lastName: mergedState.parentInfo.lastName,
        email: mergedState.parentInfo.email,
        phone: mergedState.parentInfo.phone
      } : null
    }
  });

  const [state, setState] = useState<BookingFlowState>(mergedState);

  // Use useCallback to stabilize function references
  const updateState = useCallback((updates: Partial<BookingFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const getCurrentFlow = useCallback(() => BOOKING_FLOWS[state.flowType], [state.flowType]);

  const getCurrentStepName = useCallback(() => {
    const flow = getCurrentFlow();
    // Clamp the current step to a valid range
    const safeIndex = Math.min(Math.max(0, state.currentStep), flow.length - 1);
    
    // If the currentStep is out of range, silently correct it
    if (state.currentStep !== safeIndex) {
      console.warn(`Correcting out-of-range step index: ${state.currentStep} → ${safeIndex}`);
      setState(prev => ({ ...prev, currentStep: safeIndex }));
    }
    
    const stepName = flow[safeIndex];
    
    console.log('📍 GETTING CURRENT STEP:', {
      flowType: state.flowType,
      currentStepIndex: state.currentStep,
      safeIndex,
      stepName,
      fullFlow: flow,
      totalSteps: flow.length
    });
    
    return stepName;
  }, [state.flowType, state.currentStep, getCurrentFlow]);

  const nextStep = useCallback(() => {
    const flow = getCurrentFlow();
    const currentStepIndex = Math.min(state.currentStep, flow.length - 1);
    const nextStepIndex = Math.min(currentStepIndex + 1, flow.length - 1);
    
    const currentStepName = flow[currentStepIndex];
    const nextStepName = flow[nextStepIndex];
    
    console.log('➡️ NEXT STEP NAVIGATION:', {
      from: currentStepName,
      to: nextStepName,
      currentIndex: currentStepIndex,
      nextIndex: nextStepIndex,
      flowType: state.flowType
    });
    
    if (currentStepIndex < flow.length - 1) {
      setState(prev => ({ ...prev, currentStep: nextStepIndex }));
    }
  }, [state.currentStep, state.flowType, getCurrentFlow]);

  const prevStep = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  }, [state.currentStep]);

  const isLastStep = useCallback(() => {
    const flow = getCurrentFlow();
    return state.currentStep >= flow.length - 1;
  }, [state.currentStep, getCurrentFlow]);

  const resetFlow = useCallback(() => {
    setState(initialState);
  }, []);

  const value = {
    state,
    updateState,
    nextStep,
    prevStep,
    getCurrentStepName,
    isLastStep,
    resetFlow,
  };

  return (
    <BookingFlowContext.Provider value={value}>
      {children}
    </BookingFlowContext.Provider>
  );
}

export function useBookingFlow() {
  const context = useContext(BookingFlowContext);
  if (!context) {
    throw new Error('useBookingFlow must be used within a BookingFlowProvider');
  }
  return context;
}