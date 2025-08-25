import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ParentFormInput } from "@/components/parent-ui/ParentFormComponents";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedAuth } from "@/hooks/use-unified-auth";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight, FileText, Heart, Shield, Users, Maximize2, Minimize2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import SignatureCanvas from "react-signature-canvas";
import { z } from "zod";

// Updated waiver schema matching new requirements exactly
const waiverSchema = z.object({
  athleteName: z.string().min(1, "Athlete name is required"),
  signerName: z.string().min(1, "Parent/Signer name is required"),
  relationshipToAthlete: z.string().min(1, "Relationship to athlete is required"),
  emergencyContactNumber: z.string().min(10, "Emergency contact number is required"),
  
  // The exact 5 checkboxes from requirements
  understandsRisks: z.boolean().refine(val => val === true, "Must acknowledge risks and responsibility"),
  agreesToPolicies: z.boolean().refine(val => val === true, "Must agree to payment, cancellation, and attendance policies"),
  authorizesEmergencyCare: z.boolean().refine(val => val === true, "Must authorize emergency medical care"),
  allowsPhotoVideo: z.boolean().default(true), // Optional - defaults to true
  confirmsAuthority: z.boolean().refine(val => val === true, "Must confirm legal authority to sign"),
  
  signature: z.string().min(1, "Digital signature is required"),
});

type WaiverFormData = z.infer<typeof waiverSchema>;

interface UpdatedWaiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWaiverSigned: (waiverData: any) => void;
  bookingData?: {
    athleteName?: string;
    parentName?: string;
    emergencyContactNumber?: string;
    relationshipToAthlete?: string;
  };
  athleteId?: number;  // Optional - for existing athletes
  parentId?: number;   // Optional but required for submission
  // For new booking flow - athlete data when athleteId is not available
  athleteData?: {
    name: string;
    dateOfBirth?: string;
    gender?: string;
    allergies?: string;
    experience?: string;
  };
}

export function UpdatedWaiverModal({ isOpen, onClose, onWaiverSigned, bookingData, athleteId, parentId, athleteData }: UpdatedWaiverModalProps) {
  const [step, setStep] = useState(1);
  const [signatureData, setSignatureData] = useState<string>("");
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isSignatureMaximized, setIsSignatureMaximized] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use unified authentication to handle both parent and admin login
  const { isAuthenticated, parentId: authParentId, isParent, isAdmin } = useUnifiedAuth();
  
  // Determine the actual parentId to use - prefer prop, fallback to auth
  const effectiveParentId = parentId || authParentId;

  // Handle window resize for signature canvas
  useEffect(() => {
    const handleResize = () => {
      if (signatureRef.current) {
        const canvas = signatureRef.current.getCanvas();
        const rect = canvas.getBoundingClientRect();
        // Force re-render of signature canvas on resize
        signatureRef.current.clear();
        if (signatureData) {
          // Restore signature if it exists
          const img = new Image();
          img.onload = () => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
          };
          img.src = signatureData;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [signatureData]);

  // Force landscape orientation for mobile signature modal (real devices only)
  useEffect(() => {
    if (isSignatureMaximized) {
      // Only apply fullscreen/orientation on actual mobile devices, not emulators
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isRealDevice = 'ontouchstart' in window && window.screen.width <= 768;
      
      if (isMobile && isRealDevice) {
        // Lock orientation to landscape on mobile devices (defensive for TS/dom variations)
        const orientation: any = (screen as any)?.orientation;
        if (orientation?.lock && typeof orientation.lock === 'function') {
          orientation.lock('landscape').catch(() => {
            // Silent fail if orientation lock is not supported
          });
        }
        
        // Request fullscreen on mobile only
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {
            // Silent fail if fullscreen is not allowed
          });
        }
        
        // Optimize viewport for signature signing on mobile
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      }
      
      // Add class for CSS targeting (safe for all devices)
      document.body.classList.add('signature-fullscreen');
      
    } else {
      // Cleanup: unlock orientation and exit fullscreen
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
      
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      
      // Reset viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
      
      // Remove class
      document.body.classList.remove('signature-fullscreen');
    }

    // Cleanup on unmount
    return () => {
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
      
      document.body.classList.remove('signature-fullscreen');
    };
  }, [isSignatureMaximized]);

  // Scroll to top when step changes (mobile friendly)
  useEffect(() => {
    const scrollToTop = () => {
      // Try multiple approaches to ensure scrolling works
      
      // 1. Scroll the main modal content
      if (modalContentRef.current) {
        const viewport = modalContentRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }
      
      // 2. Also try scrolling the dialog content itself
      const dialogContent = document.querySelector('[role="dialog"]');
      if (dialogContent) {
        dialogContent.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      
      // 3. Fallback: scroll any scrollable parent
      const scrollableElements = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
      scrollableElements.forEach(element => {
        if (element.scrollTop > 0) {
          element.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      });
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToTop, 100);
    
    return () => clearTimeout(timeoutId);
  }, [step]);

  // Reset scroll position when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setHasScrolledToBottom(false);
      // Scroll to top when modal opens
      setTimeout(() => {
        const dialogContent = document.querySelector('[role="dialog"]');
        if (dialogContent) {
          dialogContent.scrollTo({ top: 0, behavior: 'instant' });
        }
      }, 50);
    }
  }, [isOpen]);

  const form = useForm<WaiverFormData>({
    resolver: zodResolver(waiverSchema),
    defaultValues: {
      athleteName: bookingData?.athleteName || "",
      signerName: bookingData?.parentName || "",
      relationshipToAthlete: bookingData?.relationshipToAthlete || "Parent/Guardian",
      emergencyContactNumber: bookingData?.emergencyContactNumber || "",
      understandsRisks: false,
      agreesToPolicies: false,
      authorizesEmergencyCare: false,
      allowsPhotoVideo: true,
      confirmsAuthority: false,
      signature: "",
    },
  });

  const createWaiverMutation = useMutation({
    mutationFn: async (waiverData: any) => {
      console.log('🔄 Sending waiver data to API:', JSON.stringify(waiverData, null, 2));
      const response = await apiRequest("POST", "/api/waivers", waiverData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error('❌ Waiver API error:', errorData);
        throw new Error(`Failed to create waiver: ${errorData.error || response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Waiver created successfully:', data);
      toast({
        title: "Waiver Signed Successfully",
        description: "Your waiver has been signed and saved. You'll receive a copy via email.",
      });
      onWaiverSigned(data);
      onClose();
      // Invalidate all waiver-related queries to update UI dynamically
      queryClient.invalidateQueries({ queryKey: ["/api/waivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent/athletes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent/waivers"] });
    },
    onError: (error: any) => {
      console.error('❌ Waiver mutation error:', error);
      let errorMessage = "Failed to sign waiver. Please try again.";
      
      // Extract specific error messages for common issues
      if (error.message?.includes("Both athleteId and parentId are required")) {
        errorMessage = "Parent authentication is required. Please log in again or refresh the page.";
      } else if (error.message?.includes("400") || error.message?.includes("Invalid waiver data")) {
        errorMessage = "Invalid waiver data. Please check all fields and try again.";
      } else if (error.message?.includes("500")) {
        errorMessage = "Server error. Please try again later or contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error Signing Waiver",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const scrolledToBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
    if (scrolledToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return form.getValues("athleteName") && 
               form.getValues("signerName") && 
               form.getValues("relationshipToAthlete") &&
               form.getValues("emergencyContactNumber");
      case 2:
        return hasScrolledToBottom &&
               form.getValues("understandsRisks") && 
               form.getValues("agreesToPolicies") && 
               form.getValues("authorizesEmergencyCare") && 
               form.getValues("confirmsAuthority");
      case 3:
        return signatureData && signatureData.length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(step)) {
      let message = "Please complete all required fields before continuing.";
      if (step === 2 && !hasScrolledToBottom) {
        message = "Please scroll through the entire waiver agreement before proceeding.";
      }
      toast({
        title: "Required Information Missing",
        description: message,
        variant: "destructive",
      });
      return;
    }
    
    if (step < 3) {
      setStep(step + 1);
      // Scroll to top will be handled by useEffect
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      // Scroll to top will be handled by useEffect
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setSignatureData("");
    form.setValue("signature", "");
  };

  const saveSignature = () => {
    if (signatureRef.current) {
      try {
        const signature = signatureRef.current.getCanvas().toDataURL();
        setSignatureData(signature);
        form.setValue("signature", signature);
      } catch (error) {
        console.error('Error saving signature:', error);
        toast({
          title: "Signature Error",
          description: "Unable to save signature. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = async (data: WaiverFormData) => {
    console.log('🔍 Waiver modal authentication check:', {
      isAuthenticated,
      isParent,
      isAdmin,
      effectiveParentId,
      propParentId: parentId,
      authParentId,
      athleteId,
      hasAthleteData: !!athleteData
    });
    
    if (!signatureData) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Construct waiver data with formData and signature
    const waiverData: any = {
      ...data,
      signature: signatureData,
      signedAt: new Date(),
    };
    
    // Include parentId if we have one (prefer prop, then auth)
    if (effectiveParentId && effectiveParentId > 0) {
      waiverData.parentId = effectiveParentId;
      console.log('✅ Using effective parentId:', effectiveParentId);
    } else {
      console.warn('⚠️ No valid parentId available:', { 
        providedParentId: parentId, 
        authParentId,
        isAuthenticated,
        isParent
      });
      
      // If we're in parent context but no valid ID, show authentication error
      if (isParent && !effectiveParentId) {
        toast({
          title: "Authentication Error",
          description: "Your parent session may have expired. Please try logging in again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Only include athleteId if it exists and is valid
    if (athleteId) {
      waiverData.athleteId = athleteId;
    }
    
    // Include athlete data for new booking flow when athleteId is not available
    if (athleteData && !athleteId) {
      waiverData.athleteData = {
        name: athleteData.name,
        dateOfBirth: athleteData.dateOfBirth,
        gender: athleteData.gender,
        allergies: athleteData.allergies,
        experience: athleteData.experience,
      };
    }

    console.log('📤 Submitting waiver data:', waiverData);
    
    // Let the server handle the validation - it will return appropriate errors
    // if authentication or required data is missing
    createWaiverMutation.mutate(waiverData);
  };

  const steps = [
    { number: 1, title: "Basic Information", icon: Users },
    { number: 2, title: "Waiver Agreement", icon: Shield },
    { number: 3, title: "Digital Signature", icon: FileText },
  ];

  return (
    <>
      {/* Main Waiver Modal */}
      <Dialog open={isOpen && !isSignatureMaximized} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-4xl max-h-[95vh] w-[95vw] sm:w-full overflow-hidden p-4 sm:p-6"
          aria-describedby="waiver-modal-description"
        >
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg sm:text-2xl font-bold text-amber-600 leading-tight">
              CoachWillTumbles.com - Waiver & Adventure Agreement
            </DialogTitle>
            <DialogDescription id="waiver-modal-description" className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Welcome to the journey! Every hero needs a guide, and every quest begins with a few ground rules.
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps - Responsive */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 overflow-x-auto">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center min-w-0">
                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex-shrink-0 ${
                  step >= s.number 
                    ? 'bg-amber-500 border-amber-500 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step > s.number ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <span className={`ml-1 sm:ml-2 text-xs sm:text-sm font-medium hidden sm:block ${
                  step >= s.number ? 'text-amber-600' : 'text-gray-400'
                }`}>
                  {s.title}
                </span>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mx-2 sm:mx-4 hidden sm:block" />
                )}
              </div>
            ))}
          </div>

          <ScrollArea 
            ref={modalContentRef}
            className="flex-1 max-h-[60vh] sm:max-h-[65vh]"
          >
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="athleteName" className="text-sm sm:text-base">Athlete Name *</Label>
                      <ParentFormInput
                        id="athleteName"
                        {...form.register("athleteName")}
                        placeholder="Enter athlete's full name"
                        className="text-sm sm:text-base"
                      />
                      {form.formState.errors.athleteName && (
                        <p className="text-red-500 text-xs sm:text-sm">{form.formState.errors.athleteName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="signerName" className="text-sm sm:text-base">Parent/Guardian Name *</Label>
                      <ParentFormInput
                        id="signerName"
                        {...form.register("signerName")}
                        placeholder="Enter your full name"
                        className="text-sm sm:text-base"
                      />
                      {form.formState.errors.signerName && (
                        <p className="text-red-500 text-xs sm:text-sm">{form.formState.errors.signerName.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="relationshipToAthlete" className="text-sm sm:text-base">Relationship to Athlete *</Label>
                      <ParentFormInput
                        id="relationshipToAthlete"
                        {...form.register("relationshipToAthlete")}
                        placeholder="e.g., Parent, Guardian"
                        className="text-sm sm:text-base"
                      />
                      {form.formState.errors.relationshipToAthlete && (
                        <p className="text-red-500 text-xs sm:text-sm">{form.formState.errors.relationshipToAthlete.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="emergencyContactNumber" className="text-sm sm:text-base">Emergency Contact Number *</Label>
                      <ParentFormInput
                        id="emergencyContactNumber"
                        type="tel"
                        {...form.register("emergencyContactNumber")}
                        placeholder="(555) 123-4567"
                        className="text-sm sm:text-base"
                      />
                      {form.formState.errors.emergencyContactNumber && (
                        <p className="text-red-500 text-xs sm:text-sm">{form.formState.errors.emergencyContactNumber.message}</p>
                      )}
                    </div>
                  </div>

                  <Alert>
                    <Heart className="h-4 w-4" />
                    <AlertDescription>
                      This information will be pre-filled from your booking session. The emergency contact number is required for safety purposes.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Waiver & Adventure Agreement */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Waiver & Adventure Agreement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Full Waiver Text in Scrollable Area */}
                  <div 
                    ref={scrollAreaRef}
                    className="max-h-64 sm:max-h-80 overflow-y-auto border rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm leading-relaxed"
                    onScroll={handleScroll}
                  >
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">1. What's a Session?</h4>
                        <p className="text-gray-700 dark:text-gray-300">Whether we call it a session or a lesson, it means the same thing — a scheduled block of training with Coach Will.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">2. Risks of the Journey</h4>
                        <p className="text-gray-700 dark:text-gray-300">Tumbling, gymnastics, and athletic training are physical adventures — and every adventure carries risks, including but not limited to:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                          <li>Scrapes, bruises, strains, sprains</li>
                          <li>Joint dislocations, muscle pulls, broken bones</li>
                          <li>Head, neck, and spinal injuries</li>
                          <li>Accidental contact with equipment or others</li>
                        </ul>
                        <p className="mt-2 text-gray-700 dark:text-gray-300">You acknowledge these risks cannot be eliminated and voluntarily assume all risks associated with participation.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">3. Release of Liability and Indemnification</h4>
                        <p className="text-gray-700 dark:text-gray-300">In consideration of participation, you, on behalf of yourself, your athlete, and your heirs, release and hold harmless Coach Will Sawyer, affiliated coaches and staff, Oceanside Gymnastics, and any partnered facilities (collectively, the "Providers") from any and all claims, demands, or causes of action arising out of ordinary negligence. This release does not apply to gross negligence, willful misconduct, or intentional acts.</p>
                        <p className="mt-2 text-gray-700 dark:text-gray-300">You agree to indemnify and defend the Providers against any claims, damages, or expenses arising from your athlete's participation.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">4. Emergency Medical Care Authorization</h4>
                        <p className="text-gray-700 dark:text-gray-300">In case of injury, you authorize Coach Will and affiliated staff to administer first aid and/or seek emergency medical treatment, including transportation to a medical facility. You agree to be financially responsible for all related costs and understand you will be notified as soon as reasonably possible.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">5. Booking & Payment Policies</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                          <li>A reservation fee is required to secure your session.</li>
                          <li>If payment fails, you have 12 hours to complete it before your spot is forfeited.</li>
                          <li>Remaining balance is due at session start.</li>
                          <li>Accepted payments: Cash, Zelle, Venmo, CashApp (no cards or checks).</li>
                          <li>Semi-private sessions include no more than two athletes per session.</li>
                          <li>Reservation fees are non-refundable if canceled within 24 hours of the session.</li>
                          <li>No-shows without notifying Coach Will forfeits reservation fees.</li>
                          <li>Cancellations must be made via text, email, or the CoachWillTumbles.com Parent Portal.</li>
                          <li>Do not call the gym to cancel — always contact Coach Will directly.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">6. Session Timing</h4>
                        <p className="text-gray-700 dark:text-gray-300">Late arrivals will be charged full session fees. Early arrivals may warm up quietly but must wait for coach approval before using equipment or practicing skills.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">7. Parents, Guests & Siblings</h4>
                        <p className="text-gray-700 dark:text-gray-300">Only athletes and coaches are allowed in training areas or on equipment. Please watch from designated viewing areas and keep floors clear during active sessions.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">8. Photo & Video Release</h4>
                        <p className="text-gray-700 dark:text-gray-300">You grant permission for CoachWillTumbles to use photos or videos of your athlete for training, promotional materials, or social media. You agree to provide written notice to opt out.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">9. Appropriate Attire</h4>
                        <p className="text-gray-700 dark:text-gray-300">For safety and comfort, participants must wear suitable athletic clothing that allows free movement. Recommended attire includes fitted t-shirts or tank tops, athletic shorts, leggings, or gymnastics leotards. Avoid loose clothing, jewelry, watches, or accessories that could cause injury. Proper footwear or bare feet as directed by coach.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">10. Waiver Requirements</h4>
                        <p className="text-gray-700 dark:text-gray-300">Every athlete must have a signed waiver on file with both Oceanside Gymnastics and CoachWillTumbles.com. No waiver = no training.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">11. Severability</h4>
                        <p className="text-gray-700 dark:text-gray-300">If any part of this Agreement is found invalid or unenforceable, the remaining provisions shall remain in full force and effect.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">12. Governing Law and Venue</h4>
                        <p className="text-gray-700 dark:text-gray-300">This Agreement shall be governed by the laws of the State of California. Any disputes arising hereunder shall be resolved exclusively in the courts located in San Diego County, California.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">13. Acknowledgment and Authority to Sign</h4>
                        <p className="text-gray-700 dark:text-gray-300">By signing below, you certify that you have read this entire Waiver & Adventure Agreement, fully understand its terms, and voluntarily agree to be bound by it. You are either the parent or legal guardian of the athlete named below, or you are at least 18 years old and signing on your own behalf. You acknowledge the risks involved and voluntarily assume those risks.</p>
                      </div>

                      <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <p className="text-green-800 dark:text-green-200 font-medium">✓ You have reached the end of the agreement</p>
                        <p className="text-green-700 dark:text-green-300 text-sm">Please review the checkboxes below to confirm your agreement.</p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {!hasScrolledToBottom 
                        ? "Please scroll through the entire agreement above to continue."
                        : "You have read the full agreement. Please check all required boxes below."
                      }
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="understandsRisks"
                        checked={form.watch("understandsRisks")}
                        onCheckedChange={(checked) => form.setValue("understandsRisks", checked as boolean)}
                        disabled={!hasScrolledToBottom}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="understandsRisks" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          I understand that tumbling and gymnastics carry inherent risks, and I accept full responsibility for any injuries that may occur. *
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreesToPolicies"
                        checked={form.watch("agreesToPolicies")}
                        onCheckedChange={(checked) => form.setValue("agreesToPolicies", checked as boolean)}
                        disabled={!hasScrolledToBottom}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="agreesToPolicies" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          I have read and agree to the payment, cancellation, and attendance policies, including that reservation fees are non-refundable within 24 hours of the session. *
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="authorizesEmergencyCare"
                        checked={form.watch("authorizesEmergencyCare")}
                        onCheckedChange={(checked) => form.setValue("authorizesEmergencyCare", checked as boolean)}
                        disabled={!hasScrolledToBottom}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="authorizesEmergencyCare" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          I authorize Coach Will and affiliated staff to provide or seek emergency medical care for my athlete if needed. *
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="allowsPhotoVideo"
                        checked={form.watch("allowsPhotoVideo")}
                        onCheckedChange={(checked) => form.setValue("allowsPhotoVideo", checked as boolean)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="allowsPhotoVideo" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          I give permission for CoachWillTumbles to use photos or videos of my athlete for training or promotional purposes, unless I submit a written opt-out.
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="confirmsAuthority"
                        checked={form.watch("confirmsAuthority")}
                        onCheckedChange={(checked) => form.setValue("confirmsAuthority", checked as boolean)}
                        disabled={!hasScrolledToBottom}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="confirmsAuthority" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          I confirm that I am the athlete's parent or legal guardian, or I am over 18 and signing for myself, and I agree to all terms in this Waiver & Adventure Agreement. *
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Digital Signature */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Digital Signature
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm sm:text-base">Please sign below to complete the waiver *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSignatureMaximized(true)}
                        className="flex items-center gap-2 text-xs sm:text-sm"
                      >
                        <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Larger Signing Area</span>
                        <span className="sm:hidden">Larger</span>
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 sm:p-4 bg-gray-50 dark:bg-gray-800">
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          width: Math.min(window.innerWidth - 100, 600),
                          height: window.innerWidth < 640 ? 120 : 200,
                          className: 'signature-canvas bg-white dark:bg-gray-100 rounded border w-full max-w-full',
                          style: {
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            width: '100%',
                            height: 'auto',
                            maxWidth: '100%'
                          }
                        }}
                        onEnd={() => saveSignature()}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearSignature}
                        className="text-xs sm:text-sm"
                      >
                        Clear Signature
                      </Button>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-right">
                        Date: {new Date().toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      By signing above, you confirm that you have read, understood, and agree to all terms of this Waiver & Adventure Agreement. A PDF copy will be generated and emailed to you for your records.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 pt-4 sm:pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
                size="sm"
                className="w-full sm:w-auto text-sm"
              >
                ← Back
              </Button>
              
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 order-first sm:order-none">
                Step {step} of {steps.length}
              </div>

              {step < steps.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!validateStep(step)}
                  size="sm"
                  className="w-full sm:w-auto text-sm"
                >
                  Next →
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!signatureData || createWaiverMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto text-sm"
                  size="sm"
                >
                  {createWaiverMutation.isPending ? "Signing..." : "Complete Waiver"}
                </Button>
              )}
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>

    {/* Maximized Signature Modal - Full Screen Landscape Optimized */}
    <Dialog open={isSignatureMaximized} onOpenChange={() => setIsSignatureMaximized(false)}>
      <DialogContent className="max-w-full max-h-full w-full h-full p-0 m-0 overflow-hidden fixed inset-0 bg-white dark:bg-gray-900 z-50">
        <div className="flex flex-col h-full w-full">
          {/* Minimal Header - Fixed Height */}
          <div className="flex items-center justify-between p-3 border-b bg-white dark:bg-gray-900 z-10 flex-shrink-0 h-16">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-600 text-sm sm:text-base">Digital Signature</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSignatureMaximized(false)}
              className="flex items-center gap-1"
            >
              <Minimize2 className="w-4 h-4" />
              <span className="text-sm">Done</span>
            </Button>
          </div>

          {/* Full Screen Signature Area - Flexible Height */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 min-h-0">
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full h-full max-w-5xl max-h-full border-2 border-dashed border-amber-300 rounded-lg bg-white dark:bg-gray-100 flex items-center justify-center relative overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      width: Math.min(Math.max(window.innerWidth - 80, 300), 1200),
                      height: Math.min(Math.max(window.innerHeight - 160, 200), 600),
                      className: 'signature-canvas max-w-full max-h-full touch-manipulation',
                      style: {
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        width: '100%',
                        height: '100%',
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }
                    }}
                    onEnd={() => saveSignature()}
                    onBegin={() => {
                      // Ensure canvas is properly initialized
                      if (signatureRef.current) {
                        const canvas = signatureRef.current.getCanvas();
                        if (canvas && typeof canvas.getContext === 'function') {
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            // Canvas is ready
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                {/* Signature Prompt Overlay (only shows when empty) */}
                {!signatureData && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="text-center text-gray-400 dark:text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-lg font-medium">Sign Here</p>
                      <p className="text-sm">Use your finger or stylus to sign</p>
                      <p className="text-xs mt-2">Rotate device to landscape for more space</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Controls - Fixed Height */}
          <div className="flex items-center justify-between p-3 border-t bg-white dark:bg-gray-900 z-10 flex-shrink-0 h-16">
            <Button
              type="button"
              variant="outline"
              onClick={clearSignature}
              size="sm"
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </Button>
            
            <div className="text-center flex-1 mx-4">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              {signatureData && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✓ Signature captured
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={() => setIsSignatureMaximized(false)}
              disabled={!signatureData}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 flex items-center gap-2"
              size="sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Use Signature
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}