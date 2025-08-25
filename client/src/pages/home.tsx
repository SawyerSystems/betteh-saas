import * as React from "react";
import SEOHead from "@/components/SEOHead";
import { useState, useEffect } from "react";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedBookingModal } from "@/components/UnifiedBookingModal";
import { ParentIdentificationEnhanced } from "@/components/parent-identification-enhanced";
import { useStripePricing } from "@/hooks/use-stripe-products";
import { apiRequest } from "@/lib/queryClient";
import type { Athlete, Parent } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Dumbbell,
  Heart,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap
} from "lucide-react";
// hooks imported via combined React import above
import { Link } from "wouter";
import { useBrand, useBrandBackgrounds } from "@/hooks/useBrand";

export default function Home() {
  const brand = useBrand();
  const backgrounds = useBrandBackgrounds();
  const [showParentModal, setShowParentModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showParentIdentificationModal, setShowParentIdentificationModal] = useState(false);
  const [parentData, setParentData] = useState<Parent | null>(null);
  const [selectedAthletes, setSelectedAthletes] = useState<Athlete[]>([]);
  const [isNewParent, setIsNewParent] = useState(false);
  const { getLessonPrice } = useStripePricing();
  // Light/Dark mode toggle for testing glassmorphism
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  // apply theme class on root element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Check if parent is already logged in
  const { data: parentAuth } = useQuery<{ loggedIn: boolean; parentId?: number; email?: string }>({
    queryKey: ['/api/parent-auth/status'],
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

  // Fetch site content for dynamic content
  const { data: siteContent } = useQuery({
    queryKey: ['/api/site-content'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/site-content");
      return response.json();
    },
  });

  // Get parent athletes for logged-in parents
  const { data: parentAthletes } = useQuery({
    queryKey: ['/api/parent/athletes'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/parent/athletes");
      return response.json();
    },
    enabled: parentAuth?.loggedIn || false,
  });

  const handleStartBooking = () => {
    // If parent is logged in but info is still loading, wait for it
    if (parentAuth?.loggedIn && parentInfoLoading) {
      return;
    }
    
    // Check if parent is logged in
    if (parentAuth?.loggedIn) {
      // If we have complete parent info from the API, use it directly
      if (parentInfo && !parentInfoError) {
        setParentData(parentInfo); // Use complete parent info directly
        // Do not preselect athletes; require explicit selection in flow
        setSelectedAthletes([]);
        setIsNewParent(false);
        setShowBookingModal(true);
      } else {
        // Fallback: Parent is logged in but full info not available
        // The UnifiedBookingModal will handle this via parentAuthStatus
        setParentData(null); // Let modal handle via auth status
        // Do not preselect athletes; require explicit selection in flow
        setSelectedAthletes([]);
        setIsNewParent(false);
        setShowBookingModal(true);
      }
    } else {
      // For non-logged in users, show parent identification modal first
      setShowParentIdentificationModal(true);
    }
  };

  // Handle parent confirmation from ParentIdentificationEnhanced
  const handleParentConfirmed = (data: {
    parent: Parent;
    selectedAthletes: Athlete[];
    isNewParent: boolean;
  }) => {
    setParentData(data.parent);
    setSelectedAthletes(data.selectedAthletes);
    setIsNewParent(data.isNewParent);
    setShowBookingModal(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <SEOHead
        title={`${brand.platformName} | Professional Platform for Sports Coaches`}
        description={`${brand.platformTagline}. Book lessons, manage athletes, and grow your coaching business with our comprehensive platform.`}
        canonicalUrl={typeof window !== 'undefined' 
          ? (window.location.pathname === '/index.html' 
              ? `${window.location.origin}/index.html` 
              : `${window.location.origin}/`)
          : brand.contact.website || 'https://betteh.com'
        }
        robots="index,follow"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "url": typeof window !== 'undefined' ? window.location.origin : brand.contact.website,
            "name": brand.platformName,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${typeof window !== 'undefined' ? window.location.origin : brand.contact.website}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": `${brand.platformName} Platform`,
            "url": typeof window !== 'undefined' ? window.location.origin : brand.contact.website,
            "description": brand.platformTagline,
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser"
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: brand.platformName,
            url: typeof window !== 'undefined' ? window.location.origin : brand.contact.website,
            description: brand.platformTagline,
            foundingDate: "2024"
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": typeof window !== 'undefined' ? window.location.origin : brand.contact.website }
            ]
          }
        ]}
      />

      {/* Hero Section - Clean Betteh Design */}
      <section className="relative overflow-hidden min-h-screen flex items-center bg-white dark:bg-gray-900">
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Text Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-black dark:text-white leading-tight">
                    The Future of
                    <span className="block text-black dark:text-white">
                      Sports Coaching
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
                    {brand.platformTagline}. Streamline your business, track athlete progress, and grow with confidence.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg"
                    className="bg-black hover:bg-gray-800 text-white px-8 py-4 font-semibold text-lg rounded-xl shadow-lg"
                    onClick={handleStartBooking}
                    disabled={parentAuth?.loggedIn && parentInfoLoading}
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    {parentAuth?.loggedIn && parentInfoLoading ? "Loading..." : "Start Free Trial"}
                  </Button>
                  <Link href="/about">
                    <Button 
                      variant="outline"
                      size="lg"
                      className="border-black text-black dark:text-white dark:border-white hover:bg-gray-100 dark:hover:bg-white/10 px-8 py-4 font-semibold text-lg rounded-xl"
                    >
                      <Trophy className="h-5 w-5 mr-2" />
                      Learn More
                    </Button>
                  </Link>
                </div>
                
                <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-300">
                  {['Coach‑Led Design','Secure Architecture','Data Visibility','Frictionless Payments'].map(t => (
                    <div key={t} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-black dark:text-white" /> 
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Visual Content */}
              <div className="relative">
                <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-black dark:bg-white flex items-center justify-center">
                        <Activity className="h-6 w-6 text-white dark:text-black" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-black dark:text-white">All-in-One Platform</h3>
                        <p className="text-gray-600 dark:text-gray-300">Everything you need in one place</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {['Scheduling', 'Payments', 'Progress', 'Analytics'].map((feature) => (
                        <div key={feature} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                          <span className="font-medium text-black dark:text-white">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Platform Status</span>
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">● Online</span>
                      </div>
                      <div className="text-2xl font-bold text-black dark:text-white">99.9% Uptime</div>
                    </div>
                  </div>
                </div>
                
                {/* Background decoration */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full opacity-50"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full opacity-30"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-16 lg:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive <span className="text-black">Gymnastics Training</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From foundational skills to advanced techniques across all gymnastics disciplines
            </p>
          </div>

          {/* Training Areas */}
          <Card className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg mb-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">All Apparatus Training</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">Professional instruction across every gymnastics discipline</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {["Floor Exercise", "Balance Beam", "Uneven Bars", "Vault", "Trampoline", "Tumble Track"].map((apparatus) => (
                <div key={apparatus} className="flex items-center justify-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <span className="font-medium text-gray-900 dark:text-white text-center">{apparatus}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Skills Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Foundational Skills */}
            <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Foundational Skills</h3>
                <p className="text-gray-600 dark:text-gray-300">Build strength and confidence with essential moves</p>
              </div>
              <div className="space-y-3">
                {["Shaping", "Forward Rolls", "Backward Rolls", "Handstands", "Bridges & Backbends", "Limbers", "Cartwheels"].map((skill) => (
                  <div key={skill} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <span className="font-medium text-gray-900 dark:text-white">{skill}</span>
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Intermediate Skills */}
            <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Intermediate Skills</h3>
                <p className="text-gray-600 dark:text-gray-300">Progress to more dynamic and challenging moves</p>
              </div>
              <div className="space-y-3">
                {["Dive Rolls", "Round-offs", "Front Walkovers", "Back Walkovers", "Front Handsprings", "Back Handsprings", "Aerials"].map((skill) => (
                  <div key={skill} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <span className="font-medium text-gray-900 dark:text-white">{skill}</span>
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Advanced Skills */}
            <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Advanced Skills</h3>
                <p className="text-gray-600 dark:text-gray-300">Master complex aerial and tumbling skills</p>
              </div>
              <div className="space-y-3">
                {["Front Tuck", "Back Tuck", "Front Layout", "Back Layout", "Fulls", "Double Fulls", "Double Backs"].map((skill) => (
                  <div key={skill} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <span className="font-medium text-gray-900 dark:text-white">{skill}</span>
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Progression Path */}
          <div className="mt-16 bg-black text-white rounded-lg p-8 text-center">
            <h3 className="text-xl font-bold mb-4">Progressive Skill Development</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Every athlete follows a structured path—gaining new skills, building confidence, and mastering advanced techniques.
            </p>
            <div className="flex justify-center items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-sm">Beginner</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-500"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-sm">Intermediate</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-500"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-sm">Advanced</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lesson Options Section */}
      <section className="py-16 lg:py-20 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Choose Your Training Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* 30-Min Private */}
            <Card className="p-6 bg-white dark:bg-gray-800 border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-3">30-Minute Private Session</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Focused one-on-one training to develop specific skills with personalized attention.</p>
              <ul className="text-sm mb-6 space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>Individual coaching</li>
                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>Targeted skill development</li>
                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>Perfect for beginners</li>
              </ul>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                onClick={handleStartBooking}
              >
                Book Session
              </Button>
            </Card>

            {/* 30-Min Semi-Private */}
            <Card className="p-6 bg-white dark:bg-gray-800 border-l-4 border-purple-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">30-Minute Semi-Private</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Train with a partner while receiving individualized coaching and skill progression.</p>
              <ul className="text-sm mb-6 space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>Partner training</li>
                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>Motivating environment</li>
                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>Individual skill focus</li>
              </ul>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                onClick={handleStartBooking}
              >
                Book Session
              </Button>
            </Card>

            {/* 1-Hour Private */}
            <Card className="p-6 bg-white dark:bg-gray-800 border-l-4 border-green-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-3">1-Hour Private Session</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Extended training for advanced skills and comprehensive technique development.</p>
              <ul className="text-sm mb-6 space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>Extended coaching time</li>
                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>Complex skill development</li>
                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>Competitive preparation</li>
              </ul>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                onClick={handleStartBooking}
              >
                Book Session
              </Button>
            </Card>

            {/* 1-Hour Semi-Private */}
            <Card className="p-6 bg-white dark:bg-gray-800 border-l-4 border-orange-500 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-orange-600 dark:text-orange-400 mb-3">1-Hour Semi-Private</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Extended partner training with comprehensive skill development and technique refinement.</p>
              <ul className="text-sm mb-6 space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3"></div>Full hour of training</li>
                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3"></div>Shared learning experience</li>
                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3"></div>Advanced skill focus</li>
              </ul>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                onClick={handleStartBooking}
              >
                Book Session
              </Button>
            </Card>

          </div>
        </div>
      </section>

      {/* Additional Training Section */}
      <section className="py-16 lg:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Specialized <span className="text-black">Training Programs</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Complementary training opportunities to enhance your gymnastics development
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-4">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Flexibility Training</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Improve range of motion and prevent injuries with targeted stretches and mobility work.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Strength Training</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Build the power and muscle control needed for advanced skills and explosive movements.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Agility Training</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Develop quickness, balance, and coordination through specialized drills and exercises.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Mental Training</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Learn breathing techniques and mental strategies to manage performance anxiety and improve focus.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Mental Block Support</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Overcome fear-based challenges with structured progressions and confidence-building techniques.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose <span className="text-black">{brand.platformName}</span>?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Professional coaching focused on building strength, confidence, and character through gymnastics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Safety First</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Professional spotting and safety protocols ensure secure skill development.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Professional Equipment</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  High-quality, age-appropriate equipment for every skill level and apparatus.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Progress Tracking</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Regular updates and insights on your athlete's skill development journey.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Flexible Scheduling</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Convenient 30 or 60-minute sessions to fit your family's schedule.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Positive Environment</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Building confidence and resilience through encouragement and achievement.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Character Building</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Developing not just athletic skills, but confidence and personal growth.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Start Your Gymnastics Journey Today
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join families who have seen their athletes grow stronger, more confident, and more skilled through professional gymnastics coaching.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-md font-semibold text-lg transition-colors duration-200"
                onClick={handleStartBooking}
              >
                <Calendar className="h-5 w-5 mr-2" />
                Book Your Session
              </Button>
              <Link href="/contact">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-black px-8 py-4 rounded-md font-semibold text-lg transition-colors duration-200"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Parent Authentication Modal for non-logged-in users */}
      <ParentIdentificationEnhanced
        isOpen={showParentIdentificationModal}
        onClose={() => setShowParentIdentificationModal(false)}
        onParentConfirmed={handleParentConfirmed}
      />

      <UnifiedBookingModal
        isOpen={showBookingModal || showParentModal}
        onClose={() => {
          setShowBookingModal(false);
          setShowParentModal(false);
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
