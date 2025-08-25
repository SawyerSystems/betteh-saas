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
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Dumbbell,
  Play,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Video,
  Zap,
  BarChart3,
  MessageSquare,
  Globe,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";

export default function HomeModern() {
  const [showParentModal, setShowParentModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showParentIdentificationModal, setShowParentIdentificationModal] = useState(false);
  const [parentData, setParentData] = useState<Parent | null>(null);
  const [selectedAthletes, setSelectedAthletes] = useState<Athlete[]>([]);
  const [isNewParent, setIsNewParent] = useState(false);
  const { getLessonPrice } = useStripePricing();

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

  const handleStartBooking = () => {
    if (parentAuth?.loggedIn && parentInfoLoading) {
      return;
    }
    
    if (parentAuth?.loggedIn) {
      if (parentInfo && !parentInfoError) {
        setParentData(parentInfo);
        setSelectedAthletes([]);
        setIsNewParent(false);
        setShowBookingModal(true);
      } else {
        setParentData(null);
        setSelectedAthletes([]);
        setIsNewParent(false);
        setShowBookingModal(true);
      }
    } else {
      setShowParentIdentificationModal(true);
    }
  };

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
        title="Betteh | Professional Gymnastics Coaching Platform"
        description="AI-powered gymnastics coaching platform for managing lessons, bookings, and athlete development. Better coaching, better results."
        canonicalUrl="https://www.betteh.com/"
        robots="index,follow"
      />

      {/* Hero Section - VEED.io inspired */}
      <section className="relative pt-16 pb-32 px-4 overflow-hidden">
        {/* Background gradient with smooth transition */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-800 dark:to-transparent"></div>
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-500"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            {/* Main headline - VEED.io style */}
                        <h1 className="font-sunborn text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Transform your coaching with{' '}
              <span className="bg-gradient-to-r from-blue-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                intelligent management
              </span>
            </h1>
            
            <p className="font-sunborn text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Streamline your private lesson bookings, manage athlete progress, and grow your coaching business with our all-in-one platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button 
                size="lg"
                className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-sunborn font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg"
                onClick={handleStartBooking}
              >
                Start your free trial
              </Button>
              <p className="font-sunborn text-sm text-gray-500 mt-4">* No credit card required</p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {[
                { icon: <Calendar className="w-4 h-4" />, text: "Smart Scheduling" },
                { icon: <BarChart3 className="w-4 h-4" />, text: "Progress Tracking" },
                { icon: <Video className="w-4 h-4" />, text: "Video Analysis" },
                { icon: <Brain className="w-4 h-4" />, text: "AI Coaching" },
                { icon: <Users className="w-4 h-4" />, text: "Team Management" },
                { icon: <Trophy className="w-4 h-4" />, text: "Competition Prep" },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md border border-gray-200 dark:border-gray-700"
                >
                  {feature.icon}
                  <span className="font-sunborn text-sm font-medium text-gray-700 dark:text-gray-300">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Demo video placeholder */}
            <div className="relative mx-auto max-w-4xl">
              <div className="relative bg-gradient-to-r from-blue-100 to-green-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 shadow-2xl">
                <div className="aspect-video bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-600">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <p className="font-sunborn text-lg text-gray-600 dark:text-gray-400">
                      Watch how Betteh transforms gymnastics coaching
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Everything You Need Section */}
      <section className="relative py-32 px-4 bg-gradient-to-b from-gray-50 via-gray-50 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
        {/* Smooth transition overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-800"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-gray-900 dark:to-transparent"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-sunborn text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              EVERYTHING YOU NEED,
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Smart scheduling that works for you
              </span>
            </h2>
            <p className="font-sunborn text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Manage bookings, track athlete progress, and grow your coaching business, directly in your browser.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="w-8 h-8" />,
                title: "Smart Scheduling",
                description: "Automated booking system with availability management.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Brain className="w-8 h-8" />,
                title: "Business Analytics",
                description: "Track revenue, popular lesson times, and growth trends.",
                color: "from-green-500 to-teal-500"
              },
              {
                icon: <Video className="w-8 h-8" />,
                title: "Video Analysis",
                description: "Easily record and analyze technique. Review and share with athletes.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Progress Tracking",
                description: "Select from 100+ skills and track athlete development.",
                color: "from-orange-500 to-red-500"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Client Management",
                description: "Organize athletes, track attendance, and manage waitlists.",
                color: "from-teal-500 to-blue-500"
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "Parent Portal",
                description: "Keep parents engaged with powerful communication tools.",
                color: "from-blue-500 to-cyan-500"
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-900">
                <CardContent className="p-0">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-sunborn text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="font-sunborn text-gray-600 dark:text-gray-400 mb-4">
                    {feature.description}
                  </p>
                  <Link href="/features">
                    <Button variant="ghost" className="p-0 h-auto font-sunborn text-blue-600 hover:text-blue-700">
                      Explore <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI-Powered Section */}
      <section className="relative py-32 px-4 bg-gradient-to-b from-white via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-800">
        {/* Smooth transition overlays */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent dark:from-gray-900 dark:to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-800 dark:to-transparent"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-sunborn text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                AI POWERED
              </span>{" "}
              COACHING
            </h2>
            <p className="font-sunborn text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
              Make your coaching more engaging. Track progress, analyze technique and 
              create personalized training plans with our AI Coaching Assistant.
            </p>
          </div>

          {/* AI Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              "Skill Analysis",
              "Progress Tracking", 
              "Technique Breakdown",
              "Training Plans",
              "Performance Insights",
              "Competition Prep",
              "Injury Prevention",
              "Goal Setting"
            ].map((feature, index) => (
              <div key={index} className="text-center p-4">
                <div className="bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 rounded-lg p-3 inline-block mb-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-sunborn font-medium text-gray-900 dark:text-white">
                  {feature}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-4 rounded-xl font-sunborn font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg"
              onClick={handleStartBooking}
            >
              Try all features
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="relative py-32 px-4 bg-gradient-to-b from-gray-50 via-blue-50/30 to-white dark:from-gray-800 dark:via-blue-900/20 dark:to-gray-900">
        {/* Smooth transition overlays */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-800 dark:to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-gray-900 dark:to-transparent"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-sunborn text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              LOVED BY COACHES.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                TRUSTED BY ATHLETES
              </span>
            </h2>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { number: "10K+", label: "Active Athletes" },
              { number: "500+", label: "Gymnastics Coaches" },
              { number: "98%", label: "Parent Satisfaction" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-sunborn text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.number}
                </div>
                <div className="font-sunborn text-lg text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote: "Betteh has been game-changing. It's allowed us to create structured training programs and track athlete progress with ease.",
                author: "Sarah Johnson",
                role: "Head Coach, Elite Gymnastics Academy"
              },
              {
                quote: "I love using Betteh. The progress tracking is the most accurate I've seen. It's helped take my coaching to the next level.",
                author: "Mike Chen",
                role: "Owner, Champions Gymnastics"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-8 border-0 shadow-lg bg-white dark:bg-gray-900">
                <CardContent className="p-0">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="font-sunborn text-lg text-gray-700 dark:text-gray-300 mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-sunborn font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </div>
                    <div className="font-sunborn text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="relative py-32 px-4 bg-white dark:bg-black">
        <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="font-sunborn text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Choose your
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              business plan
            </span>
          </h2>
          <p className="font-sunborn text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            From solo coaches to large academies, we have the perfect plan to streamline your gymnastics coaching business.
          </p>
        </div>          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="mb-8">
                <h3 className="font-sunborn text-2xl font-bold text-gray-900 dark:text-white mb-2">Solo Coach</h3>
                <p className="font-sunborn text-gray-600 dark:text-gray-300 mb-6">Perfect for independent coaches</p>
                <div className="flex items-baseline">
                  <span className="font-sunborn text-4xl font-bold text-gray-900 dark:text-white">$29</span>
                  <span className="font-sunborn text-gray-600 dark:text-gray-300 ml-2">/month</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center font-sunborn text-gray-700 dark:text-gray-300">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Up to 50 bookings/month
                </li>
                <li className="flex items-center font-sunborn text-gray-700 dark:text-gray-300">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Online booking system
                </li>
                <li className="flex items-center font-sunborn text-gray-700 dark:text-gray-300">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Payment processing
                </li>
                <li className="flex items-center font-sunborn text-gray-700 dark:text-gray-300">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Basic email support
                </li>
              </ul>
              
              <Button 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-sunborn font-semibold py-3 rounded-lg transition-colors duration-200"
                onClick={handleStartBooking}
              >
                Start free trial
              </Button>
            </div>

            {/* Pro Plan - Featured */}
            <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 transform">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-black px-4 py-1 rounded-full font-sunborn font-semibold text-sm">
                  Most Popular
                </span>
              </div>
              
              <div className="mb-8">
                <h3 className="font-sunborn text-2xl font-bold text-white mb-2">Pro Coach</h3>
                <p className="font-sunborn text-blue-100 mb-6">For growing coaching businesses</p>
                <div className="flex items-baseline">
                  <span className="font-sunborn text-4xl font-bold text-white">$69</span>
                  <span className="font-sunborn text-blue-100 ml-2">/month</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center font-sunborn text-white">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Unlimited bookings
                </li>
                <li className="flex items-center font-sunborn text-white">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Advanced scheduling tools
                </li>
                <li className="flex items-center font-sunborn text-white">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Automated reminders
                </li>
                <li className="flex items-center font-sunborn text-white">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Athlete progress tracking
                </li>
                <li className="flex items-center font-sunborn text-white">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Priority support
                </li>
              </ul>
              
              <Button 
                className="w-full bg-white hover:bg-gray-100 text-blue-600 font-sunborn font-semibold py-3 rounded-lg transition-colors duration-200"
                onClick={handleStartBooking}
              >
                Start free trial
              </Button>
            </div>

            {/* Elite Plan */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="mb-8">
                <h3 className="font-sunborn text-2xl font-bold text-gray-900 dark:text-white mb-2">Academy</h3>
                <p className="font-sunborn text-gray-600 dark:text-gray-300 mb-6">For large gymnastics academies</p>
                <div className="flex items-baseline">
                  <span className="font-sunborn text-4xl font-bold text-gray-900 dark:text-white">$199</span>
                  <span className="font-sunborn text-gray-600 dark:text-gray-300 ml-2">/month</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center font-sunborn text-gray-700 dark:text-gray-300">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Everything in Pro Coach
                </li>
                <li className="flex items-center font-sunborn text-gray-700 dark:text-gray-300">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Multi-coach management
                </li>
                <li className="flex items-center font-sunborn text-gray-700 dark:text-gray-300">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Revenue reporting & analytics
                </li>
                <li className="flex items-center font-sunborn text-gray-700 dark:text-gray-300">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Dedicated account manager
                </li>
              </ul>
              
              <Button 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-sunborn font-semibold py-3 rounded-lg transition-colors duration-200"
                onClick={handleStartBooking}
              >
                Contact sales
              </Button>
            </div>
          </div>

          <div className="text-center mt-16">
            <p className="font-sunborn text-gray-600 dark:text-gray-300 mb-4">
              All plans include our 30-day money-back guarantee
            </p>
            <div className="flex justify-center items-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-sunborn">No setup fees</span>
              <span className="font-sunborn">Cancel anytime</span>
              <span className="font-sunborn">14-day free trial</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 px-4 bg-gradient-to-b from-white via-gray-50/50 to-gray-100 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-800">
        {/* Smooth transition overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent dark:from-gray-900 dark:to-transparent"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="font-sunborn text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Business management so good
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              you'll feel like a pro
            </span>
          </h2>
          
          <Button 
            size="lg"
            className="bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-sunborn font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg mt-8"
            onClick={handleStartBooking}
          >
            Start your free trial today
          </Button>
          <p className="font-sunborn text-sm text-gray-500 mt-4">* No credit card required</p>
        </div>
      </section>

      {/* Modals */}
      {showParentIdentificationModal && (
        <ParentIdentificationEnhanced
          isOpen={showParentIdentificationModal}
          onClose={() => setShowParentIdentificationModal(false)}
          onParentConfirmed={handleParentConfirmed}
        />
      )}

      {showBookingModal && (
        <UnifiedBookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          parentData={parentData}
          selectedAthletes={selectedAthletes}
          isNewParent={isNewParent}
        />
      )}

      <Footer />
    </div>
  );
}
