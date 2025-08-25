import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";

export default function ParentSetupSuccess() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState<string>("");

  // Extract email from query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 p-4">
      <SEOHead
        title="Account Created — Coach Will Tumbles"
        description="Parent account created."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/parent-setup-success` : '/parent-setup-success'}
        robots="noindex,follow"
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebPage' }}
      />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Account Created Successfully</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Your parent account has been created. A password setup email has been sent to your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
            <Mail className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">Check Your Email</h3>
              <p className="text-sm text-blue-700">
                {email ? (
                  <>
                    We've sent instructions to <span className="font-medium">{email}</span>. Click the link in the email to set your password and access your account.
                  </>
                ) : (
                  <>
                    We've sent instructions to your email address. Click the link in the email to set your password and access your account.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">What to do next:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="bg-green-100 text-green-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                <span>Check your email inbox (and spam folder)</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-100 text-green-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                <span>Click the link in the email to set your password</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-100 text-green-800 rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                <span>Log in to your account to view your bookings and athlete information</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Home
            </Button>
            <Button 
              className="bg-[#0F0276] hover:bg-[#0F0276]/90"
              onClick={() => setLocation("/parent/login")}
            >
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
