import { Navigation } from "@/components/navigation";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePerformanceMonitor } from "@/utils/performance";
import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ConsentProvider } from "@/contexts/ConsentManager";
import { BrandProvider } from "@/contexts/BrandContext";
// Simple loading component
const PageLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-4">
      <img 
        src="/assets/betteh_logo_black_font.png" 
        alt="Loading" 
        className="animate-spin h-12 w-12 mx-auto" 
      />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Lazy load all page components for better performance
const Home = lazy(() => import("@/pages/home-modern"));
const About = lazy(() => import("@/pages/about"));
const Booking = lazy(() => import("@/pages/booking"));
const Blog = lazy(() => import("@/pages/blog"));
const Tips = lazy(() => import("@/pages/tips"));
const Contact = lazy(() => import("@/pages/contact"));
const Features = lazy(() => import("@/pages/features"));
const TestScreenshots = lazy(() => import("@/pages/test-screenshots"));
const Admin = lazy(() => import("@/pages/admin"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const ProgressShare = lazy(() => import("@/pages/progress-share"));
const ProgressAthlete = lazy(() => import("@/pages/progress-athlete"));
const ParentLogin = lazy(() => import("@/pages/parent/login"));
const ParentRegister = lazy(() => import("@/pages/parent-register"));
const ParentSetupSuccess = lazy(() => import("@/pages/parent-setup-success"));
const VerifyEmail = lazy(() => import("@/pages/verify-email"));
const Checkout = lazy(() => import("@/pages/checkout"));
const BlogPost = lazy(() => import("@/pages/blog-post"));
const TipDetail = lazy(() => import("@/pages/tip-detail"));
const BookingSuccess = lazy(() => import("@/pages/booking-success").catch(() => ({
  default: () => <div className="p-8 text-center">Booking Success page failed to load</div>
})));
const ParentDashboard = lazy(() => import("@/pages/parent-dashboard"));
const NotFound = lazy(() => import("@/pages/not-found"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const PrivacyRequests = lazy(() => import("@/pages/privacy-requests"));

function Router() {
  const [location] = useLocation();
  const { startMeasure } = usePerformanceMonitor('Router');

  // Scroll reset on page navigation with performance optimization
  useEffect(() => {
    const measure = startMeasure();
    
    // Smooth scroll reset for better UX
    window.scrollTo({ 
      top: 0, 
      left: 0, 
      behavior: 'instant' 
    });
    
    measure();
  }, [location, startMeasure]);

  return (
    <>
      <Navigation />
      <Suspense fallback={<PageLoadingSpinner />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/index.html" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/booking" component={Booking} />
          <Route path="/booking/index.html" component={Booking} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/index.html" component={Blog} />
          <Route path="/blog/:id" component={BlogPost} />
          <Route path="/tips" component={Tips} />
          <Route path="/tips/:id" component={TipDetail} />
          <Route path="/features" component={Features} />
          <Route path="/test-screenshots" component={TestScreenshots} />
          <Route path="/contact" component={Contact} />
          <Route path="/contact/index.html" component={Contact} />
          <Route path="/admin" component={Admin} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/progress/:token" component={ProgressShare} />
          <Route path="/progress/athlete/:athleteId" component={ProgressAthlete} />
          <Route path="/parent/login" component={ParentLogin} />
          <Route path="/parent/forgot-password" component={lazy(() => import("@/pages/parent/forgot-password"))} />
          <Route path="/parent/confirm-booking" component={lazy(() => import("@/pages/parent/confirm-booking"))} />
          <Route path="/parent/set-password" component={lazy(() => import("@/pages/parent/set-password"))} />
          <Route path="/parent-register" component={ParentRegister} />
          <Route path="/parent-setup-success" component={ParentSetupSuccess} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/parent-dashboard" component={ParentDashboard} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/booking-success" component={BookingSuccess} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/privacy-requests" component={PrivacyRequests} />

          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  // Register service worker for caching and performance - only in production
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('SW registered: ', registration);
      }).catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrandProvider>
          <ConsentProvider>
            <div className="app-root">
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </div>
          </ConsentProvider>
        </BrandProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
