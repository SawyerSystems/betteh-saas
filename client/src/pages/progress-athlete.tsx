import React from 'react';
import { useParams } from 'wouter';
import { useProgressByAthlete } from '@/hooks/useAthleteProgress';
import { useParentAuthStatus, useAuthStatus } from '@/hooks/optimized-queries';
import ProgressView from '@/components/progress/ProgressView';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Lock, User, Settings, Shield } from 'lucide-react';

// Reuse the same public UI but fetch by athleteId via session-auth
export default function ProgressAthletePage() {
  const params = useParams<{ athleteId: string }>();
  const athleteId = params?.athleteId ? Number(params.athleteId) : undefined;
  const { data, isLoading } = useProgressByAthlete(athleteId);
  const { data: parentAuth } = useParentAuthStatus();
  const { data: adminAuth } = useAuthStatus() as { data: { loggedIn?: boolean; adminId?: number; email?: string } | undefined };

  const isAdmin = adminAuth?.loggedIn || false;
  const isParent = parentAuth?.loggedIn || false;

  const handleParentDashboardClick = () => {
    if (parentAuth?.loggedIn) {
      window.location.href = '/parent';
    } else {
      window.location.href = '/parent/login';
    }
  };

  const handleAdminDashboardClick = () => {
    if (adminAuth?.loggedIn) {
      window.location.href = '/admin';
    } else {
      window.location.href = '/admin-login';
    }
  };

  if (!athleteId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full w-fit mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Invalid Request
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            No athlete ID was provided in the URL. Please check the link and try again.
          </p>
          <Button 
            onClick={() => window.history.back()}
            className="bg-[#0F0276] hover:bg-[#0F0276]/90 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <img 
              src="/CWT_Circle_LogoSPIN.png" 
              alt="CoachWillTumbles Logo" 
              className="h-16 w-16 mx-auto animate-spin"
            />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Loading Progress
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Please wait while we fetch the athlete's progress information...
          </p>
        </div>
      </div>
    );
  }

  if (!data?.athlete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The athlete profile you're trying to access was not found or you don't have permission to view it. This could be because:
          </p>
          <ul className="text-left text-sm text-slate-600 dark:text-slate-400 mb-6 space-y-2">
            <li className="flex items-start gap-2">
              <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              You're not logged in to the correct parent account
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              The athlete ID in the URL is incorrect
            </li>
            <li className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              This athlete is not associated with your account
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            {isAdmin ? (
              <Button 
                onClick={handleAdminDashboardClick}
                className="bg-[#0F0276] hover:bg-[#0F0276]/90 text-white"
              >
                <Shield className="h-4 w-4 mr-2" />
                {adminAuth?.loggedIn ? 'Admin Dashboard' : 'Admin Login'}
              </Button>
            ) : (
              <Button 
                onClick={handleParentDashboardClick}
                className="bg-[#0F0276] hover:bg-[#0F0276]/90 text-white"
              >
                <User className="h-4 w-4 mr-2" />
                {parentAuth?.loggedIn ? 'Parent Dashboard' : 'Parent Login'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <ProgressView data={data as any} isAdmin={isAdmin} />;
}
