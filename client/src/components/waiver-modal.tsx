import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ParentFormInput, ParentFormTextarea } from "@/components/parent-ui/ParentFormComponents";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight, FileText, Heart, Shield, Users } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import SignatureCanvas from "react-signature-canvas";
import { z } from "zod";

// Waiver form schema - updated to match new requirements
const waiverSchema = z.object({
  // Athlete Information (pre-filled from booking)
  athleteName: z.string().min(1, "Athlete name is required"),
  athleteDateOfBirth: z.string().optional(),
  
  // Parent/Guardian Information (pre-filled from booking)
  signerName: z.string().min(1, "Parent/Signer name is required"),
  relationshipToAthlete: z.string().min(1, "Relationship to athlete is required"),
  
  // Emergency Contact (pre-filled from booking)
  emergencyContactNumber: z.string().min(10, "Emergency contact number is required"),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  
  // Medical Information (optional)
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  
  // Required Agreement Checkboxes - exactly as specified
  understandsRisks: z.boolean().refine(val => val === true, "Must acknowledge risks and responsibility"),
  agreesToPolicies: z.boolean().refine(val => val === true, "Must agree to payment, cancellation, and attendance policies"),
  authorizesEmergencyCare: z.boolean().refine(val => val === true, "Must authorize emergency medical care"),
  allowsPhotoVideo: z.boolean().default(true), // Optional - defaults to true
  confirmsAuthority: z.boolean().refine(val => val === true, "Must confirm legal authority to sign"),
  
  // Signature (required)
  signature: z.string().min(1, "Digital signature is required"),
});

type WaiverFormData = z.infer<typeof waiverSchema>;

interface WaiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWaiverSigned: (waiverData: any) => void;
  athleteId: number; // Required for backend
  parentId: number; // Required for backend
  bookingData?: {
    athleteName?: string;
    parentName?: string;
    emergencyContactNumber?: string;
    relationshipToAthlete?: string;
  };
}

export function WaiverModal({ isOpen, onClose, onWaiverSigned, athleteId, parentId, bookingData }: WaiverModalProps) {
  const [step, setStep] = useState(1);
  const [signatureData, setSignatureData] = useState<string>("");
  const signatureRef = useRef<SignatureCanvas>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<WaiverFormData>({
    resolver: zodResolver(waiverSchema),
    defaultValues: {
      athleteName: bookingData?.athleteName || "",
      athleteDateOfBirth: "",
      signerName: bookingData?.parentName || "",
      relationshipToAthlete: bookingData?.relationshipToAthlete || "Parent/Guardian",
      emergencyContactNumber: bookingData?.emergencyContactNumber || "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      medicalConditions: "",
      allergies: "",
      medications: "",
      understandsRisks: false,
      agreesToPolicies: false,
      authorizesEmergencyCare: false,
      allowsPhotoVideo: true, // Default to true as it's optional
      confirmsAuthority: false,
      signature: "",
    },
  });

  const createWaiverMutation = useMutation({
    mutationFn: async (waiverData: any) => {
      const response = await apiRequest("POST", "/api/waivers", waiverData);
      if (!response.ok) {
        throw new Error("Failed to create waiver");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Waiver Signed Successfully",
        description: "Your waiver has been signed and saved. You'll receive a copy via email.",
      });
      onWaiverSigned(data);
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/waivers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Signing Waiver",
        description: error.message || "Failed to sign waiver. Please try again.",
        variant: "destructive",
      });
    },
  });

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return form.getValues("athleteName") && 
               form.getValues("athleteDateOfBirth") && 
               form.getValues("signerName") && 
               form.getValues("relationshipToAthlete");
      case 2:
        return form.getValues("emergencyContactName") && 
               form.getValues("emergencyContactPhone");
      case 3:
        return form.getValues("understandsRisks") && 
               form.getValues("agreesToPolicies") && 
               form.getValues("authorizesEmergencyCare") && 
               form.getValues("confirmsAuthority");
      case 4:
        return signatureData && signatureData.length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep(step)) {
      toast({
        title: "Please complete all required fields",
        description: "All required information must be provided before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
    setSignatureData("");
  };

  const saveSignature = () => {
    if (signatureRef.current) {
      const signature = signatureRef.current.getCanvas().toDataURL();
      setSignatureData(signature);
      form.setValue("signature", signature);
    }
  };

  const onSubmit = async (data: WaiverFormData) => {
    if (!signatureData) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature before submitting.",
        variant: "destructive",
      });
      return;
    }

    const waiverData = {
      ...data,
      athleteId,
      parentId,
      signature: signatureData,
      signedAt: new Date(),
    };

    createWaiverMutation.mutate(waiverData);
  };

  const steps = [
    { number: 1, title: "Basic Information", icon: Users },
    { number: 2, title: "Emergency Contact", icon: Heart },
    { number: 3, title: "Terms & Conditions", icon: Shield },
    { number: 4, title: "Digital Signature", icon: FileText },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-600">
            Waiver & Adventure Agreement
          </DialogTitle>
          <p className="text-gray-600">
            Please complete this waiver to participate in gymnastics activities
          </p>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= s.number 
                  ? 'bg-amber-500 border-amber-500 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {step > s.number ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <s.icon className="w-5 h-5" />
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step >= s.number ? 'text-amber-600' : 'text-gray-400'
              }`}>
                {s.title}
              </span>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-4" />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="athleteName">Athlete Name *</Label>
                      <ParentFormInput
                        id="athleteName"
                        {...form.register("athleteName")}
                        placeholder="Enter athlete's full name"
                      />
                      {form.formState.errors.athleteName && (
                        <p className="text-red-500 text-sm">{form.formState.errors.athleteName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="athleteDateOfBirth">Date of Birth *</Label>
                      <ParentFormInput
                        id="athleteDateOfBirth"
                        type="date"
                        {...form.register("athleteDateOfBirth")}
                      />
                      {form.formState.errors.athleteDateOfBirth && (
                        <p className="text-red-500 text-sm">{form.formState.errors.athleteDateOfBirth.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signerName">Parent/Guardian Name *</Label>
                      <ParentFormInput
                        id="signerName"
                        {...form.register("signerName")}
                        placeholder="Enter your full name"
                      />
                      {form.formState.errors.signerName && (
                        <p className="text-red-500 text-sm">{form.formState.errors.signerName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="relationshipToAthlete">Relationship to Athlete *</Label>
                      <ParentFormInput
                        id="relationshipToAthlete"
                        {...form.register("relationshipToAthlete")}
                        placeholder="e.g., Parent, Guardian"
                      />
                      {form.formState.errors.relationshipToAthlete && (
                        <p className="text-red-500 text-sm">{form.formState.errors.relationshipToAthlete.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Medical Information (Optional)</Label>
                    <ParentFormTextarea
                      placeholder="Any medical conditions we should know about?"
                      {...form.register("medicalConditions")}
                    />
                    <ParentFormTextarea
                      placeholder="Any allergies?"
                      {...form.register("allergies")}
                    />
                    <ParentFormTextarea
                      placeholder="Any medications?"
                      {...form.register("medications")}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Emergency Contact */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                      <ParentFormInput
                        id="emergencyContactName"
                        {...form.register("emergencyContactName")}
                        placeholder="Full name"
                      />
                      {form.formState.errors.emergencyContactName && (
                        <p className="text-red-500 text-sm">{form.formState.errors.emergencyContactName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                      <ParentFormInput
                        id="emergencyContactPhone"
                        type="tel"
                        {...form.register("emergencyContactPhone")}
                        placeholder="(555) 123-4567"
                      />
                      {form.formState.errors.emergencyContactPhone && (
                        <p className="text-red-500 text-sm">{form.formState.errors.emergencyContactPhone.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Waiver & Adventure Agreement */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Waiver & Adventure Agreement
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Welcome to the journey! Every hero needs a guide, and every quest begins with a few ground rules.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Full Waiver Text in Scrollable Area */}
                  <div className="max-h-80 overflow-y-auto border rounded-lg p-4 bg-gray-50 text-sm leading-relaxed">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">1. What's a Session?</h4>
                        <p>Whether we call it a session or a lesson, it means the same thing — a scheduled block of training with Coach Will.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">2. Risks of the Journey</h4>
                        <p>Tumbling, gymnastics, and athletic training are physical adventures — and every adventure carries risks, including but not limited to:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Scrapes, bruises, strains, sprains</li>
                          <li>Joint dislocations, muscle pulls, broken bones</li>
                          <li>Head, neck, and spinal injuries</li>
                          <li>Accidental contact with equipment or others</li>
                        </ul>
                        <p className="mt-2">You acknowledge these risks cannot be eliminated and voluntarily assume all risks associated with participation.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">3. Release of Liability and Indemnification</h4>
                        <p>In consideration of participation, you, on behalf of yourself, your athlete, and your heirs, release and hold harmless Coach Will Sawyer, affiliated coaches and staff, Oceanside Gymnastics, and any partnered facilities (collectively, the "Providers") from any and all claims, demands, or causes of action arising out of ordinary negligence. This release does not apply to gross negligence, willful misconduct, or intentional acts.</p>
                        <p className="mt-2">You agree to indemnify and defend the Providers against any claims, damages, or expenses arising from your athlete's participation.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">4. Emergency Medical Care Authorization</h4>
                        <p>In case of injury, you authorize Coach Will and affiliated staff to administer first aid and/or seek emergency medical treatment, including transportation to a medical facility. You agree to be financially responsible for all related costs and understand you will be notified as soon as reasonably possible.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">5. Booking & Payment Policies</h4>
                        <ul className="list-disc list-inside space-y-1">
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
                        <h4 className="font-semibold text-gray-800 mb-2">6. Session Timing</h4>
                        <p>Late arrivals will be charged full session fees. Early arrivals may warm up quietly but must wait for coach approval before using equipment or practicing skills.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">7. Parents, Guests & Siblings</h4>
                        <p>Only athletes and coaches are allowed in training areas or on equipment. Please watch from designated viewing areas and keep floors clear during active sessions.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">8. Photo & Video Release</h4>
                        <p>You grant permission for CoachWillTumbles to use photos or videos of your athlete for training, promotional materials, or social media. You agree to provide written notice to opt out.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">9. Appropriate Attire</h4>
                        <p>For safety and comfort, participants must wear suitable athletic clothing that allows free movement. Recommended attire includes fitted t-shirts or tank tops, athletic shorts, leggings, or gymnastics leotards. Avoid loose clothing, jewelry, watches, or accessories that could cause injury. Proper footwear or bare feet as directed by coach.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">10. Waiver Requirements</h4>
                        <p>Every athlete must have a signed waiver on file with both Oceanside Gymnastics and CoachWillTumbles.com. No waiver = no training.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">11. Severability</h4>
                        <p>If any part of this Agreement is found invalid or unenforceable, the remaining provisions shall remain in full force and effect.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">12. Governing Law and Venue</h4>
                        <p>This Agreement shall be governed by the laws of the State of California. Any disputes arising hereunder shall be resolved exclusively in the courts located in San Diego County, California.</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">13. Acknowledgment and Authority to Sign</h4>
                        <p>By signing below, you certify that you have read this entire Waiver & Adventure Agreement, fully understand its terms, and voluntarily agree to be bound by it. You are either the parent or legal guardian of the athlete named below, or you are at least 18 years old and signing on your own behalf. You acknowledge the risks involved and voluntarily assume those risks.</p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please scroll through the entire agreement above, then check all required boxes below to proceed.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="understandsRisks"
                        checked={form.watch("understandsRisks")}
                        onCheckedChange={(checked) => form.setValue("understandsRisks", checked as boolean)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="understandsRisks" className="text-sm font-medium text-gray-900">
                          I understand that tumbling and gymnastics carry inherent risks, and I accept full responsibility for any injuries that may occur. *
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreesToPolicies"
                        checked={form.watch("agreesToPolicies")}
                        onCheckedChange={(checked) => form.setValue("agreesToPolicies", checked as boolean)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="agreesToPolicies" className="text-sm font-medium text-gray-900">
                          I have read and agree to the payment, cancellation, and attendance policies, including that reservation fees are non-refundable within 24 hours of the session. *
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="authorizesEmergencyCare"
                        checked={form.watch("authorizesEmergencyCare")}
                        onCheckedChange={(checked) => form.setValue("authorizesEmergencyCare", checked as boolean)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="authorizesEmergencyCare" className="text-sm font-medium text-gray-900">
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
                        <Label htmlFor="allowsPhotoVideo" className="text-sm font-medium text-gray-900">
                          I give permission for CoachWillTumbles to use photos or videos of my athlete for training or promotional purposes, unless I submit a written opt-out.
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="confirmsAuthority"
                        checked={form.watch("confirmsAuthority")}
                        onCheckedChange={(checked) => form.setValue("confirmsAuthority", checked as boolean)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="confirmsAuthority" className="text-sm font-medium text-gray-900">
                          I confirm that I am the athlete's parent or legal guardian, or I am over 18 and signing for myself, and I agree to all terms in this Waiver & Adventure Agreement. *
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Digital Signature */}
            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Digital Signature
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Please sign below *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          width: 600,
                          height: 200,
                          className: 'signature-canvas bg-white rounded border'
                        }}
                        onEnd={() => saveSignature()}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearSignature}
                        size="sm"
                      >
                        Clear Signature
                      </Button>
                      {signatureData && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Signature Captured
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      By signing this waiver, you acknowledge that you have read, understood, and agree to all terms and conditions outlined in this document.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </form>
        </ScrollArea>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            
            {step < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-amber-500 hover:bg-amber-600"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={createWaiverMutation.isPending || !signatureData}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {createWaiverMutation.isPending ? "Submitting..." : "Submit Waiver"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}