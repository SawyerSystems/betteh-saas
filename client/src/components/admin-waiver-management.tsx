import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { AdminContentTabs } from "@/components/admin-ui/AdminContentTabs";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin-ui/AdminCard";
import { AdminButton } from "@/components/admin-ui/AdminButton";
import { AdminModal, AdminModalSection, AdminModalDetailRow, AdminModalGrid } from "@/components/admin-ui/AdminModal";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/dateUtils";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Download, Eye, FileText, Mail, Search } from "lucide-react";
import { useState } from "react";

interface Waiver {
  id: number | string;
  athleteName: string;
  signerName: string;
  relationshipToAthlete: string;
  emergencyContactNumber: string;
  pdfPath?: string;
  signedAt: string;
  emailSentAt?: string;
  understandsRisks: boolean;
  agreesToPolicies: boolean;
  authorizesEmergencyCare: boolean;
  allowsPhotoVideo: boolean;
  confirmsAuthority: boolean;
  // Dynamic status fields
  status?: 'signed' | 'missing' | 'archived';
  archivedAt?: string;
  archiveReason?: string;
  legalRetentionPeriod?: string;
  originalParentId?: number | null;
  originalAthleteId?: number | null;
  // Additional fields for missing waivers
  name?: string;
  dateOfBirth?: string;
}

interface AthleteWithWaiver {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  hasWaiver: boolean;
  waiverSignedAt?: string;
  waiverSignatureName?: string;
}

interface MissingWaiverAthlete extends Waiver {
  name: string;
  dateOfBirth: string;
}

export function AdminWaiverManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWaiver, setSelectedWaiver] = useState<Waiver | null>(null);
  const [isWaiverDetailsOpen, setIsWaiverDetailsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'signed' | 'missing' | 'archived'>('all');
  const [sendingWaiverId, setSendingWaiverId] = useState<number | string | null>(null);
  const [generatingWaiverId, setGeneratingWaiverId] = useState<number | string | null>(null);

  // Fetch all waivers with dynamic categorization
  const { data: allWaivers = [], isLoading: waiversLoading } = useQuery<Waiver[]>({
    queryKey: ["/api/waivers/categorized"],
    queryFn: async () => {
      // Fetch all waiver data from multiple endpoints
      const [signedResponse, missingResponse, archivedResponse] = await Promise.all([
        apiRequest("GET", "/api/waivers"),
        apiRequest("GET", "/api/athletes/missing-waivers"),
        apiRequest("GET", "/api/waivers/archived")
      ]);

      const [signedData, missingData, archivedData] = await Promise.all([
        signedResponse.json(),
        missingResponse.json(),
        archivedResponse.json()
      ]);

      // Categorize signed waivers
      const signedWaivers = signedData.map((waiver: any) => ({
        ...waiver,
        status: 'signed' as const
      }));

      // Categorize missing waivers (convert athletes to waiver format)
      const missingWaivers = missingData.map((athlete: any) => ({
        id: `missing-${athlete.id}`,
        athleteName: athlete.name,
        signerName: 'Not signed',
        relationshipToAthlete: 'N/A',
        emergencyContactNumber: 'N/A',
        signedAt: '',
        status: 'missing' as const,
        understandsRisks: false,
        agreesToPolicies: false,
        authorizesEmergencyCare: false,
        allowsPhotoVideo: false,
        confirmsAuthority: false,
        // Add athlete-specific fields for missing waivers
        name: athlete.name,
        dateOfBirth: athlete.dateOfBirth
      }));

      // Categorize archived waivers
      const archivedWaivers = archivedData.map((waiver: any) => ({
        ...waiver,
        status: 'archived' as const
      }));

      return [...signedWaivers, ...missingWaivers, ...archivedWaivers];
    },
    staleTime: 30000, // 30 seconds - refresh frequently for real-time updates
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  // Separate waivers by category
  const signedWaivers = allWaivers.filter(w => w.status === 'signed');
  const missingWaivers = allWaivers.filter(w => w.status === 'missing');
  const archivedWaivers = allWaivers.filter(w => w.status === 'archived');

  // Legacy queries for backward compatibility
  const { data: legacyMissingWaivers = [], isLoading: missingLoading } = useQuery<AthleteWithWaiver[]>({
    queryKey: ["/api/athletes/missing-waivers"],
  });

  // Resend email mutation
  const resendEmailMutation = useMutation({
    mutationFn: async (waiverId: number | string) => {
      setSendingWaiverId(waiverId);
      const response = await apiRequest("POST", `/api/waivers/${waiverId}/resend-email`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Waiver email has been resent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/waivers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to send waiver email.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSendingWaiverId(null);
    }
  });

  // Generate PDF mutation
  const generatePDFMutation = useMutation({
    mutationFn: async (waiverId: number | string) => {
      setGeneratingWaiverId(waiverId);
      const response = await apiRequest("POST", `/api/waivers/${waiverId}/generate-pdf`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "PDF Generated",
        description: "Waiver PDF has been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/waivers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate waiver PDF.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setGeneratingWaiverId(null);
    }
  });

  // Download PDF function
  const downloadPDF = async (waiverId: number | string, athleteName: string) => {
    try {
      const response = await apiRequest("GET", `/api/waivers/${waiverId}/pdf`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${athleteName}_waiver.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "PDF download has started.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download waiver PDF.",
        variant: "destructive",
      });
    }
  };

  // Filter waivers based on search term
  const filteredSignedWaivers = signedWaivers.filter(waiver =>
    (waiver.athleteName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (waiver.signerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMissingWaivers = missingWaivers.filter(waiver =>
    (waiver.athleteName || waiver.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    ((waiver as any).name && (waiver as any).name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredArchivedWaivers = archivedWaivers.filter(waiver =>
    (waiver.athleteName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (waiver.signerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (waiversLoading || missingLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Search Section */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <Input
          placeholder="Search athletes or signers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 sm:pl-10 h-8 sm:h-10 text-sm w-full sm:w-64 md:w-80 rounded-lg sm:rounded-xl border-slate-200 focus:border-[#D8BD2A] focus:ring-[#D8BD2A]"
        />
      </div>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-xl border-0 bg-gradient-to-br from-blue-50 via-blue-25 to-blue-50/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-800">Total Waivers</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-900">{allWaivers.length}</div>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-green-50 via-green-25 to-green-50/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-green-800">Signed Waivers</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-900">{signedWaivers.length}</div>
            <p className="text-xs text-green-600 mt-1 font-medium">
              {signedWaivers.filter(w => w.emailSentAt).length} emails sent
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-orange-50 via-orange-25 to-orange-50/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-orange-800">Missing Waivers</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-orange-900">{missingWaivers.length}</div>
            <p className="text-xs text-orange-600 mt-1 font-medium">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-slate-50 via-slate-25 to-slate-50/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800">Archived Waivers</CardTitle>
            <div className="p-2 bg-slate-100 rounded-lg">
              <FileText className="h-4 w-4 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{archivedWaivers.length}</div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Legal records retained
            </p>
          </CardContent>
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
          </div>
        </Card>
      </div>

      <AdminContentTabs
        defaultValue="signed"
        items={[
          {
            value: "signed",
            label: `Signed (${signedWaivers.length})`,
            icon: <CheckCircle className="h-4 w-4" />,
            activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/80 data-[state=active]:text-[#0F0276]",
          },
          {
            value: "missing",
            label: `Missing (${missingWaivers.length})`,
            icon: <AlertCircle className="h-4 w-4" />,
            activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/80 data-[state=active]:text-[#0F0276]",
          },
          {
            value: "archived",
            label: `Archived (${archivedWaivers.length})`,
            icon: <FileText className="h-4 w-4" />,
            activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/80 data-[state=active]:text-[#0F0276]",
          },
        ]}
        listClassName="bg-slate-100 text-[#0F0276] dark:bg-[#D8BD2A]/10 dark:text-white border-slate-200 dark:border-[#D8BD2A]/20 mb-4"
        triggerClassName="gap-2"
      >

        <TabsContent value="signed" className="space-y-4">
          <AdminCard className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90">
            <AdminCardHeader>
              <AdminCardTitle className="text-[#0F0276] dark:text-white flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                Signed Waivers
              </AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent>
              {/* Mobile cards */}
              <div className="sm:hidden p-3 space-y-3">
                {filteredSignedWaivers.length === 0 ? (
                  <Card className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md">
                    <CardContent className="p-6 text-center text-slate-600">No signed waivers found.</CardContent>
                  </Card>
                ) : (
                  filteredSignedWaivers.map((waiver) => (
                    <Card key={waiver.id} className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md">
                      <CardContent className="p-4">
                        <div className="relative min-h-40 pb-28">
                          {/* top-right vertical actions */}
          <div className="absolute right-2 top-2 flex flex-col gap-2 z-10 max-w-[40%]">
                            <AdminButton 
                              variant="secondary" 
                              size="sm" 
                              className="justify-center h-8 w-28 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                              onClick={() => {
                                setSelectedWaiver(waiver);
                                setIsWaiverDetailsOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </AdminButton>
                            {waiver.pdfPath && typeof waiver.id === 'number' ? (
                              <AdminButton
                                variant="secondary"
                                size="sm"
                                onClick={() => downloadPDF(waiver.id as number, waiver.athleteName)}
                                className="justify-center h-8 w-28 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </AdminButton>
                            ) : typeof waiver.id === 'number' ? (
                              <AdminButton
                                variant="secondary"
                                size="sm"
                                onClick={() => generatePDFMutation.mutate(waiver.id)}
                                disabled={generatingWaiverId === waiver.id}
                                className="justify-center h-8 w-28 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                {generatingWaiverId === waiver.id ? 'Gen…' : 'Gen PDF'}
                              </AdminButton>
                            ) : (
                              <Badge variant="secondary" className="self-end bg-slate-100 text-slate-600">Missing</Badge>
                            )}
                            {typeof waiver.id === 'number' ? (
                              <AdminButton
                                variant="secondary"
                                size="sm"
                                onClick={() => resendEmailMutation.mutate(waiver.id)}
                                disabled={sendingWaiverId === waiver.id || !!waiver.signedAt}
                                className="justify-center h-8 w-28 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                                title={!!waiver.signedAt ? 'Waiver already signed' : undefined}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                {sendingWaiverId === waiver.id ? 'Sending…' : 'Email'}
                              </AdminButton>
                            ) : (
                              <AdminButton variant="secondary" size="sm" disabled className="justify-center opacity-60 h-8 w-28 text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                                <Mail className="h-4 w-4 mr-2" />
                                N/A
                              </AdminButton>
                            )}
                          </div>

                          {/* content with right padding so it doesn't overlap actions */}
                          <div className="pr-36">
                            <div className="font-semibold text-slate-900">{waiver.athleteName}</div>
                            <div className="text-sm text-slate-700">Signer: {waiver.signerName}</div>
                            <div className="mt-2">
                              <Badge variant="default" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 font-semibold">
                                <CheckCircle className="h-3 w-3 mr-1" /> Signed {formatDate(waiver.signedAt.split('T')[0])}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table className="w-full border-separate border-spacing-y-2">
                  <TableHeader>
                    <TableRow className="border-transparent">
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Athlete</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Signer</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Relationship</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Signed Date</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Email Status</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSignedWaivers.map((waiver, index) => (
                      <TableRow 
                        key={waiver.id} 
                        className="transition-colors border-transparent"
                      >
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent font-semibold">{waiver.athleteName}</TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{waiver.signerName}</TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{waiver.relationshipToAthlete}</TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent font-medium">{formatDate(waiver.signedAt.split('T')[0])}</TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          {waiver.emailSentAt ? (
                            <Badge variant="default" className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10 font-medium">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Sent
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="border-[#0F0276]/30 text-[#0F0276]/80 bg-[#0F0276]/5 dark:border-white/40 dark:text-white/80 dark:bg-white/10 font-medium">
                              Not Sent
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <div className="flex items-center gap-2">
                            <AdminButton
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedWaiver(waiver);
                                setIsWaiverDetailsOpen(true);
                              }}
                              className="text-[#0F0276] dark:text-white font-medium"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </AdminButton>
                            {waiver.pdfPath && typeof waiver.id === 'number' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadPDF(waiver.id, waiver.athleteName)}
                                className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10 font-medium"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            ) : typeof waiver.id === 'number' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generatePDFMutation.mutate(waiver.id)}
                                disabled={generatingWaiverId === waiver.id}
                                className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10 font-medium disabled:opacity-50"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                {generatingWaiverId === waiver.id ? 'Generating...' : 'Generate PDF'}
                              </Button>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                N/A
                              </Badge>
                            )}
                            {typeof waiver.id === 'number' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resendEmailMutation.mutate(waiver.id)}
                                disabled={sendingWaiverId === waiver.id || waiver.status === 'signed' || !!waiver.signedAt}
                                title={waiver.status === 'signed' || !!waiver.signedAt ? 'Waiver is already signed' : undefined}
                                className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10 font-medium disabled:opacity-50"
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                {sendingWaiverId === waiver.id ? 'Sending...' : 'Email'}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="opacity-50 border-slate-200 text-slate-400"
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                N/A
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AdminCardContent>
          </AdminCard>
        </TabsContent>

        <TabsContent value="missing" className="space-y-4">
          <AdminCard className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90">
            <AdminCardHeader>
              <AdminCardTitle className="text-[#0F0276] dark:text-white flex items-center">
                <AlertCircle className="h-6 w-6 text-orange-600 mr-2" />
                Athletes Missing Waivers
              </AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent>
              {filteredMissingWaivers.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-900 mb-1">Dynamic Status Alert</h4>
                        <p className="text-sm text-orange-800">
                          These athletes automatically appear here when they have active bookings but no signed waivers. Status updates in real-time.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
                    {filteredMissingWaivers.map((waiver) => (
                      <Card key={waiver.id} className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md">
                        <CardContent className="p-4">
                          <div className="relative min-h-40 pb-28">
              <div className="absolute right-2 top-2 flex flex-col gap-2 z-10 max-w-[40%]">
                              <Badge variant="outline" className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200 font-semibold">Waiver Required</Badge>
                              <AdminButton
                                variant="secondary"
                size="sm"
                                onClick={() => {
                                  toast({
                                    title: "Manual Waiver Process",
                                    description: "Contact the parent to complete the waiver through the booking system or parent portal.",
                                  });
                                }}
                className="justify-center h-8 w-28 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                              >
                <Mail className="h-4 w-4 mr-2" /> Contact
                              </AdminButton>
                            </div>
              <div className="pr-36">
                              <div className="font-semibold text-slate-900">{waiver.athleteName}</div>
                              <div className="text-sm text-slate-700">DOB: {waiver.dateOfBirth ? formatDate(waiver.dateOfBirth) : 'N/A'}</div>
                              <div className="text-xs text-slate-500 mt-1">Status updates in real-time</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto rounded-lg border border-orange-100">
                    <Table className="border-separate border-spacing-y-2">
                      <TableHeader>
                        <TableRow className="border-transparent">
                          <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Athlete Name</TableHead>
                          <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Date of Birth</TableHead>
                          <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Status</TableHead>
                          <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Last Updated</TableHead>
                          <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMissingWaivers.map((waiver, index) => (
                          <TableRow 
                            key={waiver.id} 
                            className="transition-colors border-transparent"
                          >
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent font-semibold">{waiver.athleteName}</TableCell>
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{waiver.dateOfBirth ? formatDate(waiver.dateOfBirth) : 'N/A'}</TableCell>
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                              <Badge variant="outline" className="border-orange-600/30 text-orange-700 bg-orange-50/50 dark:border-orange-400/40 dark:text-orange-400 dark:bg-orange-900/20 font-medium">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Waiver Required
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent font-medium">Real-time</TableCell>
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  toast({
                                    title: "Manual Waiver Process",
                                    description: "Contact the parent to complete the waiver through the booking system or parent portal.",
                                  });
                                }}
                                className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10 font-medium"
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Contact Parent
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 mx-auto max-w-md">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-green-900 mb-2">All Waivers Complete!</h3>
                    <p className="text-slate-700 mb-2">All athletes with active bookings have signed waivers.</p>
                    <p className="text-sm text-slate-500">
                      Status automatically updates when new athletes need waivers.
                    </p>
                  </div>
                </div>
              )}
            </AdminCardContent>
          </AdminCard>
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <AdminCard className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-lg dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90">
            <AdminCardHeader>
              <AdminCardTitle className="text-[#0F0276] dark:text-white flex items-center">
                <FileText className="h-6 w-6 text-slate-600 mr-2" />
                Archived Waivers
              </AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent>
              {waiversLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-64 mx-auto"></div>
                    <div className="h-4 bg-slate-200 rounded w-48 mx-auto"></div>
                    <div className="h-4 bg-slate-200 rounded w-56 mx-auto"></div>
                  </div>
                </div>
              ) : archivedWaivers.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-1">Legal Records Notice</h4>
                        <p className="text-sm text-amber-800">
                          These waivers are retained for legal compliance even after parent/athlete accounts have been deleted. Retention period: 7 years from signing date.
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
                    {archivedWaivers.map((waiver) => (
                      <Card key={waiver.id} className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md">
                        <CardContent className="p-4">
                          <div className="relative min-h-40 pb-28">
            <div className="absolute right-2 top-2 flex flex-col gap-2 z-10 max-w-[40%]">
                              <AdminButton 
                                variant="secondary" 
                                size="sm" 
                                className="justify-center h-8 w-28 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                                onClick={() => {
                                  setSelectedWaiver(waiver);
                                  setIsWaiverDetailsOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" /> View
                              </AdminButton>
                              <AdminButton
                                variant="secondary"
                                size="sm"
                                onClick={() => typeof waiver.id === 'number' && downloadPDF(waiver.id as number, waiver.athleteName)}
                                disabled={typeof waiver.id !== 'number'}
                                className="justify-center h-8 w-28 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                              >
                                <Download className="h-4 w-4 mr-2" /> PDF
                              </AdminButton>
                            </div>
                            <div className="pr-36">
                              <div className="font-semibold text-slate-900">{waiver.athleteName}</div>
                              <div className="text-sm text-slate-700">Signer: {waiver.signerName}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge className="bg-slate-100 text-slate-700 border border-slate-200">Signed {formatDate(waiver.signedAt.split('T')[0])}</Badge>
                                <Badge className="bg-amber-100 text-amber-800 border border-amber-200">Archived {(waiver as any).archivedAt ? formatDate((waiver as any).archivedAt.split('T')[0]) : 'N/A'}</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-100">
                    <Table className="border-separate border-spacing-y-2">
                      <TableHeader>
                        <TableRow className="border-transparent">
                          <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Athlete</TableHead>
                          <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Signer</TableHead>
                          <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Relationship</TableHead>
                          <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Signed Date</TableHead>
                          <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Archived Date</TableHead>
                          <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Archive Reason</TableHead>
                          <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivedWaivers.map((waiver, index) => (
                          <TableRow 
                            key={waiver.id} 
                            className="transition-colors border-transparent"
                          >
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent font-semibold">{waiver.athleteName}</TableCell>
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{waiver.signerName}</TableCell>
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">{waiver.relationshipToAthlete}</TableCell>
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent font-medium">{formatDate(waiver.signedAt.split('T')[0])}</TableCell>
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent font-medium">
                              {(waiver as any).archivedAt ? formatDate((waiver as any).archivedAt.split('T')[0]) : 'N/A'}
                            </TableCell>
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                              <span className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10 px-2.5 py-1 rounded-full text-xs font-semibold border">
                                {(waiver as any).archiveReason || 'Account deleted'}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                              <div className="flex items-center gap-2">
                                <AdminButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedWaiver(waiver);
                                    setIsWaiverDetailsOpen(true);
                                  }}
                                  className="text-[#0F0276] dark:text-white font-medium"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </AdminButton>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadPDF(waiver.id, waiver.athleteName)}
                                  disabled={typeof waiver.id !== 'number'}
                                  className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10 font-medium disabled:opacity-50"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  PDF
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 mx-auto max-w-md">
                    <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Archived Waivers</h3>
                    <p className="text-slate-700 mb-2">
                      Waivers will appear here when associated parent or athlete accounts are deleted.
                    </p>
                    <p className="text-sm text-slate-500">
                      These records are retained for legal compliance (7 years from signing date).
                    </p>
                  </div>
                </div>
              )}
            </AdminCardContent>
          </AdminCard>
        </TabsContent>
      </AdminContentTabs>

      {/* Waiver Details Modal */}
      <AdminModal 
        isOpen={isWaiverDetailsOpen} 
        onClose={() => {
          setIsWaiverDetailsOpen(false);
          setSelectedWaiver(null);
        }}
        title={selectedWaiver ? `Waiver Details - ${selectedWaiver.athleteName}` : 'Waiver Details'}
        size="4xl"
        showCloseButton={false}
        footer={
          <div className="flex justify-end gap-3">
            {selectedWaiver && selectedWaiver.pdfPath && typeof selectedWaiver.id === 'number' && (
              <AdminButton
                onClick={() => downloadPDF(selectedWaiver.id as number, selectedWaiver.athleteName)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </AdminButton>
            )}
          </div>
        }
      >
        {selectedWaiver && (
          <>
            {/* Archive Warning for Archived Waivers */}
            {selectedWaiver.status === 'archived' && (
              <AdminModalSection
                title="Archive Notice"
                icon={<AlertCircle className="h-5 w-5 text-red-600" />}
                gradient="red"
              >
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60 dark:border-red-400/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                        ⚠️ Archived Record: This waiver is retained for legal compliance. Original parent/athlete accounts have been deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </AdminModalSection>
            )}

            {/* Basic Information */}
            <AdminModalSection
              title="Basic Information"
              icon={<FileText className="h-5 w-5 text-blue-600 dark:text-white" />}
              gradient="blue"
            >
              <AdminModalGrid cols={2}>
                <AdminModalDetailRow
                  label="Athlete Name"
                  value={selectedWaiver.athleteName}
                />
                <AdminModalDetailRow
                  label="Signer Name"
                  value={selectedWaiver.signerName}
                />
                <AdminModalDetailRow
                  label="Relationship"
                  value={selectedWaiver.relationshipToAthlete}
                />
                <AdminModalDetailRow
                  label="Emergency Contact"
                  value={selectedWaiver.emergencyContactNumber}
                />
                <AdminModalDetailRow
                  label="Signed Date"
                  value={selectedWaiver.signedAt ? formatDate(selectedWaiver.signedAt.split('T')[0]) : 'Not signed'}
                />
                <AdminModalDetailRow
                  label="Email Sent"
                  value={selectedWaiver.emailSentAt ? formatDate(selectedWaiver.emailSentAt.split('T')[0]) : 'Not sent'}
                />
                {selectedWaiver.status === 'archived' && (
                  <>
                    <AdminModalDetailRow
                      label="Archived Date"
                      value={(selectedWaiver as any).archivedAt ? formatDate((selectedWaiver as any).archivedAt.split('T')[0]) : 'N/A'}
                    />
                    <AdminModalDetailRow
                      label="Archive Reason"
                      value={(selectedWaiver as any).archiveReason || 'Account deleted'}
                    />
                    <AdminModalDetailRow
                      label="Legal Retention Until"
                      value={(selectedWaiver as any).legalRetentionPeriod || 'N/A'}
                    />
                  </>
                )}
              </AdminModalGrid>
            </AdminModalSection>

            {/* Agreement Status */}
            {selectedWaiver.status !== 'missing' && (
              <AdminModalSection
                title="Agreement Status"
                icon={<CheckCircle className="h-5 w-5 text-green-600 dark:text-white" />}
                gradient="green"
              >
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Understands Risks</span>
                    <div className="flex items-center">
                      {selectedWaiver.understandsRisks ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Agrees to Policies</span>
                    <div className="flex items-center">
                      {selectedWaiver.agreesToPolicies ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Authorizes Emergency Care</span>
                    <div className="flex items-center">
                      {selectedWaiver.authorizesEmergencyCare ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Allows Photo/Video</span>
                    <div className="flex items-center">
                      {selectedWaiver.allowsPhotoVideo ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Confirms Signing Authority</span>
                    <div className="flex items-center">
                      {selectedWaiver.confirmsAuthority ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              </AdminModalSection>
            )}
          </>
        )}
      </AdminModal>
    </div>
  );
}