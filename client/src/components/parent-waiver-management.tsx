import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UpdatedWaiverModal } from '@/components/updated-waiver-modal';
import { ParentModal, ParentModalSection, ParentModalGrid } from '@/components/parent-ui/ParentModal';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Calendar, CheckCircle, FileText, FileX, Phone, Shield, User, Clock, TrendingUp, Activity, Download, Camera } from 'lucide-react';
import { useState } from 'react';
import { ParentStatCard } from '@/components/parent-ui/ParentStats';

interface Athlete {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  parent_id: number;
  experience: string;
  allergies?: string;
}

interface Waiver {
  id: number;
  athleteId: number;
  parentId: number;
  athleteName: string;
  signerName: string;
  relationshipToAthlete: string;
  signature: string;
  emergencyContactNumber: string;
  understandsRisks: boolean;
  agreesToPolicies: boolean;
  authorizesEmergencyCare: boolean;
  allowsPhotoVideo: boolean;
  confirmsAuthority: boolean;
  signedAt: string;
  createdAt: string;
  ipAddress?: string;
  emailSentAt?: string;
  pdfPath?: string;
}

interface AthleteWaiverStatus {
  athlete: Athlete;
  waiver: Waiver | null;
  hasWaiver: boolean;
  waiverSigned: boolean;
  needsWaiver: boolean;
}

export function ParentWaiverManagement() {
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [showWaiverDialog, setShowWaiverDialog] = useState(false);
  const [selectedWaiver, setSelectedWaiver] = useState<Waiver | null>(null);
  const [showWaiverDetailsModal, setShowWaiverDetailsModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch waiver status for all parent's athletes
  const { data: waiverStatus, isLoading } = useQuery<AthleteWaiverStatus[]>({
    queryKey: ['/api/parent/waivers'],
    staleTime: 0, // force immediate freshness so changes show up
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // Fetch raw data
      const res = await apiRequest('GET', '/api/parent/waivers');
      const data = await res.json();

      // Normalize waiver fields to camelCase regardless of server response shape
      const normalized = (data as any[]).map((item) => {
        const w = item?.waiver;
        const builtFromTopLevel = !w || (!w.signerName && !w.signer_name && (item.signer_name || item.relationship_to_athlete || item.signed_at || item.latest_waiver_id));

        // Build a waiver object from top-level fields if nested waiver is missing/incomplete
        const waiver = builtFromTopLevel
          ? {
              ...(w || {}),
              id: w?.id ?? item.latest_waiver_id ?? w?.waiver_id ?? null,
              athlete_id: w?.athlete_id ?? item.id ?? w?.athleteId ?? null,
              signerName: (w?.signerName ?? item.signer_name ?? w?.signer_name ?? ''),
              relationshipToAthlete: (w?.relationshipToAthlete ?? item.relationship_to_athlete ?? w?.relationship_to_athlete ?? ''),
              signedAt: (w?.signedAt ?? item.signed_at ?? w?.signed_at ?? null),
              signature_id: w?.signature_id ?? item.signature_id ?? null,
              signature_data: w?.signature_data ?? item.signature_data ?? null,
              created_at: w?.created_at ?? item.created_at ?? null,
            }
          : {
              ...w,
              signerName: w.signerName ?? w.signer_name ?? w.signer ?? '',
              relationshipToAthlete: w.relationshipToAthlete ?? w.relationship_to_athlete ?? w.relationship ?? '',
              signedAt: w.signedAt ?? w.signed_at ?? w.signed_at_utc ?? null,
            };

        const result = {
          ...item,
          waiver: waiver ?? null,
        };

        // Lightweight debug in dev only
        if (import.meta.env.DEV && !result.waiver?.signerName && (item.signer_name || item.relationship_to_athlete || item.signed_at)) {
          console.debug('[Waivers] Normalized entry missing signerName despite top-level fields', { item, result });
        }

        return result;
      });

      return normalized as AthleteWaiverStatus[];
    },
  });

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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const [showWaiverModal, setShowWaiverModal] = useState(false);

  const handleCreateWaiver = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    // Ensure parent info is loaded before opening waiver modal
    if (parentInfo) {
      setShowWaiverModal(true);
    } else {
      // If parent info isn't loaded yet, try to refetch
      refetchParentInfo().then(() => {
        setShowWaiverModal(true);
      });
    }
  };

  const handleWaiverSigned = () => {
    // Invalidate all waiver-related queries to update UI dynamically
    queryClient.invalidateQueries({ queryKey: ['/api/parent/waivers'] });
    queryClient.invalidateQueries({ queryKey: ['/api/parent/athletes'] });
    setShowWaiverModal(false);
    setSelectedAthlete(null);
    toast({
      title: "Waiver Signed Successfully",
      description: "The waiver has been completed and saved.",
    });
  };

  const handleViewWaiverDetails = async (waiver: Waiver) => {
    try {
      // Fetch full waiver details from the API
      const response = await apiRequest('GET', `/api/waivers/${waiver.id}`);
      const fullWaiverData = await response.json();
      setSelectedWaiver(fullWaiverData);
      setShowWaiverDetailsModal(true);
    } catch (error) {
      console.error('Error fetching waiver details:', error);
      toast({
        title: "Error",
        description: "Failed to load waiver details. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Download PDF function: use public admin endpoint to avoid auth/CORS issues
  const handleDownloadPDF = async (waiverId: number, athleteName: string) => {
    try {
      const apiBaseUrl = import.meta.env.MODE === 'development' ? 'http://localhost:6001' : '';
      const finalUrl = `${apiBaseUrl}/api/waivers/${waiverId}/pdf`;

      // Use an anchor to trigger a download; cookies will be sent automatically
      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = `${athleteName}_waiver.pdf`;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: "Your waiver PDF is downloading.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Failed",
        description: "Could not download waiver PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const confirmCreateWaiver = () => {
    setShowWaiverDialog(false);
    if (selectedAthlete) {
      setShowWaiverModal(true);
    }
  };

  const getAthleteAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(`${dateString}T12:00:00Z`).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in-0 duration-500">
        {/* Loading Header */}
        <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl p-6 text-white shadow-lg animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="h-8 bg-white/20 rounded w-48 mb-2"></div>
                <div className="h-5 bg-white/20 rounded w-64"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-10 bg-white/20 rounded w-16 mb-1"></div>
              <div className="h-4 bg-white/20 rounded w-20"></div>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3"></div>
        </div>

        {/* Loading Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden border-0 shadow-lg animate-pulse">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-200 p-2 rounded-lg w-10 h-10"></div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-200 rounded w-12 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-24 mt-3"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Content */}
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse shadow-lg">
              <CardHeader className="bg-gray-200 py-6">
                <div className="h-6 bg-gray-300 rounded w-48"></div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-24 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!waiverStatus || !Array.isArray(waiverStatus) || waiverStatus.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in-0 duration-500">
        {/* Empty State Header */}
        <div className="bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Waiver Management</h1>
                <p className="text-gray-100 text-lg">No athletes found</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">0%</div>
              <div className="text-gray-100">Complete</div>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div className="bg-gray-400 h-full rounded-full w-0"></div>
          </div>
        </div>

        {/* Empty State Content */}
        <Card className="shadow-xl">
          <CardContent className="pt-12 pb-16">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                <FileText className="w-12 h-12 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Athletes Found</h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                No athletes are currently registered under your account. Add athletes through the booking system to manage waivers.
              </p>
              <Button 
                className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3"
              >
                Book Your First Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const athletesNeedingWaivers = waiverStatus?.filter((status: AthleteWaiverStatus) => status.needsWaiver) || [];
  const athletesWithWaivers = waiverStatus?.filter((status: AthleteWaiverStatus) => status.hasWaiver) || [];
  
  // Enhanced metrics calculations
  const totalAthletes = waiverStatus?.length || 0;
  const signedWaivers = athletesWithWaivers.length;
  const pendingWaivers = athletesNeedingWaivers.length;
  const completionPercentage = totalAthletes > 0 ? Math.round((signedWaivers / totalAthletes) * 100) : 0;
  
  // Recent activity (waivers signed in last 30 days)
  const recentWaivers = athletesWithWaivers.filter(status => {
    if (!status.waiver?.signedAt) return false;
    const signedDate = new Date(status.waiver.signedAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return signedDate >= thirtyDaysAgo;
  }).length;
  
  // Waivers expiring soon (if we had expiration dates - placeholder for future enhancement)
  const expiringSoon = 0; // Future enhancement: track waiver expiration dates

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-500">
      {/* Enhanced Header with Status Overview */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Waiver Management</h1>
              <p className="text-blue-100 text-lg">Manage safety documents for your athletes</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{completionPercentage}%</div>
            <div className="text-blue-100">Complete</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ParentStatCard
          label="Signed Waivers"
          value={signedWaivers}
          icon={<CheckCircle />}
          color="blue"
          className="[&_p:first-child]:sm:text-sm [&_p:first-child]:text-xs"
        />
        
        <ParentStatCard
          label="Pending Waivers"
          value={pendingWaivers}
          icon={<AlertCircle />}
          color="orange"
          className="[&_p:first-child]:sm:text-sm [&_p:first-child]:text-xs"
        />
        
        <ParentStatCard
          label="Total Athletes"
          value={totalAthletes}
          icon={<User />}
          color="purple"
          className="[&_p:first-child]:sm:text-sm [&_p:first-child]:text-xs"
        />
        
        <ParentStatCard
          label="Recent (30d)"
          value={recentWaivers}
          icon={<Calendar />}
          color="green"
          className="[&_p:first-child]:sm:text-sm [&_p:first-child]:text-xs"
        />
      </div>

      {/* Pending Waivers Section */}
      {athletesNeedingWaivers.length > 0 && (
        <div className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 py-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-3 text-xl">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FileX className="h-6 w-6" />
                  </div>
                  Athletes Needing Waivers
                </CardTitle>
                <Badge className="bg-white/20 text-white border-white/30 font-semibold px-3 py-1">
                  {athletesNeedingWaivers.length} {athletesNeedingWaivers.length === 1 ? 'athlete' : 'athletes'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-gradient-to-b from-orange-50/30 to-white">
              <Alert className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-800 shadow-sm">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-base">
                  The following athletes need signed waivers before participating in coaching sessions. Please complete the waiver process for each athlete.
                </AlertDescription>
              </Alert>

              <div className="grid gap-6">
                {athletesNeedingWaivers.map((status: AthleteWaiverStatus) => (
                  <Card key={status.athlete.id} className="border-orange-200 bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30 hover:from-orange-100/60 hover:to-amber-100/40 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-orange-800 mb-1">
                            {status.athlete.name || `${status.athlete.first_name} ${status.athlete.last_name}`}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-6 mt-2 text-orange-700">
                            <span className="flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">Age: {getAthleteAge(status.athlete.date_of_birth)}</span>
                            </span>
                            <span className="flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-full capitalize">
                              <TrendingUp className="w-4 h-4" />
                              <span className="font-medium">Experience: {status.athlete.experience}</span>
                            </span>
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-orange-700 border-orange-300 font-semibold bg-orange-100 px-3 py-1 animate-pulse">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Waiver Required
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="flex justify-between items-end">
                        <div className="flex-1">
                          <p className="text-orange-700 mb-3 font-medium">
                            A liability waiver is required before this athlete can participate in coaching sessions.
                          </p>
                          {status.athlete.allergies && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                              <p className="text-red-700 font-semibold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <strong>Allergies:</strong> {status.athlete.allergies}
                              </p>
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={() => handleCreateWaiver(status.athlete)}
                          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 text-base"
                          disabled={isLoadingParentInfo}
                        >
                          {isLoadingParentInfo ? (
                            <div className="flex items-center gap-2">
                              <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="animate-spin h-4 w-4" />
                              Loading...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Sign Waiver
                            </div>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Signed Waivers Section */}
      {athletesWithWaivers.length > 0 && (
        <div className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-[#B8860B] via-amber-600 to-yellow-600 dark:from-[#B8860B] dark:via-amber-700 dark:to-yellow-700 py-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-3 text-xl">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  Signed Waivers
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge className="bg-white/20 text-white border-white/30 font-semibold px-3 py-1">
                    {athletesWithWaivers.length} {athletesWithWaivers.length === 1 ? 'waiver' : 'waivers'} complete
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white hover:bg-white/20 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-gradient-to-b from-amber-50/30 to-white dark:from-amber-900/10 dark:to-gray-900">
              <div className="grid gap-6">
                {athletesWithWaivers.map((status: AthleteWaiverStatus) => (
                  <Card key={status.athlete.id} className="border-amber-200 dark:border-[#B8860B]/30 bg-gradient-to-br from-amber-50/50 via-white to-yellow-50/30 dark:from-amber-900/20 dark:via-gray-800 dark:to-yellow-900/20 hover:from-amber-100/60 hover:to-yellow-100/40 dark:hover:from-amber-800/30 dark:hover:to-yellow-800/30 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-[#B8860B] dark:text-[#B8860B] mb-1">
                            {status.athlete.name || `${status.athlete.first_name} ${status.athlete.last_name}`}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-6 mt-2 text-amber-700 dark:text-[#B8860B]">
                            <span className="flex items-center gap-2 bg-amber-100 dark:bg-[#B8860B]/20 px-3 py-1 rounded-full">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">Age: {getAthleteAge(status.athlete.date_of_birth)}</span>
                            </span>
                            <span className="flex items-center gap-2 bg-yellow-100 dark:bg-[#B8860B]/30 px-3 py-1 rounded-full capitalize">
                              <TrendingUp className="w-4 h-4" />
                              <span className="font-medium">Experience: {status.athlete.experience}</span>
                            </span>
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[#B8860B] border-[#B8860B]/50 dark:border-[#B8860B] font-semibold bg-amber-100 dark:bg-[#B8860B]/20 px-3 py-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Waiver Signed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 px-3 bg-amber-50 dark:bg-[#B8860B]/20 rounded-lg">
                            <span className="text-sm font-medium text-amber-700 dark:text-[#B8860B]">Signed by:</span>
                            <span className="text-sm font-semibold text-amber-800 dark:text-[#B8860B]">{status.waiver?.signerName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 px-3 bg-amber-50 dark:bg-[#B8860B]/20 rounded-lg">
                            <span className="text-sm font-medium text-amber-700 dark:text-[#B8860B]">Date signed:</span>
                            <span className="text-sm font-semibold text-amber-800 dark:text-[#B8860B]">
                              {status.waiver?.signedAt ? new Date(status.waiver.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 px-3 bg-amber-50 dark:bg-[#B8860B]/20 rounded-lg">
                            <span className="text-sm font-medium text-amber-700 dark:text-[#B8860B]">Relationship:</span>
                            <span className="text-sm font-semibold text-amber-800 dark:text-[#B8860B]">{status.waiver?.relationshipToAthlete || 'N/A'}</span>
                          </div>
                          {status.waiver?.emergencyContactNumber && (
                            <div className="flex justify-between items-center py-2 px-3 bg-amber-50 dark:bg-[#B8860B]/20 rounded-lg">
                              <span className="text-sm font-medium text-amber-700 dark:text-[#B8860B]">Emergency Contact:</span>
                              <span className="text-sm font-semibold text-amber-800 dark:text-[#B8860B] flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {status.waiver.emergencyContactNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-4 pt-4 border-t border-amber-200 dark:border-[#B8860B]/30">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => status.waiver && handleDownloadPDF(status.waiver.id, status.athlete.name)}
                          className="text-[#B8860B] border-[#B8860B]/50 dark:border-[#B8860B] hover:bg-amber-50 dark:hover:bg-[#B8860B]/20 flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => status.waiver && handleViewWaiverDetails(status.waiver)}
                          className="text-[#B8860B] border-[#B8860B]/50 dark:border-[#B8860B] hover:bg-amber-50 dark:hover:bg-[#B8860B]/20 flex-1"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Create Waiver Dialog */}
      <Dialog open={showWaiverDialog} onOpenChange={setShowWaiverDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
              Create Waiver for {selectedAthlete?.name || `${selectedAthlete?.first_name} ${selectedAthlete?.last_name}`}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              This will create a new waiver document for your athlete. You'll need to complete the signing process afterward.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Athlete Information Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Athlete Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Name:</span>
                    <p className="text-blue-900 font-semibold">{selectedAthlete?.name || `${selectedAthlete?.first_name} ${selectedAthlete?.last_name}`}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Age:</span>
                    <p className="text-blue-900 font-semibold">{selectedAthlete ? getAthleteAge(selectedAthlete.date_of_birth) : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Experience:</span>
                    <p className="text-blue-900 font-semibold capitalize">{selectedAthlete?.experience}</p>
                  </div>
                  {selectedAthlete?.allergies && (
                    <div className="col-span-2">
                      <span className="text-red-700 font-medium">Allergies:</span>
                      <p className="text-red-900 font-semibold">{selectedAthlete.allergies}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Waiver Requirements */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Waiver Requirements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: AlertCircle, text: "Acknowledgment of inherent risks in gymnastics activities" },
                    { icon: FileText, text: "Agreement to facility policies and procedures" },
                    { icon: Phone, text: "Authorization for emergency medical care" },
                    { icon: Camera, text: "Photo/video consent for promotional purposes" },
                    { icon: CheckCircle, text: "Confirmation of legal authority to sign" },
                    { icon: User, text: "Emergency contact information" }
                  ].map(({ icon: Icon, text }, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 bg-white/60 rounded-lg">
                      <div className="bg-amber-100 p-1 rounded">
                        <Icon className="w-4 h-4 text-amber-700" />
                      </div>
                      <span className="text-sm text-amber-900 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowWaiverDialog(false)}
                className="flex-1 text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmCreateWaiver}
                className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold shadow-lg"
              >
                <FileText className="w-4 h-4 mr-2" />
                Sign Waiver
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Waiver Modal */}
      {showWaiverModal && selectedAthlete && (
        <UpdatedWaiverModal
          isOpen={showWaiverModal}
          onClose={() => setShowWaiverModal(false)}
          onWaiverSigned={handleWaiverSigned}
          athleteId={selectedAthlete.id}
          parentId={parentInfo?.id || 0}
          bookingData={{
            athleteName: selectedAthlete.name,
            parentName: parentInfo ? `${parentInfo.firstName || ''} ${parentInfo.lastName || ''}`.trim() : '',
            emergencyContactNumber: parentInfo?.phone || '',
            relationshipToAthlete: 'Parent/Guardian'
          }}
        />
      )}

      {/* Waiver Details Modal */}
      {/* Waiver Details Modal */}
      <ParentModal
        isOpen={showWaiverDetailsModal}
        onClose={() => {
          setShowWaiverDetailsModal(false);
          setSelectedWaiver(null);
        }}
        title={selectedWaiver ? `Waiver Details - ${selectedWaiver.athleteName}` : 'Waiver Details'}
        description="Complete waiver information and details"
        size="lg"
      >
        {selectedWaiver ? (
          <>
            {/* Basic Information */}
            <ParentModalSection title="Basic Information">
              <ParentModalGrid>
                <div className="space-y-2">
                  <Label className="text-[#0F0276] dark:text-white">Athlete Name</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-[#0F0276] dark:text-white font-medium">
                      {selectedWaiver.athleteName}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F0276] dark:text-white">Signer Name</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-[#0F0276] dark:text-white font-medium">
                      {selectedWaiver.signerName}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F0276] dark:text-white">Relationship</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-[#0F0276] dark:text-white font-medium">
                      {selectedWaiver.relationshipToAthlete}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F0276] dark:text-white">Emergency Contact</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-[#0F0276] dark:text-white font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedWaiver.emergencyContactNumber}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F0276] dark:text-white">Signed Date</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-[#0F0276] dark:text-white font-medium">
                      {selectedWaiver.signedAt ? 
                        new Date(selectedWaiver.signedAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not signed'
                      }
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F0276] dark:text-white">Created Date</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-[#0F0276] dark:text-white font-medium">
                      {selectedWaiver.createdAt ? 
                        new Date(selectedWaiver.createdAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Unknown'
                      }
                    </span>
                  </div>
                </div>
              </ParentModalGrid>
            </ParentModalSection>

            {/* Agreement Status */}
            <ParentModalSection title="Agreement Status">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-medium text-[#0F0276] dark:text-white">Understands Risks</span>
                  <div className="flex items-center">
                    {selectedWaiver.understandsRisks ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-medium text-[#0F0276] dark:text-white">Agrees to Policies</span>
                  <div className="flex items-center">
                    {selectedWaiver.agreesToPolicies ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-medium text-[#0F0276] dark:text-white">Authorizes Emergency Care</span>
                  <div className="flex items-center">
                    {selectedWaiver.authorizesEmergencyCare ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-medium text-[#0F0276] dark:text-white">Allows Photo/Video</span>
                  <div className="flex items-center">
                    {selectedWaiver.allowsPhotoVideo ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-medium text-[#0F0276] dark:text-white">Confirms Signing Authority</span>
                  <div className="flex items-center">
                    {selectedWaiver.confirmsAuthority ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </ParentModalSection>

            {/* Digital Signature */}
            {selectedWaiver.signature && (
              <ParentModalSection title="Digital Signature">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                  <img 
                    src={selectedWaiver.signature} 
                    alt="Digital Signature" 
                    className="max-h-24 mx-auto border border-gray-300 dark:border-gray-600 rounded"
                  />
                </div>
              </ParentModalSection>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-[#0F0276] dark:text-white">Loading waiver details...</div>
          </div>
        )}
      </ParentModal>
    </div>
  );
}