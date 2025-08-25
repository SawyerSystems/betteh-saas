import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedBookingModal } from "@/components/UnifiedBookingModal";
import { ParentIdentificationEnhanced } from "@/components/parent-identification-enhanced";
import { useStripePricing } from "@/hooks/use-stripe-products";
import { apiRequest } from "@/lib/queryClient";
import type { Athlete, Parent } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { Link } from "wouter";

export default function BookingDemo() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showParentIdentificationModal, setShowParentIdentificationModal] = useState(false);
  const [parentData, setParentData] = useState<Parent | null>(null);
  const [selectedAthletes, setSelectedAthletes] = useState<Athlete[]>([]);
  const [isNewParent, setIsNewParent] = useState(false);
  const [demoMode] = useState(true); // Always in demo mode
  
  // Check parent authentication status
  const { data: parentAuth } = useQuery({
    queryKey: ['/api/parent-auth/status'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/parent-auth/status");
      return response.json();
    },
  });
  
  // Get parent bookings and athletes if logged in
  const { data: parentBookings } = useQuery({
    queryKey: ['/api/parent/bookings'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/parent/bookings");
      return response.json();
    },
    enabled: parentAuth?.loggedIn || false,
  });

  const { data: parentAthletes } = useQuery({
    queryKey: ['/api/parent/athletes'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/parent/athletes");
      return response.json();
    },
    enabled: parentAuth?.loggedIn || false,
  });

  // Get complete parent information for logged-in parents
  const { data: parentInfo, isLoading: parentInfoLoading, error: parentInfoError } = useQuery({
    queryKey: ['/api/parent/info'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/parent/info");
      return response.json();
    },
    enabled: parentAuth?.loggedIn || false,
  });
  
  // Debug log state changes
  useEffect(() => {
    console.log("Booking state updated:", { showBookingModal, parentData, selectedAthletes, isNewParent });
  }, [showBookingModal, parentData, selectedAthletes, isNewParent]);
  const { getLessonPrice } = useStripePricing();

  const handleBookNow = (lessonType?: string) => {
    console.log("handleBookNow called with:", {
      parentAuth,
      parentInfo,
      parentAthletes,
      parentInfoLoading,
      parentInfoError
    });
    
    // If parent is logged in but info is still loading, wait for it
    if (parentAuth?.loggedIn && parentInfoLoading) {
      console.log("Parent is logged in but info is loading, waiting...");
      return;
    }
    
    // Check if parent is logged in
    if (parentAuth?.loggedIn) {
      console.log("Parent is authenticated, using simplified approach");
      
      // If we have complete parent info from the API, use it directly
      if (parentInfo && !parentInfoError) {
        console.log("Using complete parent info from API");
        setParentData(parentInfo); // Use complete parent info directly
        // Do not preselect athletes; force explicit user selection
        setSelectedAthletes([]);
        setIsNewParent(false);
        setShowBookingModal(true);
      } else {
        // Fallback: Parent is logged in but full info not available
        // The UnifiedBookingModal will handle this via parentAuthStatus
        console.log("Parent is logged in but full info not available, letting modal handle via auth status");
        setParentData(null); // Let modal handle via auth status
        // Do not preselect athletes; force explicit user selection
        setSelectedAthletes([]);
        setIsNewParent(false);
        setShowBookingModal(true);
      }
    } else {
      // For non-logged in users, show parent identification modal first
      console.log("Showing parent identification modal for non-logged in user");
      setShowParentIdentificationModal(true);
    }
  };

  const handleParentConfirmed = (data: {
    parent: Parent;
    selectedAthletes: Athlete[];
    isNewParent: boolean;
  }) => {
    console.log("Parent confirmed in booking.tsx:", data);
    setParentData(data.parent);
    setSelectedAthletes(data.selectedAthletes);
    setIsNewParent(data.isNewParent);
    setShowParentIdentificationModal(false);
    setShowBookingModal(true);
  };

  return (
    <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm md:text-base font-medium">
            🎯 <strong>Demo Mode:</strong> Experience the parent booking flow your athletes' families will use
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 dark:from-slate-800/40 dark:via-slate-900/30 dark:to-slate-900/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Experience the Parent Booking Flow
          </h1>
          <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto mb-8">
            See what your athletes' families will experience when booking lessons. This interactive demo shows the complete parent journey from lesson selection to payment.
          </p>
          <SEOHead
            title="Experience Parent Booking Flow | Betteh SaaS Platform Demo"
            description="See how parents book lessons with coaches using Betteh. Interactive demo of the booking experience you'll provide to your athletes' families."
            canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/booking-demo` : '/booking-demo'}
            robots="index,follow"
            structuredData={[
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Betteh Booking Demo",
                "description": "Interactive demonstration of parent booking experience in the Betteh coaching platform.",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "url": typeof window !== 'undefined' ? `${window.location.origin}/booking-demo` : '/booking-demo'
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": typeof window !== 'undefined' ? window.location.origin : '/' },
                  { "@type": "ListItem", "position": 2, "name": "Demo Experience", "item": typeof window !== 'undefined' ? `${window.location.origin}/booking-demo` : '/booking-demo' }
                ]
              }
            ]}
          />
          <Button 
            size="lg"
            className="gradient-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transform transition-all duration-200 shadow-lg"
            onClick={() => {
              console.log("Demo booking button clicked");
              handleBookNow();
            }}
            disabled={parentAuth?.loggedIn && parentInfoLoading}
          >
            <Calendar className="h-5 w-5 mr-2" />
            {parentAuth?.loggedIn && parentInfoLoading ? "Loading..." : "🎯 Try the Demo Booking"}
          </Button>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
            Experience the complete parent booking journey
          </p>
        </div>
      </section>

      {/* Demo Features Section */}
      <section className="py-16 lg:py-24 bg-white dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              What You'll Experience in the <span className="gradient-text">Demo</span>
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
              This interactive demo shows the complete parent booking experience your athletes' families will have with Betteh.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Parent Registration",
                description: "Seamless account creation with email verification",
                icon: "👤",
                color: "from-blue-500 to-cyan-500"
              },
              {
                title: "Athlete Profiles",
                description: "Easy athlete management and information collection", 
                icon: "🏃‍♂️",
                color: "from-cyan-500 to-emerald-500"
              },
              {
                title: "Lesson Selection",
                description: "Choose from lesson types with clear pricing",
                icon: "🎯",
                color: "from-emerald-500 to-blue-500"
              },
              {
                title: "Focus Areas",
                description: "Customize training goals and skill priorities",
                icon: "🎪",
                color: "from-blue-500 to-cyan-500"
              },
              {
                title: "Schedule Booking",
                description: "Interactive calendar with available time slots",
                icon: "📅",
                color: "from-cyan-500 to-emerald-500"
              },
              {
                title: "Secure Payment",
                description: "Stripe-powered payment processing (demo mode)",
                icon: "💳",
                color: "from-emerald-500 to-blue-500"
              }
            ].map((item, index) => (
              <Card key={index} className="glass-surface glass-card hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-slate-200 dark:border-slate-700">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mx-auto mb-4 text-3xl`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">{item.title}</h3>
                  <p className="text-slate-700 dark:text-slate-300">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Matters Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800/40 dark:to-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Why This <span className="gradient-text">Experience</span> Matters
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
              Your athletes' families expect a professional, streamlined booking experience. Betteh delivers exactly that.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                {
                  title: "First Impressions Matter",
                  description: "A polished booking experience builds trust before the first lesson"
                },
                {
                  title: "Reduce Administrative Time", 
                  description: "Automated collection of athlete info, waivers, and payments"
                },
                {
                  title: "Increase Booking Conversion",
                  description: "Smooth, mobile-friendly process encourages completion"
                },
                {
                  title: "Professional Brand Image",
                  description: "Elevate your coaching business with enterprise-level tools"
                }
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{item.title}</h3>
                    <p className="text-slate-700 dark:text-slate-300">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Card className="glass-surface glass-card p-8 border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6 text-center">
                <div className="text-6xl mb-6">📊</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Real Results</h3>
                <div className="space-y-4">
                  <div className="text-3xl font-bold gradient-text">73%</div>
                  <p className="text-slate-700 dark:text-slate-300">Higher booking completion rate with professional booking systems</p>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-2xl font-bold gradient-text">2.5 hrs/week</div>
                  <p className="text-slate-700 dark:text-slate-300">Average time saved on administrative tasks</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Parent Booking Flow Walkthrough Section (SaaS focused) */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-slate-50 to-cyan-50 dark:from-slate-800/40 dark:via-slate-900/30 dark:to-slate-900/60">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Parent Booking Flow <span className="gradient-text">Walkthrough</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300">
              This is what a modern, trust-building booking experience feels like. Each step is optimized to reduce friction, collect complete data, and increase conversion.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Step-by-step column */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold">1</span>
                Parent Entry & Identity
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Parents either confirm their existing account via magic code or seamlessly create a new profile. We capture essential contact data up front so abandoned flows still add value.
              </p>
              <div className="pl-10 space-y-4">
                {[
                  'Email-based authentication (no password friction)',
                  'Progressive disclosure for additional info',
                  'Duplicate prevention + account linking'
                ].map(b => (
                  <div key={b} className="flex items-start gap-3">
                    <div className="mt-1 w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
                    <span className="text-slate-600 dark:text-slate-300 text-sm">{b}</span>
                  </div>
                ))}
              </div>

              <h3 className="pt-4 text-xl font-semibold tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                Athlete Selection / Creation
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Parents can attach one or multiple athletes to a booking. New athlete creation enforces structured fields for downstream progress tracking.
              </p>
              <div className="pl-10 space-y-4">
                {[
                  'Multi-athlete support in a single checkout',
                  'Age, experience, focus areas captured cleanly',
                  'Remembers previous athletes for faster repeat bookings'
                ].map(b => (
                  <div key={b} className="flex items-start gap-3">
                    <div className="mt-1 w-4 h-4 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" />
                    <span className="text-slate-600 dark:text-slate-300 text-sm">{b}</span>
                  </div>
                ))}
              </div>

              <h3 className="pt-4 text-xl font-semibold tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                Lesson & Time Selection
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Real-time availability, capacity rules, and conflict detection prevent double-bookings while keeping the interface fast and intuitive.
              </p>
              <div className="pl-10 space-y-4">
                {[
                  'Dynamic availability matrix',
                  'Smart filtering by athlete level / focus',
                  'Capacity + waitlist ready architecture'
                ].map(b => (
                  <div key={b} className="flex items-start gap-3">
                    <div className="mt-1 w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" />
                    <span className="text-slate-600 dark:text-slate-300 text-sm">{b}</span>
                  </div>
                ))}
              </div>

              <h3 className="pt-4 text-xl font-semibold tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold">4</span>
                Waivers, Payment & Confirmation
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Secure Stripe checkout + digital waivers finalize the booking and instantly sync parent + athlete data to the coaching workspace.
              </p>
              <div className="pl-10 space-y-4">
                {[
                  'PCI-compliant hosted checkout',
                  'Automatic waiver association to athletes',
                  'Instant booking + receipt + upcoming session context'
                ].map(b => (
                  <div key={b} className="flex items-start gap-3">
                    <div className="mt-1 w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" />
                    <span className="text-slate-600 dark:text-slate-300 text-sm">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* UX Principles / Outcomes */}
            <div className="space-y-8">
              <div className="p-6 rounded-2xl glass-surface glass-card border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Built-In Conversion Principles</h3>
                <ul className="space-y-3 text-sm">
                  {[
                    'Low-friction authentication',
                    'Minimal cognitive load per step',
                    'Progress continuity on refresh',
                    'Error states with recovery paths',
                    'Mobile-first interaction spacing'
                  ].map(i => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
                      <span className="text-slate-600 dark:text-slate-300">{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 rounded-2xl glass-surface glass-card border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Operational Benefits</h3>
                <ul className="space-y-3 text-sm">
                  {[
                    'Cleaner data → better athlete development logs',
                    'Reduced admin back-and-forth',
                    'Lower no‑show rates via structured confirmation',
                    'Scales from solo coach → multi-staff org',
                    'Audit-friendly unified booking records'
                  ].map(i => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500" />
                      <span className="text-slate-600 dark:text-slate-300">{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg">
                <h3 className="text-lg font-semibold mb-3">Try It Live</h3>
                <p className="text-sm opacity-90 mb-4">Open the booking flow and step through as a parent. Nothing here will charge you—it's safe demo data.</p>
                <Button size="sm" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold" onClick={() => handleBookNow()}>
                  Launch Demo Booking
                </Button>
              </div>
            </div>

            {/* Visual / Explanation Card */}
            <div className="flex flex-col gap-6">
              <Card className="glass-surface glass-card border border-slate-200 dark:border-slate-700 flex-1">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Why This Matters</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    Parents compare experiences subconsciously. A fragmented or manual booking process signals disorganization. A guided, polished flow signals professionalism, safety, and reliability—leading to higher retention and referrals.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      { label: 'Completion Rate Lift', value: '+18%' },
                      { label: 'Avg Admin Time Saved', value: '2.5 hrs/wk' },
                      { label: 'Parent Data Accuracy', value: '↑ Consistent' },
                      { label: 'Multi-Athlete Efficiency', value: '1 flow' }
                    ].map(m => (
                      <div key={m.label} className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/40 backdrop-blur border border-slate-200 dark:border-slate-700">
                        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{m.label}</div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{m.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-surface glass-card border border-slate-200 dark:border-slate-700 flex-1">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Designed For Scale</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    This exact flow adapts as you grow—whether you add staff, expand programs, or introduce tiered offerings. The data model behind it (multi-athlete bookings, parent identity layer, structured lesson types) prevents costly rewrites later.
                  </p>
                  <ul className="space-y-3 text-sm">
                    {[
                      'Multi-location ready',
                      'Supports recurring + drop-in models',
                      'Analytics hooks for funnel tracking',
                      'Extensible waiver + policy framework'
                    ].map(i => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" />
                        <span className="text-slate-600 dark:text-slate-300">{i}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Demo CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Offer This Experience to Your Athletes?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Betteh provides this complete booking system plus scheduling, payments, progress tracking, and business analytics for sports coaches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 font-semibold rounded-xl">
              <Link href="/pricing">Start Free Trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 font-semibold rounded-xl">
              <Link href="/features">View All Features</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />

      <ParentIdentificationEnhanced
        isOpen={showParentIdentificationModal}
        onClose={() => setShowParentIdentificationModal(false)}
        onParentConfirmed={handleParentConfirmed}
      />

      <UnifiedBookingModal
        isOpen={showBookingModal}
        onClose={() => {
          console.log("Booking modal closing");
          setShowBookingModal(false);
          setParentData(null);
          setSelectedAthletes([]);
          setIsNewParent(false);
        }}
        parentData={parentData || undefined}
        selectedAthletes={selectedAthletes}
        isNewParent={isNewParent}
      />
    </div>
  );
}
