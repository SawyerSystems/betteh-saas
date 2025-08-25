import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Mail, Phone, Shield, User } from "lucide-react";

interface ParentInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  totalChildren: number;
  totalBookings: number;
  activeBookings: number;
  lastLoginAt?: string;
}

interface ParentInfoDisplayProps {
  athleteId: number;
  parentInfo?: any; // Fallback parent info from props
}

export function ParentInfoDisplay({ athleteId, parentInfo: fallbackParentInfo }: ParentInfoDisplayProps) {
  const { data: parentDetails, isLoading, error } = useQuery<ParentInfo>({
    queryKey: [`/api/athletes/${athleteId}/parent-details`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/athletes/${athleteId}/parent-details`);
      if (!response.ok) {
        throw new Error('Failed to fetch parent details');
      }
      return response.json();
    },
    retry: 1,
  });

  const parentData = parentDetails || fallbackParentInfo;

  if (isLoading) {
    return (
      <Card className="rounded-xl border shadow-sm mb-6" role="region" aria-labelledby="parent-info-heading">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-indigo-800 flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            Parent Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center py-4">
            <img src="/CWT_Circle_LogoSPIN.png" alt="Loading" className="animate-spin w-5 h-5" />
            <span className="ml-2 text-gray-600">Loading parent information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !parentData) {
    return (
      <Card className="rounded-xl border shadow-sm mb-6" role="region" aria-labelledby="parent-info-heading">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-indigo-800 flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            Parent Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 bg-red-50">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Unable to load parent information</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-6" role="region" aria-labelledby="parent-info-heading">
      <div className="rounded-xl border shadow-sm">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 id="parent-info-heading" className="text-lg font-semibold text-indigo-800 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              Parent Information
            </h3>
            <div className="flex items-center gap-2">
              {parentData.isVerified ? (
                <div className="flex items-center bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </div>
              ) : (
                <div className="flex items-center bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Unverified
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-indigo-500" />
                <span className="font-medium text-slate-700">Name:</span>
                <span className="ml-2 text-slate-800">
                  {parentData.firstName} {parentData.lastName}
                </span>
              </div>
              
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-indigo-500" />
                <span className="font-medium text-slate-700">Email:</span>
                {parentData.email ? (
                  <a href={`mailto:${parentData.email}`} className="ml-2 text-indigo-600 hover:underline">
                    {parentData.email}
                  </a>
                ) : (
                  <span className="ml-2 text-slate-500">Not provided</span>
                )}
              </div>

              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-indigo-500" />
                <span className="font-medium text-slate-700">Phone:</span>
                {parentData.phone ? (
                  <a href={`tel:${parentData.phone}`} className="ml-2 text-indigo-600 hover:underline">
                    {parentData.phone}
                  </a>
                ) : (
                  <span className="ml-2 text-slate-500">Not provided</span>
                )}
              </div>
            </div>

            {/* Emergency Contact & Stats */}
            <div className="space-y-3">
              <div className="flex items-start">
                <Shield className="h-4 w-4 mr-2 text-indigo-500 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-700">Emergency Contact:</span>
                  <div className="ml-2 mt-1">
                    {parentData.emergencyContactName ? (
                      <div>
                        <div className="text-slate-800">{parentData.emergencyContactName}</div>
                        {parentData.emergencyContactPhone && (
                          <a href={`tel:${parentData.emergencyContactPhone}`} className="text-indigo-600 hover:underline text-sm">
                            {parentData.emergencyContactPhone}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500">Not provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Statistics */}
              {parentDetails && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 shadow-sm">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-indigo-400 mr-2"></span>
                      <span className="text-slate-700"><span className="font-medium">Children:</span> {parentDetails.totalChildren}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 mr-2"></span>
                      <span className="text-slate-700"><span className="font-medium">Bookings:</span> {parentDetails.totalBookings}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-400 mr-2"></span>
                      <span className="text-slate-700"><span className="font-medium">Active:</span> {parentDetails.activeBookings}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-amber-400 mr-2"></span>
                      <span className="text-slate-700">
                        <span className="font-medium">Since:</span>{' '}
                        {new Date(parentDetails.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {parentDetails.lastLoginAt && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-sm">
                      <span className="text-slate-700">
                        <span className="font-medium">Last Login:</span>{' '}
                        {new Date(parentDetails.lastLoginAt).toLocaleDateString()} at {new Date(parentDetails.lastLoginAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
