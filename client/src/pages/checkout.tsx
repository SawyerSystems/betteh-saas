import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from "wouter";
import SEOHead from "@/components/SEOHead";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ bookingDetails }: { bookingDetails: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking-success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Your lesson has been booked!",
      });
      setLocation("/");
    }
    
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Complete Your Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Booking Summary</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Lesson:</span> {bookingDetails?.lessonType}</p>
                <p><span className="font-medium">Athlete:</span> {bookingDetails?.athlete1Name}</p>
                <p><span className="font-medium">Date:</span> {bookingDetails?.preferredDate}</p>
                <p><span className="font-medium">Time:</span> {bookingDetails?.preferredTime}</p>
                <p><span className="font-medium">Total:</span> ${bookingDetails?.reservationFee || '0.00'} (Reservation Fee)</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <PaymentElement />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!stripe || isLoading}
              >
                {isLoading ? "Processing..." : `Pay $${bookingDetails?.reservationFee || '0.50'} Reservation Fee`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    // Load booking details from localStorage
    const storedBooking = localStorage.getItem('currentBooking');
    const testPayment = localStorage.getItem('testPayment');
    
    if (storedBooking) {
      // Real booking from booking modal
      const booking = JSON.parse(storedBooking);
      setBookingDetails(booking);
      setClientSecret(booking.clientSecret);
    } else if (testPayment) {
      // Test payment from /test-payments page
      const payment = JSON.parse(testPayment);
      setBookingDetails(payment);
      setClientSecret(payment.clientSecret);
    } else {
      // No booking found, redirect to home
      window.location.href = '/';
    }
  }, []);

  if (!clientSecret || !bookingDetails) {
    return (
      <div className="h-screen flex items-center justify-center">
        <img src="/CWT_Circle_LogoSPIN.png" alt="Loading" className="animate-spin w-8 h-8" aria-label="Loading"/>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <SEOHead
        title="Checkout — Coach Will Tumbles"
        description="Secure checkout for your lesson reservation."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/checkout` : 'https://www.coachwilltumbles.com/checkout'}
        robots="noindex,follow"
        structuredData={{ "@context": "https://schema.org", "@type": "WebPage" }}
      />
      <CheckoutForm bookingDetails={bookingDetails} />
    </Elements>
  );
}