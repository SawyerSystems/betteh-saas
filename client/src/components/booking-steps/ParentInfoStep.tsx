import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BOOKING_FLOWS, useBookingFlow } from "@/contexts/BookingFlowContext";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Contact, Edit2, User } from "lucide-react";
import { useEffect, useState } from "react";

interface ParentInfoStepProps {
  isPrefilled?: boolean;
}

// Define the shape of parent data for TypeScript safety
interface ParentData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export function ParentInfoStep({ isPrefilled = false }: ParentInfoStepProps) {
  const { state, updateState, nextStep } = useBookingFlow();
  // Initialize isEditing based on whether we have parent info or not
  const [isEditing, setIsEditing] = useState(() => {
    // If we already have parent info, don't start in editing mode
    if (state.parentInfo && Object.values(state.parentInfo).some(val => !!val)) {
      return false;
    }
    // Otherwise, start in editing mode
    return !isPrefilled;
  });
  const [isManuallyFetchingParent, setIsManuallyFetchingParent] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const isAdminFlow = state.isAdminFlow || state.flowType.startsWith('admin-');
  
  // Determine which flow we're using
  const isAdminExistingAthlete = state.flowType === 'admin-existing-athlete';
  const hasSelectedAthletes = state.selectedAthletes.length > 0;
  const isOtherAdminFlow = isAdminFlow && !isAdminExistingAthlete;
  
  // Utility function to safely set parent info from any parent data object
  const setParentInfoFromData = (parentData: ParentData | null | undefined): boolean => {
    if (!parentData || !parentData.id) return false;
    
    try {
      setIsEditing(false);
      
      // Consolidate all parent-related state in a single update to maintain consistency
      updateState({
        parentId: parentData.id,
        // Always set selectedParent to ensure it's available in the payment step
        selectedParent: parentData,
        parentInfo: {
          firstName: parentData.firstName || '',
          lastName: parentData.lastName || '',
          email: parentData.email || '',
          phone: parentData.phone || '',
          emergencyContactName: parentData.emergencyContactName || '',
          emergencyContactPhone: parentData.emergencyContactPhone || ''
        }
      });
      
      console.log("Successfully set parent info and selectedParent with ID:", parentData.id);
      return true;
    } catch (error) {
      console.error("Error setting parent info:", error);
      return false;
    }
  };
  
  // Check if we're at the parent info step in the booking flow
  const currentStepName = state.flowType ? BOOKING_FLOWS[state.flowType][state.currentStep] : '';
  const isParentStep = ['parentConfirm', 'parentInfoForm'].includes(currentStepName);
  
  // APPROACH 1: For admin-existing-athlete flow
  // Query all athletes to find the selected one
  const { data: athletes = [], isLoading: isLoadingAthletes } = useQuery({
    queryKey: ['/api/athletes'],
    enabled: isAdminExistingAthlete && hasSelectedAthletes,
  }) as { data: any[]; isLoading: boolean };
  
  // Find the selected athlete
  const selectedAthlete = hasSelectedAthletes ? 
    athletes.find((a: any) => a.id === state.selectedAthletes[0]) : 
    null;
    
  // Only fetch parent data if we have a valid parentId
  const { data: parentDataForExistingAthlete, isLoading: isLoadingParentForExistingAthlete } = useQuery({
    queryKey: ['/api/parents', selectedAthlete?.parentId],
    enabled: isAdminExistingAthlete && !!selectedAthlete?.parentId,
  }) as { data: ParentData | null; isLoading: boolean };
  
  // APPROACH 2: For other admin flows
  // For admin-from-athlete flow, fetch athlete and parent directly
  const { data: directAthleteData, isLoading: isLoadingDirectAthlete } = useQuery({
    queryKey: ['/api/athletes', state.selectedAthletes[0]],
    enabled: isOtherAdminFlow && hasSelectedAthletes,
  }) as { data: { id: number; parentId: number } | null; isLoading: boolean };

  // Fetch parent data if we have a parent ID from the athlete
  const { data: parentDataForOtherFlows, isLoading: isLoadingParentForOtherFlows } = useQuery({
    queryKey: ['/api/parents', directAthleteData?.parentId],
    enabled: isOtherAdminFlow && !!directAthleteData?.parentId,
  }) as { data: ParentData | null; isLoading: boolean };
  
  // Debug logging
  useEffect(() => {
    console.log("ParentInfoStep data status:", { 
      flowType: state.flowType,
      currentStepName,
      isAdminExistingAthlete,
      hasSelectedAthletes,
      selectedAthleteId: state.selectedAthletes[0] || 'none',
      selectedAthlete: selectedAthlete || 'No selected athlete found',
      parentId: selectedAthlete?.parentId || 'No parentId',
      parentData: parentDataForExistingAthlete || parentDataForOtherFlows || 'No parent data yet',
      isLoadingAthletes,
      isLoadingParentForExistingAthlete,
      isLoadingDirectAthlete,
      isLoadingParentForOtherFlows,
      parentInfo: state.parentInfo,
      isEditing
    });
  }, [
    state.flowType, currentStepName, isAdminExistingAthlete, hasSelectedAthletes, state.selectedAthletes,
    selectedAthlete, parentDataForExistingAthlete, parentDataForOtherFlows, isLoadingAthletes, 
    isLoadingParentForExistingAthlete, isLoadingDirectAthlete, isLoadingParentForOtherFlows,
    state.parentInfo, isEditing
  ]);
  
  // For admin-existing-athlete flow: set parent info when data is available
  useEffect(() => {
    if (isAdminExistingAthlete && parentDataForExistingAthlete && !state.parentInfo) {
      console.log("Setting parent info for admin-existing-athlete flow:", parentDataForExistingAthlete);
      setParentInfoFromData(parentDataForExistingAthlete);
      
      // Also set the selectedParent to ensure it's available for the payment step
      updateState({
        selectedParent: parentDataForExistingAthlete
      });
    }
  }, [isAdminExistingAthlete, parentDataForExistingAthlete, state.parentInfo]);
  
  // For other admin flows: set parent info when data is available
  useEffect(() => {
    if (isOtherAdminFlow && parentDataForOtherFlows && !state.parentInfo) {
      console.log("Setting parent info for other admin flows:", parentDataForOtherFlows);
      setParentInfoFromData(parentDataForOtherFlows);
      
      // Also set the selectedParent to ensure it's available for the payment step
      updateState({
        selectedParent: parentDataForOtherFlows
      });
    }
  }, [isOtherAdminFlow, parentDataForOtherFlows, state.parentInfo]);
  
  // For admin-new-athlete flow: check if we already have parent info from the parent selection step
  useEffect(() => {
    if (state.flowType === 'admin-new-athlete' && state.selectedParent && state.parentId && !state.parentInfo) {
      console.log("Using selected parent from previous step:", state.selectedParent);
      setParentInfoFromData(state.selectedParent);
    }
  }, [state.flowType, state.selectedParent, state.parentId, state.parentInfo]);
  
  // Fallback fetch if queries don't work
  useEffect(() => {
    if (isAdminExistingAthlete && hasSelectedAthletes && !state.parentInfo && 
        !isLoadingParentForExistingAthlete && !isManuallyFetchingParent && 
        selectedAthlete?.parentId) {
      
      console.log("Fallback: manually fetching parent data for ID:", selectedAthlete.parentId);
      setIsManuallyFetchingParent(true);
      setLoadingError(null);
      
      apiRequest('GET', `/api/parents/${selectedAthlete.parentId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch parent');
          return res.json();
        })
        .then(data => {
          console.log("Manual parent fetch successful:", data);
          if (!setParentInfoFromData(data)) {
            setLoadingError("Could not set parent info from fetched data");
          } else {
            // Also set selectedParent to ensure it's available in payment step
            updateState({
              selectedParent: data
            });
          }
        })
        .catch(err => {
          console.error("Error in manual parent fetch:", err);
          setLoadingError(`Error fetching parent data: ${err.message}`);
        })
        .finally(() => setIsManuallyFetchingParent(false));
    }
  }, [
    isAdminExistingAthlete, hasSelectedAthletes, state.parentInfo, 
    isLoadingParentForExistingAthlete, selectedAthlete, isManuallyFetchingParent
  ]);
  
  // Handle selectedParent from admin parent selection
  useEffect(() => {
    if (state.selectedParent) {
      // Check if we need to populate parent info
      const needsToPopulate = !state.parentInfo || 
        !state.parentInfo.firstName || 
        !state.parentInfo.lastName || 
        !state.parentInfo.email;
      
      if (needsToPopulate) {
        console.log("Populating parent info from selectedParent:", state.selectedParent);
        setParentInfoFromData(state.selectedParent);
        setIsEditing(false);
      }
    }
  }, [state.selectedParent, state.parentInfo]);
  
  // Make sure parent info is properly initialized when the component mounts
  useEffect(() => {
    // If we have a selectedParent but no parentInfo, initialize it
    if (state.selectedParent && !state.parentInfo) {
      console.log("Initializing parent info from selectedParent on mount:", state.selectedParent);
      setParentInfoFromData(state.selectedParent);
    }
    // If we have parentId but no parentInfo, try to fetch the parent
    else if (state.parentId && !state.parentInfo && !isManuallyFetchingParent) {
      console.log("Fetching parent info for ID on mount:", state.parentId);
      setIsManuallyFetchingParent(true);
      
      apiRequest('GET', `/api/parents/${state.parentId}`)
        .then((response: Response) => response.json())
        .then((parentData: any) => {
          if (parentData && parentData.id) {
            setParentInfoFromData(parentData);
          }
        })
        .catch((error: Error) => {
          console.error("Error fetching parent data on mount:", error);
        })
        .finally(() => setIsManuallyFetchingParent(false));
    }
  }, []);
  
  console.log("ParentInfoStep state:", {
    parentId: state.parentId,
    flowType: state.flowType,
    parentInfo: state.parentInfo
  });

  const parentInfo = state.parentInfo || {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  };

  const handleInputChange = (field: string, value: string) => {
    updateState({
      parentInfo: {
        ...parentInfo,
        [field]: value
      }
    });
  };

  const handleConfirmInfo = async () => {
    // If we're in the new parent creation flow, we should create the parent first
    if (!state.parentId && parentInfo) {
      try {
        // Prepare data for API call - match InsertParent schema requirements
        const parentData = {
          firstName: parentInfo.firstName.trim(),
          lastName: parentInfo.lastName.trim(),
          email: parentInfo.email.trim(),
          phone: parentInfo.phone.trim(),
          emergencyContactName: parentInfo.emergencyContactName.trim(),
          emergencyContactPhone: parentInfo.emergencyContactPhone.trim(),
          passwordHash: '', // Will be set by backend if needed
          isVerified: false,
          blogEmails: false,
        };

        const response = await apiRequest('POST', '/api/parents', parentData);

        if (response.ok) {
          const createdParent = await response.json();
          // Update state with the newly created parent
          const updatedState = {
            parentId: createdParent.id,
            isNewParentCreated: true, // Set flag to track new parent creation
            selectedParent: {
              ...createdParent,
              firstName: createdParent.firstName || parentInfo.firstName,
              lastName: createdParent.lastName || parentInfo.lastName
            }
          };
          
          updateState(updatedState);
          console.log("Created new parent with ID:", createdParent.id);
          console.log("Updated booking flow state with isNewParentCreated:", updatedState);
        }
      } catch (error) {
        console.error('Error creating parent:', error);
        return; // Don't proceed if there was an error
      }
    }
    
    // Move to next step after parent is created (or if it already exists)
    nextStep();
  };

  const handleSaveChanges = () => {
    setIsEditing(false);
    
    // If we're saving changes in edit mode, we should still be able to continue
    // This ensures that both "Save Changes" and "Confirm" buttons allow navigation
    if (isValid && !state.parentId) {
      handleConfirmInfo();
    }
  };

  const isValid = parentInfo.firstName && parentInfo.lastName && 
                  parentInfo.email && parentInfo.phone && 
                  parentInfo.emergencyContactName && parentInfo.emergencyContactPhone;

  // Show loading state when fetching data
  const isLoading = isManuallyFetchingParent || isLoadingParentForExistingAthlete || 
                   (isAdminExistingAthlete && isLoadingAthletes) ||
                   (isOtherAdminFlow && (isLoadingDirectAthlete || isLoadingParentForOtherFlows));
                   
  if (isLoading) {
    return (
      <div className="space-y-6 py-4 flex flex-col items-center justify-center min-h-[400px]">
        <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="animate-spin w-8 h-8" />
        <p className="text-muted-foreground">Loading parent information...</p>
      </div>
    );
  }
  
  // Show error state if we have one
  if (loadingError) {
    return (
      <div className="space-y-6 py-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold">Error loading parent information</p>
          <p className="text-sm">{loadingError}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => nextStep()}
          >
            Continue anyway
          </Button>
        </div>
      </div>
    );
  }
  
  // If we have parent info and aren't editing, show read-only view
  if (state.parentId && (parentInfo.firstName || parentInfo.email) && !isEditing) {
    const isAutoLinked = Boolean(isAdminExistingAthlete && selectedAthlete?.parentId);
    
    return (
      <div className="space-y-6 py-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[#D8BD2A] dark:text-[#D8BD2A]">
            {isAutoLinked ? "Linked Parent Information" : "Confirm Your Information"}
          </h2>
          <p className="text-[#D8BD2A]/80 dark:text-[#D8BD2A]/80">
            {isAutoLinked 
              ? "This athlete is automatically linked to the following parent account."
              : "Please verify your contact information is up to date."}
          </p>
        </div>

        {isAutoLinked && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">Parent account automatically linked</span>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Parent Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div>
                <dt className="font-semibold text-gray-500 dark:text-[#D8BD2A]">First Name</dt>
                <dd>{parentInfo.firstName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500 dark:text-[#D8BD2A]">Last Name</dt>
                <dd>{parentInfo.lastName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500 dark:text-[#D8BD2A]">Email</dt>
                <dd>{parentInfo.email}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500 dark:text-[#D8BD2A]">Phone</dt>
                <dd>{parentInfo.phone}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500 dark:text-[#D8BD2A]">Emergency Contact</dt>
                <dd>{parentInfo.emergencyContactName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500 dark:text-[#D8BD2A]">Emergency Phone</dt>
                <dd>{parentInfo.emergencyContactPhone}</dd>
              </div>
            </dl>

            <div className="flex justify-end mt-6">
              <Button 
                type="button" 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 bg-[#D8BD2A] text-[#0F0276] hover:bg-[#D8BD2A]/90 border-0"
              >
                <Edit2 className="h-4 w-4" />
                Edit Information
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Edit mode or new information mode
  return (
    <div className="space-y-6 py-4">
      <h2 className="text-2xl font-bold text-[#0F0276] dark:text-white">Parent Information</h2>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        if (isValid) {
          if (isEditing) {
            // Save changes and continue if we're editing
            handleSaveChanges();
            // If we already have a parentId, we can continue directly
            if (state.parentId) {
              nextStep();
            }
          } else {
            // If not editing, confirm and continue
            handleConfirmInfo();
          }
        }
      }}>
        <div className="space-y-6">
          <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#0F0276] dark:text-white">
                <User className="h-5 w-5" /> 
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[#0F0276] dark:text-[#D8BD2A] font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="First Name"
                    value={parentInfo.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[#0F0276] dark:text-[#D8BD2A] font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Last Name"
                    value={parentInfo.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#0F0276] dark:text-[#D8BD2A] font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={parentInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#0F0276] dark:text-[#D8BD2A] font-medium">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Phone"
                    value={parentInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#0F0276] dark:text-white">
                <Contact className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName" className="text-[#0F0276] dark:text-[#D8BD2A] font-medium">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    placeholder="Emergency Contact Name"
                    value={parentInfo.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone" className="text-[#0F0276] dark:text-[#D8BD2A] font-medium">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    placeholder="Emergency Contact Phone"
                    value={parentInfo.emergencyContactPhone}
                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                    className="bg-white/70 border-slate-200/60 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:bg-white/10 dark:border-white/20 dark:focus:border-white/40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!isValid}
              className="bg-gradient-to-r from-[#0F0276] to-blue-600 hover:from-[#0F0276]/90 hover:to-blue-600/90 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing 
                ? (state.parentId ? "Save & Continue" : "Save Changes") 
                : (state.parentId ? "Continue" : "Create Parent & Continue")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
