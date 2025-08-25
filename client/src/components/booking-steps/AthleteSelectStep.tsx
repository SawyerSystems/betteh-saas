import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BOOKING_FLOWS, useBookingFlow } from "@/contexts/BookingFlowContext";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Search, User } from "lucide-react";
import { useEffect, useState } from "react";

interface AthleteSelectStepProps {
  skipIfNotSemi?: boolean;
}

export function AthleteSelectStep({ skipIfNotSemi = false }: AthleteSelectStepProps) {
  const { state, updateState, nextStep } = useBookingFlow();
  const [showNewAthleteOption, setShowNewAthleteOption] = useState(false);
  const [search, setSearch] = useState('');
  
  // For admin flows, fetch all athletes; for parent flows, fetch parent's athletes
  const isAdminFlow = state.isAdminFlow || state.flowType.startsWith('admin-');
  
  const { data: parentData } = useQuery({
    queryKey: ['/api/parent-auth/status'],
    enabled: !isAdminFlow,
  }) as { data: any };

  const parentId = state.parentId || parentData?.parentId;

  // Fetch athletes with higher refetch frequency to ensure new athletes appear
  const { data: athletes = [], isLoading: isLoadingAthletes, refetch: refetchAthletes } = useQuery({
    queryKey: isAdminFlow ? ['/api/athletes'] : [`/api/parents/${parentId}/athletes`],
    enabled: isAdminFlow || !!parentId,
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider the data immediately stale for refetching
  }) as { data: any[], isLoading: boolean, refetch: () => Promise<any> };
  
  // Refetch athletes when this component is shown (may be returning from athlete creation)
  useEffect(() => {
    console.log('🔄 AthleteSelectStep mounted/updated - refreshing athlete list');
    if (parentId) {
      refetchAthletes();
    }
  }, [parentId, refetchAthletes]);

  // Log when new athletes are loaded
  useEffect(() => {
    console.log('👥 Athletes loaded:', { count: athletes.length, athleteIds: athletes.map((a: any) => a.id) });
    console.log('🔍 Currently selected athletes:', state.selectedAthletes);
  }, [athletes, state.selectedAthletes]);

  // Auto-skip for non-semi-private lessons
  useEffect(() => {
    if (skipIfNotSemi && !state.lessonType.includes('semi-private')) {
      nextStep();
    }
  }, [skipIfNotSemi, state.lessonType, nextStep]);

  const handleAthleteToggle = (athleteId: number) => {
    const currentSelected = state.selectedAthletes;
    const isSelected = currentSelected.includes(athleteId);
    
    if (isSelected) {
      updateState({ 
        selectedAthletes: currentSelected.filter(id => id !== athleteId) 
      });
    } else {
      // For semi-private, limit to 2 athletes
      if (state.lessonType.includes('semi-private') && currentSelected.length >= 2) {
        return;
      }
      updateState({ 
        selectedAthletes: [...currentSelected, athleteId] 
      });
    }
  };

  const handleAddNewAthlete = () => {
    console.log('👆 Add New Athlete clicked, current flow:', state.flowType);
    
    if (isAdminFlow) {
      // For admin flows, show option to create new athlete
      setShowNewAthleteOption(true);
    } else if (state.flowType === 'parent-portal') {
      // For parent portal, keep the parent-portal flow type but move to athleteInfoForm step
      const currentFlow = BOOKING_FLOWS['parent-portal'];
      const athleteInfoFormIndex = currentFlow.indexOf('athleteInfoForm');
      
      updateState({ 
        currentStep: athleteInfoFormIndex,
        athleteInfo: [] // Clear any existing athlete info
      });
      
      console.log('✅ Maintained parent-portal flow, moving to athleteInfoForm step', { athleteInfoFormIndex });
    } else {
      // For all other public flows, switch to new athlete form flow
      updateState({ flowType: 'new-user' });
      console.log('⚠️ Changed flow to new-user');
    }
  };

  const handleCreateNewAthlete = () => {
    // Switch to athlete info form step to create new athlete
    if (isAdminFlow) {
      updateState({ 
        flowType: 'admin-new-athlete',
        currentStep: 1, // Go to athlete info form step
        athleteInfo: [] // Clear any existing athlete info
      });
    }
  };

  if (skipIfNotSemi && !state.lessonType.includes('semi-private')) {
    return null;
  }

  const maxAthletes = state.lessonType.includes('semi-private') ? 2 : 1;

  // Filter athletes based on search term
  const filteredAthletes = athletes.filter((athlete: any) => {
    if (!search) return true;
    const fullName = `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim();
    const searchTerm = search.toLowerCase();
    return (
      fullName.toLowerCase().includes(searchTerm) ||
      athlete.name?.toLowerCase().includes(searchTerm) ||
      athlete.experience?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Athletes</h3>
        <p className="text-muted-foreground">
          {isAdminFlow 
            ? `Choose from existing athletes or create new ones for this ${state.lessonType} lesson`
            : state.lessonType.includes('semi-private') 
              ? `Choose up to 2 athletes for this semi-private lesson`
              : `Select the athlete for this private lesson`}
        </p>
      </div>

      {/* Admin Parent Selection */}
      {isAdminFlow && showNewAthleteOption && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Create New Athlete
            </CardTitle>
            <div className="space-y-4">
              <p className="text-sm text-blue-700">
                Create a new athlete and associated parent account for this booking.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleCreateNewAthlete} size="sm">
                  Create New Athlete
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewAthleteOption(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Search input for admin flows with multiple athletes */}
      {isAdminFlow && athletes.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search athletes by name or experience..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      <div className="space-y-3">
        {isLoadingAthletes ? (
          <Card className="p-8 text-center">
            <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="animate-spin h-8 w-8 mx-auto mb-4" />
            <p className="text-gray-500">Loading athletes...</p>
          </Card>
        ) : athletes.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {isAdminFlow ? "No athletes found" : "No athletes registered yet"}
            </p>
            <Button onClick={handleAddNewAthlete} variant="outline">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add First Athlete
            </Button>
          </Card>
        ) : filteredAthletes.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              No athletes match your search criteria
            </p>
            <Button 
              onClick={() => setSearch('')} 
              variant="outline"
              size="sm"
            >
              Clear Search
            </Button>
          </Card>
        ) : (
          filteredAthletes.map((athlete: any) => (
            <Card 
              key={athlete.id}
              className={`cursor-pointer transition-all ${
                state.selectedAthletes.includes(athlete.id)
                  ? 'ring-2 ring-orange-500 border-orange-500'
                  : 'hover:border-gray-400'
              }`}
              onClick={() => handleAthleteToggle(athlete.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id={`athlete-${athlete.id}`}
                    checked={state.selectedAthletes.includes(athlete.id)}
                    onCheckedChange={() => handleAthleteToggle(athlete.id)}
                  />
                  <Label htmlFor={`athlete-${athlete.id}`} className="cursor-pointer flex-1">
                    <CardTitle className="text-base">
                      {athlete.firstName && athlete.lastName 
                        ? `${athlete.firstName} ${athlete.lastName}`
                        : athlete.name}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                      Age: {(() => {
                        const today = new Date();
                        const [year, month, day] = athlete.dateOfBirth.split('-').map(Number);
                        let age = today.getFullYear() - year;
                        const monthDiff = today.getMonth() + 1 - month;
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
                          age--;
                        }
                        return age;
                      })()} • 
                      Experience: {athlete.experience}
                      {isAdminFlow && athlete.parentId && (
                        <span> • Parent ID: {athlete.parentId}</span>
                      )}
                    </div>
                  </Label>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {athletes.length > 0 && !showNewAthleteOption && (
        <Button 
          variant="outline" 
          onClick={handleAddNewAthlete}
          className="w-full"
          disabled={state.selectedAthletes.length >= maxAthletes}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {isAdminFlow ? "Create New Athlete" : "Add New Athlete"}
        </Button>
      )}

      {/* Display guidance message if athletes exist but none selected */}
      {athletes.length > 0 && state.selectedAthletes.length === 0 && (
        <div className="bg-gradient-to-r from-[#D8BD2A]/10 to-yellow-500/10 border border-[#D8BD2A]/30 p-4 rounded-lg backdrop-blur-sm dark:bg-[#D8BD2A] dark:border-[#D8BD2A]/30">
          <p className="text-sm text-[#0F0276] dark:text-[rgba(0,0,102,1)] font-medium">
            <strong>Please select</strong> an athlete from the list above to continue.
          </p>
        </div>
      )}

      {state.lessonType.includes('semi-private') && state.selectedAthletes.length === 1 && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-900">
            <strong>Note:</strong> You've selected 1 athlete for a semi-private lesson. 
            You can add another athlete or continue with just one (the price remains the same).
          </p>
        </div>
      )}
    </div>
  );
}