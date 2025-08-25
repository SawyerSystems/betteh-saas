import { BookingHistoryDisplay } from "@/components/BookingHistoryDisplay";
import { AthleteProgressPanel } from "@/components/admin/AthleteProgressPanel";
import { ParentInfoDisplay } from "@/components/ParentInfoDisplay";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AdminModal, AdminModalSection, AdminModalDetailRow, AdminModalGrid } from "@/components/admin-ui/AdminModal";
import { AdminButton } from "@/components/admin-ui/AdminButton";
import { useToast } from "@/hooks/use-toast";
import { calculateAge } from "@/lib/dateUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Athlete, Booking, Parent } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Calendar, Clock, Dumbbell, Edit, Plus, Star, User, Phone, Mail, CheckCircle, FileText, RefreshCw, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";
import { useAthleteWaiverStatus } from "@/hooks/use-waiver-status";
import React, { useState } from "react";

interface AthleteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athlete: Athlete | null;
  bookings: Booking[];
  parentInfo?: Parent | null;
  onBookSession?: () => void;
  onEditAthlete?: () => void;
  showActionButtons?: boolean;
  mode?: 'parent' | 'admin';
}

export function AthleteDetailDialog({
  open,
  onOpenChange,
  athlete,
  bookings,
  parentInfo,
  onBookSession,
  onEditAthlete,
  showActionButtons = true,
  mode = 'admin'
}: AthleteDetailDialogProps) {
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

  // Use complete data if available, fallback to prop data
  const athleteData = completeAthleteData || athlete;

  // For parent mode, fetch all bookings to show complete booking history
  const { data: allBookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/parent/all-bookings'],
    enabled: mode === 'parent',
  });

  // Filter bookings for this specific athlete
  const athleteBookings = mode === 'parent' ? 
    allBookings.filter(booking => {
      // For parent mode, check if any athlete in booking_athletes matches
      const athleteId = athleteData?.id;
      if (!athleteId) return false;
      
      // Check if booking has athletes array (modern structure)
      if (booking.athletes && booking.athletes.length > 0) {
        return booking.athletes.some(a => a.athleteId === athleteId);
      }
      
      // Fallback to legacy name matching
      const athleteName = athleteData.name || 
                         (athleteData.firstName && athleteData.lastName ? 
                          `${athleteData.firstName} ${athleteData.lastName}` : '');
      
  return booking.athlete1Name === athleteName || 
     booking.athlete2Name === athleteName;
    }) : 
    bookings.filter(booking => {
      // For admin mode, use the provided bookings prop
      const athleteId = athleteData?.id;
      if (!athleteId) return false;
      
      if (booking.athletes && booking.athletes.length > 0) {
        return booking.athletes.some(a => a.athleteId === athleteId);
      }
      
      const athleteName = athleteData.name || 
                         (athleteData.firstName && athleteData.lastName ? 
                          `${athleteData.firstName} ${athleteData.lastName}` : '');
      
  return booking.athlete1Name === athleteName || 
     booking.athlete2Name === athleteName;
    });

  console.log('🔍 Filtered athlete bookings:', {
    athleteId: athleteData?.id,
    athleteName: athleteData?.name,
    totalBookings: mode === 'parent' ? allBookings.length : bookings.length,
    filteredBookings: athleteBookings.length,
    athleteBookings: athleteBookings.map(b => ({ 
      id: b.id, 
      status: b.status, 
      athleteName: b.athlete1Name,
      hasAthletes: !!b.athletes,
      athletesCount: b.athletes?.length || 0
    }))
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [isPhotoEnlarged, setIsPhotoEnlarged] = useState(false);
  
  // Collapsible section states
  const [isParentInfoExpanded, setIsParentInfoExpanded] = useState(false);
  const [isWaiverStatusExpanded, setIsWaiverStatusExpanded] = useState(false);
  const [isBookingHistoryExpanded, setIsBookingHistoryExpanded] = useState(false);
  const [isSkillProgressExpanded, setIsSkillProgressExpanded] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Parent details query
  const { data: parentDetails, isLoading: parentLoading } = useQuery({
    queryKey: [`/api/athletes/${athleteData?.id}/parent-details`],
    queryFn: async () => {
      if (!athleteData?.id) throw new Error('No athlete ID');
      const response = await apiRequest('GET', `/api/athletes/${athleteData.id}/parent-details`);
      if (!response.ok) {
        throw new Error('Failed to fetch parent details');
      }
      return response.json();
    },
    enabled: !!athleteData?.id,
    retry: 1,
  });

  // Waiver status query  
  const { data: waiverStatus, isLoading: waiverLoading, refetch: refetchWaiver } = useAthleteWaiverStatus(athleteData?.id || 0);
  
  const sendWaiverEmail = useMutation({
    mutationFn: async (athleteId: number) => {
      const resp = await apiRequest('POST', `/api/athletes/${athleteId}/send-waiver-email`);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to send waiver email');
      }
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: 'Waiver Email Sent', description: 'Parent has been emailed the waiver link.' });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e?.message || 'Failed to send waiver email.', variant: 'destructive' });
    },
  });

  const handlePhotoClick = (photoUrl: string) => {
    setEnlargedPhoto(photoUrl);
    setIsPhotoEnlarged(true);
  };

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a new blob with the file name attached as a property
            const compressedBlob = Object.assign(blob, { 
              name: file.name.replace(/\.[^/.]+$/, '.jpg'), // Change extension to .jpg
              lastModified: Date.now()
            });
            resolve(compressedBlob as File);
          }
        }, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, athleteId: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const compressedFile = await compressImage(file, 800, 0.8);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Photo = reader.result as string;
        
        const response = await apiRequest("PUT", `/api/athletes/${athleteId}/photo`, {
          photo: base64Photo
        });
        
        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ['/api/athletes'] });
          queryClient.invalidateQueries({ queryKey: ['/api/athletes', athleteId] });
          queryClient.invalidateQueries({ queryKey: ['/api/parent/athletes'] });
          toast({
            title: "Photo Updated",
            description: "Athlete photo has been successfully updated.",
          });
        } else {
          throw new Error('Upload failed');
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (!athleteData) {
    console.log('🔍 AthleteDetailDialog: No athlete provided');
    return null;
  }

  console.log('🔍 AthleteDetailDialog photo debug:', {
    athleteId: athleteData.id,
    athleteName: athleteData.name,
    hasPhoto: !!athleteData.photo,
    photoValue: athleteData.photo,
    photoType: typeof athleteData.photo,
    photoLength: athleteData.photo?.length
  });

  // Debug logging to help identify issues
  console.log('=== AthleteDetailDialog Debug ===');
  console.log('Original athlete prop:', athlete);
  console.log('Complete athlete data:', athleteData);
  console.log('Total bookings received:', bookings.length);
  console.log('ParentInfo:', parentInfo);
  console.log('Filtered athlete bookings:', athleteBookings.length, athleteBookings);
  console.log('=== End Debug ===');

  return (
    <>
      <AdminModal 
        isOpen={open} 
        onClose={() => onOpenChange(false)}
        title="Athlete Profile"
        size="4xl"
        showCloseButton={false}
      >
          
          {/* Basic Info */}
          <AdminModalSection title="Basic Information" icon={<User className="h-5 w-5" />}>
            <div className="space-y-6">
              {/* Photo and Name Section */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 w-full">
                <div className="relative flex flex-col items-center">
                  <div className="relative w-24 h-24 group">
                    {athleteData.photo ? (
                      <img
                        src={athleteData.photo}
                        alt={`${athleteData.name || 'Athlete'}'s photo`}
                        className="w-24 h-24 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-blue-100 ring-offset-2 dark:ring-blue-800"
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
                      <div 
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-800/40 flex items-center justify-center ring-2 ring-blue-100 dark:ring-blue-800 ring-offset-2 cursor-pointer hover:opacity-80 transition-opacity" 
                        aria-label="No photo available - click to upload"
                        onClick={() => setIsPhotoEnlarged(true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsPhotoEnlarged(true);
                          }
                        }}
                      >
                        <User className="h-12 w-12 text-blue-300 dark:text-blue-400" />
                      </div>
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center" aria-live="polite">
                        <img src="/assets/betteh_logo_black_font.png" alt="Uploading" className="animate-spin w-6 h-6" />
                        <span className="sr-only">Uploading photo...</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-300 font-medium mt-2 flex items-center justify-center">
                    <span className="p-1 bg-blue-100 dark:bg-blue-800/40 rounded-full mr-1">
                      <Edit className="h-3 w-3" />
                    </span>
                    Click photo to enlarge and upload
                  </p>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-bold text-xl text-slate-800 dark:text-blue-200">
                    {athleteData.name || `${athleteData.firstName || ''} ${athleteData.lastName || ''}`.trim() || 'Unknown Athlete'}
                  </h3>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                      onClick={() => window.open(`/progress/athlete/${athleteData.id}`, '_blank')}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      View Progress
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Age and Born Section - Full Width on Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white bg-opacity-70 p-4 rounded-lg dark:bg-[#0F0276]/40 dark:bg-opacity-60">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    <span className="font-medium text-gray-700 dark:text-blue-200 text-sm">Age:</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-blue-100">
                    {`${athleteData.dateOfBirth ? calculateAge(athleteData.dateOfBirth) : 'Unknown'} years old`}
                  </div>
                </div>
                <div className="bg-white bg-opacity-70 p-4 rounded-lg dark:bg-[#0F0276]/40 dark:bg-opacity-60">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    <span className="font-medium text-gray-700 dark:text-blue-200 text-sm">Born:</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-blue-100">
                    {athleteData.dateOfBirth ? new Date(`${athleteData.dateOfBirth}T12:00:00Z`).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
              
              {/* Other Details Section */}
              <div className="bg-slate-50 dark:bg-[#0F0276]/20 p-4 rounded-lg border dark:border-[#2A4A9B]/40" role="group" aria-label="Athlete details">
                <AdminModalDetailRow 
                  label="Experience" 
                  value={athleteData.experience || 'Not specified'}
                  icon={<Dumbbell className="h-4 w-4" />}
                  className="mb-2"
                />
                <AdminModalDetailRow 
                  label="Gender" 
                  value={athleteData.gender || 'Not specified'}
                  icon={<User className="h-4 w-4" />}
                  className="mb-2"
                />
                <AdminModalDetailRow 
                  label="Gym Membership" 
                  value={athleteData.isGymMember ? 'Member' : 'Not a member'}
                  icon={<User className="h-4 w-4" />}
                  className="mb-2"
                />
                {athleteData.allergies && (
                  <div className="flex items-start text-red-600 dark:text-red-400 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/40">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="font-medium">Allergies:</span>
                      <span className="ml-1">{athleteData.allergies}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </AdminModalSection>

          {/* Parent Info */}
          <AdminModalSection 
            title="Parent Information" 
            icon={<User className="h-5 w-5" />} 
            className="mt-6"
            collapsible={true}
            isExpanded={isParentInfoExpanded}
            onToggle={() => setIsParentInfoExpanded(!isParentInfoExpanded)}
          >
            {parentLoading ? (
              <div className="flex items-center gap-2 text-slate-500 dark:text-blue-300 py-4">
                <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="animate-spin w-4 h-4" />
                <span>Loading parent information...</span>
              </div>
            ) : parentDetails || parentInfo ? (
              <AdminModalGrid cols={2}>
                <div>
                  <AdminModalDetailRow 
                    label="Name" 
                    value={`${(parentDetails || parentInfo)?.firstName || ''} ${(parentDetails || parentInfo)?.lastName || ''}`.trim() || 'Unknown'}
                    icon={<User className="h-4 w-4" />}
                  />
                  <AdminModalDetailRow 
                    label="Email" 
                    value={(parentDetails || parentInfo)?.email || 'Not provided'}
                    icon={<Mail className="h-4 w-4" />}
                  />
                  <AdminModalDetailRow 
                    label="Phone" 
                    value={(parentDetails || parentInfo)?.phone || 'Not provided'}
                    icon={<Phone className="h-4 w-4" />}
                  />
                </div>
                <div className="bg-slate-50 dark:bg-[#0F0276]/20 p-4 rounded-lg border dark:border-[#2A4A9B]/40">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {(parentDetails || parentInfo)?.isVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="text-sm font-medium">
                        {(parentDetails || parentInfo)?.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">Children:</span>
                        <span className="ml-1">{parentDetails?.totalChildren || 1}</span>
                      </div>
                      <div>
                        <span className="text-green-600 dark:text-green-400 font-medium">Bookings:</span>
                        <span className="ml-1">{parentDetails?.totalBookings || bookings.length}</span>
                      </div>
                      <div>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">Active:</span>
                        <span className="ml-1">{parentDetails?.activeBookings || 0}</span>
                      </div>
                      <div>
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Since:</span>
                        <span className="ml-1">{parentDetails?.createdAt ? new Date(parentDetails.createdAt).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                    </div>
                    {parentDetails?.lastLoginAt && (
                      <div className="text-xs text-slate-600 dark:text-blue-300 mt-2">
                        Last Login: {new Date(parentDetails.lastLoginAt).toLocaleDateString()} at {new Date(parentDetails.lastLoginAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </AdminModalGrid>
            ) : (
              <div className="text-slate-500 dark:text-blue-300 py-4">
                No parent information available
              </div>
            )}
          </AdminModalSection>

          {/* Waiver Status */}
          <AdminModalSection 
            title="Waiver Status" 
            icon={<FileText className="h-5 w-5" />} 
            className="mt-6"
            collapsible={true}
            isExpanded={isWaiverStatusExpanded}
            onToggle={() => setIsWaiverStatusExpanded(!isWaiverStatusExpanded)}
          >
            {waiverLoading ? (
              <div className="flex items-center gap-2 text-slate-500 dark:text-blue-300 py-4">
                <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="animate-spin w-4 h-4" />
                <span>Checking waiver status...</span>
              </div>
            ) : waiverStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {waiverStatus.waiverSigned ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium text-lg">
                      {waiverStatus.waiverSigned ? 'Waiver Signed' : 'Waiver Not Signed'}
                    </span>
                  </div>
                  <button 
                    onClick={() => refetchWaiver()}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-[#0F0276]/30 rounded"
                    title="Refresh waiver status"
                  >
                    <RefreshCw className="h-4 w-4 text-slate-500 dark:text-blue-400" />
                  </button>
                </div>

                {waiverStatus.waiverSigned ? (
                  <div className="space-y-4">
                    <div className="bg-green-50/50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200/50 dark:border-green-800/40">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100/70 dark:bg-green-800/40 rounded-full">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-800 dark:text-green-200">Waiver Completed</h3>
                          <p className="text-sm text-green-600 dark:text-green-400">All safety agreements have been signed</p>
                        </div>
                      </div>
                      
                      <AdminModalGrid cols={2}>
                        <div>
                          <AdminModalDetailRow 
                            label="Signed by" 
                            value={waiverStatus.waiverSignatureName || 'Unknown'}
                            icon={<User className="h-4 w-4" />}
                          />
                          <AdminModalDetailRow 
                            label="Relationship" 
                            value={waiverStatus.waiverAgreements?.relationship || 'Parent/Guardian'}
                            icon={<User className="h-4 w-4" />}
                          />
                        </div>
                        <div>
                          <AdminModalDetailRow 
                            label="Date Signed" 
                            value={waiverStatus.waiverSignedAt ? new Date(waiverStatus.waiverSignedAt).toLocaleDateString() : 'Unknown'}
                            icon={<Calendar className="h-4 w-4" />}
                          />
                          <AdminModalDetailRow 
                            label="Time" 
                            value={waiverStatus.waiverSignedAt ? new Date(waiverStatus.waiverSignedAt).toLocaleTimeString() : 'Unknown'}
                            icon={<Clock className="h-4 w-4" />}
                          />
                        </div>
                      </AdminModalGrid>
                    </div>

                    {waiverStatus.waiverAgreements && (
                      <div className="bg-slate-50/30 dark:bg-[#0F0276]/10 p-4 rounded-lg border border-slate-200/50 dark:border-[#2A4A9B]/30">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-slate-600 dark:text-blue-400" />
                          <h4 className="font-medium text-slate-800 dark:text-blue-200">Agreement Details</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-blue-300">Understands gymnastics risks</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-blue-300">Agrees to gym policies</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-blue-300">Authorizes emergency medical care</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-blue-300">Allows photos/videos for promotion</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-blue-300">Confirms authority to sign</span>
                          </div>
                        </div>
                        {waiverStatus.latestWaiverId && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#2A4A9B]/40">
                            <div className="text-xs text-slate-500 dark:text-blue-400">
                              Waiver ID: <span className="font-mono">{waiverStatus.latestWaiverId}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50/50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200/50 dark:border-red-800/40">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-100/70 dark:bg-red-800/40 rounded-full">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-800 dark:text-red-200">Waiver Required</h3>
                        <p className="text-sm text-red-600 dark:text-red-400">Safety agreement must be completed before sessions</p>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-[#0F0276]/30 p-4 rounded-lg border border-red-200 dark:border-red-800/40 mb-4">
                      <h4 className="font-medium text-slate-800 dark:text-blue-200 mb-3">Required Safety Agreements:</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 border border-slate-400 dark:border-blue-400 rounded-sm flex-shrink-0"></div>
                          <span className="text-slate-700 dark:text-blue-300">Acknowledgment of gymnastics risks</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 border border-slate-400 dark:border-blue-400 rounded-sm flex-shrink-0"></div>
                          <span className="text-slate-700 dark:text-blue-300">Agreement to facility policies</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 border border-slate-400 dark:border-blue-400 rounded-sm flex-shrink-0"></div>
                          <span className="text-slate-700 dark:text-blue-300">Emergency medical care authorization</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 border border-slate-400 dark:border-blue-400 rounded-sm flex-shrink-0"></div>
                          <span className="text-slate-700 dark:text-blue-300">Photo/video consent for promotion</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 border border-slate-400 dark:border-blue-400 rounded-sm flex-shrink-0"></div>
                          <span className="text-slate-700 dark:text-blue-300">Confirmation of signing authority</span>
                        </div>
                      </div>
                    </div>

                    {mode === 'admin' && (
                      <AdminButton 
                        onClick={() => {
                          if (!athleteData?.id) {
                            toast({ title: 'Error', description: 'No athlete information available.', variant: 'destructive' });
                            return;
                          }
                          sendWaiverEmail.mutate(athleteData.id);
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white border-red-600 dark:border-red-700"
                        disabled={sendWaiverEmail.isPending}
                      >
                        {sendWaiverEmail.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Sending Waiver Email...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Waiver Email to Parent
                          </>
                        )}
                      </AdminButton>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 dark:text-blue-300 py-4">
                No waiver information available
              </div>
            )}
          </AdminModalSection>

          {/* Bookings History */}
          <div className="mt-6 p-3 sm:p-4 rounded-xl border shadow-sm bg-gradient-to-r from-white to-blue-50 border-blue-100 dark:from-[#0F0276]/20 dark:to-[#0F0276]/30 dark:border-[#2A4A9B]/40">
            <div 
              className="font-semibold flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-200 cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => setIsBookingHistoryExpanded(!isBookingHistoryExpanded)}
            >
              <Calendar className="h-5 w-5" />
              Booking History
              <div className="ml-auto">
                {isBookingHistoryExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
            {isBookingHistoryExpanded && (
              <BookingHistoryDisplay athleteId={athleteData.id} />
            )}
          </div>

          {/* Skill Progress */}
          <AdminModalSection 
            title="Skill Progress" 
            className="mt-6"
            collapsible={true}
            isExpanded={isSkillProgressExpanded}
            onToggle={() => setIsSkillProgressExpanded(!isSkillProgressExpanded)}
          >
            <AthleteProgressPanel athleteId={athleteData.id} />
          </AdminModalSection>

          {/* Action Buttons */}
          {showActionButtons && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0 pt-6 mt-2 border-t border-dashed border-slate-200" role="group" aria-label="Athlete actions">
              {onBookSession && (
                <Button onClick={onBookSession} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Book Session
                </Button>
              )}
              {onEditAthlete && (
                <Button onClick={onEditAthlete} variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 w-full sm:w-auto">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Athlete
                </Button>
              )}
            </div>
          )}
      </AdminModal>

      {/* Photo Enlargement Modal */}
      <Dialog open={isPhotoEnlarged} onOpenChange={setIsPhotoEnlarged}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#0F0276]/10 to-[#D8BD2A]/10 px-6 py-4 rounded-t-lg -mt-6 -mx-6 mb-6">
            <DialogTitle className="text-2xl font-bold text-[#0F0276] tracking-tight">
              Athlete Photo
            </DialogTitle>
          </DialogHeader>
          {enlargedPhoto ? (
            <div className="space-y-4">
              <div className="flex justify-center p-6 bg-transparent rounded-xl shadow-2xl border border-white/10 dark:border-slate-600/10">
                <img
                  src={enlargedPhoto}
                  alt={`${athleteData.name || `${athleteData.firstName || ''} ${athleteData.lastName || ''}`.trim() || 'Athlete'}'s enlarged photo`}
                  className="max-w-full max-h-96 object-contain rounded-lg shadow-2xl"
                />
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <>
                        <img src="/assets/betteh_logo_black_font.png" alt="Uploading" className="animate-spin w-4 h-4 mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Upload New Photo
                      </>
                    )}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, athleteData.id)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingPhoto}
                    aria-label={`Upload new photo for ${athleteData.name || 'athlete'}`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center p-8 bg-transparent rounded-xl shadow-2xl border border-white/10 dark:border-slate-600/10">
                <div className="text-center">
                  <User className="h-24 w-24 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-300 mb-4">No photo available</p>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <>
                        <img src="/assets/betteh_logo_black_font.png" alt="Uploading" className="animate-spin w-4 h-4 mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, athleteData.id)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingPhoto}
                    aria-label={`Upload new photo for ${athleteData.name || 'athlete'}`}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}