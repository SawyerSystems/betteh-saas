import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBookingFlow } from "@/contexts/BookingFlowContext";
import { useToast } from "@/hooks/use-toast";
import { BOOKING_FLOWS, BookingFlowType } from "@/contexts/BookingFlowContext";
import { Shield, UserCheck, AlertTriangle, Plus, X, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SafetyStep() {
  const { state, updateState } = useBookingFlow();
  const { toast } = useToast();
  const [showAdditionalPerson, setShowAdditionalPerson] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const safetyContact = state.safetyContact || {
    dropoffPersonName: '',
    dropoffPersonRelationship: '',
    dropoffPersonPhone: '',
    pickupPersonName: '',
    pickupPersonRelationship: '',
    pickupPersonPhone: ''
  };

  const [willDropOff, setWillDropOff] = useState(
    state.safetyContact?.willDropOff === true ? 'yes' : 
    state.safetyContact?.willDropOff === false ? 'no' : ''
  );
  const [willPickUp, setWillPickUp] = useState(
    state.safetyContact?.willPickUp === true ? 'yes' : 
    state.safetyContact?.willPickUp === false ? 'no' : ''
  );
  const [additionalAuthorizedPerson, setAdditionalAuthorizedPerson] = useState({
    name: '',
    relationship: '',
    phone: ''
  });
  
  // Check if athlete is selected and redirect if needed
  useEffect(() => {
    // Skip check for admin flows and 'new-user' flow (which creates athlete later)
    if (state.flowType.startsWith('admin-') || state.flowType === 'new-user') {
      return;
    }
    
    // Check if athlete is selected for parent-portal and athlete-modal flows
    if (state.selectedAthletes.length === 0) {
      // Determine which step we should navigate to
      const targetStep = state.flowType === 'parent-portal' ? 'athleteSelect' : 'athleteInfoForm';
      const targetStepIndex = BOOKING_FLOWS[state.flowType as BookingFlowType].indexOf(targetStep as any);
      
      if (targetStepIndex >= 0) {
        console.log('⚠️ No athlete selected in SafetyStep! Redirecting to', targetStep);
        
        toast({
          title: "Athlete Selection Required",
          description: "Please select or create an athlete before providing safety information.",
          variant: "destructive",
        });
        
        // Update step in next render cycle to avoid state update during render
        setTimeout(() => {
          updateState({ currentStep: targetStepIndex });
        }, 0);
      }
    }
  }, [state.flowType, state.selectedAthletes, updateState, toast]);

  const handleSafetyChange = (field: string, value: string) => {
    updateState({
      safetyContact: {
        ...safetyContact,
        [field]: value
      }
    });
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Validation function to check if safety step is complete
  const validateSafetyStep = () => {
    const errors: string[] = [];
    
    // Check if both questions are answered
    if (willDropOff === '') {
      errors.push('Please answer who will be dropping off the athlete');
    }
    if (willPickUp === '') {
      errors.push('Please answer who will be picking up the athlete');
    }
    
    // If dropoff is "no", validate dropoff person fields
    if (willDropOff === 'no') {
      if (!safetyContact.dropoffPersonName.trim()) {
        errors.push('Please provide the name of the person dropping off the athlete');
      }
      if (!safetyContact.dropoffPersonRelationship.trim()) {
        errors.push('Please provide the relationship of the dropoff person to the athlete');
      }
      if (!safetyContact.dropoffPersonPhone.trim()) {
        errors.push('Please provide the phone number of the dropoff person');
      }
    }
    
    // If pickup is "no", validate pickup person fields
    if (willPickUp === 'no') {
      if (!safetyContact.pickupPersonName.trim()) {
        errors.push('Please provide the name of the person picking up the athlete');
      }
      if (!safetyContact.pickupPersonRelationship.trim()) {
        errors.push('Please provide the relationship of the pickup person to the athlete');
      }
      if (!safetyContact.pickupPersonPhone.trim()) {
        errors.push('Please provide the phone number of the pickup person');
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Check if step is complete for display purposes
  const isStepComplete = () => {
    // Both questions must be answered
    if (willDropOff === '' || willPickUp === '') return false;
    
    // If both are "yes", step is complete
    if (willDropOff === 'yes' && willPickUp === 'yes') return true;
    
    // Check required fields for "no" answers
    if (willDropOff === 'no') {
      if (!safetyContact.dropoffPersonName.trim() || 
          !safetyContact.dropoffPersonRelationship.trim() || 
          !safetyContact.dropoffPersonPhone.trim()) {
        return false;
      }
    }
    
    if (willPickUp === 'no') {
      if (!safetyContact.pickupPersonName.trim() || 
          !safetyContact.pickupPersonRelationship.trim() || 
          !safetyContact.pickupPersonPhone.trim()) {
        return false;
      }
    }
    
    return true;
  };

  // Update the state when the safety questions change
  const handleDropoffChange = (value: string) => {
    setWillDropOff(value);
    const isParentDropoff = value === 'yes';
    updateState({
      safetyContact: {
        ...safetyContact,
        willDropOff: isParentDropoff,
        // If parent is doing dropoff, set their info, otherwise clear it
        dropoffPersonName: isParentDropoff ? `${state.parentInfo?.firstName || ''} ${state.parentInfo?.lastName || ''}`.trim() : '',
        dropoffPersonRelationship: isParentDropoff ? 'Parent' : '',
        dropoffPersonPhone: isParentDropoff ? (state.parentInfo?.phone ?? '') : '',
      }
    });
  };

  const handlePickupChange = (value: string) => {
    setWillPickUp(value);
    const isParentPickup = value === 'yes';
    updateState({
      safetyContact: {
        ...safetyContact,
        willPickUp: isParentPickup,
        // If parent is doing pickup, set their info, otherwise clear it
        pickupPersonName: isParentPickup ? `${state.parentInfo?.firstName || ''} ${state.parentInfo?.lastName || ''}`.trim() : '',
        pickupPersonRelationship: isParentPickup ? 'Parent' : '',
        pickupPersonPhone: isParentPickup ? (state.parentInfo?.phone ?? '') : '',
      }
    });
  };

  const parentWillDropOff = willDropOff === 'yes';
  const parentWillPickUp = willPickUp === 'yes';
  const needsDropoffForm = willDropOff === 'no';
  const needsPickupForm = willPickUp === 'no';
  const needsAnyForm = needsDropoffForm || needsPickupForm;

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Safety & Authorization</h2>
        <p className="text-muted-foreground">
          Help us ensure your athlete's safety by providing pickup and dropoff information.
        </p>
        {isStepComplete() && (
          <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">All safety information completed</span>
          </div>
        )}
      </div>

      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium text-red-800">Please complete the following required information:</p>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-[#0F0276]/30 bg-[rgba(0,0,102,0.1)] dark:bg-[rgba(0,0,102,0.1)] dark:border-[rgba(0,0,102,0.3)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500 dark:text-red-400">
            <Shield className="h-5 w-5" />
            Important Safety Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500 dark:text-red-400 space-y-2">
            <p>
              <strong>Safety is our top priority.</strong> We need to know who is authorized 
              to drop off and pick up your athlete.
            </p>
            <p>
              Only the people you authorize here will be allowed to pick up your athlete. 
              If someone else needs to pick them up, please contact us in advance.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Pickup & Dropoff Authorization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Will you be dropping off the athlete?
              </Label>
              <RadioGroup
                value={willDropOff}
                onValueChange={handleDropoffChange}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="dropoff-yes" />
                  <Label htmlFor="dropoff-yes">Yes, I will drop off</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="dropoff-no" />
                  <Label htmlFor="dropoff-no">No, someone else will drop off</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Will you be picking up the athlete?
              </Label>
              <RadioGroup
                value={willPickUp}
                onValueChange={handlePickupChange}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="pickup-yes" />
                  <Label htmlFor="pickup-yes">Yes, I will pick up</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="pickup-no" />
                  <Label htmlFor="pickup-no">No, someone else will pick up</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {needsDropoffForm && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">1</span>
                  Dropoff Person Information
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dropoffPersonName" className="text-sm font-medium">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dropoffPersonName"
                        value={safetyContact.dropoffPersonName}
                        onChange={(e) => handleSafetyChange('dropoffPersonName', e.target.value)}
                        placeholder="Person dropping off athlete"
                        required
                        className={`min-h-[48px] ${!safetyContact.dropoffPersonName.trim() && needsDropoffForm ? 'border-red-300 focus:border-red-500' : ''}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dropoffPersonRelationship" className="text-sm font-medium">
                        Relationship to Athlete <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dropoffPersonRelationship"
                        value={safetyContact.dropoffPersonRelationship}
                        onChange={(e) => handleSafetyChange('dropoffPersonRelationship', e.target.value)}
                        placeholder="e.g., Parent, Guardian, Grandparent"
                        required
                        className={`min-h-[48px] ${!safetyContact.dropoffPersonRelationship.trim() && needsDropoffForm ? 'border-red-300 focus:border-red-500' : ''}`}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dropoffPersonPhone" className="text-sm font-medium">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dropoffPersonPhone"
                      type="tel"
                      value={safetyContact.dropoffPersonPhone}
                      onChange={(e) => handleSafetyChange('dropoffPersonPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                      className={`min-h-[48px] ${!safetyContact.dropoffPersonPhone.trim() && needsDropoffForm ? 'border-red-300 focus:border-red-500' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {needsPickupForm && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">2</span>
                  Pickup Person Information
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickupPersonName" className="text-sm font-medium">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pickupPersonName"
                        value={safetyContact.pickupPersonName}
                        onChange={(e) => handleSafetyChange('pickupPersonName', e.target.value)}
                        placeholder="Person picking up athlete"
                        required
                        className={`min-h-[48px] ${!safetyContact.pickupPersonName.trim() && needsPickupForm ? 'border-red-300 focus:border-red-500' : ''}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickupPersonRelationship" className="text-sm font-medium">
                        Relationship to Athlete <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pickupPersonRelationship"
                        value={safetyContact.pickupPersonRelationship}
                        onChange={(e) => handleSafetyChange('pickupPersonRelationship', e.target.value)}
                        placeholder="e.g., Parent, Guardian, Grandparent"
                        required
                        className={`min-h-[48px] ${!safetyContact.pickupPersonRelationship.trim() && needsPickupForm ? 'border-red-300 focus:border-red-500' : ''}`}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pickupPersonPhone" className="text-sm font-medium">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pickupPersonPhone"
                      type="tel"
                      value={safetyContact.pickupPersonPhone}
                      onChange={(e) => handleSafetyChange('pickupPersonPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                      className={`min-h-[48px] ${!safetyContact.pickupPersonPhone.trim() && needsPickupForm ? 'border-red-300 focus:border-red-500' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {parentWillDropOff && parentWillPickUp && willDropOff && willPickUp && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Great!</strong> You'll be handling both dropoff and pickup yourself. 
                We'll use your information for both procedures.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Authorized Person (Optional) */}
      {(willDropOff && willPickUp) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Additional Authorized Person (Optional)
            </CardTitle>
            <CardDescription>
              Add another person who can pick up your athlete if needed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showAdditionalPerson ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdditionalPerson(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Additional Authorized Person
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Additional Authorized Person</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdditionalPerson(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="additionalPersonName">Full Name</Label>
                    <Input
                      id="additionalPersonName"
                      value={additionalAuthorizedPerson.name}
                      onChange={(e) => setAdditionalAuthorizedPerson(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Additional authorized person"
                      className="min-h-[48px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additionalPersonRelationship">Relationship to Athlete</Label>
                    <Input
                      id="additionalPersonRelationship"
                      value={additionalAuthorizedPerson.relationship}
                      onChange={(e) => setAdditionalAuthorizedPerson(prev => ({ ...prev, relationship: e.target.value }))}
                      placeholder="e.g., Family Friend, Babysitter"
                      className="min-h-[48px]"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="additionalPersonPhone">Phone Number</Label>
                  <Input
                    id="additionalPersonPhone"
                    type="tel"
                    value={additionalAuthorizedPerson.phone}
                    onChange={(e) => setAdditionalAuthorizedPerson(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="min-h-[48px]"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-[#0F0276]/30 bg-[rgba(0,0,102,0.1)] dark:bg-[rgba(0,0,102,0.1)] dark:border-[rgba(0,0,102,0.3)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-400 dark:text-yellow-400">
            <AlertTriangle className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-yellow-400 dark:text-yellow-400 space-y-2">
            <li>• All authorized people must be able to show photo ID if requested</li>
            <li>• If plans change, please contact us as soon as possible</li>
            <li>• For emergency situations, we'll contact you using the information provided</li>
            <li>• Athletes will not be released to unauthorized individuals under any circumstances</li>
          </ul>
        </CardContent>
      </Card>


    </div>
  );
}