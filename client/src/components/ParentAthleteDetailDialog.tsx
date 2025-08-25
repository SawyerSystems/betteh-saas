import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { UpdatedWaiverModal } from "@/components/updated-waiver-modal";
import { WaiverStatusDisplay } from "@/components/WaiverStatusDisplay";
import { useToast } from "@/hooks/use-toast";
import { useAthleteWaiverStatus } from "@/hooks/use-waiver-status";
import { useParentProgressShareLinks } from "@/hooks/useAthleteProgress";
import { calculateAge } from "@/lib/dateUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Athlete } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, FileCheck, Plus, User, ExternalLink, BarChart3 } from "lucide-react";
import React, { useState } from "react";
import { useLocation } from "wouter";

interface ParentAthleteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athlete: Athlete | null;
  onBookSession?: () => void;
  onEditAthlete?: () => void;
  showActionButtons?: boolean;
}

export function ParentAthleteDetailDialog({
  open,
  onOpenChange,
  athlete,
  onBookSession,
  onEditAthlete,
  showActionButtons = true,
}: ParentAthleteDetailDialogProps) {
  const [isPhotoEnlarged, setIsPhotoEnlarged] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch complete athlete details to ensure we have all the data
  const { data: completeAthleteData } = useQuery<Athlete>({
    queryKey: ['/api/athletes', athlete?.id],
    queryFn: async () => {
      if (!athlete?.id) throw new Error('No athlete ID');
      const response = await apiRequest('GET', `/api/athletes/${athlete.id}`);
      return response.json();
    },
    enabled: !!athlete?.id && open,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch waiver status for the athlete
  const { data: waiverStatus } = useAthleteWaiverStatus(athlete?.id || 0);

  // Fetch progress share links for the athlete
  const { data: progressShareLinks = [] } = useParentProgressShareLinks(athlete?.id);

  // Fetch parent information for waiver pre-filling
  const { 
    data: parentInfo, 
    isLoading: isLoadingParentInfo, 
    refetch: refetchParentInfo 
  } = useQuery({
    queryKey: ['/api/parent/info'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parent/info');
      return response.json();
    },
    enabled: open, // Only fetch when modal is open
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use complete data if available, fallback to prop data
  const athleteData = completeAthleteData || athlete;

  const handlePhotoClick = (photo: string) => {
    setEnlargedPhoto(photo);
    setIsPhotoEnlarged(true);
  };



  const handleWaiverSigned = async (waiverData: any) => {
    try {
      toast({
        title: "Waiver signed successfully!",
        description: `Waiver has been signed for ${athleteData?.name}.`,
      });
      
      // Refresh all waiver-related data to update UI dynamically
      await queryClient.invalidateQueries({ queryKey: ['/api/parent/athletes'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/parent/waivers'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/waivers'] });
      
      setIsWaiverModalOpen(false);
    } catch (error) {
      console.error('Error handling waiver signature:', error);
      toast({
        title: "Error",
        description: "There was an error processing the waiver signature.",
        variant: "destructive",
      });
    }
  };

  if (!athleteData) {
    return null;
  }

  const hasWaiver = waiverStatus?.hasWaiver || waiverStatus?.waiverSigned;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700" 
          aria-describedby="parent-athlete-profile-description"
        >
          <DialogHeader>
            <DialogTitle id="parent-athlete-profile-title" className="text-gray-900 dark:text-white">
              Athlete Profile
            </DialogTitle>
            <DialogDescription id="parent-athlete-profile-description" className="text-gray-600 dark:text-gray-300">
              Viewing profile for {athleteData.name || `${athleteData.firstName || ''} ${athleteData.lastName || ''}`.trim() || 'Unknown Athlete'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Basic Info */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4 bg-white dark:bg-gray-800" role="region" aria-labelledby="basic-info-heading">
            <h3 id="basic-info-heading" className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Basic Information</h3>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Photo Section - Read Only */}
              <div className="flex flex-col items-center space-y-3">
                <div className="w-24 h-24">
                  {athleteData.photo ? (
                    <img
                      src={athleteData.photo}
                      alt={`${athleteData.name || 'Athlete'}'s photo`}
                      className="w-24 h-24 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200 dark:border-gray-600"
                      onClick={() => handlePhotoClick(athleteData.photo!)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePhotoClick(athleteData.photo!);
                        }
                      }}
                      aria-label={`View ${athleteData.name || 'athlete'}'s photo in full size`}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600" aria-label="No photo available">
                      <User className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {athleteData.photo ? 'Click to enlarge' : 'No photo available'}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-200 dark:border-blue-700">
                    Photo updates available through the admin team
                  </p>
                </div>
              </div>

              {/* Athlete Details */}
              <div className="flex-1 space-y-3" role="group" aria-label="Athlete details">
                <div>
                  <h4 className="font-semibold text-xl text-gray-900 dark:text-white">
                    {athleteData.name || `${athleteData.firstName || ''} ${athleteData.lastName || ''}`.trim() || 'Unknown Athlete'}
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Age:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {athleteData.dateOfBirth ? calculateAge(athleteData.dateOfBirth) : 'Unknown'} years old
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Date of Birth:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {athleteData.dateOfBirth ? new Date(`${athleteData.dateOfBirth}T12:00:00Z`).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Experience Level:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100 capitalize">
                      {athleteData.experience || 'Not specified'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Gender:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {athleteData.gender || 'Not specified'}
                    </span>
                  </div>

                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Gym Membership:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {athleteData.isGymMember ? 'Member' : 'Not a member'}
                    </span>
                  </div>
                </div>

                {/* View Progress Button */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <Button
                    onClick={() => {
                      setLocation(`/progress/athlete/${athleteData.id}`);
                      onOpenChange(false); // Close the modal
                    }}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white w-full"
                    size="sm"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Progress
                  </Button>
                </div>

                {athleteData.allergies && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mt-4">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <span className="font-medium">⚠️ Allergies/Medical Notes:</span>
                      <span className="ml-2">{athleteData.allergies}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Waiver Status */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800" role="region" aria-labelledby="waiver-status-heading">
            <h3 id="waiver-status-heading" className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Waiver Status</h3>
            <WaiverStatusDisplay 
              athleteId={athleteData.id}
              athleteName={athleteData.name || `${athleteData.firstName || ''} ${athleteData.lastName || ''}`.trim() || 'Unknown Athlete'}
            />
            
            {/* Sign Waiver Button - Show only if waiver is not signed */}
            {!hasWaiver && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <Button 
                  onClick={() => {
                    // Ensure parent info is loaded before opening waiver modal
                    if (parentInfo) {
                      setIsWaiverModalOpen(true);
                    } else {
                      // If parent info isn't loaded yet, try to refetch
                      refetchParentInfo().then(() => {
                        setIsWaiverModalOpen(true);
                      });
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white w-full"
                  size="lg"
                  disabled={isLoadingParentInfo}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  {isLoadingParentInfo ? 'Loading...' : 'Sign Waiver Now'}
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Complete the waiver to enable booking sessions for this athlete
                </p>
              </div>
            )}
          </div>

          {/* Progress Share Link */}
          {progressShareLinks.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800" role="region" aria-labelledby="progress-link-heading">
              <h3 id="progress-link-heading" className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Public Progress Page</h3>
              <div className="space-y-3">
                {progressShareLinks
                  .filter(link => link.expiresAt && new Date(link.expiresAt) > new Date()) // Only show non-expired links
                  .map(link => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex-1">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          A public progress page is available for {athleteData.name || 'this athlete'}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Expires: {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <Button
                        onClick={() => window.open(`/progress/${link.token}`, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white ml-3"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Progress Page
                      </Button>
                    </div>
                  ))}
                {progressShareLinks.filter(link => link.expiresAt && new Date(link.expiresAt) > new Date()).length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No active public progress page available. Contact your coach to generate one.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showActionButtons && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600" role="group" aria-label="Athlete actions">
              {onBookSession && (
                <Button 
                  onClick={onBookSession} 
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white flex-1"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Book New Session
                </Button>
              )}
              {onEditAthlete && (
                <Button 
                  onClick={onEditAthlete} 
                  variant="outline"
                  className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  size="lg"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Information
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Waiver Signing Modal */}
      <UpdatedWaiverModal
        isOpen={isWaiverModalOpen}
        onClose={() => setIsWaiverModalOpen(false)}
        onWaiverSigned={handleWaiverSigned}
        athleteId={athleteData.id}
        parentId={parentInfo?.id || 0}
        bookingData={{
          athleteName: athleteData.name || `${athleteData.firstName || ''} ${athleteData.lastName || ''}`.trim(),
          parentName: parentInfo ? `${parentInfo.firstName || ''} ${parentInfo.lastName || ''}`.trim() : '',
          emergencyContactNumber: parentInfo?.phone || '',
          relationshipToAthlete: 'Parent', // Default value
        }}
      />

      {/* Photo Enlargement Modal */}
      <Dialog open={isPhotoEnlarged} onOpenChange={setIsPhotoEnlarged}>
        <DialogContent 
          className="max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          aria-describedby="athlete-photo-description"
        >
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Athlete Photo</DialogTitle>
            <DialogDescription id="athlete-photo-description" className="text-gray-600 dark:text-gray-300">
              Enlarged view of {athleteData.name || 'athlete'}'s photo
            </DialogDescription>
          </DialogHeader>
          {enlargedPhoto && (
            <div className="flex justify-center">
              <img
                src={enlargedPhoto}
                alt={`${athleteData.name || `${athleteData.firstName || ''} ${athleteData.lastName || ''}`.trim() || 'Athlete'}'s enlarged photo`}
                className="max-w-full max-h-96 object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
