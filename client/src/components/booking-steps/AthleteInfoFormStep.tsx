import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBookingFlow } from "@/contexts/BookingFlowContext";
import { useGenders } from "@/hooks/useGenders";
import { useCreateAthlete } from "@/hooks/use-athlete";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, PlusCircle, Trash2, Shield } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BOOKING_FLOWS } from "@/contexts/BookingFlowContext";
import { AthleteWaiver } from "@/components/AthleteWaiver";

export function AthleteInfoFormStep() {
  const { state, updateState, prevStep } = useBookingFlow();
  const { genderOptions } = useGenders();
  const [ageErrors, setAgeErrors] = useState<{ [key: number]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWaiverFor, setShowWaiverFor] = useState<number | null>(null);
  const [athleteWaivers, setAthleteWaivers] = useState<{ [key: number]: any }>({});
  
  // Use admin context for admin flows, parent context otherwise
  const isAdminFlow = state.flowType.includes('admin');
  const createAthleteMutation = useCreateAthlete(isAdminFlow ? 'admin' : 'parent');
  const { toast } = useToast();

  // Get parent ID for the query invalidation
  const { data: parentData } = useQuery({
    queryKey: ['/api/parent-auth/status'],
  }) as { data: any };

  const parentId = state.parentId || parentData?.parentId;

  // Function to calculate age and validate minimum age requirement
  const validateAge = (dateOfBirth: string, index: number) => {
    if (!dateOfBirth) {
      const errors = { ...ageErrors };
      delete errors[index];
      setAgeErrors(errors);
      return;
    }

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 6) {
      setAgeErrors(prev => ({
        ...prev,
        [index]: `Athletes must be at least 6 years old. Current age: ${age} years.`
      }));
    } else {
      const errors = { ...ageErrors };
      delete errors[index];
      setAgeErrors(errors);
    }
  };

  const handleAddAthlete = () => {
    const newAthlete = {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      allergies: '',
      experience: 'beginner' as const,
      gender: '',
    };
    updateState({ athleteInfo: [...state.athleteInfo, newAthlete] });
  };

  const handleRemoveAthlete = (index: number) => {
    const updated = state.athleteInfo.filter((_, i) => i !== index);
    updateState({ athleteInfo: updated });
    
    // Remove any waiver data for this athlete
    const updatedWaivers = { ...athleteWaivers };
    delete updatedWaivers[index];
    setAthleteWaivers(updatedWaivers);
  };

  const handleAthleteChange = (index: number, field: string, value: string) => {
    const updated = [...state.athleteInfo];
    updated[index] = { ...updated[index], [field]: value };
    updateState({ athleteInfo: updated });

    // Validate age when date of birth changes
    if (field === 'dateOfBirth') {
      validateAge(value, index);
    }
  };

  const handleWaiverSigned = (athleteIndex: number, waiverData: any) => {
    setAthleteWaivers(prev => ({ ...prev, [athleteIndex]: waiverData }));
    setShowWaiverFor(null);
    toast({
      title: "Waiver Signed",
      description: `Safety waiver for ${state.athleteInfo[athleteIndex].firstName} ${state.athleteInfo[athleteIndex].lastName} has been completed.`,
    });
  };

  const handleSkipWaiver = (athleteIndex: number) => {
    setShowWaiverFor(null);
    toast({
      title: "Waiver Skipped",
      description: "You can sign the waiver later in the booking process.",
      variant: "default",
    });
  };

  const getParentName = () => {
    if (state.parentInfo) {
      return `${state.parentInfo.firstName} ${state.parentInfo.lastName}`;
    }
    return parentData?.firstName && parentData?.lastName 
      ? `${parentData.firstName} ${parentData.lastName}`
      : 'Parent/Guardian';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(ageErrors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the age validation errors before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (state.athleteInfo.length === 0) {
      toast({
        title: "No Athlete Information",
        description: "Please add athlete information before continuing.",
        variant: "destructive",
      });
      return;
    }

    // For each athlete in the form, create it via API
    setIsSubmitting(true);
    
    try {
      const createdAthletes = [];
      
      for (let i = 0; i < state.athleteInfo.length; i++) {
        const athlete = state.athleteInfo[i];
        
        if (!athlete.firstName || !athlete.lastName || !athlete.dateOfBirth || !athlete.experience) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields for each athlete.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        
        // Prepare athlete data with optional waiver
        const athletePayload: any = {
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          dateOfBirth: athlete.dateOfBirth,
          gender: (athlete as any).gender || undefined,
          allergies: athlete.allergies,
          experience: athlete.experience,
        };

        // For admin flows, include parentId from booking state
        if (isAdminFlow && state.parentId) {
          athletePayload.parentId = state.parentId;
        }

        // Include waiver data if available (only for non-admin flows)
        if (athleteWaivers[i] && !isAdminFlow) {
          athletePayload.waiverData = athleteWaivers[i];
        }
        
        const createdAthlete = await createAthleteMutation.mutateAsync(athletePayload);
        createdAthletes.push(createdAthlete);
      }
      
      // Show toast to guide user that they need to select the athlete
      toast({
        title: "Athlete Created Successfully",
        description: state.flowType.includes('admin') 
          ? "Athlete has been created and will be automatically selected."
          : "Now please select the athlete from your list to continue.",
      });
      
      // For admin flows, automatically select the newly created athletes
      if (state.flowType.includes('admin') && createdAthletes.length > 0) {
        updateState({ 
          athleteInfo: [],
          selectedAthletes: createdAthletes.map(athlete => athlete.id)
        });
      } else {
        // Clear the athlete info and selected athletes after successful creation
        updateState({ 
          athleteInfo: [],
          selectedAthletes: [] // Clear selected athletes to force user to explicitly choose
        });
      }
      
      // Clear waiver data
      setAthleteWaivers({});
      
      // Handle navigation based on flow type
      if (state.flowType === 'parent-portal') {
        // Go back to athlete selection step for parent portal
        const currentFlow = BOOKING_FLOWS['parent-portal'];
        const athleteSelectIndex = currentFlow.indexOf('athleteSelect');
        updateState({ currentStep: athleteSelectIndex });
      } else if (state.flowType.includes('admin')) {
        // For admin flows, move to next step (focus areas)
        // The newly created athlete will be automatically selected by the backend
        const currentFlow = BOOKING_FLOWS[state.flowType];
        const currentIndex = state.currentStep;
        const nextIndex = Math.min(currentIndex + 1, currentFlow.length - 1);
        updateState({ currentStep: nextIndex });
      } else {
        prevStep();
      }
    } catch (error) {
      console.error("Error creating athlete:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize with one athlete if none exist
  useEffect(() => {
    if (state.athleteInfo.length === 0) {
      handleAddAthlete();
    }
  }, []); // Only run on mount

  // Ensure all athletes have the gender field (migration)
  useEffect(() => {
    const needsUpdate = state.athleteInfo.some(athlete => !athlete.hasOwnProperty('gender'));
    if (needsUpdate) {
      const updated = state.athleteInfo.map(athlete => ({
        ...athlete,
        gender: (athlete as any).gender || '',
      }));
      updateState({ athleteInfo: updated });
    }
  }, [state.athleteInfo.length]); // Run when athletes are added/removed

  const maxAthletes = state.lessonType.includes('semi-private') ? 2 : 1;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-[#0F0276] dark:text-white">Athlete Information</h3>
        <p className="text-[#0F0276]/70 dark:text-white/70">
          Tell us about your gymnast{state.lessonType.includes('semi-private') ? 's' : ''}
        </p>
      </div>

      {state.athleteInfo.map((athlete, index) => (
        <Card key={index} className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[#0F0276] dark:text-white">
                Athlete {state.athleteInfo.length > 1 ? index + 1 : ''}
              </CardTitle>
              {state.athleteInfo.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAthlete(index)}
                  className="text-[#0F0276] hover:bg-[#0F0276]/10 dark:text-white dark:hover:bg-white/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`firstName-${index}`} className="text-[#0F0276] dark:text-white font-medium">First Name</Label>
                <Input
                  id={`firstName-${index}`}
                  value={athlete.firstName}
                  onChange={(e) => handleAthleteChange(index, 'firstName', e.target.value)}
                  className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40 min-h-[48px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`lastName-${index}`}>Last Name</Label>
                <Input
                  id={`lastName-${index}`}
                  value={athlete.lastName}
                  onChange={(e) => handleAthleteChange(index, 'lastName', e.target.value)}
                  required
                  className="min-h-[48px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`gender-${index}`}>Gender</Label>
              <Select 
                value={(athlete as any).gender || ""} 
                onValueChange={(value) => handleAthleteChange(index, 'gender', value)}
              >
                <SelectTrigger className="min-h-[48px]">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((gender: string) => (
                    <SelectItem key={gender} value={gender}>
                      {gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`dob-${index}`}>Date of Birth</Label>
              <Input
                id={`dob-${index}`}
                type="date"
                value={athlete.dateOfBirth}
                onChange={(e) => handleAthleteChange(index, 'dateOfBirth', e.target.value)}
                required
                className={`min-h-[48px] ${ageErrors[index] ? 'border-red-500' : ''}`}
              />
              {ageErrors[index] && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {ageErrors[index]}
                  </AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-muted-foreground">
                Athletes must be at least 6 years old to participate in lessons.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`allergies-${index}`}>Allergies or Medical Conditions (Optional)</Label>
              <Textarea
                id={`allergies-${index}`}
                value={athlete.allergies}
                onChange={(e) => handleAthleteChange(index, 'allergies', e.target.value)}
                placeholder="Please list any allergies or medical conditions we should be aware of"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Experience Level</Label>
              <RadioGroup
                value={athlete.experience}
                onValueChange={(value) => handleAthleteChange(index, 'experience', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="beginner" id={`beginner-${index}`} />
                  <Label htmlFor={`beginner-${index}`}>Beginner (New to gymnastics)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id={`intermediate-${index}`} />
                  <Label htmlFor={`intermediate-${index}`}>Intermediate (1-2 years experience)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced" id={`advanced-${index}`} />
                  <Label htmlFor={`advanced-${index}`}>Advanced (3+ years experience)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Waiver Section - Only show for non-admin flows */}
            {!state.flowType.includes('admin') && (
              <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#0F0276] dark:text-[#D8BD2A]" />
                    <Label className="text-[#0F0276] dark:text-white font-medium">Safety Waiver</Label>
                  </div>
                  {athleteWaivers[index] && (
                    <span className="text-sm text-green-600 font-medium">✓ Signed</span>
                  )}
                </div>
                
                {!athleteWaivers[index] ? (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                      A safety waiver is required for all gymnastics activities. You can sign it now or later in the booking process.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowWaiverFor(index)}
                      className="w-full"
                      disabled={!athlete.firstName || !athlete.lastName || !athlete.dateOfBirth}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Sign Waiver Now
                    </Button>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      ✓ Safety waiver signed by {athleteWaivers[index].signature}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Waiver Modal */}
      {showWaiverFor !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <AthleteWaiver
                athleteData={state.athleteInfo[showWaiverFor]}
                parentName={getParentName()}
                onWaiverSigned={(waiverData) => handleWaiverSigned(showWaiverFor, waiverData)}
                onSkip={() => handleSkipWaiver(showWaiverFor)}
              />
            </div>
          </div>
        </div>
      )}

      {state.lessonType.includes('semi-private') && state.athleteInfo.length < maxAthletes && (
        <Button 
          type="button"
          variant="outline" 
          onClick={handleAddAthlete}
          className="w-full"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Another Athlete
        </Button>
      )}

      <div className="flex justify-end mt-6">
        <Button 
          type="submit" 
          disabled={isSubmitting || Object.keys(ageErrors).length > 0}
          className="min-h-[48px]"
        >
          {isSubmitting ? "Creating..." : "Create Athlete"}
        </Button>
      </div>
    </form>
  );
}