import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, FileText, Shield } from "lucide-react";
import { useState } from "react";

interface AthleteWaiverProps {
  athleteData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  parentName: string;
  onWaiverSigned: (waiverData: any) => void;
  onSkip?: () => void;
}

export function AthleteWaiver({ athleteData, parentName, onWaiverSigned, onSkip }: AthleteWaiverProps) {
  const [waiverForm, setWaiverForm] = useState({
    signature: parentName,
    relationshipToAthlete: 'Parent/Guardian',
    emergencyContactNumber: '',
    understandsRisks: false,
    agreesToPolicies: false,
    authorizesEmergencyCare: false,
    allowsPhotoVideo: true,
    confirmsAuthority: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: any) => {
    setWaiverForm(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      waiverForm.signature.trim() &&
      waiverForm.emergencyContactNumber.trim() &&
      waiverForm.understandsRisks &&
      waiverForm.agreesToPolicies &&
      waiverForm.authorizesEmergencyCare &&
      waiverForm.confirmsAuthority
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields and acknowledgments.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create the waiver data object
      const waiverData = {
        ...waiverForm,
        athleteFirstName: athleteData.firstName,
        athleteLastName: athleteData.lastName,
        athleteDateOfBirth: athleteData.dateOfBirth,
        signedAt: new Date().toISOString(),
        ipAddress: null, // Will be captured on the server
        userAgent: navigator.userAgent,
      };

      onWaiverSigned(waiverData);
      
      toast({
        title: "Waiver Signed Successfully",
        description: `Safety waiver for ${athleteData.firstName} ${athleteData.lastName} has been completed.`,
      });
    } catch (error) {
      console.error('Error signing waiver:', error);
      toast({
        title: "Error",
        description: "Failed to sign waiver. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const athleteFullName = `${athleteData.firstName} ${athleteData.lastName}`;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-12 w-12 text-[#0F0276] mx-auto mb-3 dark:text-[#D8BD2A]" />
        <h3 className="text-xl font-semibold text-[#0F0276] dark:text-[#D8BD2A]">
          Safety Waiver for {athleteFullName}
        </h3>
        <p className="text-sm text-[#0F0276]/70 dark:text-white/70 mt-2">
          Please complete the safety waiver for your athlete before proceeding.
        </p>
      </div>

      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          This waiver is required for all gymnastics activities. Please read carefully and complete all sections.
        </AlertDescription>
      </Alert>

      <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
        <CardHeader>
          <CardTitle className="text-[#0F0276] dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Waiver Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signature">Full Name (Digital Signature)</Label>
                <Input
                  id="signature"
                  value={waiverForm.signature}
                  onChange={(e) => handleInputChange('signature', e.target.value)}
                  placeholder="Enter your full legal name"
                  required
                  className="min-h-[48px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship to Athlete</Label>
                <Input
                  id="relationship"
                  value={waiverForm.relationshipToAthlete}
                  onChange={(e) => handleInputChange('relationshipToAthlete', e.target.value)}
                  placeholder="e.g., Parent, Guardian"
                  required
                  className="min-h-[48px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency">Emergency Contact Phone Number</Label>
              <Input
                id="emergency"
                type="tel"
                value={waiverForm.emergencyContactNumber}
                onChange={(e) => handleInputChange('emergencyContactNumber', e.target.value)}
                placeholder="(555) 123-4567"
                required
                className="min-h-[48px]"
              />
            </div>

            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
              <h4 className="font-semibold text-[#0F0276] dark:text-white">Required Acknowledgments</h4>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="understands-risks"
                    checked={waiverForm.understandsRisks}
                    onCheckedChange={(checked) => handleInputChange('understandsRisks', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="understands-risks" className="text-sm leading-relaxed">
                    I understand that gymnastics activities involve inherent risks of injury, and I voluntarily accept these risks for my athlete.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agrees-policies"
                    checked={waiverForm.agreesToPolicies}
                    onCheckedChange={(checked) => handleInputChange('agreesToPolicies', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="agrees-policies" className="text-sm leading-relaxed">
                    I agree to follow all gym policies and safety guidelines as instructed by Coach Will Tumbles staff.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="authorizes-care"
                    checked={waiverForm.authorizesEmergencyCare}
                    onCheckedChange={(checked) => handleInputChange('authorizesEmergencyCare', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="authorizes-care" className="text-sm leading-relaxed">
                    I authorize emergency medical care if needed and understand I am responsible for any associated costs.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="photo-video"
                    checked={waiverForm.allowsPhotoVideo}
                    onCheckedChange={(checked) => handleInputChange('allowsPhotoVideo', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="photo-video" className="text-sm leading-relaxed">
                    I consent to photos and videos being taken for promotional and instructional purposes.
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="confirms-authority"
                    checked={waiverForm.confirmsAuthority}
                    onCheckedChange={(checked) => handleInputChange('confirmsAuthority', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="confirms-authority" className="text-sm leading-relaxed font-semibold">
                    I confirm that I have the legal authority to sign this waiver on behalf of the athlete and that all information provided is accurate.
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {onSkip && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSkip}
                  className="flex-1"
                >
                  Sign Later
                </Button>
              )}
              <Button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="flex-1 min-h-[48px]"
              >
                {isSubmitting ? "Signing Waiver..." : "Sign Waiver"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
