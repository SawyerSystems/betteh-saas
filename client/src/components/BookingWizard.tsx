import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BOOKING_FLOWS, useBookingFlow } from "@/contexts/BookingFlowContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AdminPaymentStep } from "./booking-steps/AdminPaymentStep";
import { AthleteInfoFormStep } from "./booking-steps/AthleteInfoFormStep";
import { AthleteSelectStep } from "./booking-steps/AthleteSelectStep";
import { FocusAreasStep } from "./booking-steps/FocusAreasStep";
import { LessonTypeStep } from "./booking-steps/LessonTypeStep";
import { ParentInfoStep } from "./booking-steps/ParentInfoStep";
import { ParentSelectionStep } from "./booking-steps/ParentSelectionStep";
import { PaymentStep } from "./booking-steps/PaymentStep";
import { SafetyStep } from "./booking-steps/SafetyStep";
import { ScheduleStep } from "./booking-steps/ScheduleStep";
import { WaiverStep } from "./booking-steps/WaiverStep";
// Debug overlay (temporarily disabled in production)
// import { BookingFlowDebugger } from "./BookingFlowDebugger";

interface BookingWizardProps {
  onClose: () => void;
}

export function BookingWizard({ onClose }: BookingWizardProps) {
  const { state, updateState, nextStep, prevStep, getCurrentStepName, isLastStep, resetFlow } = useBookingFlow();
  const { toast } = useToast();

  // Step validation logic
  const isCurrentStepComplete = () => {
    const stepName = getCurrentStepName();
    
    switch (stepName) {
      case 'lessonType':
        return !!state.lessonType;
      case 'athleteSelect':
      case 'athleteSelectIfSemi':
        return state.selectedAthletes.length > 0;
      case 'athleteInfoForm':
        return state.athleteInfo.length > 0 && 
               state.athleteInfo.every(athlete => 
                 athlete.firstName && athlete.lastName && athlete.dateOfBirth && athlete.experience
               );
      case 'parentSelection':
        return true; // This step is complete when a choice is made (handled by the step itself)
      case 'focusAreas':
        return state.focusAreas.length > 0;
      case 'schedule':
        return !!state.selectedTimeSlot?.date && !!state.selectedTimeSlot?.time;
      case 'parentConfirm':
      case 'parentInfoForm':
        return !!state.parentInfo?.firstName && 
               !!state.parentInfo?.lastName && 
               !!state.parentInfo?.email && 
               !!state.parentInfo?.phone &&
               !!state.parentInfo?.emergencyContactName &&
               !!state.parentInfo?.emergencyContactPhone;
      case 'safety':
        // Both questions must be answered first
        if (state.safetyContact?.willDropOff === undefined || state.safetyContact?.willPickUp === undefined) {
          return false;
        }
        
        // If both questions are answered "yes", step is complete
        if (state.safetyContact?.willDropOff === true && state.safetyContact?.willPickUp === true) {
          return true;
        }
        
        // If dropoff is "no", validate dropoff person fields
        const dropoffValid = state.safetyContact?.willDropOff === true || (
          state.safetyContact?.willDropOff === false &&
          !!state.safetyContact?.dropoffPersonName?.trim() && 
          !!state.safetyContact?.dropoffPersonRelationship?.trim() && 
          !!state.safetyContact?.dropoffPersonPhone?.trim()
        );
        
        // If pickup is "no", validate pickup person fields  
        const pickupValid = state.safetyContact?.willPickUp === true || (
          state.safetyContact?.willPickUp === false &&
          !!state.safetyContact?.pickupPersonName?.trim() && 
          !!state.safetyContact?.pickupPersonRelationship?.trim() && 
          !!state.safetyContact?.pickupPersonPhone?.trim()
        );
        
        return dropoffValid && pickupValid;
      case 'waiver':
        return state.waiverStatus.signed;
      case 'payment':
        return true; // Payment step handles its own completion
      case 'adminPayment':
        return !!state.adminPaymentMethod; // Admin must select payment method
      default:
        return true;
    }
  };

  const renderStep = () => {
    const stepName = getCurrentStepName();
    
    // Debug logging to trace the issue
    console.log('🎯 BOOKING WIZARD DEBUG:', {
      currentStepName: stepName,
      currentStepIndex: state.currentStep,
      flowType: state.flowType,
      steps: BOOKING_FLOWS[state.flowType] || [],
      hasParentInfo: !!state.parentInfo,
      parentInfo: state.parentInfo ? { email: state.parentInfo.email } : null
    });

    // CRITICAL: ParentSelectionStep should NEVER render for logged-in parents
    if (stepName === 'parentSelection' && state.parentInfo) {
      console.error('🚨 CRITICAL BUG: ParentSelectionStep rendering for logged-in parent!', {
        stepName,
        parentInfo: state.parentInfo ? { email: state.parentInfo.email } : null,
        flowType: state.flowType,
        currentStep: state.currentStep,
        expectedSteps: BOOKING_FLOWS[state.flowType]
      });
    }
    
    switch (stepName) {
      case 'lessonType':
        return <LessonTypeStep />;
      case 'athleteSelect':
      case 'athleteSelectIfSemi':
        return <AthleteSelectStep skipIfNotSemi={stepName === 'athleteSelectIfSemi'} />;
      case 'athleteInfoForm':
        return <AthleteInfoFormStep />;
      case 'parentSelection':
        return <ParentSelectionStep />;
      case 'focusAreas':
        return <FocusAreasStep />;
      case 'schedule':
        return <ScheduleStep />;
      case 'parentConfirm':
      case 'parentInfoForm':
        return <ParentInfoStep isPrefilled={stepName === 'parentConfirm'} />;
      case 'safety':
        return <SafetyStep />;
      case 'waiver':
        return <WaiverStep />;
      case 'payment':
        return <PaymentStep />;
      case 'adminPayment':
        return <AdminPaymentStep />;
      default:
        return <div>Unknown step</div>;
    }
  };

  const handleClose = () => {
    resetFlow();
    onClose();
  };

  const getStepTitle = () => {
    const stepName = getCurrentStepName();
    const titles: Record<string, string> = {
      lessonType: 'Select Lesson Type',
      athleteSelect: 'Select Athletes',
      athleteSelectIfSemi: 'Select Athletes',
      athleteInfoForm: 'Athlete Information',
      parentSelection: 'Parent Account',
      focusAreas: 'Select Focus Areas',
      schedule: 'Choose Date & Time',
      parentConfirm: 'Confirm Your Information',
      parentInfoForm: 'Parent Information',
      safety: 'Safety & Pickup Information',
      waiver: 'Waiver Agreement',
      payment: 'Complete Payment',
      adminPayment: 'Admin Booking Completion',
    };
    return titles[stepName] || 'Booking';
  };

  const totalSteps = state.flowType.startsWith('admin-') ? 8 : // Admin flows now include safety step
                    state.flowType === 'parent-portal' ? 8 : 
                    state.flowType === 'athlete-modal' ? 8 : 9; // new-user flow now has 9 steps
  const progress = ((state.currentStep + 1) / totalSteps) * 100;

  const handleNextClick = () => {
    const stepName = getCurrentStepName();
    
    // For athleteInfoForm step, we let the form handle submission
    if (stepName === 'athleteInfoForm') {
      // Find the form and submit it programmatically
      const athleteForm = document.querySelector('form');
      if (athleteForm) {
        athleteForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
      return; // Return early as the form submission will handle navigation
    }
    
    // Skip athlete info form if athletes are already selected in parent-portal flow
    if (stepName === 'athleteSelect' && 
        state.selectedAthletes.length > 0 && 
        state.flowType === 'parent-portal') {
      
      const flow = BOOKING_FLOWS[state.flowType];
      const nextStepIndex = state.currentStep + 1;
      
      if (flow[nextStepIndex] === 'athleteInfoForm') {
        // Skip to the step after athleteInfoForm (which should be focusAreas)
        console.log('⏭️ Skipping athleteInfoForm step as athletes are already selected', {
          flowType: state.flowType,
          currentStep: state.currentStep,
          currentStepName: stepName,
          nextStepIndex,
          nextStepName: flow[nextStepIndex],
          skippingToStep: flow[nextStepIndex + 1],
          skippingToStepIndex: nextStepIndex + 1,
          selectedAthletes: state.selectedAthletes
        });
        updateState({ currentStep: nextStepIndex + 1 });
        return;
      }
    }
    
    // Skip waiver step if waiver already signed
    if (stepName === 'safety' && 
        (state.waiverStatus.signed || state.skipWaiver === true)) {
      
      const flow = BOOKING_FLOWS[state.flowType];
      const nextStepIndex = state.currentStep + 1;
      
      if (flow[nextStepIndex] === 'waiver') {
        // Skip to the step after waiver (which should be payment)
        console.log('⏭️ Skipping waiver step as waiver is already signed', {
          flowType: state.flowType,
          currentStep: state.currentStep,
          currentStepName: stepName,
          nextStepIndex,
          nextStepName: flow[nextStepIndex],
          skippingToStep: flow[nextStepIndex + 1],
          skippingToStepIndex: nextStepIndex + 1,
          waiverStatus: state.waiverStatus
        });
        updateState({ currentStep: nextStepIndex + 1 });
        return;
      }
    }
    
    // Add defensive check for downstream steps that require athlete selection
    if ((stepName === 'focusAreas' || stepName === 'schedule' || 
         stepName === 'safety' || stepName === 'waiver' || stepName === 'payment') && 
        state.selectedAthletes.length === 0 && !state.flowType.startsWith('admin-')) {
      
      // Determine which step we should navigate to
      let targetStep = state.flowType === 'parent-portal' ? 'athleteSelect' : 'athleteInfoForm';
      // Use a type assertion to tell TypeScript that targetStep is a valid step
      const targetStepIndex = BOOKING_FLOWS[state.flowType].indexOf(targetStep as any);
      
      // Navigate to the correct athlete step
      if (targetStepIndex >= 0) {
        console.log('⚠️ No athlete selected! Redirecting to', targetStep);
        updateState({ currentStep: targetStepIndex });
        
        // Show toast message to guide the user
        toast({
          title: "Athlete Selection Required",
          description: "Please select or create an athlete before continuing.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Proceed with normal flow
    nextStep();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Booking flow debug overlay hidden */}
      {process.env.NODE_ENV === 'development' && false && (
        // <BookingFlowDebugger />
        <></>
      )}
      <div className="p-6 pb-4 relative rounded-t-2xl bg-gradient-to-r from-[#0F0276]/10 to-blue-600/10 border-b border-slate-200/60 dark:border-white/10">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 h-8 w-8 p-0 text-[#0F0276] hover:bg-[#0F0276]/10 dark:text-white dark:hover:bg-white/10"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold pr-12 text-[#0F0276] dark:text-white">{getStepTitle()}</h2>
        <Progress 
          value={progress} 
          className="h-3 mt-4 bg-slate-200/60 dark:bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-[#0F0276] [&>div]:to-blue-600" 
        />
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-white/30 dark:bg-white/5">
        {renderStep()}
      </div>
      
      {getCurrentStepName() !== 'payment' && getCurrentStepName() !== 'adminPayment' && (
        <div className="flex justify-between items-center p-6 pt-4 border-t border-slate-200/60 dark:border-white/10 bg-gradient-to-r from-slate-50/60 to-white/60 dark:from-white/5 dark:to-white/10 rounded-b-2xl">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={state.currentStep === 0}
            className="min-h-[48px] border-[#0F0276]/20 text-[#0F0276] hover:bg-[#0F0276]/10 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <span className="text-sm text-[#0F0276]/70 dark:text-white/70 font-medium">
            Step {state.currentStep + 1} of {totalSteps}
          </span>
          
          <Button
            onClick={handleNextClick}
            disabled={isLastStep() || !isCurrentStepComplete()}
            className="min-h-[48px] bg-gradient-to-r from-[#0F0276] to-blue-600 hover:from-[#0F0276]/90 hover:to-blue-600/90 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastStep() ? 'Complete' : 'Next'}
            {!isLastStep() && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      )}
    </div>
  );
}