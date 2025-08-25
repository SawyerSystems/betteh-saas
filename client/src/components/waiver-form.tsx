import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface WaiverFormProps {
  onWaiverSigned: (waiverData: {
    parentName: string;
    parentSignature: string;
    athleteName: string;
    dateOfBirth: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    medicalConditions: string;
    allergies: string;
    medications: string;
  }) => void;
  athleteData: {
    name: string;
    dateOfBirth: string;
    allergies: string;
  };
  parentData: {
    firstName: string;
    lastName: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
}

export function WaiverForm({ onWaiverSigned, athleteData, parentData }: WaiverFormProps) {
  const [formData, setFormData] = useState({
    parentName: `${parentData.firstName} ${parentData.lastName}`,
    parentSignature: "",
    athleteName: athleteData.name,
    dateOfBirth: athleteData.dateOfBirth,
    emergencyContactName: parentData.emergencyContactName,
    emergencyContactPhone: parentData.emergencyContactPhone,
    medicalConditions: "",
    allergies: athleteData.allergies || "",
    medications: "",
  });

  const [acknowledgments, setAcknowledgments] = useState({
    riskAcknowledgment: false,
    medicalEmergency: false,
    photographyConsent: false,
    liabilityRelease: false,
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: string[] = [];
    
    // Validate required fields
    if (!formData.parentSignature.trim()) {
      newErrors.push("Parent signature is required");
    }
    
    // Validate acknowledgments
    if (!acknowledgments.riskAcknowledgment) {
      newErrors.push("Risk acknowledgment must be checked");
    }
    if (!acknowledgments.medicalEmergency) {
      newErrors.push("Medical emergency consent must be checked");
    }
    if (!acknowledgments.liabilityRelease) {
      newErrors.push("Liability release must be checked");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    onWaiverSigned(formData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            LIABILITY WAIVER AND RELEASE FORM
          </CardTitle>
          <p className="text-center text-sm text-gray-600">
            Coach Will Tumbles Gymnastics Program
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Participant Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Participant Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="athleteName">Athlete Name</Label>
                <Input
                  id="athleteName"
                  value={formData.athleteName}
                  onChange={(e) => setFormData({ ...formData, athleteName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Emergency Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Medical Information</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="medicalConditions">Medical Conditions</Label>
                <Input
                  id="medicalConditions"
                  placeholder="List any medical conditions or write 'None'"
                  value={formData.medicalConditions}
                  onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  placeholder="List any allergies or write 'None'"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="medications">Current Medications</Label>
                <Input
                  id="medications"
                  placeholder="List any current medications or write 'None'"
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Waiver Text */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Waiver and Release</h3>
            <div className="text-sm space-y-3 text-gray-700">
              <p>
                I acknowledge that gymnastics activities involve inherent risks including but not limited to falls, collisions, 
                and contact with equipment, which may result in serious injury or death.
              </p>
              <p>
                I voluntarily assume all risks associated with participation in gymnastics activities and agree to hold harmless 
                Coach Will Tumbles, its instructors, and facility owners from any claims arising from participation.
              </p>
              <p>
                I authorize Coach Will Tumbles to secure emergency medical treatment for my child if needed and agree to be 
                responsible for any medical expenses incurred.
              </p>
              <p>
                I grant permission for my child to be photographed or videotaped for promotional and educational purposes.
              </p>
            </div>
          </div>

          {/* Acknowledgment Checkboxes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Acknowledgments</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="riskAcknowledgment"
                  checked={acknowledgments.riskAcknowledgment}
                  onCheckedChange={(checked) => 
                    setAcknowledgments({ ...acknowledgments, riskAcknowledgment: !!checked })
                  }
                />
                <Label htmlFor="riskAcknowledgment" className="text-sm">
                  I acknowledge and understand the risks involved in gymnastics activities
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="medicalEmergency"
                  checked={acknowledgments.medicalEmergency}
                  onCheckedChange={(checked) => 
                    setAcknowledgments({ ...acknowledgments, medicalEmergency: !!checked })
                  }
                />
                <Label htmlFor="medicalEmergency" className="text-sm">
                  I authorize emergency medical treatment if necessary
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="photographyConsent"
                  checked={acknowledgments.photographyConsent}
                  onCheckedChange={(checked) => 
                    setAcknowledgments({ ...acknowledgments, photographyConsent: !!checked })
                  }
                />
                <Label htmlFor="photographyConsent" className="text-sm">
                  I consent to photography/videography for promotional purposes
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="liabilityRelease"
                  checked={acknowledgments.liabilityRelease}
                  onCheckedChange={(checked) => 
                    setAcknowledgments({ ...acknowledgments, liabilityRelease: !!checked })
                  }
                />
                <Label htmlFor="liabilityRelease" className="text-sm">
                  I release Coach Will Tumbles from all liability claims
                </Label>
              </div>
            </div>
          </div>

          {/* Parent Signature */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Parent/Guardian Signature</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentName">Parent/Guardian Name</Label>
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="parentSignature">Electronic Signature</Label>
                <Input
                  id="parentSignature"
                  placeholder="Type your full name to sign"
                  value={formData.parentSignature}
                  onChange={(e) => setFormData({ ...formData, parentSignature: e.target.value })}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              By typing your name above, you acknowledge that this constitutes your electronic signature 
              and has the same legal effect as a handwritten signature.
            </p>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            size="lg"
          >
            Sign Waiver and Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}