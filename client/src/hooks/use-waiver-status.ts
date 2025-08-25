import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export interface WaiverStatus {
  hasWaiver: boolean;
  waiverSigned: boolean;
  waiverSignedAt?: string;
  waiverSignatureName?: string;
  waiverAgreements?: {
    relationship: string;
    understands_risks: boolean;
    agrees_to_policies: boolean;
    authorizes_emergency_care: boolean;
    allows_photo_video: boolean;
    confirms_authority: boolean;
  };
  latestWaiverId?: number;
  bookingId?: number;
}

export function useWaiverStatus(athleteName: string, dateOfBirth?: string) {
  return useQuery<WaiverStatus>({
    queryKey: ["/api/check-athlete-waiver", athleteName],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/check-athlete-waiver", {
        athleteName,
        dateOfBirth
      });
      return response.json();
    },
    enabled: !!athleteName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAthleteWaiverStatus(athleteId: string | number) {
  return useQuery<WaiverStatus>({
    queryKey: [`/api/athletes/${athleteId}/waiver-status`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/athletes/${athleteId}/waiver-status`);
      return response.json();
    },
    enabled: !!athleteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMissingWaivers(enabled: boolean = true) {
  return useQuery({
    queryKey: ["/api/athletes/missing-waivers"],
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled,
  });
}