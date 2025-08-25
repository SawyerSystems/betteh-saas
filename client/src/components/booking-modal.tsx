import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ParentFormInput } from "@/components/parent-ui/ParentFormComponents";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useParentAuthStatus } from "@/hooks/optimized-queries";
import { useCreateBooking } from "@/hooks/use-booking";
import { useValidParentId } from "@/hooks/use-parent-id";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedAuth } from "@/hooks/use-unified-auth";
import { useAvailableTimes } from "@/hooks/useAvailableTimes";
import { useGenders } from "@/hooks/useGenders";
import { EXPERIENCE_LEVELS } from "@/lib/constants";
import { useLessonTypes } from "@/hooks/useLessonTypes";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookingStatusEnum, PaymentStatusEnum } from "@shared/schema";
import { loadStripe } from '@stripe/stripe-js';
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarDays, CheckCircle, Clock, CreditCard, FileText, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import { TwoStepFocusAreas } from "./two-step-focus-areas";
import { UpdatedWaiverModal } from "./updated-waiver-modal";

// Initialize Stripe
if (!(import.meta as any).env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing Stripe public key');
}
const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLIC_KEY);

interface BookingModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onBack?: () => void;
  initialLessonType?: string;
  prefilledParent?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    waiverSigned?: boolean;
    waiverSignedAt?: string | null;
    waiverSignatureName?: string | null;
  } | null;
  prefilledAthletes?: {
    id: string;
    name: string;
    dateOfBirth: string;
    allergies?: string;
    experience: 'beginner' | 'intermediate' | 'advanced';
  }[] | null;
  suggestedFocusAreas?: string[];
  isReturningParent?: boolean;
}

const formSchema = z.object({
  // Parent info
  parentFirstName: z.string().min(1, "First name is required"),
  parentLastName: z.string().min(1, "Last name is required"),
  parentEmail: z.string().email("Valid email is required"),
  parentPhone: z.string().min(1, "Phone number is required"),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
  
  // Booking details
  lessonType: z.string().min(1, "Lesson type is required"),
  preferredDate: z.date(),
  preferredTime: z.string().min(1, "Time is required"),
  focusAreaIds: z.array(z.number()).default([]),
  apparatusIds: z.array(z.number()).default([]),
  sideQuestIds: z.array(z.number()).default([]),
  
  // Financial
  amount: z.string().min(1, "Amount is required"),
  waiverSigned: z.boolean().default(false),
  reservationFeePaid: z.boolean().default(false),
  paidAmount: z.string().default("0.00"),
  specialRequests: z.string().default(""),
  adminNotes: z.string().default(""),
  
  // Safety verification
  dropoffPersonName: z.string().min(1, "Dropoff person name is required"),
  dropoffPersonRelationship: z.string().min(1, "Dropoff person relationship is required").default("Parent"),
  dropoffPersonPhone: z.string().min(1, "Dropoff person phone is required"),
  pickupPersonName: z.string().min(1, "Pickup person name is required"),
  pickupPersonRelationship: z.string().min(1, "Pickup person relationship is required").default("Parent"),
  pickupPersonPhone: z.string().min(1, "Pickup person phone is required"),
  safetyVerificationSigned: z.boolean().default(false),
  
  // Status fields
  status: z.string().default("pending"),
  bookingMethod: z.string().default("online"),
  paymentStatus: z.string().default("unpaid"),
  
  // Athletes
  athletes: z.array(z.object({
    athleteId: z.number().optional(),
    slotOrder: z.number(),
    name: z.string(),
    dateOfBirth: z.string(),
    gender: z.string().optional(),
    allergies: z.string().optional(),
    experience: z.string(),
    photo: z.string().optional(),
  })).default([])
});

type FormData = z.infer<typeof formSchema>;

export function BookingModal({ isOpen, open, onClose, onOpenChange, onBack, initialLessonType, prefilledParent, prefilledAthletes, suggestedFocusAreas, isReturningParent }: BookingModalProps) {
  const modalOpen = isOpen ?? open ?? false;
  const handleClose = onClose ?? (() => onOpenChange?.(false));
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const { genderOptions } = useGenders();
  

  const [selectedLessonType, setSelectedLessonType] = useState<string | null>(null);
  const [waiverSigned, setWaiverSigned] = useState(false);
  const [waiverData, setWaiverData] = useState<any>(null);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  
  const createBooking = useCreateBooking();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lessonType: "quick-journey",
      preferredDate: new Date(),
      preferredTime: "",
      focusAreaIds: [],
      apparatusIds: [],
      sideQuestIds: [],
      parentFirstName: "",
      parentLastName: "",
      parentEmail: "",
      parentPhone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      amount: "40",
      status: BookingStatusEnum.PENDING,
      bookingMethod: "online",
      waiverSigned: false,
      paymentStatus: PaymentStatusEnum.UNPAID,
      reservationFeePaid: false,
      paidAmount: "0.00",
      specialRequests: "",
      adminNotes: "",
      athletes: [
        {
          slotOrder: 1,
          name: "",
          dateOfBirth: "",
          allergies: "",
          experience: "beginner",
          gender: "Prefer not to say"
        }
      ]
    },
  });

  // Use our custom hook to get a validated parent ID (never 0 or undefined)
  const validParentId = useValidParentId();
  
  // Use unified authentication to handle both parent and admin authentication
  const { isAuthenticated, parentId: unifiedParentId, isParent, isAdmin } = useUnifiedAuth();

  // For parent authentication - use our optimized hook (for compatibility)
  const { data: parentAuthData } = useParentAuthStatus();
  
  const watchedLessonType = form.watch("lessonType");
  const { data: lessonTypes = [], byKey, maxFocusAreasFor } = useLessonTypes();
  const watchedFocusAreaIds = form.watch("focusAreaIds");
  const watchedDate = form.watch("preferredDate");

  // Get lesson duration for availability checking
  const getLessonDuration = (lessonType: string) => {
    const lt = byKey(lessonType);
    return lt?.duration || 30;
  };

  // Fetch available time slots when date or lesson type changes
  const { data: availableSlots = [], isLoading: slotsLoading } = useAvailableTimes(
    watchedDate ? watchedDate.toISOString().split('T')[0] : '',
    watchedLessonType || ''
  );

  const selectedLt = byKey(watchedLessonType || "");
  const maxFocusAreas = maxFocusAreasFor(selectedLt);

  const nameToKey = (name: string) => {
    const map: Record<string, string> = {
      "Quick Journey": "quick-journey",
      "Dual Quest": "dual-quest",
      "Deep Dive": "deep-dive",
      "Partner Progression": "partner-progression",
    };
    return map[name] || name.toLowerCase().replace(/\s+/g, '-');
  };

  // Handle prefilled parent and auto-populate parent information
  useEffect(() => {
    if (prefilledParent) {
      console.log("🔍 DEBUG - Prefilled parent data in booking modal:", prefilledParent);
      console.log("🔍 DEBUG - Prefilled parent waiver status:", prefilledParent.waiverSigned);
      
      form.setValue("parentFirstName", prefilledParent.firstName);
      form.setValue("parentLastName", prefilledParent.lastName);
      form.setValue("parentEmail", prefilledParent.email);
      form.setValue("parentPhone", prefilledParent.phone);
      form.setValue("emergencyContactName", prefilledParent.emergencyContactName);
      form.setValue("emergencyContactPhone", prefilledParent.emergencyContactPhone);
      form.setValue("waiverSigned", prefilledParent.waiverSigned || false);
      
      // If waiver is already signed, set the waiver state to true
      if (prefilledParent.waiverSigned) {
        console.log("🔍 DEBUG - Setting waiver signed to true");
        setWaiverSigned(true);
      } else {
        console.log("🔍 DEBUG - Waiver not signed, keeping false");
      }
    }
  }, [prefilledParent, form]);

  // Handle prefilled athletes and auto-populate form
  useEffect(() => {
    if (prefilledAthletes && prefilledAthletes.length > 0) {
      const athlete = prefilledAthletes[0];
      const athletes = form.getValues("athletes");
      if (athletes && athletes.length > 0) {
        athletes[0] = {
          ...athletes[0],
          name: athlete.name,
          dateOfBirth: athlete.dateOfBirth,
          allergies: athlete.allergies || "",
          experience: athlete.experience,
        };
        form.setValue("athletes", athletes);
      }
      
      // Skip to step 3 (Schedule) since athlete info is pre-filled
      setCurrentStep(3);
    }
  }, [prefilledAthletes, form]);

  const handleLessonTypeChange = (lessonType: string) => {
    setSelectedLessonType(lessonType);
    form.setValue("lessonType", lessonType);
    const lt = byKey(lessonType);
    form.setValue("amount", (lt?.price ?? 40).toString());
  };

  const handleFocusAreaToggle = (area: string, checked: boolean) => {
    const currentAreas = form.getValues("focusAreaIds");
    if (checked && currentAreas.length < maxFocusAreas) {
      form.setValue("focusAreaIds", [...currentAreas, parseInt(area)]);
    } else if (!checked) {
      form.setValue("focusAreaIds", currentAreas.filter(id => id !== parseInt(area)));
    }
  };

  const validateCurrentStep = () => {
    const values = form.getValues();
    
    switch (currentStep) {
      case 1: // Lesson Type
        return !!values.lessonType;
      case 2: // Athletes
        return !!values.athletes?.[0]?.name && !!values.athletes?.[0]?.dateOfBirth && !!values.athletes?.[0]?.experience;
      case 3: // Schedule
        return !!values.preferredDate && !!values.preferredTime && values.focusAreaIds?.length > 0;
      case 4: // Parent Info - skip validation if parent is logged in
        if (parentAuthData?.loggedIn || (prefilledParent && isReturningParent)) {
          return true; // Skip validation if parent is already authenticated
        }
        return !!values.parentFirstName && !!values.parentLastName && !!values.parentEmail && 
               !!values.parentPhone && !!values.emergencyContactName && !!values.emergencyContactPhone;
      case 5: // Waiver
        return waiverSigned || !!waiverData;
      default:
        return true;
    }
  };

  const nextStep = () => {
    // Check if current step is valid before advancing
    if (!validateCurrentStep()) {
      toast({
        title: "Please complete all required fields",
        description: "All fields in this step must be filled before continuing.",
        variant: "destructive"
      });
      return;
    }

    if (currentStep < 6) {
      let nextStepNumber = currentStep + 1;
      
      // Skip parent info step (step 4) if parent is already logged in OR has prefilled data
      if (currentStep === 3 && (parentAuthData?.loggedIn || (prefilledParent && isReturningParent))) {
        nextStepNumber = 5; // Skip directly to waiver step
      }
      
      setCurrentStep(nextStepNumber);
    }
  };

  // Validation helper for step 4
  const isStep4Valid = () => {
    const values = form.getValues();
    const required = [
      values.parentFirstName?.trim(),
      values.parentLastName?.trim(), 
      values.parentEmail?.trim(),
      values.parentPhone?.trim(),
      values.emergencyContactName?.trim(),
      values.emergencyContactPhone?.trim()
    ];
    return required.every(field => field && field.length > 0);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      let prevStepNumber = currentStep - 1;
      
      // Skip parent info step (step 4) when going backwards if parent is logged in
      if (currentStep === 5 && (parentAuthData?.loggedIn || (prefilledParent && isReturningParent))) {
        prevStepNumber = 3; // Skip back to schedule step
      }
      
      setCurrentStep(prevStepNumber);
    }
  };

  // Automatically skip parent info step if parent is already logged in
  useEffect(() => {
    if (currentStep === 4 && (parentAuthData?.loggedIn || (prefilledParent && isReturningParent))) {
      setCurrentStep(5); // Skip to waiver step
    }
  }, [currentStep, parentAuthData?.loggedIn, prefilledParent, isReturningParent]);

  const onSubmit = async (data: FormData) => {
    try {
      // Transform form data to match InsertBooking schema
      const bookingData: any = {
        // Core required fields
        parentId: 0, // Will be handled by backend
        lessonTypeId: selectedLt?.id || 0, // Prefer DB id when available
        
        // Form data
  lessonType: data.lessonType,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        focusAreaIds: data.focusAreaIds,
        apparatusIds: data.apparatusIds,
        sideQuestIds: data.sideQuestIds,
        
        // Parent info
        parentFirstName: data.parentFirstName,
        parentLastName: data.parentLastName,
        parentEmail: data.parentEmail,
        parentPhone: data.parentPhone,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        
        // Financial and status
        amount: data.amount,
        status: data.status,
        bookingMethod: data.bookingMethod,
        paymentStatus: data.paymentStatus,
        
        // Athletes array
        athletes: data.athletes,
        
        // Safety and other fields
        specialRequests: data.specialRequests,
        adminNotes: data.adminNotes,
        reservationFeePaid: data.reservationFeePaid,
        paidAmount: data.paidAmount,
        safetyVerificationSigned: data.safetyVerificationSigned,
        dropoffPersonName: data.dropoffPersonName,
        dropoffPersonRelationship: data.dropoffPersonRelationship,
        dropoffPersonPhone: data.dropoffPersonPhone,
        pickupPersonName: data.pickupPersonName,
        pickupPersonRelationship: data.pickupPersonRelationship,
        pickupPersonPhone: data.pickupPersonPhone,
      };
      
      // First create the booking
      const booking = await createBooking.mutateAsync(bookingData);
      
      // Use the actual lesson amount from the form data
  const ltForAmount = byKey(data.lessonType);
  const lessonAmount = data.amount || ltForAmount?.price || 0;
      
      // Create payment intent with actual lesson price
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        bookingId: booking.id,
        amount: lessonAmount,
      });
      
      const { clientSecret } = await response.json();
      
      // Store booking and payment details for checkout
      localStorage.setItem('currentBooking', JSON.stringify({
        bookingId: booking.id,
        clientSecret,
        lessonType: data.lessonType,
        totalAmount: data.amount,
        lessonFee: lessonAmount,
        athlete1Name: data.athletes?.[0]?.name || "",
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime
      }));
      
      // Close modal and redirect to payment
      if (onOpenChange) {
        onOpenChange(false);
      } else {
        handleClose();
      }
      setCurrentStep(1);
      form.reset();
      
      // Navigate to checkout page using proper routing
      setLocation('/checkout');
      
    } catch (error) {
      console.error("Booking failed:", error);
    }
  };

  const getStepIcon = (step: number) => {
    const isActive = currentStep === step;
    const isCompleted = currentStep > step;
    
    let baseClasses = "rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200";
    let classes = "";
    
    if (isCompleted) {
      classes = "w-6 h-6 md:w-8 md:h-8 bg-green-500 text-white";
    } else if (isActive) {
      classes = "w-8 h-8 md:w-10 md:h-10 bg-blue-600 text-white shadow-lg";
    } else {
      classes = "w-6 h-6 md:w-8 md:h-8 bg-gray-300 text-gray-600";
    }
    
    return (
      <div className={`${baseClasses} ${classes}`}>
        {isCompleted ? "✓" : step}
      </div>
    );
  };

  return (
    <Dialog open={modalOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-full max-h-full p-0 md:max-w-4xl md:max-h-[90vh] md:h-auto md:w-auto md:p-6 overflow-y-auto rounded-none md:rounded-lg border-0 md:border">
        <DialogHeader className="px-4 pt-4 md:px-0 md:pt-0">
          <DialogTitle className="text-xl md:text-2xl font-bold text-gray-800">Book Your Gymnastics Lesson</DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            Complete this form to book your private or semi-private gymnastics lesson with Coach Will.
          </DialogDescription>
        </DialogHeader>

        {/* Responsive Step Indicator */}
        <div className="mb-6 md:mb-8 px-4 md:px-0">
          <div className="steps-container flex justify-between items-center w-full max-w-full overflow-visible gap-1 md:gap-4">
            {[
              { step: 1, label: "Lesson", fullLabel: "Lesson Type" },
              { step: 2, label: "Athletes", fullLabel: "Athletes" },
              { step: 3, label: "Schedule", fullLabel: "Schedule" },
              { step: 4, label: "Parent", fullLabel: "Parent Info" },
              { step: 5, label: "Waiver", fullLabel: "Waiver" },
              { step: 6, label: "Payment", fullLabel: "Payment" }
            ].filter(stepData => {
              // Hide parent info step if parent is logged in
              if (stepData.step === 4 && (parentAuthData?.loggedIn || (prefilledParent && isReturningParent))) {
                return false;
              }
              return true;
            }).map((stepData, index, filteredSteps) => (
              <div key={stepData.step} className="step flex-1 flex flex-col items-center text-center">
                {getStepIcon(stepData.step)}
                <span className={`text-xs md:text-sm font-medium mt-1 md:mt-2 transition-all duration-200 ${
                  currentStep >= stepData.step ? 'text-gray-800' : 'text-gray-500'
                } ${currentStep === stepData.step ? 'font-bold' : ''}`}>
                  <span className="md:hidden">{stepData.label}</span>
                  <span className="hidden md:inline">{stepData.fullLabel}</span>
                </span>
                {index < filteredSteps.length - 1 && (
                  <div className="hidden md:block absolute top-4 left-1/2 w-full h-px bg-gray-300 transform translate-x-1/2 z-0"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-4 md:px-0">
            {/* Step 1: Lesson Type Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Select Lesson Type</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 font-medium">
                    <strong>Payment Information:</strong> A reservation fee may be required to secure your lesson and will be applied toward the total cost. The remaining balance is due before your lesson begins.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {lessonTypes.map((lt) => {
                    const key = nameToKey(lt.name);
                    const athletes = lt.isPrivate ? 1 : (lt.maxAthletes || 2);
                    const price = lt.price ?? 40;
                    const maxFa = maxFocusAreasFor(lt);
                    return (
                    <Card 
                      key={key}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedLessonType === key ? 'ring-2 ring-blue-600' : ''
                      }`}
                      onClick={() => handleLessonTypeChange(key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-gray-800">{lt.name}</h4>
                            {lt.description && (
                              <p className="text-sm text-gray-600 mb-2">{lt.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                              <span className="flex items-center">
                                {athletes === 1 ? <User className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                                {athletes} athlete{athletes > 1 ? 's' : ''}
                              </span>
                              <span>Up to {maxFa} focus areas</span>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-blue-600">${price.toFixed(2)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  );})}
                </div>
              </div>
            )}

            {/* Step 2: Athlete Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Athlete Information</h3>
                
                {/* Athlete 1 */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">Athlete 1</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="athletes.0.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <ParentFormInput placeholder="Enter athlete name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="athletes.0.dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <ParentFormInput type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="athletes.0.gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {genderOptions.map((gender) => (
                                <SelectItem key={gender} value={gender}>
                                  {gender}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="athletes.0.experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Experience Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EXPERIENCE_LEVELS.map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level.charAt(0).toUpperCase() + level.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid md:grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="athletes.0.allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergies/Medical</FormLabel>
                          <FormControl>
                            <ParentFormInput placeholder="None" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Athlete 2 (for semi-private lessons) */}
                {(selectedLessonType === "dual-quest" || selectedLessonType === "partner-progression") && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">Athlete 2</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="athletes.1.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <ParentFormInput 
                                placeholder="Enter athlete name" 
                                value={field.value || ""} 
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                disabled={field.disabled}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="athletes.1.dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <ParentFormInput type="date" value={field.value || ""} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="athletes.1.gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {genderOptions.map((gender) => (
                                  <SelectItem key={gender} value={gender}>
                                    {gender}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="athletes.1.experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Experience Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {EXPERIENCE_LEVELS.map((level) => (
                                  <SelectItem key={level} value={level}>
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid md:grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="athletes.1.allergies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allergies/Medical</FormLabel>
                            <FormControl>
                              <ParentFormInput placeholder="None" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Schedule & Focus Areas */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Schedule & Focus Areas</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="preferredDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          Preferred Date
                        </FormLabel>
                        <FormControl>
                          <ParentFormInput 
                            type="date" 
                            value={field.value ? field.value.toISOString().split('T')[0] : ''} 
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preferredTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Preferred Time
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!watchedDate ? (
                              <SelectItem value="__no_date" disabled>
                                Please select a date first
                              </SelectItem>
                            ) : slotsLoading ? (
                              <SelectItem value="__loading" disabled>
                                Loading available times...
                              </SelectItem>
                            ) : availableSlots.length === 0 ? (
                              <SelectItem value="__no_slots" disabled>
                                No available times for this date
                              </SelectItem>
                            ) : (
                              availableSlots.map((time: string) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <TwoStepFocusAreas
                  selectedFocusAreas={watchedFocusAreaIds.map(id => id.toString())}
                  onFocusAreasChange={(areas: string[]) => form.setValue('focusAreaIds', areas.map(id => parseInt(id)))}
                  maxSelections={maxFocusAreas}
                />
              </div>
            )}

            {/* Step 4: Parent/Guardian Information - Skip if parent is logged in */}
            {(() => {
              const shouldSkipParentInfo = parentAuthData?.loggedIn || (prefilledParent && isReturningParent);

              
              if (currentStep !== 4 || shouldSkipParentInfo) {
                return null;
              }
              
              return (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Parent/Guardian Information</h3>
                
                  {/* Parent/Guardian Information */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800">Contact Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="parentFirstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <ParentFormInput placeholder="Enter first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="parentLastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <ParentFormInput placeholder="Enter last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="parentEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <ParentFormInput type="email" placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parentPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <ParentFormInput type="tel" placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <h4 className="font-bold text-gray-800 mt-6">Emergency Contact</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emergencyContactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Name</FormLabel>
                            <FormControl>
                              <ParentFormInput placeholder="Enter emergency contact name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emergencyContactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Phone</FormLabel>
                            <FormControl>
                              <ParentFormInput type="tel" placeholder="Enter emergency contact phone" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Step 5: Waiver */}
            {currentStep === 5 && (
              <div className="space-y-6">
                {waiverSigned ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Waiver Status</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center">
                        <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                        <div>
                          <h4 className="font-semibold text-green-800">Waiver Already Signed</h4>
                          <p className="text-green-700 text-sm mt-1">
                            Great news! You've already signed the liability waiver for this athlete. You can proceed directly to payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Liability Waiver</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-6 w-6 text-amber-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-amber-800">Waiver Required</h4>
                          <p className="text-amber-700 text-sm mt-1 mb-4">
                            Before we can proceed with your booking, we need you to review and sign our liability waiver and adventure agreement.
                          </p>
                          <Button
                            type="button"
                            onClick={() => setShowWaiverModal(true)}
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Sign Waiver & Agreement
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Payment */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Payment Information</h3>
                
                {/* Booking Summary */}
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-gray-800 mb-4">Booking Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Lesson Type:</span>
                        <span className="font-medium">{selectedLt?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Athletes:</span>
                        <span className="font-medium">
                          {form.watch("athletes")?.[0]?.name}
                          {!selectedLt?.isPrivate && form.watch("athletes")?.[1]?.name && 
                            `, ${form.watch("athletes")?.[1]?.name}`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date & Time:</span>
                        <span className="font-medium">
                          {form.watch("preferredDate")?.toLocaleDateString()} at {form.watch("preferredTime")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Focus Areas:</span>
                        <span className="font-medium">
                          {watchedFocusAreaIds.join(", ")}
                        </span>
                      </div>
                      {(form.watch("parentFirstName") || form.watch("parentLastName") || prefilledParent) && (
                        <div className="flex justify-between">
                          <span>Parent/Guardian:</span>
                          <span className="font-medium">
                            {prefilledParent 
                              ? `${prefilledParent.firstName} ${prefilledParent.lastName}` 
                              : `${form.watch("parentFirstName")} ${form.watch("parentLastName")}`
                            }
                          </span>
                        </div>
                      )}
                      {(form.watch("parentEmail") || prefilledParent?.email) && (
                        <div className="flex justify-between">
                          <span>Contact Email:</span>
                          <span className="font-medium">
                            {prefilledParent?.email || form.watch("parentEmail")}
                          </span>
                        </div>
                      )}
                      {(form.watch("parentPhone") || prefilledParent?.phone) && (
                        <div className="flex justify-between">
                          <span>Contact Phone:</span>
                          <span className="font-medium">
                            {prefilledParent?.phone || form.watch("parentPhone")}
                          </span>
                        </div>
                      )}
                      <hr className="my-4" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-blue-600">${(selectedLt?.price ?? 0).toString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                      Secure Payment Processing
                    </h4>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-700">Lesson Fee:</span>
                        <span className="font-bold text-green-600">${(selectedLt?.price ?? 0).toString()}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">Total Due Now:</span>
                          <span className="text-lg font-bold text-blue-600">${(byKey(form.getValues("lessonType"))?.price || 0).toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Pay reservation fee to secure your lesson booking.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Secure Payment:</strong> Payment processing powered by Stripe. 
                        Your card information is encrypted and secure.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={currentStep === 1 ? "invisible" : ""}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex space-x-4">
                {currentStep < 6 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      (currentStep === 1 && !selectedLessonType) || 
                      (currentStep === 2 && form.getValues("focusAreaIds").length === 0) ||
                      (currentStep === 4 && !isStep4Valid()) ||
                      (currentStep === 5 && !waiverSigned)
                    }
                    className="gym-gradient-blue text-white hover:scale-105 transform transition-all duration-200"
                  >
                    {currentStep === 5 ? "Continue to Payment" : "Next"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createBooking.isPending}
                    className="gym-gradient-teal text-white px-8 hover:scale-105 transform transition-all duration-200 shadow-lg"
                  >
                    {createBooking.isPending ? (
                      "Processing..."
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Booking
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
      
      {/* Updated Waiver Modal */}
      <UpdatedWaiverModal
        isOpen={showWaiverModal}
        onClose={() => setShowWaiverModal(false)}
        onWaiverSigned={(waiverData) => {
          setWaiverData(waiverData);
          setWaiverSigned(true);
          setShowWaiverModal(false);
          // Advance to next step (payment)
          setCurrentStep(6);
          toast({
            title: "Waiver Signed Successfully",
            description: "Thank you for completing the waiver. You can now proceed to payment.",
          });
        }}
        bookingData={{
          athleteName: form.watch("athletes")?.[0]?.name || "",
          parentName: `${form.watch("parentFirstName")} ${form.watch("parentLastName")}`,
          emergencyContactNumber: form.watch("emergencyContactPhone"),
          relationshipToAthlete: "Parent/Guardian",
        }}
        athleteId={undefined} // Will be created during booking process
        parentId={unifiedParentId || validParentId}
        athleteData={form.watch("athletes")?.[0] ? {
          name: form.watch("athletes")[0].name,
          dateOfBirth: form.watch("athletes")[0].dateOfBirth,
          gender: form.watch("athletes")[0].gender,
          allergies: form.watch("athletes")[0].allergies,
          experience: form.watch("athletes")[0].experience,
        } : undefined}
      />
    </Dialog>
  );
}
