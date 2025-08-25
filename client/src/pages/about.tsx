import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  CheckCircle,
  Cloud,
  Calendar,
  CreditCard,
  Users,
  Star,
  Trophy,
  Zap,
  Target,
  TrendingUp,
  Brain,
  Activity,
  Lock,
  Shield
} from "lucide-react";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import { PageLayout } from "@/components/layout";
import { useBrand } from "@/hooks/useBrand";

export default function About() {
  const brand = useBrand();
  
  // Fetch dynamic site content
  const { data: siteContent, isLoading } = useQuery({
    queryKey: ["/api/site-content"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/site-content");
      const data = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen theme-smooth bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout variant="default" className="pb-0">
      <SEOHead
        title={`About ${brand.platformName} | Purpose-Built Platform for Sports Coaches`}
        description={`Learn our mission, story, and the product principles behind ${brand.platformName} – the unified operating system helping sports coaches run, grow, and differentiate their business.`}
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/about` : '/about'}
        robots="index,follow"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: typeof window !== 'undefined' ? `${window.location.origin}/` : '/' },
              { "@type": "ListItem", position: 2, name: "About", item: typeof window !== 'undefined' ? `${window.location.origin}/about` : '/about' }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: `${brand.platformName} Platform`,
            url: typeof window !== 'undefined' ? `${window.location.origin}/about` : '/about',
            description: "Unified platform for sports coaches to manage operations, scheduling, payments, athlete development, and growth analytics.",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web Browser"
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: brand.platformName,
            url: typeof window !== 'undefined' ? `${window.location.origin}` : '/',
            description: "Software platform helping sports coaches deliver exceptional athlete development while running efficient, data‑driven businesses.",
            foundingDate: "2024",
            sameAs: [
              "https://www.linkedin.com/", // placeholder
              "https://twitter.com/" // placeholder
            ]
          }
        ]}
      />
      
      {/* Clean Hero (Betteh branding) */}
      <section id="overview" className="py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900/40 dark:via-gray-900/30 dark:to-black" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-black dark:text-white mb-6">
              The Operating System<br className="hidden md:block" /> for Sports Coaching
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed text-slate-700 dark:text-slate-300 mb-10 max-w-2xl">
              {brand.platformTagline}. We streamline scheduling, payments, athlete progress and business insight so coaches spend more time coaching—not juggling tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/pricing">
                <Button size="lg" className="gradient-primary text-white px-8 py-6 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <Zap className="h-5 w-5 mr-2" /> Start Free Trial
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="border-gray-500 text-gray-800 dark:text-white dark:border-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 px-8 py-6 font-semibold rounded-xl">
                  <Trophy className="h-5 w-5 mr-2" /> View Demo
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 mt-10 text-sm text-slate-600 dark:text-slate-300">
              {['Coach‑Led Design','Secure Architecture','Data Visibility','Frictionless Payments'].map(t => (
                <div key={t} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-black dark:text-white" /> <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Story (palette constrained) */}
      <section id="mission" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200/50 to-transparent dark:from-gray-800/30 pointer-events-none" />
        <div className="relative container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="athletic-title text-3xl md:text-5xl font-bold text-black dark:text-white mb-6">Our Mission</h2>
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 mb-6">
                Empower every coach – from independent specialists to multi‑instructor programs – with professional software that amplifies athlete development, operational efficiency, and sustainable business growth.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {[
                  { icon: <TrendingUp className="h-5 w-5" />, label: "Operational Clarity" },
                  { icon: <Brain className="h-5 w-5" />, label: "Insightful Data" },
                  { icon: <Activity className="h-5 w-5" />, label: "Athlete Progress" },
                  { icon: <CreditCard className="h-5 w-5" />, label: "Frictionless Revenue" }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl glass-surface glass-card">
                    <div className="p-2 rounded-lg bg-black/10 dark:bg-white/10 text-black dark:text-white">{item.icon}</div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-black dark:text-white tracking-wide mb-4">Why We Built {brand.platformName}</h3>
              <div className="space-y-5 text-slate-700 dark:text-slate-300">
                <p>Coaches were stitching together spreadsheets, messaging apps, payment links, and DIY video libraries. Administrative drag was stealing hours that should go to athlete development.</p>
                <p>We interviewed dozens of coaches across disciplines. Their pain points were consistent: no unified view of athlete progress, manual revenue tracking, high no‑show rates, and limited differentiation.</p>
                <p>{brand.platformName} consolidates these workflows into a cohesive system – purpose‑built, not generic scheduling software repurposed. We obsess over clarity, speed, and real‑world coaching outcomes.</p>
                <div className="mt-6 p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-2">PRODUCT PRINCIPLE</p>
                  <p className="font-semibold text-slate-900 dark:text-white">Every feature must either: increase coach time-on-sport, unlock measurable athlete progress, or accelerate revenue visibility.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Pillars */}
  <section id="pillars" className="py-20 bg-white dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">Core Product Pillars</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">The foundation guiding our roadmap and daily execution.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
        icon: <Cloud className="h-8 w-8 text-black dark:text-white" />,
                title: "Unified Operating System",
                copy: "Scheduling, payments, athlete data & progress in one real‑time surface—no context switching." 
              },
              {
        icon: <Brain className="h-8 w-8 text-gray-600 dark:text-gray-400" />,
                title: "Data to Decisions",
                copy: "Meaningful insights replace gut feel: capacity, retention, performance trends, revenue momentum." 
              },
              {
        icon: <Zap className="h-8 w-8 text-gray-800 dark:text-gray-300" />,
                title: "Automation That Empowers",
                copy: "Removes repetitive friction while keeping coaches in control of athlete experience." 
              }
            ].map(card => (
              <Card key={card.title} className="p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 glass-surface glass-card glass-gradient">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-white/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  {card.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">{card.title}</h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{card.copy}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
  <section id="values" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white mb-4">Values That Shape {brand.platformName}</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">How we build, ship, and support the platform.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: <Activity className="h-6 w-6" />, title: "Outcome First", body: "Features must tie to measurable improvement for coaches or athletes." },
              { icon: <Target className="h-6 w-6" />, title: "Focused Simplicity", body: "We reduce noise—clarity and speed beat feature bloat." },
              { icon: <Shield className="h-6 w-6" />, title: "Trust by Design", body: "Security, privacy, and data integrity are not add‑ons— they are defaults." },
              { icon: <Award className="h-6 w-6" />, title: "Craft & Reliability", body: "Stable execution, fast performance, and thoughtful UI details matter." }
            ].map(v => (
              <div key={v.title} className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm flex flex-col">
                <div className="mb-4 p-2 rounded-md bg-black/10 dark:bg-white/10 text-black dark:text-white w-fit">{v.icon}</div>
                <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">{v.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
  <section className="py-20 bg-gray-50 dark:bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white mb-4">
              Platform Features
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to run a successful coaching business - all in one powerful platform
            </p>
          </div>

          {/* Core Platform - Full Width */}
          <Card className="p-8 gradient-primary text-white shadow-2xl transition-all duration-300 mb-12 rounded-2xl hover:scale-105">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Cloud className="h-10 w-10 text-cyan-600" />
              </div>
              <h3 className="text-3xl font-bold mb-2">CLOUD-BASED PLATFORM</h3>
              <p className="text-white/90 text-lg">Access your business from anywhere - seamless management at your fingertips</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {["Online Scheduling", "Payment Processing", "Athlete Management", "Progress Tracking", "Business Analytics", "Mobile Access"].map((feature) => (
                <div key={feature} className="flex items-center justify-center p-4 rounded-lg bg-white/20 border border-white/40 hover:bg-white/30 transition-all duration-300">
                  <span className="font-semibold text-white text-center">{feature}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Business Management */}
            <Card className="p-8 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <TrendingUp className="h-8 w-8 text-white dark:text-black" />
                </div>
                <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Business Management</h3>
                <p className="text-gray-700 dark:text-gray-300">Streamline operations with comprehensive tools</p>
              </div>
              <div className="space-y-3">
                {["Client Database", "Lesson Scheduling", "Automated Billing", "Income Tracking", "Expense Management", "Tax Reporting", "Business Insights"].map((feature) => (
                  <div key={feature} className="flex items-center justify-between p-3 rounded-lg glass-surface">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{feature}</span>
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Athlete Development */}
            <Card className="p-8 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Target className="h-8 w-8 text-white dark:text-black" />
                </div>
                <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Athlete Development</h3>
                <p className="text-gray-700 dark:text-gray-300">Track progress and build stronger relationships</p>
              </div>
              <div className="space-y-3">
                {["Progress Tracking", "Skill Assessments", "Goal Setting", "Performance Analytics", "Video Analysis", "Parent Communication", "Achievement Badges"].map((feature) => (
                  <div key={feature} className="flex items-center justify-between p-3 rounded-lg glass-surface">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{feature}</span>
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Communication Tools */}
            <Card className="p-8 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="h-8 w-8 text-white dark:text-black" />
                </div>
                <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Communication Hub</h3>
                <p className="text-gray-700 dark:text-gray-300">Stay connected with athletes and families</p>
              </div>
              <div className="space-y-3">
                {["Messaging System", "Lesson Reminders", "Progress Reports", "Photo & Video Sharing", "Announcements", "Feedback Collection", "Event Notifications"].map((feature) => (
                  <div key={feature} className="flex items-center justify-between p-3 rounded-lg glass-surface">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{feature}</span>
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Platform Benefits Banner */}
          <div className="mt-16 gradient-primary rounded-2xl p-8 text-center text-white shadow-xl hover:scale-105 transition-all duration-300">
            <h3 className="text-2xl font-bold mb-4">Transform Your Coaching Business</h3>
            <p className="text-lg mb-6 max-w-2xl mx-auto">
              From struggling with spreadsheets to running a professional operation—Betteh SaaS elevates every aspect of your coaching business.
            </p>
            <div className="flex justify-center items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-sm">Setup</span>
              </div>
              <div className="w-8 h-0.5 bg-white/50"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-sm">Growth</span>
              </div>
              <div className="w-8 h-0.5 bg-white/50"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span className="text-sm">Success</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust */}
  <section id="trust" className="py-20 bg-white dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">Security & Trust</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">Your data and athlete information are protected by layered safeguards and modern best practices.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Shield className="h-7 w-7 text-gray-700 dark:text-gray-300" />, title: "Modern Infrastructure", body: "Hardened Postgres, least‑privilege policies, automated backups, and encrypted transport." },
              { icon: <Lock className="h-7 w-7 text-gray-600 dark:text-gray-400" />, title: "Privacy & Control", body: "Role‑based access, audit trails (in progress), and export portability—your data remains yours." },
              { icon: <CheckCircle className="h-7 w-7 text-gray-500 dark:text-gray-400" />, title: "Compliance Mindset", body: "Architecture aligned with GDPR principles; roadmap includes SOC 2 readiness work." }
            ].map(sec => (
              <Card key={sec.title} className="p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 glass-surface glass-card glass-gradient">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6 bg-white/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  {sec.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">{sec.title}</h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">{sec.body}</p>
              </Card>
            ))}
          </div>
          <div className="mt-12 p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="flex-1">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-2">Transparency</p>
              <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base">We publish security updates and planned enhancements. Have a question or need a DPA? Reach out—security@ (placeholder).</p>
            </div>
            <div className="flex gap-4 flex-wrap">
              {['Encryption', 'RLS Policies', 'Backups', 'Monitoring'].map(tag => (
                <span key={tag} className="px-3 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
  <section id="technology" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-gray-100 mb-4">Modern Architecture</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">Fast, resilient foundation enabling rapid iteration and dependable performance.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: 'Postgres Core', body: 'Structured, relational integrity with row‑level security.' },
              { title: 'Edge Delivery', body: 'Low latency experience across geographies (roadmap).' },
              { title: 'Real‑Time Events', body: 'Instant updates for schedule + athlete progression.' },
              { title: 'Analytics Layer', body: 'Actionable metrics surfaced in dashboards.' },
              { title: 'Media Pipeline', body: 'Optimized video & media storage workflows.' },
              { title: 'Extensible APIs', body: 'Future partner integrations & open endpoints.' },
              { title: 'Automation Engine', body: 'Trigger-based notifications & workflows.' },
              { title: 'Scalable UI', body: 'Component system optimized for velocity.' }
            ].map(t => (
              <div key={t.title} className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm">
                <h3 className="font-semibold text-sm mb-2 text-slate-900 dark:text-slate-100">{t.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
  <section id="roadmap" className="py-20 bg-white dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">Near‑Term Roadmap</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">What we are actively shaping next (subject to real coach feedback).</p>
          </div>
          <div className="space-y-8">
            {[
              { quarter: 'Q1', items: ['Advanced attendance & no‑show analytics', 'Automated retention dashboards', 'Refined multi‑coach permissions'] },
              { quarter: 'Q2', items: ['Video annotation layer', 'Parent / athlete mobile experience v1', 'Automated revenue projections'] },
              { quarter: 'Q3', items: ['Open API (read endpoints)', 'Custom reporting builder', 'Program benchmarking insights'] }
            ].map(group => (
              <div key={group.quarter} className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="px-3 py-1 rounded-md bg-gray-800 text-white dark:bg-gray-200 dark:text-black text-xs font-semibold tracking-wide">{group.quarter}</div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Planned Initiatives</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc ml-6">
                  {group.items.map(it => <li key={it}>{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-center text-slate-500 dark:text-slate-400">Roadmap reflects current intent; priorities adapt to user feedback & security considerations.</p>
        </div>
      </section>

      {/* Why Choose Betteh Section */}
  <section className="py-16 bg-white dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-6 text-center">Why Coaches Choose Betteh SaaS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Easy Setup */}
            <div className="gradient-card shadow-lg rounded-lg p-6 border-t-4 border-cyan-500">
              <h3 className="text-xl font-semibold gradient-text">Quick Setup – Ready in Minutes</h3>
              <p className="text-gray-700 dark:text-gray-300 mt-2">Get your coaching business online in under 30 minutes. No technical skills required—our intuitive setup wizard guides you through everything.</p>
              <ul className="text-sm mt-4 list-disc list-inside text-gray-600 dark:text-gray-300/90">
                <li>Guided onboarding process</li>
                <li>Pre-built templates for all sports</li>
                <li>Instant payment integration</li>
              </ul>
              <Link href="/pricing">
                <Button className="mt-4 px-4 py-2 gradient-primary text-white rounded-md shadow hover:scale-105 transform transition-all duration-300">
                  Start Now
                </Button>
              </Link>
            </div>

            {/* Professional Growth */}
            <div className="gradient-card shadow-lg rounded-lg p-6 border-t-4 border-sky-500">
              <h3 className="text-xl font-semibold gradient-text">Professional Growth – Scale Your Business</h3>
              <p className="text-gray-700 dark:text-gray-300 mt-2">Transform from part-time coaching to full-time business owner. Our tools help you manage more athletes, increase revenue, and build your reputation.</p>
              <ul className="text-sm mt-4 list-disc list-inside text-gray-600 dark:text-gray-300/90">
                <li>Automated scheduling & billing</li>
                <li>Professional client portal</li>
                <li>Business performance analytics</li>
              </ul>
              <Link href="/demo">
                <Button className="mt-4 px-4 py-2 gradient-primary text-white rounded-md shadow hover:scale-105 transform transition-all duration-300">
                  See Demo
                </Button>
              </Link>
            </div>

            {/* Time Freedom */}
            <div className="gradient-card shadow-lg rounded-lg p-6 border-t-4 border-emerald-500">
              <h3 className="text-xl font-semibold gradient-text">Time Freedom – Focus on Coaching</h3>
              <p className="text-gray-700 dark:text-gray-300 mt-2">Stop spending hours on admin work. Our automation handles scheduling, payments, reminders, and reporting so you can focus on what you love—coaching.</p>
              <ul className="text-sm mt-4 list-disc list-inside text-gray-600 dark:text-gray-300/90">
                <li>Automated lesson reminders</li>
                <li>Instant payment processing</li>
                <li>One-click progress reports</li>
              </ul>
              <Link href="/features">
                <Button className="mt-4 px-4 py-2 gradient-primary text-white rounded-md shadow hover:scale-105 transform transition-all duration-300">
                  Explore Features
                </Button>
              </Link>
            </div>

            {/* Athlete Success */}
            <div className="gradient-card shadow-lg rounded-lg p-6 border-t-4 border-teal-500">
              <h3 className="text-xl font-semibold gradient-text">Athlete Success – Better Outcomes</h3>
              <p className="text-gray-700 dark:text-gray-300 mt-2">Track every athlete's journey with detailed progress monitoring, goal setting, and performance analytics. Show parents real, measurable results.</p>
              <ul className="text-sm mt-4 list-disc list-inside text-gray-600 dark:text-gray-300/90">
                <li>Visual progress tracking</li>
                <li>Goal achievement system</li>
                <li>Parent communication tools</li>
              </ul>
              <Link href="/contact">
                <Button className="mt-4 px-4 py-2 gradient-primary text-white rounded-md shadow hover:scale-105 transform transition-all duration-300">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
  <section className="athletic-section bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="athletic-title text-3xl md:text-5xl font-bold text-black dark:text-gray-100 mb-4 animate-bounce-in">
              COACH <span className="text-gray-600 dark:text-gray-300">SUCCESS STORIES</span>
            </h2>
            <p className="coach-chant text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              REAL COACHES, REAL RESULTS - SEE HOW BETTEH SAAS TRANSFORMED THEIR BUSINESSES
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 glass-surface glass-card glass-gradient">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Revenue Growth</h3>
                <p className="text-slate-700 dark:text-slate-300">From side hustle to full-time business</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg glass-surface">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Average Revenue Increase</span>
                  <span className="text-gray-700 dark:text-gray-300 font-bold">+150%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg glass-surface">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Time Saved per Week</span>
                  <span className="text-gray-700 dark:text-gray-300 font-bold">12+ Hours</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg glass-surface">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Athlete Capacity</span>
                  <span className="text-gray-700 dark:text-gray-300 font-bold">+200%</span>
                </div>
              </div>
            </Card>

            <Card className="p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 glass-surface glass-card glass-gradient">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-gray-800" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Coach Satisfaction</h3>
                <p className="text-slate-700 dark:text-slate-300">What coaches say about Betteh</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg glass-surface">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Would Recommend</span>
                  <span className="text-gray-600 dark:text-gray-300 font-bold">98%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg glass-surface">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Setup Time</span>
                  <span className="text-gray-600 dark:text-gray-300 font-bold">Under 30min</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg glass-surface">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Customer Support Rating</span>
                  <span className="text-gray-600 dark:text-gray-300 font-bold">4.9/5</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Platform Benefits Banner */}
          <div className="mt-16 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 rounded-2xl p-8 text-center text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-4">Join the Betteh Community</h3>
            <p className="text-lg mb-6 max-w-2xl mx-auto">
              Over 100+ coaches trust Betteh SaaS to power their businesses. From beginner instructors to elite training facilities—we're here for your success.
            </p>
            <div className="flex justify-center items-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold">100+</div>
                <div className="text-sm">Active Coaches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">2000+</div>
                <div className="text-sm">Athletes Managed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50k+</div>
                <div className="text-sm">Lessons Scheduled</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coach Testimonials Section */}
      <section className="py-12 bg-gray-50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              What Coaches <span className="text-orange-600">Say</span>
            </h2>
          </div>

          {/* Featured Testimonial */}
          <div className="mb-16">
            <Card className="p-8 bg-gradient-to-br from-gray-200/30 to-gray-100/40 border-2 border-gray-200 dark:bg-gray-800/30 dark:border-gray-700 dark:ring-1 dark:ring-gray-700/40 glass-card">
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center space-x-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg text-gray-800 dark:text-gray-200 mb-6 italic">
                  "Betteh SaaS completely transformed my coaching business. I went from managing everything on paper to having a professional platform that handles scheduling, payments, and progress tracking automatically. My revenue doubled in the first year!"
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    J
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                      Jennifer Martinez
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">Gymnastics Coach, California</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Regular Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  "The automated scheduling and payment processing saved me 15+ hours per week. Now I can focus on coaching instead of admin work."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-black font-bold">
                    M
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Mike Thompson</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">Tennis Coach</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  "The progress tracking features help me show parents exactly how their kids are improving. It's been a game-changer for client retention."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Sarah Kim</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">Swimming Coach</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  "Setup was incredibly easy, and the customer support team helped me migrate all my existing data. Professional platform at an affordable price."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                    D
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">David Rodriguez</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">Soccer Coach</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

  {/* Call to Action Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500"></div>
        
        {/* Animated floating elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white/10 rounded-full animate-bounce-gentle"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/15 rounded-full animate-pulse-slow"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24 text-center">
          <h2 className="athletic-title text-3xl md:text-5xl font-bold text-white mb-6 animate-bounce-in">
            Ready to Transform Your <span className="text-gray-300">Coaching Business</span>?
          </h2>
          <p className="coach-chant text-xl text-white/90 mb-8 max-w-2xl mx-auto animate-slide-up">
            JOIN 100+ COACHES WHO'VE ALREADY REVOLUTIONIZED THEIR BUSINESS WITH BETTEH SAAS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button 
                size="lg"
                className="gradient-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transform transition-all duration-300 shadow-2xl"
              >
                <Zap className="h-5 w-5 mr-2" />
                START FREE TRIAL
              </Button>
            </Link>
            <Link href="/demo">
              <Button 
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white/30 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transform transition-all duration-300 shadow-2xl backdrop-blur-sm glass-button"
              >
                <Calendar className="h-5 w-5 mr-2" />
                BOOK DEMO
              </Button>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 flex justify-center items-center space-x-8 text-white/80">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Secure & Reliable</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">30-Day Free Trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span className="text-sm">24/7 Support</span>
            </div>
          </div>
        </div>
      </section>
  </PageLayout>
  );
}
