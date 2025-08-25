import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAthleteWaiverStatus } from "@/hooks/use-waiver-status";
import { AlertCircle, CheckCircle, FileText, RefreshCw } from "lucide-react";

interface WaiverStatusDisplayProps {
  athleteId: string | number;
  athleteName: string;
  onResendWaiver?: () => void;
}

export function WaiverStatusDisplay({ athleteId, athleteName, onResendWaiver }: WaiverStatusDisplayProps) {
  const { data: waiverStatus, isLoading, error, refetch } = useAthleteWaiverStatus(athleteId);

  if (isLoading) {
    return (
      <Card className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 bg-white dark:bg-gray-800" role="status" aria-label="Loading waiver status">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            Waiver Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="h-4 w-4 animate-spin" />
            <span>Checking waiver status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 bg-white dark:bg-gray-800" role="alert" aria-label="Waiver status error">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-t-xl">
          <CardTitle className="text-lg font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            Waiver Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error Loading Status</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Unable to check waiver status. Please try again.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="mt-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              aria-label="Retry loading waiver status"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasWaiver = waiverStatus?.hasWaiver || waiverStatus?.waiverSigned;

  return (
    <Card className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 bg-white dark:bg-gray-800">
      <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            Waiver Status
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetch()}
            aria-label="Refresh waiver status"
            title="Refresh status"
            className="text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
      
      <div>
        {hasWaiver ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50 border-green-200 dark:border-green-700">
                Waiver Signed
              </Badge>
            </div>
            
            {waiverStatus && (
              <div className="space-y-3">
                {/* Signer Information */}
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1" role="group" aria-label="Waiver signer details">
                  {waiverStatus.waiverSignatureName && (
                    <p>
                      <span className="font-medium">Signed by:</span> {waiverStatus.waiverSignatureName}
                    </p>
                  )}
                  {waiverStatus.waiverAgreements?.relationship && (
                    <p>
                      <span className="font-medium">Relationship:</span> {waiverStatus.waiverAgreements.relationship}
                    </p>
                  )}
                  {waiverStatus.waiverSignedAt && (
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {new Date(waiverStatus.waiverSignedAt).toLocaleDateString()} at{' '}
                      {new Date(waiverStatus.waiverSignedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>

                {/* Agreement Details */}
                {waiverStatus.waiverAgreements && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">Agreement Details:</h4>
                    <div className="grid grid-cols-1 gap-1 text-xs text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${waiverStatus.waiverAgreements.understands_risks ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>Understands gymnastics risks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${waiverStatus.waiverAgreements.agrees_to_policies ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>Agrees to gym policies</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${waiverStatus.waiverAgreements.authorizes_emergency_care ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>Authorizes emergency medical care</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${waiverStatus.waiverAgreements.allows_photo_video ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>Allows photos/videos for promotion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${waiverStatus.waiverAgreements.confirms_authority ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>Confirms authority to sign</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                {(waiverStatus.latestWaiverId || waiverStatus.bookingId) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    {waiverStatus.latestWaiverId && (
                      <p>
                        <span className="font-medium">Waiver ID:</span> #{waiverStatus.latestWaiverId}
                      </p>
                    )}
                    {waiverStatus.bookingId && (
                      <p>
                        <span className="font-medium">Booking ID:</span> #{waiverStatus.bookingId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-900/50 border-orange-200 dark:border-orange-700">
                Waiver Required
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p className="mb-2">
                No waiver found for {athleteName}. A waiver must be signed before the first lesson.
              </p>
              
              {onResendWaiver && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onResendWaiver}
                  aria-label={`Send waiver email for ${athleteName}`}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Send Waiver Email
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      </CardContent>
    </Card>
  );
}
