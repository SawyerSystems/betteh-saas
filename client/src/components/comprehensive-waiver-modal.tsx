import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import SignatureCanvas from "react-signature-canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ParentFormInput } from "@/components/parent-ui/ParentFormComponents";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { FileCheck, AlertTriangle, Scroll, PenTool } from "lucide-react";

const WAIVER_CONTENT = `
**CoachWillTumbles.com**
**Waiver & Adventure Agreement**

---

Welcome to the journey! Every hero needs a guide, and every quest begins with a few ground rules. Before your athlete joins the adventure, please read this carefully. Signing below means you're all in — ready, aware, and on board with everything below.

---

**1. What's a Session?**
Whether we call it a session or a lesson, it means the same thing — a scheduled block of training with Coach Will.

---

**2. Risks of the Journey**
Tumbling, gymnastics, and athletic training are physical adventures — and every adventure carries risks, including but not limited to:
- Scrapes, bruises, strains, sprains
- Joint dislocations, muscle pulls, broken bones
- Head, neck, and spinal injuries
- Accidental contact with equipment or others

You acknowledge these risks cannot be eliminated and voluntarily assume all risks associated with participation.

---

**3. Release of Liability and Indemnification**
In consideration of participation, you, on behalf of yourself, your athlete, and your heirs, release and hold harmless Coach Will Sawyer, affiliated coaches and staff, Oceanside Gymnastics, and any partnered facilities (collectively, the "Providers") from any and all claims, demands, or causes of action arising out of ordinary negligence. This release does not apply to gross negligence, willful misconduct, or intentional acts.

You agree to indemnify and defend the Providers against any claims, damages, or expenses arising from your athlete's participation.

---

**4. Emergency Medical Care Authorization**
In case of injury, you authorize Coach Will and affiliated staff to administer first aid and/or seek emergency medical treatment, including transportation to a medical facility. You agree to be financially responsible for all related costs and understand you will be notified as soon as reasonably possible.

---

**5. Booking & Payment Policies**
- A reservation fee is required to secure your session.
- If payment fails, you have 12 hours to complete it before your spot is forfeited.
- Remaining balance is due at session start.
- Accepted payments: Cash, Zelle, Venmo, CashApp (no cards or checks).
- Semi-private sessions include no more than two athletes per session.
- Reservation fees are non-refundable if canceled within 24 hours of the session.
- No-shows without notifying Coach Will forfeit reservation fees.
- Cancellations must be made via text, email, or the CoachWillTumbles.com Parent Portal.
- Do not call the gym to cancel — always contact Coach Will directly.

---

**6. Session Timing**
Late arrivals will be charged full session fees. Early arrivals may warm up quietly but must wait for coach approval before using equipment or practicing skills.

---

**7. Parents, Guests & Siblings**
Only athletes and coaches are allowed in training areas or on equipment. Please watch from designated viewing areas and keep floors clear during active sessions.

---

**8. Photo & Video Release**
You grant permission for CoachWillTumbles to use photos or videos of your athlete for training, promotional materials, or social media. You agree to provide written notice to opt out.

---

**9. Appropriate Attire**
For the safety and comfort of all athletes, participants must wear suitable athletic clothing that allows free movement and does not restrict performance. Recommended attire includes fitted t-shirts or tank tops, athletic shorts, leggings, or gymnastics leotards. Please avoid loose or baggy clothing, jewelry, watches, or any accessories that could cause injury or interfere with training. Proper footwear or bare feet are required as directed by the coach. Failure to wear appropriate attire may result in exclusion from training.

---

**10. Waiver Requirements**
Every athlete must have a signed waiver on file with both Oceanside Gymnastics and CoachWillTumbles.com. No waiver = no training.

---

**11. Severability**
If any part of this Agreement is found invalid or unenforceable, the remaining provisions shall remain in full force and effect.

---

**12. Governing Law and Venue**
This Agreement shall be governed by the laws of the State of California. Any disputes arising hereunder shall be resolved exclusively in the courts located in San Diego County, California.

---

**13. Acknowledgment and Authority to Sign**
By signing below, you certify that:
- You have read this entire Waiver & Adventure Agreement, fully understand its terms, and voluntarily agree to be bound by it.
- You are either the parent or legal guardian of the athlete named below, or you are at least 18 years old and signing on your own behalf.
- You acknowledge the risks involved and voluntarily assume those risks.
`;

const waiverFormSchema = z.object({
  athleteName: z.string().min(1, "Athlete name is required"),
  signerName: z.string().min(1, "Signer name is required"),
  relationshipToAthlete: z.string().min(1, "Relationship is required"),
  emergencyContactNumber: z.string().min(10, "Valid emergency contact number is required"),
  understandsRisks: z.boolean().refine(val => val, "You must acknowledge the risks"),
  agreesToPolicies: z.boolean().refine(val => val, "You must agree to the policies"),
  authorizesEmergencyCare: z.boolean().refine(val => val, "You must authorize emergency care"),
  allowsPhotoVideo: z.boolean(),
  confirmsAuthority: z.boolean().refine(val => val, "You must confirm your authority to sign"),
});

type WaiverFormData = z.infer<typeof waiverFormSchema>;

interface ComprehensiveWaiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWaiverSigned: (waiverData: any) => void;
  bookingData?: {
    athleteName?: string;
    parentName?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };
}

export function ComprehensiveWaiverModal({
  isOpen,
  onClose,
  onWaiverSigned,
  bookingData
}: ComprehensiveWaiverModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [signatureData, setSignatureData] = useState<string>("");
  const signatureRef = useRef<SignatureCanvas>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const form = useForm<WaiverFormData>({
    resolver: zodResolver(waiverFormSchema),
    defaultValues: {
      athleteName: bookingData?.athleteName || "",
      signerName: bookingData?.parentName || "",
      relationshipToAthlete: "Parent/Guardian",
      emergencyContactNumber: bookingData?.emergencyContactPhone || "",
      understandsRisks: false,
      agreesToPolicies: false,
      authorizesEmergencyCare: false,
      allowsPhotoVideo: true,
      confirmsAuthority: false,
    },
  });

  const submitWaiverMutation = useMutation({
    mutationFn: async (waiverData: any) => {
      const response = await apiRequest("POST", "/api/waivers", waiverData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Waiver Signed Successfully!",
        description: "A copy has been emailed to you and stored in your athlete's profile.",
      });
      onWaiverSigned(data);
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process waiver. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const checkScroll = () => {
      if (scrollAreaRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setHasScrolledToBottom(isAtBottom);
      }
    };

    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener('scroll', checkScroll);
      return () => scrollArea.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const handleSignatureSave = () => {
    if (signatureRef.current) {
      const signature = signatureRef.current.toDataURL();
      setSignatureData(signature);
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignatureData("");
    }
  };

  const onSubmit = (data: WaiverFormData) => {
    if (!hasScrolledToBottom) {
      toast({
        title: "Please Read Complete Waiver",
        description: "You must scroll through the entire waiver before signing.",
        variant: "destructive",
      });
      return;
    }

    if (!signatureData) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature before submitting.",
        variant: "destructive",
      });
      return;
    }

    const waiverSubmission = {
      ...data,
      signature: signatureData,
      signedAt: new Date(), // Capture actual local signing time
      ipAddress: "placeholder", // Will be captured on server
      userAgent: navigator.userAgent,
    };

    submitWaiverMutation.mutate(waiverSubmission);
  };

  const isSignEnabled = hasScrolledToBottom && 
    form.watch("understandsRisks") && 
    form.watch("agreesToPolicies") && 
    form.watch("authorizesEmergencyCare") && 
    form.watch("confirmsAuthority") &&
    signatureData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scroll className="h-5 w-5" />
            Waiver & Adventure Agreement
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Waiver Content */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Please Read Carefully</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 pr-4" ref={scrollAreaRef}>
                  <div className="whitespace-pre-line text-sm leading-relaxed">
                    {WAIVER_CONTENT}
                  </div>
                </ScrollArea>
                {!hasScrolledToBottom && (
                  <div className="mt-2 text-amber-600 text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Please scroll to the bottom to continue
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form Section */}
          <div className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Required Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Required Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="athleteName">Athlete Name</Label>
                    <ParentFormInput
                      id="athleteName"
                      {...form.register("athleteName")}
                      placeholder="Full name of athlete"
                    />
                    {form.formState.errors.athleteName && (
                      <p className="text-red-600 text-sm mt-1">
                        {form.formState.errors.athleteName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="signerName">Name of Signer</Label>
                    <ParentFormInput
                      id="signerName"
                      {...form.register("signerName")}
                      placeholder="Your full name"
                    />
                    {form.formState.errors.signerName && (
                      <p className="text-red-600 text-sm mt-1">
                        {form.formState.errors.signerName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="relationshipToAthlete">Relationship to Athlete</Label>
                    <ParentFormInput
                      id="relationshipToAthlete"
                      {...form.register("relationshipToAthlete")}
                      placeholder="e.g., Parent/Guardian"
                    />
                    {form.formState.errors.relationshipToAthlete && (
                      <p className="text-red-600 text-sm mt-1">
                        {form.formState.errors.relationshipToAthlete.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="emergencyContactNumber">Emergency Contact Number</Label>
                    <ParentFormInput
                      id="emergencyContactNumber"
                      {...form.register("emergencyContactNumber")}
                      placeholder="Phone number for emergencies"
                    />
                    {form.formState.errors.emergencyContactNumber && (
                      <p className="text-red-600 text-sm mt-1">
                        {form.formState.errors.emergencyContactNumber.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Required Checkboxes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Required Agreements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="understandsRisks"
                      checked={form.watch("understandsRisks")}
                      onCheckedChange={(checked) => 
                        form.setValue("understandsRisks", checked as boolean)
                      }
                    />
                    <Label htmlFor="understandsRisks" className="text-sm leading-5">
                      I understand that tumbling and gymnastics carry inherent risks, and I accept full responsibility for any injuries that may occur.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreesToPolicies"
                      checked={form.watch("agreesToPolicies")}
                      onCheckedChange={(checked) => 
                        form.setValue("agreesToPolicies", checked as boolean)
                      }
                    />
                    <Label htmlFor="agreesToPolicies" className="text-sm leading-5">
                      I have read and agree to the payment, cancellation, and attendance policies, including that reservation fees are non-refundable within 24 hours of the session.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="authorizesEmergencyCare"
                      checked={form.watch("authorizesEmergencyCare")}
                      onCheckedChange={(checked) => 
                        form.setValue("authorizesEmergencyCare", checked as boolean)
                      }
                    />
                    <Label htmlFor="authorizesEmergencyCare" className="text-sm leading-5">
                      I authorize Coach Will and affiliated staff to provide or seek emergency medical care for my athlete if needed.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="allowsPhotoVideo"
                      checked={form.watch("allowsPhotoVideo")}
                      onCheckedChange={(checked) => 
                        form.setValue("allowsPhotoVideo", checked as boolean)
                      }
                    />
                    <Label htmlFor="allowsPhotoVideo" className="text-sm leading-5">
                      I give permission for CoachWillTumbles to use photos or videos of my athlete for training or promotional purposes, unless I submit a written opt-out.
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="confirmsAuthority"
                      checked={form.watch("confirmsAuthority")}
                      onCheckedChange={(checked) => 
                        form.setValue("confirmsAuthority", checked as boolean)
                      }
                    />
                    <Label htmlFor="confirmsAuthority" className="text-sm leading-5">
                      I confirm that I am the athlete's parent or legal guardian, or I am over 18 and signing for myself, and I agree to all terms in this Waiver & Adventure Agreement.
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Signature Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PenTool className="h-5 w-5" />
                    Electronic Signature
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        width: 400,
                        height: 120,
                        className: "signature-canvas w-full",
                      }}
                      onEnd={handleSignatureSave}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearSignature}
                      size="sm"
                    >
                      Clear Signature
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Date: {new Date().toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={!isSignEnabled || submitWaiverMutation.isPending}
                size="lg"
              >
                {submitWaiverMutation.isPending ? (
                  "Processing Waiver..."
                ) : (
                  <>
                    <FileCheck className="h-5 w-5 mr-2" />
                    Sign Waiver & Continue
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}