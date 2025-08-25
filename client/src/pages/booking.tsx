import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedBookingModal } from "@/components/UnifiedBookingModal";
import { ParentIdentificationEnhanced } from "@/components/parent-identification-enhanced";
import { useStripePricing } from "@/hooks/use-stripe-products";
// import { LESSON_TYPES } from "@/lib/constants";
import { useLessonTypes } from "@/hooks/useLessonTypes";
import { apiRequest } from "@/lib/queryClient";
import type { Athlete, Parent } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle, Clock, Mail, MapPin, Phone, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";

export default function Booking() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showParentIdentificationModal, setShowParentIdentificationModal] = useState(false);
  const [parentData, setParentData] = useState<Parent | null>(null);
  const [selectedAthletes, setSelectedAthletes] = useState<Athlete[]>([]);
  const [isNewParent, setIsNewParent] = useState(false);
  
  // Define ordered days for consistent display
  const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Fetch site content for hours of operation
  const { data: siteContent } = useQuery({
    queryKey: ['/api/site-content'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/site-content");
      return response.json();
    },
  });
  
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
  const { data: lessonTypes } = useLessonTypes();

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
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 dark:from-slate-800/40 dark:via-slate-900/30 dark:to-slate-900/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Start Your Athlete's Journey
          </h1>
          <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto mb-8">
            Every athlete begins somewhere. Whether it's their first handstand or they're chasing a new tumbling pass, we'll build a personalized plan that helps them grow with confidence.
          </p>
          <SEOHead
            title="Book Private Gymnastics & Tumbling Lessons in Oceanside, CA"
            description="Reserve 1:1 or semi-private gymnastics, tumbling, and cheer stunt sessions with Coach Will in Oceanside, CA. Flexible scheduling and safe, supportive coaching."
            canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/booking` : 'https://www.coachwilltumbles.com/booking'}
            robots="index,follow"
            structuredData={[
              {
                "@context": "https://schema.org",
                "@type": "Service",
                "name": "Private Gymnastics Lessons",
                "areaServed": { "@type": "City", "name": "Oceanside" },
                "provider": {
                  "@type": ["LocalBusiness", "SportsActivityLocation"],
                  "name": "Coach Will Tumbles",
                  "telephone": "(585) 755-8122",
                  "email": "admin@coachwilltumbles.com",
                  "priceRange": "$$",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "1935 Ave. del Oro #A",
                    "addressLocality": "Oceanside",
                    "addressRegion": "CA",
                    "postalCode": "92056",
                    "addressCountry": "US"
                  },
                  "sameAs": [
                    "https://www.facebook.com/coachwilltumbles",
                    "https://www.instagram.com/coachwilltumbles",
                    "https://www.youtube.com/@coachwilltumbles"
                  ]
                },
                "serviceType": ["Gymnastics", "Tumbling", "Cheer Stunt"],
                "offers": { "@type": "Offer", "priceCurrency": "USD" }
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": typeof window !== 'undefined' ? window.location.origin : 'https://www.coachwilltumbles.com' },
                  { "@type": "ListItem", "position": 2, "name": "Booking", "item": typeof window !== 'undefined' ? `${window.location.origin}/booking` : 'https://www.coachwilltumbles.com/booking' }
                ]
              },
              // Optional FAQPage to boost rich results; content is non-visual
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What ages do you coach?",
                    "acceptedAnswer": { "@type": "Answer", "text": "We coach kids and teens of all levels, from beginners to competitive athletes." }
                  },
                  {
                    "@type": "Question",
                    "name": "Do you offer semi-private lessons?",
                    "acceptedAnswer": { "@type": "Answer", "text": "Yes, you can book 1:1 or semi-private sessions depending on your preference." }
                  },
                  {
                    "@type": "Question",
                    "name": "Where are lessons held?",
                    "acceptedAnswer": { "@type": "Answer", "text": "At Oceanside Gymnastics, 1935 Ave. del Oro #A, Oceanside, CA 92056." }
                  },
                  {
                    "@type": "Question",
                    "name": "Do you offer private gymnastics lessons in Oceanside, CA?",
                    "acceptedAnswer": { "@type": "Answer", "text": "Yes, we offer private gymnastics lessons in Oceanside, CA with flexible scheduling for families." }
                  },
                  {
                    "@type": "Question",
                    "name": "Is Coach Will a private tumbling coach in Oceanside?",
                    "acceptedAnswer": { "@type": "Answer", "text": "Yes, Coach Will provides private tumbling coaching for cheerleaders and gymnasts in Oceanside." }
                  },
                  {
                    "@type": "Question",
                    "name": "Do you coach cheer stunt technique?",
                    "acceptedAnswer": { "@type": "Answer", "text": "We offer cheer stunt coaching focused on safe technique, progressions, and confidence building." }
                  },
                  {
                    "@type": "Question",
                    "name": "Do you teach kids who are brand new to tumbling?",
                    "acceptedAnswer": { "@type": "Answer", "text": "Absolutely—beginners are welcome. We build strong foundations at a comfortable pace." }
                  }
                ]
              }
            ]}
          />
          <Button 
            size="lg"
            className="gym-gradient-blue text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transform transition-all duration-200 shadow-lg"
            onClick={() => {
              console.log("Begin Journey button clicked");
              handleBookNow();
            }}
            disabled={parentAuth?.loggedIn && parentInfoLoading}
          >
            <Calendar className="h-5 w-5 mr-2" />
            {parentAuth?.loggedIn && parentInfoLoading ? "Loading..." : "Begin Journey"}
          </Button>
        </div>
      </section>

      {/* Lesson Types */}
  <section className="py-16 lg:py-24 bg-gray-50 dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Choose a <span className="text-purple-600">Lesson Path</span>
            </h2>
    <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
              Select the journey that fits your schedule and goals. Whether it's 1-on-1 focus or shared learning with a teammate, each session is personalized to match your athlete's level, style, and progress pace.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(lessonTypes || []).map((lt, idx) => {
              const key = lt.name.toLowerCase().replace(/\s+/g, '-');

              const iconClasses = {
                blue: "bg-blue-600",
                purple: "bg-purple-600", 
                teal: "bg-teal-600",
                orange: "bg-orange-600"
              };

              const buttonClasses = {
                blue: "bg-blue-600 hover:bg-blue-700",
                purple: "bg-purple-600 hover:bg-purple-700",
                teal: "bg-teal-600 hover:bg-teal-700", 
                orange: "bg-orange-600 hover:bg-orange-700"
              };

              const palette = ["blue", "purple", "teal", "orange"] as const;
              const color = palette[idx % palette.length];

              return (
                <Card 
                  key={key}
                  className={`glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 ${iconClasses[color]} rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-gentle`}>
                      {lt.maxAthletes === 1 ? (
                        <User className="h-8 w-8 text-white" />
                      ) : (
                        <Users className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{lt.name}</h3>
                    <div className={`text-3xl font-bold mb-4 ${color === 'blue' ? 'text-blue-600' : color === 'purple' ? 'text-purple-600' : color === 'teal' ? 'text-teal-600' : 'text-orange-600'}`}>
                      ${lt.price}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-6">{lt.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-center text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle className="h-4 w-4 text-teal-600 mr-2" />
                        <span>{lt.maxAthletes} Athlete{lt.maxAthletes > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center justify-center text-sm text-slate-700 dark:text-slate-300">
                        <Clock className="h-4 w-4 text-teal-600 mr-2" />
                        <span>{lt.duration} Minutes</span>
                      </div>
                      <div className="flex items-center justify-center text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle className="h-4 w-4 text-teal-600 mr-2" />
                        <span>Up to {lt.duration >= 60 ? 4 : 2} Focus Areas</span>
                      </div>
                      <div className="flex items-center justify-center text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle className="h-4 w-4 text-teal-600 mr-2" />
                        <span>Progress Report Included</span>
                      </div>
                    </div>
                    
                    <Button 
                      className={`w-full ${buttonClasses[color]} text-white py-3 rounded-full font-medium transform transition-all duration-200`}
                      onClick={() => handleBookNow(key)}
                    >
                      Start This Path
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Side Quests Section */}
  <section className="py-16 lg:py-24 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-slate-800/40 dark:to-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              <span className="text-orange-600">Side Quests</span>
            </h2>
    <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto mb-8">
              Each journey can include optional Side Quests that help athletes grow in areas beyond the mat. These can be selected as add-ons or embedded into any session depending on your athlete's goals:
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {[
              { name: "Flexibility Training", icon: "🧘‍♂️", color: "from-purple-100 to-purple-200 border-purple-300" },
              { name: "Strength Conditioning", icon: "💪", color: "from-red-100 to-red-200 border-red-300" },
              { name: "Agility & Quickness Drills", icon: "⚡", color: "from-blue-100 to-blue-200 border-blue-300" },
              { name: "Meditation & Breathing Techniques", icon: "🌬️", color: "from-teal-100 to-teal-200 border-teal-300" },
              { name: "Overcoming Mental Blocks", icon: "🧠", color: "from-indigo-100 to-indigo-200 border-indigo-300" }
            ].map((quest, index) => (
      <Card key={index} className={`glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700 text-center hover:shadow-lg transform hover:scale-105 transition-all duration-300`}>
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{quest.icon}</div>
      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{quest.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
    <p className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
              These quests unlock confidence, focus, and body control—essential ingredients for any successful athlete.
            </p>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
  <section className="py-16 lg:py-24 bg-gray-50 dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              What Comes With Every <span className="text-teal-600">Journey</span>
            </h2>
    <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
              Every step is supported by the tools, environment, and coaching style your child needs to thrive.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Professional Equipment",
                description: "Full-sized & kid-friendly gear for all levels",
                icon: "🤸‍♀️"
              },
              {
                title: "Safety Gear",
                description: "Spotting techniques and padding included",
                icon: "🛡️"
              },
              {
                title: "Progress-Based Planning",
                description: "Skill development tracked each week",
                icon: "📈"
              },
              {
                title: "Flexible Scheduling",
                description: "We work around your needs",
                icon: "📅"
              },
              {
                title: "Positive Environment",
                description: "Respect, trust, and encouragement always",
                icon: "🎉"
              }
            ].map((item, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow duration-300 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">{item.title}</h3>
                  <p className="text-slate-700 dark:text-slate-300">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Contact Info */}
  <section className="py-16 lg:py-24 bg-white dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Where & When We <span className="text-orange-600">Train</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
    <Card className="p-8 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Training Location</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      {siteContent?.contact?.address ? (
                        <>
          <p className="font-semibold text-slate-900 dark:text-slate-100">🏛️ {siteContent.contact.address.name}</p>
          <p className="text-slate-700 dark:text-slate-300">
                            {siteContent.contact.address.street}<br/>
                            {siteContent.contact.address.city}, {siteContent.contact.address.state} {siteContent.contact.address.zip}
                          </p>
                        </>
                      ) : (
                        <>
          <p className="font-semibold text-slate-900 dark:text-slate-100">🏛️ Oceanside Gymnastics</p>
          <p className="text-slate-700 dark:text-slate-300">1935 Ave. del Oro #A<br/>Oceanside, CA 92056</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-blue-600" />
        <p className="text-slate-700 dark:text-slate-300">
                      📞 {siteContent?.contact?.phone || '(585) 755-8122'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
        <p className="text-slate-700 dark:text-slate-300">
                      📧 {siteContent?.contact?.email || 'admin@coachwilltumbles.com'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

    <Card className="p-8 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Hours of Operation</h3>
                <div className="space-y-4">
                  {siteContent?.hours?.hours ? (
                    // Display saved hours from admin dashboard in proper order
                    orderedDays.map((day) => {
                      const dayKey = day.toLowerCase();
                      const times = siteContent.hours.hours[dayKey];
                      
                      // Handle available flag and format times
                      if (typeof times === 'object' && times !== null) {
                        if (!times.available) {
                          return (
                            <div key={day} className="flex justify-between items-center">
                              <span className="font-medium text-slate-900 dark:text-slate-100">{day}</span>
                              <span className="text-slate-700 dark:text-slate-300">Closed</span>
                            </div>
                          );
                        }
                        
                        // Format times from 24-hour to 12-hour format
                        const formatTime = (timeStr: string) => {
                          if (!timeStr) return '';
                          const [hours, minutes] = timeStr.split(':');
                          const hour = parseInt(hours);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                          return `${displayHour}:${minutes} ${ampm}`;
                        };
                        
                        const startTime = formatTime(times.start || '');
                        const endTime = formatTime(times.end || '');
                        const timeDisplay = startTime && endTime ? `${startTime} – ${endTime}` : 'Ask us about availability';
                        
                        return (
                          <div key={day} className="flex justify-between items-center">
                            <span className="font-medium text-slate-900 dark:text-slate-100">{day}</span>
                            <span className="text-slate-700 dark:text-slate-300">{timeDisplay}</span>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={day} className="flex justify-between items-center">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{day}</span>
                          <span className="text-slate-700 dark:text-slate-300">Ask us about availability</span>
                        </div>
                      );
                    })
                  ) : (
                    // Fallback hardcoded hours if site content not available
                    <>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900 dark:text-slate-100">Monday, Wednesday, Friday</span>
                        <span className="text-slate-700 dark:text-slate-300">9:00 AM – 4:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900 dark:text-slate-100">Tuesday, Thursday</span>
                        <span className="text-slate-700 dark:text-slate-300">9:00 AM – 3:30 PM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900 dark:text-slate-100">Saturday</span>
                        <span className="text-slate-700 dark:text-slate-300">10:00 AM – 2:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900 dark:text-slate-100">Sunday</span>
                        <span className="text-slate-700 dark:text-slate-300">Ask us about availability</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-slate-800/50 rounded-lg border border-blue-100 dark:border-slate-700">
                  <p className="text-sm text-blue-800 dark:text-slate-200">
                    <strong>Note:</strong> Lesson times are flexible within operating hours. 
                    We'll work with you to find the perfect time slot for your family.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-teal-600 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Let's Begin the Journey
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            We believe in building confident, strong athletes—and it all starts here.  
            No pressure. No hard sales. Just a conversation and a first step forward.
          </p>
          <Button 
            size="lg"
            className="bg-white text-teal-600 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transform transition-all duration-200 shadow-lg hover:bg-gray-100"
            onClick={() => handleBookNow()}
          >
            <Calendar className="h-5 w-5 mr-2" />
            Start Your Athlete's Journey
          </Button>
        </div>
      </section>

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

      <Footer />
    </div>
  );
}
