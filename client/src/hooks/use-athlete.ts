import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface CreateAthletePayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  allergies?: string;
  experience: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  isGymMember?: boolean;
  parentId?: number; // Required for admin context
  waiverData?: {
    signature: string;
    relationshipToAthlete: string;
    emergencyContactNumber: string;
    understandsRisks: boolean;
    agreesToPolicies: boolean;
    authorizesEmergencyCare: boolean;
    allowsPhotoVideo: boolean;
    confirmsAuthority: boolean;
    signedAt: string;
    userAgent: string;
  };
}

export function useCreateAthlete(context: 'admin' | 'parent' = 'parent') {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (athlete: CreateAthletePayload) => {
      const endpoint = context === 'admin' ? "/api/admin/athletes" : "/api/parent/athletes";
      const response = await apiRequest("POST", endpoint, athlete);
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Get the parent ID from the returned athlete or from a stored value
      const parentId = data.parentId;
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/parents/${parentId}/athletes`] });
      }
      
      toast({
        title: "Athlete Created",
        description: `${variables.firstName} ${variables.lastName} has been successfully added.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Athlete",
        description: error.message || "There was an error creating the athlete. Please try again.",
        variant: "destructive",
      });
    },
  });
}
