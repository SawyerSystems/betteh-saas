import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBookingFlow } from "@/contexts/BookingFlowContext";
import { useToast } from "@/hooks/use-toast";
import { BOOKING_FLOWS, BookingFlowType } from "@/contexts/BookingFlowContext";
import { GYMNASTICS_EVENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AlertCircle, ChevronLeft, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLessonTypes } from "@/hooks/useLessonTypes";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function FocusAreasStep() {
  const { state, updateState } = useBookingFlow();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'apparatus' | 'focus-areas'>('apparatus');
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [selectedApparatusName, setSelectedApparatusName] = useState<string>('');
  const [customFocusArea, setCustomFocusArea] = useState<string>(state.focusAreaOther || '');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  
  const selectedAreas = state.focusAreas || [];
  const lessonType = state.lessonType;
  
  const { data: lessonTypes, byKey, formatDuration, maxFocusAreasFor } = useLessonTypes();
  const selectedLt = byKey(lessonType);
  const maxFocusAreas = maxFocusAreasFor(selectedLt);
  const lessonDuration = formatDuration(selectedLt?.duration) || '30 minutes';

  // Available apparatus options including Side Quests
  const apparatusOptions = [
    { name: 'Tumbling', skills: GYMNASTICS_EVENTS.tumbling?.skills || [] },
    { name: 'Beam', skills: GYMNASTICS_EVENTS.beam?.skills || [] },
    { name: 'Bars', skills: GYMNASTICS_EVENTS.bars?.skills || [] },
    { name: 'Vault', skills: GYMNASTICS_EVENTS.vault?.skills || [] },
    { 
      name: 'Side Quests', 
      skills: GYMNASTICS_EVENTS["side-quests"]?.skills || []
    }
  ];

  // Load parent apparatus availability and apparatus list for id->name mapping
  const { data: siteContent } = useQuery<any>({
    queryKey: ['/api/site-content'],
    queryFn: async () => (await apiRequest('GET', '/api/site-content')).json(),
    staleTime: 60_000,
  });
  const { data: apparatusList } = useQuery<any>({
    queryKey: ['/api/apparatus'],
    queryFn: async () => (await apiRequest('GET', '/api/apparatus')).json(),
    staleTime: 60_000,
  });
  const parentAllowedIds: number[] | null = siteContent?.about?.apparatusAvailability?.parent ?? null;
  const allowedEventNames = useMemo(() => {
    const allNames = apparatusOptions.map(a => a.name);
    if (!Array.isArray(parentAllowedIds) || parentAllowedIds.length === 0) return allNames;
    if (!Array.isArray(apparatusList)) return allNames;
    const idToName = new Map<number, string>(apparatusList.map((a: any) => [a.id, a.name]));
    const names = parentAllowedIds.map((id: number) => idToName.get(id)).filter(Boolean) as string[];
    // Always include Side Quests since it's not a DB apparatus
    return Array.from(new Set([...names, 'Side Quests']));
  }, [parentAllowedIds, apparatusList, apparatusOptions]);

  // Effect to handle lesson type changes
  useEffect(() => {
    // Auto-trim focus areas if lesson type changed and current selection exceeds limit
    if (selectedAreas.length > maxFocusAreas) {
  const trimmedAreas = selectedAreas.slice(0, maxFocusAreas);
      updateState({ focusAreas: trimmedAreas });
      setWarningMessage(`Focus areas automatically reduced to ${maxFocusAreas} due to lesson type change.`);
      setTimeout(() => setWarningMessage(''), 5000);
    }
  }, [lessonType, maxFocusAreas]);
  
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
        console.log('⚠️ No athlete selected in FocusAreasStep! Redirecting to', targetStep);
        
        toast({
          title: "Athlete Selection Required",
          description: "Please select or create an athlete before continuing.",
          variant: "destructive",
        });
        
        // Update step in next render cycle to avoid state update during render
        setTimeout(() => {
          updateState({ currentStep: targetStepIndex });
        }, 0);
      }
    }
  }, [state.flowType, state.selectedAthletes, updateState, toast]);

  // Select an apparatus to view its focus areas
  const selectApparatus = (apparatusName: string) => {
    setSelectedApparatusName(apparatusName);
    setCurrentStep('focus-areas');
    setWarningMessage('');
  };

  const backToApparatus = () => {
    setCurrentStep('apparatus');
    setWarningMessage('');
  };

  const toggleSkill = (skill: string) => {
    const skillKey = `${selectedApparatusName}: ${skill}`;
    const currentAreas = [...selectedAreas];
    
    if (currentAreas.includes(skillKey)) {
      // Remove skill
      const updatedAreas = currentAreas.filter(a => a !== skillKey);
      updateState({ focusAreas: updatedAreas });
      setWarningMessage('');
    } else {
      // Add skill with limit check
      if (currentAreas.length >= maxFocusAreas) {
        const limitMessage = lessonDuration.includes('30') 
          ? "Limit reached: You can only choose up to 2 focus areas for 30-minute lessons."
          : "Limit reached: You can only select up to 4 focus areas for a 1-hour session.";
        setWarningMessage(limitMessage);
        return;
      }
      
      const updatedAreas = [...currentAreas, skillKey];
      updateState({ focusAreas: updatedAreas });
      setWarningMessage('');
    }
  };

  const toggleCustomFocusArea = () => {
    setShowCustomInput(!showCustomInput);
    
    // If hiding custom input, clear any custom focus area
    if (showCustomInput) {
      setCustomFocusArea('');
      updateState({ focusAreaOther: '' });
      
      // Remove any "Other" focus areas from the selected list
      const filteredAreas = selectedAreas.filter(area => !area.startsWith('Other:'));
      updateState({ focusAreas: filteredAreas });
    }
  };

  const addCustomFocusArea = () => {
    if (!customFocusArea.trim()) return;
    
    // Check if we've reached the limit
    if (selectedAreas.length >= maxFocusAreas) {
      const limitMessage = lessonDuration.includes('30') 
        ? "Limit reached: You can only choose up to 2 focus areas for 30-minute lessons."
        : "Limit reached: You can only select up to 4 focus areas for a 1-hour session.";
      setWarningMessage(limitMessage);
      return;
    }
    
    // Add custom focus area with "Other:" prefix
    const customKey = `Other: ${customFocusArea.trim()}`;
    
    // Don't add duplicates
    if (!selectedAreas.includes(customKey)) {
      const updatedAreas = [...selectedAreas, customKey];
      updateState({ 
        focusAreas: updatedAreas,
        focusAreaOther: customFocusArea.trim()
      });
    }
    
    // Clear the input but keep the custom area section open
    setCustomFocusArea('');
  };

  // Apparatus Selection Step
  if (currentStep === 'apparatus') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Choose Apparatus</h2>
          <p className="text-muted-foreground">
            Select which apparatus you'd like to focus on during your {lessonDuration} lesson.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apparatusOptions
            .filter(ap => allowedEventNames.includes(ap.name))
            .map((apparatus) => (
            <Card 
              key={apparatus.name}
              className="cursor-pointer transition-all border-2 border-gray-200 hover:border-gray-300"
              onClick={() => selectApparatus(apparatus.name)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{apparatus.name}</CardTitle>
                <CardDescription>
                  {apparatus.skills.length} skills available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {apparatus.skills.slice(0, 3).join(', ')}
                  {apparatus.skills.length > 3 && '...'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Warning Message */}
        {warningMessage && (
          <Alert className="border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {warningMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Show selected skills summary */}
        {selectedAreas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected Focus Areas ({selectedAreas.length}/{maxFocusAreas})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedAreas.map((area) => (
                  <Badge key={area} variant="secondary" className="text-xs">
                    {area}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        const updatedAreas = selectedAreas.filter(a => a !== area);
                        updateState({ focusAreas: updatedAreas });
                        
                        // If removing custom area, also clear the custom input
                        if (area.startsWith('Other:')) {
                          updateState({ focusAreaOther: '' });
                        }
                      }}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Focus Areas Selection Step
  const selectedApparatusData = apparatusOptions.find(a => a.name === selectedApparatusName);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{selectedApparatusName} Skills</h2>
        <p className="text-muted-foreground">
          Select up to {maxFocusAreas} skills to focus on ({selectedAreas.length}/{maxFocusAreas} selected)
        </p>
      </div>

      <Button
        variant="outline"
        onClick={backToApparatus}
        className="mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Apparatus Selection
      </Button>

      {/* Skills Selection Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available {selectedApparatusName} Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {selectedApparatusData?.skills.map((skill) => {
              const skillKey = `${selectedApparatusName}: ${skill}`;
              const isSelected = selectedAreas.includes(skillKey);
              const isDisabled = !isSelected && selectedAreas.length >= maxFocusAreas;
              
              return (
                <Button
                  key={skill}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => toggleSkill(skill)}
                  disabled={isDisabled}
                  className={cn(
                    "h-auto p-3 text-sm text-left justify-start",
                    isSelected && "bg-orange-500 hover:bg-orange-600",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {skill}
                </Button>
              );
            })}
          </div>
          
          {/* Custom Focus Area Input */}
          <div className="mt-6">
            <Button 
              variant="outline" 
              onClick={toggleCustomFocusArea}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {showCustomInput ? "Hide Custom Skill" : "Add Custom Skill"}
            </Button>
            
            {showCustomInput && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="custom-focus">Custom {selectedApparatusName} Skill</Label>
                    <Input
                      id="custom-focus"
                      value={customFocusArea}
                      onChange={(e) => setCustomFocusArea(e.target.value)}
                      placeholder={`Enter custom ${selectedApparatusName.toLowerCase()} skill`}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={addCustomFocusArea}
                    className="self-end"
                    disabled={!customFocusArea.trim() || selectedAreas.length >= maxFocusAreas}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Custom skills help Coach Will prepare for your specific needs
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Warning Message */}
      {warningMessage && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {warningMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Show selected skills summary */}
      {selectedAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected Focus Areas ({selectedAreas.length}/{maxFocusAreas})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedAreas.map((area) => (
                <Badge key={area} variant="secondary" className="text-xs">
                  {area}
                  <button
                    onClick={() => {
                      const updatedAreas = selectedAreas.filter(a => a !== area);
                      updateState({ focusAreas: updatedAreas });
                      
                      // If removing custom area, also clear the custom input
                      if (area.startsWith('Other:')) {
                        updateState({ focusAreaOther: '' });
                      }
                    }}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export validation function for use by parent components
export const validateFocusAreas = (focusAreas: string[], lessonType: string) => {
  // Fallback logic without importing static LESSON_TYPES:
  // 60-minute sessions allow up to 4 focus areas, 30-minute allow 2.
  const hourKeys = new Set(["deep-dive", "partner-progression"]);
  const isHour = hourKeys.has(lessonType) || /60/.test(lessonType);
  const maxFocusAreas = isHour ? 4 : 2;
  const lessonDuration = isHour ? '60 minutes' : '30 minutes';

  if (focusAreas.length === 0) {
    return { isValid: false, message: 'Please select at least one focus area before continuing.' };
  }
  
  if (focusAreas.length > maxFocusAreas) {
    const limitMessage = lessonDuration.includes('30') 
      ? "Limit reached: You can only choose up to 2 focus areas for 30-minute lessons."
      : "Limit reached: You can only select up to 4 focus areas for a 1-hour session.";
    return { isValid: false, message: limitMessage };
  }
  
  return { isValid: true };
};
