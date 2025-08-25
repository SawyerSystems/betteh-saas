import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";

export default function ConfirmBookingPage() {
  const [, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when bookingId changes
    setIsLoading(true);
    setSuccess(null);
    setError(null);
    
    // No need to validate on load - we'll do that when they confirm
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [bookingId]);

  const handleConfirm = async () => {
    if (!bookingId) {
      setError("Missing booking ID");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/parent/confirm-booking', { bookingId });
      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || "Failed to confirm booking");
        setSuccess(false);
      }
    } catch (err) {
      console.error("Error confirming booking:", err);
      setError("Network error. Please try again.");
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = () => {
    // Redirect to parent dashboard or login page
    setLocation('/parent/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <SEOHead
          title="Confirm Booking — Coach Will Tumbles"
          description="Confirm your booking."
          canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/parent/confirm-booking` : '/parent/confirm-booking'}
          robots="noindex,follow"
          structuredData={{ '@context': 'https://schema.org', '@type': 'WebPage' }}
        />
        <div className="text-center">
          <img 
            src="/assets/betteh_logo_black_font.png" 
            alt="Loading" 
            className="mx-auto h-12 w-12 animate-spin" 
          />
          <h2 className="mt-4 text-xl font-semibold">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your booking information</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container max-w-md py-10">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="mt-4">Booking Confirmed!</CardTitle>
            <CardDescription>
              Thank you for confirming your booking with Coach Will Tumbles.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleReturn} className="w-full">
              Go to Parent Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Confirm Your Booking</CardTitle>
          <CardDescription>
            Please confirm your booking with Coach Will Tumbles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            By confirming this booking, you agree to attend the scheduled session.
          </p>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={handleConfirm}
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
