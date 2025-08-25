import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Loader2,
    Mail,
    User,
} from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";

export default function BookingSuccess() {
  const { toast } = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("session_id");
  const bookingId = urlParams.get("booking_id");
  const skipStripe = urlParams.get("skip_stripe") === "true";

  // Fetch dynamic site content for contact information
  const { data: siteContent } = useQuery({
    queryKey: ['/api/site-content'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/site-content');
      return response.json();
    }
  });

  // Fetch booking details using session ID or booking ID
  const { data: booking, isLoading, error, refetch } = useQuery({
    queryKey: sessionId ? ["/api/booking-by-session", sessionId] : ["/api/booking-by-id", bookingId],
    queryFn: async () => {
      if (sessionId) {
        const response = await apiRequest('GET', `/api/booking-by-session/${sessionId}`);
        if (!response.ok) {
          console.error(`Failed to fetch booking: ${response.status} ${response.statusText}`);
          throw new Error("Failed to fetch booking");
        }
        return response.json();
      } else if (bookingId) {
        const response = await apiRequest('GET', `/api/booking-by-id/${bookingId}`);
        if (!response.ok) {
          console.error(`Failed to fetch booking: ${response.status} ${response.statusText}`);
          throw new Error("Failed to fetch booking");
        }
        return response.json();
      }
      return null;
    },
    enabled: !!(sessionId || bookingId),
    retry: 3,
    retryDelay: 1000,
    // Increase staleTime to reduce unnecessary fetches
    staleTime: 5000,
    // But make sure we refetch when page is visible to get updated payment status
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    // Reset any booking state when user reaches success page
    window.scrollTo(0, 0);
    
    // If payment is already confirmed or this is a $0 reservation fee booking, no need to poll
    if (booking?.reservationFeePaid || skipStripe) {
      console.log("Payment already confirmed or $0 reservation fee, no need to poll");
      return;
    }
    
    // Set up a periodic refetch to catch any webhook updates
    // This ensures we get the latest payment status
    const refetchInterval = setInterval(() => {
      console.log("Refetching booking data to get updated payment status...");
      refetch();
    }, 5000); // Check every 5 seconds
    
    // Clear the interval after 1 minute (typical webhook processing time)
    const timeoutId = setTimeout(() => {
      clearInterval(refetchInterval);
      console.log("Stopped automatic refetching of booking data after timeout");
      // One final refetch
      refetch();
      
      // Show toast if payment is still pending after a minute
      if (!booking?.reservationFeePaid && !skipStripe) {
        toast({
          title: "Payment Status Update",
          description: "We're still processing your payment. You'll receive an email confirmation once complete.",
          variant: "default",
          duration: 10000,
        });
      }
    }, 60000);
    
    return () => {
      clearInterval(refetchInterval);
      clearTimeout(timeoutId);
    };
  }, [refetch, booking?.reservationFeePaid, skipStripe]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 dark:bg-gradient-to-br dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/assets/betteh_logo_black_font.png" 
            alt="Loading" 
            className="h-8 w-8 animate-spin mx-auto mb-4" 
          />
          <p className="text-gray-600 dark:text-gray-300">Loading your booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 dark:bg-gradient-to-br dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 dark:text-red-400 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Booking Details Unavailable</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We're having trouble loading your booking details, but your payment was successful!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You should receive a confirmation email shortly. If you have any questions, please contact us.
          </p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 dark:bg-[#D8BD2A] dark:hover:bg-[#D8BD2A]/90 dark:text-[#0F0276]">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!sessionId && !bookingId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 dark:bg-gradient-to-br dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid Booking Session</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            No booking information found. Please check your booking confirmation email or contact us for assistance.
          </p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 dark:bg-[#D8BD2A] dark:hover:bg-[#D8BD2A]/90 dark:text-[#0F0276]">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }
    
  // Handle both legacy and normalized athlete data
  const athleteNames = [];
  if (booking?.athletes && booking.athletes.length > 0) {
    // Normalized data
    athleteNames.push(...booking.athletes.map((athlete: any) => athlete.name));
  } else {
    // Legacy data
    if (booking?.athlete1Name) athleteNames.push(booking.athlete1Name);
    if (booking?.athlete2Name) athleteNames.push(booking.athlete2Name);
  }

  const formattedDate = booking?.preferredDate
    ? format(
        new Date(booking.preferredDate + "T00:00:00"),
        "EEEE, MMMM d, yyyy",
      )
    : "";

  // Calculate payment amounts correctly using lessonType price
  const totalLessonPrice = parseFloat(booking?.amount || booking?.lessonType?.price?.toString() || '0');
  const actualPaidAmount = parseFloat(booking?.paidAmount || '0');
  const remainingBalance = totalLessonPrice - actualPaidAmount;
  
  // Check if reservation fee has been paid based on the flag from the database
  const reservationFeePaid = booking?.reservationFeePaid === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 dark:bg-gradient-to-br dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black py-12 px-4">
      <SEOHead
        title="Booking Success — Coach Will Tumbles"
        description="Your booking was successful."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/booking-success` : window.location.origin + '/booking-success'}
        robots="noindex,follow"
        structuredData={{ "@context": "https://schema.org", "@type": "WebPage" }}
      />
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your reservation fee has been processed and your lesson is confirmed
          </p>
        </div>

        {/* Booking Details Card */}
        {booking && (
          <Card className="mb-6 dark:bg-[#2A4A9B]/30 dark:border-[#D8BD2A]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Calendar className="h-5 w-5 dark:text-[#D8BD2A]" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Athletes</p>
                    <p className="font-semibold dark:text-white">
                      {athleteNames.length > 0 ? athleteNames.join(", ") : "No athlete information available - please contact us"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                    <p className="font-semibold dark:text-white">{formattedDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                    <p className="font-semibold dark:text-white">{booking.preferredTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lesson Type</p>
                    <p className="font-semibold dark:text-white">{booking.lessonType?.name || "Lesson information not available"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Summary Card */}
        <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <DollarSign className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="dark:text-green-200">Lesson Total:</span>
                <span className="font-medium dark:text-green-200">${totalLessonPrice.toFixed(2)}</span>
              </div>
              
              {reservationFeePaid ? (
                <div className="flex justify-between text-sm text-green-700 dark:text-green-300">
                  <span>Reservation Fee Paid:</span>
                  <span className="font-medium">-${actualPaidAmount.toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-sm text-yellow-700 dark:text-yellow-300">
                  <span>Reservation Fee:</span>
                  <span className="font-medium">Payment processing...</span>
                </div>
              )}
              
              <div className="border-t pt-2 flex justify-between dark:border-green-700/30">
                <span className="font-semibold dark:text-green-200">Remaining Balance:</span>
                <span className="font-semibold dark:text-green-200">${remainingBalance.toFixed(2)}</span>
              </div>
              
              {/* Removed Payment ID display per product requirements */}
            </div>
            <p className="text-sm text-green-700 bg-green-100 dark:bg-green-800/30 dark:text-green-200 p-3 rounded">
              The remaining balance of ${remainingBalance} is due at the time of
              your lesson. Please bring cash or check for payment.
            </p>
          </CardContent>
        </Card>

        {/* What's Next Card */}
        <Card className="mb-6 dark:bg-[#2A4A9B]/30 dark:border-[#D8BD2A]/20">
          <CardHeader>
            <CardTitle className="dark:text-white">What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                  Confirmation Email
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Check your email for a detailed confirmation with all lesson
                  information.
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-[#0F0276]/20 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                Important Reminders:
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>Arrive on time for check-in</li>
                <li>Bring comfortable athletic clothing</li>
                <li>Water bottle recommended</li>
                <li>Remaining payment of ${remainingBalance} due at lesson</li>
                <li>Questions? Contact us at {siteContent?.contact?.phone || '(585) 755-8122'}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-orange-500 hover:bg-orange-600 dark:bg-[#D8BD2A] dark:hover:bg-[#D8BD2A]/90 dark:text-[#0F0276]">
            <Link href="/">Return to Home</Link>
          </Button>
          <Button asChild variant="outline" className="dark:border-[#D8BD2A]/40 dark:text-[#D8BD2A] dark:hover:bg-[#D8BD2A]/10">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>

        {/* Contact Info */}
        <div className="text-center mt-8 p-4 bg-white dark:bg-[#2A4A9B]/30 rounded-lg shadow-sm dark:border dark:border-[#D8BD2A]/20">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
            Coach Will Tumbles
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Phone: {siteContent?.contact?.phone || '(585) 755-8122'} | Email: {siteContent?.contact?.email || '{siteContent?.contact?.email || brand.contact.email}'}
          </p>
        </div>
      </div>
    </div>
  );
}
