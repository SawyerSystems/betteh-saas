import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, Compass, Map, Shield, Lock, CreditCard, Bell, Video, Calendar, RefreshCcw, Sparkles, Trophy, UsersRound, LineChart, Star, MapPin, Zap, Target } from "lucide-react";

type Testimonial = { name: string; text: string; rating?: number };

// Lightweight analytics helper: pushes to window.dataLayer and logs
function track(event: string, payload: Record<string, any> = {}) {
  try {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event, page: "/features", ts: Date.now(), ...payload });
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, payload);
    }
  } catch {}
}

function useABVariant() {
  const [variant, setVariant] = useState<"A" | "B">("A");
  useEffect(() => {
    const url = new URL(window.location.href);
    const forced = url.searchParams.get("variant");
    if (forced === "A" || forced === "B") {
      setVariant(forced);
      localStorage.setItem("features-hero-variant", forced);
      track("features_variant_forced", { variant: forced });
      return;
    }
    const saved = localStorage.getItem("features-hero-variant") as "A" | "B" | null;
    if (saved === "A" || saved === "B") {
      setVariant(saved);
      return;
    }
    const assigned = Math.random() < 0.5 ? "A" : "B";
    setVariant(assigned);
    localStorage.setItem("features-hero-variant", assigned);
    track("features_variant_assigned", { variant: assigned });
  }, []);
  return variant;
}

function useScrollDepth() {
  const sent = useRef<{[k: string]: boolean}>({});
  useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      const height = h.scrollHeight - h.clientHeight;
      const pct = height > 0 ? Math.round((scrollTop / height) * 100) : 0;
      [25, 50, 75, 100].forEach((mark) => {
        if (pct >= mark && !sent.current[mark]) {
          sent.current[mark] = true;
          track("features_scroll_depth", { percent: mark });
        }
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

function useParallax() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handleScroll = () => setOffset(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return offset;
}

function useInView<T extends HTMLElement = HTMLDivElement>() {
  const [inView, setInView] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, inView] as const;
}function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return mousePosition;
}

export default function FeaturesPage() {
  const variant = useABVariant();
  const parallaxOffset = useParallax();
  const mousePosition = useMousePosition();
  useScrollDepth();

  const { data: siteContent } = useQuery({
    queryKey: ["/api/site-content"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/site-content");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const testimonials: Testimonial[] = useMemo(() => {
    const t: Testimonial[] = siteContent?.testimonials || [];
    if (t.length) return t;
    return [
      { name: "Mia R.", text: "Booking was easy and we saw progress fast. Will is wonderful with kids.", rating: 5 },
      { name: "Carlos S.", text: "Clear feedback and the videos help us practice at home.", rating: 5 },
      { name: "Priya K.", text: "Flexible rescheduling and great communication.", rating: 5 },
    ];
  }, [siteContent]);

  const stats = useMemo(() => {
    // Fallback snapshot with animated counters
    return {
      athletes: siteContent?.stats?.athletes || 240,
      rebookPct: siteContent?.stats?.rebookPct || 94,
      weeksToProgress: siteContent?.stats?.weeksToProgress || 3,
    };
  }, [siteContent]);

  const hero = variant === "A" ? {
    headline: "Level Up Your Child’s Training",
    sub: "Book fast. Track progress. Celebrate wins.",
    imageAlt: "Smiling young gymnast mid-air during a confident tumbling pass",
  image: "/assets/marketing/Marketing_Progress2.png",
  } : {
    headline: "Track Real Progress, Not Just Attendance",
    sub: "Book in minutes. Get videos and coach notes after.",
    imageAlt: "Phone mockup showing a clean parent portal with progress videos and badges",
    // Use a known-good image URL instead of an invalid placeholder so the hero always renders
  image: "/assets/marketing/Marketing_Progress2.png",
  };

  const chapters = [
    {
      key: "booking",
      icon: Map,
      title: "Easy Booking",
      tagline: "Choose your quest in seconds.",
      benefit: "Find a time that fits and lock it in—no phone tag.",
      bullets: ["Simple flow, mobile-first", "Instant confirmation", "Clear pricing"],
  img: "/assets/marketing/Marketing_Booking.png",
      alt: "Clean booking calendar UI on a phone screen",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      key: "athletes",
      icon: UsersRound,
      title: "Add Athletes",
      tagline: "Build your party.",
      benefit: "Set up one or more athletes so everyone can level up.",
      bullets: ["Siblings welcome", "Manage profiles", "Save preferences"],
  img: "/assets/marketing/Marketing_Athletes.png",
      alt: "Parent adding athlete profiles on a mobile portal",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      key: "tracking",
      icon: Calendar,
      title: "Track Bookings",
      tagline: "Your journey map.",
      benefit: "See what’s coming and what you’ve done at a glance.",
      bullets: ["Calendar overview", "Past session history", "One-tap details"],
  img: "/assets/marketing/Marketing_Portal.png",
      alt: "Parent viewing upcoming and past lessons on a phone",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      key: "progress",
      icon: Video,
      title: "Progress Reports & Lesson Videos",
      tagline: "Unlock achievements.",
      benefit: "Short videos and notes so you can see the wins and what’s next.",
      bullets: ["Coach notes", "Private video links", "Badges for milestones"],
  img: "/assets/marketing/Marketing_Progress1.png",
      alt: "Phone showing a progress video and badges earned",
      gradient: "from-orange-500 to-red-500",
    },
    {
      key: "updates",
      icon: Bell,
      title: "Text & Email Updates",
      tagline: "Guided by signals.",
      benefit: "Stay in the loop from booking to follow-up—no surprises.",
      bullets: ["Reminders & receipts", "Coach follow-ups", "No spam—ever"],
  img: "/assets/marketing/Marketing_Notifications.png",
      alt: "Phone notifications for lesson reminders and updates",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      key: "reschedule",
      icon: RefreshCcw,
      title: "Reschedule/Cancellations",
      tagline: "Plot a new route.",
      benefit: "Life happens. Move or cancel with clear, fair policies.",
      bullets: ["Self-serve changes", "Transparent windows", "No hidden fees"],
  img: "/assets/marketing/Marketing_Reschedule.png",
      alt: "Parent adjusting a lesson time on a phone calendar",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      key: "payments",
      icon: CreditCard,
      title: "Secure Payments",
      tagline: "Treasure chest, guarded.",
      benefit: "Stripe-powered checkout with industry‑standard security.",
      bullets: ["SSL everywhere", "No card storage here", "Instant receipts"],
  img: "/assets/marketing/Marketing_Checkout.png",
      alt: "Secure checkout screen on a mobile device",
      gradient: "from-emerald-500 to-teal-500",
    },
  ];

  useEffect(() => {
    track("features_view");
  }, []);

  const [showTour, setShowTour] = useState(false);

  return (
    <div className="min-h-screen theme-smooth bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden touch-pan-y pb-16 md:pb-0">
      <SEOHead
        title="Features | Gymnastics Private Lessons with Parent Portal & Progress Videos"
        description="Book fast, track progress, and celebrate wins. Parent-friendly portal with videos, badges, secure payments, and flexible rescheduling."
        canonicalUrl="https://www.coachwilltumbles.com/features"
        robots="index,follow"
        og={{
          "og:image": "https://www.coachwilltumbles.com/assets/CWT_Circle_LogoSPIN.png",
          "og:url": "https://www.coachwilltumbles.com/features",
        }}
        twitter={{
          "twitter:image": "https://www.coachwilltumbles.com/assets/CWT_Circle_LogoSPIN.png",
        }}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Features - Coach Will Tumbles",
          description: "Gymnastics lessons with a parent-friendly portal and progress videos.",
          url: "https://www.coachwilltumbles.com/features",
        }}
      />

      {/* Sticky CTA bar - desktop top after scroll; mobile bottom always visible with safe area */}
      <StickyCTAs onBook={() => track("features_cta_click", { where: "sticky" })} />

      {/* Hero */}
      <section
        className="relative overflow-hidden min-h-screen flex items-center"
        aria-labelledby="features-hero-title"
      >
        {/* Enhanced Adventure background with parallax */}
        <div 
          className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
          style={{
            transform: `translateY(${parallaxOffset * 0.3}px)`,
          }}
        />
        
        {/* Logo background element */}
        <div 
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-20 dark:opacity-25"
          style={{ transform: `translateY(${parallaxOffset * 0.03}px)` }}
        >
          <img
            src="/CWT_Circle_LogoSPIN.png"
            alt="Coach Will Tumbles Logo"
            className="object-contain animate-spin w-[900px] h-[900px] md:w-[1200px] md:h-[1200px] lg:w-[1500px] lg:h-[1500px]"
            style={{ animationDuration: '45s' }}
          />
        </div>
        
        {/* Animated floating orbs - mobile optimized */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div 
            className="absolute w-64 h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-[#D8BD2A]/20 to-transparent blur-3xl"
            style={{
              left: `${-200 + (typeof window !== 'undefined' && window.innerWidth > 768 ? mousePosition.x * 0.05 : 0)}px`,
              top: `${-200 + (typeof window !== 'undefined' && window.innerWidth > 768 ? mousePosition.y * 0.05 : 0)}px`,
              transform: `translateY(${typeof window !== 'undefined' && window.innerWidth > 768 ? parallaxOffset * 0.1 : 0}px)`,
            }}
          />
          <div 
            className="absolute w-80 h-80 md:w-[600px] md:h-[600px] rounded-full bg-gradient-to-tr from-[#0F0276]/15 to-transparent blur-3xl"
            style={{
              right: `${-300 + (typeof window !== 'undefined' && window.innerWidth > 768 ? mousePosition.x * -0.03 : 0)}px`,
              bottom: `${-300 + (typeof window !== 'undefined' && window.innerWidth > 768 ? mousePosition.y * -0.03 : 0)}px`,
              transform: `translateY(${typeof window !== 'undefined' && window.innerWidth > 768 ? parallaxOffset * 0.2 : 0}px)`,
            }}
          />
        </div>
        
        {/* Adventure map pattern overlay - mobile optimized */}
        <div 
          className="absolute inset-0 -z-10 opacity-10 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M30 0l30 30-30 30L0 30 30 0zm15 30L30 15 15 30l15 15 15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            transform: `translateY(${typeof window !== 'undefined' && window.innerWidth > 768 ? parallaxOffset * -0.1 : 0}px)`,
          }}
        />
        
        {/* Interactive compass - mobile friendly */}
        <div 
          className="absolute right-4 top-4 md:right-8 md:top-8 opacity-30 select-none pointer-events-none"
          style={{
            transform: `rotate(${typeof window !== 'undefined' && window.innerWidth > 768 ? parallaxOffset * 0.05 : 0}deg) scale(${1 + (typeof window !== 'undefined' && window.innerWidth > 768 ? Math.sin(Date.now() * 0.001) * 0.1 : 0)})`,
          }}
        >
          <Compass className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 text-[#0F0276] dark:text-[#D8BD2A] animate-pulse" />
        </div>
        
        {/* Floating trail markers - mobile optimized */}
        <div className="absolute inset-0 -z-10 select-none pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <MapPin 
              key={i}
              className="absolute h-3 w-3 md:h-4 md:w-4 text-[#D8BD2A] opacity-40 animate-bounce"
              style={{
                left: `${20 + i * 25}%`,
                top: `${30 + Math.sin(i) * 20}%`,
                animationDelay: `${i * 0.8}s`,
                transform: `translateY(${typeof window !== 'undefined' && window.innerWidth > 768 ? parallaxOffset * (0.02 + i * 0.01) : 0}px)`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 py-12 md:py-16 lg:py-24 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
          <div className="space-y-6 lg:space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-full bg-[#D8BD2A]/10 border border-[#D8BD2A]/20 backdrop-blur-sm">
                <Star className="h-4 w-4 text-[#D8BD2A]" />
                <span className="text-xs md:text-sm font-medium text-[#0F0276] dark:text-[#D8BD2A]">Start Your Adventure</span>
              </div>
              
              <h1 
                id="features-hero-title" 
                className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-[#D8BD2A] via-[#DC2626] to-[#D8BD2A] dark:from-[#D8BD2A] dark:via-[#DC2626] dark:to-[#D8BD2A] bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 leading-tight"
              >
                {hero.headline}
              </h1>
              
              <p className="text-lg md:text-xl lg:text-2xl text-slate-700 dark:text-slate-300 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                {hero.sub}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
              <Link href="/booking">
                <Button
                  onClick={() => track("features_cta_click", { where: "hero_primary" })}
                  className="w-full sm:w-auto group relative overflow-hidden bg-gradient-to-r from-[#0F0276] to-[#0F0276]/80 hover:from-[#0F0276]/90 hover:to-[#0F0276]/70 text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg font-bold rounded-xl shadow-2xl hover:shadow-[#0F0276]/25 transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D8BD2A]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Zap className="h-4 md:h-5 w-4 md:w-5" />
                    Book a Lesson
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#D8BD2A] to-[#D8BD2A]/80 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                </Button>
              </Link>
              
              <Button
                variant="outline"
                disabled
                // Temporarily muted: disable interaction and analytics
                onClick={(e) => e.preventDefault()}
                className="w-full sm:w-auto group relative overflow-hidden border-2 border-slate-300/40 dark:border-slate-700/40 px-6 md:px-8 py-4 md:py-6 text-base md:text-lg font-semibold rounded-xl backdrop-blur-sm bg-white/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 pointer-events-none opacity-60"
                aria-disabled="true"
              >
                <span className="flex items-center gap-2">
                  <Target className="h-5 w-5 opacity-70" />
                  See the Parent Portal (coming soon)
                </span>
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700">
              <TrustBadgeAnimated icon={Shield} label="Privacy-first" />
              <TrustBadgeAnimated icon={Lock} label="Secure payments" />
              <TrustBadgeAnimated icon={Sparkles} label="No spam" />
            </div>
          </div>
          
          <div className="relative animate-in fade-in slide-in-from-right duration-700 delay-300 order-first lg:order-last">
            <div className="relative group">
              <img
                src={hero.image}
                alt={hero.imageAlt}
                loading="eager"
                className="w-full h-64 sm:h-80 md:h-96 lg:h-auto rounded-2xl lg:rounded-3xl shadow-2xl ring-1 ring-black/5 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Dark mode overlay over hero image */}
              <div
                className="absolute inset-0 rounded-2xl lg:rounded-3xl bg-transparent dark:bg-black/40 pointer-events-none transform transition-transform duration-500 group-hover:scale-105"
                aria-hidden="true"
              />
              
              {/* Floating achievement badge - responsive positioning */}
              <div 
                className="absolute -bottom-3 -left-3 lg:-bottom-6 lg:-left-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl lg:rounded-2xl shadow-2xl p-3 lg:p-4 flex items-center gap-2 lg:gap-3 animate-bounce max-w-[200px] lg:max-w-none"
                style={{ animationDuration: '3s' }}
              >
                <div className="p-1.5 lg:p-2 bg-gradient-to-br from-[#D8BD2A] to-[#D8BD2A]/80 rounded-lg lg:rounded-xl">
                  <Trophy className="h-4 w-4 lg:h-6 lg:w-6 text-[#0F0276]" />
                </div>
                <div>
                  <div className="text-xs lg:text-sm font-bold text-slate-900 dark:text-white leading-tight">Track your athlete's journey</div>
                </div>
              </div>
              
              {/* Progress rings - responsive sizing */}
              <div className="absolute -top-2 -right-2 lg:-top-4 lg:-right-4 w-12 h-12 lg:w-16 lg:h-16">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="75, 100"
                    className="text-[#D8BD2A] animate-pulse"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#0F0276] dark:text-[#D8BD2A]">75%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Results snapshot with animated counters */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900/50 dark:via-slate-950/50 dark:to-slate-900/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D8BD2A]/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Proven Results</h2>
            <p className="text-slate-600 dark:text-slate-400">Real impact from our adventure-based approach</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <AnimatedStatCard label="Athletes coached" value={stats.athletes} suffix="+" icon={UsersRound} />
            <AnimatedStatCard label="Rebook rate" value={stats.rebookPct} suffix="%" icon={LineChart} />
            <AnimatedStatCard label="Avg. progress" value={stats.weeksToProgress} suffix=" weeks" icon={Sparkles} />
          </div>
        </div>
      </section>

      {/* Enhanced Chapters with interactive animations */}
      {/* Chapters section - mobile optimized */}
      <nav className="sr-only" aria-label="Feature chapters navigation">This page describes features in sequential chapters.</nav>
      <section className="py-12 md:py-16 lg:py-24 relative">
        <div className="container mx-auto px-4 space-y-16 md:space-y-20 lg:space-y-24">
          {chapters.map((c, idx) => (
            <ChapterCard key={c.key} chapter={c} index={idx} />
          ))}
        </div>
      </section>

      {/* Photos + Testimonials carousel */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Parents love the journey</h3>
            <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 mb-6">Real feedback from local families.</p>
            <div className="mt-6">
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                {/* Navigation buttons above cards */}
                <div className="flex justify-center mb-1">
                  <div className="flex items-center gap-1">
                    <CarouselPrevious className="relative left-0 top-0 h-8 w-8 md:h-10 md:w-10" />
                    <CarouselNext className="relative right-0 top-0 h-8 w-8 md:h-10 md:w-10" />
                  </div>
                </div>
                
                <CarouselContent className="-ml-2 md:-ml-4">
                  {testimonials.map((t, i) => (
                    <CarouselItem key={i} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/2 xl:basis-1/3">
                      <Card className="h-full">
                        <CardContent className="p-3 md:p-4">
                          <div className="flex items-center gap-1 mb-2" aria-label={`${t.rating || 5} star rating`}>
                            {Array.from({ length: t.rating || 5 }).map((_, idx) => (
                              <span key={idx} aria-hidden className="text-sm">⭐</span>
                            ))}
                          </div>
                          <p className="text-sm md:text-base leading-relaxed line-clamp-3">"{t.text}"</p>
                          <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">— {t.name}</p>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
            <div className="mt-6 flex items-center gap-4 text-slate-600 dark:text-slate-400">
              <TrustBadge icon={Lock} label="Secure payments" />
              <TrustBadge icon={Shield} label="Privacy-first" />
              <TrustBadge icon={CreditCard} label="No hidden fees" />
            </div>
          </div>
          {/* Photo grid temporarily hidden - placeholder images only */}
          {/* 
          <div className="grid grid-cols-2 gap-3">
            {[
              { src: "https://images.unsplash.com/photo-1550345332-09e3ac987658?q=80&w=800&auto=format&fit=crop", alt: "Coach spotting a gymnast on balance beam" },
              { src: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=800&auto=format&fit=crop", alt: "Athlete practicing a floor routine with a smile" },
              { src: "https://images.unsplash.com/photo-1549055244-3cb7899b7bed?q=80&w=800&auto=format&fit=crop", alt: "Parent and athlete reviewing progress on a phone" },
              { src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop", alt: "Gymnast mid-air during a tumbling pass" },
            ].map(({ src, alt }) => (
              <img key={src} src={src} alt={alt} loading="lazy" className="rounded-xl object-cover w-full h-44 md:h-56 shadow-md" />
            ))}
          </div>
          */}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold">Quick answers</h3>
          <dl className="mt-6 grid md:grid-cols-2 gap-6">
            <FAQ q="What if we need to cancel or reschedule?" a="You can adjust right in the portal. We’re flexible and policies are clear before you book." />
            <FAQ q="Is this safe for beginners?" a="Yes. Sessions are tailored to age and ability, with safety-first spotting and equipment." />
            <FAQ q="How are lesson videos shared?" a="Short, private links—only for you. Great for reviewing and celebrating progress." />
            <FAQ q="Are there texting fees?" a="No fees. You choose email, text, or both—no spam, just helpful updates." />
          </dl>
        </div>
      </section>

      {/* Closing banner */}
      <section className="py-12 md:py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-extrabold">Ready to start the journey?</h3>
          <p className="mt-2 text-slate-700 dark:text-slate-300">Love the first session or we’ll make it right.</p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link href="/booking#availability">
              <Button onClick={() => track("features_cta_click", { where: "closing_availability" })} className="px-6 py-6 text-lg font-bold">See Availability</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" onClick={() => track("features_cta_click", { where: "closing_question" })} className="px-6 py-6 text-lg font-semibold">Ask a Question</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Demo modal (simple accessible dialog) - mobile optimized */}
      {showTour && (
        <div role="dialog" aria-modal="true" id="portal-demo" className="fixed inset-0 z-50 grid place-items-center p-3 md:p-4" onClick={() => setShowTour(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-w-xs sm:max-w-md md:max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl ring-1 ring-black/10 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between p-3 md:p-4 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-base md:text-lg font-bold">Parent Portal Tour</h4>
              <button onClick={() => setShowTour(false)} className="px-2 py-1 md:px-3 md:py-1 text-sm rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">Close</button>
            </header>
            <div className="p-3 md:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {[
                  { icon: Calendar, label: "Booking" },
                  { icon: Video, label: "Videos" },
                  { icon: Sparkles, label: "Badges" },
                ].map(({ icon: I, label }) => (
                  <Card key={label} className="h-full">
                    <CardContent className="p-3 md:p-4">
                      <div className="h-32 md:h-48 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center relative overflow-hidden">
                        <I className="h-6 w-6 md:h-10 md:w-10 text-[#0F0276] dark:text-[#D8BD2A]" aria-hidden />
                        <div className="absolute bottom-1 md:bottom-2 left-1 md:left-2 right-1 md:right-2 bg-white/90 dark:bg-slate-900/80 rounded-md px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm shadow">
                          Clean UI mockup: {label}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function TrustBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4" aria-hidden /> <span className="text-sm">{label}</span>
    </div>
  );
}

function TrustBadgeAnimated({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="group flex items-center gap-3 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 hover:border-[#D8BD2A]/50 transition-all duration-300 hover:scale-105">
      <div className="p-1 rounded-full bg-[#D8BD2A]/10 group-hover:bg-[#D8BD2A]/20 transition-colors">
        <Icon className="h-4 w-4 text-[#0F0276] dark:text-[#D8BD2A]" aria-hidden />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm ring-1 ring-black/5 p-4 flex items-center justify-center gap-3">
      <Icon className="h-5 w-5 text-[#0F0276] dark:text-[#D8BD2A]" aria-hidden />
      <div>
        <div className="text-2xl font-extrabold leading-none">{value}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{label}</div>
      </div>
    </div>
  );
}

function AnimatedStatCard({ label, value, suffix, icon: Icon }: { label: string; value: number; suffix: string; icon: any }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (inView) {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          current = value;
          clearInterval(timer);
        }
        setDisplayValue(Math.floor(current));
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [inView, value]);
  
  return (
    <div 
      ref={ref}
      className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl lg:rounded-2xl shadow-xl ring-1 ring-black/5 p-4 md:p-6 lg:p-8 text-center hover:scale-105 transition-all duration-300"
    >
      <div className="relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#D8BD2A]/20 to-[#D8BD2A]/10 mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-[#0F0276] dark:text-[#D8BD2A]" aria-hidden />
        </div>
        <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-[#0F0276] to-[#0F0276]/70 dark:from-[#D8BD2A] dark:to-[#D8BD2A]/70 bg-clip-text text-transparent">
          {displayValue}{suffix}
        </div>
        <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 md:mt-2 font-medium">{label}</div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#D8BD2A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

function ChapterCard({ chapter, index }: { chapter: any; index: number }) {
  const [ref, inView] = useInView<HTMLElement>();
  const isEven = index % 2 === 0;
  
  return (
    <article 
      ref={ref}
      className={`grid gap-8 md:gap-12 lg:grid-cols-2 items-center ${inView ? 'animate-in fade-in slide-in-from-bottom-8 duration-700' : 'opacity-0'}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`order-first lg:order-first ${isEven ? "" : "lg:order-2"}`}>
        <div className="relative group">
          {/* Enhanced image with gradient overlay - responsive sizing */}
          <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl">
            <img 
              src={chapter.img} 
              alt={chapter.alt} 
              loading="lazy" 
              className="w-full lg:h-auto object-cover object-center transition-transform duration-700 group-hover:scale-105" 
            />
          </div>
          
          {/* Floating chapter number - responsive positioning */}
          <div className="absolute -top-2 -left-2 lg:-top-4 lg:-left-4 w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#D8BD2A] to-[#D8BD2A]/80 flex items-center justify-center shadow-2xl">
            <span className="text-lg lg:text-xl font-bold text-[#0F0276]">{index + 1}</span>
          </div>
          
          {/* Interactive device frame */}
          <div className="absolute inset-0 rounded-2xl lg:rounded-3xl ring-1 ring-white/20 shadow-2xl pointer-events-none" />
        </div>
      </div>
      
      <div className={`space-y-4 md:space-y-6 ${isEven ? "" : "lg:order-1"}`}>
        <div className="space-y-3 md:space-y-4">
          <div className="inline-flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-[#D8BD2A]/10 to-[#D8BD2A]/5 border border-[#D8BD2A]/20">
            <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-br ${chapter.gradient} shadow-lg`}>
              <chapter.icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <span className="uppercase tracking-wider text-xs md:text-sm font-bold text-[#0F0276] dark:text-[#D8BD2A]">{chapter.tagline}</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent leading-tight">
            {chapter.title}
          </h2>
          
          <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 leading-relaxed">{chapter.benefit}</p>
        </div>
        
        <ul className="space-y-2 md:space-y-3">
          {chapter.bullets.map((bullet: string, i: number) => (
            <li key={bullet} className="flex items-start gap-2 md:gap-3 group">
              <div className="mt-1 p-1 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-white" aria-hidden />
              </div>
              <span className="text-sm md:text-base text-slate-700 dark:text-slate-300">{bullet}</span>
            </li>
          ))}
        </ul>
        
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
          <Link href="/booking">
            <Button 
              onClick={() => track("features_cta_click", { where: `chapter_${chapter.key}` })}
              className={`w-full sm:w-auto group bg-gradient-to-r ${chapter.gradient} hover:shadow-lg transition-all duration-300 hover:scale-105 text-white font-bold px-4 py-3 md:px-6 md:py-3 text-sm md:text-base`}
            >
              Start Your Journey
              <Zap className="ml-2 h-3 w-3 md:h-4 md:w-4 group-hover:rotate-12 transition-transform duration-200" />
            </Button>
          </Link>
          
          {/* Hidden: "See how it works" buttons removed for cleaner UI */}
        </div>
      </div>
    </article>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow duration-300">
      <dt className="font-semibold text-sm md:text-base leading-tight mb-2">{q}</dt>
      <dd className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed">{a}</dd>
    </div>
  );
}

function StickyCTAs({ onBook }: { onBook?: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Desktop/top */}
      <div className={`hidden md:block sticky top-0 z-40 transition-all ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
        <div className="backdrop-blur bg-white/70 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-3">
            <Link href="/booking">
              <Button onClick={() => { onBook?.(); }} size="sm" className="btn-athletic-red text-white px-6 py-2">Book a Lesson</Button>
            </Link>
            <Link href="/booking#availability">
              <Button size="sm" variant="outline" className="px-6 py-2">View Availability</Button>
            </Link>
          </div>
        </div>
      </div>
      {/* Mobile/bottom - enhanced for touch */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 backdrop-blur bg-white/90 dark:bg-slate-900/80 p-3 safe-area-pb">
        <div className="flex items-center justify-center gap-3 max-w-sm mx-auto">
          <Link href="/booking#availability">
            <Button variant="outline" className="flex-1 py-3 text-sm font-medium">View Availability</Button>
          </Link>
          <Link href="/booking">
            <Button onClick={() => { onBook?.(); }} className="flex-1 btn-athletic-red text-white py-3 text-sm font-bold">Book Now</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
